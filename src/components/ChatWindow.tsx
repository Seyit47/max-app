import { IconButton, Typography } from '@maxhub/max-ui'
import { useCallback } from 'react'
import { useMarkRead } from '../hooks/useMarkRead'
import { useSendMessage } from '../hooks/useSendMessage'
import type { Message } from '../state/reducer'
import { useClient, useStore } from '../state/store'
import { ChatAvatar } from './ChatAvatar'
import styles from './ChatWindow.module.css'
import { Composer } from './Composer'
import { BackIcon, ChatIcon } from './icons'
import { MessageList } from './MessageList'

const EMPTY: Message[] = []

export function ChatWindow({ className }: { className?: string }) {
  const { state, dispatch } = useStore()
  const send = useSendMessage()
  const chat = state.activeChatId ? state.chats[state.activeChatId] : undefined
  const messages = (chat && state.messages[chat.id]) || EMPTY

  const onRetry = useCallback((m: Message) => void send(m.chatId, m.text, m.id), [send])
  const lastIncoming = messages.findLast((m) => m.direction === 'in')
  useMarkRead(useClient(), chat?.id ?? '', lastIncoming?.id)

  if (!chat) {
    return (
      <section className={`${styles.window} ${className ?? ''}`}>
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon} aria-hidden="true">
            <ChatIcon size={40} />
          </div>
          <Typography.Title variant="medium-strong">Select a chat</Typography.Title>
          <Typography.Body variant="small" className={styles.placeholderText}>
            Choose a conversation from the list, or press + to start a new one by phone number.
          </Typography.Body>
        </div>
      </section>
    )
  }

  const subtitle =
    state.connection === 'online'
      ? chat.id.startsWith('-')
        ? 'Group chat'
        : `ID ${chat.id}`
      : state.connection === 'connecting'
        ? 'Connecting…'
        : 'Waiting for network…'

  return (
    <section className={`${styles.window} ${className ?? ''}`} aria-label={`Chat with ${chat.title}`}>
      <header className={styles.header}>
        <IconButton
          size="small"
          variant="ghost"
          className={styles.back}
          aria-label="Back to chats"
          onClick={() => dispatch({ type: 'OPEN_CHAT', chatId: null })}
        >
          <BackIcon size={24} />
        </IconButton>
        <ChatAvatar id={chat.id} title={chat.title} size={40} />
        <div className={styles.headerText}>
          <Typography.Title variant="small-strong" className={styles.title}>
            {chat.title}
          </Typography.Title>
          <span className={styles.subtitle}>{subtitle}</span>
        </div>
      </header>

      <MessageList chatId={chat.id} messages={messages} onRetry={onRetry} />
      <Composer key={chat.id} onSend={(text) => void send(chat.id, text)} />
    </section>
  )
}
