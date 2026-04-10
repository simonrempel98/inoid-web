'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Asset = { id: string; name: string; serial_number: string | null }

export function FixedSlotEditClient({
  slotId,
  slotLabel,
  currentAssetId,
  currentAssetName,
  assets,
  backHref,
  dwLabel,
  machineName,
}: {
  slotId: string
  slotLabel: string
  currentAssetId: string | null
  currentAssetName: string | null
  assets: Asset[]
  backHref: string
  dwLabel: string
  machineName: string
}) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string>(currentAssetId ?? '')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = assets.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.serial_number ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleSave() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/flexodruck/fixed-slots/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: selectedId || null }),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Fehler')
      return
    }
    router.push(backHref)
    router.refresh()
  }

  return (
    <div style={{ padding: '28px 24px 60px', maxWidth: 520 }}>
      <Link href={backHref} style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none', fontFamily: 'Arial, sans-serif' }}>
        ← {machineName}
      </Link>

      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#003366', margin: '8px 0 2px', fontFamily: 'Arial, sans-serif' }}>
        {slotLabel} verknüpfen
      </h1>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px', fontFamily: 'Arial, sans-serif' }}>
        {dwLabel} · {machineName}
      </p>

      {/* Aktuell */}
      {currentAssetName && (
        <div style={{
          background: '#e8f4fd', borderRadius: 10, border: '1px solid #bfdbfe',
          padding: '10px 14px', marginBottom: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aktuell verknüpft</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>{currentAssetName}</p>
          </div>
          <button type="button" onClick={() => { setSelectedId(''); setSearch('') }}
            style={{ fontSize: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
            Entfernen
          </button>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Asset suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8,
            border: '1px solid #c8d4e8', fontSize: 14, fontFamily: 'Arial, sans-serif',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Asset-Liste */}
      <div style={{
        background: 'white', borderRadius: 12, border: '1px solid #c8d4e8',
        overflow: 'hidden', maxHeight: 340, overflowY: 'auto', marginBottom: 16,
      }}>
        <div
          onClick={() => setSelectedId('')}
          style={{
            padding: '10px 14px', cursor: 'pointer',
            background: selectedId === '' ? '#e8f4fd' : 'transparent',
            borderBottom: '1px solid #f4f6f9',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #0099cc', flexShrink: 0, background: selectedId === '' ? '#0099cc' : 'transparent' }} />
          <span style={{ fontSize: 13, color: '#6b7280', fontFamily: 'Arial, sans-serif', fontStyle: 'italic' }}>Kein Asset (Zuweisung entfernen)</span>
        </div>
        {filtered.slice(0, 100).map(a => (
          <div
            key={a.id}
            onClick={() => setSelectedId(a.id)}
            style={{
              padding: '10px 14px', cursor: 'pointer',
              background: selectedId === a.id ? '#e8f4fd' : 'transparent',
              borderBottom: '1px solid #f4f6f9',
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #0099cc', flexShrink: 0, background: selectedId === a.id ? '#0099cc' : 'transparent' }} />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#003366', fontFamily: 'Arial, sans-serif' }}>{a.name}</p>
              {a.serial_number && <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>{a.serial_number}</p>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ padding: '20px', color: '#6b7280', fontSize: 13, textAlign: 'center', fontFamily: 'Arial, sans-serif', margin: 0 }}>
            Keine Assets gefunden
          </p>
        )}
      </div>

      {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12, fontFamily: 'Arial, sans-serif' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button" onClick={handleSave} disabled={loading}
          style={{
            background: loading ? '#c8d4e8' : '#003366', color: 'white',
            padding: '12px 28px', borderRadius: 50, border: 'none',
            fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {loading ? 'Wird gespeichert…' : 'Speichern'}
        </button>
        <Link href={backHref} style={{
          background: 'transparent', color: '#6b7280',
          padding: '12px 20px', borderRadius: 50, border: '1px solid #c8d4e8',
          fontSize: 14, fontWeight: 600, fontFamily: 'Arial, sans-serif', textDecoration: 'none',
        }}>
          Abbrechen
        </Link>
      </div>
    </div>
  )
}
