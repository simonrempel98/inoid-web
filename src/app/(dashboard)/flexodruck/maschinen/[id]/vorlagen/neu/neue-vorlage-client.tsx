'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Druckwerk = { id: string; position: number; label: string | null; color_hint: string | null; hasFarbe: boolean }

export function NeueVorlageClient({
  machine,
  druckwerke,
}: {
  machine: { id: string; name: string }
  druckwerke: Druckwerk[]
}) {
  const router = useRouter()

  const [name, setName] = useState('')
  const [included, setIncluded] = useState<Set<string>>(new Set(druckwerke.map(d => d.id)))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allSelected = included.size === druckwerke.length

  function toggleDw(id: string) {
    setIncluded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setIncluded(new Set())
    } else {
      setIncluded(new Set(druckwerke.map(d => d.id)))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name ist erforderlich'); return }
    if (included.size === 0) { setError('Mindestens ein Druckwerk auswählen'); return }

    // Slots ohne Assets anlegen – werden später im Setup befüllt
    const assignments: { druckwerk_id: string; slot_label: string; asset_id: string | null }[] = []
    for (const dwId of included) {
      assignments.push({ druckwerk_id: dwId, slot_label: 'Druckbild', asset_id: null })
      const dw = druckwerke.find(d => d.id === dwId)
      if (dw?.hasFarbe) {
        assignments.push({ druckwerk_id: dwId, slot_label: 'Farbe', asset_id: null })
      }
    }

    setLoading(true)
    setError(null)
    const res = await fetch('/api/flexodruck/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machine_id: machine.id, name: name.trim(), assignments }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Fehler'); return }
    router.push(`/flexodruck/vorlagen/${data.id}`)
    router.refresh()
  }

  return (
    <div style={{ padding: '28px 24px 80px', maxWidth: 560, fontFamily: 'Arial, sans-serif' }}>
      <Link href={`/flexodruck/maschinen/${machine.id}`}
        style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>
        ← {machine.name}
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#003366', margin: '8px 0 24px' }}>
        Neue Vorlage
      </h1>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div style={{
          background: 'var(--ds-surface)', borderRadius: 14,
          border: '1px solid var(--ds-border)', padding: 20, marginBottom: 16,
        }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280',
            marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Name *
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="z.B. Standard-Gelb, Sonderfarbe Rot …"
            required
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--ds-border)', background: 'var(--ds-surface)',
              color: 'var(--ds-text)', fontSize: 14, fontFamily: 'Arial, sans-serif',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Druckwerke Header + Alle-Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: '#6b7280',
            textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
          }}>
            Druckwerke
          </p>
          <button
            type="button"
            onClick={toggleAll}
            style={{
              background: allSelected ? '#f0f9ff' : '#003366',
              color: allSelected ? '#0099cc' : 'white',
              border: `1.5px solid ${allSelected ? '#0099cc' : '#003366'}`,
              borderRadius: 20, padding: '4px 14px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {allSelected ? 'Alle abwählen' : 'Alle Druckwerke'}
          </button>
        </div>

        {/* Druckwerk-Liste */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {druckwerke.map(dw => {
            const isOn = included.has(dw.id)
            const dwLabel = dw.label ?? `Druckwerk ${dw.position}`
            return (
              <button
                key={dw.id}
                type="button"
                onClick={() => toggleDw(dw.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', textAlign: 'left', cursor: 'pointer',
                  background: isOn ? '#f0f9ff' : 'var(--ds-surface)',
                  borderRadius: 12,
                  border: `1px solid ${isOn ? '#0099cc' : 'var(--ds-border)'}`,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: dw.color_hint ?? '#003366',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: 900,
                    color: dw.color_hint === '#ffd600' || dw.color_hint === '#f5f5f5' ? '#003366' : 'white',
                  }}>
                    {dw.position}
                  </span>
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--ds-text)' }}>
                  {dwLabel}
                </span>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${isOn ? '#0099cc' : 'var(--ds-border)'}`,
                  background: isOn ? '#0099cc' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {isOn && <span style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>✓</span>}
                </div>
              </button>
            )
          })}
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={loading} style={{
            background: loading ? '#c8d4e8' : '#003366', color: 'white',
            padding: '12px 28px', borderRadius: 50, border: 'none',
            fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
          }}>
            {loading ? 'Erstellen…' : 'Vorlage erstellen'}
          </button>
          <Link href={`/flexodruck/maschinen/${machine.id}`} style={{
            padding: '12px 20px', borderRadius: 50, border: '1px solid var(--ds-border)',
            fontSize: 14, fontWeight: 600, color: '#6b7280', textDecoration: 'none',
          }}>
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
