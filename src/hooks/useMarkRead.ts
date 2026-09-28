import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { GreenApiClient } from '../api/greenApi'

function subscribe(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

function useDocumentVisible(): boolean {
  return useSyncExternalStore(subscribe, () => document.visibilityState === 'visible')
}

/**
 * Tells MAX the open chat has been read up to its latest incoming message, so the sender sees
 * "read". Waits while the tab is hidden: a chat left open in a background tab isn't read.
 */
export function useMarkRead(client: GreenApiClient, chatId: string, lastIncomingId: string | undefined) {
  const visible = useDocumentVisible()
  // Last id reported per chat, so re-renders and switching back don't repeat the call.
  const reported = useRef(new Map<string, string>())

  useEffect(() => {
    if (!visible || !lastIncomingId || reported.current.get(chatId) === lastIncomingId) return
    reported.current.set(chatId, lastIncomingId)
    client.readChat(chatId, lastIncomingId).catch(() => {
      // Let the next change (new message, tab shown, chat reopened) try again.
      if (reported.current.get(chatId) === lastIncomingId) reported.current.delete(chatId)
    })
  }, [client, chatId, lastIncomingId, visible])
}
