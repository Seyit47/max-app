import { describe, expect, it } from 'vitest'
import { initialState, reducer, sortedChats, type Action, type IncomingMessage, type State } from './reducer'

const creds = { idInstance: '1101000001', apiTokenInstance: 'token', apiUrl: 'https://1101.api.green-api.com' }

function run(...actions: Action[]): State {
  return actions.reduce(reducer, reducer(initialState, { type: 'LOGIN', credentials: creds }))
}

function incoming(overrides: Partial<IncomingMessage> = {}): IncomingMessage {
  return {
    id: 'in-1',
    chatId: '100',
    text: 'Hello',
    timestamp: 1_000,
    direction: 'in',
    chatTitle: 'Alice',
    ...overrides,
  }
}

describe('reducer: RECEIVE', () => {
  it('creates a chat for an unknown sender, titled from the notification', () => {
    const s = run({ type: 'RECEIVE', message: incoming() })
    expect(s.chats['100']).toEqual({ id: '100', title: 'Alice', unread: 1, lastActivity: 1_000 })
    expect(s.messages['100']).toHaveLength(1)
    expect(s.messages['100'][0]).not.toHaveProperty('chatTitle')
  })

  it('dedupes by message id', () => {
    const s = run(
      { type: 'RECEIVE', message: incoming() },
      { type: 'RECEIVE', message: incoming() },
    )
    expect(s.messages['100']).toHaveLength(1)
    expect(s.chats['100'].unread).toBe(1)
  })

  it('returns the same state object for a duplicate', () => {
    const s1 = run({ type: 'RECEIVE', message: incoming() })
    expect(reducer(s1, { type: 'RECEIVE', message: incoming() })).toBe(s1)
  })

  it('counts unread only for chats that are not open', () => {
    const s = run(
      { type: 'RECEIVE', message: incoming({ id: 'a', chatId: '100' }) },
      { type: 'RECEIVE', message: incoming({ id: 'b', chatId: '100' }) },
      { type: 'OPEN_CHAT', chatId: '200', title: 'Bob' },
      { type: 'RECEIVE', message: incoming({ id: 'c', chatId: '200' }) },
    )
    expect(s.chats['100'].unread).toBe(2)
    expect(s.chats['200'].unread).toBe(0)
  })

  it('keeps an existing chat title', () => {
    const s = run(
      { type: 'OPEN_CHAT', chatId: '100', title: '+79991234567' },
      { type: 'OPEN_CHAT', chatId: null },
      { type: 'RECEIVE', message: incoming({ chatTitle: 'Alice' }) },
    )
    expect(s.chats['100'].title).toBe('+79991234567')
    expect(s.chats['100'].unread).toBe(1)
  })
})

describe('reducer: OPEN_CHAT', () => {
  it('resets unread for the opened chat', () => {
    const s = run(
      { type: 'RECEIVE', message: incoming({ id: 'a' }) },
      { type: 'RECEIVE', message: incoming({ id: 'b' }) },
      { type: 'OPEN_CHAT', chatId: '100' },
    )
    expect(s.activeChatId).toBe('100')
    expect(s.chats['100'].unread).toBe(0)
  })

  it('creates a chat when opening an unknown id', () => {
    const s = run({ type: 'OPEN_CHAT', chatId: '300', title: '+79990000000', now: 5 })
    expect(s.chats['300']).toEqual({ id: '300', title: '+79990000000', unread: 0, lastActivity: 5 })
  })
})

describe('reducer: sending', () => {
  const start: Action = { type: 'SEND_START', chatId: '100', tempId: 'tmp-1', text: 'Hi', timestamp: 2_000 }

  it('SEND_START adds an optimistic outgoing message', () => {
    const s = run({ type: 'OPEN_CHAT', chatId: '100', title: 'A', now: 1 }, start)
    expect(s.messages['100']).toEqual([
      { id: 'tmp-1', chatId: '100', text: 'Hi', timestamp: 2_000, direction: 'out', status: 'sending' },
    ])
    expect(s.chats['100'].lastActivity).toBe(2_000)
  })

  it('SEND_OK replaces the temp id with idMessage and marks it sent', () => {
    const s = run(start, { type: 'SEND_OK', chatId: '100', tempId: 'tmp-1', idMessage: 'real-1' })
    expect(s.messages['100']).toHaveLength(1)
    expect(s.messages['100'][0]).toMatchObject({ id: 'real-1', status: 'sent' })
  })

  it('SEND_OK never produces duplicate ids in a chat', () => {
    const s = run(
      start,
      { type: 'SEND_START', chatId: '100', tempId: 'tmp-2', text: 'Again', timestamp: 2_001 },
      { type: 'SEND_OK', chatId: '100', tempId: 'tmp-1', idMessage: 'real-1' },
      { type: 'SEND_OK', chatId: '100', tempId: 'tmp-2', idMessage: 'real-1' },
    )
    expect(s.messages['100'].map((m) => m.id)).toEqual(['real-1'])
  })

  it('SEND_FAIL marks the message failed, and a retry SEND_START flips it back', () => {
    const failed = run(start, { type: 'SEND_FAIL', chatId: '100', tempId: 'tmp-1' })
    expect(failed.messages['100'][0]).toMatchObject({ id: 'tmp-1', status: 'failed' })

    const retried = reducer(failed, start)
    expect(retried.messages['100']).toHaveLength(1)
    expect(retried.messages['100'][0].status).toBe('sending')
  })
})

describe('reducer: session', () => {
  it('LOGIN stores the signed-in account, ACCOUNT fills it in later', () => {
    const me = { phone: '79991234567', chatId: '10000000' }
    expect(reducer(initialState, { type: 'LOGIN', credentials: creds, me }).me).toEqual(me)

    const s = run({ type: 'ACCOUNT', me })
    expect(s.me).toEqual(me)
    expect(reducer(s, { type: 'LOGOUT' }).me).toBeNull()
  })

  it('ignores ACCOUNT after logout (a late response must not leak into the next session)', () => {
    const s = reducer(initialState, { type: 'ACCOUNT', me: { phone: '1', chatId: '1' } })
    expect(s).toBe(initialState)
  })

  it('LOGOUT clears everything and keeps the reason', () => {
    const s = run({ type: 'RECEIVE', message: incoming() }, { type: 'LOGOUT', reason: 'Unauthorized' })
    expect(s).toEqual({ ...initialState, logoutReason: 'Unauthorized' })
  })

  it('sortedChats orders by last activity, newest first', () => {
    const s = run(
      { type: 'RECEIVE', message: incoming({ id: 'a', chatId: '1', timestamp: 10 }) },
      { type: 'RECEIVE', message: incoming({ id: 'b', chatId: '2', timestamp: 30 }) },
      { type: 'RECEIVE', message: incoming({ id: 'c', chatId: '3', timestamp: 20 }) },
    )
    expect(sortedChats(s).map((c) => c.id)).toEqual(['2', '3', '1'])
  })
})
