'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AssetImageGallery } from '@/app/(dashboard)/assets/[id]/asset-image-gallery'
import {
  MapPin, Phone, User, Users, Maximize2, Building2,
  FileText, Upload, Trash2, Pencil, X, Check
} from 'lucide-react'

type Location = {
  id: string; name: string; address: string | null
  contact_name: string | null; contact_phone: string | null
  area_sqm: number | null; employee_count: number | null
  notes: string | null; image_urls: string[]; document_urls: string[]
}
type Hall = { id: string; name: string; usage_type: string | null; area_sqm: number | null }

const USAGE_COLORS: Record<string, string> = {
  Produktion: '#003366', Montage: '#0099cc', Lager: '#8B5CF6',
  Technik: '#F39C12', Sonstiges: '#96aed2',
}

export function LocationDetail({ location, halls }: { location: Location; halls: Hall[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    name: location.name,
    address: location.address ?? '',
    contact_name: location.contact_name ?? '',
    contact_phone: location.contact_phone ?? '',
    area_sqm: location.area_sqm?.toString() ?? '',
    employee_count: location.employee_count?.toString() ?? '',
    notes: location.notes ?? '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('locations').update({
      name: form.name,
      address: form.address || null,
      contact_name: form.contact_name || null,
      contact_phone: form.contact_phone || null,
      area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : null,
      employee_count: form.employee_count ? parseInt(form.employee_count) : null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }).eq('id', location.id)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const path = `locations/${location.id}/${Date.now()}_${file.name}`
    const { data } = await supabase.storage.from('org-files').upload(path, file, { upsert: true })
    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('org-files').getPublicUrl(path)
      const newUrls = [...(location.image_urls ?? []), publicUrl]
      await supabase.from('locations').update({ image_urls: newUrls }).eq('id', location.id)
      router.refresh()
    }
    setUploading(false)
  }

  async function uploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const path = `locations/${location.id}/docs/${Date.now()}_${file.name}`
    const { data } = await supabase.storage.from('org-files').upload(path, file, { upsert: true })
    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('org-files').getPublicUrl(path)
      const newUrls = [...(location.document_urls ?? []), publicUrl]
      await supabase.from('locations').update({ document_urls: newUrls }).eq('id', location.id)
      router.refresh()
    }
    setUploading(false)
  }

  async function removeDocument(url: string) {
    const supabase = createClient()
    const newUrls = location.document_urls.filter(u => u !== url)
    await supabase.from('locations').update({ document_urls: newUrls }).eq('id', location.id)
    router.refresh()
  }

  const docName = (url: string) => decodeURIComponent(url.split('/').pop()?.replace(/^\d+_/, '') ?? url)

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 40 }}>
      {/* Zurück-Button */}
      <div style={{ position: 'sticky', top: 0, height: 0, overflow: 'visible', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 14px 0' }}>
          <Link href="/organisation" style={{
            height: 34, borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px 0 8px',
            textDecoration: 'none',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>Organisation</span>
          </Link>
          <div style={{
            height: 28, borderRadius: 20, backgroundColor: 'rgba(0,51,102,0.75)',
            display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px',
          }}>
            <MapPin size={12} color="white" />
            <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>Standort</span>
          </div>
        </div>
      </div>

      {/* Bildergalerie */}
      <AssetImageGallery imageUrls={location.image_urls ?? []} title={location.name} />

      {/* Titel */}
      <div style={{ padding: '16px 16px 0' }}>
        {editing ? (
          <input value={form.name} onChange={set('name')}
            style={{
              fontSize: 22, fontWeight: 700, color: '#000', border: 'none',
              borderBottom: '2px solid #0099cc', outline: 'none', width: '100%',
              background: 'transparent', marginBottom: 12, fontFamily: 'Arial, sans-serif',
            }} />
        ) : (
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000', margin: '0 0 4px' }}>{location.name}</h1>
        )}
        {!editing && location.address && (
          <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={13} /> {location.address}
          </p>
        )}
      </div>

      {/* Info-Karten */}
      {!editing && (
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {location.contact_name && (
            <InfoCard icon={<User size={14} />} label="Ansprechpartner" value={location.contact_name} />
          )}
          {location.contact_phone && (
            <InfoCard icon={<Phone size={14} />} label="Telefon" value={location.contact_phone} />
          )}
          {location.area_sqm && (
            <InfoCard icon={<Maximize2 size={14} />} label="Gesamtfläche" value={`${location.area_sqm.toLocaleString('de-DE')} m²`} />
          )}
          {location.employee_count && (
            <InfoCard icon={<Users size={14} />} label="Mitarbeiter" value={`${location.employee_count}`} />
          )}
        </div>
      )}

      {/* Edit-Formular */}
      {editing && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden', marginBottom: 12 }}>
            {[
              { k: 'address', label: 'Adresse', placeholder: 'Musterstraße 1, 46395 Bocholt' },
              { k: 'contact_name', label: 'Ansprechpartner', placeholder: 'Max Mustermann' },
              { k: 'contact_phone', label: 'Telefon', placeholder: '+49 2871 123456' },
              { k: 'area_sqm', label: 'Gesamtfläche (m²)', placeholder: '5000' },
              { k: 'employee_count', label: 'Mitarbeiter', placeholder: '120' },
            ].map((f, i) => (
              <div key={f.k}>
                {i > 0 && <div style={{ height: 1, background: '#c8d4e8' }} />}
                <div style={{ padding: '12px 14px' }}>
                  <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 3 }}>{f.label}</label>
                  <input value={(form as Record<string, string>)[f.k]} onChange={set(f.k)} placeholder={f.placeholder}
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent' }} />
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: '#c8d4e8' }} />
            <div style={{ padding: '12px 14px' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 3 }}>Notizen</label>
              <textarea value={form.notes} onChange={set('notes')} rows={3}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', background: 'transparent', resize: 'vertical' }} />
            </div>
          </div>
        </div>
      )}

      {/* Notizen (Leseansicht) */}
      {!editing && location.notes && (
        <div style={{ padding: '0 16px 16px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={14} /> Notizen
          </h2>
          <div style={{ background: 'white', borderRadius: 12, padding: '14px', border: '1px solid #c8d4e8' }}>
            <p style={{ fontSize: 14, color: '#444', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{location.notes}</p>
          </div>
        </div>
      )}

      {/* Hallen Übersicht */}
      {halls.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={14} /> Hallen ({halls.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {halls.map(hall => (
              <Link key={hall.id} href={`/organisation/halle/${hall.id}`} style={{
                background: 'white', borderRadius: 12, padding: '12px 14px',
                border: '1px solid #c8d4e8', textDecoration: 'none', color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{hall.name}</p>
                  {(hall.usage_type || hall.area_sqm) && (
                    <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
                      {hall.usage_type}{hall.area_sqm ? ` · ${hall.area_sqm.toLocaleString('de-DE')} m²` : ''}
                    </p>
                  )}
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: `${USAGE_COLORS[hall.usage_type ?? ''] ?? '#96aed2'}22`,
                  color: USAGE_COLORS[hall.usage_type ?? ''] ?? '#96aed2',
                }}>
                  {hall.usage_type ?? 'Halle'}
                </div>
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
          <label style={{
            display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
            fontSize: 13, color: '#0099cc', fontWeight: 600,
          }}>
            <Upload size={13} /> {uploading ? 'Lädt…' : 'Hochladen'}
            <input type="file" style={{ display: 'none' }} onChange={uploadDocument}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.dwg" />
          </label>
        </div>
        {(location.document_urls ?? []).length === 0 ? (
          <p style={{ color: '#aaa', fontSize: 13 }}>Noch keine Dokumente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {location.document_urls.map(url => (
              <div key={url} style={{
                background: 'white', borderRadius: 10, padding: '10px 14px',
                border: '1px solid #c8d4e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <a href={url} target="_blank" rel="noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  textDecoration: 'none', color: '#003366', fontSize: 13, flex: 1, minWidth: 0,
                }}>
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
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          border: '2px dashed #c8d4e8', borderRadius: 12, padding: '14px', cursor: 'pointer',
          fontSize: 13, color: '#96aed2', background: 'white',
        }}>
          <Upload size={15} /> {uploading ? 'Lädt hoch…' : 'Bild hinzufügen'}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadImage} />
        </label>
      </div>

      {/* Aktions-Buttons */}
      <div style={{ padding: '0 16px', display: 'flex', gap: 10 }}>
        {editing ? (
          <>
            <button onClick={() => { setEditing(false); setForm({ name: location.name, address: location.address ?? '', contact_name: location.contact_name ?? '', contact_phone: location.contact_phone ?? '', area_sqm: location.area_sqm?.toString() ?? '', employee_count: location.employee_count?.toString() ?? '', notes: location.notes ?? '' }) }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'white', color: '#003366', padding: '13px', borderRadius: 50,
                border: '2px solid #003366', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>
              <X size={15} /> Abbrechen
            </button>
            <button onClick={save} disabled={saving}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: '#003366', color: 'white', padding: '13px', borderRadius: 50,
                border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                opacity: saving ? 0.6 : 1,
              }}>
              <Check size={15} /> Speichern
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#003366', color: 'white', padding: '13px', borderRadius: 50,
              border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
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
      <p style={{ fontSize: 11, color: '#96aed2', margin: '0 0 3px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon} {label}
      </p>
      <p style={{ fontSize: 13, color: '#000', margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </p>
    </div>
  )
}
