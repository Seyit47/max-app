import { Button, IconButton, Input, Typography } from '@maxhub/max-ui'
import { useState } from 'react'
import { useStore } from '../state/store'
import { ChatList } from './ChatList'
import { ConnectionStatus } from './ConnectionStatus'
import { LogoutIcon, PlusIcon, SearchIcon } from './icons'
import { NewChatDialog } from './NewChatDialog'
import styles from './Sidebar.module.css'

export function Sidebar({ className }: { className?: string }) {
  const { state, dispatch } = useStore()
  const [query, setQuery] = useState('')
  const [newChatOpen, setNewChatOpen] = useState(false)

  return (
    <aside className={`${styles.sidebar} ${className ?? ''}`}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <Typography.Title variant="medium-strong" className={styles.appName}>
            MAX Web Chat (GREEN-API)
          </Typography.Title>
          <ConnectionStatus status={state.connection} error={state.connectionError} />
        </div>
        <IconButton
          size="small"
          variant="ghost"
          aria-label="New chat"
          title="New chat"
          aria-haspopup="dialog"
          onClick={() => setNewChatOpen(true)}
        >
          <PlusIcon size={24} />
        </IconButton>
      </header>

      {state.connectionError && state.connection !== 'online' && (
        <div className={styles.banner} role="alert">
          {state.connectionError}
        </div>
      )}

      <div className={styles.search}>
        <Input
          size="medium"
          type="search"
          placeholder="Search"
          aria-label="Search chats"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          iconBefore={<SearchIcon size={20} className={styles.searchIcon} />}
        />
      </div>

      <ChatList query={query} onNewChat={() => setNewChatOpen(true)} />

      <footer className={styles.footer}>
        <span className={styles.instance} title="Signed-in MAX account and GREEN-API instance">
          {state.me?.phone ? `+${state.me.phone} · ` : ''}Instance {state.credentials?.idInstance}
        </span>
        <Button
          size="small"
          variant="ghost"
          iconBefore={<LogoutIcon size={20} />}
          onClick={() => dispatch({ type: 'LOGOUT' })}
        >
          Log out
        </Button>
      </footer>

      <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
    </aside>
  )
}
