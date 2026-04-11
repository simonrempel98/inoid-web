'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function NeueMaschinePage() {
  const router = useRouter()
  const t = useTranslations('flexodruck')
  const [name, setName] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [model, setModel] = useState('')
  const [numDruckwerke, setNumDruckwerke] = useState(4)
  const [notes, setNotes] = useState('')
  const [dwLabels, setDwLabels] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setDwLabel(pos: number, val: string) {
    setDwLabels(prev => ({ ...prev, [pos]: val }))
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #c8d4e8', background: 'white', color: '#003366',
    fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none',
    boxSizing: 'border-box',
  }
  const label: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
    fontFamily: 'Arial, sans-serif',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError(t('nameRequired')); return }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/flexodruck/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, manufacturer, model, num_druckwerke: numDruckwerke, notes, dw_labels: dwLabels }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? t('nameRequired')); return }
    router.push(`/flexodruck/maschinen/${data.id}`)
  }

  return (
    <div style={{ padding: '28px 24px 40px', maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/flexodruck" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none', fontFamily: 'Arial, sans-serif' }}>
          ← Flexodruck
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#003366', margin: '8px 0 4px', fontFamily: 'Arial, sans-serif' }}>
          {t('newMachine')}
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0, fontFamily: 'Arial, sans-serif' }}>
          {t('newMachineSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '20px', marginBottom: 16 }}>

          <div style={{ marginBottom: 14 }}>
            <label style={label}>{t('machine')} *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Flexodruckmaschine 1" required style={input} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }} className="rg-2">
            <div>
              <label style={label}>{t('manufacturer')}</label>
              <input value={manufacturer} onChange={e => setManufacturer(e.target.value)} placeholder="z.B. WINDMÖLLER & HÖLSCHER" style={input} />
            </div>
            <div>
              <label style={label}>{t('model')}</label>
              <input value={model} onChange={e => setModel(e.target.value)} placeholder="z.B. MIRAFLEX C" style={input} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={label}>{t('numDruckwerke')} *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[2, 4, 6, 8, 10].map(n => (
                <button
                  key={n} type="button"
                  onClick={() => setNumDruckwerke(n)}
                  style={{
                    width: 50, height: 38, borderRadius: 8, border: 'none',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Arial, sans-serif',
                    background: numDruckwerke === n ? '#003366' : '#f4f6f9',
                    color: numDruckwerke === n ? 'white' : '#6b7280',
                  }}
                >
                  {n}
                </button>
              ))}
              <input
                type="number" min={1} max={20}
                value={numDruckwerke}
                onChange={e => setNumDruckwerke(Math.max(1, Math.min(20, Number(e.target.value))))}
                style={{ ...input, width: 70, textAlign: 'center' }}
              />
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>
              {t('druckwerkeAutoCreated')}
            </p>
          </div>

          <div>
            <label style={label}>{t('notes')}</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Optionale Hinweise zur Maschine..."
              rows={3}
              style={{ ...input, resize: 'vertical', lineHeight: '1.5' }}
            />
          </div>
        </div>

        {/* Druckwerke benennen */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: 20, marginBottom: 16 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Arial, sans-serif' }}>
            Druckwerke benennen
          </p>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>
            Optional — z.B. Cyan, Magenta, Gelb, Schwarz
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {Array.from({ length: numDruckwerke }).map((_, i) => (
              <div key={i}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#9ca3af', marginBottom: 4, fontFamily: 'Arial, sans-serif' }}>
                  Druckwerk {i + 1}
                </label>
                <input
                  value={dwLabels[i + 1] ?? ''}
                  onChange={e => setDwLabel(i + 1, e.target.value)}
                  placeholder={`DW ${i + 1}`}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: '1px solid #c8d4e8', fontSize: 13,
                    fontFamily: 'Arial, sans-serif', outline: 'none',
                    background: 'white', color: '#003366', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12, fontFamily: 'Arial, sans-serif' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit" disabled={loading}
            style={{
              background: loading ? '#c8d4e8' : '#003366', color: 'white',
              padding: '12px 28px', borderRadius: 50, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {loading ? t('creating') : t('createMachine')}
          </button>
          <button
            type="button" onClick={() => router.back()}
            style={{
              background: 'transparent', color: '#6b7280',
              padding: '12px 20px', borderRadius: 50, border: '1px solid #c8d4e8',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
