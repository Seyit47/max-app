export interface Country {
  /** ISO 3166-1 alpha-2 */
  iso: string
  name: string
  /** Digits of the calling code. NANP members include their area code (e.g. "1473"). */
  dialCode: string
  /** Length range of the national mobile number (digits after the dial code). */
  minLength: number
  maxLength: number
  /** Display mask per national-number length; "#" is a digit. */
  formats: Readonly<Record<number, string>>
  /** A valid mobile number, national part only; used as the placeholder. */
  example: string
  /** Domestic trunk prefixes people type before the national number (Russia "8 999…"), longest first. */
  trunkPrefixes: readonly string[]
  /**
   * Regex source for valid mobile numbers. Matched against the national number, prefixed with
   * the area code for NANP members (e.g. "473" + 7 digits for Grenada).
   */
  mobile: string
}

/**
 * Countries whose phone numbers can register in MAX: the list of 40 published with the
 * 5 March 2026 expansion (Russia and Belarus first, as in MAX, then alphabetical).
 *
 * Lengths, formats, examples and mobile patterns are generated from libphonenumber metadata
 * (libphonenumber-js 1.13.14, mobile type). MAX signs users up by SMS, so only mobile ranges apply.
 */
export const COUNTRIES: readonly Country[] = [
  {
    iso: 'RU', name: 'Russia', dialCode: '7', minLength: 10, maxLength: 10,
    formats: { 10: '### ###-##-##' }, example: '9123456789',
    trunkPrefixes: ['8'],
    mobile: '9\\d{9}',
  },
  {
    iso: 'BY', name: 'Belarus', dialCode: '375', minLength: 9, maxLength: 9,
    formats: { 9: '## ###-##-##' }, example: '294911911',
    trunkPrefixes: ['80', '8', '0'],
    mobile: '(?:2(?:5[5-79]|9[1-9])|(?:33|44)\\d)\\d{6}',
  },
  {
    iso: 'AF', name: 'Afghanistan', dialCode: '93', minLength: 9, maxLength: 9,
    formats: { 9: '## ### ####' }, example: '701234567',
    trunkPrefixes: ['0'],
    mobile: '7\\d{8}',
  },
  {
    iso: 'AM', name: 'Armenia', dialCode: '374', minLength: 8, maxLength: 8,
    formats: { 8: '## ######' }, example: '77123456',
    trunkPrefixes: ['0'],
    mobile: '(?:33|4[1349]|55|77|88|9[13-9])\\d{6}',
  },
  {
    iso: 'AZ', name: 'Azerbaijan', dialCode: '994', minLength: 9, maxLength: 9,
    formats: { 9: '## ### ## ##' }, example: '401234567',
    trunkPrefixes: ['0'],
    mobile: '36554\\d{4}|(?:[16]0|4[04]|5[015]|7[07]|99)\\d{7}',
  },
  {
    iso: 'BO', name: 'Bolivia', dialCode: '591', minLength: 8, maxLength: 8,
    formats: { 8: '########' }, example: '71234567',
    trunkPrefixes: ['0'],
    mobile: '(?:57|[67]\\d)\\d{6}',
  },
  {
    iso: 'KH', name: 'Cambodia', dialCode: '855', minLength: 8, maxLength: 9,
    formats: { 8: '## ### ###', 9: '## ### ####' }, example: '91234567',
    trunkPrefixes: ['0'],
    mobile: '(?:(?:1[28]|3[18]|9[67])\\d|6[016-9]|7(?:[07-9]|[16]\\d)|8(?:[013-79]|8\\d))\\d{6}|(?:1\\d|9[0-57-9])\\d{6}|(?:2[3-6]|3[2-6]|4[2-4]|[5-7][2-5])48\\d{5}',
  },
  {
    iso: 'CO', name: 'Colombia', dialCode: '57', minLength: 10, maxLength: 10,
    formats: { 10: '### #######' }, example: '3211234567',
    trunkPrefixes: ['0'],
    mobile: '333301[0-5]\\d{3}|3333(?:00|2[5-9]|[3-9]\\d)\\d{4}|(?:3(?:(?:0[0-5]|1\\d|5[01]|70)\\d|2(?:[0-3]\\d|4[1-9])|3(?:00|3[0-24-9]))|9(?:101|408))\\d{6}',
  },
  {
    iso: 'CG', name: 'Congo', dialCode: '242', minLength: 9, maxLength: 9,
    formats: { 9: '## ### ####' }, example: '061234567',
    trunkPrefixes: [],
    mobile: '026(?:1[0-5]|6[6-9])\\d{4}|0(?:[14-6]\\d\\d|2(?:40|5[5-8]|6[07-9]))\\d{5}',
  },
  {
    iso: 'CD', name: 'Congo (DRC)', dialCode: '243', minLength: 7, maxLength: 9,
    formats: { 7: '#######', 9: '### ### ###' }, example: '991234567',
    trunkPrefixes: ['0'],
    mobile: '88\\d{5}|(?:8[0-79]|9[016-9])\\d{7}',
  },
  {
    iso: 'CU', name: 'Cuba', dialCode: '53', minLength: 8, maxLength: 8,
    formats: { 8: '# #######' }, example: '51234567',
    trunkPrefixes: ['0'],
    mobile: '(?:5\\d|6[2-4])\\d{6}',
  },
  {
    iso: 'GM', name: 'Gambia', dialCode: '220', minLength: 7, maxLength: 9,
    formats: { 7: '### ####', 9: '#########' }, example: '3012345',
    trunkPrefixes: [],
    mobile: '(?:(?:[23679]\\d|4[015]|8(?:(?:3[35]|6[68]|99)\\d|7(?:[27]\\d|4[015])))\\d|5(?:[0-489]\\d|56))\\d{4}|8[4-7]\\d{5}',
  },
  {
    iso: 'GE', name: 'Georgia', dialCode: '995', minLength: 9, maxLength: 9,
    formats: { 9: '### ## ## ##' }, example: '555123456',
    trunkPrefixes: ['0'],
    mobile: '5(?:(?:(?:0555|1(?:[17]77|555))[5-9]|757(?:7[7-9]|8[01]))\\d|22252[0-4])\\d\\d|5(?:0(?:0(?:1[09]|70)|505)|1(?:0[01]0|1(?:07|33|51))|2(?:0[02]0|2[25]2)|3(?:0[03]0|3[35]3)|4(?:0[04]0|411)|5222|9000)[0-4]\\d{3}|(?:5(?:0(?:0(?:0\\d|1[12]|2[02]|3[0-6]|4[04]|5[05]|77|88|9[09])|(?:[14]\\d|77)\\d|22[02])|1(?:1(?:[03][01]|[124]\\d|5[02-6]|7[0-6])|4\\d\\d)|2(?:228|555)|3555|4(?:4(?:[02-9]\\d|14)|555)|5(?:[0157-9]\\d\\d|200|333|4(?:44|55))|6[89]\\d\\d|7(?:(?:[0147-9]\\d|22)\\d|5(?:00|[57]5))|8(?:0(?:[018]\\d|2[0-4])|5(?:55|8[89])|8(?:55|88))|9(?:090|[1-35-9]\\d\\d))|790\\d\\d)\\d{4}',
  },
  {
    iso: 'GD', name: 'Grenada', dialCode: '1473', minLength: 7, maxLength: 7,
    formats: { 7: '###-####' }, example: '4031234',
    trunkPrefixes: [],
    mobile: '473(?:4(?:0[2-79]|1[04-9]|2[0-5]|49|5[6-8])|5(?:2[01]|3[3-8])|901)\\d{4}',
  },
  {
    iso: 'IN', name: 'India', dialCode: '91', minLength: 10, maxLength: 10,
    formats: { 10: '##### #####' }, example: '8123456789',
    trunkPrefixes: ['0'],
    mobile: '(?:6(?:1279|828[01489])|7(?:887[02-9]|9313)|8(?:079[04-9]|(?:84|91)7[02-8]))\\d{5}|(?:160[01]|6(?:(?:12|[2-4]1|5[17]|6[13]|80)[0189]|7(?:1[0189]|86))|7(?:1(?:2[0189]|9[0-5])|3(?:2[5-8]|[34][017-9]|9[016-9])|5(?:[15][017-9]|2[04-9]|9[7-9])|6(?:0[0-47]|1[0-257-9]|2[0-4]|3[19]|5[4589])|70[0289]|88[089])|8(?:0(?:6[67]|7[02-8])|70[017-9]|84[01489]|91[0-289]))\\d{6}|(?:731|8(?:16|2[014]|3[126]|6[136]|7[78]|83))(?:[0189]\\d|7[02-8])\\d{5}|(?:6(?:(?:1[1358]|2[2457]|3[2-4]|4[235-7]|5[2-689]|6[24578])\\d|7(?:[23569]\\d|4[0189]|8[0-57-9])|8(?:[14-6]\\d|2[0-79]))|7(?:1(?:[013-8]\\d|9[6-9])|3(?:2[0-49]|9[2-5])|5(?:2[1-3]|9[0-6])|6(?:0[5689]|2[5-9]|3[02-8]|4\\d|5[0-367])|70[13-7]|881))[0189]\\d{5}|(?:6(?:[09]\\d|1[04679]|2[03689]|3[05-9]|4[0489]|50|6[069]|7[07]|8[7-9])|7(?:[024]\\d|3[05-8]|5[0346-8]|6[6-9]|7[1-9]|8[0-79]|9[07-9])|8(?:0[01589]|1[0-57-9]|2[235-9]|3[03-57-9]|[45]\\d|6[02457-9]|7[1-69]|8[0-25-9]|9[02-9])|9\\d\\d)\\d{7}',
  },
  {
    iso: 'ID', name: 'Indonesia', dialCode: '62', minLength: 9, maxLength: 12,
    formats: { 9: '###-###-###', 10: '###-####-###', 11: '###-####-####', 12: '###-####-#####' }, example: '812345678',
    trunkPrefixes: ['0'],
    mobile: '8[1-35-9]\\d{7,10}',
  },
  {
    iso: 'IQ', name: 'Iraq', dialCode: '964', minLength: 10, maxLength: 10,
    formats: { 10: '### ### ####' }, example: '7912345678',
    trunkPrefixes: ['0'],
    mobile: '7[3-9]\\d{8}',
  },
  {
    iso: 'KZ', name: 'Kazakhstan', dialCode: '7', minLength: 10, maxLength: 10,
    formats: { 10: '### ### ####' }, example: '7710009998',
    trunkPrefixes: ['8'],
    mobile: '7(?:0[0-25-8]|47|6[0-4]|7[15-8]|85)\\d{7}',
  },
  {
    iso: 'KW', name: 'Kuwait', dialCode: '965', minLength: 8, maxLength: 8,
    formats: { 8: '### #####' }, example: '50012345',
    trunkPrefixes: [],
    mobile: '(?:41\\d\\d|5(?:(?:[05]\\d|1[0-7]|6[56])\\d|2(?:22|5[25])|7(?:55|77)|88[58])|6(?:(?:0[034679]|5[015-9]|6\\d)\\d|1(?:00|11|6[16])|2[26]2|3[36]3|4[46]4|7(?:0[013-9]|[67]\\d)|8[68]8|9(?:[069]\\d|3[039]))|9(?:(?:[04679]\\d|8[057-9])\\d|1(?:00|1[01]|99)|2(?:00|2\\d)|3(?:00|3[03])|5(?:00|5\\d)))\\d{4}',
  },
  {
    iso: 'KG', name: 'Kyrgyzstan', dialCode: '996', minLength: 9, maxLength: 9,
    formats: { 9: '### ### ###' }, example: '700123456',
    trunkPrefixes: ['0'],
    mobile: '312(?:58\\d|973)\\d{3}|(?:2(?:0[0-35]|2\\d)|5[0-24-7]\\d|600|7(?:[07]\\d|55)|88[08]|9(?:12|9[05-9]))\\d{6}',
  },
  {
    iso: 'LA', name: 'Laos', dialCode: '856', minLength: 9, maxLength: 10,
    formats: { 9: '#########', 10: '## ## ### ###' }, example: '2023123456',
    trunkPrefixes: ['0'],
    mobile: '(?:20(?:[23579]\\d|8[78])|30[24]\\d)\\d{6}|30\\d{7}',
  },
  {
    iso: 'LB', name: 'Lebanon', dialCode: '961', minLength: 7, maxLength: 8,
    formats: { 7: '#######', 8: '## ### ###' }, example: '71123456',
    trunkPrefixes: ['0'],
    mobile: '(?:(?:3|81)\\d|7(?:[01]\\d|6[013-9]|8[7-9]|9[0-4]))\\d{5}',
  },
  {
    iso: 'MY', name: 'Malaysia', dialCode: '60', minLength: 9, maxLength: 10,
    formats: { 9: '##-### ####', 10: '##-#### ####' }, example: '123456789',
    trunkPrefixes: ['0'],
    mobile: '1(?:(?:1888[689]|4400|8(?:47|8[27])[0-4])\\d{4}|9\\d{7,8})|1(?:0(?:[23568]\\d|4[0-6]|7[016-9]|9[0-8])|1(?:[1-5]\\d\\d|6(?:0[5-9]|[1-9]\\d)|7(?:[0-4]\\d|5[0-79]|6[02-4]|8[02-5]))|(?:[26]\\d|[37][1-9]|4[235-9])\\d|5(?:31|9\\d\\d)|8(?:1[23]|[236]\\d|4[06]|5(?:46|[7-9])|7[016-9]|8[01]|9[0-8]))\\d{5}',
  },
  {
    iso: 'MD', name: 'Moldova', dialCode: '373', minLength: 8, maxLength: 8,
    formats: { 8: '### ## ###' }, example: '62112345',
    trunkPrefixes: ['0'],
    mobile: '562\\d{5}|(?:6\\d|7[16-9])\\d{6}',
  },
  {
    iso: 'MM', name: 'Myanmar', dialCode: '95', minLength: 7, maxLength: 10,
    formats: { 7: '#######', 8: '# ### ####', 9: '# ### #####', 10: '# ### ######' }, example: '92123456',
    trunkPrefixes: ['0'],
    mobile: '(?:17[01]|9(?:2(?:[0-4]|[56]\\d\\d)|(?:3(?:[0-36]|4\\d)|(?:6\\d|8[89]|9[4-8])\\d|7(?:3|40|[5-9]\\d))\\d|4(?:(?:[0245]\\d|[1379])\\d|88)|5[0-6])\\d)\\d{4}|9[69]1\\d{6}|9(?:[68]\\d|9[089])\\d{5}',
  },
  {
    iso: 'NI', name: 'Nicaragua', dialCode: '505', minLength: 8, maxLength: 8,
    formats: { 8: '#### ####' }, example: '81234567',
    trunkPrefixes: [],
    mobile: '(?:5(?:5[0-7]|[78]\\d)|6(?:20|3[035]|4[045]|5[05]|77|8[1-9]|9[059])|(?:7[5-8]|8\\d)\\d)\\d{5}',
  },
  {
    iso: 'PK', name: 'Pakistan', dialCode: '92', minLength: 10, maxLength: 10,
    formats: { 10: '### #######' }, example: '3012345678',
    trunkPrefixes: ['0'],
    mobile: '3(?:[0-247]\\d|3[0-79]|55|64)\\d{7}',
  },
  {
    iso: 'PW', name: 'Palau', dialCode: '680', minLength: 7, maxLength: 7,
    formats: { 7: '### ####' }, example: '6201234',
    trunkPrefixes: [],
    mobile: '(?:(?:46|83)[0-5]|(?:6[2-4689]|78)0)\\d{4}|(?:45|77|88)\\d{5}',
  },
  {
    iso: 'QA', name: 'Qatar', dialCode: '974', minLength: 8, maxLength: 8,
    formats: { 8: '#### ####' }, example: '33123456',
    trunkPrefixes: [],
    mobile: '[35-7]\\d{7}',
  },
  {
    iso: 'KN', name: 'Saint Kitts and Nevis', dialCode: '1869', minLength: 7, maxLength: 7,
    formats: { 7: '###-####' }, example: '7652917',
    trunkPrefixes: [],
    mobile: '869(?:48[89]|55[6-8]|66\\d|76[02-7])\\d{4}',
  },
  {
    iso: 'SA', name: 'Saudi Arabia', dialCode: '966', minLength: 9, maxLength: 9,
    formats: { 9: '## ### ####' }, example: '512345678',
    trunkPrefixes: ['0'],
    mobile: '579[0-8]\\d{5}|5(?:[013-689]\\d|7[0-8])\\d{6}',
  },
  {
    iso: 'TJ', name: 'Tajikistan', dialCode: '992', minLength: 9, maxLength: 9,
    formats: { 9: '## ### ####' }, example: '917123456',
    trunkPrefixes: [],
    mobile: '(?:33[03-9]|4(?:1[18]|4[02-479])|81[1-9])\\d{6}|(?:[09]\\d|1[0-27-9]|2[0-27]|3[08]|40|5[05]|66|7[0157-9]|8[07-9])\\d{7}',
  },
  {
    iso: 'TZ', name: 'Tanzania', dialCode: '255', minLength: 9, maxLength: 9,
    formats: { 9: '### ### ###' }, example: '621234567',
    trunkPrefixes: ['0'],
    mobile: '(?:6[0-35-9]|7\\d)\\d{7}',
  },
  {
    iso: 'TH', name: 'Thailand', dialCode: '66', minLength: 9, maxLength: 9,
    formats: { 9: '## ### ####' }, example: '812345678',
    trunkPrefixes: ['0'],
    mobile: '(?:(?:14|[89]\\d)\\d\\d|6(?:[1-6]\\d\\d|7(?:1[0-8]|2[4-7]|3[1-6])))\\d{5}',
  },
  {
    iso: 'TR', name: 'Turkey', dialCode: '90', minLength: 10, maxLength: 10,
    formats: { 10: '### ### ## ##' }, example: '5012345678',
    trunkPrefixes: ['0'],
    mobile: '5(?:61(?:011|61\\d)|82[2-5]\\d\\d)\\d{4}|5(?:[03-5]\\d|1[06]|24|6[24]|7[245]|9[46])\\d{7}',
  },
  {
    iso: 'TM', name: 'Turkmenistan', dialCode: '993', minLength: 8, maxLength: 8,
    formats: { 8: '## ######' }, example: '66123456',
    trunkPrefixes: ['8'],
    mobile: '(?:6\\d|7[12])\\d{6}',
  },
  {
    iso: 'AE', name: 'United Arab Emirates', dialCode: '971', minLength: 9, maxLength: 9,
    formats: { 9: '## ### ####' }, example: '501234567',
    trunkPrefixes: ['0'],
    mobile: '5[02-68]\\d{7}',
  },
  {
    iso: 'UZ', name: 'Uzbekistan', dialCode: '998', minLength: 9, maxLength: 9,
    formats: { 9: '## ### ## ##' }, example: '912345678',
    trunkPrefixes: [],
    mobile: '(?:(?:[25]0|33|8[078]|9[0-57-9])\\d{3}|6(?:1(?:2(?:2[01]|98)|35[0-4]|50\\d|61[23]|7(?:[01][017]|4\\d|55|9[5-9]))|2(?:(?:11|7\\d)\\d|2(?:[12]1|9[01379])|5(?:[126]\\d|3[0-4]))|5(?:19[01]|2(?:27|9[26])|(?:30|59|7\\d)\\d)|6(?:2(?:1[5-9]|2[0367]|38|41|52|60)|(?:3[79]|9[0-3])\\d|4(?:56|83)|7(?:[07]\\d|1[017]|3[07]|4[047]|5[057]|67|8[0178]|9[79]))|7(?:2(?:24|3[237]|4[5-9]|7[15-8])|5(?:7[12]|8[0589])|7(?:0\\d|[39][07])|9(?:0\\d|7[079])))|7(?:[07]\\d{3}|2(?:2(?:2[79]|95)|3(?:2[5-9]|6[0-6])|57\\d|7(?:0\\d|1[17]|2[27]|3[37]|44|5[057]|66|88))|3(?:2(?:1[0-6]|21|3[469]|7[159])|(?:33|9[4-6])\\d|5(?:0[0-4]|5[579]|9\\d)|7(?:[0-3579]\\d|4[0467]|6[67]|8[078]))|4(?:2(?:29|5[0257]|6[0-7]|7[1-57])|5(?:1[0-4]|8\\d|9[5-9])|7(?:0\\d|1[024589]|2[0-27]|3[0137]|[46][07]|5[01]|7[5-9]|9[079])|9(?:7[015-9]|[89]\\d))|5(?:112|2(?:0\\d|2[29]|[49]4)|3[1568]\\d|52[6-9]|7(?:0[01578]|1[017]|[23]7|4[047]|[5-7]\\d|8[78]|9[079]))|9(?:22[128]|3(?:2[0-4]|7\\d)|57[02569]|7(?:2[05-9]|3[37]|4\\d|60|7[2579]|87|9[07]))))\\d{4}',
  },
  {
    iso: 'VE', name: 'Venezuela', dialCode: '58', minLength: 10, maxLength: 10,
    formats: { 10: '###-#######' }, example: '4121234567',
    trunkPrefixes: ['0'],
    mobile: '4(?:1[24-8]|2[246])\\d{7}',
  },
  {
    iso: 'VN', name: 'Vietnam', dialCode: '84', minLength: 9, maxLength: 9,
    formats: { 9: '### ### ###' }, example: '912345678',
    trunkPrefixes: ['0'],
    mobile: '121[0-3]\\d{5}|(?:1[46]0|(?:3\\d|7[06-9])\\d|5(?:[1689]\\d|2[238]|59)|8(?:[1-8]\\d|9[6-9])|9(?:[0-8]\\d|9[013-9]))\\d{6}',
  },
]

export const DEFAULT_COUNTRY = COUNTRIES[0]

export function findCountry(iso: string): Country | undefined {
  return COUNTRIES.find((c) => c.iso === iso.toUpperCase())
}

/** "+7", "+375", and "+1 473" for NANP members. */
export function formatDialCode(c: Country): string {
  return c.dialCode.length === 4 && c.dialCode.startsWith('1') ? `+1 ${c.dialCode.slice(1)}` : `+${c.dialCode}`
}

/** Regional-indicator emoji; platforms without flag glyphs show the two letters instead. */
export function flagEmoji(iso: string): string {
  return String.fromCodePoint(...[...iso.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65))
}

/** Pick the browser's region when it's a MAX country, else Russia. */
export function guessCountry(locales: readonly string[] = typeof navigator !== 'undefined' ? navigator.languages : []): Country {
  for (const locale of locales) {
    const region = locale.split('-')[1]
    const match = region && findCountry(region)
    if (match) return match
  }
  return DEFAULT_COUNTRY
}
