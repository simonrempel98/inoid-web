'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function TemplateEditClient({
  templateId,
  initialName,
  initialDescription,
  initialIsActive,
  machineId,
  machineName,
}: {
  templateId: string
  initialName: string
  initialDescription: string
  initialIsActive: boolean
  machineId: string
  machineName: string
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [isActive, setIsActive] = useState(initialIsActive)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const input: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #c8d4e8', background: 'white', color: '#003366',
    fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
    fontFamily: 'Arial, sans-serif',
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name ist erforderlich'); return }
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/flexodruck/templates/${templateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null, is_active: isActive }),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Fehler beim Speichern')
      return
    }
    router.push(`/flexodruck/vorlagen/${templateId}`)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/flexodruck/templates/${templateId}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Fehler beim Löschen')
      return
    }
    router.push(`/flexodruck/maschinen/${machineId}`)
    router.refresh()
  }

  return (
    <div style={{ padding: '28px 24px 60px', maxWidth: 560, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <Link href={`/flexodruck/vorlagen/${templateId}`}
          style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>
          ← Vorlage
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#003366', margin: '8px 0 4px' }}>
          Vorlage bearbeiten
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{machineName}</p>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: 20, marginBottom: 16 }}>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={input} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Beschreibung</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optionale Beschreibung…"
              rows={3}
              style={{ ...input, resize: 'vertical', lineHeight: '1.5' }}
            />
          </div>

          {/* Aktiv-Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #e8edf4' }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#003366' }}>Aktiv</p>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Vorlage für Rüstvorgänge verfügbar</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(v => !v)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: isActive ? '#003366' : '#d1d5db',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                left: isActive ? 23 : 3, transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <button type="submit" disabled={loading}
            style={{
              background: loading ? '#c8d4e8' : '#003366', color: 'white',
              padding: '12px 28px', borderRadius: 50, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            }}>
            {loading ? 'Speichern…' : 'Speichern'}
          </button>
          <Link href={`/flexodruck/vorlagen/${templateId}`}
            style={{
              background: 'transparent', color: '#6b7280',
              padding: '12px 20px', borderRadius: 50, border: '1px solid #c8d4e8',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
            Abbrechen
          </Link>
        </div>
      </form>

      {/* Gefahrenzone */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #fca5a5', padding: 20 }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Gefahrenzone
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280' }}>
          Die Vorlage und alle ihre Zuweisungen werden unwiderruflich gelöscht.
        </p>
        {!deleteConfirm ? (
          <button type="button" onClick={() => setDeleteConfirm(true)}
            style={{
              background: 'white', color: '#ef4444', border: '1px solid #fca5a5',
              padding: '10px 20px', borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
            Vorlage löschen
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleDelete} disabled={deleting}
              style={{
                background: '#ef4444', color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: 50, fontSize: 13, fontWeight: 700,
                cursor: deleting ? 'default' : 'pointer',
              }}>
              {deleting ? 'Wird gelöscht…' : 'Ja, endgültig löschen'}
            </button>
            <button type="button" onClick={() => setDeleteConfirm(false)}
              style={{
                background: 'transparent', color: '#6b7280', border: '1px solid #c8d4e8',
                padding: '10px 16px', borderRadius: 50, fontSize: 13, cursor: 'pointer',
              }}>
              Abbrechen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
