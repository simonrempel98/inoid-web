'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

type Asset = { id: string; name: string; serial_number: string | null }
type Druckwerk = { id: string; position: number; label: string | null }

export function NeueVorlageClient({
  machine,
  druckwerke,
  otherMachines,
  assets,
}: {
  machine: { id: string; name: string; num_druckwerke: number }
  druckwerke: Druckwerk[]
  otherMachines: { id: string; name: string }[]
  assets: Asset[]
}) {
  const router = useRouter()
  const t = useTranslations('flexodruck')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [slots, setSlots] = useState<string[]>(['Sleeve', 'Druckplatte'])
  const [newSlot, setNewSlot] = useState('')
  const [sharedMachines, setSharedMachines] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  function addSlot() {
    const s = newSlot.trim()
    if (!s || slots.includes(s)) return
    setSlots([...slots, s])
    setNewSlot('')
  }

  function removeSlot(s: string) {
    setSlots(slots.filter(x => x !== s))
  }

  function toggleMachine(mid: string) {
    setSharedMachines(prev =>
      prev.includes(mid) ? prev.filter(x => x !== mid) : [...prev, mid]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError(t('nameRequired')); return }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/flexodruck/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machine_id: machine.id,
        name,
        description,
        slot_labels: slots,
        shared_machine_ids: sharedMachines,
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? t('nameRequired')); return }
    router.push(`/flexodruck/vorlagen/${data.id}`)
    router.refresh()
  }

  return (
    <div style={{ padding: '28px 24px 60px', maxWidth: 620 }}>
      <Link href={`/flexodruck/maschinen/${machine.id}`}
        style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none', fontFamily: 'Arial, sans-serif' }}>
        ← {machine.name}
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#003366', margin: '8px 0 4px', fontFamily: 'Arial, sans-serif' }}>
        {t('newTemplate')}
      </h1>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px', fontFamily: 'Arial, sans-serif' }}>
        {t('newTemplateSubtitle')}
      </p>

      <form onSubmit={handleSubmit}>
        {/* Name & Beschreibung */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '20px', marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('template')} *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Standard-Setup Gelb" required style={input} />
          </div>
          <div>
            <label style={labelStyle}>{t('description')}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional: Was ist der Zweck dieser Vorlage?" rows={2}
              style={{ ...input, resize: 'vertical' }} />
          </div>
        </div>

        {/* Variable Slot-Typen */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '20px', marginBottom: 16 }}>
          <label style={{ ...labelStyle, marginBottom: 12 }}>{t('variableSlots')}</label>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
            {t('variableSlotTypesDesc')}
          </p>

          {/* Vorhandene Slots */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {slots.map(s => (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#e8f4fd', borderRadius: 20, padding: '5px 12px',
                border: '1px solid #bfdbfe',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#003366', fontFamily: 'Arial, sans-serif' }}>{s}</span>
                <button type="button" onClick={() => removeSlot(s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, lineHeight: 1, padding: 0, fontFamily: 'Arial, sans-serif' }}>
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Neuen Slot hinzufügen */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newSlot} onChange={e => setNewSlot(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSlot())}
              placeholder={t('addSlotPlaceholder')}
              style={{ ...input, flex: 1 }}
            />
            <button type="button" onClick={addSlot}
              style={{
                background: '#003366', color: 'white', padding: '10px 16px',
                borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'Arial, sans-serif', flexShrink: 0,
              }}>
              +
            </button>
          </div>
        </div>

        {/* Vorschau */}
        <div style={{ background: '#f4f6f9', borderRadius: 14, border: '1px solid #c8d4e8', padding: '16px 20px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
            {t('previewStepsTitle')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {druckwerke.map(dw => (
              <div key={dw.id} style={{ background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid #c8d4e8' }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#0099cc', fontFamily: 'Arial, sans-serif' }}>
                  {dw.label ?? `DW ${dw.position}`}
                </p>
                <p style={{ margin: '0 0 2px', fontSize: 10, color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>▪ Trägerstange 1</p>
                <p style={{ margin: '0 0 4px', fontSize: 10, color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>▪ Trägerstange 2</p>
                {slots.map(s => (
                  <p key={s} style={{ margin: '0 0 2px', fontSize: 10, color: '#003366', fontFamily: 'Arial, sans-serif' }}>▪ {s}</p>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Freigabe für andere Maschinen */}
        {otherMachines.length > 0 && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '20px', marginBottom: 16 }}>
            <label style={{ ...labelStyle, marginBottom: 10 }}>{t('sharedMachinesLabel')}</label>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
              {t('sharedMachinesDesc')}
            </p>
            {otherMachines.map(m => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={sharedMachines.includes(m.id)}
                  onChange={() => toggleMachine(m.id)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: '#003366', fontFamily: 'Arial, sans-serif' }}>{m.name}</span>
              </label>
            ))}
          </div>
        )}

        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12, fontFamily: 'Arial, sans-serif' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={loading}
            style={{
              background: loading ? '#c8d4e8' : '#003366', color: 'white',
              padding: '12px 28px', borderRadius: 50, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}>
            {loading ? t('creating') : t('createTemplate')}
          </button>
          <button type="button" onClick={() => router.back()}
            style={{
              background: 'transparent', color: '#6b7280',
              padding: '12px 20px', borderRadius: 50, border: '1px solid #c8d4e8',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}>
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
