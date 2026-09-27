import { Button, Counter, Typography } from '@maxhub/max-ui'
import { sortedChats, type Chat, type Message } from '../state/reducer'
import { useStore } from '../state/store'
import { formatListTime } from '../utils/time'
import { ChatAvatar } from './ChatAvatar'
import styles from './ChatList.module.css'

export function ChatList({ query, onNewChat }: { query: string; onNewChat: () => void }) {
  const { state, dispatch } = useStore()
  const all = sortedChats(state)
  const q = query.trim().toLowerCase()
  const chats = q ? all.filter((c) => c.title.toLowerCase().includes(q)) : all

  if (all.length === 0) {
    return (
      <div className={styles.empty}>
        <Typography.Body variant="small">No chats yet. Start one by phone number, or wait for someone to message you.</Typography.Body>
        <Button size="small" variant="secondary" onClick={onNewChat}>
          New chat
        </Button>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className={styles.empty}>
        <Typography.Body variant="small">No chats match “{query.trim()}”.</Typography.Body>
      </div>
    )
  }

  return (
    <nav className={styles.list} aria-label="Chats">
      {chats.map((chat) => (
        <ChatRow
          key={chat.id}
          chat={chat}
          last={state.messages[chat.id]?.at(-1)}
          active={chat.id === state.activeChatId}
          onClick={() => dispatch({ type: 'OPEN_CHAT', chatId: chat.id })}
        />
      ))}
    </nav>
  )
}

interface RowProps {
  chat: Chat
  last: Message | undefined
  active: boolean
  onClick: () => void
}

function ChatRow({ chat, last, active, onClick }: RowProps) {
  const preview = last ? (last.direction === 'out' ? `You: ${last.text}` : last.text) : 'No messages yet'

  return (
    <button
      type="button"
      className={styles.row}
      data-active={active || undefined}
      aria-current={active ? 'true' : undefined}
      onClick={onClick}
    >
      <ChatAvatar id={chat.id} title={chat.title} size={48} />
      <span className={styles.body}>
        <span className={styles.top}>
          <span className={styles.title}>{chat.title}</span>
          <span className={styles.time}>{formatListTime(last?.timestamp ?? chat.lastActivity)}</span>
        </span>
        <span className={styles.bottom}>
          <span className={styles.preview} data-failed={last?.status === 'failed' || undefined}>
            {last?.status === 'failed' ? 'Not sent: ' + last.text : preview}
          </span>
          {chat.unread > 0 && (
            <Counter value={chat.unread} variant="primary" rounded aria-label={`${chat.unread} unread`} />
          )}
        </span>
      </span>
    </button>
  )
}
