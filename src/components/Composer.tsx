import { IconButton, Textarea } from '@maxhub/max-ui'
import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { SendIcon } from './icons'
import styles from './Composer.module.css'

// sendMessage rejects longer texts.
const MAX_LENGTH = 4000

export function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const canSend = text.trim().length > 0

  // Auto-grow; CSS max-height caps it at ~6 lines and then it scrolls.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!canSend) return
    onSend(text)
    setText('')
    ref.current?.focus()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form className={styles.composer} onSubmit={submit}>
      <Textarea
        ref={ref}
        mode="secondary"
        rows={1}
        maxLength={MAX_LENGTH}
        placeholder="Message"
        aria-label="Message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        className={styles.field}
        innerClassNames={{ textarea: styles.textarea }}
        autoFocus
      />
      <IconButton
        type="submit"
        size="small"
        variant="primary"
        disabled={!canSend}
        aria-label="Send"
        className={styles.send}
        data-active={canSend || undefined}
      >
        <SendIcon size={22} strokeWidth={2.4} />
      </IconButton>
    </form>
  )
}
