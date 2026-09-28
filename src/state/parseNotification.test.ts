import { describe, expect, it } from 'vitest'
import type { NotificationBody } from '../api/types'
import { parseNotification, parseStatus } from './parseNotification'

function incoming(messageData: NotificationBody['messageData'], senderData?: Partial<NotificationBody['senderData']>): NotificationBody {
  return {
    typeWebhook: 'incomingMessageReceived',
    idMessage: '1763115112345',
    timestamp: 1763115112,
    senderData: {
      chatId: '10000000',
      chatName: 'Chat Name',
      sender: '10000000',
      senderName: 'Sender Name',
      ...senderData,
    },
    messageData,
  }
}

describe('parseNotification', () => {
  it('parses a textMessage', () => {
    const msg = parseNotification(
      incoming({ typeMessage: 'textMessage', textMessageData: { textMessage: 'Hello' } }),
    )
    expect(msg).toEqual({
      id: '1763115112345',
      chatId: '10000000',
      text: 'Hello',
      timestamp: 1763115112000,
      direction: 'in',
      senderName: 'Sender Name',
      chatTitle: 'Sender Name',
    })
  })

  it('parses an extendedTextMessage', () => {
    const msg = parseNotification(
      incoming({
        typeMessage: 'extendedTextMessage',
        extendedTextMessageData: { text: 'See https://green-api.com', title: '', description: '' },
      }),
    )
    expect(msg?.text).toBe('See https://green-api.com')
  })

  it('keeps line breaks in text', () => {
    const msg = parseNotification(
      incoming({ typeMessage: 'textMessage', textMessageData: { textMessage: 'a\nb' } }),
    )
    expect(msg?.text).toBe('a\nb')
  })

  it('shows a placeholder for unsupported message types', () => {
    const msg = parseNotification(incoming({ typeMessage: 'imageMessage' }))
    expect(msg?.text).toBe('[imageMessage]')
  })

  it('returns null for non-message events', () => {
    expect(
      parseNotification({ typeWebhook: 'outgoingMessageStatus', idMessage: '1', timestamp: 1 }),
    ).toBeNull()
    expect(parseNotification({ typeWebhook: 'stateInstanceChanged', stateInstance: 'authorized' })).toBeNull()
  })

  it('returns null for malformed bodies', () => {
    expect(parseNotification(null)).toBeNull()
    expect(parseNotification({ typeWebhook: 'incomingMessageReceived' })).toBeNull()
  })

  it('keeps negative group chat ids as strings and titles by the group name', () => {
    const msg = parseNotification(
      incoming(
        { typeMessage: 'textMessage', textMessageData: { textMessage: 'hi' } },
        { chatId: '-10000000000000', chatName: 'Group', senderName: 'Alice' },
      ),
    )
    expect(msg?.chatId).toBe('-10000000000000')
    expect(msg?.chatTitle).toBe('Group')
    expect(msg?.senderName).toBe('Alice')
  })

  it('falls back to chatName, then chatId, for the title', () => {
    const noSender = parseNotification(
      incoming({ typeMessage: 'textMessage', textMessageData: { textMessage: 'x' } }, { senderName: '' }),
    )
    expect(noSender?.chatTitle).toBe('Chat Name')

    const noNames = parseNotification(
      incoming(
        { typeMessage: 'textMessage', textMessageData: { textMessage: 'x' } },
        { senderName: '', chatName: '' },
      ),
    )
    expect(noNames?.chatTitle).toBe('10000000')
  })
})

describe('parseStatus', () => {
  const status = (status: string, extra: Record<string, unknown> = {}): NotificationBody => ({
    typeWebhook: 'outgoingMessageStatus',
    chatId: '10000000',
    timestamp: 1755591519,
    idMessage: '115054445839974415',
    status,
    ...extra,
  })

  it('parses delivered and read', () => {
    expect(parseStatus(status('delivered'))).toEqual({ chatId: '10000000', idMessage: '115054445839974415', status: 'delivered' })
    expect(parseStatus(status('read'))?.status).toBe('read')
  })

  it('maps the failure statuses to failed with a readable reason', () => {
    expect(parseStatus(status('noAccount'))).toMatchObject({ status: 'failed', error: 'This number is not registered in MAX' })
    expect(parseStatus(status('notInGroup'))).toMatchObject({ status: 'failed', error: 'You are not a member of this group' })
    expect(parseStatus(status('failed', { description: 'MAX server error' }))).toMatchObject({ status: 'failed', error: 'MAX server error' })
  })

  it('ignores other notifications and unknown statuses', () => {
    expect(parseStatus({ typeWebhook: 'incomingMessageReceived', idMessage: '1' })).toBeNull()
    expect(parseStatus(status('sent'))).toBeNull()
    expect(parseStatus(status('read', { idMessage: undefined }))).toBeNull()
  })
})
