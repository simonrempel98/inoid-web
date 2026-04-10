'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SIZE_OPTIONS = [
  { label: '1 MB',      mb: 1   },
  { label: '5 MB',      mb: 5   },
  { label: '10 MB',     mb: 10  },
  { label: '25 MB',     mb: 25  },
  { label: '50 MB',     mb: 50  },
  { label: '100 MB',    mb: 100 },
  { label: 'Unbegrenzt', mb: 0  },
]

export function DocumentUploadSettings({ orgId, settings }: {
  orgId: string
  settings: Record<string, unknown> | null
}) {
  const router = useRouter()
  const initMax = (settings?.doc_max_size_mb as number) ?? 10

  const [maxMb, setMaxMb] = useState(initMax)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setSaved(false)
    setError(null)
    const res = await fetch(`/api/admin/orgs/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: { ...(settings ?? {}), doc_max_size_mb: maxMb },
      }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Fehler'); return }
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid #374151', background: '#0a0f1e', color: 'white',
    fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ background: '#111827', borderRadius: 14, border: '1px solid #1f2937', overflow: 'hidden', marginTop: 16 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1f2937' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: 0 }}>Dokument-Uploads</h2>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
          Maximale Dateigröße beim Upload für diese Organisation
        </p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* PDF-Komprimierung Info */}
        <div style={{ background: '#0c2340', border: '1px solid #1e3a5f', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>PDF-Komprimierung aktiv</p>
          <p style={{ margin: 0, fontSize: 12, color: '#4b7099' }}>
            PDFs die größer als 1 MB sind werden beim Upload automatisch komprimiert (Textebene bleibt erhalten). Das gilt plattformweit für alle Organisationen.
          </p>
        </div>

        {/* Max. Dateigröße */}
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Max. Dateigröße (alle Dokument-Formate)
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {SIZE_OPTIONS.map(opt => (
            <button
              key={opt.mb}
              type="button"
              onClick={() => setMaxMb(opt.mb)}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontFamily: 'Arial, sans-serif',
                fontSize: 13, fontWeight: 700,
                background: maxMb === opt.mb ? '#1e3a5f' : '#1f2937',
                color:      maxMb === opt.mb ? '#60a5fa' : '#6b7280',
                outline:    maxMb === opt.mb ? '2px solid #60a5fa' : 'none',
                outlineOffset: 1,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {maxMb === 0 && (
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#d97706', background: '#451a03', padding: '8px 12px', borderRadius: 8 }}>
            Achtung: Ohne Limit können beliebig große Dateien hochgeladen werden.
          </p>
        )}

        {error && <p style={{ color: '#f87171', fontSize: 12, margin: '0 0 12px' }}>{error}</p>}

        <button type="button" onClick={save} disabled={saving} style={{
          background: saving ? '#374151' : '#003366', color: 'white',
          padding: '10px 24px', borderRadius: 50, border: 'none',
          fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
          fontFamily: 'Arial, sans-serif',
        }}>
          {saving ? 'Speichert…' : saved ? '✓ Gespeichert' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
