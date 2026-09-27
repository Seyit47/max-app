import { COUNTRIES, type Country } from './countries'

/** "+7 999 123-45-67" -> "79991234567" */
export function normalizePhone(input: string): string {
  return input.replace(/\D+/g, '')
}

/** NANP members (+1 473, +1 869) keep their area code in the dial code; the mobile pattern includes it. */
function areaCode(country: Country): string {
  return country.dialCode.length === 4 && country.dialCode.startsWith('1') ? country.dialCode.slice(1) : ''
}

const patternCache = new Map<string, RegExp>()
function mobilePattern(country: Country): RegExp {
  let re = patternCache.get(country.iso)
  if (!re) {
    re = new RegExp(`^(?:${country.mobile})$`)
    patternCache.set(country.iso, re)
  }
  return re
}

/**
 * The national part of what the user typed for a country. Drops what people commonly put in
 * front of it: the country code again, or the country's trunk prefix (0, or 8 in Russia).
 */
export function nationalDigits(country: Country, input: string): string {
  let digits = normalizePhone(input)
  if (digits.length > country.maxLength && digits.startsWith(country.dialCode)) {
    digits = digits.slice(country.dialCode.length)
  }
  for (const prefix of country.trunkPrefixes) {
    if (!digits.startsWith(prefix)) continue
    const rest = digits.slice(prefix.length)
    // Too long with it, or only a valid mobile number without it (Malaysia "012-345 6789").
    if (digits.length > country.maxLength || (!isValidNational(country, digits) && isValidNational(country, rest))) {
      return rest
    }
  }
  return digits
}

export function hasValidLength(country: Country, national: string): boolean {
  return national.length >= country.minLength && national.length <= country.maxLength
}

/** A complete, valid mobile number for the country: right length and an allocated mobile range. */
export function isValidNational(country: Country, national: string): boolean {
  return /^\d+$/.test(national) && hasValidLength(country, national) && mobilePattern(country).test(areaCode(country) + national)
}

/**
 * Lays national digits out with the country's mask, e.g. Russia "9991234567" -> "999 123-45-67".
 * Partial input is formatted as far as it goes; digits beyond the maximum length are dropped.
 */
export function formatNational(country: Country, digits: string): string {
  const d = normalizePhone(digits).slice(0, country.maxLength)
  const mask = country.formats[d.length] ?? country.formats[country.maxLength] ?? ''
  let out = ''
  let i = 0
  for (const ch of mask) {
    if (i >= d.length) break
    out += ch === '#' ? d[i++] : ch
  }
  return out + d.slice(i)
}

/** Digits in international format, as checkAccount expects (no "+"). */
export function toInternational(country: Country, national: string): string {
  return country.dialCode + national
}

/**
 * Splits a full international number ("+375 29 …") into a supported country and national part.
 * Longest dial code wins; countries sharing one (+7: Russia, Kazakhstan) are told apart by
 * their mobile ranges, or for a partial number by its first digit, falling back to the first listed.
 */
export function detectCountry(input: string): { country: Country; national: string } | null {
  const digits = normalizePhone(input)
  const candidates = COUNTRIES.filter((c) => digits.startsWith(c.dialCode))
  if (candidates.length === 0) return null
  const longest = Math.max(...candidates.map((c) => c.dialCode.length))
  const sameCode = candidates.filter((c) => c.dialCode.length === longest)
  const national = digits.slice(longest)
  const country =
    sameCode.find((c) => mobilePattern(c).test(areaCode(c) + national.slice(0, c.maxLength))) ??
    sameCode.find((c) => national.length > 0 && c.example[0] === national[0]) ??
    sameCode[0]
  return { country, national }
}

/** Whether international digits are the signed-in account's own number. */
export function isOwnNumber(ownPhone: string | null | undefined, digits: string): boolean {
  const own = normalizePhone(ownPhone ?? '')
  return own.length > 0 && own === normalizePhone(digits)
}

export function formatPhoneTitle(digits: string): string {
  return `+${digits}`
}
