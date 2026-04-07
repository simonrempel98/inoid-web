'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Smartphone, Tag } from 'lucide-react'
import { OrgTreePicker, getOrgRefLabel, type OrgLocation, type OrgHall, type OrgArea } from '@/components/org-tree-picker'

const STEPS = ['Basisdaten', 'Fotos', 'Technik', 'Kommerziell', 'QR / NFC']

export function AssetForm({ locations = [], halls = [], areas = [] }: {
  locations?: OrgLocation[]
  halls?: OrgHall[]
  areas?: OrgArea[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [assetId] = useState<string>(() => crypto.randomUUID())
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAssetId, setSavedAssetId] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  // Step 0 – Basisdaten
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

  // Step 1 – Fotos
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // Step 2 – Technische Daten
  const [techFreeKeys, setTechFreeKeys] = useState<string[]>([])
  const [technicalData, setTechnicalData] = useState<Record<string, string>>({})

  // Step 3 – Kommerzielle Daten
  const [commFreeKeys, setCommFreeKeys] = useState<string[]>([])
  const [commercialData, setCommercialData] = useState<Record<string, string>>({})

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = 10 - imageFiles.length
    const toAdd = files.slice(0, remaining)
    setImageFiles(prev => [...prev, ...toAdd])
    toAdd.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setImagePreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removeImage(index: number) {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadImages(): Promise<string[]> {
    const urls: string[] = []
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop()
      const path = `${assetId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('asset-images').upload(path, file, { upsert: false })
      if (error) throw new Error('Bild-Upload fehlgeschlagen: ' + error.message)
      const { data } = supabase.storage.from('asset-images').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  async function generateQR(): Promise<string> {
    try {
      const QRCode = (await import('qrcode')).default
      const url = `https://inoid.app/assets/${assetId}`
      const dataUrl = await QRCode.toDataURL(url, {
        width: 240, margin: 2,
        color: { dark: '#003366', light: '#ffffff' },
      })
      setQrDataUrl(dataUrl)
      return url
    } catch {
      return `https://inoid.app/assets/${assetId}`
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht eingeloggt')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
      if (!profile?.organization_id) throw new Error('Keine Organisation gefunden')

      const { data: asset, error: insertError } = await supabase
        .from('assets')
        .insert({
          id: assetId,
          organization_id: profile.organization_id,
          title,
          article_number: articleNumber || null,
          serial_number: serialNumber || null,
          order_number: orderNumber || null,
          category: category || null,
          manufacturer: manufacturer || null,
          location: getOrgRefLabel(locationRef, locations, halls, areas) || location || null,
          location_ref: locationRef || null,
          description: description || null,
          status,
          technical_data: technicalData,
          commercial_data: commercialData,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (insertError || !asset) throw new Error(insertError?.message ?? 'Asset konnte nicht gespeichert werden')

      const imageUrls = await uploadImages()
      const qrUrl = await generateQR()

      await supabase.from('assets').update({
        image_urls: imageUrls,
        qr_code: qrUrl,
        nfc_uid: assetId,
      }).eq('id', assetId)

      setSavedAssetId(assetId)
      setStep(5) // Fertig-Screen
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  function renderDynamicFields(
    data: Record<string, string>,
    setData: (d: Record<string, string>) => void,
    freeKeys: string[],
    setFreeKeys: (k: string[]) => void,
  ) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {freeKeys.map((key, i) => (
          <div key={i} style={{ display: 'flex', gap: 8 }}>
            <input
              value={key}
              onChange={e => {
                const newLabel = e.target.value
                setFreeKeys(prev => {
                  const updated = [...prev]
                  updated[i] = newLabel
                  return updated
                })
                setData(prev => {
                  const oldKey = freeKeys[i]
                  const next = { ...prev }
                  next[newLabel] = next[oldKey] ?? ''
                  delete next[oldKey]
                  return next
                })
              }}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Bezeichnung"
            />
            <input
              value={data[key] ?? ''}
              onChange={e => {
                const val = e.target.value
                setData(prev => ({ ...prev, [key]: val }))
              }}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Wert"
            />
            <button
              type="button"
              onClick={() => {
                setData(prev => {
                  const next = { ...prev }
                  delete next[key]
                  return next
                })
                setFreeKeys(prev => prev.filter((_, j) => j !== i))
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 18 }}
            >×</button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFreeKeys([...freeKeys, ''])}
          style={{
            border: '1px dashed #c8d4e8', background: 'none', borderRadius: 10,
            padding: '8px 16px', color: '#003366', fontSize: 13, cursor: 'pointer', fontWeight: 600,
          }}
        >+ Feld hinzufügen</button>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid #c8d4e8', fontSize: 14, fontFamily: 'Arial, sans-serif',
    backgroundColor: 'white', color: '#000', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, color: '#003366',
    marginBottom: 4, fontFamily: 'Arial, sans-serif',
  }

  function renderStep() {
    // Fertig
    if (step === 5 && savedAssetId) {
      return (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 12, color: '#003366' }}><CheckCircle2 size={48} style={{ color: '#003366' }} /></div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#000', margin: '0 0 8px', fontFamily: 'Arial, sans-serif' }}>
            Asset angelegt!
          </h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24, fontFamily: 'Arial, sans-serif' }}>
            „{title}" wurde erfolgreich gespeichert.
          </p>
          {qrDataUrl && (
            <div style={{ display: 'inline-block', padding: 16, background: 'white', borderRadius: 16, border: '1px solid #c8d4e8', marginBottom: 24 }}>
              <img src={qrDataUrl} alt="QR Code" style={{ width: 180, height: 180 }} />
              <p style={{ fontSize: 11, color: '#96aed2', margin: '8px 0 0', fontFamily: 'Arial, sans-serif' }}>
                inoid.app/assets/{savedAssetId.slice(0, 8)}…
              </p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push(`/assets/${savedAssetId}`)}
              style={{
                backgroundColor: '#003366', color: 'white', padding: '12px 24px',
                borderRadius: 50, border: 'none', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Arial, sans-serif',
              }}
            >Asset öffnen</button>
            <button
              onClick={() => router.push('/assets')}
              style={{
                backgroundColor: 'white', color: '#003366', padding: '12px 24px',
                borderRadius: 50, border: '1px solid #c8d4e8', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Arial, sans-serif',
              }}
            >Zur Übersicht</button>
          </div>
        </div>
      )
    }

    // Step 0: Basisdaten
    if (step === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Bezeichnung *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              style={inputStyle} placeholder="z.B. Bohrkrone PDC 125mm" autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Artikelnummer</label>
              <input value={articleNumber} onChange={e => setArticleNumber(e.target.value)}
                style={inputStyle} placeholder="ART-001" />
            </div>
            <div>
              <label style={labelStyle}>Seriennummer</label>
              <input value={serialNumber} onChange={e => setSerialNumber(e.target.value)}
                style={inputStyle} placeholder="SN-12345" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Bestellnummer</label>
              <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)}
                style={inputStyle} placeholder="ORD-2024-001" />
            </div>
            <div>
              <label style={labelStyle}>Kategorie</label>
              <input value={category} onChange={e => setCategory(e.target.value)}
                style={inputStyle} placeholder="z.B. Bohrkronen" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Hersteller</label>
              <input value={manufacturer} onChange={e => setManufacturer(e.target.value)}
                style={inputStyle} placeholder="z.B. Hilti" />
            </div>
            <div>
              <label style={labelStyle}>Standort</label>
              {locations.length > 0
                ? <OrgTreePicker locations={locations} halls={halls} areas={areas} value={locationRef} onChange={setLocationRef} inputStyle={inputStyle} />
                : <input value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} placeholder="z.B. Lager A" />
              }
            </div>
          </div>
          <div>
            <label style={labelStyle}>Beschreibung</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} style={{ ...inputStyle, resize: 'none' }}
              placeholder="Optionale Beschreibung…" />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { value: 'active', label: 'Aktiv', color: '#27AE60' },
                { value: 'in_service', label: 'In Wartung', color: '#F39C12' },
                { value: 'decommissioned', label: 'Außer Betrieb', color: '#666666' },
              ] as const).map(s => (
                <button key={s.value} type="button" onClick={() => setStatus(s.value)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none',
                    cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'Arial, sans-serif',
                    backgroundColor: status === s.value ? `${s.color}20` : '#f4f6f9',
                    color: status === s.value ? s.color : '#666',
                    outline: status === s.value ? `2px solid ${s.color}` : 'none',
                  }}
                >{s.label}</button>
              ))}
            </div>
          </div>
        </div>
      )
    }

    // Step 1: Fotos
    if (step === 1) {
      return (
        <div>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 16, fontFamily: 'Arial, sans-serif' }}>
            Bis zu 10 Fotos. Das erste Bild wird als Titelbild verwendet.
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {imagePreviews.map((src, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '1px solid #c8d4e8' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => removeImage(i)} style={{
                  position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
                {i === 0 && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,51,102,0.7)', color: 'white',
                    fontSize: 10, textAlign: 'center', padding: '2px 0',
                    fontFamily: 'Arial, sans-serif', fontWeight: 700,
                  }}>Titelbild</div>
                )}
              </div>
            ))}
            {imageFiles.length < 10 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                aspectRatio: '1', borderRadius: 10, border: '2px dashed #c8d4e8',
                background: '#f4f6f9', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span style={{ fontSize: 11, color: '#96aed2', fontFamily: 'Arial, sans-serif' }}>Foto</span>
              </button>
            )}
          </div>
        </div>
      )
    }

    // Step 2: Technische Daten
    if (step === 2) {
      return (
        <div>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 16, fontFamily: 'Arial, sans-serif' }}>
            Füge technische Kennwerte hinzu (z.B. Gewicht, Leistung, Maße).
          </p>
          {renderDynamicFields(technicalData, setTechnicalData, techFreeKeys, setTechFreeKeys)}
        </div>
      )
    }

    // Step 3: Kommerzielle Daten
    if (step === 3) {
      return (
        <div>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 16, fontFamily: 'Arial, sans-serif' }}>
            Füge kommerzielle Informationen hinzu (z.B. Kaufpreis, Lieferant, Garantie).
          </p>
          {renderDynamicFields(commercialData, setCommercialData, commFreeKeys, setCommFreeKeys)}
        </div>
      )
    }

    // Step 4: QR / NFC
    if (step === 4) {
      return <UuidCopyStep assetId={assetId} />
    }

    return null
  }

  const canProceed = step !== 0 || title.trim().length > 0
  const isLastStep = step === 4

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#000', margin: 0 }}>Neues Asset</h1>
          {step < 5 && (
            <p style={{ fontSize: 12, color: '#96aed2', margin: 0 }}>
              Schritt {step + 1} von {STEPS.length} · {STEPS[step]}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {step < 5 && (
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ height: 4, background: '#f0f4ff', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              background: 'linear-gradient(90deg, #003366, #0099cc)',
              width: `${((step + 1) / STEPS.length) * 100}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {STEPS.map((s, i) => (
              <span key={i} style={{
                fontSize: 9, color: i <= step ? '#003366' : '#c8d4e8',
                fontWeight: i === step ? 700 : 400, fontFamily: 'Arial, sans-serif',
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 16, color: '#dc2626',
            fontSize: 13, fontFamily: 'Arial, sans-serif',
          }}>{error}</div>
        )}
        {renderStep()}
      </div>

      {/* Navigation */}
      {step < 5 && (
        <div style={{ padding: '0 20px 32px', display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} style={{
              flex: 1, padding: '13px', borderRadius: 50,
              border: '1px solid #c8d4e8', background: 'white',
              color: '#003366', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Arial, sans-serif',
            }}>Zurück</button>
          )}

          {!isLastStep && (
            <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canProceed} style={{
              flex: 2, padding: '13px', borderRadius: 50,
              border: 'none', background: canProceed ? '#003366' : '#c8d4e8',
              color: 'white', fontSize: 14, fontWeight: 700,
              cursor: canProceed ? 'pointer' : 'default', fontFamily: 'Arial, sans-serif',
            }}>Weiter</button>
          )}

          {isLastStep && (
            <button type="button" onClick={handleSubmit} disabled={loading} style={{
              flex: 2, padding: '13px', borderRadius: 50,
              border: 'none', background: loading ? '#c8d4e8' : '#003366',
              color: 'white', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer', fontFamily: 'Arial, sans-serif',
            }}>{loading ? 'Wird gespeichert…' : 'Asset speichern ✓'}</button>
          )}
        </div>
      )}
    </div>
  )
}

function UuidCopyStep({ assetId }: { assetId: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(assetId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#f0f4ff', borderRadius: 14, padding: 20, border: '1px solid #c8d4e8' }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: '#003366', margin: '0 0 6px', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Smartphone size={14} /> Asset-UUID
        </p>
        <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px', fontFamily: 'Arial, sans-serif', lineHeight: 1.5 }}>
          Diese UUID wird automatisch für QR-Code <strong>und</strong> NFC-Tag verwendet. Sie kann nicht manuell geändert werden.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <p style={{
            flex: 1, fontSize: 12, color: '#003366', fontFamily: 'monospace', wordBreak: 'break-all',
            background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid #c8d4e8', margin: 0,
          }}>
            {assetId}
          </p>
          <button type="button" onClick={copy} style={{
            flexShrink: 0, padding: '10px 14px', borderRadius: 10,
            border: '1px solid #c8d4e8', background: copied ? '#e8f5e9' : 'white',
            color: copied ? '#2e7d32' : '#003366', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap',
          }}>
            {copied ? '✓ Kopiert' : 'Kopieren'}
          </button>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #c8d4e8' }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: '#000', margin: '0 0 8px', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag size={13} /> NFC-Tag programmieren
        </p>
        <p style={{ fontSize: 12, color: '#666', margin: 0, fontFamily: 'Arial, sans-serif', lineHeight: 1.5 }}>
          Kopiere die UUID oben und schreibe sie auf deinen NFC-Tag – z.B. mit einer NFC-Schreib-App auf dem Smartphone.
        </p>
      </div>
    </div>
  )
}
