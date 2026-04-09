'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPinModal } from '@/components/admin/admin-pin-modal'

export function OrgStorageNukeButton({ orgId, orgName }: { orgId: string; orgName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const nameMatches = confirmName.trim() === orgName.trim()

  async function handleNuke() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/storage/orgs/${orgId}`, { method: 'DELETE' })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) throw new Error(data.error ?? 'Fehler')
    setDone(data.deleted ?? 0)
    setOpen(false)
    router.refresh()
  }

  if (done !== null) {
    return <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>✓ {done} Dateien gelöscht</span>
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, color: '#6b7280', textDecoration: 'underline',
          fontFamily: 'Arial, sans-serif', padding: 0,
        }}
      >
        Storage löschen
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setOpen(false)}>
          <div style={{
            background: '#111827', borderRadius: 16,
            border: '1px solid #374151', padding: '28px',
            width: 400, maxWidth: '90vw',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: 'white' }}>
              Storage löschen
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>
              Alle Bilder und Dokumente von <span style={{ color: '#f87171', fontWeight: 700 }}>{orgName}</span> werden
              unwiderruflich aus dem Storage gelöscht. Datenbankeinträge bleiben erhalten.
            </p>

            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Organisationsname eingeben zur Bestätigung
            </label>
            <input
              value={confirmName}
              onChange={e => setConfirmName(e.target.value)}
              placeholder={orgName}
              autoFocus
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: `1px solid ${nameMatches ? '#22c55e' : '#374151'}`,
                background: '#0a0f1e', color: 'white',
                fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none',
                boxSizing: 'border-box', marginBottom: 20,
              }}
            />

            {error && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                disabled={!nameMatches || loading}
                onClick={() => { setOpen(false); setShowPin(true) }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  background: nameMatches ? '#7f1d1d' : '#374151',
                  color: nameMatches ? '#fca5a5' : '#6b7280',
                  fontSize: 13, fontWeight: 700, cursor: nameMatches ? 'pointer' : 'not-allowed',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {loading ? 'Lösche…' : 'Weiter →'}
              </button>
              <button
                onClick={() => { setOpen(false); setConfirmName('') }}
                style={{
                  padding: '10px 16px', borderRadius: 8,
                  border: '1px solid #374151', background: 'transparent',
                  color: '#9ca3af', fontSize: 13, cursor: 'pointer',
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
          title={`Storage löschen – ${orgName}`}
          description={`Alle Dateien dieser Organisation werden unwiderruflich aus dem Storage gelöscht.`}
          danger
          onConfirm={async () => {
            setShowPin(false)
            await handleNuke()
          }}
          onCancel={() => { setShowPin(false); setConfirmName('') }}
        />
      )}
    </>
  )
}
