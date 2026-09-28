import type { Credentials } from '../api/types'

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: string
  chatId: string
  text: string
  /** Unix ms */
  timestamp: number
  direction: 'in' | 'out'
  /** Outgoing only */
  status?: MessageStatus
  /** Why a sent message failed, when MAX said so (e.g. "not registered in MAX"). */
  error?: string
  senderName?: string
}

/** From an outgoingMessageStatus notification. */
export interface StatusUpdate {
  chatId: string
  idMessage: string
  status: 'delivered' | 'read' | 'failed'
  error?: string
}

export interface IncomingMessage extends Message {
  direction: 'in'
  /** Title to use if this message creates the chat. */
  chatTitle: string
}

export interface Chat {
  id: string
  title: string
  /** International digits, when the chat was started by phone number. */
  phone?: string
  unread: number
  /** Unix ms of the last message or of creation; drives list order. */
  lastActivity: number
}

/** The MAX account the instance is authorized as. */
export interface Account {
  /** International digits, e.g. "79991234567" */
  phone: string
  chatId: string
}

export type ConnectionStatus = 'connecting' | 'online' | 'reconnecting'

export interface State {
  credentials: Credentials | null
  /** Null until getAccountSettings has answered. */
  me: Account | null
  chats: Record<string, Chat>
  messages: Record<string, Message[]>
  activeChatId: string | null
  connection: ConnectionStatus
  connectionError: string | null
  /** Shown on the login page after a forced logout. */
  logoutReason: string | null
  /** Statuses that arrived before sendMessage returned their id, keyed by idMessage. */
  pendingStatuses: Record<string, StatusUpdate>
}

export type Action =
  | { type: 'LOGIN'; credentials: Credentials; me?: Account | null }
  | { type: 'ACCOUNT'; me: Account }
  | { type: 'LOGOUT'; reason?: string }
  | { type: 'OPEN_CHAT'; chatId: string | null; title?: string; phone?: string; now?: number }
  | { type: 'SEND_START'; chatId: string; tempId: string; text: string; timestamp: number }
  | { type: 'SEND_OK'; chatId: string; tempId: string; idMessage: string }
  | { type: 'SEND_FAIL'; chatId: string; tempId: string }
  | { type: 'RECEIVE'; message: IncomingMessage }
  | { type: 'STATUS'; update: StatusUpdate }
  | { type: 'CONNECTION'; status: ConnectionStatus; error?: string | null }

export const initialState: State = {
  credentials: null,
  me: null,
  chats: {},
  messages: {},
  activeChatId: null,
  connection: 'connecting',
  connectionError: null,
  logoutReason: null,
  pendingStatuses: {},
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOGIN':
      return { ...initialState, credentials: action.credentials, me: action.me ?? null }

    case 'ACCOUNT':
      return state.credentials ? { ...state, me: action.me } : state

    case 'LOGOUT':
      return { ...initialState, logoutReason: action.reason ?? null }

    case 'OPEN_CHAT': {
      const { chatId } = action
      if (chatId === null) return state.activeChatId === null ? state : { ...state, activeChatId: null }

      const existing = state.chats[chatId]
      const chat: Chat = existing
        ? { ...existing, unread: 0 }
        : {
            id: chatId,
            title: action.title || chatId,
            ...(action.phone ? { phone: action.phone } : {}),
            unread: 0,
            lastActivity: action.now ?? Date.now(),
          }
      return {
        ...state,
        activeChatId: chatId,
        chats: { ...state.chats, [chatId]: chat },
      }
    }

    case 'SEND_START': {
      const { chatId, tempId, text, timestamp } = action
      const list = state.messages[chatId] ?? []
      const chat = state.chats[chatId] ?? { id: chatId, title: chatId, unread: 0, lastActivity: timestamp }

      // Retry reuses the temp id: flip the failed message back to sending in place.
      if (list.some((m) => m.id === tempId)) {
        return updateMessage(state, chatId, tempId, (m) => {
          const retried: Message = { ...m, status: 'sending' }
          delete retried.error
          return retried
        })
      }

      const message: Message = { id: tempId, chatId, text, timestamp, direction: 'out', status: 'sending' }
      return {
        ...state,
        chats: { ...state.chats, [chatId]: { ...chat, lastActivity: Math.max(chat.lastActivity, timestamp) } },
        messages: { ...state.messages, [chatId]: [...list, message] },
      }
    }

    case 'SEND_OK': {
      // Ids are React keys and must stay unique per chat: if the server id is already present, drop the temp copy.
      const list = state.messages[action.chatId] ?? []
      if (list.some((m) => m.id === action.idMessage)) {
        return {
          ...state,
          messages: { ...state.messages, [action.chatId]: list.filter((m) => m.id !== action.tempId) },
        }
      }
      const sent = updateMessage(state, action.chatId, action.tempId, (m) => ({
        ...m,
        id: action.idMessage,
        status: 'sent',
      }))
      const pending = state.pendingStatuses[action.idMessage]
      if (!pending) return sent
      const rest = { ...state.pendingStatuses }
      delete rest[action.idMessage]
      return applyStatus({ ...sent, pendingStatuses: rest }, pending)
    }

    case 'STATUS': {
      const { chatId, idMessage } = action.update
      const list = state.messages[chatId] ?? []
      if (list.some((m) => m.id === idMessage && m.direction === 'out')) return applyStatus(state, action.update)
      // The notification can beat the sendMessage response; hold it until SEND_OK brings the id.
      // Anything else (e.g. messages sent from the phone) isn't shown here, so drop it.
      if (!list.some((m) => m.status === 'sending')) return state
      return { ...state, pendingStatuses: { ...state.pendingStatuses, [idMessage]: action.update } }
    }

    case 'SEND_FAIL':
      return updateMessage(state, action.chatId, action.tempId, (m) => ({ ...m, status: 'failed' }))

    case 'RECEIVE': {
      const { chatTitle, ...message } = action.message
      const list = state.messages[message.chatId] ?? []
      // A failed deleteNotification makes the queue redeliver; drop duplicates.
      if (list.some((m) => m.id === message.id)) return state

      const isOpen = state.activeChatId === message.chatId
      const prev = state.chats[message.chatId]
      // A chat titled with a bare phone number (no name was found) takes the sender's name.
      const betterTitle = prev && /^\+\d+$/.test(prev.title) && chatTitle && chatTitle !== message.chatId
      const chat: Chat = prev
        ? {
            ...prev,
            ...(betterTitle ? { title: chatTitle } : {}),
            unread: isOpen ? 0 : prev.unread + 1,
            lastActivity: Math.max(prev.lastActivity, message.timestamp),
          }
        : { id: message.chatId, title: chatTitle, unread: isOpen ? 0 : 1, lastActivity: message.timestamp }

      return {
        ...state,
        chats: { ...state.chats, [message.chatId]: chat },
        messages: { ...state.messages, [message.chatId]: [...list, message] },
      }
    }

    case 'CONNECTION': {
      const error = action.error ?? null
      if (state.connection === action.status && state.connectionError === error) return state
      return { ...state, connection: action.status, connectionError: error }
    }

    default:
      return state
  }
}

function updateMessage(state: State, chatId: string, id: string, fn: (m: Message) => Message): State {
  const list = state.messages[chatId]
  if (!list) return state
  const idx = list.findIndex((m) => m.id === id)
  if (idx === -1) return state
  const next = list.slice()
  next[idx] = fn(list[idx])
  return { ...state, messages: { ...state.messages, [chatId]: next } }
}

const STATUS_RANK: Partial<Record<MessageStatus, number>> = { sent: 1, delivered: 2, read: 3 }

/**
 * Moves outgoing statuses forward only. Delivered/read also covers earlier sent messages in the
 * chat (reading the latest implies the rest); messages still sending or failed are left alone.
 */
function applyStatus(state: State, update: StatusUpdate): State {
  const list = state.messages[update.chatId]
  const idx = list?.findIndex((m) => m.id === update.idMessage && m.direction === 'out') ?? -1
  if (!list || idx === -1) return state

  const next = list.slice()
  let changed = false

  if (update.status === 'failed') {
    const m = list[idx]
    if ((STATUS_RANK[m.status!] ?? 0) >= STATUS_RANK.delivered!) return state
    next[idx] = { ...m, status: 'failed', ...(update.error ? { error: update.error } : {}) }
    changed = true
  } else {
    const rank = STATUS_RANK[update.status]!
    for (let i = 0; i <= idx; i++) {
      const m = list[i]
      const current = STATUS_RANK[m.status!]
      if (m.direction !== 'out' || current === undefined || current >= rank) continue
      next[i] = { ...m, status: update.status }
      changed = true
    }
  }

  return changed ? { ...state, messages: { ...state.messages, [update.chatId]: next } } : state
}

export function sortedChats(state: State): Chat[] {
  return Object.values(state.chats).sort((a, b) => b.lastActivity - a.lastActivity)
}
