'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

export type DiagramSlot = {
  id: string
  label: string
  sort_order: number
  assets: { id: string; name: string }[]
}

export type DiagramDW = {
  id: string
  position: number
  label: string | null
  color_hint: string | null
  slots: DiagramSlot[]
}

function hexAlpha(hex: string | null, alpha: number): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return `rgba(0,51,102,${alpha})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,51,102,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}

// ── Popover ───────────────────────────────────────────────────────────────────

function SlotPopover({
  slot, dw, canEdit, onClose,
}: {
  slot: DiagramSlot; dw: DiagramDW; canEdit: boolean; onClose: () => void
}) {
  const isInner = slot.sort_order === 0
  const color = dw.color_hint ?? '#003366'

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        width: 'min(360px, calc(100vw - 32px))',
        background: 'var(--ds-surface)', borderRadius: 20, padding: '20px 20px 18px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        zIndex: 100, fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: isInner ? color : hexAlpha(color, 0.55),
              border: '1.5px solid rgba(0,0,0,0.1)',
            }} />
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>
                {dw.label ?? `Druckwerk ${dw.position}`}
              </p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#003366' }}>
                Trägerstange{' '}
                <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 14 }}>
                  {isInner ? 'Druckbild' : 'Farbe'}
                </span>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#f4f6f9', border: 'none', borderRadius: '50%',
            width: 30, height: 30, cursor: 'pointer', color: '#6b7280',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
          }}>×</button>
        </div>

        {slot.assets.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {slot.assets.map((a, i) => (
              <div key={a.id} style={{
                background: '#e8f4fd', borderRadius: 10, padding: '8px 12px',
                border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#0099cc', width: 18, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#003366', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: '#f4f6f9', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Kein Asset verknüpft</p>
          </div>
        )}

        {canEdit && (
          <Link href={`/flexodruck/fixed-slot/${slot.id}/edit`} style={{
            display: 'block', textAlign: 'center',
            background: '#003366', color: 'white', padding: '12px', borderRadius: 50,
            fontWeight: 700, fontSize: 14, textDecoration: 'none',
          }}>
            {slot.assets.length > 0 ? 'Assets verwalten' : 'Asset verknüpfen'}
          </Link>
        )}
      </div>
    </>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export function MachineDiagram({
  druckwerke: initialDruckwerke,
  canEdit,
  machineId,
}: {
  druckwerke: DiagramDW[]
  canEdit: boolean
  machineId: string
}) {
  const [active, setActive] = useState<{ slot: DiagramSlot; dw: DiagramDW } | null>(null)
  const [reorderMode, setReorderMode] = useState(false)
  const [orderedDW, setOrderedDW] = useState<DiagramDW[]>(initialDruckwerke)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const dragIdx = useRef<number | null>(null)

  const n = orderedDW.length
  if (n === 0) return null

  // ── Drag & Drop Handlers ──
  function onDragStart(idx: number) {
    dragIdx.current = idx
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    const from = dragIdx.current
    if (from === null || from === idx) return
    const next = [...orderedDW]
    const [item] = next.splice(from, 1)
    next.splice(idx, 0, item)
    dragIdx.current = idx
    setOrderedDW(next)
  }

  function onDragEnd() {
    dragIdx.current = null
  }

  function moveItem(from: number, to: number) {
    const next = [...orderedDW]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setOrderedDW(next)
  }

  async function saveOrder() {
    setSaving(true)
    const positions = orderedDW.map((dw, i) => ({ id: dw.id, position: i + 1 }))
    await fetch(`/api/flexodruck/machines/${machineId}/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions }),
    })
    setSaving(false)
    setSaved(true)
    setReorderMode(false)
    setTimeout(() => setSaved(false), 2000)
  }

  function cancelReorder() {
    setOrderedDW(initialDruckwerke)
    setReorderMode(false)
  }

  // ── SVG ──
  // Landscape-Format wie echte CI-Flexo (Bobst, W&H): Druckwerke nur links + rechts
  const W = 520, H = 340, CX = W / 2, CY = H / 2
  const PAD = 64
  const CYLL_R = 60

  const dbR = n <= 4 ? 30 : n <= 7 ? 26 : n <= 11 ? 22 : 18
  const fR  = Math.round(dbR * 0.72)
  const DB_DIST   = CYLL_R + 24 + dbR
  const F_DIST    = DB_DIST + dbR + 9 + fR
  const LBL_DIST  = F_DIST + fR + (n <= 8 ? 22 : 14)
  const DOT_R     = Math.max(3.5, Math.round(dbR * 0.24))
  const SQRT2_INV = 0.707

  // Winkelbereich pro Seite: je schmäler desto weiter auseinander die DW
  const MAX_DEG = n <= 2 ? 40 : n <= 4 ? 52 : n <= 6 ? 62 : n <= 8 ? 72 : n <= 12 ? 80 : 84
  const MAX_RAD = MAX_DEG * Math.PI / 180
  const rightCount = Math.ceil(n / 2)   // DW 1…rightCount → rechte Seite
  const leftCount  = n - rightCount     // rest → linke Seite

  // Winkel berechnen: rechts von oben-rechts nach unten-rechts,
  // links von unten-links nach oben-links (fortlaufende Nummerierung im Uhrzeigersinn)
  function getDWAngle(i: number): number {
    if (i < rightCount) {
      const t = rightCount === 1 ? 0.5 : i / (rightCount - 1)
      return -MAX_RAD + t * 2 * MAX_RAD          // von -MAX_DEG bis +MAX_DEG um 0° (rechts)
    } else {
      const si = i - rightCount
      const t  = leftCount === 1 ? 0.5 : si / (leftCount - 1)
      return (Math.PI - MAX_RAD) + t * 2 * MAX_RAD  // von 180°-MAX bis 180°+MAX (links)
    }
  }

  const showLabels = n <= 14

  function AssetBadge({ cx, cy, r, count }: { cx: number; cy: number; r: number; count: number }) {
    const bx = cx + SQRT2_INV * r
    const by = cy + SQRT2_INV * r
    if (count === 0) return <circle cx={bx} cy={by} r={DOT_R} fill="#d1d5db" stroke="white" strokeWidth="1.5" />
    if (count === 1) return <circle cx={bx} cy={by} r={DOT_R} fill="#34d399" stroke="white" strokeWidth="1.5" />
    return (
      <g>
        <circle cx={bx} cy={by} r={DOT_R + 2} fill="#34d399" stroke="white" strokeWidth="1.5" />
        <text x={bx} y={by} textAnchor="middle" dominantBaseline="central"
          fontSize={DOT_R * 1.2} fontWeight="900" fill="white" fontFamily="Arial, sans-serif">
          {count}
        </text>
      </g>
    )
  }

  return (
    <div style={{
      background: 'var(--ds-surface)', borderRadius: 16, border: '1px solid var(--ds-border)',
      padding: '20px 12px 20px', marginBottom: 20, fontFamily: 'Arial, sans-serif',
    }}>
      {/* Header mit Reorder-Button */}
      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, paddingRight: 4 }}>
          {!reorderMode ? (
            <button onClick={() => setReorderMode(true)}
              style={{
                background: 'none', border: '1px solid var(--ds-border)', borderRadius: 20,
                padding: '4px 12px', fontSize: 11, color: '#6b7280', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
              <span style={{ fontSize: 13 }}>⇅</span> Anordnung ändern
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={cancelReorder}
                style={{ background: 'none', border: '1px solid var(--ds-border)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#6b7280', cursor: 'pointer' }}>
                Abbrechen
              </button>
              <button onClick={saveOrder} disabled={saving}
                style={{ background: saving ? '#c8d4e8' : '#003366', border: 'none', borderRadius: 20, padding: '4px 14px', fontSize: 11, color: 'white', fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          )}
          {saved && <span style={{ fontSize: 11, color: '#34d399', alignSelf: 'center', marginLeft: 8 }}>✓ Gespeichert</span>}
        </div>
      )}

      <div style={{ display: reorderMode ? 'grid' : 'block', gridTemplateColumns: '1fr 220px', gap: 16 }}>
        {/* SVG Diagram */}
        <svg
          viewBox={`${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`}
          style={{ width: '100%', maxWidth: W + PAD * 2, display: 'block', margin: '0 auto' }}
          overflow="visible"
        >
          <defs>
            <radialGradient id="cylGrad" cx="38%" cy="35%">
              <stop offset="0%" stopColor="#2a7ab5" />
              <stop offset="100%" stopColor="#174f77" />
            </radialGradient>
          </defs>

          {/* Verbindungslinien */}
          {orderedDW.map((dw, i) => {
            const angle = getDWAngle(i)
            const c = Math.cos(angle), s = Math.sin(angle)
            const x1 = CX + (CYLL_R + 3) * c, y1 = CY + (CYLL_R + 3) * s
            const x2 = CX + (DB_DIST - dbR - 3) * c, y2 = CY + (DB_DIST - dbR - 3) * s
            return (
              <line key={`line-${dw.id}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#dde4ef" strokeWidth="1.5" strokeDasharray="4 3"
              />
            )
          })}

          {/* Zentralzylinder */}
          <circle cx={CX} cy={CY} r={CYLL_R} fill="url(#cylGrad)" />
          <text x={CX} y={CY - 7} textAnchor="middle" fill="rgba(255,255,255,0.5)"
            fontSize="8.5" fontWeight="700" letterSpacing="1" fontFamily="Arial, sans-serif">
            ZENTRAL
          </text>
          <text x={CX} y={CY + 7} textAnchor="middle" fill="rgba(255,255,255,0.5)"
            fontSize="8.5" fontWeight="700" letterSpacing="1" fontFamily="Arial, sans-serif">
            ZYLINDER
          </text>

          {/* Druckwerke */}
          {orderedDW.map((dw, i) => {
            const angle = getDWAngle(i)
            const c = Math.cos(angle), s = Math.sin(angle)
            const dbX = CX + DB_DIST * c, dbY = CY + DB_DIST * s
            const fX  = CX + F_DIST  * c, fY  = CY + F_DIST  * s
            const lX  = CX + LBL_DIST * c, lY = CY + LBL_DIST * s

            const druckbild = dw.slots.find(sl => sl.sort_order === 0)
            const farbe     = dw.slots.find(sl => sl.sort_order === 1)
            const color     = dw.color_hint ?? '#003366'

            const ta = c > 0.25 ? 'start' : c < -0.25 ? 'end' : 'middle'
            const db = s > 0.25 ? 'hanging' : s < -0.25 ? 'auto' : 'central'

            return (
              <g key={dw.id}>
                {reorderMode && (
                  <circle cx={dbX} cy={dbY} r={dbR + 5}
                    fill="rgba(0,153,204,0.12)" stroke="#0099cc" strokeWidth="1.5" strokeDasharray="3 2"
                  />
                )}

                {farbe && (
                  <g onClick={() => !reorderMode && setActive({ slot: farbe, dw })} style={{ cursor: reorderMode ? 'default' : 'pointer' }}>
                    <circle cx={fX} cy={fY} r={fR}
                      fill={hexAlpha(color, 0.58)}
                      stroke={farbe.assets.length > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'}
                      strokeWidth="2"
                    />
                    {!reorderMode && <AssetBadge cx={fX} cy={fY} r={fR} count={farbe.assets.length} />}
                  </g>
                )}

                {druckbild && (
                  <g onClick={() => !reorderMode && setActive({ slot: druckbild, dw })} style={{ cursor: reorderMode ? 'default' : 'pointer' }}>
                    <circle cx={dbX} cy={dbY} r={dbR}
                      fill={color}
                      stroke={druckbild.assets.length > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'}
                      strokeWidth="2"
                    />
                    {!reorderMode && <AssetBadge cx={dbX} cy={dbY} r={dbR} count={druckbild.assets.length} />}
                  </g>
                )}

                {/* Positionsnummer – immer sichtbar */}
                <text x={dbX} y={dbY} textAnchor="middle" dominantBaseline="central"
                  fill="white" fontSize={dbR * 0.82} fontWeight="900" fontFamily="Arial, sans-serif"
                  style={{ pointerEvents: 'none' }}>
                  {i + 1}
                </text>

                {showLabels && (
                  <text x={lX} y={lY}
                    textAnchor={ta} dominantBaseline={db}
                    fill={reorderMode ? '#0099cc' : '#9ca3af'}
                    fontSize={n <= 8 ? 11 : 9.5}
                    fontWeight={reorderMode ? '700' : '400'}
                    fontFamily="Arial, sans-serif"
                  >
                    {dw.label ?? `DW ${i + 1}`}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Reorder-Panel */}
        {reorderMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Reihenfolge
            </p>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: '#9ca3af' }}>
              Ziehen oder Pfeile nutzen
            </p>
            {orderedDW.map((dw, idx) => (
              <div
                key={dw.id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={e => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#f4f6f9', borderRadius: 8,
                  padding: '7px 10px', cursor: 'grab',
                  border: '1px solid #e8edf4',
                  userSelect: 'none',
                }}
              >
                <span style={{
                  fontSize: 11, fontWeight: 900, color: 'white',
                  background: dw.color_hint ?? '#003366',
                  borderRadius: 4, width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {idx + 1}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#003366', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dw.label ?? `DW ${dw.position}`}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                  <button type="button" disabled={idx === 0}
                    onClick={() => moveItem(idx, idx - 1)}
                    style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#d1d5db' : '#6b7280', lineHeight: 1, padding: '1px 3px', fontSize: 12 }}>
                    ▲
                  </button>
                  <button type="button" disabled={idx === orderedDW.length - 1}
                    onClick={() => moveItem(idx, idx + 1)}
                    style={{ background: 'none', border: 'none', cursor: idx === orderedDW.length - 1 ? 'default' : 'pointer', color: idx === orderedDW.length - 1 ? '#d1d5db' : '#6b7280', lineHeight: 1, padding: '1px 3px', fontSize: 12 }}>
                    ▼
                  </button>
                </div>
                <span style={{ fontSize: 14, color: '#c8d4e8', cursor: 'grab' }}>⠿</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {active && (
        <SlotPopover
          slot={active.slot}
          dw={active.dw}
          canEdit={canEdit}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  )
}
