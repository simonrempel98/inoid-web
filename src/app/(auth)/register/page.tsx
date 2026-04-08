'use client'

import Link from 'next/link'
import { Mail, Lock, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f4f6f9',
      fontFamily: 'Arial, sans-serif',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'white',
        borderRadius: 20,
        padding: '40px 32px',
        boxShadow: '0 4px 24px rgba(0,51,102,0.10)',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#003366', letterSpacing: 1 }}>INO<span style={{ color: '#0099cc' }}>id</span></div>
        </div>

        {/* Lock icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#f0f6ff', border: '2px solid #c8d4e8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Lock size={28} color="#003366" />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#000', margin: '0 0 10px' }}>
          Zugang auf Einladung
        </h1>

        <p style={{ fontSize: 14, color: '#555', margin: '0 0 28px', lineHeight: 1.6 }}>
          INOid ist aktuell nur auf Einladung verfügbar.
          Für einen Account wenden Sie sich bitte direkt an uns.
        </p>

        {/* Contact box */}
        <a
          href="mailto:srl@inometa.de"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: '#003366',
            color: 'white',
            borderRadius: 50,
            padding: '14px 24px',
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          <Mail size={18} />
          srl@inometa.de schreiben
        </a>

        <p style={{ fontSize: 12, color: '#96aed2', margin: '0 0 28px', lineHeight: 1.5 }}>
          Wir richten Ihren Account ein und senden Ihnen die Zugangsdaten zu.
        </p>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #e8eef6', paddingTop: 20 }}>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#003366',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            Zurück zum Login
          </Link>
        </div>
      </div>
    </div>
  )
}
