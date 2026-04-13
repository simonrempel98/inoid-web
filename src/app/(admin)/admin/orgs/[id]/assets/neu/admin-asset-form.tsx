'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OrgTreePicker, getOrgRefLabel, type OrgLocation, type OrgHall, type OrgArea } from '@/components/org-tree-picker'
import { compressImage, checkDocSize, formatBytes } from '@/lib/compress-image'
import { compressPdf, PDF_COMPRESS_THRESHOLD_BYTES } from '@/lib/compress-pdf'
import { FileText, X, Upload, Plus, Trash2, CheckCircle2, Sparkles, Loader2 } from 'lucide-react'

const UNIT_GROUPS = [
  { label: 'Länge',               units: ['mm', 'cm', 'dm', 'm', 'km', 'in', 'ft', 'yd'] },
  { label: 'Fläche',              units: ['mm²', 'cm²', 'm²', 'km²', 'in²', 'ft²'] },
  { label: 'Volumen',             units: ['mm³', 'cm³', 'ml', 'cl', 'dl', 'l', 'm³', 'in³', 'ft³'] },
  { label: 'Gewicht',             units: ['µg', 'mg', 'g', 'kg', 't', 'lb', 'oz'] },
  { label: 'Währung',             units: ['€', '$', '£', 'CHF'] },
  { label: 'Zeit',                units: ['ms', 's', 'min', 'h', 'd', 'Wochen', 'Monate', 'Jahre'] },
  { label: 'Kraft',               units: ['N', 'kN', 'MN', 'lbf', 'kgf'] },
  { label: 'Härte',               units: ['HRC', 'HRB', 'HRA', 'HB', 'HBW', 'HV', 'HK', 'HS', 'Shore A', 'Shore D'] },
  { label: 'Temperatur',          units: ['°C', '°F', 'K'] },
  { label: 'Druck',               units: ['Pa', 'hPa', 'kPa', 'MPa', 'GPa', 'bar', 'mbar', 'psi', 'atm'] },
  { label: 'Drehmoment',          units: ['Nmm', 'Ncm', 'Nm', 'kNm'] },
  { label: 'Spannung / Elektro',  units: ['mV', 'V', 'kV', 'mA', 'A', 'kA', 'Ω', 'kΩ', 'MΩ'] },
  { label: 'Leistung',            units: ['W', 'kW', 'MW', 'VA', 'kVA', 'PS', 'HP'] },
  { label: 'Energie',             units: ['J', 'kJ', 'MJ', 'Wh', 'kWh', 'MWh'] },
  { label: 'Frequenz / Drehzahl', units: ['Hz', 'kHz', 'MHz', 'GHz', 'rpm', 'U/min', 'rad/s'] },
  { label: 'Geschwindigkeit',     units: ['mm/s', 'm/s', 'km/h', 'm/min', 'mm/min'] },
  { label: 'Durchfluss',          units: ['l/min', 'l/h', 'm³/h', 'ml/min'] },
  { label: 'Dichte',              units: ['g/cm³', 'kg/m³', 'kg/l'] },
  { label: 'Oberflächenrauheit',  units: ['Ra', 'Rz', 'Rq', 'Rmax', 'Rt'] },
  { label: 'Winkel',              units: ['°', 'rad', 'mrad', 'gon'] },
  { label: 'Festigkeit',          units: ['N/mm²', 'MPa', 'kN/m²', 'ksi'] },
  { label: 'Anteil / Verhältnis', units: ['%', 'ppm', 'ppb', ':1'] },
]

type DynField = { key: string; value: string }
type DocEntry = { file: File; name: string }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--adm-border2)', background: 'var(--adm-input-bg)', color: 'var(--adm-text)',
  fontSize: 13, fontFamily: 'Arial, sans-serif', outline: 'none',
  boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-text3)',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
  fontFamily: 'Arial, sans-serif',
}
const sectionStyle: React.CSSProperties = {
  background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)',
  padding: '20px', marginBottom: 16,
}
const sectionTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', margin: '0 0 16px',
  fontFamily: 'Arial, sans-serif',
}

export function AdminAssetForm({
  orgId, orgName,
  locations = [], halls = [], areas = [],
  categories = [],
  imageMaxDim = 1920, imageQuality = 82, docMaxSizeMb = 10,
}: {
  orgId: string
  orgName: string
  locations?: OrgLocation[]
  halls?: OrgHall[]
  areas?: OrgArea[]
  categories?: string[]
  imageMaxDim?: number
  imageQuality?: number
  docMaxSizeMb?: number
}) {
  const router = useRouter()
  const supabase = createClient()
  const assetId = useRef(crypto.randomUUID()).current
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  // Basisdaten
  const [title, setTitle] = useState('')
  const [articleNumber, setArticleNumber] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [category, setCategory] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [location, setLocation] = useState('')
  const [locationRef, setLocationRef] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'in_service' | 'decommissioned'>('active')

  // Bilder
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [coverIndex, setCoverIndex] = useState(0)
  const [compressing, setCompressing] = useState(false)

  // Dokumente
  const [docs, setDocs] = useState<DocEntry[]>([])
  const [docError, setDocError] = useState<string | null>(null)

  // Dynamische Felder
  const [techFields, setTechFields] = useState<DynField[]>([])
  const [commFields, setCommFields] = useState<DynField[]>([])
  const [techUnits, setTechUnits] = useState<Record<string, string>>({})
  const [commUnits, setCommUnits] = useState<Record<string, string>>({})

  // KI-Analyse
  const aiInputRef = useRef<HTMLInputElement>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Submit
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const toAdd = files.slice(0, 10 - imageFiles.length)
    e.target.value = ''
    setCompressing(true)
    const results = await Promise.all(toAdd.map(f => compressImage(f, { maxDim: imageMaxDim || undefined, quality: imageQuality / 100 })))
    const compressed = results.map(r => r.file)
    setImageFiles(prev => [...prev, ...compressed])
    setImagePreviews(prev => {
      const newPreviews = [...prev]
      compressed.forEach(f => {
        const reader = new FileReader()
        reader.onload = ev => setImagePreviews(p => [...p, ev.target?.result as string])
        reader.readAsDataURL(f)
      })
      return newPreviews
    })
    setCompressing(false)
  }

  function removeImage(i: number) {
    setImageFiles(prev => prev.filter((_, j) => j !== i))
    setImagePreviews(prev => prev.filter((_, j) => j !== i))
    if (coverIndex >= i && coverIndex > 0) setCoverIndex(c => c - 1)
  }

  function handleDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const maxBytes = docMaxSizeMb > 0 ? docMaxSizeMb * 1024 * 1024 : Infinity
    const valid: DocEntry[] = []
    for (const f of files) {
      const check = checkDocSize(f, maxBytes)
      if (!check.ok) { setDocError(check.message ?? 'Zu groß'); continue }
      valid.push({ file: f, name: f.name.replace(/\.[^/.]+$/, '') })
    }
    setDocs(prev => [...prev, ...valid])
    e.target.value = ''
  }

  async function uploadImages(): Promise<string[]> {
    const ordered = [imageFiles[coverIndex], ...imageFiles.filter((_, i) => i !== coverIndex)]
    const urls: string[] = []
    for (const file of ordered) {
      if (!file) continue
      const ext = file.name.split('.').pop()
      const path = `assets/${assetId}/images/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('asset-images').upload(path, file, { upsert: false })
      if (upErr) throw new Error('Bild-Upload fehlgeschlagen: ' + upErr.message)
      const { data } = supabase.storage.from('asset-images').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  async function uploadDocs(): Promise<string[]> {
    const urls: string[] = []
    for (const doc of docs) {
      let file = doc.file
      if (file.name.toLowerCase().endsWith('.pdf') && file.size > PDF_COMPRESS_THRESHOLD_BYTES) {
        const result = await compressPdf(file)
        if (result.wasCompressed) file = result.file
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const path = `assets/${assetId}/docs/${Date.now()}_${safeName}`
      const { error: upErr } = await supabase.storage.from('org-files').upload(path, file, { upsert: true })
      if (upErr) throw new Error('Dokument-Upload fehlgeschlagen: ' + upErr.message)
      const { data } = supabase.storage.from('org-files').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  async function handleAiAnalyse(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''
    setAiLoading(true)
    setAiError(null)

    try {
      const fileData = await Promise.all(files.map(f => new Promise<{ base64: string; mediaType: string; name: string }>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = ev => resolve({
          base64: (ev.target?.result as string).split(',')[1],
          mediaType: f.type || 'image/jpeg',
          name: f.name,
        })
        reader.onerror = reject
        reader.readAsDataURL(f)
      })))

      const res = await fetch('/api/assets/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileData }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'KI-Analyse fehlgeschlagen')

      const d = json.data
      if (d.title)         setTitle(d.title)
      if (d.manufacturer)  setManufacturer(d.manufacturer)
      if (d.article_number) setArticleNumber(d.article_number)
      if (d.serial_number)  setSerialNumber(d.serial_number)
      if (d.category)      setCategory(d.category)
      if (d.description)   setDescription(d.description)

      if (d.technical_data && typeof d.technical_data === 'object') {
        const entries = Object.entries(d.technical_data as Record<string, string>).filter(([, v]) => v)
        setTechFields(entries.map(([key, value]) => ({ key, value: String(value) })))
      }
      if (d.commercial_data && typeof d.commercial_data === 'object') {
        const entries = Object.entries(d.commercial_data as Record<string, string>).filter(([, v]) => v)
        setCommFields(entries.map(([key, value]) => ({ key, value: String(value) })))
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Bezeichnung ist erforderlich'); return }
    setLoading(true)
    setError(null)

    try {
      const imageUrls = await uploadImages()
      const documentUrls = await uploadDocs()

      let qrCode: string | null = null
      try {
        const QRCode = (await import('qrcode')).default
        qrCode = await QRCode.toDataURL(`https://inoid.app/assets/${assetId}`, {
          width: 240, margin: 2,
          color: { dark: '#003366', light: '#ffffff' },
        })
      } catch { /* QR optional */ }

      const techData = Object.fromEntries(
        techFields.filter(f => f.key.trim()).map(f => [f.key, techUnits[f.key] ? `${f.value} ${techUnits[f.key]}` : f.value])
      )
      const commData = Object.fromEntries(
        commFields.filter(f => f.key.trim()).map(f => [f.key, commUnits[f.key] ? `${f.value} ${commUnits[f.key]}` : f.value])
      )

      const res = await fetch(`/api/admin/orgs/${orgId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          title: title.trim(),
          articleNumber: articleNumber || null,
          serialNumber: serialNumber || null,
          orderNumber: orderNumber || null,
          category: category || null,
          manufacturer: manufacturer || null,
          location: getOrgRefLabel(locationRef, locations, halls, areas) || location || null,
          locationRef: locationRef || null,
          description: description || null,
          status,
          technicalData: techData,
          commercialData: commData,
          imageUrls,
          documentUrls,
          qrCode,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Speichern')

      setSavedId(data.assetId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  function renderUnitSelect(
    fieldKey: string,
    units: Record<string, string>,
    setUnits: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) {
    return (
      <select
        value={units[fieldKey] ?? ''}
        onChange={e => setUnits(u => ({ ...u, [fieldKey]: e.target.value }))}
        style={{ ...inputStyle, width: 'auto', minWidth: 70, flexShrink: 0, color: units[fieldKey] ? 'var(--adm-text)' : 'var(--adm-text4)' }}
      >
        <option value="">–</option>
        {UNIT_GROUPS.map(g => (
          <optgroup key={g.label} label={g.label}>
            {g.units.map(u => <option key={u} value={u}>{u}</option>)}
          </optgroup>
        ))}
      </select>
    )
  }

  function renderDynFields(
    fields: DynField[],
    setFields: React.Dispatch<React.SetStateAction<DynField[]>>,
    units: Record<string, string>,
    setUnits: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    placeholder: string
  ) {
    return (
      <>
        {fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input
              value={f.key}
              onChange={e => setFields(fs => fs.map((x, j) => j === i ? { ...x, key: e.target.value } : x))}
              placeholder={placeholder}
              style={{ ...inputStyle, flex: 1.2 }}
            />
            <input
              value={f.value}
              onChange={e => setFields(fs => fs.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
              placeholder="Wert"
              type={units[f.key] ? 'number' : 'text'}
              style={{ ...inputStyle, flex: 1 }}
            />
            {renderUnitSelect(f.key, units, setUnits)}
            <button type="button" onClick={() => setFields(fs => fs.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text4)', padding: 0, flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setFields(fs => [...fs, { key: '', value: '' }])} style={{ fontSize: 12, color: '#0099cc', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Arial, sans-serif', fontWeight: 600 }}>
          <Plus size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Feld hinzufügen
        </button>
      </>
    )
  }

  // ── Erfolgsansicht ──────────────────────────────────────────────────────────
  if (savedId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 20px', textAlign: 'center' }}>
        <CheckCircle2 size={48} color="#34d399" />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--adm-text)', margin: 0, fontFamily: 'Arial, sans-serif' }}>
          Asset erstellt
        </h2>
        <p style={{ fontSize: 13, color: 'var(--adm-text3)', margin: 0, fontFamily: 'Arial, sans-serif' }}>
          Wurde in <span style={{ color: 'var(--adm-text)', fontWeight: 600 }}>{orgName}</span> angelegt.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <a href={`/assets/${savedId}`} target="_blank" rel="noreferrer" style={{
            padding: '10px 22px', borderRadius: 50, background: '#003366', color: 'white',
            textDecoration: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'Arial, sans-serif',
          }}>
            Asset ansehen ↗
          </a>
          <button onClick={() => router.push(`/admin/orgs/${orgId}`)} style={{
            padding: '10px 22px', borderRadius: 50, border: '1px solid var(--adm-border2)', background: 'transparent',
            color: 'var(--adm-text2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif',
          }}>
            ← Zurück zur Org
          </button>
          <button onClick={() => window.location.reload()} style={{
            padding: '10px 22px', borderRadius: 50, border: '1px solid #0099cc', background: 'transparent',
            color: '#0099cc', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif',
          }}>
            + Weiteres Asset
          </button>
        </div>
      </div>
    )
  }

  // ── Formular ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit}>

      {/* KI-Analyse Banner */}
      <input
        ref={aiInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={handleAiAnalyse}
        style={{ display: 'none' }}
      />
      <div style={{
        background: 'linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 100%)',
        borderRadius: 14, border: '1px solid #1e4080',
        padding: '16px 20px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: '0 0 3px', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="#60a5fa" />
            KI-Analyse
          </p>
          <p style={{ fontSize: 11, color: '#93c5fd', margin: 0, fontFamily: 'Arial, sans-serif' }}>
            Typenschild, Rechnung oder Foto hochladen — Claude füllt das Formular automatisch aus
          </p>
        </div>
        <button
          type="button"
          onClick={() => aiInputRef.current?.click()}
          disabled={aiLoading}
          style={{
            background: aiLoading ? '#1e4080' : '#0099cc',
            color: 'white', border: 'none', borderRadius: 50,
            padding: '9px 18px', fontSize: 13, fontWeight: 700,
            cursor: aiLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'Arial, sans-serif', flexShrink: 0,
          }}
        >
          {aiLoading
            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analysiere…</>
            : <><Sparkles size={13} /> Datei hochladen</>
          }
        </button>
      </div>
      {aiError && (
        <p style={{ color: '#f87171', fontSize: 12, marginBottom: 12, fontFamily: 'Arial, sans-serif',
          background: '#450a0a', padding: '10px 14px', borderRadius: 8 }}>
          KI-Fehler: {aiError}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>

        {/* ── Linke Spalte ── */}
        <div>
          {/* Basisdaten */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Basisdaten</p>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Bezeichnung *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="z.B. Druckwalze 1200mm" autoFocus required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Artikelnummer</label>
                <input value={articleNumber} onChange={e => setArticleNumber(e.target.value)} style={inputStyle} placeholder="WZ-2024-001" />
              </div>
              <div>
                <label style={labelStyle}>Seriennummer</label>
                <input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} style={inputStyle} placeholder="INO-SN-2024-001" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Bestellnummer</label>
                <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} style={inputStyle} placeholder="ORD-WZ-2024" />
              </div>
              <div>
                <label style={labelStyle}>Kategorie</label>
                <input value={category} onChange={e => setCategory(e.target.value)} style={inputStyle} placeholder="z.B. Druckwalzen" list="cats" />
                <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Hersteller</label>
                <input value={manufacturer} onChange={e => setManufacturer(e.target.value)} style={inputStyle} placeholder="z.B. INOMETA GmbH" />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as typeof status)} style={inputStyle}>
                  <option value="active">Aktiv</option>
                  <option value="in_service">In Wartung</option>
                  <option value="decommissioned">Außer Betrieb</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Standort</label>
              {locations.length > 0
                ? <OrgTreePicker locations={locations} halls={halls} areas={areas} value={locationRef} onChange={setLocationRef} inputStyle={inputStyle} />
                : <input value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} placeholder="z.B. Halle 1, Linie 3" />
              }
            </div>
            <div>
              <label style={labelStyle}>Beschreibung</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }} placeholder="Optionale Beschreibung…" />
            </div>
          </div>

          {/* Technische Daten */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Technische Daten</p>
            {renderDynFields(techFields, setTechFields, techUnits, setTechUnits, 'z.B. Außendurchmesser')}
          </div>

          {/* Kaufmännische Daten */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Kaufmännische Daten</p>
            {renderDynFields(commFields, setCommFields, commUnits, setCommUnits, 'z.B. Einkaufspreise')}
          </div>
        </div>

        {/* ── Rechte Spalte ── */}
        <div>
          {/* Bilder */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Bilder {compressing && <span style={{ fontSize: 11, color: 'var(--adm-text3)', fontWeight: 400 }}>Komprimiert…</span>}</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
            {imagePreviews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1', cursor: 'pointer', borderRadius: 6, overflow: 'hidden', border: i === coverIndex ? '2px solid #0099cc' : '2px solid transparent' }} onClick={() => setCoverIndex(i)}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={ev => { ev.stopPropagation(); removeImage(i) }} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                      <X size={10} color="white" />
                    </button>
                    {i === coverIndex && <span style={{ position: 'absolute', bottom: 3, left: 3, fontSize: 9, background: '#0099cc', color: 'white', padding: '1px 5px', borderRadius: 3, fontFamily: 'Arial, sans-serif' }}>Cover</span>}
                  </div>
                ))}
              </div>
            )}
            {imageFiles.length < 10 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px dashed var(--adm-border2)', background: 'transparent', color: 'var(--adm-text3)', fontSize: 12, cursor: 'pointer', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Upload size={13} /> Bilder hinzufügen (max. 10)
              </button>
            )}
          </div>

          {/* Dokumente */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Dokumente</p>
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" multiple onChange={handleDocSelect} style={{ display: 'none' }} />
            {docs.map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FileText size={14} color="#0099cc" style={{ flexShrink: 0 }} />
                <input value={doc.name} onChange={e => setDocs(ds => ds.map((d, j) => j === i ? { ...d, name: e.target.value } : d))} style={{ ...inputStyle, flex: 1, padding: '6px 10px' }} placeholder="Dokumentname" />
                <span style={{ fontSize: 10, color: 'var(--adm-text4)', flexShrink: 0, fontFamily: 'Arial, sans-serif' }}>{formatBytes(doc.file.size)}</span>
                <button type="button" onClick={() => setDocs(ds => ds.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text4)', padding: 0, flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {docError && <p style={{ color: '#f87171', fontSize: 11, margin: '0 0 8px', fontFamily: 'Arial, sans-serif' }}>{docError}</p>}
            <button type="button" onClick={() => { setDocError(null); docInputRef.current?.click() }} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px dashed var(--adm-border2)', background: 'transparent', color: 'var(--adm-text3)', fontSize: 12, cursor: 'pointer', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Upload size={13} /> Dokument hinzufügen (max. 10 MB)
            </button>
          </div>

          {/* Submit */}
          {error && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 10, fontFamily: 'Arial, sans-serif', background: '#450a0a', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
          <button type="submit" disabled={loading || !title.trim()} style={{
            width: '100%', padding: '13px', borderRadius: 50,
            background: loading || !title.trim() ? 'var(--adm-border2)' : '#003366',
            color: loading || !title.trim() ? 'var(--adm-text3)' : 'white',
            border: 'none', fontSize: 14, fontWeight: 700,
            cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}>
            {loading ? 'Wird gespeichert…' : 'Asset in Org erstellen'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </form>
  )
}
