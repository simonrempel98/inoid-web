'use client'

import { useState, useRef } from 'react'

// ── Typen ─────────────────────────────────────────────────────────────────────

export type CanvasCircle = {
  id: string
  x: number
  y: number
  r: number
  label: string
  color: string
}

export type CanvasDW = {
  id: string
  position: number
  label: string | null
  color_hint: string | null
}

type Guide = { type: 'h' | 'v'; pos: number }

// ── Konstanten ────────────────────────────────────────────────────────────────

const VW   = 820
const VH   = 540
const GRID = 20          // Raster-Schrittweite in SVG-px
const SNAP = 8           // Smart-Guide Einrast-Schwelle in SVG-px

const PRESET_COLORS = [
  '#003366', '#0099cc', '#1abc9c', '#27ae60',
  '#f39c12', '#e67e22', '#e74c3c', '#9b59b6',
  '#2c3e50', '#7f8c8d',
]

const SIZES: { label: string; r: number }[] = [
  { label: 'XS', r: 18 },
  { label: 'S',  r: 28 },
  { label: 'M',  r: 40 },
  { label: 'L',  r: 55 },
  { label: 'XL', r: 72 },
]

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function uid() { return crypto.randomUUID() }

function snap(v: number) { return Math.round(v / GRID) * GRID }

function makeDefaultLayout(druckwerke: CanvasDW[]): CanvasCircle[] {
  const circles: CanvasCircle[] = [{
    id: uid(), x: VW / 2, y: VH / 2, r: 68,
    label: 'Zentralzylinder', color: '#003366',
  }]
  const n = druckwerke.length
  if (n === 0) return circles

  const MAX_DEG  = n <= 2 ? 40 : n <= 4 ? 52 : n <= 6 ? 62 : n <= 8 ? 72 : 80
  const MAX_RAD  = MAX_DEG * Math.PI / 180
  const rightCnt = Math.ceil(n / 2)
  const leftCnt  = n - rightCnt
  const DIST     = 180

  druckwerke.forEach((dw, i) => {
    let angle: number
    if (i < rightCnt) {
      const t = rightCnt === 1 ? 0.5 : i / (rightCnt - 1)
      angle = -MAX_RAD + t * 2 * MAX_RAD
    } else {
      const si = i - rightCnt
      const t  = leftCnt === 1 ? 0.5 : si / (leftCnt - 1)
      angle = (Math.PI - MAX_RAD) + t * 2 * MAX_RAD
    }
    circles.push({
      id: uid(),
      x: Math.round(VW / 2 + DIST * Math.cos(angle)),
      y: Math.round(VH / 2 + DIST * Math.sin(angle)),
      r: 36,
      label: dw.label ?? `DW ${dw.position}`,
      color: dw.color_hint ?? '#0099cc',
    })
  })
  return circles
}

// ── Label in Zeilen umbrechen ─────────────────────────────────────────────────

function wrapLabel(label: string, maxChars = 12): string[] {
  const words = label.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) {
      lines.push(cur.trim()); cur = w
    } else {
      cur = (cur + ' ' + w).trim()
    }
  }
  if (cur) lines.push(cur)
  return lines
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export function MachineCanvas({
  machineId,
  initialLayout,
  druckwerke,
  canEdit,
}: {
  machineId: string
  initialLayout: CanvasCircle[] | null
  druckwerke: CanvasDW[]
  canEdit: boolean
}) {
  const [circles,    setCircles]    = useState<CanvasCircle[]>(initialLayout ?? [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [snapGrid,   setSnapGrid]   = useState(false)
  const [guides,     setGuides]     = useState<Guide[]>([])
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)

  const dragRef = useRef<{
    id: string
    startPx: number; startPy: number
    origX: number;   origY: number
  } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const selected = circles.find(c => c.id === selectedId) ?? null

  // ── SVG-Koordinaten ──
  function svgPt(e: React.PointerEvent) {
    const svg = svgRef.current!
    const pt  = svg.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const m = svg.getScreenCTM()
    if (!m) return { x: e.clientX, y: e.clientY }
    const t = pt.matrixTransform(m.inverse())
    return { x: t.x, y: t.y }
  }

  // ── Drag Start ──
  function onCirclePointerDown(e: React.PointerEvent, id: string) {
    if (!canEdit) { setSelectedId(id); return }
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const pt     = svgPt(e)
    const circle = circles.find(c => c.id === id)!
    dragRef.current = { id, startPx: pt.x, startPy: pt.y, origX: circle.x, origY: circle.y }
    setSelectedId(id)
  }

  // ── Drag Move + Smart Guides ──
  function onSVGPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const pt = svgPt(e)
    const dx = pt.x - dragRef.current.startPx
    const dy = pt.y - dragRef.current.startPy

    let nx = dragRef.current.origX + dx
    let ny = dragRef.current.origY + dy

    // 1. Grid-Snap (wenn aktiviert)
    if (snapGrid) { nx = snap(nx); ny = snap(ny) }

    // 2. Smart Guides: Mittelpunkt + Kanten anderer Kreise
    const activeGuides: Guide[] = []
    const dragId = dragRef.current.id
    const dragR  = circles.find(c => c.id === dragId)?.r ?? 0

    for (const other of circles) {
      if (other.id === dragId) continue

      // Mittelpunkte
      const checkX = [other.x]
      const checkY = [other.y]
      // Kanten links/rechts (gleicher Radius → Außenkante ausrichten)
      checkX.push(other.x - other.r, other.x + other.r)
      checkY.push(other.y - other.r, other.y + other.r)
      // Eigene Kanten gegen fremde Mitte
      checkX.push(other.x - other.r - dragR, other.x + other.r + dragR)
      checkY.push(other.y - other.r - dragR, other.y + other.r + dragR)

      for (const cx of checkX) {
        if (Math.abs(nx - cx) < SNAP && !snapGrid) {
          nx = cx
          if (!activeGuides.find(g => g.type === 'v' && g.pos === cx))
            activeGuides.push({ type: 'v', pos: cx })
        }
      }
      for (const cy of checkY) {
        if (Math.abs(ny - cy) < SNAP && !snapGrid) {
          ny = cy
          if (!activeGuides.find(g => g.type === 'h' && g.pos === cy))
            activeGuides.push({ type: 'h', pos: cy })
        }
      }
    }

    setGuides(activeGuides)
    setCircles(prev => prev.map(c =>
      c.id === dragId ? { ...c, x: nx, y: ny } : c
    ))
  }

  // ── Drag End ──
  function onPointerUp() {
    dragRef.current = null
    setGuides([])
  }

  // ── Kreis hinzufügen ──
  function addCircle(preset: { label: string; r: number; color: string }) {
    const newC: CanvasCircle = {
      id: uid(),
      x: VW / 2 + (Math.random() - 0.5) * 240,
      y: VH / 2 + (Math.random() - 0.5) * 160,
      r: preset.r, label: preset.label, color: preset.color,
    }
    setCircles(prev => [...prev, newC])
    setSelectedId(newC.id)
  }

  function updateSelected(patch: Partial<CanvasCircle>) {
    if (!selectedId) return
    setCircles(prev => prev.map(c => c.id === selectedId ? { ...c, ...patch } : c))
  }

  function deleteSelected() {
    setCircles(prev => prev.filter(c => c.id !== selectedId))
    setSelectedId(null)
  }

  function generateFromDW() {
    setCircles(makeDefaultLayout(druckwerke))
    setSelectedId(null)
  }

  async function save() {
    setSaving(true)
    await fetch(`/api/flexodruck/machines/${machineId}/canvas`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout: circles }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      background: 'var(--ds-surface)', borderRadius: 16,
      border: '1px solid var(--ds-border)', overflow: 'hidden',
      fontFamily: 'Arial, sans-serif', marginBottom: 20,
    }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '10px 14px', borderBottom: '1px solid var(--ds-border)',
      }}>
        {canEdit && (
          <>
            <ToolBtn label="+ Zylinder"   color="#003366" onClick={() => addCircle({ label: 'Zylinder',   r: 68, color: '#003366' })} />
            <ToolBtn label="+ Druckwerk"  color="#0099cc" onClick={() => addCircle({ label: 'Druckwerk',  r: 36, color: '#0099cc' })} />
            <ToolBtn label="+ Kreis"      color="#7f8c8d" onClick={() => addCircle({ label: 'Neu',        r: 26, color: '#7f8c8d' })} />
            {druckwerke.length > 0 && (
              <ToolBtn label="Aus Druckwerken" color="#1abc9c" outline onClick={generateFromDW} />
            )}

            {/* Trennlinie */}
            <div style={{ width: 1, height: 20, background: 'var(--ds-border)', margin: '0 4px' }} />

            {/* Grid-Snap Toggle */}
            <button
              onClick={() => setSnapGrid(v => !v)}
              title="Am Raster einrasten"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: snapGrid ? '#003366' : 'var(--ds-surface2)',
                color: snapGrid ? 'white' : '#6b7280',
                border: `1.5px solid ${snapGrid ? '#003366' : 'var(--ds-border)'}`,
                borderRadius: 20, padding: '5px 13px',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <GridIcon active={snapGrid} />
              Raster
            </button>
          </>
        )}

        <div style={{ flex: 1 }} />
        {saved && <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>✓ Gespeichert</span>}
        {canEdit && (
          <button onClick={save} disabled={saving} style={{
            background: saving ? '#c8d4e8' : '#003366', color: 'white',
            border: 'none', borderRadius: 20, padding: '6px 18px',
            fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
          }}>
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        )}
      </div>

      {/* ── Canvas + Edit-Panel ── */}
      <div style={{ display: 'flex', minHeight: 380 }}>

        {/* SVG Whiteboard */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ flex: 1, display: 'block', touchAction: 'none', cursor: 'default', minWidth: 0 }}
          onPointerMove={onSVGPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => setSelectedId(null)}
        >
          <defs>
            {/* Raster-Punkte (GRID×GRID) */}
            <pattern id="wbDots" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <circle cx="0.7" cy="0.7" r="0.7"
                fill={snapGrid ? 'rgba(0,153,204,0.35)' : 'var(--ds-border)'} />
            </pattern>
          </defs>

          {/* Hintergrund */}
          <rect width={VW} height={VH} fill="var(--ds-surface2)" />
          <rect width={VW} height={VH} fill="url(#wbDots)" />

          {/* ── Smart-Guide Linien ── */}
          {guides.map((g, i) =>
            g.type === 'h'
              ? <line key={i} x1={0} y1={g.pos} x2={VW} y2={g.pos}
                  stroke="#0099cc" strokeWidth="1" strokeDasharray="5 4" opacity="0.8" />
              : <line key={i} x1={g.pos} y1={0} x2={g.pos} y2={VH}
                  stroke="#0099cc" strokeWidth="1" strokeDasharray="5 4" opacity="0.8" />
          )}

          {/* Leer-Hinweis */}
          {circles.length === 0 && (
            <text x={VW / 2} y={VH / 2} textAnchor="middle" dominantBaseline="central"
              fill="#9ca3af" fontSize="14" fontFamily="Arial, sans-serif">
              {canEdit ? '← Kreis hinzufügen oder „Aus Druckwerken" wählen' : 'Noch kein Layout gespeichert'}
            </text>
          )}

          {/* ── Kreise ── */}
          {circles.map(circle => {
            const sel      = circle.id === selectedId
            const fontSize = circle.r < 24 ? 8 : circle.r < 36 ? 10 : circle.r < 52 ? 12 : 14
            const lines    = wrapLabel(circle.label)
            const lineH    = fontSize * 1.3
            const startY   = -(lines.length - 1) * lineH / 2

            return (
              <g key={circle.id}
                onClick={e => { e.stopPropagation(); setSelectedId(circle.id) }}
                onPointerDown={e => onCirclePointerDown(e, circle.id)}
                style={{ cursor: canEdit ? 'grab' : 'pointer' }}
              >
                {/* Auswahl-Ring */}
                {sel && (
                  <circle cx={circle.x} cy={circle.y} r={circle.r + 7}
                    fill="none" stroke="#0099cc" strokeWidth="2" strokeDasharray="6 3" />
                )}

                {/* Hauptkreis */}
                <circle cx={circle.x} cy={circle.y} r={circle.r}
                  fill={circle.color}
                  stroke={sel ? '#0099cc' : 'rgba(255,255,255,0.25)'}
                  strokeWidth={sel ? 2.5 : 1.5}
                />

                {/* Beschriftung */}
                {lines.map((line, li) => (
                  <text key={li}
                    x={circle.x} y={circle.y + startY + li * lineH}
                    textAnchor="middle" dominantBaseline="central"
                    fill="white" fontSize={fontSize} fontWeight="700"
                    fontFamily="Arial, sans-serif"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {line}
                  </text>
                ))}
              </g>
            )
          })}
        </svg>

        {/* ── Edit-Panel ── */}
        {canEdit && selected && (
          <div style={{
            width: 200, flexShrink: 0,
            borderLeft: '1px solid var(--ds-border)',
            background: 'var(--ds-surface)',
            padding: 14, display: 'flex', flexDirection: 'column', gap: 14,
            overflowY: 'auto',
          }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Bearbeiten
            </p>

            {/* Beschriftung */}
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Beschriftung</label>
              <input
                value={selected.label}
                onChange={e => updateSelected({ label: e.target.value })}
                maxLength={40}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: '1px solid var(--ds-border)', borderRadius: 8,
                  padding: '7px 9px', fontSize: 13,
                  background: 'var(--ds-surface2)', color: 'var(--ds-text)', outline: 'none',
                }}
              />
            </div>

            {/* Größe */}
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 5 }}>Größe</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {SIZES.map(s => (
                  <button key={s.label} onClick={() => updateSelected({ r: s.r })}
                    style={{
                      flex: 1, padding: '5px 0', fontSize: 10, fontWeight: 700,
                      borderRadius: 6, cursor: 'pointer',
                      border: `1.5px solid ${selected.r === s.r ? '#003366' : 'var(--ds-border)'}`,
                      background: selected.r === s.r ? '#003366' : 'var(--ds-surface2)',
                      color: selected.r === s.r ? 'white' : 'var(--ds-text)',
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position (manuell eingeben) */}
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 5 }}>Position</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: '#9ca3af' }}>X</label>
                  <input
                    type="number"
                    value={Math.round(selected.x)}
                    onChange={e => updateSelected({ x: Number(e.target.value) })}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      border: '1px solid var(--ds-border)', borderRadius: 6,
                      padding: '5px 6px', fontSize: 12,
                      background: 'var(--ds-surface2)', color: 'var(--ds-text)', outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: '#9ca3af' }}>Y</label>
                  <input
                    type="number"
                    value={Math.round(selected.y)}
                    onChange={e => updateSelected({ y: Number(e.target.value) })}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      border: '1px solid var(--ds-border)', borderRadius: 6,
                      padding: '5px 6px', fontSize: 12,
                      background: 'var(--ds-surface2)', color: 'var(--ds-text)', outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Farbe */}
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 5 }}>Farbe</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => updateSelected({ color: c })} title={c}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: selected.color === c ? '3px solid #0099cc' : '2px solid rgba(0,0,0,0.1)',
                      outline: selected.color === c ? '2px solid white' : 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <label style={{ fontSize: 11, color: '#9ca3af' }}>Eigene:</label>
                <input type="color" value={selected.color}
                  onChange={e => updateSelected({ color: e.target.value })}
                  style={{ width: 32, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 0 }}
                />
              </div>
            </div>

            {/* Löschen */}
            <button onClick={deleteSelected} style={{
              marginTop: 'auto', background: 'none',
              border: '1px solid #fca5a5', color: '#ef4444',
              borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              Kreis löschen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Toolbar Button ────────────────────────────────────────────────────────────

function ToolBtn({ label, color, outline = false, onClick }: {
  label: string; color: string; outline?: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      background: outline ? 'none' : color,
      color: outline ? color : 'white',
      border: `1.5px solid ${color}`,
      borderRadius: 20, padding: '5px 13px',
      fontSize: 11, fontWeight: 700, cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}

// ── Grid-Icon ─────────────────────────────────────────────────────────────────

function GridIcon({ active }: { active: boolean }) {
  const c = active ? 'white' : '#6b7280'
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      {[0, 4, 8].map(x => [0, 4, 8].map(y => (
        <circle key={`${x}-${y}`} cx={x + 1} cy={y + 1} r="1" fill={c} />
      )))}
    </svg>
  )
}
