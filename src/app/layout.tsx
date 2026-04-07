import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "INOid – Asset Management",
  description: "Digitales Asset Management für Maschinenkomponenten | INOMETA GmbH",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
