'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { MapPin, Building2, Grid3x3, ChevronDown, ChevronRight, Plus, Trash2, Pencil, Check, X } from 'lucide-react'

type Location = { id: string; name: string; address: string | null }
type Hall = { id: string; location_id: string; name: string }
type Area = { id: string; hall_id: string; name: string }

interface Props {
  organizationId: string
  locations: Location[]
  halls: Hall[]
  areas: Area[]
  canEdit: boolean
}

type EditState =
  | { type: 'location'; id: string; name: string; address: string }
  | { type: 'hall'; id: string; name: string }
  | null

export function OrganisationTree({ organizationId, locations, halls, areas, canEdit }: Props) {
  const t = useTranslations('organisation.tree')
  const tc = useTranslations('common')
  const router = useRouter()
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set())
  const [expandedHalls, setExpandedHalls] = useState<Set<string>>(new Set())
  const [addingTo, setAddingTo] = useState<{ type: 'location' | 'hall' | 'area'; parentId?: string } | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [addressValue, setAddressValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<EditState>(null)

  const toggleLocation = (id: string) =>
    setExpandedLocations(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const toggleHall = (id: string) =>
    setExpandedHalls(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const startAdding = (type: 'location' | 'hall' | 'area', parentId?: string) => {
    setEditing(null)
    setAddingTo({ type, parentId })
    setInputValue('')
    setAddressValue('')
    if (type === 'hall' && parentId) setExpandedLocations(prev => new Set(prev).add(parentId))
    if (type === 'area' && parentId) setExpandedHalls(prev => new Set(prev).add(parentId))
  }

  const cancelAdding = () => { setAddingTo(null); setInputValue(''); setAddressValue('') }

  const saveNew = async () => {
    if (!inputValue.trim()) return
    setLoading(true)
    const supabase = createClient()
    try {
      if (addingTo?.type === 'location') {
        await supabase.from('locations').insert({ organization_id: organizationId, name: inputValue.trim(), address: addressValue.trim() || null })
      } else if (addingTo?.type === 'hall') {
        await supabase.from('halls').insert({ organization_id: organizationId, location_id: addingTo.parentId, name: inputValue.trim() })
      } else if (addingTo?.type === 'area') {
        await supabase.from('areas').insert({ organization_id: organizationId, hall_id: addingTo.parentId, name: inputValue.trim() })
      }
      cancelAdding()
      router.refresh()
    } finally { setLoading(false) }
  }

  const startEdit = (e: React.MouseEvent, item: EditState) => {
    e.stopPropagation()
    cancelAdding()
    setEditing(item)
  }

  const cancelEdit = () => setEditing(null)

  const saveEdit = async () => {
    if (!editing) return
    setLoading(true)
    const supabase = createClient()
    if (editing.type === 'location') {
      await supabase.from('locations').update({ name: editing.name, address: editing.address || null }).eq('id', editing.id)
    } else if (editing.type === 'hall') {
      await supabase.from('halls').update({ name: editing.name }).eq('id', editing.id)
    }
    setEditing(null)
    setLoading(false)
    router.refresh()
  }

  const deleteItem = async (type: 'location' | 'hall' | 'area', id: string) => {
    if (!confirm(t('confirmDelete'))) return
    const supabase = createClient()
    if (type === 'location') await supabase.from('locations').delete().eq('id', id)
    else if (type === 'hall') await supabase.from('halls').delete().eq('id', id)
    else await supabase.from('areas').delete().eq('id', id)
    router.refresh()
  }

  const isAdding = (type: string, parentId?: string) =>
    addingTo?.type === type && addingTo?.parentId === parentId

  const inputBox = (placeholder: string, showAddress = false) => (
    <div style={{ background: 'var(--ds-surface)', border: '1px solid #0099cc', borderRadius: 10, padding: '10px 12px', marginTop: 6 }}>
      <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') saveNew(); if (e.key === 'Escape') cancelAdding() }}
        placeholder={placeholder}
        style={{ width: '100%', outline: 'none', border: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', color: 'var(--ds-text)' }} />
      {showAddress && (
        <input value={addressValue} onChange={e => setAddressValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveNew(); if (e.key === 'Escape') cancelAdding() }}
          placeholder={t('addressOptional')}
          style={{ width: '100%', outline: 'none', border: 'none', fontSize: 13, fontFamily: 'Arial, sans-serif', color: '#666', marginTop: 6, borderTop: '1px solid var(--ds-border)', paddingTop: 6 }} />
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={saveNew} disabled={loading || !inputValue.trim()}
          style={{ background: '#003366', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'Arial, sans-serif', fontWeight: 600, opacity: loading || !inputValue.trim() ? 0.5 : 1 }}>
          {tc('save')}
        </button>
        <button onClick={cancelAdding}
          style={{ background: 'transparent', color: '#666', border: '1px solid var(--ds-border)', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
          {tc('cancel')}
        </button>
      </div>
    </div>
  )

  const iconBtn = (icon: React.ReactNode, onClick: (e: React.MouseEvent) => void, title: string, color = '#c0ccda') => (
    <button onClick={onClick} title={title}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color, display: 'flex', alignItems: 'center' }}>
      {icon}
    </button>
  )

  return (
    <div>
      {locations.map(loc => {
        const locHalls = halls.filter(h => h.location_id === loc.id)
        const isOpen = expandedLocations.has(loc.id)
        const isEditingThis = editing?.type === 'location' && editing.id === loc.id

        return (
          <div key={loc.id} style={{ marginBottom: 10 }}>
            <div style={{ background: 'var(--ds-surface)', borderRadius: 12, border: `1px solid ${isEditingThis ? '#0099cc' : '#c8d4e8'}`, overflow: 'hidden' }}>

              {/* Location Row – Edit mode */}
              {isEditingThis && editing.type === 'location' ? (
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <MapPin size={15} color="#003366" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#003366' }}>{t('editLocation')}</span>
                  </div>
                  <input autoFocus value={editing.name}
                    onChange={e => setEditing({ ...editing, name: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                    placeholder="Name"
                    style={{ width: '100%', outline: 'none', border: 'none', borderBottom: '1px solid var(--ds-border)', fontSize: 15, fontWeight: 600, fontFamily: 'Arial, sans-serif', color: 'var(--ds-text)', paddingBottom: 6, marginBottom: 8, background: 'transparent' }} />
                  <input value={editing.address}
                    onChange={e => setEditing({ ...editing, address: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                    placeholder={t('addressOptional')}
                    style={{ width: '100%', outline: 'none', border: 'none', borderBottom: '1px solid var(--ds-border)', fontSize: 13, fontFamily: 'Arial, sans-serif', color: '#666', paddingBottom: 6, marginBottom: 10, background: 'transparent' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveEdit} disabled={loading}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#003366', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600, opacity: loading ? 0.5 : 1 }}>
                      <Check size={13} /> {tc('save')}
                    </button>
                    <button onClick={cancelEdit}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#666', border: '1px solid var(--ds-border)', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
                      <X size={13} /> {tc('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                /* Location Row – View mode */
                <div onClick={() => toggleLocation(loc.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isOpen ? <ChevronDown size={16} color="#003366" /> : <ChevronRight size={16} color="#003366" />}
                    <MapPin size={16} color="#003366" />
                    <div>
                      <Link href={`/organisation/standort/${loc.id}`} onClick={e => e.stopPropagation()}
                        style={{ margin: 0, fontWeight: 600, fontSize: 15, color: 'var(--ds-text)', textDecoration: 'none' }}>
                        {loc.name}
                      </Link>
                      {loc.address && <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{loc.address}</p>}
                    </div>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {iconBtn(<Pencil size={14} />, e => startEdit(e, { type: 'location', id: loc.id, name: loc.name, address: loc.address ?? '' }), t('editLocation'), '#96aed2')}
                      {iconBtn(<Plus size={16} />, e => { e.stopPropagation(); startAdding('hall', loc.id) }, t('addHall'), '#0099cc')}
                      {iconBtn(<Trash2 size={15} />, e => { e.stopPropagation(); deleteItem('location', loc.id) }, t('deleteLocation'))}
                    </div>
                  )}
                </div>
              )}

              {/* Hallen */}
              {isOpen && !isEditingThis && (
                <div style={{ borderTop: '1px solid var(--ds-border)', padding: '8px 12px 12px 32px' }}>
                  {locHalls.map(hall => {
                    const hallAreas = areas.filter(a => a.hall_id === hall.id)
                    const hallOpen = expandedHalls.has(hall.id)
                    const isEditingHall = editing?.type === 'hall' && editing.id === hall.id

                    return (
                      <div key={hall.id} style={{ marginTop: 8 }}>
                        <div style={{ background: '#f5f8fc', borderRadius: 8, border: `1px solid ${isEditingHall ? '#0099cc' : '#dce6f0'}`, overflow: 'hidden' }}>

                          {/* Hall Row – Edit mode */}
                          {isEditingHall && editing.type === 'hall' ? (
                            <div style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                                <Building2 size={13} color="#0099cc" />
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#0099cc' }}>{t('editHall')}</span>
                              </div>
                              <input autoFocus value={editing.name}
                                onChange={e => setEditing({ ...editing, name: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                                style={{ width: '100%', outline: 'none', border: 'none', borderBottom: '1px solid var(--ds-border)', fontSize: 14, fontWeight: 600, fontFamily: 'Arial, sans-serif', color: 'var(--ds-text)', paddingBottom: 5, marginBottom: 8, background: 'transparent' }} />
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={saveEdit} disabled={loading}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0099cc', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600, opacity: loading ? 0.5 : 1 }}>
                                  <Check size={12} /> {tc('save')}
                                </button>
                                <button onClick={cancelEdit}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#666', border: '1px solid var(--ds-border)', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
                                  <X size={12} /> {tc('cancel')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Hall Row – View mode */
                            <div onClick={() => toggleHall(hall.id)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {hallOpen ? <ChevronDown size={14} color="#0099cc" /> : <ChevronRight size={14} color="#0099cc" />}
                                <Building2 size={14} color="#0099cc" />
                                <Link href={`/organisation/halle/${hall.id}`} onClick={e => e.stopPropagation()}
                                  style={{ fontSize: 14, color: 'var(--ds-text)', fontWeight: 600, textDecoration: 'none' }}>
                                  {hall.name}
                                </Link>
                              </div>
                              {canEdit && (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  {iconBtn(<Pencil size={13} />, e => startEdit(e, { type: 'hall', id: hall.id, name: hall.name }), t('editHall'), '#96aed2')}
                                  {iconBtn(<Plus size={14} />, e => { e.stopPropagation(); startAdding('area', hall.id) }, t('addArea'), '#0099cc')}
                                  {iconBtn(<Trash2 size={13} />, e => { e.stopPropagation(); deleteItem('hall', hall.id) }, t('deleteHall'))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bereiche */}
                          {hallOpen && !isEditingHall && (
                            <div style={{ borderTop: '1px solid #dce6f0', padding: '6px 10px 10px 28px' }}>
                              {hallAreas.map(area => (
                                <div key={area.id} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '7px 8px', borderRadius: 6, marginTop: 4,
                                  background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <Grid3x3 size={13} color="#96aed2" />
                                    <Link href={`/organisation/bereich/${area.id}`}
                                      style={{ fontSize: 13, color: '#222', textDecoration: 'none' }}>
                                      {area.name}
                                    </Link>
                                  </div>
                                  {canEdit && iconBtn(<Trash2 size={12} />, e => { e.stopPropagation(); deleteItem('area', area.id) }, t('deleteArea'))}
                                </div>
                              ))}

                              {canEdit && isAdding('area', hall.id) && inputBox(t('areaPlaceholder'))}
                              {canEdit && !isAdding('area', hall.id) && (
                                <button onClick={() => startAdding('area', hall.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0099cc', padding: '4px 0', fontFamily: 'Arial, sans-serif' }}>
                                  <Plus size={13} /> {t('addArea')}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {canEdit && isAdding('hall', loc.id) && inputBox(t('hallPlaceholder'))}
                  {canEdit && !isAdding('hall', loc.id) && (
                    <button onClick={() => startAdding('hall', loc.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0099cc', padding: '4px 0', fontFamily: 'Arial, sans-serif' }}>
                      <Plus size={13} /> {t('addHall')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {canEdit && isAdding('location', undefined) && (
        <div style={{ marginBottom: 10 }}>{inputBox(t('locationPlaceholder'), true)}</div>
      )}

      {canEdit && !isAdding('location', undefined) && (
        <button onClick={() => startAdding('location')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'var(--ds-surface)', border: '2px dashed #c8d4e8', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', color: '#003366', fontFamily: 'Arial, sans-serif', fontSize: 14, fontWeight: 600, marginTop: locations.length > 0 ? 4 : 0 }}>
          <Plus size={16} /> {t('addLocation')}
        </button>
      )}

      {locations.length === 0 && !addingTo && (
        <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 24 }}>
          {t('noLocationsHint')}
        </p>
      )}
    </div>
  )
}
