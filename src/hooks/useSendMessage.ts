import { useCallback } from 'react'
import { useClient, useStore } from '../state/store'

/** Optimistic send: show the message immediately, then swap in the server id or mark it failed. */
export function useSendMessage() {
  const { dispatch } = useStore()
  const client = useClient()

  const send = useCallback(
    async (chatId: string, text: string, retryId?: string) => {
      const tempId = retryId ?? crypto.randomUUID()
      dispatch({ type: 'SEND_START', chatId, tempId, text, timestamp: Date.now() })
      try {
        const { idMessage } = await client.sendMessage(chatId, text)
        dispatch({ type: 'SEND_OK', chatId, tempId, idMessage })
      } catch {
        dispatch({ type: 'SEND_FAIL', chatId, tempId })
      }
    },
    [client, dispatch],
  )

  return send
}
