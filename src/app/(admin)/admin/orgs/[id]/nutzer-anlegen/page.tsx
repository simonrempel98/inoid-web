'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OrgNutzerAnlegenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orgId } = use(params)
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [appRole, setAppRole] = useState<'viewer' | 'technician' | 'admin' | 'superadmin'>('viewer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (tempPassword.length < 8) { setError('Passwort mind. 8 Zeichen'); return }
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/orgs/${orgId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), fullName: fullName.trim(), tempPassword, appRole }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Fehler'); return }

    router.push(`/admin/orgs/${orgId}`)
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--adm-border2)', background: 'var(--adm-input-bg)', color: 'var(--adm-text)',
    fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-text2)',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
  }
  const ROLES = [
    { value: 'viewer',      label: 'Leser',      bg: '#2d1a0e', text: '#cd7f32', desc: 'Nur lesen, keine Änderungen.' },
    { value: 'technician',  label: 'Techniker',  bg: '#1e2330', text: '#a8b2c0', desc: 'Assets bearbeiten, Serviceeinträge erfassen.' },
    { value: 'admin',       label: 'Admin',      bg: '#2a2000', text: '#ffd700', desc: 'Verwaltet Assets, Teams und Mitglieder.' },
    { value: 'superadmin',  label: 'Superadmin', bg: '#2d1b69', text: '#a78bfa', desc: 'Vollzugriff auf die gesamte Organisation.' },
  ] as const

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href={`/admin/orgs/${orgId}`} style={{ color: 'var(--adm-text3)', fontSize: 13, textDecoration: 'none' }}>
          ← Zurück zur Organisation
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--adm-text)', margin: '8px 0 4px' }}>Nutzer anlegen</h1>
        <p style={{ fontSize: 13, color: 'var(--adm-text3)', margin: 0 }}>
          Neuer Nutzer wird dieser Organisation zugeordnet
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>E-Mail *</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nutzer@firma.de" required style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Max Mustermann" style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Temporäres Passwort *</label>
            <input
              value={tempPassword}
              onChange={e => setTempPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen" required style={inputStyle}
            />
            <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--adm-text4)' }}>
              Nutzer muss es beim ersten Login ändern.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Rolle</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ROLES.map(r => (
                <button
                  key={r.value} type="button"
                  onClick={() => setAppRole(r.value)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Arial, sans-serif',
                    background: appRole === r.value ? r.bg : 'var(--adm-border)',
                    color: appRole === r.value ? r.text : 'var(--adm-text4)',
                    outline: appRole === r.value ? `2px solid ${r.text}` : 'none',
                    outlineOffset: 1,
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--adm-text4)' }}>
              {ROLES.find(r => r.value === appRole)?.desc}
            </p>
          </div>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit" disabled={loading}
            style={{
              background: loading ? 'var(--adm-border2)' : '#003366', color: 'white',
              padding: '12px 28px', borderRadius: 50, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {loading ? 'Wird angelegt…' : 'Nutzer anlegen'}
          </button>
          <button
            type="button" onClick={() => router.back()}
            style={{
              background: 'transparent', color: 'var(--adm-text2)',
              padding: '12px 20px', borderRadius: 50, border: '1px solid var(--adm-border2)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}
