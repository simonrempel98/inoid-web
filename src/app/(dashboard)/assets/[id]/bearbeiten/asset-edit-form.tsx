'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Settings2, Briefcase, Camera, Smartphone, Tag } from 'lucide-react'
import { OrgTreePicker, getOrgRefLabel, type OrgLocation, type OrgHall, type OrgArea } from '@/components/org-tree-picker'
import { CategoryCombobox } from '@/components/category-combobox'
import { compressImage } from '@/lib/compress-image'
import { CompressionInfo } from '@/components/compression-info'

type Asset = {
  id: string
  title: string
  article_number: string | null
  serial_number: string | null
  order_number: string | null
  category: string | null
  manufacturer: string | null
  location: string | null
  location_ref: string | null
  description: string | null
  status: string
  technical_data: Record<string, string> | null
  commercial_data: Record<string, string> | null
  nfc_uid: string | null
  image_urls: string[] | null
  qr_code: string | null
}

export function AssetEditForm({ asset, locations = [], halls = [], areas = [], categories = [] }: {
  asset: Asset
  locations?: OrgLocation[]
  halls?: OrgHall[]
  areas?: OrgArea[]
  categories?: string[]
}) {
  const t = useTranslations()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const qrUrl = `https://inoid.app/assets/${asset.id}`

  const [existingUrls, setExistingUrls] = useState<string[]>(asset.image_urls ?? [])
  const [removedUrls, setRemovedUrls] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [compressionStats, setCompressionStats] = useState<{ name: string; originalSize: number; compressedSize: number }[]>([])
  const [compressing, setCompressing] = useState(false)

  const [uuidCopied, setUuidCopied] = useState(false)
  function copyUuid() {
    navigator.clipboard.writeText(asset.id)
    setUuidCopied(true)
    setTimeout(() => setUuidCopied(false), 2000)
  }

  const [title, setTitle] = useState(asset.title)
  const [articleNumber, setArticleNumber] = useState(asset.article_number ?? '')
  const [serialNumber, setSerialNumber] = useState(asset.serial_number ?? '')
  const [orderNumber, setOrderNumber] = useState(asset.order_number ?? '')
  const [category, setCategory] = useState(asset.category ?? '')
  const [manufacturer, setManufacturer] = useState(asset.manufacturer ?? '')
  const [location, setLocation] = useState(asset.location ?? '')
  const [locationRef, setLocationRef] = useState(asset.location_ref ?? '')
  const [description, setDescription] = useState(asset.description ?? '')
  const [status, setStatus] = useState(asset.status as 'active' | 'in_service' | 'decommissioned')

  const [techEntries, setTechEntries] = useState<[string, string][]>(
    Object.entries(asset.technical_data ?? {})
  )
  const [commEntries, setCommEntries] = useState<[string, string][]>(
    Object.entries(asset.commercial_data ?? {})
  )

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = 10 - existingUrls.length - newFiles.length
    const toAdd = files.slice(0, remaining)
    if (toAdd.length === 0) return
    e.target.value = ''

    setCompressing(true)
    const results = await Promise.all(toAdd.map(f => compressImage(f)))
    const compressed = results.map(r => r.file)
    const newStats = results.map((r, i) => ({ name: toAdd[i].name, originalSize: r.originalSize, compressedSize: r.compressedSize }))

    setNewFiles(prev => [...prev, ...compressed])
    setCompressionStats(prev => [...prev, ...newStats])
    compressed.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setNewPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
    setCompressing(false)
  }

  function removeExisting(url: string) {
    setExistingUrls(prev => prev.filter(u => u !== url))
    setRemovedUrls(prev => [...prev, url])
  }

  function removeNew(index: number) {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
    setNewPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadNewImages(): Promise<string[]> {
    const urls: string[] = []
    for (const file of newFiles) {
      const ext = file.name.split('.').pop()
      const path = `${asset.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('asset-images').upload(path, file)
      if (error) throw new Error(t('assets.form.uploadFailed') + ': ' + error.message)
      const { data } = supabase.storage.from('asset-images').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  async function handleSave() {
    if (!title.trim()) { setError(t('assets.form.nameEmpty')); return }
    setLoading(true)
    setError(null)
    try {
      const techData = Object.fromEntries(techEntries.filter(([k]) => k.trim()))
      const commData = Object.fromEntries(commEntries.filter(([k]) => k.trim()))

      const uploadedUrls = await uploadNewImages()
      const finalImageUrls = [...existingUrls, ...uploadedUrls]

      const { error: updateError } = await supabase
        .from('assets')
        .update({
          title: title.trim(),
          article_number: articleNumber.trim() || null,
          serial_number: serialNumber.trim() || null,
          order_number: orderNumber.trim() || null,
          category: category.trim() || null,
          manufacturer: manufacturer.trim() || null,
          location: getOrgRefLabel(locationRef, locations, halls, areas) || location.trim() || null,
          location_ref: locationRef || null,
          description: description.trim() || null,
          status,
          technical_data: techData,
          commercial_data: commData,
          nfc_uid: asset.id,
          qr_code: qrUrl,
          image_urls: finalImageUrls,
        })
        .eq('id', asset.id)

      if (updateError) throw new Error(updateError.message)

      // Entfernte Bilder aus Storage löschen (best effort)
      if (removedUrls.length > 0) {
        const paths = removedUrls.map(url => {
          const match = url.match(/\/asset-images\/(.+)$/)
          return match ? match[1] : null
        }).filter((p): p is string => p !== null)
        if (paths.length > 0) {
          await supabase.storage.from('asset-images').remove(paths)
        }
      }

      router.push(`/assets/${asset.id}`)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('assets.form.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/assets/${asset.id}/delete`, { method: 'DELETE' })
    if (!res.ok) {
      setError(t('assets.form.deleteFailed'))
      setLoading(false)
      return
    }
    router.push('/assets')
    router.refresh()
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
  const sectionStyle: React.CSSProperties = {
    background: 'white', borderRadius: 14, padding: 16,
    border: '1px solid #c8d4e8', display: 'flex', flexDirection: 'column', gap: 14,
  }
  const sectionTitle: React.CSSProperties = {
    fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 4px', fontFamily: 'Arial, sans-serif',
  }

  const STATUS_OPTIONS = [
    { value: 'active' as const, color: '#27AE60' },
    { value: 'in_service' as const, color: '#F39C12' },
    { value: 'decommissioned' as const, color: '#666666' },
  ]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#000', margin: 0 }}>{t('assets.form.editAsset')}</h1>
          <p style={{ fontSize: 12, color: '#96aed2', margin: 0 }}>{asset.title}</p>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', color: '#dc2626', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* ─ Basisdaten ─ */}
        <div style={sectionStyle}>
          <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardList size={15} /> {t('assets.form.steps.basisdaten')}</p>
          <div>
            <label style={labelStyle}>{t('assets.form.nameRequired')}</label>
            <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>{t('assets.form.articleNumber')}</label>
              <input value={articleNumber} onChange={e => setArticleNumber(e.target.value)} style={inputStyle} placeholder="WZ-2024-001" />
            </div>
            <div>
              <label style={labelStyle}>{t('assets.form.serialNumber')}</label>
              <input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} style={inputStyle} placeholder="INO-SN-2024-001" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>{t('assets.form.orderNumber')}</label>
              <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('assets.form.category')}</label>
              <CategoryCombobox value={category} onChange={setCategory} categories={categories} inputStyle={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>{t('assets.form.manufacturer')}</label>
              <input value={manufacturer} onChange={e => setManufacturer(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('assets.form.location')}</label>
              {locations.length > 0
                ? <OrgTreePicker locations={locations} halls={halls} areas={areas} value={locationRef} onChange={setLocationRef} inputStyle={inputStyle} />
                : <input value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} placeholder={t('assets.form.locationPlaceholder')} />
              }
            </div>
          </div>
          <div>
            <label style={labelStyle}>{t('assets.form.description')}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} style={{ ...inputStyle, resize: 'none' }} />
          </div>
          <div>
            <label style={labelStyle}>{t('assets.form.status')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUS_OPTIONS.map(s => (
                <button key={s.value} type="button" onClick={() => setStatus(s.value)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none',
                    cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'Arial, sans-serif',
                    backgroundColor: status === s.value ? `${s.color}20` : '#f4f6f9',
                    color: status === s.value ? s.color : '#666',
                    outline: status === s.value ? `2px solid ${s.color}` : 'none',
                  }}>
                  {s.value === 'decommissioned' ? t('assets.form.statusDecommissioned') : t(`assetStatus.${s.value}` as any)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─ Technische Daten ─ */}
        <div style={sectionStyle}>
          <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 6 }}><Settings2 size={15} /> {t('assets.form.techSection')}</p>
          {techEntries.map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input value={k} onChange={e => {
                const updated = [...techEntries]
                updated[i] = [e.target.value, updated[i][1]]
                setTechEntries(updated)
              }} style={{ ...inputStyle, flex: 1 }} placeholder={t('assets.form.fieldName')} />
              <input value={v} onChange={e => {
                const updated = [...techEntries]
                updated[i] = [updated[i][0], e.target.value]
                setTechEntries(updated)
              }} style={{ ...inputStyle, flex: 1 }} placeholder={t('assets.form.fieldValue')} />
              <button type="button" onClick={() => setTechEntries(techEntries.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 20 }}>
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setTechEntries([...techEntries, ['', '']])}
            style={{ border: '1px dashed #c8d4e8', background: 'none', borderRadius: 10, padding: '8px 16px', color: '#003366', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            {t('assets.form.addField')}
          </button>
        </div>

        {/* ─ Kommerzielle Daten ─ */}
        <div style={sectionStyle}>
          <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 6 }}><Briefcase size={15} /> {t('assets.form.commSection')}</p>
          {commEntries.map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input value={k} onChange={e => {
                const updated = [...commEntries]
                updated[i] = [e.target.value, updated[i][1]]
                setCommEntries(updated)
              }} style={{ ...inputStyle, flex: 1 }} placeholder={t('assets.form.fieldName')} />
              <input value={v} onChange={e => {
                const updated = [...commEntries]
                updated[i] = [updated[i][0], e.target.value]
                setCommEntries(updated)
              }} style={{ ...inputStyle, flex: 1 }} placeholder={t('assets.form.fieldValue')} />
              <button type="button" onClick={() => setCommEntries(commEntries.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 20 }}>
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setCommEntries([...commEntries, ['', '']])}
            style={{ border: '1px dashed #c8d4e8', background: 'none', borderRadius: 10, padding: '8px 16px', color: '#003366', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            {t('assets.form.addField')}
          </button>
        </div>

        {/* ─ Fotos ─ */}
        <div style={sectionStyle}>
          <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 6 }}><Camera size={15} /> {t('assets.form.steps.fotos')}</p>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {existingUrls.map((url, i) => (
              <div key={url} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '1px solid #c8d4e8' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {i === 0 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,51,102,0.7)', color: 'white', fontSize: 10, textAlign: 'center', padding: '2px 0', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>
                    {t('assets.form.coverPhoto')}
                  </div>
                )}
                <button type="button" onClick={() => removeExisting(url)}
                  style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(220,38,38,0.85)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  ×
                </button>
              </div>
            ))}

            {newPreviews.map((src, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '2px dashed #0099cc' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 4, left: 4, background: '#0099cc', color: 'white', fontSize: 9, padding: '2px 6px', borderRadius: 6, fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>NEU</div>
                <button type="button" onClick={() => removeNew(i)}
                  style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(220,38,38,0.85)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  ×
                </button>
              </div>
            ))}

            {existingUrls.length + newFiles.length < 10 && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                style={{ aspectRatio: '1', borderRadius: 10, border: '2px dashed #c8d4e8', background: '#f4f6f9', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span style={{ fontSize: 10, color: '#96aed2', fontFamily: 'Arial, sans-serif' }}>{t('assets.form.photo')}</span>
              </button>
            )}
          </div>

          {compressing && (
            <p style={{ fontSize: 12, color: '#0099cc', margin: '8px 0 0', fontFamily: 'Arial, sans-serif' }}>Wird komprimiert…</p>
          )}
          <CompressionInfo stats={compressionStats} />
          {existingUrls.length + newFiles.length === 0 && (
            <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0', fontFamily: 'Arial, sans-serif' }}>
              {t('assets.form.noPhotos')}
            </p>
          )}
        </div>

        {/* ─ QR-Code ─ */}
        <div style={sectionStyle}>
          <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 6 }}><Smartphone size={15} /> {t('assets.form.qrTitle')}</p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              width: 120, height: 120, borderRadius: 12, border: '1px solid #c8d4e8',
              background: '#f4f6f9', flexShrink: 0, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <QrPreview url={qrUrl} loadingText={t('assets.form.loading')} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <p style={{ fontSize: 11, color: '#96aed2', fontWeight: 700, margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }}>{t('assets.form.qrLink')}</p>
              <p style={{ fontSize: 11, color: '#003366', margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {qrUrl}
              </p>
              <p style={{ fontSize: 11, color: '#999', margin: '8px 0 0', fontFamily: 'Arial, sans-serif' }}>
                {t('assets.form.qrFixed')}
              </p>
            </div>
          </div>
        </div>

        {/* ─ NFC / UUID ─ */}
        <div style={sectionStyle}>
          <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={15} /> {t('assets.form.nfcUuid')}</p>
          <p style={{ fontSize: 12, color: '#666', margin: 0, fontFamily: 'Arial, sans-serif', lineHeight: 1.5 }}>
            {t('assets.form.nfcUuidDesc')}
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <p style={{
              flex: 1, fontSize: 12, color: '#003366', fontFamily: 'monospace', wordBreak: 'break-all',
              background: '#f4f6f9', borderRadius: 8, padding: '10px 12px', border: '1px solid #c8d4e8', margin: 0,
            }}>
              {asset.id}
            </p>
            <button type="button" onClick={copyUuid} style={{
              flexShrink: 0, padding: '10px 14px', borderRadius: 10,
              border: '1px solid #c8d4e8', background: uuidCopied ? '#e8f5e9' : 'white',
              color: uuidCopied ? '#2e7d32' : '#003366', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap',
            }}>
              {uuidCopied ? t('assets.form.copied') : t('assets.form.copy')}
            </button>
          </div>
        </div>

        {/* ─ Speichern ─ */}
        <button type="button" onClick={handleSave} disabled={loading}
          style={{
            padding: '14px', borderRadius: 50, border: 'none',
            background: loading ? '#c8d4e8' : '#003366',
            color: 'white', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer', fontFamily: 'Arial, sans-serif',
          }}>
          {loading ? t('assets.form.saving') : t('assets.form.saveChanges')}
        </button>

        {/* ─ Löschen ─ */}
        <div style={{ borderTop: '1px solid #f4f6f9', paddingTop: 16 }}>
          {!deleteConfirm ? (
            <button type="button" onClick={() => setDeleteConfirm(true)}
              style={{
                width: '100%', padding: '13px', borderRadius: 50,
                border: '1px solid #fecaca', background: 'white',
                color: '#dc2626', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Arial, sans-serif',
              }}>
              {t('assets.form.deleteAsset')}
            </button>
          ) : (
            <div style={{
              background: '#fef2f2', borderRadius: 14, padding: 16,
              border: '1px solid #fecaca', textAlign: 'center',
            }}>
              <p style={{ fontWeight: 700, color: '#dc2626', margin: '0 0 12px', fontSize: 14 }}>
                {t('assets.form.deleteConfirm')}
              </p>
              <p style={{ color: '#666', fontSize: 13, margin: '0 0 16px' }}>
                {t('assets.form.deleteDesc')}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteConfirm(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: 50, border: '1px solid #c8d4e8', background: 'white', color: '#666', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {t('common.cancel')}
                </button>
                <button onClick={handleDelete} disabled={loading}
                  style={{ flex: 1, padding: '11px', borderRadius: 50, border: 'none', background: '#dc2626', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {t('assets.form.yesDelete')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function QrPreview({ url, loadingText }: { url: string; loadingText: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    import('qrcode').then(mod => {
      mod.default.toDataURL(url, { width: 120, margin: 1, color: { dark: '#003366', light: '#ffffff' } })
        .then(setSrc)
    })
  }, [url])
  if (!src) return <span style={{ fontSize: 10, color: '#96aed2', fontFamily: 'Arial, sans-serif' }}>{loadingText}</span>
  return <img src={src} alt="QR" style={{ width: '100%', height: '100%' }} />
}
