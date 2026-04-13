'use client'

import { useState } from 'react'
import { Play, RefreshCw, Send } from 'lucide-react'

export type SensorRow = {
  id: string
  name: string
  type: string
  unit: string
  asset_name: string
  org_name: string
  org_api_key: string
  latestValue: number | null
  latestAt: string | null
}

const TYPE_RANGES: Record<string, { min: number; max: number; decimals: number }> = {
  temperature: { min: 20,  max: 85,   decimals: 1 },
  vibration:   { min: 0,   max: 15,   decimals: 2 },
  pressure:    { min: 1,   max: 12,   decimals: 2 },
  current:     { min: 5,   max: 95,   decimals: 1 },
  power:       { min: 10,  max: 450,  decimals: 1 },
  energy:      { min: 0,   max: 9999, decimals: 2 },
  humidity:    { min: 20,  max: 95,   decimals: 1 },
  rpm:         { min: 0,   max: 3000, decimals: 0 },
  runtime:     { min: 0,   max: 9999, decimals: 2 },
  level:       { min: 10,  max: 100,  decimals: 1 },
  flow:        { min: 0,   max: 500,  decimals: 1 },
  noise:       { min: 40,  max: 110,  decimals: 1 },
  co2:         { min: 400, max: 1800, decimals: 0 },
  generic:     { min: 0,   max: 100,  decimals: 1 },
}

function randomValue(type: string): number {
  const r = TYPE_RANGES[type] ?? TYPE_RANGES.generic
  const raw = r.min + Math.random() * (r.max - r.min)
  return parseFloat(raw.toFixed(r.decimals))
}

export function SensorDemoPanel({ initialSensors, appUrl }: { initialSensors: SensorRow[]; appUrl: string }) {
  const [sensors, setSensors] = useState<SensorRow[]>(initialSensors)
  const [sending, setSending] = useState<Record<string, boolean>>({})
  const [sendingAll, setSendingAll] = useState(false)
  const [log, setLog] = useState<{ ts: string; msg: string; ok: boolean }[]>([])

  function addLog(msg: string, ok: boolean) {
    const ts = new Date().toLocaleTimeString('de-DE')
    setLog(prev => [{ ts, msg, ok }, ...prev].slice(0, 50))
  }

  async function sendOne(sensor: SensorRow) {
    setSending(s => ({ ...s, [sensor.id]: true }))
    const value = randomValue(sensor.type)
    try {
      const res = await fetch(`${appUrl || ''}/api/sensors/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sensor.org_api_key}`,
        },
        body: JSON.stringify({ sensor_id: sensor.id, value }),
      })
      const data = await res.json()
      if (res.ok) {
        setSensors(prev => prev.map(s => s.id === sensor.id
          ? { ...s, latestValue: value, latestAt: new Date().toISOString() }
          : s
        ))
        addLog(`${sensor.name}: ${value} ${sensor.unit}`, true)
      } else {
        addLog(`${sensor.name}: Fehler — ${data.error ?? res.status}`, false)
      }
    } catch (e) {
      addLog(`${sensor.name}: ${e instanceof Error ? e.message : 'Netzwerkfehler'}`, false)
    }
    setSending(s => ({ ...s, [sensor.id]: false }))
  }

  async function sendAll() {
    setSendingAll(true)
    // Gruppiere nach org_api_key für Batch-Request
    const byOrg: Record<string, { apiKey: string; readings: { sensor_id: string; value: number }[] }> = {}
    const values: Record<string, number> = {}

    for (const s of sensors) {
      const v = randomValue(s.type)
      values[s.id] = v
      if (!byOrg[s.org_api_key]) byOrg[s.org_api_key] = { apiKey: s.org_api_key, readings: [] }
      byOrg[s.org_api_key].readings.push({ sensor_id: s.id, value: v })
    }

    for (const [, { apiKey, readings }] of Object.entries(byOrg)) {
      try {
        const res = await fetch(`${appUrl || ''}/api/sensors/ingest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ readings }),
        })
        const data = await res.json()
        if (res.ok) {
          addLog(`Batch: ${data.inserted} Readings gespeichert`, true)
          setSensors(prev => prev.map(s => values[s.id] !== undefined
            ? { ...s, latestValue: values[s.id], latestAt: new Date().toISOString() }
            : s
          ))
        } else {
          addLog(`Batch-Fehler: ${data.error ?? res.status}`, false)
        }
      } catch (e) {
        addLog(`Batch: ${e instanceof Error ? e.message : 'Netzwerkfehler'}`, false)
      }
    }
    setSendingAll(false)
  }

  const SENSOR_ICONS: Record<string, string> = {
    temperature: '🌡️', vibration: '📳', pressure: '🔧', current: '⚡', power: '⚡',
    energy: '🔋', humidity: '💧', rpm: '🔄', runtime: '⏱️', level: '📊',
    flow: '🌊', noise: '🔊', co2: '💨', generic: '📡',
  }

  function fmtTime(iso: string | null) {
    if (!iso) return '–'
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  function fmtVal(v: number | null, unit: string) {
    if (v === null) return '–'
    return `${v} ${unit}`.trim()
  }

  return (
    <div>
      {/* Aktionen */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={sendAll}
          disabled={sendingAll || sensors.length === 0}
          style={{
            background: sendingAll ? 'var(--adm-border)' : '#003366',
            color: 'white', border: 'none', cursor: sendingAll ? 'not-allowed' : 'pointer',
            borderRadius: 50, padding: '10px 20px', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Arial, sans-serif',
          }}
        >
          {sendingAll
            ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sende…</>
            : <><Send size={14} /> Alle senden</>
          }
        </button>
        <span style={{ fontSize: 12, color: 'var(--adm-text3)' }}>
          Sendet einen zufälligen Messwert pro Sensor (realistischer Bereich je Typ)
        </span>
      </div>

      {/* Sensor-Tabelle */}
      <div className="adm-table-scroll" style={{ marginBottom: 24 }}>
        <div className="adm-table-min" style={{
          background: 'var(--adm-surface)', borderRadius: 14,
          border: '1px solid var(--adm-border)', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--adm-surface2)', borderBottom: '1px solid var(--adm-border)' }}>
                {['Sensor', 'Asset', 'Organisation', 'Letzter Wert', 'Zuletzt', 'Aktion'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: 'var(--adm-text3)',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sensors.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--adm-text3)', fontSize: 13 }}>
                    Keine aktiven Sensoren gefunden
                  </td>
                </tr>
              )}
              {sensors.map((s, i) => (
                <tr key={s.id} style={{
                  borderBottom: i < sensors.length - 1 ? '1px solid var(--adm-border)' : 'none',
                }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{SENSOR_ICONS[s.type] ?? '📡'}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--adm-text)' }}>{s.name}</p>
                        <p style={{ margin: 0, fontSize: 10, color: 'var(--adm-text3)' }}>{s.type} · {s.unit || '–'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--adm-text2)' }}>{s.asset_name}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--adm-text2)' }}>{s.org_name}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontWeight: 700, fontSize: 14,
                      color: s.latestValue !== null ? '#0099cc' : 'var(--adm-text3)',
                    }}>
                      {fmtVal(s.latestValue, s.unit)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--adm-text3)', fontSize: 12 }}>
                    {fmtTime(s.latestAt)}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={() => sendOne(s)}
                      disabled={!!sending[s.id]}
                      style={{
                        background: sending[s.id] ? 'var(--adm-border)' : '#0099cc22',
                        color: sending[s.id] ? 'var(--adm-text3)' : '#0099cc',
                        border: '1px solid #0099cc44',
                        cursor: sending[s.id] ? 'not-allowed' : 'pointer',
                        borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: 'Arial, sans-serif',
                      }}
                    >
                      {sending[s.id]
                        ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Play size={11} />
                      }
                      Demo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text3)', margin: '0 0 8px',
            textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Aktivitätslog
          </p>
          <div style={{
            background: '#0d1117', borderRadius: 10, padding: '10px 14px',
            border: '1px solid #1f2937', maxHeight: 200, overflowY: 'auto',
          }}>
            {log.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: 11, lineHeight: 1.8, fontFamily: 'monospace' }}>
                <span style={{ color: '#4b5563', flexShrink: 0 }}>{entry.ts}</span>
                <span style={{ color: entry.ok ? '#34d399' : '#f87171' }}>
                  {entry.ok ? '✓' : '✗'} {entry.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
