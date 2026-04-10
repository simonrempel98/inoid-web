'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PRESETS = [
  { label: 'Original', desc: 'Keine Komprimierung', maxDim: 0,    quality: 100 },
  { label: 'Hoch',     desc: '1920px · 85%',         maxDim: 1920, quality: 85  },
  { label: 'Mittel',   desc: '1280px · 75%',          maxDim: 1280, quality: 75  },
  { label: 'Niedrig',  desc: '800px  · 60%',           maxDim: 800,  quality: 60  },
  { label: 'Eigene',   desc: 'Manuell einstellen',    maxDim: -1,   quality: -1  },
] as const

type Preset = typeof PRESETS[number]

function detectPreset(maxDim: number, quality: number): Preset['label'] {
  for (const p of PRESETS) {
    if (p.maxDim === maxDim && p.quality === quality) return p.label
  }
  return 'Eigene'
}

export function ImageCompressionSettings({ orgId, settings }: {
  orgId: string
  settings: Record<string, unknown> | null
}) {
  const router = useRouter()
  const initMaxDim = (settings?.image_max_dim as number) ?? 1920
  const initQuality = (settings?.image_quality as number) ?? 82

  const [maxDim, setMaxDim]   = useState(initMaxDim)
  const [quality, setQuality] = useState(initQuality)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const activePreset = detectPreset(maxDim, quality)

  function applyPreset(p: Preset) {
    if (p.maxDim === -1) return
    setMaxDim(p.maxDim)
    setQuality(p.quality)
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    setError(null)
    const res = await fetch(`/api/admin/orgs/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { ...(settings ?? {}), image_max_dim: maxDim, image_quality: quality } }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Fehler'); return }
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--adm-border2)', background: 'var(--adm-input-bg)', color: 'var(--adm-text)',
    fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', overflow: 'hidden', marginTop: 20 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--adm-border)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', margin: 0 }}>Bildkomprimierung</h2>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--adm-text3)' }}>
          Gilt für alle neu hochgeladenen Bilder dieser Organisation
        </p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--adm-text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Voreinstellung</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {PRESETS.map(p => (
            <button key={p.label} type="button" onClick={() => applyPreset(p)} style={{
              padding: '7px 14px', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontFamily: 'Arial, sans-serif',
              fontSize: 13, fontWeight: 700,
              background: activePreset === p.label ? '#1e3a5f' : 'var(--adm-border)',
              color: activePreset === p.label ? '#60a5fa' : 'var(--adm-text3)',
              outline: activePreset === p.label ? '2px solid #60a5fa' : 'none',
              outlineOffset: 1,
            }}>
              <span>{p.label}</span>
              <span style={{ fontWeight: 400, fontSize: 11, display: 'block', color: activePreset === p.label ? '#93c5fd' : 'var(--adm-text4)' }}>
                {p.desc}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Max. Auflösung (längste Seite)
            </label>
            <select value={maxDim} onChange={e => setMaxDim(Number(e.target.value))} style={inputStyle}>
              <option value={0}>Original (keine Verkleinerung)</option>
              <option value={800}>800 px</option>
              <option value={1280}>1.280 px</option>
              <option value={1600}>1.600 px</option>
              <option value={1920}>1.920 px (Standard)</option>
              <option value={2560}>2.560 px</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              JPEG-Qualität: <span style={{ color: 'var(--adm-text)' }}>{quality} %</span>
            </label>
            <input
              type="range" min={40} max={100} step={5}
              value={quality}
              onChange={e => setQuality(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0099cc', marginTop: 6 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--adm-text4)', marginTop: 2 }}>
              <span>40 % (klein)</span>
              <span>100 % (original)</span>
            </div>
          </div>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 12, margin: '12px 0 0' }}>{error}</p>}

        <button type="button" onClick={save} disabled={saving} style={{
          marginTop: 16, background: saving ? 'var(--adm-border2)' : '#003366', color: 'white',
          padding: '10px 24px', borderRadius: 50, border: 'none',
          fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
          fontFamily: 'Arial, sans-serif',
        }}>
          {saving ? 'Speichert…' : saved ? '✓ Gespeichert' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
