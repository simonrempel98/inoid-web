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

// ── Konstanten ────────────────────────────────────────────────────────────────

const VW = 820
const VH = 540

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

function uid() {
  return crypto.randomUUID()
}

function makeDefaultLayout(druckwerke: CanvasDW[]): CanvasCircle[] {
  const circles: CanvasCircle[] = [
    {
      id: uid(),
      x: VW / 2, y: VH / 2,
      r: 68,
      label: 'Zentralzylinder',
      color: '#003366',
    },
  ]
  const n = druckwerke.length
  if (n === 0) return circles

  // Rechts: obere Hälfte → untere Hälfte, Links: untere → obere (CI-Flexo-Stil)
  const MAX_DEG = n <= 2 ? 40 : n <= 4 ? 52 : n <= 6 ? 62 : n <= 8 ? 72 : 80
  const MAX_RAD = MAX_DEG * Math.PI / 180
  const rightCount = Math.ceil(n / 2)
  const leftCount  = n - rightCount
  const DIST = 180

  druckwerke.forEach((dw, i) => {
    let angle: number
    if (i < rightCount) {
      const t = rightCount === 1 ? 0.5 : i / (rightCount - 1)
      angle = -MAX_RAD + t * 2 * MAX_RAD
    } else {
      const si = i - rightCount
      const t  = leftCount === 1 ? 0.5 : si / (leftCount - 1)
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
  const [circles, setCircles] = useState<CanvasCircle[]>(initialLayout ?? [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const dragRef = useRef<{
    id: string
    startPx: number; startPy: number
    origX: number; origY: number
  } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const selected = circles.find(c => c.id === selectedId) ?? null

  // ── SVG-Koordinaten aus Pointer-Event ──
  function svgPt(e: React.PointerEvent) {
    const svg = svgRef.current!
    const pt  = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const m = svg.getScreenCTM()
    if (!m) return { x: e.clientX, y: e.clientY }
    const inv = m.inverse()
    const t   = pt.matrixTransform(inv)
    return { x: t.x, y: t.y }
  }

  // ── Drag ──
  function onCirclePointerDown(e: React.PointerEvent, id: string) {
    if (!canEdit) { setSelectedId(id); return }
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const pt     = svgPt(e)
    const circle = circles.find(c => c.id === id)!
    dragRef.current = { id, startPx: pt.x, startPy: pt.y, origX: circle.x, origY: circle.y }
    setSelectedId(id)
  }

  function onSVGPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const pt = svgPt(e)
    const dx = pt.x - dragRef.current.startPx
    const dy = pt.y - dragRef.current.startPy
    const nx = dragRef.current.origX + dx
    const ny = dragRef.current.origY + dy
    setCircles(prev => prev.map(c =>
      c.id === dragRef.current!.id ? { ...c, x: nx, y: ny } : c
    ))
  }

  function onPointerUp() {
    dragRef.current = null
  }

  // ── Kreis hinzufügen ──
  function addCircle(preset: { label: string; r: number; color: string }) {
    const newC: CanvasCircle = {
      id: uid(),
      x: VW / 2 + (Math.random() - 0.5) * 240,
      y: VH / 2 + (Math.random() - 0.5) * 160,
      r: preset.r,
      label: preset.label,
      color: preset.color,
    }
    setCircles(prev => [...prev, newC])
    setSelectedId(newC.id)
  }

  // ── Selected aktualisieren ──
  function updateSelected(patch: Partial<CanvasCircle>) {
    if (!selectedId) return
    setCircles(prev => prev.map(c => c.id === selectedId ? { ...c, ...patch } : c))
  }

  function deleteSelected() {
    setCircles(prev => prev.filter(c => c.id !== selectedId))
    setSelectedId(null)
  }

  // ── Aus DW-Daten erzeugen ──
  function generateFromDW() {
    const layout = makeDefaultLayout(druckwerke)
    setCircles(layout)
    setSelectedId(null)
  }

  // ── Speichern ──
  async function save() {
    setSaving(true)
    await fetch(`/api/flexodruck/machines/${machineId}/canvas`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout: circles }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      background: 'var(--ds-surface)',
      borderRadius: 16,
      border: '1px solid var(--ds-border)',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      marginBottom: 20,
    }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '10px 14px',
        borderBottom: '1px solid var(--ds-border)',
      }}>
        {canEdit && (
          <>
            <ToolBtn
              label="+ Zylinder"
              color="#003366"
              onClick={() => addCircle({ label: 'Zylinder', r: 68, color: '#003366' })}
            />
            <ToolBtn
              label="+ Druckwerk"
              color="#0099cc"
              onClick={() => addCircle({ label: 'Druckwerk', r: 36, color: '#0099cc' })}
            />
            <ToolBtn
              label="+ Kreis"
              color="#7f8c8d"
              onClick={() => addCircle({ label: 'Neu', r: 26, color: '#7f8c8d' })}
            />
            {druckwerke.length > 0 && (
              <ToolBtn
                label="Aus Druckwerken"
                color="#1abc9c"
                outline
                onClick={generateFromDW}
              />
            )}
          </>
        )}

        <div style={{ flex: 1 }} />

        {saved && (
          <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>✓ Gespeichert</span>
        )}

        {canEdit && (
          <button
            onClick={save}
            disabled={saving}
            style={{
              background: saving ? '#c8d4e8' : '#003366',
              color: 'white', border: 'none', borderRadius: 20,
              padding: '6px 18px', fontSize: 12, fontWeight: 700,
              cursor: saving ? 'default' : 'pointer',
            }}
          >
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
          style={{
            flex: 1, display: 'block',
            touchAction: 'none',
            cursor: 'default',
            minWidth: 0,
          }}
          onPointerMove={onSVGPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => setSelectedId(null)}
        >
          <defs>
            <pattern id="wbDots" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="0.8" cy="0.8" r="0.8" fill="var(--ds-border)" />
            </pattern>
          </defs>

          {/* Hintergrund */}
          <rect width={VW} height={VH} fill="var(--ds-surface2)" />
          <rect width={VW} height={VH} fill="url(#wbDots)" />

          {/* Leer-Hinweis */}
          {circles.length === 0 && (
            <text
              x={VW / 2} y={VH / 2}
              textAnchor="middle" dominantBaseline="central"
              fill="#9ca3af" fontSize="14" fontFamily="Arial, sans-serif"
            >
              {canEdit
                ? '← Kreis hinzufügen oder „Aus Druckwerken" wählen'
                : 'Noch kein Layout gespeichert'}
            </text>
          )}

          {/* Kreise */}
          {circles.map(circle => {
            const sel = circle.id === selectedId
            const fontSize = circle.r < 24 ? 8 : circle.r < 36 ? 10 : circle.r < 52 ? 12 : 14
            // Label ggf. umbrechen (max ~12 Zeichen pro Zeile)
            const words  = circle.label.split(' ')
            const lines: string[] = []
            let cur = ''
            for (const w of words) {
              if ((cur + ' ' + w).trim().length > 12 && cur) {
                lines.push(cur.trim())
                cur = w
              } else {
                cur = (cur + ' ' + w).trim()
              }
            }
            if (cur) lines.push(cur)
            const lineH = fontSize * 1.25
            const totalH = lines.length * lineH
            const startY = -totalH / 2 + lineH / 2

            return (
              <g
                key={circle.id}
                onClick={e => { e.stopPropagation(); setSelectedId(circle.id) }}
                onPointerDown={e => onCirclePointerDown(e, circle.id)}
                style={{ cursor: canEdit ? 'grab' : 'pointer' }}
              >
                {/* Auswahl-Ring */}
                {sel && (
                  <circle
                    cx={circle.x} cy={circle.y} r={circle.r + 7}
                    fill="none" stroke="#0099cc" strokeWidth="2"
                    strokeDasharray="6 3"
                  />
                )}

                {/* Hauptkreis */}
                <circle
                  cx={circle.x} cy={circle.y} r={circle.r}
                  fill={circle.color}
                  stroke={sel ? '#0099cc' : 'rgba(255,255,255,0.25)'}
                  strokeWidth={sel ? 2.5 : 1.5}
                />

                {/* Beschriftung (mehrzeilig) */}
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={circle.x} y={circle.y + startY + li * lineH}
                    textAnchor="middle" dominantBaseline="central"
                    fill="white" fontSize={fontSize}
                    fontWeight="700" fontFamily="Arial, sans-serif"
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
            padding: 14,
            display: 'flex', flexDirection: 'column', gap: 14,
            overflowY: 'auto',
          }}>
            <p style={{
              margin: 0, fontSize: 10, fontWeight: 700,
              color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              Bearbeiten
            </p>

            {/* Beschriftung */}
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>
                Beschriftung
              </label>
              <input
                value={selected.label}
                onChange={e => updateSelected({ label: e.target.value })}
                maxLength={40}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: '1px solid var(--ds-border)', borderRadius: 8,
                  padding: '7px 9px', fontSize: 13,
                  background: 'var(--ds-surface2)', color: 'var(--ds-text)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Größe */}
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 5 }}>
                Größe
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                {SIZES.map(s => (
                  <button
                    key={s.label}
                    onClick={() => updateSelected({ r: s.r })}
                    style={{
                      flex: 1, padding: '5px 0', fontSize: 10, fontWeight: 700,
                      borderRadius: 6, cursor: 'pointer',
                      border: `1.5px solid ${selected.r === s.r ? '#003366' : 'var(--ds-border)'}`,
                      background: selected.r === s.r ? '#003366' : 'var(--ds-surface2)',
                      color: selected.r === s.r ? 'white' : 'var(--ds-text)',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Farbe */}
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 5 }}>
                Farbe
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateSelected({ color: c })}
                    title={c}
                    style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: c, cursor: 'pointer',
                      border: selected.color === c
                        ? '3px solid #0099cc'
                        : '2px solid rgba(0,0,0,0.1)',
                      outline: selected.color === c ? '2px solid white' : 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                ))}
              </div>
              {/* Eigene Farbe */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <label style={{ fontSize: 11, color: '#9ca3af' }}>Eigene:</label>
                <input
                  type="color"
                  value={selected.color}
                  onChange={e => updateSelected({ color: e.target.value })}
                  style={{ width: 32, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 0 }}
                />
              </div>
            </div>

            {/* Löschen */}
            <button
              onClick={deleteSelected}
              style={{
                marginTop: 'auto', background: 'none',
                border: '1px solid #fca5a5', color: '#ef4444',
                borderRadius: 8, padding: '8px', fontSize: 12,
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              Kreis löschen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Kleine Toolbar-Button-Komponente ──────────────────────────────────────────

function ToolBtn({
  label, color, outline = false, onClick,
}: {
  label: string; color: string; outline?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: outline ? 'none' : color,
        color: outline ? color : 'white',
        border: `1.5px solid ${color}`,
        borderRadius: 20, padding: '5px 13px',
        fontSize: 11, fontWeight: 700, cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
