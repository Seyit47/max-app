import { useEffect, type Dispatch } from 'react'
import type { GreenApiClient } from '../api/greenApi'
import type { AccountSettingsResponse } from '../api/types'
import type { Account, Action } from '../state/reducer'

const RETRY_MS = 15_000

export function toAccount(res: AccountSettingsResponse): Account | null {
  const phone = (res.phone ?? '').replace(/\D+/g, '')
  const chatId = String(res.chatId ?? '')
  return phone || chatId ? { phone, chatId } : null
}

/**
 * Loads the signed-in MAX account (own phone and chatId) when it isn't known yet: sessions
 * restored from storage, or a login where the lookup failed. Retries quietly until it succeeds.
 */
export function useAccount(client: GreenApiClient | null, known: boolean, dispatch: Dispatch<Action>) {
  useEffect(() => {
    if (!client || known) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    async function load() {
      try {
        const me = toAccount(await client!.getAccountSettings(controller.signal))
        if (me) {
          dispatch({ type: 'ACCOUNT', me })
          return
        }
      } catch {
        if (controller.signal.aborted) return
      }
      timer = setTimeout(load, RETRY_MS)
    }

    void load()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [client, known, dispatch])
}
