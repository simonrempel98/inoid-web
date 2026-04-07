'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AssetImageGallery } from '@/app/(dashboard)/assets/[id]/asset-image-gallery'
import {
  Grid3x3, User, Maximize2, Clock, Wrench,
  FileText, Upload, Trash2, Pencil, X, Check,
  Tag, ChevronRight, Package, ShieldAlert
} from 'lucide-react'
import { getStatusConfig } from '@/lib/asset-statuses'

const PROCESS_TYPES = ['Drucken', 'Schneiden', 'Beschichten', 'Laminieren', 'Stanzen', 'Montage', 'Prüfung / QS', 'Lager', 'Sonstiges']
const SHIFT_MODELS = ['1-Schicht', '2-Schicht', '3-Schicht', 'Gleitzeit', 'Dauerbetrieb']

type Area = {
  id: string; name: string; hall_id: string; organization_id: string
  responsible_name: string | null; process_type: string | null; shift_model: string | null
  area_sqm: number | null; machine_count: number | null
  notes: string | null; image_urls: string[]; document_urls: string[]
  halls: { id: string; name: string; locations: { id: string; name: string } | null } | null
}

type AssetItem = { id: string; title: string; status: string; category: string | null }

export function AreaDetail({ area, assets, customStatuses }: {
  area: Area
  assets: AssetItem[]
  customStatuses: { value: string; label: string; color: string }[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: area.name,
    responsible_name: area.responsible_name ?? '',
    process_type: area.process_type ?? '',
    shift_model: area.shift_model ?? '',
    area_sqm: area.area_sqm?.toString() ?? '',
    machine_count: area.machine_count?.toString() ?? '',
    notes: area.notes ?? '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('areas').update({
      name: form.name,
      responsible_name: form.responsible_name || null,
      process_type: form.process_type || null,
      shift_model: form.shift_model || null,
      area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : null,
      machine_count: form.machine_count ? parseInt(form.machine_count) : null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }).eq('id', area.id)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    setUploadError(null)
    const supabase = createClient()
    const path = `areas/${area.id}/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage.from('org-files').upload(path, file, { upsert: true })
    if (error) {
      setUploadError(`Fehler: ${error.message}`)
    } else if (data) {
      const { data: { publicUrl } } = supabase.storage.from('org-files').getPublicUrl(path)
      const { error: dbError } = await supabase.from('areas').update({ image_urls: [...(area.image_urls ?? []), publicUrl] }).eq('id', area.id)
      if (dbError) setUploadError(`DB-Fehler: ${dbError.message}`)
      else router.refresh()
    }
    setUploading(false)
  }

  async function uploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    setUploadError(null)
    const supabase = createClient()
    const path = `areas/${area.id}/docs/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage.from('org-files').upload(path, file, { upsert: true })
    if (error) {
      setUploadError(`Fehler: ${error.message}`)
    } else if (data) {
      const { data: { publicUrl } } = supabase.storage.from('org-files').getPublicUrl(path)
      const { error: dbError } = await supabase.from('areas').update({ document_urls: [...(area.document_urls ?? []), publicUrl] }).eq('id', area.id)
      if (dbError) setUploadError(`DB-Fehler: ${dbError.message}`)
      else router.refresh()
    }
    setUploading(false)
  }

  async function removeDocument(url: string) {
    const supabase = createClient()
    await supabase.from('areas').update({ document_urls: area.document_urls.filter(u => u !== url) }).eq('id', area.id)
    router.refresh()
  }

  const docName = (url: string) => decodeURIComponent(url.split('/').pop()?.replace(/^\d+_/, '') ?? url)

  const resetForm = () => setForm({
    name: area.name, responsible_name: area.responsible_name ?? '',
    process_type: area.process_type ?? '', shift_model: area.shift_model ?? '',
    area_sqm: area.area_sqm?.toString() ?? '', machine_count: area.machine_count?.toString() ?? '',
    notes: area.notes ?? '',
  })

  // Breadcrumb: Standort > Halle > Bereich
  const locationName = area.halls?.locations?.name
  const locationId = area.halls?.locations?.id
  const hallName = area.halls?.name

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 40 }}>
      {/* Zurück */}
      <div style={{ position: 'sticky', top: 0, height: 0, overflow: 'visible', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 14px 0' }}>
          <Link href="/organisation" style={{
            height: 34, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px 0 8px', textDecoration: 'none',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>Organisation</span>
          </Link>
          <div style={{
            height: 28, borderRadius: 20, backgroundColor: 'rgba(139,92,246,0.75)',
            display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px',
          }}>
            <Grid3x3 size={12} color="white" />
            <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>Bereich</span>
          </div>
        </div>
      </div>

      <AssetImageGallery imageUrls={area.image_urls ?? []} title={area.name} />

      {/* Titel + Breadcrumb */}
      <div style={{ padding: '16px 16px 0' }}>
        {editing ? (
          <input value={form.name} onChange={set('name')} style={{
            fontSize: 22, fontWeight: 700, color: '#000', border: 'none',
            borderBottom: '2px solid #8B5CF6', outline: 'none', width: '100%',
            background: 'transparent', marginBottom: 8, fontFamily: 'Arial, sans-serif',
          }} />
        ) : (
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000', margin: '0 0 4px' }}>{area.name}</h1>
        )}
        {!editing && (locationName || hallName) && (
          <p style={{ color: '#888', fontSize: 12, margin: '0 0 8px' }}>
            {[locationName, hallName].filter(Boolean).join(' › ')}
          </p>
        )}
        {!editing && area.process_type && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: '#e8eef6', color: '#003366' }}>
              {area.process_type}
            </span>
          </div>
        )}
      </div>

      {/* Info-Karten */}
      {!editing && (
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {area.responsible_name && <InfoCard icon={<User size={14} />} label="Verantwortlicher" value={area.responsible_name} />}
          {area.shift_model && <InfoCard icon={<Clock size={14} />} label="Schichtmodell" value={area.shift_model} />}
          {area.area_sqm && <InfoCard icon={<Maximize2 size={14} />} label="Fläche" value={`${area.area_sqm.toLocaleString('de-DE')} m²`} />}
          {area.machine_count != null && <InfoCard icon={<Wrench size={14} />} label="Maschinen" value={`${area.machine_count}`} />}
        </div>
      )}

      {/* Edit-Formular */}
      {editing && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '12px 14px' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 3 }}>Prozesstyp</label>
              <select value={form.process_type} onChange={set('process_type')} style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent' }}>
                <option value="">– Auswählen –</option>
                {PROCESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ height: 1, background: '#c8d4e8' }} />
            <div style={{ padding: '12px 14px' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 3 }}>Schichtmodell</label>
              <select value={form.shift_model} onChange={set('shift_model')} style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent' }}>
                <option value="">– Auswählen –</option>
                {SHIFT_MODELS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {[
              { k: 'responsible_name', label: 'Verantwortlicher', placeholder: 'Max Mustermann' },
              { k: 'area_sqm', label: 'Fläche (m²)', placeholder: '350' },
              { k: 'machine_count', label: 'Anzahl Maschinen/Anlagen', placeholder: '4' },
            ].map(f => (
              <div key={f.k}>
                <div style={{ height: 1, background: '#c8d4e8' }} />
                <div style={{ padding: '12px 14px' }}>
                  <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 3 }}>{f.label}</label>
                  <input value={(form as Record<string, string>)[f.k]} onChange={set(f.k)} placeholder={f.placeholder}
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent' }} />
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: '#c8d4e8' }} />
            <div style={{ padding: '12px 14px' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 3 }}>Notizen / Sicherheitshinweise</label>
              <textarea value={form.notes} onChange={set('notes')} rows={4}
                placeholder="z.B. PSA erforderlich, Lärmschutz, Zutrittsregelung…"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent', resize: 'vertical' }} />
            </div>
          </div>
        </div>
      )}

      {/* Notizen */}
      {!editing && area.notes && (
        <div style={{ padding: '0 16px 16px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={14} /> Hinweise & Notizen
          </h2>
          <div style={{ background: 'white', borderRadius: 12, padding: '14px', border: '1px solid #c8d4e8' }}>
            <p style={{ fontSize: 14, color: '#444', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{area.notes}</p>
          </div>
        </div>
      )}

      {/* Assets in diesem Bereich */}
      {!editing && (
        <div style={{ padding: '0 16px 16px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={14} /> Assets
            <span style={{ fontSize: 12, fontWeight: 400, color: '#96aed2', marginLeft: 4 }}>{assets.length}</span>
          </h2>
          {assets.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 12, padding: '20px 16px', border: '1px solid #e8eef6', textAlign: 'center' }}>
              <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>Noch keine Assets in diesem Bereich</p>
            </div>
          ) : (
            <div>
              {assets.map(a => {
                const sc = getStatusConfig(a.status, customStatuses)
                return (
                  <Link key={a.id} href={`/assets/${a.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'white', borderRadius: 10, padding: '10px 14px',
                      border: '1px solid #e8eef6', marginBottom: 6,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#000',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.title}
                        </p>
                        {a.category && (
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#96aed2', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Tag size={10} /> {a.category}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          backgroundColor: sc.color, color: 'white',
                        }}>{sc.label}</span>
                        <ChevronRight size={14} color="#c8d4e8" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Typische Dokumente für Bereiche */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={14} /> Dokumente
          </h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13, color: '#0099cc', fontWeight: 600 }}>
            <Upload size={13} /> {uploading ? 'Lädt…' : 'Hochladen'}
            <input type="file" style={{ display: 'none' }} onChange={uploadDocument} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.dwg" />
          </label>
        </div>

        {/* Hinweis auf typische Dokumente */}
        {(area.document_urls ?? []).length === 0 && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ color: '#aaa', fontSize: 12, margin: '0 0 6px' }}>Typische Dokumente für diesen Bereich:</p>
            {['Risikobeurteilung', 'Betriebsanweisung', 'Prüfprotokoll', 'Hallenlayout / Maschinenaufstellung', 'Gefährdungsbeurteilung', 'Wartungsplan'].map(d => (
              <span key={d} style={{ display: 'inline-block', fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#f4f6f9', color: '#888', border: '1px solid #c8d4e8', margin: '0 4px 4px 0' }}>
                {d}
              </span>
            ))}
          </div>
        )}

        {(area.document_urls ?? []).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {area.document_urls.map(url => (
              <div key={url} style={{ background: 'white', borderRadius: 10, padding: '10px 14px', border: '1px solid #c8d4e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#003366', fontSize: 13, flex: 1, minWidth: 0 }}>
                  <FileText size={14} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docName(url)}</span>
                </a>
                <button onClick={() => removeDocument(url)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0ccda', padding: 4, display: 'flex' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bild hochladen */}
      <div style={{ padding: '0 16px 20px' }}>
        {uploadError && (
          <p style={{ color: '#E74C3C', fontSize: 12, marginBottom: 8, background: '#fff5f5', border: '1px solid #fcc', borderRadius: 8, padding: '8px 12px', margin: '0 0 8px' }}>
            {uploadError}
          </p>
        )}
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '2px dashed #c8d4e8', borderRadius: 12, padding: '14px', cursor: 'pointer', fontSize: 13, color: '#96aed2', background: 'white' }}>
          <Upload size={15} /> {uploading ? 'Lädt hoch…' : 'Bild hinzufügen'}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadImage} />
        </label>
      </div>

      {/* Aktionen */}
      <div style={{ padding: '0 16px', display: 'flex', gap: 10 }}>
        {editing ? (
          <>
            <button onClick={() => { setEditing(false); resetForm() }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'white', color: '#003366', padding: '13px', borderRadius: 50, border: '2px solid #003366', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <X size={15} /> Abbrechen
            </button>
            <button onClick={save} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#003366', color: 'white', padding: '13px', borderRadius: 50, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              <Check size={15} /> Speichern
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#003366', color: 'white', padding: '13px', borderRadius: 50, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <Pencil size={15} /> Bearbeiten
          </button>
        )}
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '12px 14px', border: '1px solid #c8d4e8' }}>
      <p style={{ fontSize: 11, color: '#96aed2', margin: '0 0 3px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>{icon} {label}</p>
      <p style={{ fontSize: 13, color: '#000', margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
    </div>
  )
}
