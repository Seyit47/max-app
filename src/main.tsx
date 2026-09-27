import '@maxhub/max-ui/dist/styles.css'
import './index.css'
import { MaxUI } from '@maxhub/max-ui'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { StoreProvider } from './state/store'

// colorScheme is left unset so MaxUI follows the system light/dark preference.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MaxUI className="app-root">
      <StoreProvider>
        <App />
      </StoreProvider>
    </MaxUI>
  </StrictMode>,
)
