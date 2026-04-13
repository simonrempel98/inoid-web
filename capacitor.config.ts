import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.inoid.mobile',
  appName: 'INOid',
  webDir: 'out',

  // ── Produktiv: Live-URL laden (empfohlen für Next.js App Router) ──────────
  // Im App-Store-Release wird die Live-URL verwendet — kein static export nötig,
  // alle Server Components + API Routes funktionieren weiterhin.
  server: {
    url: 'https://www.inoid.app',
    cleartext: false,
    // Für lokale Entwicklung auskommentieren und eigene IP einsetzen:
    // url: 'http://192.168.x.x:3000',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#003366',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#003366',
    },
  },

  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    },
    backgroundColor: '#003366',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#003366',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
    // Associated Domains für Universal Links (ermöglicht Deep-Links)
    // Muss in Apple Developer Portal + App-Entitlements konfiguriert werden:
    // appclips: false,
  },
}

export default config
