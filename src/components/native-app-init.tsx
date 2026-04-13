'use client'

import { useEffect } from 'react'

/**
 * Wird einmalig im Dashboard-Layout gemountet.
 * Initialisiert native Features wenn die App in Capacitor läuft.
 * Im Browser passiert nichts.
 */
export function NativeAppInit() {
  useEffect(() => {
    async function init() {
      const { isNativeApp, setStatusBarDark, requestPushPermission } = await import('@/lib/native')
      if (!isNativeApp()) return

      // Status-Bar auf INOid-Blau setzen
      await setStatusBarDark()

      // Push-Notifications anfordern (nach kurzem Delay damit UI fertig ist)
      setTimeout(async () => {
        await requestPushPermission()
      }, 2000)
    }
    init()
  }, [])

  return null
}
