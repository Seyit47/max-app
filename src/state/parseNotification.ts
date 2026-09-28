import type { NotificationBody } from '../api/types'
import type { IncomingMessage, StatusUpdate } from './reducer'

/**
 * Maps a queued notification to an incoming message, or null for anything we don't display.
 * The caller must still ack (deleteNotification) null results, or the queue stalls.
 */
export function parseNotification(body: NotificationBody | null | undefined): IncomingMessage | null {
  if (!body || body.typeWebhook !== 'incomingMessageReceived') return null

  const { idMessage, senderData, messageData } = body
  if (!idMessage || !senderData?.chatId || !messageData) return null

  const chatId = String(senderData.chatId)
  const text = extractText(messageData)
  const timestamp = typeof body.timestamp === 'number' ? body.timestamp * 1000 : Date.now()

  // Group chat ids are negative: title by the group, not the person who wrote.
  const isGroup = chatId.startsWith('-')
  const chatTitle =
    (isGroup
      ? senderData.chatName || senderData.senderName
      : senderData.senderName || senderData.chatName) || chatId

  return {
    id: String(idMessage),
    chatId,
    text,
    timestamp,
    direction: 'in',
    senderName: senderData.senderName || undefined,
    chatTitle,
  }
}

function extractText(data: NonNullable<NotificationBody['messageData']>): string {
  switch (data.typeMessage) {
    case 'textMessage':
      return data.textMessageData?.textMessage ?? ''
    case 'extendedTextMessage':
      return data.extendedTextMessageData?.text ?? ''
    default:
      return `[${data.typeMessage || 'unknownMessage'}]`
  }
}

const FAILURE_REASONS: Record<string, string> = {
  noAccount: 'This number is not registered in MAX',
  notInGroup: 'You are not a member of this group',
}

/** Maps an outgoingMessageStatus notification to a status change, or null for anything else. */
export function parseStatus(body: NotificationBody | null | undefined): StatusUpdate | null {
  if (!body || body.typeWebhook !== 'outgoingMessageStatus') return null
  const { chatId, idMessage, status, description } = body
  if (typeof idMessage !== 'string' || !idMessage || chatId === undefined || chatId === null) return null
  const base = { chatId: String(chatId), idMessage }

  switch (status) {
    case 'delivered':
    case 'read':
      return { ...base, status }
    case 'failed':
    case 'noAccount':
    case 'notInGroup': {
      const error =
        FAILURE_REASONS[status] ??
        (typeof description === 'string' && description ? description : 'MAX could not deliver the message')
      return { ...base, status: 'failed', error }
    }
    default:
      return null
  }
}
