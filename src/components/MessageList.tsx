import { Fragment, useLayoutEffect, useRef } from 'react'
import type { Message } from '../state/reducer'
import { dayKey, formatDayLabel } from '../utils/time'
import { MessageBubble } from './MessageBubble'
import styles from './MessageList.module.css'

const GROUP_GAP_MS = 5 * 60 * 1000
const NEAR_BOTTOM_PX = 120

interface Props {
  chatId: string
  messages: Message[]
  onRetry: (message: Message) => void
}

function sameGroup(a: Message | undefined, b: Message | undefined): boolean {
  return (
    !!a &&
    !!b &&
    a.direction === b.direction &&
    a.senderName === b.senderName &&
    dayKey(a.timestamp) === dayKey(b.timestamp) &&
    Math.abs(b.timestamp - a.timestamp) < GROUP_GAP_MS
  )
}

export function MessageList({ chatId, messages, onRetry }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const nearBottom = useRef(true)
  const prevCount = useRef(0)
  const isGroup = chatId.startsWith('-')

  // New chat opened: jump to the latest message.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
    nearBottom.current = true
    prevCount.current = messages.length
    // Only on chat switch; message changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  // New messages: follow only if the reader was already at the bottom, or they just sent one.
  useLayoutEffect(() => {
    const el = scrollRef.current
    const added = messages.length > prevCount.current
    prevCount.current = messages.length
    if (!el || !added) return
    const justSent = messages.at(-1)?.direction === 'out'
    if (nearBottom.current || justSent) el.scrollTop = el.scrollHeight
  }, [messages])

  function onScroll() {
    const el = scrollRef.current
    if (el) nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
  }

  return (
    <div ref={scrollRef} className={styles.scroll} onScroll={onScroll} role="log" aria-live="polite">
      <div className={styles.inner}>
        {messages.length === 0 && <div className={styles.empty}>No messages here yet. Say hello!</div>}
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const next = messages[i + 1]
          const newDay = !prev || dayKey(prev.timestamp) !== dayKey(m.timestamp)
          const groupedWithPrev = !newDay && sameGroup(prev, m)
          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className={styles.day}>
                  <span>{formatDayLabel(m.timestamp)}</span>
                </div>
              )}
              <MessageBubble
                message={m}
                groupedWithPrev={groupedWithPrev}
                groupedWithNext={sameGroup(m, next)}
                showSender={isGroup && m.direction === 'in' && !groupedWithPrev}
                onRetry={onRetry}
              />
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
