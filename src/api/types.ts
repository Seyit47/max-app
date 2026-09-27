export interface Credentials {
  idInstance: string
  apiTokenInstance: string
  apiUrl: string
}

export type StateInstance =
  | 'notAuthorized'
  | 'authorized'
  | 'blocked'
  | 'starting'
  | 'suspended'
  | 'pendingPassword'

export interface StateInstanceResponse {
  stateInstance: StateInstance | (string & {})
}

export interface AccountSettingsResponse {
  stateInstance: StateInstance | (string & {})
  /** International digits, e.g. "79991234567". Empty unless authorized. */
  phone?: string
  /** The account's own chat id. Empty unless authorized. */
  chatId?: string
  avatar?: string
}

export interface CheckAccountResponse {
  exist: boolean
  chatId: string
  fromCache?: boolean
}

export interface SendMessageResponse {
  idMessage: string
}

export interface DeleteNotificationResponse {
  result: boolean
  reason?: string
}

export interface SenderData {
  chatId: string
  chatName?: string
  chatType?: string
  sender?: string
  senderName?: string
  senderType?: string
  senderContactName?: string
  senderPhoneNumber?: number
}

export interface MessageData {
  typeMessage: string
  textMessageData?: { textMessage: string }
  extendedTextMessageData?: { text: string; [key: string]: unknown }
  [key: string]: unknown
}

/** Body of a queued notification. Only incomingMessageReceived is handled; the rest is acked and dropped. */
export interface NotificationBody {
  typeWebhook: string
  idMessage?: string
  timestamp?: number
  senderData?: SenderData
  messageData?: MessageData
  [key: string]: unknown
}

export interface ReceivedNotification {
  receiptId: number
  body: NotificationBody
}
