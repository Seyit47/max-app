import { Button, Input } from '@maxhub/max-ui'
import { useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { GreenApiError } from '../api/greenApi'
import { useClient, useStore } from '../state/store'
import { COUNTRIES, flagEmoji, formatDialCode, guessCountry, type Country } from '../utils/countries'
import {
  detectCountry,
  formatNational,
  formatPhoneTitle,
  hasValidLength,
  isOwnNumber,
  isValidNational,
  nationalDigits,
  normalizePhone,
  toInternational,
} from '../utils/phone'
import { BackIcon, CheckIcon, SearchIcon } from './icons'
import styles from './NewChatForm.module.css'

const OWN_NUMBER_ERROR = 'This is your own number: the MAX account this instance is signed in with. Enter someone else’s number.'

// Don't hold the dialog open long for a name; the phone number is an acceptable title.
const CONTACT_LOOKUP_TIMEOUT_MS = 5_000

// GREEN-API documents checkAccount for these calling codes only.
const CHECK_ACCOUNT_DOCUMENTED = new Set(['7', '375'])

function lengthHint(c: Country): string {
  const n = c.minLength === c.maxLength ? `${c.minLength}` : `${c.minLength}–${c.maxLength}`
  return `${n} digits after ${formatDialCode(c)}`
}

/** Country + phone number -> checkAccount -> open chat. Calls onDone once a chat is opened. */
export function NewChatForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { state, dispatch } = useStore()
  const client = useClient()
  const [country, setCountry] = useState<Country>(() => guessCountry())
  const [phone, setPhone] = useState('')
  const [picking, setPicking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Digits left of the caret at the last edit, so reformatting doesn't throw the caret to the end.
  const caretDigits = useRef<number | null>(null)

  useLayoutEffect(() => {
    const el = inputRef.current
    const target = caretDigits.current
    caretDigits.current = null
    if (!el || target === null || document.activeElement !== el) return
    let pos = 0
    for (let seen = 0; pos < el.value.length && seen < target; pos++) {
      if (/\d/.test(el.value[pos])) seen++
    }
    el.setSelectionRange(pos, pos)
  }, [phone])

  function onPhoneChange(e: ChangeEvent<HTMLInputElement>) {
    const { value, selectionStart } = e.target
    if (error) setError(null)
    // A pasted/typed full "+…" number selects its country.
    if (/^\s*(\+|00)/.test(value)) {
      const detected = detectCountry(value.replace(/^\s*00/, ''))
      if (detected) {
        setCountry(detected.country)
        setPhone(formatNational(detected.country, detected.national))
        return
      }
    }
    caretDigits.current = normalizePhone(value.slice(0, selectionStart ?? value.length)).length
    setPhone(formatNational(country, nationalDigits(country, value)))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    const national = nationalDigits(country, phone)
    if (!hasValidLength(country, national)) {
      setError(`Enter a ${country.name} number: ${lengthHint(country)}.`)
      return
    }
    if (!isValidNational(country, national)) {
      setError(
        `${formatDialCode(country)} ${formatNational(country, national)} is not a ${country.name} mobile number. ` +
          `Mobile numbers look like ${formatDialCode(country)} ${formatNational(country, country.example)}.`,
      )
      return
    }
    const digits = toInternational(country, national)
    if (isOwnNumber(state.me?.phone, digits)) {
      setError(OWN_NUMBER_ERROR)
      return
    }

    // Already have a chat titled with this number: just open it, no need to spend a lookup.
    const title = formatPhoneTitle(digits)
    const known = Object.values(state.chats).find((c) => c.phone === digits || c.title === title)
    if (known) {
      dispatch({ type: 'OPEN_CHAT', chatId: known.id })
      onDone()
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { exist, chatId } = await client.checkAccount(Number(digits))
      // Same account under another spelling of the number: MAX answers with our own chat id.
      if (exist && chatId && state.me?.chatId && String(chatId) === state.me.chatId) {
        setError(OWN_NUMBER_ERROR)
        setLoading(false)
        return
      }
      if (exist && chatId) {
        // Prefer the name saved in contacts, then the MAX profile name, then the number.
        const info = await client
          .getContactInfo(String(chatId), AbortSignal.timeout(CONTACT_LOOKUP_TIMEOUT_MS))
          .catch(() => null)
        const name = info?.contactName?.trim() || info?.name?.trim()
        dispatch({ type: 'OPEN_CHAT', chatId: String(chatId), title: name || title, phone: digits })
        onDone()
        return
      }
      setError('This number is not registered in MAX')
    } catch (err) {
      if (err instanceof GreenApiError && err.status === 469) {
        setError('Too many number checks. MAX has rate-limited lookups; try again later.')
      } else if (err instanceof GreenApiError && err.status === 400 && !CHECK_ACCOUNT_DOCUMENTED.has(country.dialCode)) {
        setError(
          `GREEN-API could not check this number (${err.message}). ` +
            'Its checkAccount method is documented only for Russian (+7) and Belarusian (+375) numbers.',
        )
      } else {
        setError(err instanceof Error ? err.message : 'Could not check the number')
      }
    }
    setLoading(false)
  }

  if (picking) {
    return (
      <CountryPicker
        selected={country}
        onBack={() => setPicking(false)}
        onSelect={(c) => {
          setCountry(c)
          setPhone(formatNational(c, normalizePhone(phone)))
          setError(null)
          setPicking(false)
        }}
      />
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <button type="button" className={styles.country} aria-label={`Country: ${country.name}. Change`} onClick={() => setPicking(true)}>
        <span className={styles.flag} aria-hidden="true">
          {flagEmoji(country.iso)}
        </span>
        <span className={styles.countryName}>{country.name}</span>
        <BackIcon size={20} className={styles.chevron} />
      </button>

      <Input
        size="large"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        ref={inputRef}
        placeholder={formatNational(country, country.example)}
        aria-label={`Phone number, ${country.name} ${formatDialCode(country)}`}
        aria-invalid={error ? true : undefined}
        value={phone}
        onChange={onPhoneChange}
        iconBefore={<span className={styles.dialCode}>{formatDialCode(country)}</span>}
        hint={error ? undefined : lengthHint(country)}
        autoFocus
      />
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      <div className={styles.actions}>
        <Button type="button" size="medium" variant="secondary" stretched onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="medium" stretched loading={loading} disabled={!phone.trim()}>
          Start chat
        </Button>
      </div>
    </form>
  )
}

interface PickerProps {
  selected: Country
  onSelect: (c: Country) => void
  onBack: () => void
}

function CountryPicker({ selected, onSelect, onBack }: PickerProps) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase().replace(/^\+/, '')
  const matches = q
    ? COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.iso.toLowerCase() === q || c.dialCode.startsWith(q.replace(/\s+/g, '')),
      )
    : COUNTRIES

  function onKeyDown(e: KeyboardEvent) {
    // Esc steps back to the form instead of closing the whole dialog.
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onBack()
    }
  }

  return (
    <div className={styles.picker} onKeyDown={onKeyDown}>
      <div className={styles.pickerHead}>
        <button type="button" className={styles.back} aria-label="Back" onClick={onBack}>
          <BackIcon size={22} />
        </button>
        <span className={styles.pickerTitle}>Choose a country</span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (matches[0]) onSelect(matches[0])
        }}
      >
        <Input
          size="medium"
          type="search"
          placeholder="Country or code"
          aria-label="Search countries"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          iconBefore={<SearchIcon size={20} className={styles.searchIcon} />}
          autoFocus
        />
      </form>
      <ul className={styles.countryList} aria-label="Countries">
        {matches.map((c) => (
          <li key={c.iso}>
            <button
              type="button"
              className={styles.countryRow}
              aria-current={c.iso === selected.iso ? 'true' : undefined}
              onClick={() => onSelect(c)}
            >
              <span className={styles.flag} aria-hidden="true">
                {flagEmoji(c.iso)}
              </span>
              <span className={styles.countryName}>{c.name}</span>
              <span className={styles.rowCode}>{formatDialCode(c)}</span>
              {c.iso === selected.iso && <CheckIcon size={18} className={styles.check} />}
            </button>
          </li>
        ))}
        {matches.length === 0 && <li className={styles.noMatch}>No supported country matches “{query.trim()}”.</li>}
      </ul>
    </div>
  )
}
