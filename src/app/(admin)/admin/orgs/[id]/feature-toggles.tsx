'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Feature = {
  key: string
  label: string
  desc: string
}

const FEATURES: Feature[] = [
  { key: 'serviceheft', label: 'Serviceheft', desc: 'Serviceeinträge & Dokumentation pro Asset' },
  { key: 'wartung',     label: 'Wartung',     desc: 'Wartungspläne, Aufgaben & Gantt-Chart' },
  { key: 'teamchat',    label: 'Team-Chat',   desc: 'Team-interne Nachrichten mit Asset-Erwähnungen (30 Tage Verlauf)' },
]

export function FeatureToggles({ orgId, features }: {
  orgId: string
  features: Record<string, boolean>
}) {
  const router = useRouter()
  const [current, setCurrent] = useState<Record<string, boolean>>(features)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggle(key: string) {
    const newVal = current[key] === false ? true : false
    const next = { ...current, [key]: newVal }
    setSaving(key)
    setError(null)

    const res = await fetch(`/api/admin/orgs/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: next }),
    })

    setSaving(null)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Fehler')
      return
    }
    setCurrent(next)
    router.refresh()
  }

  return (
    <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', overflow: 'hidden', marginTop: 20 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--adm-border)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', margin: 0 }}>Features</h2>
      </div>
      {FEATURES.map(f => {
        const enabled = current[f.key] !== false
        const isSaving = saving === f.key
        return (
          <div key={f.key} style={{
            padding: '14px 20px', borderBottom: '1px solid var(--adm-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: 'var(--adm-text)' }}>{f.label}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text3)' }}>{f.desc}</p>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => toggle(f.key)}
              style={{
                width: 48, height: 26, borderRadius: 13,
                background: enabled ? '#0099cc' : 'var(--adm-border2)',
                border: 'none', cursor: isSaving ? 'default' : 'pointer',
                position: 'relative', flexShrink: 0,
                transition: 'background 0.2s',
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              <span style={{
                position: 'absolute', top: 3,
                left: enabled ? 26 : 3,
                width: 20, height: 20, borderRadius: '50%',
                background: 'white',
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        )
      })}
      {error && (
        <p style={{ padding: '10px 20px', margin: 0, fontSize: 12, color: '#f87171' }}>{error}</p>
      )}
    </div>
  )
}
