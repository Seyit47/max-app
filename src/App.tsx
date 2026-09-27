import { ChatWindow } from './components/ChatWindow'
import { LoginPage } from './components/LoginPage'
import { Sidebar } from './components/Sidebar'
import { useAccount } from './hooks/useAccount'
import { usePolling } from './hooks/usePolling'
import { useStore } from './state/store'
import styles from './App.module.css'

function Messenger() {
  const { state, dispatch, client } = useStore()
  usePolling(client, dispatch)
  useAccount(client, state.me !== null, dispatch)

  return (
    <div className={styles.layout} data-chat-open={state.activeChatId ? true : undefined}>
      <Sidebar className={styles.sidebar} />
      <ChatWindow className={styles.chat} />
    </div>
  )
}

export default function App() {
  const { state } = useStore()
  return state.credentials ? <Messenger /> : <LoginPage />
}
