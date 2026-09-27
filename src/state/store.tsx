/* eslint-disable react-refresh/only-export-components -- provider and its hooks belong together */
import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { createClient, type GreenApiClient } from '../api/greenApi'
import { initialState, reducer, type Action, type Message, type State } from './reducer'

const STORAGE_KEY = 'max-web-chat:v1'

type Persisted = Pick<State, 'credentials' | 'me' | 'chats' | 'messages' | 'activeChatId'>

function loadState(): State {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const saved = JSON.parse(raw) as Partial<Persisted>
    if (!saved.credentials?.idInstance || !saved.credentials.apiTokenInstance) return initialState

    // A reload interrupts in-flight sends; surface them as failed so they can be retried.
    const messages: Record<string, Message[]> = {}
    for (const [chatId, list] of Object.entries(saved.messages ?? {})) {
      messages[chatId] = list.map((m) => (m.status === 'sending' ? { ...m, status: 'failed' } : m))
    }

    return {
      ...initialState,
      credentials: saved.credentials,
      me: saved.me ?? null,
      chats: saved.chats ?? {},
      messages,
      activeChatId: saved.activeChatId && saved.chats?.[saved.activeChatId] ? saved.activeChatId : null,
    }
  } catch {
    return initialState
  }
}

function saveState(state: State) {
  try {
    if (!state.credentials) {
      sessionStorage.removeItem(STORAGE_KEY)
      return
    }
    const data: Persisted = {
      credentials: state.credentials,
      me: state.me,
      chats: state.chats,
      messages: state.messages,
      activeChatId: state.activeChatId,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or blocked: the session still works, it just won't survive a reload.
  }
}

interface StoreValue {
  state: State
  dispatch: Dispatch<Action>
  client: GreenApiClient | null
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const { credentials } = state
  const client = useMemo(() => (credentials ? createClient(credentials) : null), [credentials])

  const value = useMemo(() => ({ state, dispatch, client }), [state, client])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

/** Client for components that only render while logged in. */
export function useClient(): GreenApiClient {
  const { client } = useStore()
  if (!client) throw new Error('useClient called while logged out')
  return client
}
