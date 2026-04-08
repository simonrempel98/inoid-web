export const LOCALES = [
  'de', 'en', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'tr',
  'ru', 'uk', 'bg', 'ro', 'cs', 'sk', 'hu', 'hr', 'sr',
  'el', 'fi', 'sv', 'da', 'no', 'lt', 'lv', 'et', 'ja', 'zh',
] as const

export type Locale = typeof LOCALES[number]

export const LOCALE_NAMES: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  ru: 'Русский',
  uk: 'Українська',
  bg: 'Български',
  ro: 'Română',
  cs: 'Čeština',
  sk: 'Slovenčina',
  hu: 'Magyar',
  hr: 'Hrvatski',
  sr: 'Srpski',
  el: 'Ελληνικά',
  fi: 'Suomi',
  sv: 'Svenska',
  da: 'Dansk',
  no: 'Norsk',
  lt: 'Lietuvių',
  lv: 'Latviešu',
  et: 'Eesti',
  ja: '日本語',
  zh: '中文',
}
