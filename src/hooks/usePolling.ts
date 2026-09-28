import { useEffect, type Dispatch } from 'react'
import { GreenApiError, type GreenApiClient } from '../api/greenApi'
import { parseNotification, parseStatus } from '../state/parseNotification'
import type { Action } from '../state/reducer'

const RECEIVE_TIMEOUT_S = 20
const BACKOFF_START_MS = 3_000
const BACKOFF_MAX_MS = 30_000

export const WEBHOOK_CONFLICT_MESSAGE =
  'This instance has a webhook URL set, so notifications cannot be polled. ' +
  'Clear the webhook URL in the GREEN-API console (console.green-api.com) and wait about 1 minute.'

/**
 * Long-polls the GREEN-API notification queue while a client exists.
 * Every received notification is acked, even ignored ones, or the queue would stall on it.
 */
export function usePolling(client: GreenApiClient | null, dispatch: Dispatch<Action>) {
  useEffect(() => {
    if (!client) return
    const controller = new AbortController()
    const { signal } = controller

    async function loop() {
      let backoff = 0
      dispatch({ type: 'CONNECTION', status: 'connecting' })

      while (!signal.aborted) {
        try {
          const notification = await client!.receiveNotification(RECEIVE_TIMEOUT_S, signal)
          dispatch({ type: 'CONNECTION', status: 'online' })
          backoff = 0
          if (!notification) continue

          try {
            const message = parseNotification(notification.body)
            if (message) dispatch({ type: 'RECEIVE', message })
            const update = parseStatus(notification.body)
            if (update) dispatch({ type: 'STATUS', update })
          } finally {
            // If this throws, the outer catch backs off and the notification is redelivered;
            // the reducer dedupes it by id.
            await client!.deleteNotification(notification.receiptId, signal)
          }
        } catch (err) {
          if (signal.aborted) return

          if (err instanceof GreenApiError && err.isAuth) {
            dispatch({
              type: 'LOGOUT',
              reason: 'GREEN-API rejected the credentials (HTTP ' + err.status + '). Please sign in again.',
            })
            return
          }

          const error =
            err instanceof GreenApiError && err.isWebhookConflict
              ? WEBHOOK_CONFLICT_MESSAGE
              : err instanceof Error
                ? err.message
                : String(err)
          dispatch({ type: 'CONNECTION', status: 'reconnecting', error })

          backoff = backoff ? Math.min(backoff * 2, BACKOFF_MAX_MS) : BACKOFF_START_MS
          await sleep(backoff, signal)
        }
      }
    }

    void loop()
    return () => controller.abort()
  }, [client, dispatch])
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms)
    signal.addEventListener('abort', done, { once: true })
    function done() {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
  })
}
