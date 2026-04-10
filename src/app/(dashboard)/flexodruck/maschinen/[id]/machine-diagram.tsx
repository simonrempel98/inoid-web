'use client'

import { useState } from 'react'
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
        background: 'white', borderRadius: 20, padding: '20px 20px 18px',
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

export function MachineDiagram({ druckwerke, canEdit }: { druckwerke: DiagramDW[]; canEdit: boolean }) {
  const [active, setActive] = useState<{ slot: DiagramSlot; dw: DiagramDW } | null>(null)

  const n = druckwerke.length
  if (n === 0) return null

  const W = 440, H = 440, CX = W / 2, CY = H / 2
  const PAD = 56
  const CYLL_R = 58

  const dbR = n <= 4 ? 30 : n <= 7 ? 26 : n <= 11 ? 22 : 18
  const fR  = Math.round(dbR * 0.72)
  const DB_DIST   = CYLL_R + 22 + dbR
  const F_DIST    = DB_DIST + dbR + 8 + fR
  const LBL_DIST  = F_DIST + fR + (n <= 8 ? 18 : 14)
  const DOT_R     = Math.max(3.5, Math.round(dbR * 0.24))
  const SQRT2_INV = 0.707

  const showLabels = n <= 14

  function AssetBadge({ cx, cy, r, count }: { cx: number; cy: number; r: number; count: number }) {
    const bx = cx + SQRT2_INV * r
    const by = cy + SQRT2_INV * r
    if (count === 0) {
      return <circle cx={bx} cy={by} r={DOT_R} fill="#d1d5db" stroke="white" strokeWidth="1.5" />
    }
    if (count === 1) {
      return <circle cx={bx} cy={by} r={DOT_R} fill="#34d399" stroke="white" strokeWidth="1.5" />
    }
    // Multiple assets: numbered badge
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
      background: 'white', borderRadius: 16, border: '1px solid #c8d4e8',
      padding: '20px 12px 20px', marginBottom: 20, fontFamily: 'Arial, sans-serif',
    }}>
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
        {druckwerke.map((dw, i) => {
          const angle = (i * 2 * Math.PI / n) - Math.PI / 2
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
        {druckwerke.map((dw, i) => {
          const angle = (i * 2 * Math.PI / n) - Math.PI / 2
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
              {farbe && (
                <g onClick={() => setActive({ slot: farbe, dw })} style={{ cursor: 'pointer' }}>
                  <circle cx={fX} cy={fY} r={fR}
                    fill={hexAlpha(color, 0.58)}
                    stroke={farbe.assets.length > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'}
                    strokeWidth="2"
                  />
                  <AssetBadge cx={fX} cy={fY} r={fR} count={farbe.assets.length} />
                </g>
              )}

              {druckbild && (
                <g onClick={() => setActive({ slot: druckbild, dw })} style={{ cursor: 'pointer' }}>
                  <circle cx={dbX} cy={dbY} r={dbR}
                    fill={color}
                    stroke={druckbild.assets.length > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'}
                    strokeWidth="2"
                  />
                  <AssetBadge cx={dbX} cy={dbY} r={dbR} count={druckbild.assets.length} />
                </g>
              )}

              {showLabels && (
                <text x={lX} y={lY}
                  textAnchor={ta}
                  dominantBaseline={db}
                  fill="#9ca3af"
                  fontSize={n <= 8 ? 11 : 9.5}
                  fontFamily="Arial, sans-serif"
                >
                  {dw.label ?? `DW ${dw.position}`}
                </text>
              )}
            </g>
          )
        })}
      </svg>

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
