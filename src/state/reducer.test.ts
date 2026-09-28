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
      { type: 'OPEN_CHAT', chatId: '100', title: 'Alice from contacts' },
      { type: 'OPEN_CHAT', chatId: null },
      { type: 'RECEIVE', message: incoming({ chatTitle: 'Alice' }) },
    )
    expect(s.chats['100'].title).toBe('Alice from contacts')
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

describe('reducer: delivery status', () => {
  const sent = (tempId: string, idMessage: string, timestamp: number): Action[] => [
    { type: 'SEND_START', chatId: '100', tempId, text: tempId, timestamp },
    { type: 'SEND_OK', chatId: '100', tempId, idMessage },
  ]
  const status = (idMessage: string, s: 'delivered' | 'read' | 'failed', error?: string): Action => ({
    type: 'STATUS',
    update: { chatId: '100', idMessage, status: s, error },
  })
  const statuses = (s: State) => s.messages['100'].map((m) => m.status)

  it('moves a sent message to delivered, then read', () => {
    const delivered = run(...sent('t1', 'm1', 1), status('m1', 'delivered'))
    expect(statuses(delivered)).toEqual(['delivered'])
    expect(statuses(reducer(delivered, status('m1', 'read')))).toEqual(['read'])
  })

  it('never downgrades a status', () => {
    const s = run(...sent('t1', 'm1', 1), status('m1', 'read'), status('m1', 'delivered'))
    expect(statuses(s)).toEqual(['read'])
  })

  it('marks earlier outgoing messages read too, but not ones still sending or failed', () => {
    const s = run(
      ...sent('t1', 'm1', 1),
      ...sent('t2', 'm2', 2),
      { type: 'SEND_START', chatId: '100', tempId: 't3', text: 'x', timestamp: 3 },
      { type: 'SEND_START', chatId: '100', tempId: 't4', text: 'y', timestamp: 4 },
      { type: 'SEND_FAIL', chatId: '100', tempId: 't4' },
      ...sent('t5', 'm5', 5),
      status('m5', 'read'),
    )
    expect(statuses(s)).toEqual(['read', 'read', 'sending', 'failed', 'read'])
  })

  it('applies a status that arrives before sendMessage returned the id', () => {
    const s = run(
      { type: 'SEND_START', chatId: '100', tempId: 't1', text: 'hi', timestamp: 1 },
      status('m1', 'delivered'),
      { type: 'SEND_OK', chatId: '100', tempId: 't1', idMessage: 'm1' },
    )
    expect(s.messages['100'][0]).toMatchObject({ id: 'm1', status: 'delivered' })
    expect(s.pendingStatuses).toEqual({})
  })

  it('drops statuses for messages it does not know and is not waiting on', () => {
    const s = run(...sent('t1', 'm1', 1))
    expect(reducer(s, status('other', 'read'))).toBe(s)
  })

  it('marks a message failed with the reason, and a retry clears it', () => {
    const failed = run(...sent('t1', 'm1', 1), status('m1', 'failed', 'This number is not registered in MAX'))
    expect(failed.messages['100'][0]).toMatchObject({ status: 'failed', error: 'This number is not registered in MAX' })

    const retried = reducer(failed, { type: 'SEND_START', chatId: '100', tempId: 'm1', text: 't1', timestamp: 9 })
    expect(retried.messages['100'][0].status).toBe('sending')
    expect(retried.messages['100'][0].error).toBeUndefined()
  })
})

describe('reducer: chat titles', () => {
  it('OPEN_CHAT keeps the phone number on the chat', () => {
    const s = run({ type: 'OPEN_CHAT', chatId: '100', title: 'Alice', phone: '79991234567', now: 1 })
    expect(s.chats['100']).toMatchObject({ title: 'Alice', phone: '79991234567' })
  })

  it('replaces a phone-number title with the sender name when they write', () => {
    const s = run(
      { type: 'OPEN_CHAT', chatId: '100', title: '+79991234567', phone: '79991234567', now: 1 },
      { type: 'RECEIVE', message: incoming({ chatTitle: 'Alice Smith' }) },
    )
    expect(s.chats['100']).toMatchObject({ title: 'Alice Smith', phone: '79991234567' })
  })

  it('keeps a real name, and ignores a sender name that is just the chat id', () => {
    const named = run(
      { type: 'OPEN_CHAT', chatId: '100', title: 'Alice (work)', now: 1 },
      { type: 'RECEIVE', message: incoming({ chatTitle: 'Alice Smith' }) },
    )
    expect(named.chats['100'].title).toBe('Alice (work)')

    const noName = run(
      { type: 'OPEN_CHAT', chatId: '100', title: '+79991234567', now: 1 },
      { type: 'RECEIVE', message: incoming({ chatTitle: '100' }) },
    )
    expect(noName.chats['100'].title).toBe('+79991234567')
  })
})
