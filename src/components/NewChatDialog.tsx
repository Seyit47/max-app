import { IconButton, Typography } from '@maxhub/max-ui'
import { useEffect, useRef } from 'react'
import { CloseIcon } from './icons'
import styles from './NewChatDialog.module.css'
import { NewChatForm } from './NewChatForm'

/** Native <dialog>: gives us Esc-to-close, focus trapping and a backdrop for free. */
export function NewChatDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="new-chat-title"
      onClose={onClose}
      // The panel fills the dialog, so a click landing on the dialog itself is on the backdrop.
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {/* Mounted only while open so the form starts empty each time. */}
      {open && (
        <div className={styles.panel}>
          <header className={styles.header}>
            <Typography.Title variant="medium-strong" id="new-chat-title">
              New chat
            </Typography.Title>
            <IconButton size="xsmall" variant="ghost" aria-label="Close" onClick={onClose}>
              <CloseIcon size={20} />
            </IconButton>
          </header>
          <NewChatForm onDone={onClose} onCancel={onClose} />
        </div>
      )}
    </dialog>
  )
}
