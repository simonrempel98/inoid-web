'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteOrgButton({ orgId, orgName }: { orgId: string; orgName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (confirm !== orgName) return
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/orgs/${orgId}`, { method: 'DELETE' })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Löschen')
      setLoading(false)
      return
    }

    router.push('/admin/orgs')
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #374151', background: '#0a0f1e', color: 'white',
    fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none',
    boxSizing: 'border-box', marginTop: 8,
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'transparent', color: '#ef4444',
          border: '1px solid #ef4444', padding: '10px 20px',
          borderRadius: 50, fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Arial, sans-serif',
        }}
      >
        Organisation löschen
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{
            background: '#111827', borderRadius: 16,
            border: '1px solid #374151', padding: '28px',
            width: '100%', maxWidth: 480,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: '#450a0a', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'white' }}>Organisation unwiderruflich löschen</p>
                <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Diese Aktion kann nicht rückgängig gemacht werden</p>
              </div>
            </div>

            <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#fca5a5', lineHeight: 1.6 }}>
                Folgendes wird <strong>permanent</strong> gelöscht:
              </p>
              <ul style={{ margin: '8px 0 0', padding: '0 0 0 16px', color: '#fca5a5', fontSize: 12, lineHeight: 1.8 }}>
                <li>Alle Assets und ihre Metadaten</li>
                <li>Alle hochgeladenen Bilder und Dokumente (Storage)</li>
                <li>Alle Serviceheft-Einträge und Wartungspläne</li>
                <li>Alle Nutzer dieser Organisation (Auth + Profile)</li>
                <li>Alle Rollen, Teams und Standorte</li>
                <li>Alle Rechnungen und Audit-Logs der Org</li>
              </ul>
            </div>

            <p style={{ margin: '0 0 6px', fontSize: 13, color: '#9ca3af' }}>
              Zur Bestätigung den Namen der Organisation eingeben:
              <br />
              <strong style={{ color: 'white' }}>{orgName}</strong>
            </p>
            <input
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={orgName}
              style={inputStyle}
              autoFocus
            />

            {error && (
              <p style={{ margin: '10px 0 0', fontSize: 13, color: '#f87171' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={handleDelete}
                disabled={confirm !== orgName || loading}
                style={{
                  flex: 1, background: confirm === orgName && !loading ? '#dc2626' : '#374151',
                  color: 'white', border: 'none', padding: '12px',
                  borderRadius: 8, fontSize: 14, fontWeight: 700,
                  cursor: confirm === orgName && !loading ? 'pointer' : 'default',
                  fontFamily: 'Arial, sans-serif',
                  transition: 'background 0.15s',
                }}
              >
                {loading ? 'Wird gelöscht…' : 'Endgültig löschen'}
              </button>
              <button
                onClick={() => { setOpen(false); setConfirm('') }}
                disabled={loading}
                style={{
                  flex: 1, background: 'transparent', color: '#9ca3af',
                  border: '1px solid #374151', padding: '12px',
                  borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Arial, sans-serif',
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
