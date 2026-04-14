'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import jsQR from 'jsqr'

type Asset = {
  id: string
  name: string
  serial_number: string | null
  article_number: string | null
  category: string | null
  manufacturer: string | null
  status: string | null
}

type SelectedAsset = { id: string; name: string; serial_number: string | null }

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e', aktiv: '#22c55e',
  inactive: '#9ca3af', inaktiv: '#9ca3af',
  in_use: '#0099cc', inuse: '#0099cc',
  in_repair: '#f59e0b',
  defect: '#ef4444', defekt: '#ef4444',
}

function statusColor(s: string | null) {
  if (!s) return '#c8d4e8'
  return STATUS_COLORS[s.toLowerCase()] ?? '#c8d4e8'
}

// ── QR-Scanner ───────────────────────────────────────────────────────────────
function QrScannerModal({ onMatch, onClose }: { onMatch: (uuid: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number>(0)
  const cooldownRef = useRef(false)
  const [scanning, setScanning] = useState(false)
  const [found, setFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permDenied, setPermDenied] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play()
      }
      setScanning(true)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('Permission') || msg.includes('NotAllowed')) setPermDenied(true)
      else setError(`Kamerafehler: ${msg}`)
    }
  }, [])

  useEffect(() => {
    if (!scanning) return
    const canvas = canvasRef.current
    if (!canvas) return
    const SCAN_W = 640
    canvas.width = SCAN_W
    canvas.height = 360
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    cooldownRef.current = false
    let lastAttempt = 0
    const scan = (ts: number) => {
      animRef.current = requestAnimationFrame(scan)
      if (ts - lastAttempt < 200) return
      lastAttempt = ts
      const video = videoRef.current
      if (!video || video.readyState < 2 || video.videoWidth === 0) return
      const h = Math.round(video.videoHeight * SCAN_W / video.videoWidth)
      if (canvas.height !== h) canvas.height = h
      ctx.drawImage(video, 0, 0, SCAN_W, h)
      let imageData: ImageData
      try { imageData = ctx.getImageData(0, 0, SCAN_W, h) } catch { return }
      if (cooldownRef.current) return
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' })
      if (!code?.data) return
      cooldownRef.current = true
      const match = code.data.match(/\/assets\/([0-9a-f-]{36})/i)
      if (match) {
        setFound(true)
        setTimeout(() => onMatch(match[1]), 600)
      } else {
        setError('Unbekannter QR-Code – kein Asset-Link.')
        setTimeout(() => { setError(null); cooldownRef.current = false }, 2000)
      }
    }
    animRef.current = requestAnimationFrame(scan)
    return () => cancelAnimationFrame(animRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning])

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(animRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(0,0,0,0.6)' }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 16, fontFamily: 'Arial, sans-serif' }}>Asset scannen</span>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      {permDenied ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
          <p style={{ color: 'white', fontSize: 15, fontFamily: 'Arial, sans-serif', marginBottom: 20 }}>Kamerazugriff verweigert.</p>
          <button onClick={onClose} style={{ background: '#003366', color: 'white', border: 'none', borderRadius: 50, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>Schließen</button>
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {!found && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ position: 'relative', width: 220, height: 220 }}>
                {[
                  { top: 0, left: 0, borderTop: '3px solid white', borderLeft: '3px solid white', borderRadius: '10px 0 0 0' },
                  { top: 0, right: 0, borderTop: '3px solid white', borderRight: '3px solid white', borderRadius: '0 10px 0 0' },
                  { bottom: 0, left: 0, borderBottom: '3px solid white', borderLeft: '3px solid white', borderRadius: '0 0 0 10px' },
                  { bottom: 0, right: 0, borderBottom: '3px solid white', borderRight: '3px solid white', borderRadius: '0 0 10px 0' },
                ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...s as React.CSSProperties }} />)}
                <div style={{ position: 'absolute', left: 4, right: 4, height: 2, background: 'rgba(0,153,204,0.8)', animation: 'qrscanline 2s ease-in-out infinite' }} />
              </div>
            </div>
          )}
          {found && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(39,174,96,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'var(--ds-surface)', borderRadius: 20, padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>✓</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#27AE60', fontFamily: 'Arial, sans-serif' }}>Asset gefunden!</span>
              </div>
            </div>
          )}
          {error && (
            <div style={{ position: 'absolute', bottom: 24, left: 16, right: 16, background: 'rgba(220,38,38,0.9)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ color: 'white', fontSize: 13, margin: 0, fontFamily: 'Arial, sans-serif' }}>{error}</p>
            </div>
          )}
        </div>
      )}
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', padding: '12px 20px 20px', margin: 0, fontFamily: 'Arial, sans-serif' }}>
        Halte die Kamera auf den QR-Code des Assets
      </p>
      <style>{`@keyframes qrscanline { 0% { top: 4px; } 50% { top: calc(100% - 6px); } 100% { top: 4px; } }`}</style>
    </div>
  )
}

// ── Haupt-Komponente ─────────────────────────────────────────────────────────
export function FixedSlotEditClient({
  slotId, slotLabel, currentAssets, assets, backHref, dwLabel, machineName,
}: {
  slotId: string
  slotLabel: string
  currentAssets: SelectedAsset[]
  assets: Asset[]
  backHref: string
  dwLabel: string
  machineName: string
}) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>(currentAssets.map(a => a.id))
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterManufacturer, setFilterManufacturer] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'category' | 'manufacturer'>('name_asc')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scanNotFound, setScanNotFound] = useState<string | null>(null)

  const categories = Array.from(new Set(assets.map(a => a.category).filter(Boolean))).sort() as string[]
  const manufacturers = Array.from(new Set(assets.map(a => a.manufacturer).filter(Boolean))).sort() as string[]
  const statuses = Array.from(new Set(assets.map(a => a.status).filter(Boolean))).sort() as string[]

  function toggle(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const filtered = assets.filter(a => {
    if (filterCategory && a.category !== filterCategory) return false
    if (filterManufacturer && a.manufacturer !== filterManufacturer) return false
    if (filterStatus && a.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      if (!a.name.toLowerCase().includes(q) &&
          !(a.serial_number ?? '').toLowerCase().includes(q) &&
          !(a.article_number ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
    if (sortBy === 'category') return (a.category ?? '').localeCompare(b.category ?? '')
    if (sortBy === 'manufacturer') return (a.manufacturer ?? '').localeCompare(b.manufacturer ?? '')
    return 0
  })

  function handleQrMatch(uuid: string) {
    setShowScanner(false)
    const found = assets.find(a => a.id === uuid)
    if (found) {
      setScanNotFound(null)
      if (!selectedIds.includes(found.id)) setSelectedIds(prev => [...prev, found.id])
    } else {
      setScanNotFound(`Asset mit ID ${uuid} nicht gefunden.`)
    }
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/flexodruck/fixed-slots/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_ids: selectedIds }),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Fehler beim Speichern')
      return
    }
    router.push(backHref)
    router.refresh()
  }

  const selectedAssets = selectedIds.map(id => assets.find(a => a.id === id)).filter(Boolean) as Asset[]

  return (
    <>
      {showScanner && <QrScannerModal onMatch={handleQrMatch} onClose={() => setShowScanner(false)} />}

      <div style={{ padding: '28px 24px 80px', maxWidth: 560, fontFamily: 'Arial, sans-serif' }}>
        <Link href={backHref} style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>
          ← {machineName}
        </Link>

        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#003366', margin: '8px 0 2px' }}>
          Assets verknüpfen
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>
          Trägerstange <span style={{ color: '#9ca3af' }}>{slotLabel}</span> · {dwLabel} · {machineName}
        </p>

        {/* Ausgewählte Assets */}
        {selectedAssets.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
              Verknüpft ({selectedAssets.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedAssets.map((a, i) => (
                <div key={a.id} style={{
                  background: '#e8f4fd', borderRadius: 10, border: '1px solid #bfdbfe',
                  padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#0099cc', width: 18, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#003366', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                    {a.serial_number && <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>SN: {a.serial_number}</p>}
                  </div>
                  <button type="button" onClick={() => toggle(a.id)}
                    style={{ fontSize: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {scanNotFound && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{scanNotFound}</p>}

        {/* Suchzeile + QR */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            placeholder="Suche: Name, Serien-Nr., Artikel-Nr."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--ds-border)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          <button type="button" onClick={() => { setScanNotFound(null); setShowScanner(true) }}
            title="QR-Code scannen"
            style={{ width: 42, height: 42, borderRadius: 8, flexShrink: 0, background: '#003366', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h2v2h-2z"/><path d="M18 14h3v3h-3z"/><path d="M14 18h3v3h-3z"/>
            </svg>
          </button>
        </div>

        {/* Filter */}
        {(categories.length > 0 || manufacturers.length > 0 || statuses.length > 0) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {categories.length > 0 && (
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--ds-border)', fontSize: 13, outline: 'none', background: filterCategory ? '#e8f4fd' : 'white', color: '#003366' }}>
                <option value="">Alle Kategorien</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {manufacturers.length > 0 && (
              <select value={filterManufacturer} onChange={e => setFilterManufacturer(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--ds-border)', fontSize: 13, outline: 'none', background: filterManufacturer ? '#e8f4fd' : 'white', color: '#003366' }}>
                <option value="">Alle Hersteller</option>
                {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            {statuses.length > 0 && (
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--ds-border)', fontSize: 13, outline: 'none', background: filterStatus ? '#e8f4fd' : 'white', color: '#003366' }}>
                <option value="">Alle Status</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Sortierung */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {(['name_asc', 'name_desc', 'category', 'manufacturer'] as const).map(opt => {
            const labels = { name_asc: 'Name A–Z', name_desc: 'Name Z–A', category: 'Kategorie', manufacturer: 'Hersteller' }
            return (
              <button key={opt} type="button" onClick={() => setSortBy(opt)}
                style={{ padding: '5px 10px', borderRadius: 50, fontSize: 12, border: '1px solid', borderColor: sortBy === opt ? '#003366' : '#c8d4e8', background: sortBy === opt ? '#003366' : 'white', color: sortBy === opt ? 'white' : '#6b7280', cursor: 'pointer' }}>
                {labels[opt]}
              </button>
            )
          })}
        </div>

        {/* Asset-Liste */}
        <div style={{ background: 'var(--ds-surface)', borderRadius: 12, border: '1px solid var(--ds-border)', overflow: 'hidden', maxHeight: 420, overflowY: 'auto', marginBottom: 16 }}>
          {sorted.slice(0, 200).map((a, idx) => {
            const checked = selectedIds.includes(a.id)
            return (
              <div key={a.id} onClick={() => toggle(a.id)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  background: checked ? '#f0f9ff' : idx % 2 === 0 ? 'white' : '#fafbfc',
                  borderBottom: '1px solid #f0f2f5',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                {/* Checkbox */}
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: checked ? 'none' : '2px solid #c8d4e8',
                  background: checked ? '#003366' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(a.status), flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#003366', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                    {a.serial_number && <span style={{ fontSize: 11, color: '#6b7280' }}>SN: {a.serial_number}</span>}
                    {a.article_number && <span style={{ fontSize: 11, color: '#6b7280' }}>Art: {a.article_number}</span>}
                    {a.category && <span style={{ fontSize: 11, color: '#9ca3af' }}>{a.category}</span>}
                    {a.manufacturer && <span style={{ fontSize: 11, color: '#9ca3af' }}>{a.manufacturer}</span>}
                  </div>
                </div>
              </div>
            )
          })}
          {sorted.length === 0 && (
            <p style={{ padding: '24px', color: '#6b7280', fontSize: 13, textAlign: 'center', margin: 0 }}>Keine Assets gefunden</p>
          )}
          {sorted.length > 200 && (
            <p style={{ padding: '10px', color: '#9ca3af', fontSize: 12, textAlign: 'center', margin: 0 }}>
              {sorted.length - 200} weitere – Suche verfeinern
            </p>
          )}
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="button" onClick={handleSave} disabled={loading}
            style={{ background: loading ? '#c8d4e8' : '#003366', color: 'white', padding: '12px 28px', borderRadius: 50, border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
            {loading ? 'Speichern…' : `Speichern${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}`}
          </button>
          <Link href={backHref} style={{ background: 'transparent', color: '#6b7280', padding: '12px 20px', borderRadius: 50, border: '1px solid var(--ds-border)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Abbrechen
          </Link>
        </div>
      </div>
    </>
  )
}
