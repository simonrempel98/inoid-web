'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Asset = { id: string; name: string; serial_number: string | null; article_number: string | null; category: string | null }
type Druckwerk = { id: string; position: number; label: string | null; color_hint: string | null; hasFarbe: boolean }

export function NeueVorlageClient({
  machine,
  druckwerke,
  assets,
}: {
  machine: { id: string; name: string }
  druckwerke: Druckwerk[]
  assets: Asset[]
}) {
  const router = useRouter()

  const [name, setName] = useState('')
  const [included, setIncluded] = useState<Set<string>>(new Set())
  const [druckbildAsset, setDruckbildAsset] = useState<Record<string, string>>({})
  const [farbeAsset, setFarbeAsset] = useState<Record<string, string>>({})
  const [assetSearch, setAssetSearch] = useState<Record<string, string>>({}) // dwId+slot → search
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleDw(id: string) {
    setIncluded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function filteredAssets(searchKey: string) {
    const q = (assetSearch[searchKey] ?? '').toLowerCase()
    if (!q) return assets
    return assets.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.serial_number ?? '').toLowerCase().includes(q) ||
      (a.article_number ?? '').toLowerCase().includes(q)
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name ist erforderlich'); return }
    if (included.size === 0) { setError('Mindestens ein Druckwerk auswählen'); return }

    const assignments: { druckwerk_id: string; slot_label: string; asset_id: string | null }[] = []
    for (const dwId of included) {
      assignments.push({
        druckwerk_id: dwId,
        slot_label: 'Druckbild',
        asset_id: druckbildAsset[dwId] || null,
      })
      const dw = druckwerke.find(d => d.id === dwId)
      if (dw?.hasFarbe) {
        assignments.push({
          druckwerk_id: dwId,
          slot_label: 'Farbe',
          asset_id: farbeAsset[dwId] || null,
        })
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--ds-border)', background: 'var(--ds-surface)', color: '#003366',
    fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none', boxSizing: 'border-box',
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
        <div style={{ background: 'var(--ds-surface)', borderRadius: 14, border: '1px solid var(--ds-border)', padding: 20, marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Name *
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="z.B. Standard-Gelb, Sonderfarbe Rot …"
            required
            style={inputStyle}
          />
        </div>

        {/* Druckwerke */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
          Druckwerke
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {druckwerke.map(dw => {
            const isOn = included.has(dw.id)
            const dwLabel = dw.label ?? `Druckwerk ${dw.position}`
            const searchKeyDruck = `${dw.id}_druckbild`
            const searchKeyFarbe = `${dw.id}_farbe`
            return (
              <div key={dw.id} style={{
                background: 'var(--ds-surface)', borderRadius: 12, border: `1px solid ${isOn ? '#0099cc' : '#c8d4e8'}`,
                overflow: 'hidden', transition: 'border-color 0.15s',
              }}>
                {/* DW Header */}
                <button
                  type="button"
                  onClick={() => toggleDw(dw.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', background: isOn ? '#f0f9ff' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: dw.color_hint ?? '#003366',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: dw.color_hint === '#ffd600' || dw.color_hint === '#f5f5f5' ? '#003366' : 'white' }}>
                      {dw.position}
                    </span>
                  </div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#003366' }}>{dwLabel}</span>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', border: '2px solid',
                    borderColor: isOn ? '#0099cc' : '#c8d4e8',
                    background: isOn ? '#0099cc' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {isOn && <span style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>✓</span>}
                  </div>
                </button>

                {/* Asset-Picker (nur wenn eingeschlossen) */}
                {isOn && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e8f0f9' }}>

                    {/* Druckbild */}
                    <SlotPicker
                      label="Druckbild"
                      searchValue={assetSearch[searchKeyDruck] ?? ''}
                      onSearchChange={v => setAssetSearch(prev => ({ ...prev, [searchKeyDruck]: v }))}
                      assets={filteredAssets(searchKeyDruck)}
                      allAssets={assets}
                      selectedId={druckbildAsset[dw.id] ?? ''}
                      onSelect={id => setDruckbildAsset(prev => ({ ...prev, [dw.id]: id }))}
                    />

                    {/* Farbe (nur wenn Slot existiert) */}
                    {dw.hasFarbe && (
                      <SlotPicker
                        label="Farbe / Anilox"
                        searchValue={assetSearch[searchKeyFarbe] ?? ''}
                        onSearchChange={v => setAssetSearch(prev => ({ ...prev, [searchKeyFarbe]: v }))}
                        assets={filteredAssets(searchKeyFarbe)}
                        allAssets={assets}
                        selectedId={farbeAsset[dw.id] ?? ''}
                        onSelect={id => setFarbeAsset(prev => ({ ...prev, [dw.id]: id }))}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

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

// ─── Slot-Picker Subkomponente ───────────────────────────────────────────────
function SlotPicker({
  label,
  searchValue,
  onSearchChange,
  assets,
  allAssets,
  selectedId,
  onSelect,
}: {
  label: string
  searchValue: string
  onSearchChange: (v: string) => void
  assets: Asset[]
  allAssets: Asset[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const selectedAsset = allAssets.find(a => a.id === selectedId)

  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>

      {/* Ausgewählt */}
      {selectedAsset ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#e8f4fd', borderRadius: 8, padding: '8px 12px', marginBottom: 6,
          border: '1px solid #bfdbfe',
        }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#003366' }}>{selectedAsset.name}</span>
            {selectedAsset.serial_number && (
              <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>SN: {selectedAsset.serial_number}</span>
            )}
          </div>
          <button type="button" onClick={() => { onSelect(''); onSearchChange('') }}
            style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      ) : (
        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Kein Asset ausgewählt</p>
      )}

      {/* Suche */}
      <input
        placeholder={`${label} suchen…`}
        value={searchValue}
        onChange={e => onSearchChange(e.target.value)}
        style={{
          width: '100%', padding: '7px 10px', borderRadius: 8,
          border: '1px solid var(--ds-border)', fontSize: 13, outline: 'none',
          boxSizing: 'border-box', fontFamily: 'Arial, sans-serif',
        }}
      />

      {/* Liste (nur wenn Suche aktiv oder kein Asset gewählt) */}
      {(searchValue || !selectedId) && (
        <div style={{
          background: 'var(--ds-surface)', border: '1px solid var(--ds-border)', borderRadius: 8,
          marginTop: 4, maxHeight: 180, overflowY: 'auto',
        }}>
          {!selectedId && (
            <div
              onClick={() => { onSelect(''); onSearchChange('') }}
              style={{
                padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f4f6f9',
                fontSize: 12, color: '#9ca3af', fontStyle: 'italic',
              }}
            >
              — kein Asset —
            </div>
          )}
          {assets.slice(0, 80).map(a => (
            <div
              key={a.id}
              onClick={() => { onSelect(a.id); onSearchChange('') }}
              style={{
                padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f4f6f9',
                background: selectedId === a.id ? '#e8f4fd' : 'transparent',
                display: 'flex', flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#003366' }}>{a.name}</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                {[a.serial_number ? `SN: ${a.serial_number}` : null, a.category].filter(Boolean).join(' · ')}
              </span>
            </div>
          ))}
          {assets.length === 0 && (
            <p style={{ padding: '12px', color: '#9ca3af', fontSize: 12, textAlign: 'center', margin: 0 }}>
              Keine Treffer
            </p>
          )}
          {assets.length > 80 && (
            <p style={{ padding: '8px', color: '#9ca3af', fontSize: 11, textAlign: 'center', margin: 0 }}>
              +{assets.length - 80} weitere – Suche verfeinern
            </p>
          )}
        </div>
      )}
    </div>
  )
}
