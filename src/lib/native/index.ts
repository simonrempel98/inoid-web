/**
 * Native-Bridge für Capacitor-Features
 * Alle Funktionen fallen gracefully auf Web-Fallbacks zurück
 * wenn sie im Browser (nicht in der nativen App) laufen.
 */

// ── Erkennung ob wir in der nativen App laufen ───────────────────────────────
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.()
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web'
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor
  const p = cap?.getPlatform?.()
  if (p === 'ios') return 'ios'
  if (p === 'android') return 'android'
  return 'web'
}

// ── Haptisches Feedback ───────────────────────────────────────────────────────
export async function hapticSuccess() {
  if (!isNativeApp()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Medium })
  } catch { /* ignore */ }
}

export async function hapticError() {
  if (!isNativeApp()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Heavy })
  } catch { /* ignore */ }
}

// ── Push-Notifications ────────────────────────────────────────────────────────
export async function requestPushPermission(): Promise<boolean> {
  if (!isNativeApp()) return false
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const result = await PushNotifications.requestPermissions()
    if (result.receive === 'granted') {
      await PushNotifications.register()
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function onPushToken(callback: (token: string) => void) {
  if (!isNativeApp()) return
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    await PushNotifications.addListener('registration', ({ value }) => callback(value))
  } catch { /* ignore */ }
}

// ── Status-Bar ────────────────────────────────────────────────────────────────
export async function setStatusBarDark() {
  if (!isNativeApp()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#003366' })
  } catch { /* ignore */ }
}
