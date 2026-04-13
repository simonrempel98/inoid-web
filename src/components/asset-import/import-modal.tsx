'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { enhanceImage, fileToBase64ForApi } from '@/lib/enhance-image'
import { X, Upload, Loader2, CheckCircle2, AlertCircle, FileText, Image as ImageIcon, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type FileEntry = {
  file: File
  preview?: string   // data-URL for images
  enhanced?: File    // enhanced version
  isImage: boolean
}

type ExtractedData = {
  title: string | null
  manufacturer: string | null
  article_number: string | null
  serial_number: string | null
  description: string | null
  category: string | null
  technical_data: Record<string, string>
  commercial_data: Record<string, string>
}

type Step = 'upload' | 'analyzing' | 'review'

// ── Component ────────────────────────────────────────────────────────────────

export function AssetImportModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const dropRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [dragging, setDragging] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Review step
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editManufacturer, setEditManufacturer] = useState('')
  const [editArticleNumber, setEditArticleNumber] = useState('')
  const [editSerialNumber, setEditSerialNumber] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editTechData, setEditTechData] = useState<Record<string, string>>({})
  const [editCommData, setEditCommData] = useState<Record<string, string>>({})
  const [showTechData, setShowTechData] = useState(true)
  const [showCommData, setShowCommData] = useState(true)

  // ── File handling ──────────────────────────────────────────────────────────

  const addFiles = useCallback(async (incoming: File[]) => {
    const allowed = incoming.filter(f =>
      f.type.startsWith('image/') ||
      f.type === 'application/pdf'
    )
    if (!allowed.length) return

    setEnhancing(true)
    const entries: FileEntry[] = await Promise.all(allowed.map(async f => {
      const isImage = f.type.startsWith('image/')
      if (!isImage) {
        return { file: f, isImage: false }
      }
      // Auto-enhance document images
      const enhanced = await enhanceImage(f, 'document').catch(() => f)
      const preview = await new Promise<string>(res => {
        const reader = new FileReader()
        reader.onload = e => res(e.target?.result as string)
        reader.readAsDataURL(enhanced)
      })
      return { file: f, preview, enhanced, isImage: true }
    }))
    setEnhancing(false)
    setFiles(prev => [...prev, ...entries].slice(0, 10))
  }, [])

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ''
    addFiles(selected)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // ── AI extraction ──────────────────────────────────────────────────────────

  async function runExtraction() {
    if (!files.length) return
    setError(null)
    setStep('analyzing')

    try {
      const apiFiles = await Promise.all(files.map(async entry => {
        const sourceFile = entry.enhanced ?? entry.file
        const { base64, mediaType } = await fileToBase64ForApi(sourceFile, 1200)
        return { base64, mediaType, name: entry.file.name }
      }))

      const res = await fetch('/api/assets/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: apiFiles }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Extraktion fehlgeschlagen')
      }

      const { data } = await res.json()
      setExtracted(data)
      setEditTitle(data.title ?? '')
      setEditManufacturer(data.manufacturer ?? '')
      setEditArticleNumber(data.article_number ?? '')
      setEditSerialNumber(data.serial_number ?? '')
      setEditDescription(data.description ?? '')
      setEditCategory(data.category ?? '')
      setEditTechData(data.technical_data ?? {})
      setEditCommData(data.commercial_data ?? {})
      setStep('review')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Extraktion fehlgeschlagen')
      setStep('upload')
    }
  }

  // ── Asset creation ─────────────────────────────────────────────────────────

  async function handleCreate() {
    setSaving(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht angemeldet')

      const { data: profile } = await supabase
        .from('profiles').select('organization_id').eq('id', user.id).single()
      if (!profile?.organization_id) throw new Error('Keine Organisation gefunden')

      const assetId = crypto.randomUUID()

      // Upload images
      const imageFiles = files.filter(f => f.isImage)
      const imageUrls: string[] = []
      for (const entry of imageFiles) {
        const f = entry.enhanced ?? entry.file
        const ext = f.name.split('.').pop() ?? 'jpg'
        const path = `assets/${assetId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from('asset-images').upload(path, f)
        if (upErr) throw new Error('Bild-Upload fehlgeschlagen: ' + upErr.message)
        const { data } = supabase.storage.from('asset-images').getPublicUrl(path)
        imageUrls.push(data.publicUrl)
      }

      // Upload docs
      const docFiles = files.filter(f => !f.isImage)
      const docUrls: string[] = []
      for (const entry of docFiles) {
        const f = entry.file
        const safeName = f.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const path = `assets/${assetId}/docs/${Date.now()}_${safeName}`
        const { error: upErr } = await supabase.storage.from('org-files').upload(path, f, { upsert: true })
        if (upErr) throw new Error('Dokument-Upload fehlgeschlagen: ' + upErr.message)
        const { data } = supabase.storage.from('org-files').getPublicUrl(path)
        docUrls.push(data.publicUrl)
      }

      // QR Code
      let qrUrl = `https://inoid.app/assets/${assetId}`
      try {
        const QRCode = (await import('qrcode')).default
        qrUrl = await QRCode.toDataURL(qrUrl, { width: 240, margin: 2, color: { dark: '#003366', light: '#ffffff' } })
      } catch { /* ignore */ }

      // Insert asset
      const { error: insertErr } = await supabase.from('assets').insert({
        id: assetId,
        organization_id: profile.organization_id,
        title: editTitle || 'Unbekanntes Asset',
        manufacturer: editManufacturer || null,
        article_number: editArticleNumber || null,
        serial_number: editSerialNumber || null,
        category: editCategory || null,
        description: editDescription || null,
        status: 'active',
        technical_data: editTechData,
        commercial_data: editCommData,
        image_urls: imageUrls.length ? imageUrls : null,
        document_urls: docUrls.length ? docUrls : null,
        qr_code: qrUrl,
        nfc_uid: assetId,
        created_by: user.id,
      })
      if (insertErr) throw new Error(insertErr.message)

      router.push(`/assets/${assetId}`)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'white', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 600,
        maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid #e8edf4',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <Sparkles size={18} style={{ color: '#003366' }} />
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#000', margin: 0 }}>
                KI-Import
              </h2>
            </div>
            <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
              {step === 'upload' && 'Fotos oder Dokumente hochladen – KI erkennt die Daten automatisch'}
              {step === 'analyzing' && 'KI analysiert deine Dokumente…'}
              {step === 'review' && 'Erkannte Daten prüfen und Asset anlegen'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#666', borderRadius: 8 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['upload', 'analyzing', 'review'] as Step[]).map((s, i) => {
              const labels = ['Hochladen', 'Analysieren', 'Prüfen & Anlegen']
              const active = step === s
              const done = (step === 'analyzing' && i === 0) || (step === 'review' && i <= 1)
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    background: done ? '#003366' : active ? '#003366' : '#e8edf4',
                    color: done || active ? 'white' : '#999',
                  }}>
                    {done ? <CheckCircle2 size={13} /> : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? '#003366' : done ? '#003366' : '#999' }}>
                    {labels[i]}
                  </span>
                  {i < 2 && <div style={{ flex: 1, height: 1, background: done ? '#003366' : '#e8edf4', marginLeft: 4 }} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* ── Step: Upload ── */}
          {step === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Drop zone */}
              <div
                ref={dropRef}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragging ? '#003366' : '#c8d4e8'}`,
                  borderRadius: 14, padding: '28px 20px', textAlign: 'center',
                  cursor: 'pointer', background: dragging ? '#f0f4fa' : '#f8fafc',
                  transition: 'all 0.15s',
                }}
              >
                {enhancing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Loader2 size={28} style={{ color: '#003366', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Bild wird optimiert…</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Upload size={28} style={{ color: '#003366', opacity: 0.7 }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#003366', margin: 0 }}>
                      Fotos oder Dokumente hochladen
                    </p>
                    <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
                      Typenschild, Rechnung, Lieferschein, Handbuch · JPG, PNG, PDF
                    </p>
                    <div style={{
                      marginTop: 4, padding: '6px 16px',
                      background: '#003366', color: 'white',
                      borderRadius: 50, fontSize: 12, fontWeight: 700,
                    }}>
                      Dateien auswählen
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />

              {/* Tip */}
              <div style={{
                background: '#f0f4fa', borderRadius: 10, padding: '10px 14px',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <Sparkles size={15} style={{ color: '#003366', marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.5 }}>
                  <strong>Tipp:</strong> Bilder werden automatisch wie ein Scanner aufbereitet (Kontrast, Schärfe). Die KI erkennt dann Hersteller, Artikelnummern, technische Daten und vieles mehr.
                </p>
              </div>

              {/* File previews */}
              {files.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#000', margin: 0 }}>
                    {files.length} Datei{files.length !== 1 ? 'en' : ''} bereit
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {files.map((entry, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #c8d4e8', aspectRatio: '4/3' }}>
                        {entry.isImage && entry.preview ? (
                          <img src={entry.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            background: '#f0f4fa', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 4,
                          }}>
                            <FileText size={24} style={{ color: '#003366', opacity: 0.7 }} />
                            <span style={{ fontSize: 10, color: '#666', textAlign: 'center', padding: '0 4px',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                              {entry.file.name}
                            </span>
                          </div>
                        )}
                        {/* Enhanced badge */}
                        {entry.enhanced && (
                          <div style={{
                            position: 'absolute', bottom: 4, left: 4,
                            background: 'rgba(0,51,102,0.85)', color: 'white',
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                            display: 'flex', alignItems: 'center', gap: 3,
                          }}>
                            <Sparkles size={8} /> Optimiert
                          </div>
                        )}
                        {/* Remove */}
                        <button
                          onClick={() => removeFile(i)}
                          style={{
                            position: 'absolute', top: 4, right: 4,
                            background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                            width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'white',
                          }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step: Analyzing ── */}
          {step === 'analyzing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 20 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #003366, #0066cc)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={28} style={{ color: 'white' }} />
                </div>
                <div style={{
                  position: 'absolute', inset: -4,
                  borderRadius: '50%', border: '3px solid transparent',
                  borderTopColor: '#003366',
                  animation: 'spin 1s linear infinite',
                }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#000', margin: '0 0 6px' }}>
                  KI analysiert deine Dokumente
                </p>
                <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.5 }}>
                  Hersteller, Artikelnummern, technische Daten<br />und kaufmännische Informationen werden erkannt…
                </p>
              </div>
              {/* File count */}
              <div style={{ display: 'flex', gap: 8 }}>
                {files.map((entry, i) => (
                  <div key={i} style={{
                    width: 36, height: 36, borderRadius: 8,
                    overflow: 'hidden', border: '2px solid #003366',
                  }}>
                    {entry.preview ? (
                      <img src={entry.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#f0f4fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={16} style={{ color: '#003366' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step: Review ── */}
          {step === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Success banner */}
              <div style={{
                background: '#f0fdf4', border: '1px solid #86efac',
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#16a34a', margin: 0, fontWeight: 600 }}>
                  Daten erfolgreich erkannt – bitte prüfen und ggf. anpassen
                </p>
              </div>

              {/* Base fields */}
              <FieldGroup label="Gerät">
                <LabeledInput label="Bezeichnung *" value={editTitle} onChange={setEditTitle} />
                <LabeledInput label="Hersteller" value={editManufacturer} onChange={setEditManufacturer} />
                <LabeledInput label="Artikelnummer" value={editArticleNumber} onChange={setEditArticleNumber} />
                <LabeledInput label="Seriennummer" value={editSerialNumber} onChange={setEditSerialNumber} />
                <LabeledInput label="Kategorie" value={editCategory} onChange={setEditCategory} />
                <LabeledInput label="Beschreibung" value={editDescription} onChange={setEditDescription} multiline />
              </FieldGroup>

              {/* Technical data */}
              {Object.keys(editTechData).length > 0 && (
                <div style={{ border: '1px solid #e8edf4', borderRadius: 12, overflow: 'hidden' }}>
                  <button
                    onClick={() => setShowTechData(p => !p)}
                    style={{
                      width: '100%', background: '#f8fafc', border: 'none',
                      padding: '10px 14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#000' }}>
                      Technische Daten ({Object.keys(editTechData).length})
                    </span>
                    {showTechData ? <ChevronUp size={16} style={{ color: '#666' }} /> : <ChevronDown size={16} style={{ color: '#666' }} />}
                  </button>
                  {showTechData && (
                    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(editTechData).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#666', minWidth: 120, flexShrink: 0 }}>{key}</span>
                          <input
                            value={val}
                            onChange={e => setEditTechData(prev => ({ ...prev, [key]: e.target.value }))}
                            style={{
                              flex: 1, border: '1px solid #c8d4e8', borderRadius: 6,
                              padding: '5px 8px', fontSize: 13, color: '#000',
                              background: 'white', outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => setEditTechData(prev => { const d = { ...prev }; delete d[key]; return d })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 2 }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Commercial data */}
              {Object.keys(editCommData).length > 0 && (
                <div style={{ border: '1px solid #e8edf4', borderRadius: 12, overflow: 'hidden' }}>
                  <button
                    onClick={() => setShowCommData(p => !p)}
                    style={{
                      width: '100%', background: '#f8fafc', border: 'none',
                      padding: '10px 14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#000' }}>
                      Kaufmännische Daten ({Object.keys(editCommData).length})
                    </span>
                    {showCommData ? <ChevronUp size={16} style={{ color: '#666' }} /> : <ChevronDown size={16} style={{ color: '#666' }} />}
                  </button>
                  {showCommData && (
                    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(editCommData).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#666', minWidth: 120, flexShrink: 0 }}>{key}</span>
                          <input
                            value={val}
                            onChange={e => setEditCommData(prev => ({ ...prev, [key]: e.target.value }))}
                            style={{
                              flex: 1, border: '1px solid #c8d4e8', borderRadius: 6,
                              padding: '5px 8px', fontSize: 13, color: '#000',
                              background: 'white', outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => setEditCommData(prev => { const d = { ...prev }; delete d[key]; return d })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 2 }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Uploaded files summary */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: '0 0 6px' }}>
                  Hochgeladene Dateien ({files.length})
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {files.map((entry, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'white', border: '1px solid #c8d4e8',
                      borderRadius: 6, padding: '3px 8px',
                    }}>
                      {entry.isImage ? <ImageIcon size={11} style={{ color: '#003366' }} /> : <FileText size={11} style={{ color: '#003366' }} />}
                      <span style={{ fontSize: 11, color: '#333', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.file.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #e8edf4',
          display: 'flex', gap: 10, flexShrink: 0,
          background: 'white',
        }}>
          {step === 'upload' && (
            <>
              <button onClick={onClose} style={secondaryBtnStyle}>
                Abbrechen
              </button>
              <button
                onClick={runExtraction}
                disabled={files.length === 0 || enhancing}
                style={{ ...primaryBtnStyle, opacity: files.length === 0 || enhancing ? 0.5 : 1 }}
              >
                <Sparkles size={15} />
                KI analysieren
              </button>
            </>
          )}
          {step === 'analyzing' && (
            <button disabled style={{ ...primaryBtnStyle, opacity: 0.6, flex: 1 }}>
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              Analysiere…
            </button>
          )}
          {step === 'review' && (
            <>
              <button onClick={() => setStep('upload')} style={secondaryBtnStyle}>
                Zurück
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !editTitle.trim()}
                style={{ ...primaryBtnStyle, opacity: saving || !editTitle.trim() ? 0.5 : 1 }}
              >
                {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={15} />}
                Asset anlegen
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #e8edf4', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ background: '#f8fafc', padding: '8px 14px', borderBottom: '1px solid #e8edf4' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#000' }}>{label}</span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

function LabeledInput({
  label, value, onChange, multiline = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}) {
  const sharedStyle = {
    border: '1px solid #c8d4e8', borderRadius: 8,
    padding: '7px 10px', fontSize: 13, color: '#000',
    background: 'white', outline: 'none', width: '100%',
    boxSizing: 'border-box' as const,
    fontFamily: 'Arial, sans-serif',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={2}
          style={{ ...sharedStyle, resize: 'vertical' }}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          style={sharedStyle}
        />
      )}
    </div>
  )
}

const primaryBtnStyle: React.CSSProperties = {
  flex: 1, background: '#003366', color: 'white',
  border: 'none', borderRadius: 50, padding: '12px 20px',
  fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
}

const secondaryBtnStyle: React.CSSProperties = {
  background: 'white', color: '#333',
  border: '1px solid #c8d4e8', borderRadius: 50, padding: '12px 20px',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
}
