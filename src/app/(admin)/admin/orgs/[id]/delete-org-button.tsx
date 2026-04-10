'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPinModal } from '@/components/admin/admin-pin-modal'

export function DeleteOrgButton({ orgId, orgName }: { orgId: string; orgName: string }) {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    const res = await fetch(`/api/admin/orgs/${orgId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Fehler beim Löschen')
    router.push('/admin/orgs')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setShowWarning(true)}
        style={{
          background: 'transparent', color: '#ef4444',
          border: '1px solid #ef4444', padding: '10px 20px',
          borderRadius: 50, fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Arial, sans-serif',
        }}
      >
        Organisation löschen
      </button>

      {showWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowWarning(false) }}
        >
          <div style={{
            background: 'var(--adm-surface)', borderRadius: 16,
            border: '1px solid var(--adm-border2)', padding: '28px',
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
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--adm-text)' }}>
                  „{orgName}" löschen?
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text3)' }}>Diese Aktion ist unwiderruflich</p>
              </div>
            </div>

            <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: '#fca5a5', fontWeight: 700 }}>Folgendes wird permanent gelöscht:</p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', color: '#fca5a5', fontSize: 12, lineHeight: 1.8 }}>
                <li>Alle Assets, Bilder und Dokumente (Storage)</li>
                <li>Alle Serviceheft-Einträge und Wartungspläne</li>
                <li>Alle Nutzer dieser Organisation (Auth + Profile)</li>
                <li>Alle Rollen, Teams und Standorte</li>
                <li>Alle Rechnungen</li>
              </ul>
            </div>

            {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowWarning(false); setShowPin(true) }}
                style={{
                  flex: 1, background: '#dc2626', color: 'white',
                  border: 'none', padding: '12px', borderRadius: 8,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                Weiter → PIN eingeben
              </button>
              <button
                onClick={() => setShowWarning(false)}
                style={{
                  flex: 1, background: 'transparent', color: 'var(--adm-text2)',
                  border: '1px solid var(--adm-border2)', padding: '12px', borderRadius: 8,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {showPin && (
        <AdminPinModal
          title="Admin-PIN eingeben"
          description={`Bestätige das Löschen von „${orgName}" mit deinem 4-stelligen Admin-PIN.`}
          danger
          onConfirm={async () => {
            await handleDelete()
          }}
          onCancel={() => setShowPin(false)}
        />
      )}
    </>
  )
}
