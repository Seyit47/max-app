import { describe, expect, it } from 'vitest'
import { COUNTRIES, findCountry, formatDialCode, guessCountry } from './countries'
import { detectCountry, formatNational, isOwnNumber, isValidNational, nationalDigits, normalizePhone, toInternational } from './phone'

const RU = findCountry('RU')!
const BY = findCountry('BY')!
const TR = findCountry('TR')!
const GD = findCountry('GD')!

describe('normalizePhone', () => {
  it.each([
    ['+7 999 123-45-67', '79991234567'],
    ['8 (999) 123 45 67', '89991234567'],
    ['+375 29 123-45-67', '375291234567'],
    ['79991234567', '79991234567'],
    ['  ', ''],
    ['abc', ''],
  ])('%s -> %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })
})

describe('countries', () => {
  it('lists the 40 MAX countries once each', () => {
    expect(COUNTRIES).toHaveLength(40)
    expect(new Set(COUNTRIES.map((c) => c.iso)).size).toBe(40)
    for (const c of COUNTRIES) {
      expect(c.dialCode).toMatch(/^\d{1,4}$/)
      expect(c.minLength).toBeLessThanOrEqual(c.maxLength)
    }
  })

  it.each(COUNTRIES.map((c) => [c.name, c] as const))('%s: example is a valid mobile number and fills a format', (_, c) => {
    expect(isValidNational(c, c.example)).toBe(true)
    const formatted = formatNational(c, c.example)
    expect(normalizePhone(formatted)).toBe(c.example)
    expect(formatted.length).toBe((c.formats[c.example.length] ?? '#'.repeat(c.example.length)).length)
  })

  it('formats NANP dial codes with the area code split off', () => {
    expect(formatDialCode(RU)).toBe('+7')
    expect(formatDialCode(GD)).toBe('+1 473')
  })

  it('guesses the country from the browser locale', () => {
    expect(guessCountry(['en-US', 'kk-KZ']).iso).toBe('KZ')
    expect(guessCountry(['en-US'])).toBe(RU)
    expect(guessCountry([])).toBe(RU)
  })
})

describe('nationalDigits / isValidNational', () => {
  it('keeps a plain national number', () => {
    expect(nationalDigits(RU, '999 123-45-67')).toBe('9991234567')
    expect(isValidNational(RU, '9991234567')).toBe(true)
  })

  it('strips a repeated country code', () => {
    expect(nationalDigits(RU, '+7 999 123-45-67')).toBe('9991234567')
    expect(nationalDigits(BY, '375 29 123 45 67')).toBe('291234567')
  })

  it('strips trunk prefixes', () => {
    expect(nationalDigits(RU, '8 999 123 45 67')).toBe('9991234567')
    expect(nationalDigits(TR, '0532 123 45 67')).toBe('5321234567')
    expect(nationalDigits(BY, '8 029 123-45-67')).toBe('291234567')
  })

  it('strips a trunk prefix that fits within the length only when that makes a valid number', () => {
    const MY = findCountry('MY')!
    expect(nationalDigits(MY, '012-345 6789')).toBe('123456789')
    expect(nationalDigits(MY, '12-345 6789')).toBe('123456789')
  })

  it('leaves a leading 0 alone where the country has no trunk prefix', () => {
    const GM = findCountry('GM')!
    expect(GM.trunkPrefixes).toEqual([])
    expect(nationalDigits(GM, '0301234')).toBe('0301234')
  })

  it('rejects numbers of the wrong length for the country', () => {
    expect(isValidNational(RU, '999123456')).toBe(false)
    expect(isValidNational(BY, '2912345678')).toBe(false)
  })

  it('accepts only the country\'s mobile ranges', () => {
    expect(isValidNational(RU, '9991234567')).toBe(true)
    expect(isValidNational(RU, '4951234567')).toBe(false) // Moscow landline
    expect(isValidNational(BY, '291234567')).toBe(true)
    expect(isValidNational(BY, '171234567')).toBe(false) // Minsk landline
    expect(isValidNational(TR, '5321234567')).toBe(true)
    expect(isValidNational(GD, '4031234')).toBe(true) // checked together with the 473 area code
    expect(isValidNational(GD, '2001234')).toBe(false)
  })

  it('builds the international number for checkAccount', () => {
    expect(toInternational(BY, '291234567')).toBe('375291234567')
  })
})

describe('formatNational', () => {
  it('lays digits out with the country mask', () => {
    expect(formatNational(RU, '9991234567')).toBe('999 123-45-67')
    expect(formatNational(BY, '291234567')).toBe('29 123-45-67')
    expect(formatNational(TR, '5321234567')).toBe('532 123 45 67')
    expect(formatNational(GD, '4031234')).toBe('403-1234')
  })

  it('formats partial input without trailing separators', () => {
    expect(formatNational(RU, '')).toBe('')
    expect(formatNational(RU, '999')).toBe('999')
    expect(formatNational(RU, '9991')).toBe('999 1')
    expect(formatNational(RU, '999123')).toBe('999 123')
  })

  it('drops digits beyond the maximum length', () => {
    expect(formatNational(RU, '99912345678')).toBe('999 123-45-67')
  })

  it('picks the mask by length for variable-length countries', () => {
    const ID = findCountry('ID')!
    expect(formatNational(ID, '812345678')).toBe('812-345-678')
    expect(formatNational(ID, '81234567890')).toBe('812-3456-7890')
  })
})

describe('isOwnNumber', () => {
  it('matches the account phone however it is written', () => {
    expect(isOwnNumber('79991234567', '79991234567')).toBe(true)
    expect(isOwnNumber('+7 999 123-45-67', '79991234567')).toBe(true)
    expect(isOwnNumber('79991234567', '79991234568')).toBe(false)
  })

  it('is false while the account phone is unknown', () => {
    expect(isOwnNumber(null, '79991234567')).toBe(false)
    expect(isOwnNumber('', '')).toBe(false)
  })
})

describe('detectCountry', () => {
  it('picks the longest matching dial code', () => {
    expect(detectCountry('+375 29 123-45-67')).toEqual({ country: BY, national: '291234567' })
    expect(detectCountry('+1 473 440 1234')?.country.iso).toBe('GD')
  })

  it('tells Russia and Kazakhstan apart on +7', () => {
    expect(detectCountry('+7 999 123 45 67')?.country.iso).toBe('RU')
    expect(detectCountry('+7 701 123 45 67')?.country.iso).toBe('KZ')
    // Partial numbers: decided by the first national digit.
    expect(detectCountry('+7 9')?.country.iso).toBe('RU')
    expect(detectCountry('+7 7')?.country.iso).toBe('KZ')
    expect(detectCountry('+7')?.country.iso).toBe('RU')
  })

  it('returns null for countries MAX does not support', () => {
    expect(detectCountry('+44 20 7946 0958')).toBeNull()
  })
})
