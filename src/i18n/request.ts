import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { LOCALES, type Locale } from './config'

export { LOCALES, LOCALE_NAMES, type Locale } from './config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get('inoid-locale')?.value ?? 'de'
  const locale: Locale = (LOCALES as readonly string[]).includes(raw) ? raw as Locale : 'de'

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
