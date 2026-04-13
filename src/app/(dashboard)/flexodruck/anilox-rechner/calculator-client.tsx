'use client'

import { useState, useCallback } from 'react'

// ── Konstanten & Typen ────────────────────────────────────────────────────────

const BCM_FACTOR = 1.55 // 1 BCM = 1.55 cm³/m²

type Unit = 'metric' | 'us'
type Mode = 'volume' | 'consumption' | 'film' | 'reverse' | 'comparison'

const MODES: { id: Mode; label: string; desc: string; svg: React.ReactNode }[] = [
  {
    id: 'volume', label: 'Volumen', desc: 'Zellvolumen aus Geometrie berechnen',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>,
  },
  {
    id: 'consumption', label: 'Tintenverbrauch', desc: 'Verbrauch pro Stunde & Auftrag',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  },
  {
    id: 'film', label: 'Filmdicke', desc: 'Nass- und Trockenschichtdicke',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="3" rx="1"/><rect x="2" y="12" width="20" height="3" rx="1"/><rect x="2" y="17" width="20" height="3" rx="1"/></svg>,
  },
  {
    id: 'reverse', label: 'Rückwärts', desc: 'Zielvolumen → Geometrieparameter',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,
  },
  {
    id: 'comparison', label: 'Vergleich', desc: 'Zwei Walzen gegenüberstellen',
    svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
]

const GEOMETRIES: Record<string, { label: string; factor: number; defaultOpen: number; desc: string }> = {
  hex:          { label: 'Hexagonal (60°)',     factor: 1.1547, defaultOpen: 74, desc: 'Höchste Packungsdichte, Industriestandard' },
  trihelical:   { label: 'Tri-helical (3×60°)', factor: 1.1547, defaultOpen: 70, desc: 'Drei Kanäle, sehr gleichmäßige Übertragung' },
  quadrangular: { label: 'Quadrangulär (90°)',  factor: 1.0000, defaultOpen: 62, desc: 'Rechteckige Zellen, leicht zu reinigen' },
  diamond:      { label: 'Diamant (45°)',        factor: 1.0000, defaultOpen: 65, desc: 'Rautenförmig, 45° gedreht' },
  channel:      { label: 'Kanal/Rille',          factor: 1.0000, defaultOpen: 72, desc: 'Durchgehende Rillen, sehr hohe Volumina' },
  knurl:        { label: 'Knurl/Pyramide',       factor: 0.8660, defaultOpen: 58, desc: 'Pyramidenförmig, für hochviskose Medien' },
}

// ── Berechnungsfunktionen ─────────────────────────────────────────────────────

function r(n: number, dec = 2) {
  const f = Math.pow(10, dec)
  return Math.round(n * f) / f
}

function toMetricVol(v: number, unit: Unit) { return unit === 'us' ? v * BCM_FACTOR : v }
function displayVol(metric: number, unit: Unit) { return unit === 'metric' ? r(metric, 2) : r(metric / BCM_FACTOR, 3) }
function unitLabel(unit: Unit) { return unit === 'metric' ? 'cm³/m²' : 'BCM' }

function calcVolumeMetric(depth: number, openArea: number, geo: string) {
  const f = GEOMETRIES[geo]?.factor ?? 1.1547
  return f * (openArea / 100) * depth
}

function calcConsumption(volMetric: number, speed: number, widthMm: number, coverage: number, transfer: number, densityGCm3: number) {
  const widthM = widthMm / 1000
  const inkGm2 = volMetric * (transfer / 100) * (coverage / 100) * densityGCm3
  const kgHour = inkGm2 * speed * widthM * 60 / 1000
  const kgPer1000m = inkGm2 * widthM * 1000 / 1000
  return { inkGm2: r(inkGm2, 3), kgHour: r(kgHour, 3), kgPer1000m: r(kgPer1000m, 3) }
}

function calcFilm(volMetric: number, transfer: number, coverage: number, solidContent: number) {
  // 1 cm³/m² = 1 μm wet film
  const wet = volMetric * (transfer / 100) * (coverage / 100)
  const dry = wet * (solidContent / 100)
  return { wet: r(wet, 2), dry: r(dry, 2) }
}

// ── Kleine UI-Hilfskomponenten ────────────────────────────────────────────────

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '0.03em', textTransform: 'uppercase' as const }}>{children}</span>
      {hint && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>{hint}</span>}
    </div>
  )
}

function Input({ value, onChange, type = 'number', placeholder, min, max, step, unit, disabled }: {
  value: string; onChange: (v: string) => void; type?: string;
  placeholder?: string; min?: string; max?: string; step?: string; unit?: string; disabled?: boolean
}) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={type} value={value} placeholder={placeholder} min={min} max={max} step={step ?? 'any'}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box' as const,
          padding: unit ? '10px 44px 10px 14px' : '10px 14px',
          border: '1.5px solid #d1d5db', borderRadius: 10,
          fontSize: 14, color: '#111827', background: disabled ? '#f9fafb' : 'white',
          outline: 'none', fontFamily: 'Arial, sans-serif',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#0099cc' }}
        onBlur={e => { e.currentTarget.style.borderColor = '#d1d5db' }}
      />
      {unit && (
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 12, color: '#6b7280', fontWeight: 600, pointerEvents: 'none',
        }}>{unit}</span>
      )}
    </div>
  )
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db',
        borderRadius: 10, fontSize: 14, color: '#111827', background: 'white',
        outline: 'none', fontFamily: 'Arial, sans-serif', cursor: 'pointer',
        appearance: 'none' as const,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%236b7280\' stroke-width=\'1.5\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
        paddingRight: 36,
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function BigResult({ value, unit, label, accent = '#003366' }: { value: number | string; unit: string; label: string; accent?: string }) {
  return (
    <div style={{ textAlign: 'center' as const, padding: '16px 0' }}>
      <div style={{
        fontSize: 48, fontWeight: 900, lineHeight: 1,
        background: `linear-gradient(135deg, ${accent}, #0099cc)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        fontFamily: 'Arial, sans-serif', letterSpacing: '-0.02em',
      }}>{value}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: accent, marginTop: 4 }}>{unit}</div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

function SecondaryResult({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '9px 0', borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
        {value} <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>{unit}</span>
      </span>
    </div>
  )
}

function InfoChip({ text }: { text: string }) {
  return (
    <div style={{
      background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8,
      padding: '8px 12px', fontSize: 12, color: '#0369a1', lineHeight: 1.5,
    }}>ℹ {text}</div>
  )
}

// ── LPC/LPI Doppelfeld ────────────────────────────────────────────────────────

function RulingInput({ lpc, lpi, onLpcChange, onLpiChange }: {
  lpc: string; lpi: string; onLpcChange: (v: string) => void; onLpiChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div>
        <Input value={lpc} onChange={onLpcChange} placeholder="z.B. 120" unit="L/cm" />
        <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, display: 'block' }}>Linien/cm (LPC)</span>
      </div>
      <div>
        <Input value={lpi} onChange={onLpiChange} placeholder="z.B. 305" unit="LPI" />
        <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, display: 'block' }}>Linien/inch (LPI)</span>
      </div>
    </div>
  )
}

// ── Geometrie-Auswahl ─────────────────────────────────────────────────────────

function GeoSelect({ value, onChange }: { value: string; onChange: (g: string) => void }) {
  return (
    <div>
      <Select
        value={value}
        onChange={onChange}
        options={Object.entries(GEOMETRIES).map(([k, v]) => ({ value: k, label: v.label }))}
      />
      {GEOMETRIES[value] && (
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, paddingLeft: 2 }}>
          {GEOMETRIES[value].desc}
          <span style={{ marginLeft: 8, color: '#9ca3af' }}>
            Faktor: {GEOMETRIES[value].factor} · Offene Fläche ca. {GEOMETRIES[value].defaultOpen}%
          </span>
        </div>
      )}
    </div>
  )
}

// ── Kalkulationssektion: Volumen ──────────────────────────────────────────────

function VolumeCalc({ unit, onResult }: { unit: Unit; onResult: (r: any, inp: any) => void }) {
  const [depth, setDepth] = useState('')
  const [geo, setGeo] = useState('hex')
  const [openArea, setOpenArea] = useState('74')
  const [lpc, setLpc] = useState('')
  const [lpi, setLpi] = useState('')

  const handleGeo = (g: string) => {
    setGeo(g)
    setOpenArea(String(GEOMETRIES[g].defaultOpen))
  }

  const handleLpc = (v: string) => {
    setLpc(v)
    const n = parseFloat(v)
    if (!isNaN(n) && n > 0) setLpi(r(n * 2.54, 1).toString())
    else setLpi('')
  }
  const handleLpi = (v: string) => {
    setLpi(v)
    const n = parseFloat(v)
    if (!isNaN(n) && n > 0) setLpc(r(n / 2.54, 1).toString())
    else setLpc('')
  }

  const calculate = () => {
    const d = parseFloat(depth), oa = parseFloat(openArea)
    if (isNaN(d) || isNaN(oa) || d <= 0 || oa <= 0) return
    const volMetric = calcVolumeMetric(d, oa, geo)
    const volUS = volMetric / BCM_FACTOR
    const filmEquiv = r(volMetric, 2)
    onResult(
      { volMetric: r(volMetric, 2), volUS: r(volUS, 3), filmEquiv },
      { lpc: lpc || null, lpi: lpi || null, depth: d, geometry: geo, openArea: oa }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Label hint="optional">Lineatur (Screenruling)</Label>
        <RulingInput lpc={lpc} lpi={lpi} onLpcChange={handleLpc} onLpiChange={handleLpi} />
        <div style={{ marginTop: 8 }}>
          <InfoChip text="Die Lineatur beeinflusst nicht direkt das Volumen – sie bestimmt die Zellgröße. Das Volumen ergibt sich aus Tiefe × offener Fläche." />
        </div>
      </div>
      <div>
        <Label>Zelltiefe *</Label>
        <Input value={depth} onChange={setDepth} placeholder="z.B. 30" unit="μm" min="1" max="200" />
      </div>
      <div>
        <Label>Zellgeometrie *</Label>
        <GeoSelect value={geo} onChange={handleGeo} />
      </div>
      <div>
        <Label hint="Empfehlung autom. gesetzt">Offene Fläche *</Label>
        <Input value={openArea} onChange={setOpenArea} placeholder="z.B. 74" unit="%" min="20" max="90" />
      </div>
      <CalcButton onClick={calculate} />
    </div>
  )
}

function VolumeResult({ result, unit }: { result: any; unit: Unit }) {
  const mainVal = displayVol(result.volMetric, unit)
  const secUnit = unit === 'metric' ? 'us' : 'metric'
  const secVal = displayVol(result.volMetric, secUnit)
  return (
    <div>
      <BigResult value={mainVal} unit={unitLabel(unit)} label="Zellvolumen" />
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
        <SecondaryResult label="Equivalent in BCM" value={r(result.volUS, 3)} unit="BCM" />
        <SecondaryResult label="Equivalent in cm³/m²" value={r(result.volMetric, 2)} unit="cm³/m²" />
        <SecondaryResult label="Äquivalente Nassfilmdicke" value={r(result.volMetric, 2)} unit="μm" />
        <SecondaryResult label="(bei 100% Übertragung & Deckung)" value="" unit="" />
      </div>
    </div>
  )
}

// ── Kalkulationssektion: Tintenverbrauch ──────────────────────────────────────

function ConsumptionCalc({ unit, onResult }: { unit: Unit; onResult: (r: any, inp: any) => void }) {
  const [vol, setVol] = useState('')
  const [speed, setSpeed] = useState('')
  const [width, setWidth] = useState('')
  const [coverage, setCoverage] = useState('100')
  const [transfer, setTransfer] = useState('60')
  const [density, setDensity] = useState('1.0')

  const calculate = () => {
    const v = toMetricVol(parseFloat(vol), unit)
    const sp = parseFloat(speed), w = parseFloat(width)
    const cov = parseFloat(coverage), tr = parseFloat(transfer), den = parseFloat(density)
    if ([v, sp, w, cov, tr, den].some(x => isNaN(x) || x <= 0)) return
    const res = calcConsumption(v, sp, w, cov, tr, den)
    onResult(res, { volume: parseFloat(vol), unit, speed: sp, width: w, coverage: cov, transfer: tr, density: den })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Label>Anilox-Volumen *</Label>
        <Input value={vol} onChange={setVol} placeholder={unit === 'metric' ? 'z.B. 10' : 'z.B. 6.5'} unit={unitLabel(unit)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <Label>Druckgeschwindigkeit *</Label>
          <Input value={speed} onChange={setSpeed} placeholder="z.B. 150" unit="m/min" />
        </div>
        <div>
          <Label>Druckbreite *</Label>
          <Input value={width} onChange={setWidth} placeholder="z.B. 800" unit="mm" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <Label hint="Flächendeckung">Deckung</Label>
          <Input value={coverage} onChange={setCoverage} placeholder="100" unit="%" min="1" max="100" />
        </div>
        <div>
          <Label hint="Typisch 50–70%">Übertragung</Label>
          <Input value={transfer} onChange={setTransfer} placeholder="60" unit="%" min="10" max="100" />
        </div>
        <div>
          <Label hint="Tintendichte">Dichte</Label>
          <Input value={density} onChange={setDensity} placeholder="1.0" unit="g/cm³" />
        </div>
      </div>
      <CalcButton onClick={calculate} />
    </div>
  )
}

function ConsumptionResult({ result }: { result: any }) {
  return (
    <div>
      <BigResult value={result.inkGm2} unit="g/m²" label="Tintenauftrag pro m²" />
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
        <SecondaryResult label="Verbrauch" value={result.kgHour} unit="kg/Stunde" />
        <SecondaryResult label="Verbrauch" value={result.kgPer1000m} unit="kg pro 1.000 lm" />
        <SecondaryResult label="Verbrauch" value={r(result.kgPer1000m * 10, 2)} unit="kg pro 10.000 lm" />
      </div>
    </div>
  )
}

// ── Kalkulationssektion: Filmdicke ────────────────────────────────────────────

function FilmCalc({ unit, onResult }: { unit: Unit; onResult: (r: any, inp: any) => void }) {
  const [vol, setVol] = useState('')
  const [transfer, setTransfer] = useState('60')
  const [coverage, setCoverage] = useState('100')
  const [solid, setSolid] = useState('40')

  const calculate = () => {
    const v = toMetricVol(parseFloat(vol), unit)
    const tr = parseFloat(transfer), cov = parseFloat(coverage), sc = parseFloat(solid)
    if ([v, tr, cov, sc].some(x => isNaN(x) || x < 0)) return
    const res = calcFilm(v, tr, cov, sc)
    onResult(res, { volume: parseFloat(vol), unit, transfer: tr, coverage: cov, solidContent: sc })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Label>Anilox-Volumen *</Label>
        <Input value={vol} onChange={setVol} placeholder={unit === 'metric' ? 'z.B. 8' : 'z.B. 5.2'} unit={unitLabel(unit)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <Label hint="Typisch 50–70%">Übertragungsrate</Label>
          <Input value={transfer} onChange={setTransfer} placeholder="60" unit="%" />
        </div>
        <div>
          <Label hint="Motivdeckung">Flächendeckung</Label>
          <Input value={coverage} onChange={setCoverage} placeholder="100" unit="%" />
        </div>
      </div>
      <div>
        <Label hint="Für Trockenfilm">Feststoffgehalt Tinte</Label>
        <Input value={solid} onChange={setSolid} placeholder="40" unit="%" />
      </div>
      <InfoChip text="Formel: 1 cm³/m² = 1 μm Nassschichtdicke bei 100% Übertragung und Deckung." />
      <CalcButton onClick={calculate} />
    </div>
  )
}

function FilmResult({ result }: { result: any }) {
  return (
    <div>
      <BigResult value={result.wet} unit="μm" label="Nassfilmdicke" accent="#0055aa" />
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
        <SecondaryResult label="Trockenfilm" value={result.dry} unit="μm" />
        <SecondaryResult label="Verhältnis Nass/Trocken" value={result.wet > 0 ? r(result.wet / result.dry, 1) : '—'} unit=":1" />
      </div>
    </div>
  )
}

// ── Kalkulationssektion: Rückwärts ────────────────────────────────────────────

function ReverseCalc({ unit, onResult }: { unit: Unit; onResult: (r: any, inp: any) => void }) {
  const [targetVol, setTargetVol] = useState('')
  const [geo, setGeo] = useState('hex')
  const [openArea, setOpenArea] = useState('74')
  const [mode, setMode] = useState<'findDepth' | 'findOpen'>('findDepth')
  const [fixedVal, setFixedVal] = useState('')

  const handleGeo = (g: string) => { setGeo(g); setOpenArea(String(GEOMETRIES[g].defaultOpen)) }

  const calculate = () => {
    const tv = toMetricVol(parseFloat(targetVol), unit)
    const f = GEOMETRIES[geo]?.factor ?? 1.1547
    if (isNaN(tv) || tv <= 0) return

    if (mode === 'findDepth') {
      const oa = parseFloat(openArea)
      if (isNaN(oa) || oa <= 0) return
      const depth = r(tv / (f * oa / 100), 1)
      onResult({ mode, depth, openArea: oa }, { targetVolume: parseFloat(targetVol), unit, geometry: geo, openArea: oa, mode })
    } else {
      const depth = parseFloat(fixedVal)
      if (isNaN(depth) || depth <= 0) return
      const openAreaCalc = r((tv / (f * depth)) * 100, 1)
      onResult({ mode, openArea: openAreaCalc, depth }, { targetVolume: parseFloat(targetVol), unit, geometry: geo, depth, mode })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Label>Ziel-Volumen *</Label>
        <Input value={targetVol} onChange={setTargetVol} placeholder={unit === 'metric' ? 'z.B. 12' : 'z.B. 7.7'} unit={unitLabel(unit)} />
      </div>
      <div>
        <Label>Zellgeometrie *</Label>
        <GeoSelect value={geo} onChange={handleGeo} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: '#f3f4f6', borderRadius: 10, padding: 3 }}>
        {[
          { id: 'findDepth', label: 'Tiefe gesucht' },
          { id: 'findOpen', label: 'Off. Fläche gesucht' },
        ].map(o => (
          <button key={o.id} type="button" onClick={() => setMode(o.id as any)} style={{
            padding: '9px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
            background: mode === o.id ? 'white' : 'transparent',
            boxShadow: mode === o.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            fontSize: 13, fontWeight: 700, color: mode === o.id ? '#003366' : '#9ca3af',
            transition: 'all 0.15s',
          }}>{o.label}</button>
        ))}
      </div>
      {mode === 'findDepth' ? (
        <div>
          <Label hint="bekannt">Offene Fläche</Label>
          <Input value={openArea} onChange={setOpenArea} placeholder="74" unit="%" min="20" max="90" />
        </div>
      ) : (
        <div>
          <Label hint="bekannte Tiefe">Zelltiefe</Label>
          <Input value={fixedVal} onChange={setFixedVal} placeholder="z.B. 30" unit="μm" />
        </div>
      )}
      <CalcButton onClick={calculate} />
    </div>
  )
}

function ReverseResult({ result }: { result: any }) {
  if (result.mode === 'findDepth') {
    return (
      <div>
        <BigResult value={result.depth} unit="μm" label="Erforderliche Zelltiefe" accent="#7c3aed" />
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
          <SecondaryResult label="Bei offener Fläche" value={result.openArea} unit="%" />
        </div>
      </div>
    )
  }
  return (
    <div>
      <BigResult value={result.openArea} unit="%" label="Erforderliche offene Fläche" accent="#7c3aed" />
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
        <SecondaryResult label="Bei Zelltiefe" value={result.depth} unit="μm" />
        {result.openArea > 85 && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 12, color: '#c2410c' }}>
            ⚠ Offene Fläche über 85% ist technisch schwer erreichbar – Tiefe oder Geometrie überprüfen.
          </div>
        )}
      </div>
    </div>
  )
}

// ── Kalkulationssektion: Vergleich ────────────────────────────────────────────

function AniloxInputGroup({ label, accent, lpc, lpi, depth, geo, openArea, onLpcChange, onLpiChange, onDepthChange, onGeoChange, onOpenChange }: any) {
  return (
    <div style={{ background: `${accent}08`, border: `1.5px solid ${accent}33`, borderRadius: 14, padding: 16 }}>
      <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: accent }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Label>Lineatur (optional)</Label>
          <RulingInput lpc={lpc} lpi={lpi} onLpcChange={onLpcChange} onLpiChange={onLpiChange} />
        </div>
        <div>
          <Label>Zelltiefe *</Label>
          <Input value={depth} onChange={onDepthChange} placeholder="z.B. 30" unit="μm" />
        </div>
        <div>
          <Label>Geometrie</Label>
          <GeoSelect value={geo} onChange={onGeoChange} />
        </div>
        <div>
          <Label>Offene Fläche</Label>
          <Input value={openArea} onChange={onOpenChange} placeholder="74" unit="%" />
        </div>
      </div>
    </div>
  )
}

function ComparisonCalc({ unit, onResult }: { unit: Unit; onResult: (r: any, inp: any) => void }) {
  const makeState = () => ({ lpc: '', lpi: '', depth: '', geo: 'hex', openArea: '74' })
  const [a, setA] = useState(makeState())
  const [b, setB] = useState(makeState())

  const updA = (k: string) => (v: string) => {
    setA(p => {
      const next = { ...p, [k]: v }
      if (k === 'lpc' && v) next.lpi = r(parseFloat(v) * 2.54, 1).toString()
      if (k === 'lpi' && v) next.lpc = r(parseFloat(v) / 2.54, 1).toString()
      if (k === 'geo') next.openArea = String(GEOMETRIES[v]?.defaultOpen ?? 74)
      return next
    })
  }
  const updB = (k: string) => (v: string) => {
    setB(p => {
      const next = { ...p, [k]: v }
      if (k === 'lpc' && v) next.lpi = r(parseFloat(v) * 2.54, 1).toString()
      if (k === 'lpi' && v) next.lpc = r(parseFloat(v) / 2.54, 1).toString()
      if (k === 'geo') next.openArea = String(GEOMETRIES[v]?.defaultOpen ?? 74)
      return next
    })
  }

  const calculate = () => {
    const dA = parseFloat(a.depth), oaA = parseFloat(a.openArea)
    const dB = parseFloat(b.depth), oaB = parseFloat(b.openArea)
    if ([dA, oaA, dB, oaB].some(x => isNaN(x) || x <= 0)) return
    const vA = calcVolumeMetric(dA, oaA, a.geo)
    const vB = calcVolumeMetric(dB, oaB, b.geo)
    const diff = r(vB - vA, 2)
    const pct = vA > 0 ? r(((vB - vA) / vA) * 100, 1) : 0
    onResult({ vA: r(vA, 2), vB: r(vB, 2), diff, pct },
      { a: { ...a, depth: dA, openArea: oaA }, b: { ...b, depth: dB, openArea: oaB } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AniloxInputGroup label="Walze A" accent="#003366"
        lpc={a.lpc} lpi={a.lpi} depth={a.depth} geo={a.geo} openArea={a.openArea}
        onLpcChange={updA('lpc')} onLpiChange={updA('lpi')} onDepthChange={updA('depth')}
        onGeoChange={updA('geo')} onOpenChange={updA('openArea')} />
      <AniloxInputGroup label="Walze B" accent="#0099cc"
        lpc={b.lpc} lpi={b.lpi} depth={b.depth} geo={b.geo} openArea={b.openArea}
        onLpcChange={updB('lpc')} onLpiChange={updB('lpi')} onDepthChange={updB('depth')}
        onGeoChange={updB('geo')} onOpenChange={updB('openArea')} />
      <CalcButton onClick={calculate} />
    </div>
  )
}

function ComparisonResult({ result, unit }: { result: any; unit: Unit }) {
  const bigger = result.vB >= result.vA ? 'B' : 'A'
  const diffColor = result.diff > 0 ? '#059669' : result.diff < 0 ? '#dc2626' : '#6b7280'
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#f0f4ff', borderRadius: 12, padding: '14px 12px', textAlign: 'center' as const }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#003366', textTransform: 'uppercase' as const, marginBottom: 4 }}>Walze A</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#003366' }}>{displayVol(result.vA, unit)}</div>
          <div style={{ fontSize: 13, color: '#4b5563' }}>{unitLabel(unit)}</div>
        </div>
        <div style={{ background: '#e0f2fe', borderRadius: 12, padding: '14px 12px', textAlign: 'center' as const }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0099cc', textTransform: 'uppercase' as const, marginBottom: 4 }}>Walze B</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0099cc' }}>{displayVol(result.vB, unit)}</div>
          <div style={{ fontSize: 13, color: '#4b5563' }}>{unitLabel(unit)}</div>
        </div>
      </div>
      <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', textAlign: 'center' as const, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Differenz B − A</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: diffColor }}>
          {result.diff > 0 ? '+' : ''}{displayVol(result.diff, unit)} {unitLabel(unit)}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: diffColor }}>
          {result.pct > 0 ? '+' : ''}{result.pct}%
        </div>
      </div>
      <div style={{
        padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0',
        borderRadius: 10, fontSize: 13, color: '#166534',
      }}>
        {result.diff === 0
          ? '↔ Beide Walzen haben identisches Volumen.'
          : `→ Walze ${bigger} überträgt ${Math.abs(result.pct)}% ${result.pct > 0 ? 'mehr' : 'weniger'} Tinte.`}
      </div>
    </div>
  )
}

// ── Berechnen-Button ──────────────────────────────────────────────────────────

function CalcButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', padding: '13px', border: 'none', borderRadius: 12,
      background: 'linear-gradient(135deg, #003366, #0099cc)',
      color: 'white', fontSize: 15, fontWeight: 800,
      cursor: 'pointer', letterSpacing: '0.02em',
      boxShadow: '0 4px 14px rgba(0,51,102,0.3)',
      transition: 'transform 0.1s, box-shadow 0.1s',
    }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,51,102,0.2)' }}
      onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,51,102,0.3)' }}
    >
      Berechnen →
    </button>
  )
}

// ── Speichern-Modal ───────────────────────────────────────────────────────────

function SaveModal({ open, onClose, onSave, defaultName }: {
  open: boolean; onClose: () => void; onSave: (name: string, note: string) => void; defaultName: string
}) {
  const [name, setName] = useState(defaultName)
  const [note, setNote] = useState('')

  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: '#003366' }}>Berechnung speichern</h3>
        <div style={{ marginBottom: 14 }}>
          <Label>Name *</Label>
          <Input value={name} onChange={v => setName(v)} type="text" placeholder="z.B. Walze A-120 / 30μm" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <Label hint="optional">Notiz</Label>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="z.B. Für Linie 3, UV-Farbe Cyan"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box' as const, padding: '10px 14px',
              border: '1.5px solid #d1d5db', borderRadius: 10,
              fontSize: 14, color: '#111827', resize: 'vertical',
              fontFamily: 'Arial, sans-serif', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} style={{
            flex: 1, padding: '11px', border: '1.5px solid #d1d5db', borderRadius: 10,
            background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#6b7280',
          }}>Abbrechen</button>
          <button type="button" onClick={() => { if (name.trim()) { onSave(name.trim(), note.trim()); setNote('') } }} style={{
            flex: 2, padding: '11px', border: 'none', borderRadius: 10,
            background: 'linear-gradient(135deg, #003366, #0099cc)',
            cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white',
          }}>Speichern</button>
        </div>
      </div>
    </div>
  )
}

// ── Verlauf ───────────────────────────────────────────────────────────────────

function relDate(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'Gerade eben'
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min`
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std`
  if (diff < 604800) return `vor ${Math.floor(diff / 86400)} Tag${Math.floor(diff / 86400) > 1 ? 'en' : ''}`
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const MODE_LABELS: Record<string, string> = {
  volume: 'Volumen', consumption: 'Verbrauch', film: 'Filmdicke', reverse: 'Rückwärts', comparison: 'Vergleich'
}
const MODE_COLORS: Record<string, string> = {
  volume: '#003366', consumption: '#0099cc', film: '#7c3aed', reverse: '#059669', comparison: '#d97706'
}

function calcResultSummary(calc: any) {
  const r = calc.results
  const u = calc.unit
  if (calc.calc_type === 'volume') return `${r.volMetric} cm³/m² · ${r.volUS} BCM`
  if (calc.calc_type === 'consumption') return `${r.inkGm2} g/m² · ${r.kgHour} kg/h`
  if (calc.calc_type === 'film') return `${r.wet} μm nass · ${r.dry} μm trocken`
  if (calc.calc_type === 'reverse') return r.mode === 'findDepth' ? `${r.depth} μm Tiefe` : `${r.openArea}% off. Fläche`
  if (calc.calc_type === 'comparison') return `A: ${r.vA} · B: ${r.vB} cm³/m²`
  return '—'
}

function HistoryCard({ calc, onLoad, onDelete }: { calc: any; onLoad: () => void; onDelete: () => void }) {
  const color = MODE_COLORS[calc.calc_type] ?? '#003366'
  return (
    <div style={{
      background: 'white', borderRadius: 14, border: '1px solid #e5e7eb',
      padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color }}>{MODE_LABELS[calc.calc_type]?.[0] ?? '?'}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{calc.name}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, padding: '1px 6px', borderRadius: 5, flexShrink: 0 }}>
            {MODE_LABELS[calc.calc_type]}
          </span>
        </div>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {calcResultSummary(calc)}
        </p>
        {calc.note && (
          <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {calc.note}
          </p>
        )}
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{relDate(calc.created_at)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        <button type="button" onClick={onLoad} style={{
          padding: '5px 10px', border: '1.5px solid #003366', borderRadius: 7,
          background: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#003366',
        }}>Laden</button>
        <button type="button" onClick={onDelete} style={{
          padding: '5px 10px', border: '1.5px solid #fee2e2', borderRadius: 7,
          background: '#fef2f2', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#dc2626',
        }}>Löschen</button>
      </div>
    </div>
  )
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────

export function AniloxCalculator() {
  const [mode, setMode] = useState<Mode>('volume')
  const [unit, setUnit] = useState<Unit>('metric')
  const [result, setResult] = useState<any>(null)
  const [currentInputs, setCurrentInputs] = useState<any>(null)
  const [showSave, setShowSave] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyOpen, setHistoryOpen] = useState(true)
  const [saving, setSaving] = useState(false)

  // History laden
  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/flexodruck/anilox-rechner')
    if (res.ok) { const d = await res.json(); setHistory(d.calculations ?? []) }
  }, [])

  useState(() => { loadHistory() })

  const handleResult = (res: any, inp: any) => {
    setResult(res)
    setCurrentInputs(inp)
  }

  const handleSave = async (name: string, note: string) => {
    if (!currentInputs || !result) return
    setSaving(true)
    setShowSave(false)
    await fetch('/api/flexodruck/anilox-rechner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, note, calc_type: mode, inputs: currentInputs, results: result, unit }),
    })
    setSaving(false)
    loadHistory()
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/flexodruck/anilox-rechner', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setHistory(h => h.filter(c => c.id !== id))
  }

  const handleLoad = (calc: any) => {
    setMode(calc.calc_type)
    setUnit(calc.unit)
    setResult(calc.results)
    setCurrentInputs(calc.inputs)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const defaultSaveName = () => {
    if (mode === 'volume' && currentInputs) {
      const geo = GEOMETRIES[currentInputs.geometry]?.label?.split(' ')[0] ?? ''
      return `${currentInputs.depth}μm ${geo} / ${result?.volMetric} cm³/m²`
    }
    return `${MODE_LABELS[mode]} – ${new Date().toLocaleDateString('de-DE')}`
  }

  // Result-Panel auswählen
  const ResultPanel = () => {
    if (!result) {
      return (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, padding: '40px 20px', color: '#9ca3af',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
            <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ margin: 0, fontSize: 14, textAlign: 'center' as const, lineHeight: 1.5 }}>
            Eingaben ausfüllen und<br /><strong>„Berechnen"</strong> klicken
          </p>
        </div>
      )
    }
    return (
      <div>
        {mode === 'volume'      && <VolumeResult result={result} unit={unit} />}
        {mode === 'consumption' && <ConsumptionResult result={result} />}
        {mode === 'film'        && <FilmResult result={result} />}
        {mode === 'reverse'     && <ReverseResult result={result} />}
        {mode === 'comparison'  && <ComparisonResult result={result} unit={unit} />}
        <div style={{ marginTop: 16 }}>
          <button type="button" onClick={() => setShowSave(true)} disabled={saving} style={{
            width: '100%', padding: '11px', border: '2px solid #003366',
            borderRadius: 10, background: 'white', cursor: 'pointer',
            fontSize: 14, fontWeight: 700, color: '#003366',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f4ff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
          >
            {saving ? '⏳ Speichern…' : '💾 Ergebnis speichern'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 60, maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #003366, #0099cc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#003366' }}>Anilox-Rechner</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Volumen · Verbrauch · Filmdicke · Rückwärts · Vergleich</p>
          </div>
        </div>
        {/* Einheiten-Toggle */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 10, padding: 3, gap: 0 }}>
          {(['metric', 'us'] as Unit[]).map(u => (
            <button key={u} type="button" onClick={() => { setUnit(u); setResult(null) }} style={{
              padding: '7px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: unit === u ? 'white' : 'transparent',
              boxShadow: unit === u ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              fontSize: 13, fontWeight: 700,
              color: unit === u ? '#003366' : '#9ca3af',
              transition: 'all 0.15s',
            }}>
              {u === 'metric' ? 'cm³/m²' : 'BCM'}
            </button>
          ))}
        </div>
      </div>

      {/* Modus-Tabs */}
      <div style={{
        margin: '16px 0 0', padding: '0 16px',
        display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
        paddingBottom: 4,
      }}>
        {MODES.map(m => {
          const active = mode === m.id
          return (
            <button key={m.id} type="button" onClick={() => { setMode(m.id); setResult(null) }} style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', border: 'none', borderRadius: 20, cursor: 'pointer',
              background: active ? 'linear-gradient(135deg, #003366, #0077b6)' : 'white',
              border: active ? 'none' : '1.5px solid #e5e7eb',
              color: active ? 'white' : '#4b5563',
              fontSize: 13, fontWeight: active ? 700 : 500,
              boxShadow: active ? '0 4px 12px rgba(0,51,102,0.25)' : 'none',
              transition: 'all 0.15s',
            } as any}>
              <span style={{ color: active ? 'white' : '#0099cc' }}>{m.svg}</span>
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Aktiver Modus – Beschreibung */}
      <p style={{ margin: '8px 16px 0', fontSize: 12, color: '#9ca3af' }}>
        {MODES.find(m => m.id === mode)?.desc}
      </p>

      {/* Haupt-Layout: Input + Result */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}
        className="anilox-grid">
        <style>{`
          @media (min-width: 680px) {
            .anilox-grid { grid-template-columns: 1fr 1fr !important; }
          }
        `}</style>

        {/* Input-Karte */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#374151' }}>Eingaben</p>
          {mode === 'volume'      && <VolumeCalc unit={unit} onResult={handleResult} />}
          {mode === 'consumption' && <ConsumptionCalc unit={unit} onResult={handleResult} />}
          {mode === 'film'        && <FilmCalc unit={unit} onResult={handleResult} />}
          {mode === 'reverse'     && <ReverseCalc unit={unit} onResult={handleResult} />}
          {mode === 'comparison'  && <ComparisonCalc unit={unit} onResult={handleResult} />}
        </div>

        {/* Result-Karte */}
        <div style={{
          background: result ? 'white' : '#fafafa',
          borderRadius: 16, border: `1.5px solid ${result ? '#c8d4e8' : '#f3f4f6'}`,
          padding: 20, display: 'flex', flexDirection: 'column',
          transition: 'border-color 0.3s, background 0.3s',
        }}>
          <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#374151' }}>Ergebnis</p>
          <ResultPanel />
        </div>
      </div>

      {/* Verlauf */}
      <div style={{ padding: '0 16px' }}>
        <button type="button" onClick={() => setHistoryOpen(v => !v)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'white', border: '1px solid #e5e7eb',
          borderRadius: historyOpen && history.length > 0 ? '14px 14px 0 0' : 14,
          cursor: 'pointer', transition: 'background 0.15s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Letzte Berechnungen</span>
            {history.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: '#003366', color: 'white', padding: '2px 8px', borderRadius: 20 }}>
                {history.length}
              </span>
            )}
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
            style={{ transform: historyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {historyOpen && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: 12 }}>
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, margin: '16px 0' }}>
                Noch keine gespeicherten Berechnungen.<br />
                <span style={{ fontSize: 12 }}>Berechne etwas und klicke „Ergebnis speichern".</span>
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map(calc => (
                  <HistoryCard
                    key={calc.id}
                    calc={calc}
                    onLoad={() => handleLoad(calc)}
                    onDelete={() => handleDelete(calc.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <SaveModal
        open={showSave}
        onClose={() => setShowSave(false)}
        onSave={handleSave}
        defaultName={defaultSaveName()}
      />
    </div>
  )
}
