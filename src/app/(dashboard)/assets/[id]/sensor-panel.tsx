'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, Plus, Trash2, ChevronDown, ChevronUp, Copy, Check, Wifi, WifiOff } from 'lucide-react'

// ── Typen ────────────────────────────────────────────────────────────────────

export type SensorInitial = {
  id: string
  name: string
  type: string
  unit: string
  latestValue: number | null
  latestAt: string | null
  history: number[]          // letzte 60 Werte für Sparkline
}

// ── Sensor-Typ-Definitionen ──────────────────────────────────────────────────

const SENSOR_TYPES = [
  { value: 'temperature',  label: 'Temperatur',      unit: '°C',   icon: '🌡️' },
  { value: 'vibration',    label: 'Vibration',       unit: 'mm/s', icon: '📳' },
  { value: 'pressure',     label: 'Druck',           unit: 'bar',  icon: '🔧' },
  { value: 'current',      label: 'Strom',           unit: 'A',    icon: '⚡' },
  { value: 'power',        label: 'Leistung',        unit: 'kW',   icon: '⚡' },
  { value: 'energy',       label: 'Energie',         unit: 'kWh',  icon: '🔋' },
  { value: 'humidity',     label: 'Luftfeuchte',     unit: '%',    icon: '💧' },
  { value: 'rpm',          label: 'Drehzahl',        unit: 'RPM',  icon: '🔄' },
  { value: 'runtime',      label: 'Betriebsstunden', unit: 'h',    icon: '⏱️' },
  { value: 'level',        label: 'Füllstand',       unit: '%',    icon: '📊' },
  { value: 'flow',         label: 'Durchfluss',      unit: 'l/min', icon: '🌊' },
  { value: 'noise',        label: 'Lärmpegel',       unit: 'dB',   icon: '🔊' },
  { value: 'co2',          label: 'CO₂',             unit: 'ppm',  icon: '💨' },
  { value: 'generic',      label: 'Sonstiges',       unit: '',     icon: '📡' },
]

function typeInfo(type: string) {
  return SENSOR_TYPES.find(t => t.value === type) ?? SENSOR_TYPES[SENSOR_TYPES.length - 1]
}

// ── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values, color = '#0099cc' }: { values: number[]; color?: string }) {
  if (values.length < 2) {
    return <svg width={100} height={32} />
  }

  const W = 100, H = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 6) - 3
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const lastX = W
  const lastY = H - ((values[values.length - 1] - min) / range) * (H - 6) - 3

  // Fläche unter der Kurve
  const areaPoints = `0,${H} ${pts.join(' ')} ${W},${H}`

  return (
    <svg width={W} height={H + 4} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  )
}

// ── KeyRow (API-Setup) ───────────────────────────────────────────────────────

function KeyRow({ label, value, mono, copied, copyKey, onCopy }: {
  label: string; value: string; mono?: boolean
  copied: string | null; copyKey: string; onCopy: (v: string, k: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 10, color: '#96aed2', fontWeight: 700, minWidth: 90, flexShrink: 0 }}>{label}</span>
      <span style={{
        flex: 1, fontSize: 10, color: 'var(--ds-text, #000)',
        fontFamily: mono ? 'monospace' : undefined,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{value}</span>
      <button onClick={() => onCopy(value, copyKey)} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0,
        color: copied === copyKey ? '#27AE60' : '#96aed2',
      }}>
        {copied === copyKey ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  )
}

// ── SensorCard ───────────────────────────────────────────────────────────────

function SensorCard({ sensor, onDelete, onCopy, copied }: {
  sensor: SensorInitial
  onDelete?: () => void
  onCopy: (v: string, k: string) => void
  copied: string | null
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const info = typeInfo(sensor.type)
  const isLive = sensor.latestAt
    ? (Date.now() - new Date(sensor.latestAt).getTime()) < 5 * 60 * 1000
    : false

  const displayValue = sensor.latestValue !== null
    ? (sensor.latestValue % 1 === 0
        ? sensor.latestValue.toString()
        : sensor.latestValue.toFixed(1))
    : null

  return (
    <div style={{
      background: 'var(--ds-surface, white)', borderRadius: 12,
      border: `1px solid ${confirmDelete ? '#ef444444' : isLive ? '#0099cc44' : 'var(--ds-border, #c8d4e8)'}`,
      padding: '12px 14px',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: isLive ? '#0099cc15' : 'var(--ds-surface2, #f0f4ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>
          {info.icon}
        </div>

        {/* Name + Status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ds-text, #000)', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sensor.name}
            </p>
            {isLive
              ? <Wifi size={11} color="#27AE60" style={{ flexShrink: 0 }} />
              : <WifiOff size={11} color="var(--ds-border, #c8d4e8)" style={{ flexShrink: 0 }} />
            }
          </div>
          <p style={{ fontSize: 10, color: '#96aed2', margin: '1px 0 0', fontWeight: 600 }}>
            {info.label}
            {sensor.latestAt && (
              <span style={{ marginLeft: 6, fontWeight: 400 }}>
                · {new Date(sensor.latestAt).toLocaleTimeString('de-DE', {
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                })}
              </span>
            )}
          </p>
        </div>

        {/* Sparkline */}
        {!confirmDelete && sensor.history.length >= 2 && (
          <div style={{ flexShrink: 0 }}>
            <Sparkline values={sensor.history} color={isLive ? '#0099cc' : '#c8d4e8'} />
          </div>
        )}

        {/* Wert */}
        {!confirmDelete && (
          <div style={{ textAlign: 'right', minWidth: 56, flexShrink: 0 }}>
            {displayValue !== null ? (
              <>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#0099cc', margin: 0, lineHeight: 1 }}>
                  {displayValue}
                </p>
                <p style={{ fontSize: 10, color: '#96aed2', margin: '1px 0 0', fontWeight: 700 }}>
                  {sensor.unit}
                </p>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--ds-text4, #999)', margin: 0 }}>–</p>
            )}
          </div>
        )}

        {/* Bestätigung oder Delete-Button */}
        {onDelete && (
          confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, whiteSpace: 'nowrap' }}>
                Löschen?
              </span>
              <button onClick={onDelete} style={{
                background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer',
                borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700,
                fontFamily: 'Arial, sans-serif',
              }}>
                Ja
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{
                background: 'none', color: 'var(--ds-text3, #666)',
                border: '1px solid var(--ds-border, #c8d4e8)', cursor: 'pointer',
                borderRadius: 6, padding: '4px 10px', fontSize: 11,
                fontFamily: 'Arial, sans-serif',
              }}>
                Nein
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ds-border, #c8d4e8)', padding: 4, display: 'flex', flexShrink: 0,
            }}
            title="Sensor entfernen">
              <Trash2 size={13} />
            </button>
          )
        )}
      </div>

      {/* Sensor-ID (klein, für Simulator) */}
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, color: '#c8d4e8', fontFamily: 'monospace',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          ID: {sensor.id}
        </span>
        <button onClick={() => onCopy(sensor.id, `id-${sensor.id}`)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex',
          color: copied === `id-${sensor.id}` ? '#27AE60' : '#c8d4e8',
        }}>
          {copied === `id-${sensor.id}` ? <Check size={10} /> : <Copy size={10} />}
        </button>
      </div>
    </div>
  )
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────

export function SensorPanel({
  assetId,
  initialSensors,
  orgApiKey,
  canEdit,
}: {
  assetId: string
  initialSensors: SensorInitial[]
  orgApiKey: string
  canEdit: boolean
}) {
  const [sensors, setSensors]       = useState<SensorInitial[]>(initialSensors)
  const [showAdd, setShowAdd]       = useState(false)
  const [showApiInfo, setShowApiInfo] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [copied, setCopied]         = useState<string | null>(null)
  const [newName, setNewName]       = useState('')
  const [newType, setNewType]       = useState('temperature')
  const [newUnit, setNewUnit]       = useState('°C')

  const supabase = createClient()

  // ── Initiale Readings client-seitig nachladen ────────────────────────────────
  useEffect(() => {
    if (!sensors.length) return
    // Für jeden Sensor die letzten 60 Readings via API holen
    Promise.all(
      sensors.map(s =>
        fetch(`/api/sensors/${s.id}/readings?limit=60`)
          .then(r => r.ok ? r.json() : { readings: [] })
          .then(({ readings }: { readings: { value: number; recorded_at: string }[] }) => ({
            sensorId: s.id,
            readings: readings ?? [],
          }))
      )
    ).then(results => {
      setSensors(prev => prev.map(s => {
        const found = results.find(r => r.sensorId === s.id)
        if (!found || !found.readings.length) return s
        const history = found.readings.map(r => Number(r.value))
        const last = found.readings[found.readings.length - 1]
        return {
          ...s,
          latestValue: Number(last.value),
          latestAt: last.recorded_at,
          history,
        }
      }))
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Supabase Realtime: neue Readings live empfangen ─────────────────────────
  useEffect(() => {
    if (!sensors.length) return

    const sensorIds = new Set(sensors.map(s => s.id))

    const channel = supabase
      .channel(`sensor_readings_${assetId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          const r = payload.new as { sensor_id: string; value: unknown; recorded_at: string }
          if (!sensorIds.has(r.sensor_id)) return
          const val = Number(r.value)
          setSensors(prev => prev.map(s => {
            if (s.id !== r.sensor_id) return s
            return {
              ...s,
              latestValue: val,
              latestAt: r.recorded_at,
              history: [...s.history.slice(-59), val],
            }
          }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [assetId, sensors.length]) // Re-subscribe wenn Sensor hinzugefügt

  // ── Sensor hinzufügen ────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    const res = await fetch(`/api/assets/${assetId}/sensors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), type: newType, unit: newUnit }),
    })
    if (res.ok) {
      const { sensor } = await res.json()
      setSensors(prev => [...prev, { ...sensor, latestValue: null, latestAt: null, history: [] }])
      setNewName('')
      setShowAdd(false)
    }
    setSaving(false)
  }

  // ── Sensor löschen ───────────────────────────────────────────────────────────
  async function handleDelete(sensorId: string) {
    const res = await fetch(`/api/sensors/${sensorId}`, { method: 'DELETE' })
    if (res.ok) setSensors(prev => prev.filter(s => s.id !== sensorId))
  }

  // ── Copy ─────────────────────────────────────────────────────────────────────
  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const infoType = SENSOR_TYPES.find(t => t.value === newType)

  return (
    <div style={{ padding: '0 16px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ds-text, #000)', margin: 0,
          display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={14} color="#0099cc" />
          Sensordaten
          {sensors.length > 0 && (
            <span style={{
              fontSize: 11, background: '#0099cc22', color: '#0099cc',
              borderRadius: 10, padding: '1px 7px', fontWeight: 700,
            }}>
              {sensors.length}
            </span>
          )}
        </h2>
        {canEdit && (
          <button onClick={() => setShowAdd(v => !v)} style={{
            background: '#003366', color: 'white', border: 'none', cursor: 'pointer',
            borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Plus size={12} /> Sensor
          </button>
        )}
      </div>

      {/* Sensor hinzufügen – Formular */}
      {showAdd && (
        <div style={{
          background: 'var(--ds-surface, white)', borderRadius: 12, padding: 14,
          border: '1px solid #0099cc', marginBottom: 12,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#0099cc', margin: '0 0 10px',
            textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Neuer Sensor
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Name (z.B. Lagertemperatur vorne)"
              style={{
                padding: '9px 12px', borderRadius: 8,
                border: '1px solid var(--ds-border, #c8d4e8)',
                fontSize: 13, fontFamily: 'Arial, sans-serif',
                background: 'var(--ds-input-bg, white)', color: 'var(--ds-text, #000)',
                outline: 'none', width: '100%', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={newType} onChange={e => {
                setNewType(e.target.value)
                const t = SENSOR_TYPES.find(x => x.value === e.target.value)
                if (t) setNewUnit(t.unit)
              }} style={{
                flex: 1, padding: '9px 10px', borderRadius: 8,
                border: '1px solid var(--ds-border, #c8d4e8)',
                fontSize: 13, fontFamily: 'Arial, sans-serif',
                background: 'var(--ds-input-bg, white)', color: 'var(--ds-text, #000)', outline: 'none',
              }}>
                {SENSOR_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
              <input
                value={newUnit}
                onChange={e => setNewUnit(e.target.value)}
                placeholder="Einheit"
                style={{
                  width: 72, padding: '9px 10px', borderRadius: 8,
                  border: '1px solid var(--ds-border, #c8d4e8)',
                  fontSize: 13, fontFamily: 'Arial, sans-serif',
                  background: 'var(--ds-input-bg, white)', color: 'var(--ds-text, #000)',
                  outline: 'none', textAlign: 'center',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{
                flex: 1, padding: '9px', borderRadius: 8,
                border: '1px solid var(--ds-border, #c8d4e8)',
                background: 'none', color: 'var(--ds-text3, #666)', fontSize: 13, cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
              }}>
                Abbrechen
              </button>
              <button onClick={handleAdd} disabled={!newName.trim() || saving} style={{
                flex: 1, padding: '9px', borderRadius: 8, border: 'none',
                background: newName.trim() ? '#003366' : 'var(--ds-border, #c8d4e8)',
                color: 'white', fontSize: 13, fontWeight: 700,
                cursor: newName.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'Arial, sans-serif',
              }}>
                {saving ? '…' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sensor-Karten */}
      {sensors.length === 0 ? (
        <div style={{
          background: 'var(--ds-surface, white)', borderRadius: 12,
          padding: '28px 20px', border: '1px dashed var(--ds-border, #c8d4e8)',
          textAlign: 'center',
        }}>
          <Activity size={28} color="var(--ds-border, #c8d4e8)" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: 'var(--ds-text4, #999)', margin: 0 }}>
            Noch keine Sensoren verknüpft
          </p>
          {canEdit && (
            <p style={{ fontSize: 12, color: '#96aed2', margin: '6px 0 0' }}>
              Klicke auf + Sensor um loszulegen
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sensors.map(s => (
            <SensorCard
              key={s.id}
              sensor={s}
              onDelete={canEdit ? () => handleDelete(s.id) : undefined}
              onCopy={copy}
              copied={copied}
            />
          ))}
        </div>
      )}

      {/* API-Zugangsdaten für Simulator */}
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setShowApiInfo(v => !v)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: showApiInfo ? '10px 10px 0 0' : 10,
          background: 'var(--ds-surface, white)', border: '1px solid var(--ds-border, #c8d4e8)',
          borderBottom: showApiInfo ? 'none' : undefined,
          cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--ds-text3, #666)',
          fontFamily: 'Arial, sans-serif',
        }}>
          <span>🔑 API-Zugangsdaten (Simulator / IoT)</span>
          {showApiInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showApiInfo && (
          <div style={{
            background: 'var(--ds-surface2, #f5f7fa)',
            border: '1px solid var(--ds-border, #c8d4e8)', borderTop: 'none',
            borderRadius: '0 0 10px 10px', padding: 14,
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#96aed2', margin: '0 0 10px',
              textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              POST /api/sensors/ingest
            </p>

            <KeyRow
              label="Auth-Header"
              value={`Bearer ${orgApiKey}`}
              copied={copied} copyKey="apikey" onCopy={copy}
            />

            {sensors.map(s => (
              <KeyRow
                key={s.id}
                label={s.name}
                value={s.id}
                mono
                copied={copied} copyKey={`sid-${s.id}`} onCopy={copy}
              />
            ))}

            {/* Code-Beispiel */}
            <div style={{
              marginTop: 10, padding: '10px 12px', borderRadius: 8,
              background: '#0d1117', border: '1px solid #1f2937',
            }}>
              <p style={{ fontSize: 9, color: '#4b5563', margin: '0 0 4px', fontWeight: 700, letterSpacing: '0.06em' }}>
                BEISPIEL · EINZELWERT
              </p>
              <pre style={{ fontSize: 10, color: '#34d399', margin: 0, lineHeight: 1.7, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{`{
  "sensor_id": "${sensors[0]?.id ?? 'sensor-uuid'}",
  "value": 73.4
}`}</pre>
            </div>

            {sensors.length > 1 && (
              <div style={{
                marginTop: 6, padding: '10px 12px', borderRadius: 8,
                background: '#0d1117', border: '1px solid #1f2937',
              }}>
                <p style={{ fontSize: 9, color: '#4b5563', margin: '0 0 4px', fontWeight: 700, letterSpacing: '0.06em' }}>
                  BEISPIEL · BATCH
                </p>
                <pre style={{ fontSize: 10, color: '#60a5fa', margin: 0, lineHeight: 1.7, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{`{
  "readings": [
    { "sensor_id": "${sensors[0]?.id ?? 'uuid1'}", "value": 73.4 },
    { "sensor_id": "${sensors[1]?.id ?? 'uuid2'}", "value": 2.1 }
  ]
}`}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
