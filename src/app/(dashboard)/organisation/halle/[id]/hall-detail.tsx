'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AssetImageGallery } from '@/app/(dashboard)/assets/[id]/asset-image-gallery'
import {
  Building2, Maximize2, ArrowUp, Calendar, Truck,
  Grid3x3, FileText, Upload, Trash2, Pencil, X, Check, User
} from 'lucide-react'

const USAGE_TYPES = ['Produktion', 'Montage', 'Lager', 'Technik', 'Sonstiges']

type Hall = {
  id: string; name: string; location_id: string
  usage_type: string | null; area_sqm: number | null; height_m: number | null
  year_built: number | null; has_crane: boolean | null; crane_capacity_t: number | null
  notes: string | null; image_urls: string[]; document_urls: string[]
  locations: { id: string; name: string } | null
}
type Area = { id: string; name: string; process_type: string | null; machine_count: number | null; responsible_name: string | null }

export function HallDetail({ hall, areas }: { hall: Hall; areas: Area[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    name: hall.name,
    usage_type: hall.usage_type ?? 'Produktion',
    area_sqm: hall.area_sqm?.toString() ?? '',
    height_m: hall.height_m?.toString() ?? '',
    year_built: hall.year_built?.toString() ?? '',
    has_crane: hall.has_crane ?? false,
    crane_capacity_t: hall.crane_capacity_t?.toString() ?? '',
    notes: hall.notes ?? '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('halls').update({
      name: form.name,
      usage_type: form.usage_type || null,
      area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : null,
      height_m: form.height_m ? parseFloat(form.height_m) : null,
      year_built: form.year_built ? parseInt(form.year_built) : null,
      has_crane: form.has_crane,
      crane_capacity_t: form.crane_capacity_t ? parseFloat(form.crane_capacity_t) : null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }).eq('id', hall.id)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const supabase = createClient()
    const path = `halls/${hall.id}/${Date.now()}_${file.name}`
    const { data } = await supabase.storage.from('org-files').upload(path, file, { upsert: true })
    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('org-files').getPublicUrl(path)
      await supabase.from('halls').update({ image_urls: [...(hall.image_urls ?? []), publicUrl] }).eq('id', hall.id)
      router.refresh()
    }
    setUploading(false)
  }

  async function uploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const supabase = createClient()
    const path = `halls/${hall.id}/docs/${Date.now()}_${file.name}`
    const { data } = await supabase.storage.from('org-files').upload(path, file, { upsert: true })
    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('org-files').getPublicUrl(path)
      await supabase.from('halls').update({ document_urls: [...(hall.document_urls ?? []), publicUrl] }).eq('id', hall.id)
      router.refresh()
    }
    setUploading(false)
  }

  async function removeDocument(url: string) {
    const supabase = createClient()
    await supabase.from('halls').update({ document_urls: hall.document_urls.filter(u => u !== url) }).eq('id', hall.id)
    router.refresh()
  }

  const docName = (url: string) => decodeURIComponent(url.split('/').pop()?.replace(/^\d+_/, '') ?? url)

  const resetForm = () => setForm({
    name: hall.name, usage_type: hall.usage_type ?? 'Produktion',
    area_sqm: hall.area_sqm?.toString() ?? '', height_m: hall.height_m?.toString() ?? '',
    year_built: hall.year_built?.toString() ?? '', has_crane: hall.has_crane ?? false,
    crane_capacity_t: hall.crane_capacity_t?.toString() ?? '', notes: hall.notes ?? '',
  })

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 40 }}>
      {/* Zurück */}
      <div style={{ position: 'sticky', top: 0, height: 0, overflow: 'visible', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 14px 0' }}>
          <Link href={hall.locations ? `/organisation/standort/${hall.location_id}` : '/organisation'} style={{
            height: 34, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px 0 8px', textDecoration: 'none',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>
              {hall.locations?.name ?? 'Standort'}
            </span>
          </Link>
          <div style={{
            height: 28, borderRadius: 20, backgroundColor: 'rgba(0,153,204,0.75)',
            display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px',
          }}>
            <Building2 size={12} color="white" />
            <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>Halle</span>
          </div>
        </div>
      </div>

      <AssetImageGallery imageUrls={hall.image_urls ?? []} title={hall.name} />

      {/* Titel */}
      <div style={{ padding: '16px 16px 0' }}>
        {editing ? (
          <input value={form.name} onChange={set('name')} style={{
            fontSize: 22, fontWeight: 700, color: '#000', border: 'none',
            borderBottom: '2px solid #0099cc', outline: 'none', width: '100%',
            background: 'transparent', marginBottom: 6, fontFamily: 'Arial, sans-serif',
          }} />
        ) : (
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000', margin: '0 0 4px' }}>{hall.name}</h1>
        )}
        {!editing && hall.usage_type && (
          <span style={{
            display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20, marginBottom: 12,
            background: '#e8eef6', color: '#003366',
          }}>{hall.usage_type}</span>
        )}
      </div>

      {/* Info-Karten */}
      {!editing && (
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {hall.area_sqm && <InfoCard icon={<Maximize2 size={14} />} label="Hallenfläche" value={`${hall.area_sqm.toLocaleString('de-DE')} m²`} />}
          {hall.height_m && <InfoCard icon={<ArrowUp size={14} />} label="Hallenhöhe" value={`${hall.height_m} m`} />}
          {hall.year_built && <InfoCard icon={<Calendar size={14} />} label="Baujahr" value={`${hall.year_built}`} />}
          {hall.has_crane && <InfoCard icon={<Truck size={14} />} label="Krananlage" value={hall.crane_capacity_t ? `${hall.crane_capacity_t} t` : 'Vorhanden'} />}
        </div>
      )}

      {/* Edit-Formular */}
      {editing && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden', marginBottom: 12 }}>
            {/* Nutzungsart */}
            <div style={{ padding: '12px 14px' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 3 }}>Nutzungsart</label>
              <select value={form.usage_type} onChange={set('usage_type')} style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent' }}>
                {USAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {[
              { k: 'area_sqm', label: 'Hallenfläche (m²)', placeholder: '2500' },
              { k: 'height_m', label: 'Hallenhöhe (m)', placeholder: '8.5' },
              { k: 'year_built', label: 'Baujahr', placeholder: '1998' },
              { k: 'crane_capacity_t', label: 'Krananlage Tragkraft (t)', placeholder: '5' },
            ].map(f => (
              <div key={f.k}>
                <div style={{ height: 1, background: '#c8d4e8' }} />
                <div style={{ padding: '12px 14px' }}>
                  <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 3 }}>{f.label}</label>
                  <input value={(form as Record<string, string | boolean>)[f.k] as string} onChange={set(f.k)} placeholder={f.placeholder}
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent' }} />
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: '#c8d4e8' }} />
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="crane" checked={form.has_crane} onChange={e => setForm(f => ({ ...f, has_crane: e.target.checked }))} />
              <label htmlFor="crane" style={{ fontSize: 14, fontFamily: 'Arial, sans-serif', cursor: 'pointer' }}>Krananlage vorhanden</label>
            </div>
            <div style={{ height: 1, background: '#c8d4e8' }} />
            <div style={{ padding: '12px 14px' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 3 }}>Notizen</label>
              <textarea value={form.notes} onChange={set('notes')} rows={3}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent', resize: 'vertical' }} />
            </div>
          </div>
        </div>
      )}

      {/* Notizen */}
      {!editing && hall.notes && (
        <div style={{ padding: '0 16px 16px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={14} /> Notizen
          </h2>
          <div style={{ background: 'white', borderRadius: 12, padding: '14px', border: '1px solid #c8d4e8' }}>
            <p style={{ fontSize: 14, color: '#444', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{hall.notes}</p>
          </div>
        </div>
      )}

      {/* Bereiche */}
      {areas.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Grid3x3 size={14} /> Bereiche ({areas.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {areas.map(area => (
              <Link key={area.id} href={`/organisation/bereich/${area.id}`} style={{
                background: 'white', borderRadius: 12, padding: '12px 14px',
                border: '1px solid #c8d4e8', textDecoration: 'none', color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{area.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
                    {[area.process_type, area.responsible_name ? `Verantw.: ${area.responsible_name}` : null, area.machine_count ? `${area.machine_count} Maschinen` : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Dokumente */}
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
        {(hall.document_urls ?? []).length === 0 ? (
          <p style={{ color: '#aaa', fontSize: 13 }}>Noch keine Dokumente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {hall.document_urls.map(url => (
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
