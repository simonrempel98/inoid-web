'use client'

import { useState, useEffect, useRef } from 'react'

const PINK = '#ec4899'

function fmt(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

export function ClockTimer() {
  const [now, setNow] = useState(() => new Date())
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startMs, setStartMs] = useState<number>(0)
  const [lapStartMs, setLapStartMs] = useState<number>(0)
  const [laps, setLaps] = useState<{ n: number; lapTime: number; total: number }[]>([])
  const [open, setOpen] = useState(false)
  const [pulse, setPulse] = useState(false)
  const rafRef = useRef<number>(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Uhr im Idle-Modus
  useEffect(() => {
    if (running) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [running])

  // Laufende Zeit
  useEffect(() => {
    if (!running) return
    const tick = () => {
      setElapsed(Date.now() - startMs)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running, startMs])

  // Außerhalb klicken → Dropdown schließen
  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [open])

  function handleMain() {
    if (!running) {
      // Start
      const t = Date.now()
      setStartMs(t)
      setLapStartMs(t)
      setElapsed(0)
      setRunning(true)
    } else {
      // Runde aufzeichnen
      const t = Date.now()
      const lapTime = t - lapStartMs
      const total = t - startMs
      setLaps(prev => [...prev, { n: prev.length + 1, lapTime, total }])
      setLapStartMs(t)
      // kurzer Pulse-Flash
      setPulse(true)
      setTimeout(() => setPulse(false), 300)
    }
  }

  function handleStop() {
    cancelAnimationFrame(rafRef.current)
    setRunning(false)
    setElapsed(0)
  }

  const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div ref={dropdownRef} style={{ position: 'fixed', top: 14, right: 18, zIndex: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>

        {/* Haupt-Button: Uhr / Timer */}
        <button
          onClick={handleMain}
          title={running ? 'Runde aufzeichnen' : 'Timer starten'}
          style={{
            background: pulse ? `${PINK}30` : running ? `${PINK}12` : 'white',
            border: `1.5px solid ${running ? PINK : PINK + '80'}`,
            borderRadius: 20,
            padding: '4px 13px',
            color: PINK,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'monospace',
            cursor: 'pointer',
            letterSpacing: '0.03em',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            transition: 'background 0.15s, border-color 0.15s',
            boxShadow: running ? `0 0 10px ${PINK}30` : 'none',
            userSelect: 'none',
          }}
        >
          {running && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: PINK, flexShrink: 0,
              animation: 'clockPulse 1s ease-in-out infinite',
            }} />
          )}
          <span>{running ? fmt(elapsed) : timeStr}</span>
        </button>

        {/* Stop-Button */}
        {running && (
          <button
            onClick={handleStop}
            title="Timer stoppen"
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'white', border: `1.5px solid ${PINK}`,
              color: PINK, fontSize: 9, fontWeight: 900,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >■</button>
        )}

        {/* Runden-Dropdown-Toggle */}
        {laps.length > 0 && (
          <button
            onClick={() => setOpen(v => !v)}
            title="Rundenzeiten"
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'white', border: `1.5px solid ${PINK}50`,
              color: PINK, fontSize: 9,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontFamily: 'sans-serif',
            }}
          >
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Runden-Dropdown */}
      {open && laps.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'white', borderRadius: 14,
          border: `1px solid ${PINK}25`,
          boxShadow: `0 8px 28px ${PINK}18`,
          minWidth: 220, overflow: 'hidden',
          animation: 'fadeSlideIn 0.15s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '8px 14px', borderBottom: `1px solid ${PINK}15`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: PINK, letterSpacing: '0.1em' }}>
              RUNDENZEITEN
            </span>
            <button
              onClick={() => { setLaps([]); setOpen(false) }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 10, color: '#bbb', padding: 0 }}
            >
              löschen
            </button>
          </div>

          {/* Runden (neueste zuerst) */}
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {[...laps].reverse().map((lap, i) => (
              <div key={lap.n} style={{
                padding: '8px 14px',
                borderBottom: i < laps.length - 1 ? '1px solid #f4f4f4' : 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: i === 0 && running ? `${PINK}06` : 'transparent',
              }}>
                <span style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif' }}>
                  Runde {lap.n}
                  {i === 0 && running && <span style={{ marginLeft: 5, fontSize: 9, color: PINK }}>●</span>}
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: PINK, fontFamily: 'monospace' }}>
                    {fmt(lap.lapTime)}
                  </div>
                  <div style={{ fontSize: 10, color: '#bbb', fontFamily: 'monospace' }}>
                    ∑ {fmt(lap.total)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
