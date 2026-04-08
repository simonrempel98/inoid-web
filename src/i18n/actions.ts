'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { LOCALES, type Locale } from './config'

export async function setLocale(locale: string) {
  const valid: Locale = (LOCALES as readonly string[]).includes(locale) ? locale as Locale : 'de'
  const cookieStore = await cookies()
  cookieStore.set('inoid-locale', valid, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 Jahr
    sameSite: 'lax',
  })
  revalidatePath('/', 'layout')
}
