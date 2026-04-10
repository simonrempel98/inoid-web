'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Org = {
  id: string
  name: string
  slug: string
  plan: string
  asset_limit: number
  user_limit: number | null
  is_active: boolean | null
  contact_email: string | null
  notes: string | null
}

export function OrgEditForm({ org }: { org: Org }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(org.name)
  const [plan, setPlan] = useState(org.plan)
  const [assetLimit, setAssetLimit] = useState(org.asset_limit)
  const [userLimit, setUserLimit] = useState(org.user_limit ?? 10)
  const [isActive, setIsActive] = useState(org.is_active !== false)
  const [contactEmail, setContactEmail] = useState(org.contact_email ?? '')
  const [notes, setNotes] = useState(org.notes ?? '')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const res = await fetch(`/api/admin/orgs/${org.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, plan, assetLimit, userLimit, isActive, contactEmail: contactEmail || null, notes: notes || null }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Fehler'); setLoading(false); return }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--adm-border2)', background: 'var(--adm-input-bg)', color: 'var(--adm-text)',
    fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-text2)',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  return (
    <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', padding: '20px' }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', margin: '0 0 16px' }}>Organisation bearbeiten</h2>
      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Plan</label>
          <select value={plan} onChange={e => setPlan(e.target.value)} style={inputStyle}>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Asset-Limit</label>
            <input type="number" min={1} value={assetLimit} onChange={e => setAssetLimit(Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Nutzer-Limit</label>
            <input type="number" min={1} value={userLimit} onChange={e => setUserLimit(Number(e.target.value))} style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Kontakt-E-Mail</label>
          <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="optional" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Notizen</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Interne Notizen..." style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
          <label htmlFor="isActive" style={{ fontSize: 13, color: 'var(--adm-text5)', cursor: 'pointer' }}>Organisation aktiv</label>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{error}</p>}
        {success && <p style={{ color: '#34d399', fontSize: 13, marginBottom: 10 }}>Gespeichert ✓</p>}

        <button type="submit" disabled={loading} style={{
          background: loading ? 'var(--adm-border2)' : '#003366', color: 'white',
          padding: '10px 24px', borderRadius: 50, border: 'none',
          fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
          fontFamily: 'Arial, sans-serif',
        }}>
          {loading ? 'Speichert…' : 'Speichern'}
        </button>
      </form>
    </div>
  )
}
