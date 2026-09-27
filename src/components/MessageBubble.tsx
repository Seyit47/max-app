import { Button } from '@maxhub/max-ui'
import { memo } from 'react'
import type { Message } from '../state/reducer'
import { formatTime } from '../utils/time'
import { AlertIcon, CheckIcon, ClockIcon } from './icons'
import styles from './MessageBubble.module.css'

interface Props {
  message: Message
  /** Previous message is from the same side and close in time. */
  groupedWithPrev: boolean
  groupedWithNext: boolean
  showSender: boolean
  onRetry: (message: Message) => void
}

const STATUS_LABEL = { sending: 'Sending', sent: 'Sent', failed: 'Not sent' } as const

export const MessageBubble = memo(function MessageBubble({
  message,
  groupedWithPrev,
  groupedWithNext,
  showSender,
  onRetry,
}: Props) {
  const out = message.direction === 'out'

  return (
    <div
      className={styles.row}
      data-out={out || undefined}
      data-grouped-prev={groupedWithPrev || undefined}
      data-grouped-next={groupedWithNext || undefined}
    >
      <div className={styles.bubble} data-failed={message.status === 'failed' || undefined}>
        {showSender && message.senderName && <div className={styles.sender}>{message.senderName}</div>}
        {/* Plain text only; pre-wrap in CSS keeps line breaks. The spacer reserves room for the meta. */}
        <div className={styles.text}>
          {message.text}
          <span className={styles.spacer} aria-hidden="true" />
        </div>
        <span className={styles.meta}>
          <time dateTime={new Date(message.timestamp).toISOString()}>{formatTime(message.timestamp)}</time>
          {out && message.status && (
            <span className={styles.status} title={STATUS_LABEL[message.status]} aria-label={STATUS_LABEL[message.status]}>
              {message.status === 'sending' && <ClockIcon size={14} />}
              {message.status === 'sent' && <CheckIcon size={14} strokeWidth={2.5} />}
              {message.status === 'failed' && <AlertIcon size={14} strokeWidth={2.5} />}
            </span>
          )}
        </span>
      </div>
      {message.status === 'failed' && (
        <div className={styles.failed}>
          <span>Not sent</span>
          <Button size="xsmall" variant="secondary" onClick={() => onRetry(message)}>
            Retry
          </Button>
        </div>
      )}
    </div>
  )
})
