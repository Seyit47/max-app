import type { ConnectionStatus as Status } from '../state/reducer'
import styles from './ConnectionStatus.module.css'

const LABELS: Record<Status, string> = {
  connecting: 'Connecting…',
  online: 'Online',
  reconnecting: 'Reconnecting…',
}

export function ConnectionStatus({ status, error }: { status: Status; error: string | null }) {
  return (
    <span className={styles.root} data-status={status} role="status" title={error ?? undefined}>
      <span className={styles.dot} aria-hidden="true" />
      {LABELS[status]}
    </span>
  )
}
