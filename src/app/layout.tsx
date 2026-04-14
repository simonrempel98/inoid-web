import type { Metadata } from "next";
import "./globals.css";
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: "INOid – Asset Management",
  description: "Digitales Asset Management für Maschinenkomponenten | INOMETA GmbH",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'INOid',
    startupImage: [
      { url: '/icons/apple-touch-icon.png' },
    ],
  },
  icons: {
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',        // iPhone X Notch / Dynamic Island
  themeColor: '#003366',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Blocking script: liest Theme aus localStorage und setzt Attribut auf <html>
            BEVOR der Browser rendert → verhindert Flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `
(function(){try{
  var ds=localStorage.getItem('ds-theme');
  if(ds==='light'||ds==='dark')document.documentElement.setAttribute('data-ds-theme',ds);
  var adm=localStorage.getItem('admin-theme');
  if(adm==='light'||adm==='dark')document.documentElement.setAttribute('data-admin-theme',adm);
}catch(e){}}())
        ` }} />
      </head>
      <body style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
