import { Button, IconButton, Input, Typography } from '@maxhub/max-ui'
import { useState, type FormEvent } from 'react'
import { createClient, defaultApiUrl, GreenApiError } from '../api/greenApi'
import { toAccount } from '../hooks/useAccount'
import { useStore } from '../state/store'
import { ChatIcon, EyeIcon, EyeOffIcon } from './icons'
import styles from './LoginPage.module.css'

const STATE_MESSAGES: Record<string, string> = {
  notAuthorized: 'The instance is not authorized. Link your MAX account in console.green-api.com first.',
  blocked: 'The MAX account on this instance is blocked.',
  starting: 'The instance is starting. This can take up to 5 minutes; try again shortly.',
  suspended: 'The account is temporarily suspended.',
  pendingPassword: 'Authorization is waiting for the 2FA password. Finish it in console.green-api.com.',
}

function describeError(err: unknown): string {
  if (err instanceof GreenApiError) {
    if (err.isNetwork) return 'Network error: could not reach GREEN-API. Check the API URL and your connection.'
    if (err.status === 401) return 'Wrong apiTokenInstance.'
    if (err.status === 403) return 'Wrong idInstance, or the API URL does not match this instance.'
    if (err.status === 404) return 'API URL not found. Check the apiUrl value in the console.'
    return `GREEN-API error (HTTP ${err.status}): ${err.message}`
  }
  return err instanceof Error ? err.message : 'Unexpected error'
}

export function LoginPage() {
  const { state, dispatch } = useStore()
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiToken] = useState('')
  // null = follow the value derived from idInstance; a string = user-edited.
  const [apiUrlOverride, setApiUrlOverride] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = apiUrlOverride ?? defaultApiUrl(idInstance)
  const canSubmit = idInstance.length > 0 && apiTokenInstance.trim().length > 0 && /^https?:\/\/.+/.test(apiUrl.trim())

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit || loading) return
    const credentials = { idInstance, apiTokenInstance: apiTokenInstance.trim(), apiUrl: apiUrl.trim() }
    setLoading(true)
    setError(null)
    try {
      const client = createClient(credentials)
      const { stateInstance } = await client.getStateInstance()
      if (stateInstance === 'authorized') {
        // Own number, used to stop "new chat" with yourself. Not critical: retried after login if this fails.
        const me = await client
          .getAccountSettings()
          .then(toAccount)
          .catch(() => null)
        dispatch({ type: 'LOGIN', credentials, me })
        return
      }
      setError(STATE_MESSAGES[stateInstance] ?? `The instance is not ready (state: ${stateInstance}).`)
    } catch (err) {
      setError(describeError(err))
    }
    setLoading(false)
  }

  const shownError = error ?? state.logoutReason

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <div className={styles.logo} aria-hidden="true">
          <ChatIcon size={32} />
        </div>
        <Typography.Headline variant="large-strong" className={styles.title}>
          MAX Web Chat (GREEN-API)
        </Typography.Headline>
        <Typography.Body variant="small" className={styles.subtitle}>
          Sign in with your GREEN-API instance credentials.
        </Typography.Body>

        <label className={styles.field}>
          <Typography.Label variant="small-strong" className={styles.label}>
            idInstance
          </Typography.Label>
          <Input
            size="large"
            inputMode="numeric"
            autoComplete="username"
            placeholder="1101000001"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value.replace(/\D+/g, ''))}
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <Typography.Label variant="small-strong" className={styles.label}>
            apiTokenInstance
          </Typography.Label>
          <Input
            size="large"
            type={showToken ? 'text' : 'password'}
            autoComplete="current-password"
            spellCheck={false}
            placeholder="Your API token"
            value={apiTokenInstance}
            onChange={(e) => setApiToken(e.target.value)}
            iconAfter={
              <IconButton
                type="button"
                size="xsmall"
                variant="ghost"
                aria-label={showToken ? 'Hide token' : 'Show token'}
                aria-pressed={showToken}
                onClick={() => setShowToken((v) => !v)}
              >
                {showToken ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </IconButton>
            }
          />
        </label>

        <label className={styles.field}>
          <Typography.Label variant="small-strong" className={styles.label}>
            apiUrl
          </Typography.Label>
          <Input
            size="large"
            inputMode="url"
            spellCheck={false}
            placeholder="https://1101.api.green-api.com"
            value={apiUrl}
            onChange={(e) => setApiUrlOverride(e.target.value)}
            hint={apiUrlOverride === null ? 'Filled in from idInstance. Edit it if your console shows a different one.' : undefined}
          />
        </label>

        {shownError && (
          <div className={styles.error} role="alert">
            {shownError}
          </div>
        )}

        <Button type="submit" size="large" stretched loading={loading} disabled={!canSubmit}>
          Sign in
        </Button>

        <Typography.Body variant="small" className={styles.hint}>
          Incoming notifications must be enabled and the webhook URL must be empty in the GREEN-API console.
        </Typography.Body>
      </form>
    </main>
  )
}
