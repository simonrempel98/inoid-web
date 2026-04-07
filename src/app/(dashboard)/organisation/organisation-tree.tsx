'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Building2, Grid3x3, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'

type Location = { id: string; name: string; address: string | null }
type Hall = { id: string; location_id: string; name: string }
type Area = { id: string; hall_id: string; name: string }

interface Props {
  organizationId: string
  locations: Location[]
  halls: Hall[]
  areas: Area[]
}

export function OrganisationTree({ organizationId, locations, halls, areas }: Props) {
  const router = useRouter()
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set())
  const [expandedHalls, setExpandedHalls] = useState<Set<string>>(new Set())
  const [addingTo, setAddingTo] = useState<{ type: 'location' | 'hall' | 'area'; parentId?: string } | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [addressValue, setAddressValue] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleLocation = (id: string) => {
    setExpandedLocations(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleHall = (id: string) => {
    setExpandedHalls(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const startAdding = (type: 'location' | 'hall' | 'area', parentId?: string) => {
    setAddingTo({ type, parentId })
    setInputValue('')
    setAddressValue('')
    // Auto-expand parent
    if (type === 'hall' && parentId) setExpandedLocations(prev => new Set(prev).add(parentId))
    if (type === 'area' && parentId) setExpandedHalls(prev => new Set(prev).add(parentId))
  }

  const cancelAdding = () => {
    setAddingTo(null)
    setInputValue('')
    setAddressValue('')
  }

  const saveNew = async () => {
    if (!inputValue.trim()) return
    setLoading(true)
    const supabase = createClient()

    try {
      if (addingTo?.type === 'location') {
        await supabase.from('locations').insert({
          organization_id: organizationId,
          name: inputValue.trim(),
          address: addressValue.trim() || null,
        })
      } else if (addingTo?.type === 'hall') {
        await supabase.from('halls').insert({
          organization_id: organizationId,
          location_id: addingTo.parentId,
          name: inputValue.trim(),
        })
      } else if (addingTo?.type === 'area') {
        await supabase.from('areas').insert({
          organization_id: organizationId,
          hall_id: addingTo.parentId,
          name: inputValue.trim(),
        })
      }
      cancelAdding()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (type: 'location' | 'hall' | 'area', id: string) => {
    if (!confirm('Wirklich löschen? Alle untergeordneten Einträge werden ebenfalls gelöscht.')) return
    const supabase = createClient()
    if (type === 'location') await supabase.from('locations').delete().eq('id', id)
    else if (type === 'hall') await supabase.from('halls').delete().eq('id', id)
    else await supabase.from('areas').delete().eq('id', id)
    router.refresh()
  }

  const isAdding = (type: string, parentId?: string) =>
    addingTo?.type === type && addingTo?.parentId === parentId

  const inputBox = (placeholder: string, showAddress = false) => (
    <div style={{
      background: 'white', border: '1px solid #0099cc', borderRadius: 10,
      padding: '10px 12px', marginTop: 6,
    }}>
      <input
        autoFocus
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') saveNew(); if (e.key === 'Escape') cancelAdding() }}
        placeholder={placeholder}
        style={{
          width: '100%', outline: 'none', border: 'none', fontSize: 14,
          fontFamily: 'Arial, sans-serif', color: '#000',
        }}
      />
      {showAddress && (
        <input
          value={addressValue}
          onChange={e => setAddressValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveNew(); if (e.key === 'Escape') cancelAdding() }}
          placeholder="Adresse (optional)"
          style={{
            width: '100%', outline: 'none', border: 'none', fontSize: 13,
            fontFamily: 'Arial, sans-serif', color: '#666', marginTop: 6,
            borderTop: '1px solid #e8eef6', paddingTop: 6,
          }}
        />
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={saveNew}
          disabled={loading || !inputValue.trim()}
          style={{
            background: '#003366', color: 'white', border: 'none',
            borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
            fontFamily: 'Arial, sans-serif', fontWeight: 600,
            opacity: loading || !inputValue.trim() ? 0.5 : 1,
          }}
        >
          Speichern
        </button>
        <button
          onClick={cancelAdding}
          style={{
            background: 'transparent', color: '#666', border: '1px solid #c8d4e8',
            borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          Abbrechen
        </button>
      </div>
    </div>
  )

  return (
    <div>
      {/* STANDORTE */}
      {locations.map(loc => {
        const locHalls = halls.filter(h => h.location_id === loc.id)
        const isOpen = expandedLocations.has(loc.id)

        return (
          <div key={loc.id} style={{ marginBottom: 10 }}>
            {/* Location Row */}
            <div style={{
              background: 'white', borderRadius: 12, border: '1px solid #c8d4e8',
              overflow: 'hidden',
            }}>
              <div
                onClick={() => toggleLocation(loc.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 14px', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isOpen
                    ? <ChevronDown size={16} color="#003366" />
                    : <ChevronRight size={16} color="#003366" />
                  }
                  <MapPin size={16} color="#003366" />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#000' }}>{loc.name}</p>
                    {loc.address && <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{loc.address}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={e => { e.stopPropagation(); startAdding('hall', loc.id) }}
                    title="Halle hinzufügen"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#0099cc', display: 'flex' }}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteItem('location', loc.id) }}
                    title="Standort löschen"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#c0ccda', display: 'flex' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Hallen */}
              {isOpen && (
                <div style={{ borderTop: '1px solid #e8eef6', padding: '8px 12px 12px 32px' }}>
                  {locHalls.map(hall => {
                    const hallAreas = areas.filter(a => a.hall_id === hall.id)
                    const hallOpen = expandedHalls.has(hall.id)

                    return (
                      <div key={hall.id} style={{ marginTop: 8 }}>
                        <div style={{
                          background: '#f5f8fc', borderRadius: 8, border: '1px solid #dce6f0',
                          overflow: 'hidden',
                        }}>
                          <div
                            onClick={() => toggleHall(hall.id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 12px', cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {hallOpen
                                ? <ChevronDown size={14} color="#0099cc" />
                                : <ChevronRight size={14} color="#0099cc" />
                              }
                              <Building2 size={14} color="#0099cc" />
                              <span style={{ fontSize: 14, color: '#000', fontWeight: 600 }}>{hall.name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={e => { e.stopPropagation(); startAdding('area', hall.id) }}
                                title="Bereich hinzufügen"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: '#0099cc', display: 'flex' }}
                              >
                                <Plus size={14} />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); deleteItem('hall', hall.id) }}
                                title="Halle löschen"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: '#c0ccda', display: 'flex' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Bereiche */}
                          {hallOpen && (
                            <div style={{ borderTop: '1px solid #dce6f0', padding: '6px 10px 10px 28px' }}>
                              {hallAreas.map(area => (
                                <div key={area.id} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '7px 8px', borderRadius: 6, marginTop: 4,
                                  background: 'white', border: '1px solid #e8eef6',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <Grid3x3 size={13} color="#96aed2" />
                                    <Link href={`/organisation/bereich/${area.id}`} onClick={e => e.stopPropagation()}
                                style={{ fontSize: 13, color: '#222', textDecoration: 'none' }}>
                                {area.name}
                              </Link>
                                  </div>
                                  <button
                                    onClick={() => deleteItem('area', area.id)}
                                    title="Bereich löschen"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: '#c0ccda', display: 'flex' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}

                              {isAdding('area', hall.id) && inputBox('Bereichsname z.B. Druckzone A')}

                              {!isAdding('area', hall.id) && (
                                <button
                                  onClick={() => startAdding('area', hall.id)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: 13, color: '#0099cc', padding: '4px 0',
                                    fontFamily: 'Arial, sans-serif',
                                  }}
                                >
                                  <Plus size={13} /> Bereich hinzufügen
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {isAdding('hall', loc.id) && inputBox('Hallenname z.B. Halle 1')}

                  {!isAdding('hall', loc.id) && (
                    <button
                      onClick={() => startAdding('hall', loc.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 13, color: '#0099cc', padding: '4px 0',
                        fontFamily: 'Arial, sans-serif',
                      }}
                    >
                      <Plus size={13} /> Halle hinzufügen
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Add Location input */}
      {isAdding('location', undefined) && (
        <div style={{ marginBottom: 10 }}>
          {inputBox('Standortname z.B. Werk Bocholt', true)}
        </div>
      )}

      {/* Add Location Button */}
      {!isAdding('location', undefined) && (
        <button
          onClick={() => startAdding('location')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            background: 'white', border: '2px dashed #c8d4e8', borderRadius: 12,
            padding: '14px 16px', cursor: 'pointer', color: '#003366',
            fontFamily: 'Arial, sans-serif', fontSize: 14, fontWeight: 600,
            marginTop: locations.length > 0 ? 4 : 0,
          }}
        >
          <Plus size={16} /> Standort hinzufügen
        </button>
      )}

      {locations.length === 0 && !addingTo && (
        <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 24 }}>
          Noch keine Standorte angelegt. Füge deinen ersten Standort hinzu.
        </p>
      )}
    </div>
  )
}
