'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddTeamMemberForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), fullName: fullName.trim(), tempPassword }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Fehler'); return }
    setOpen(false)
    setEmail(''); setFullName(''); setTempPassword('')
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--adm-border2)', background: 'var(--adm-input-bg)', color: 'var(--adm-text)',
    fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: '#003366', color: 'white',
          padding: '10px 20px', borderRadius: 50, border: 'none',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        + Teammitglied einladen
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
            background: 'var(--adm-surface)', borderRadius: 16,
            border: '1px solid var(--adm-border2)', padding: '28px',
            width: '100%', maxWidth: 440,
          }}>
            <p style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: 'var(--adm-text)' }}>
              Neues Teammitglied
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  E-Mail *
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="kollege@inometa.de" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Name
                </label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} placeholder="Max Mustermann" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Temporäres Passwort *
                </label>
                <input value={tempPassword} onChange={e => setTempPassword(e.target.value)} required style={inputStyle} placeholder="Min. 8 Zeichen" />
                <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--adm-text4)' }}>
                  Erhält vollen Platform-Admin-Zugang. Muss Passwort beim ersten Login ändern.
                </p>
              </div>

              {error && <p style={{ margin: 0, fontSize: 13, color: '#f87171' }}>{error}</p>}

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1, background: loading ? 'var(--adm-border2)' : '#003366', color: 'white',
                    border: 'none', padding: '12px', borderRadius: 8,
                    fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                    fontFamily: 'Arial, sans-serif',
                  }}
                >
                  {loading ? 'Wird angelegt…' : 'Anlegen'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
            </form>
          </div>
        </div>
      )}
    </>
  )
}
