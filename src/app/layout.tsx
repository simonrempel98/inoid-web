import type { Metadata } from "next";
import "./globals.css";
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: "INOid – Asset Management",
  description: "Digitales Asset Management für Maschinenkomponenten | INOMETA GmbH",
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
