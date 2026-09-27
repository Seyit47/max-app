import type { NotificationBody } from '../api/types'
import type { IncomingMessage } from './reducer'

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
