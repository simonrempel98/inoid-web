'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Slot = { id: string; label: string; sort_order: number; asset_id: string | null }
type Druckwerk = { id: string; position: number; label: string | null; color_hint: string | null; slots: Slot[] }
type Machine = {
  id: string; name: string; manufacturer: string | null; model: string | null
  num_druckwerke: number; notes: string | null; is_active: boolean; image_url: string | null
}

const FLEXO_COLORS = [
  { label: 'Cyan',    value: '#00b4d8' },
  { label: 'Magenta', value: '#e040fb' },
  { label: 'Gelb',    value: '#ffd600' },
  { label: 'Schwarz', value: '#212121' },
  { label: 'Weiß',    value: '#f5f5f5' },
  { label: 'Silber',  value: '#9e9e9e' },
  { label: 'Gold',    value: '#ffa000' },
  { label: 'Rot',     value: '#e53935' },
  { label: 'Blau',    value: '#1976d2' },
  { label: 'Grün',    value: '#43a047' },
]

export function MachineEditClient({
  machine: initial,
  druckwerke: initialDW,
  backHref,
}: {
  machine: Machine
  druckwerke: Druckwerk[]
  backHref: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const imgInputRef = useRef<HTMLInputElement>(null)

  // Basic info state
  const [name, setName] = useState(initial.name)
  const [manufacturer, setManufacturer] = useState(initial.manufacturer ?? '')
  const [model, setModel] = useState(initial.model ?? '')
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [isActive, setIsActive] = useState(initial.is_active !== false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Image state
  const [imageUrl, setImageUrl] = useState<string | null>(initial.image_url)
  const [imageUploading, setImageUploading] = useState(false)

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Druckwerk state
  const [druckwerke, setDruckwerke] = useState<Druckwerk[]>(initialDW)
  const [dwSaving, setDwSaving] = useState<string | null>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #c8d4e8', background: 'white', color: '#003366',
    fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
    fontFamily: 'Arial, sans-serif',
  }

  // ─── Maschine speichern ────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true); setSaved(false); setError(null)
    const res = await fetch(`/api/flexodruck/machines/${initial.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), manufacturer: manufacturer.trim() || null, model: model.trim() || null, notes: notes.trim() || null, is_active: isActive }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Fehler'); return }
    setSaved(true)
    router.refresh()
  }

  function extractStoragePath(url: string): string | null {
    const m = url.match(/\/machine-images\/(.+?)(\?|$)/)
    return m ? m[1] : null
  }

  // ─── Bild hochladen ────────────────────────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    const ext = file.name.split('.').pop()
    const newPath = `machines/${initial.id}/cover.${ext}`

    // Altes Bild löschen wenn anderer Dateityp
    if (imageUrl) {
      const oldPath = extractStoragePath(imageUrl)
      if (oldPath && oldPath !== newPath) {
        await supabase.storage.from('machine-images').remove([oldPath])
      }
    }

    const { error: upErr } = await supabase.storage.from('machine-images').upload(newPath, file, { upsert: true })
    if (upErr) { setImageUploading(false); setError(upErr.message); return }
    const { data } = supabase.storage.from('machine-images').getPublicUrl(newPath)
    const url = data.publicUrl + '?t=' + Date.now()
    await fetch(`/api/flexodruck/machines/${initial.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: url }),
    })
    setImageUrl(url)
    setImageUploading(false)
    router.refresh()
  }

  // ─── Maschine löschen ─────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true)
    if (imageUrl) {
      const oldPath = extractStoragePath(imageUrl)
      if (oldPath) await supabase.storage.from('machine-images').remove([oldPath])
    }
    const res = await fetch(`/api/flexodruck/machines/${initial.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) { setError('Fehler beim Löschen'); return }
    router.push('/flexodruck')
    router.refresh()
  }

  // ─── Druckwerk speichern ───────────────────────────────────────────────────
  async function saveDruckwerk(dw: Druckwerk, label: string, colorHint: string | null) {
    setDwSaving(dw.id)
    await fetch(`/api/flexodruck/machines/${initial.id}/druckwerke/${dw.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label || null, color_hint: colorHint || null }),
    })
    setDwSaving(null)
    router.refresh()
  }

  // ─── Farbe-Slot hinzufügen ─────────────────────────────────────────────────
  async function addFarbeSlot(dw: Druckwerk) {
    setDwSaving(dw.id)
    const res = await fetch(`/api/flexodruck/druckwerke/${dw.id}/slots`, { method: 'POST' })
    if (res.ok) {
      const d = await res.json()
      setDruckwerke(prev => prev.map(x => x.id === dw.id
        ? { ...x, slots: [...x.slots, { id: d.id, label: 'Farbe', sort_order: 1, asset_id: null }] }
        : x
      ))
    }
    setDwSaving(null)
  }

  // ─── Farbe-Slot entfernen ──────────────────────────────────────────────────
  async function removeFarbeSlot(dw: Druckwerk) {
    const farbe = dw.slots.find(s => s.sort_order === 1)
    if (!farbe) return
    setDwSaving(dw.id)
    await fetch(`/api/flexodruck/fixed-slots/${farbe.id}`, { method: 'DELETE' })
    setDruckwerke(prev => prev.map(x => x.id === dw.id
      ? { ...x, slots: x.slots.filter(s => s.sort_order !== 1) }
      : x
    ))
    setDwSaving(null)
  }

  return (
    <div style={{ padding: '28px 24px 80px', maxWidth: 680, fontFamily: 'Arial, sans-serif' }}>
      {/* Back */}
      <Link href={backHref} style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>
        ← {initial.name}
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#003366', margin: '8px 0 24px' }}>
        Maschine bearbeiten
      </h1>

      {/* ── Profilbild ─────────────────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>
          Maschinenbild
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
            background: '#f4f6f9', border: '1px solid #c8d4e8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {imageUrl ? (
              <img src={imageUrl} alt={initial.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c8d4e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
              </svg>
            )}
          </div>
          <div>
            <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            <button
              type="button"
              onClick={() => imgInputRef.current?.click()}
              disabled={imageUploading}
              style={{
                background: '#003366', color: 'white', padding: '9px 18px', borderRadius: 50,
                border: 'none', fontSize: 13, fontWeight: 700, cursor: imageUploading ? 'default' : 'pointer',
                opacity: imageUploading ? 0.6 : 1,
              }}
            >
              {imageUploading ? 'Hochladen…' : imageUrl ? 'Bild ändern' : 'Bild hochladen'}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={async () => {
                  const oldPath = extractStoragePath(imageUrl)
                  if (oldPath) await supabase.storage.from('machine-images').remove([oldPath])
                  await fetch(`/api/flexodruck/machines/${initial.id}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_url: null }),
                  })
                  setImageUrl(null)
                }}
                style={{ marginLeft: 8, background: 'none', border: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer' }}
              >
                Entfernen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Basisinformationen ──────────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>
          Basisinformationen
        </h2>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Hersteller</label>
              <input value={manufacturer} onChange={e => setManufacturer(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Modell</label>
              <input value={model} onChange={e => setModel(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Notizen</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
          </div>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            <label htmlFor="isActive" style={{ fontSize: 13, color: '#003366', cursor: 'pointer' }}>Aktiv</label>
          </div>
          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{error}</p>}
          {saved && <p style={{ color: '#34d399', fontSize: 13, marginBottom: 10 }}>Gespeichert ✓</p>}
          <button type="submit" disabled={saving} style={{
            background: saving ? '#c8d4e8' : '#003366', color: 'white',
            padding: '10px 24px', borderRadius: 50, border: 'none',
            fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
          }}>
            {saving ? 'Speichert…' : 'Speichern'}
          </button>
        </form>
      </div>

      {/* ── Druckwerke ──────────────────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #c8d4e8' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Druckwerke ({druckwerke.length})
          </h2>
        </div>
        {druckwerke.map(dw => (
          <DruckwerkRow
            key={dw.id}
            dw={dw}
            saving={dwSaving === dw.id}
            onSave={(label, color) => saveDruckwerk(dw, label, color)}
            onAddFarbe={() => addFarbeSlot(dw)}
            onRemoveFarbe={() => removeFarbeSlot(dw)}
          />
        ))}
      </div>

      {/* ── Gefahrenzone: Löschen ──────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #fca5a5', padding: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
          Gefahrenzone
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px' }}>
          Die Maschine und alle zugehörigen Druckwerke, Slots, Vorlagen und Rüstvorgänge werden unwiderruflich gelöscht.
        </p>
        {!deleteConfirm ? (
          <button type="button" onClick={() => setDeleteConfirm(true)}
            style={{
              background: 'white', color: '#dc2626', border: '1px solid #fca5a5',
              padding: '9px 20px', borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
            Maschine löschen
          </button>
        ) : (
          <div style={{ background: '#fef2f2', borderRadius: 10, padding: '14px 16px', border: '1px solid #fca5a5' }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
              Wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={handleDelete} disabled={deleting}
                style={{
                  background: '#dc2626', color: 'white', border: 'none',
                  padding: '9px 20px', borderRadius: 50, fontSize: 13, fontWeight: 700,
                  cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.6 : 1,
                }}>
                {deleting ? 'Löschen…' : 'Ja, endgültig löschen'}
              </button>
              <button type="button" onClick={() => setDeleteConfirm(false)}
                style={{
                  background: 'white', color: '#6b7280', border: '1px solid #c8d4e8',
                  padding: '9px 16px', borderRadius: 50, fontSize: 13, cursor: 'pointer',
                }}>
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Druckwerk-Zeile ────────────────────────────────────────────────────────

function DruckwerkRow({
  dw, saving, onSave, onAddFarbe, onRemoveFarbe,
}: {
  dw: Druckwerk
  saving: boolean
  onSave: (label: string, color: string | null) => void
  onAddFarbe: () => void
  onRemoveFarbe: () => void
}) {
  const [label, setLabel] = useState(dw.label ?? '')
  const [color, setColor] = useState<string | null>(dw.color_hint)
  const hasFarbe = dw.slots.some(s => s.sort_order === 1)

  const inputStyle: React.CSSProperties = {
    padding: '8px 10px', borderRadius: 8, border: '1px solid #c8d4e8',
    fontSize: 13, fontFamily: 'Arial, sans-serif', outline: 'none',
    background: 'white', color: '#003366',
  }

  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8edf4' }}>
      {/* DW Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: color ?? '#003366',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: 'white' }}>{dw.position}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
          {dw.label ?? `Druckwerk ${dw.position}`}
        </span>
      </div>

      {/* Label + Color */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 12 }}>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder={`DW ${dw.position} (optional)`}
          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {FLEXO_COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setColor(color === c.value ? null : c.value)}
              style={{
                width: 20, height: 20, borderRadius: '50%', border: color === c.value ? '2px solid #003366' : '1.5px solid #c8d4e8',
                background: c.value, cursor: 'pointer', flexShrink: 0,
                outline: color === c.value ? '2px solid rgba(0,51,102,0.2)' : 'none',
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => setColor(null)}
            title="Keine Farbe"
            style={{
              width: 20, height: 20, borderRadius: '50%', border: '1.5px dashed #c8d4e8',
              background: 'white', cursor: 'pointer', fontSize: 10, color: '#9ca3af',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>
      </div>

      {/* Slot-Konfiguration */}
      <div style={{ background: '#f4f6f9', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Arial, sans-serif' }}>
          Slots
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#003366', fontFamily: 'Arial, sans-serif', fontWeight: 600 }}>Druckbild</span>
            <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>– immer vorhanden</span>
          </div>
          {hasFarbe ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0099cc', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#003366', fontFamily: 'Arial, sans-serif', fontWeight: 600 }}>Farbe</span>
              <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>– Farbe / Anilox</span>
              <button
                type="button"
                onClick={onRemoveFarbe}
                disabled={saving}
                style={{ marginLeft: 'auto', fontSize: 11, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}
              >
                Entfernen
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAddFarbe}
              disabled={saving}
              style={{
                fontSize: 12, color: '#0099cc', background: 'none', border: '1px dashed #0099cc',
                borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'Arial, sans-serif',
                textAlign: 'left', opacity: saving ? 0.6 : 1,
              }}
            >
              + Farbe-Slot hinzufügen (Farbe / Anilox)
            </button>
          )}
        </div>
      </div>

      {/* Speichern */}
      <button
        type="button"
        onClick={() => onSave(label, color)}
        disabled={saving}
        style={{
          background: saving ? '#c8d4e8' : '#003366', color: 'white',
          padding: '8px 18px', borderRadius: 50, border: 'none',
          fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {saving ? 'Speichert…' : 'DW speichern'}
      </button>
    </div>
  )
}
