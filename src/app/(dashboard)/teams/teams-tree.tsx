'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Layers, FolderOpen, Users, ChevronDown, ChevronRight, Plus, Trash2, Pencil, Check, X } from 'lucide-react'

type Division   = { id: string; name: string }
type Department = { id: string; division_id: string; name: string }
type Team       = { id: string; department_id: string; name: string; area_id: string | null; areas: { name: string } | null }

interface Props {
  organizationId: string
  divisions: Division[]
  departments: Department[]
  teams: Team[]
}

type EditState =
  | { type: 'division'; id: string; name: string }
  | { type: 'department'; id: string; name: string }
  | null

type AddState = { type: 'division' | 'department' | 'team'; parentId?: string } | null

export function TeamsTree({ organizationId, divisions, departments, teams }: Props) {
  const router = useRouter()
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set())
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState<AddState>(null)
  const [inputValue, setInputValue] = useState('')
  const [editing, setEditing] = useState<EditState>(null)
  const [loading, setLoading] = useState(false)

  const toggle = (set: Set<string>, id: string) => { const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); return n }

  const startAdding = (type: AddState['type'], parentId?: string) => {
    setEditing(null); setAdding({ type, parentId }); setInputValue('')
    if (type === 'department' && parentId) setExpandedDivisions(s => new Set(s).add(parentId))
    if (type === 'team' && parentId) setExpandedDepartments(s => new Set(s).add(parentId))
  }
  const cancelAdding = () => { setAdding(null); setInputValue('') }

  const saveNew = async () => {
    if (!inputValue.trim()) return
    setLoading(true)
    const supabase = createClient()
    if (adding?.type === 'division') {
      await supabase.from('divisions').insert({ organization_id: organizationId, name: inputValue.trim() })
    } else if (adding?.type === 'department') {
      await supabase.from('departments').insert({ organization_id: organizationId, division_id: adding.parentId, name: inputValue.trim() })
    } else if (adding?.type === 'team') {
      await supabase.from('teams').insert({ organization_id: organizationId, department_id: adding.parentId, name: inputValue.trim() })
    }
    cancelAdding(); setLoading(false); router.refresh()
  }

  const startEdit = (e: React.MouseEvent, s: EditState) => { e.stopPropagation(); cancelAdding(); setEditing(s) }
  const cancelEdit = () => setEditing(null)
  const saveEdit = async () => {
    if (!editing) return
    setLoading(true)
    const supabase = createClient()
    if (editing.type === 'division') await supabase.from('divisions').update({ name: editing.name }).eq('id', editing.id)
    else await supabase.from('departments').update({ name: editing.name }).eq('id', editing.id)
    setEditing(null); setLoading(false); router.refresh()
  }

  const deleteItem = async (type: 'division' | 'department' | 'team', id: string) => {
    if (!confirm('Wirklich löschen? Alle untergeordneten Einträge werden entfernt.')) return
    const supabase = createClient()
    if (type === 'division') await supabase.from('divisions').delete().eq('id', id)
    else if (type === 'department') await supabase.from('departments').delete().eq('id', id)
    else await supabase.from('teams').delete().eq('id', id)
    router.refresh()
  }

  const isAdding = (type: string, parentId?: string) => adding?.type === type && adding?.parentId === parentId

  const inputBox = (placeholder: string) => (
    <div style={{ background: 'white', border: '1px solid #0099cc', borderRadius: 10, padding: '10px 12px', marginTop: 6 }}>
      <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') saveNew(); if (e.key === 'Escape') cancelAdding() }}
        placeholder={placeholder}
        style={{ width: '100%', outline: 'none', border: 'none', fontSize: 14, fontFamily: 'Arial, sans-serif', color: '#000' }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={saveNew} disabled={loading || !inputValue.trim()}
          style={{ background: '#003366', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600, opacity: loading || !inputValue.trim() ? 0.5 : 1 }}>
          Speichern
        </button>
        <button onClick={cancelAdding}
          style={{ background: 'transparent', color: '#666', border: '1px solid #c8d4e8', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
          Abbrechen
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

  const inlineEditRow = (value: string, onChange: (v: string) => void, onSave: () => void, accent: string) => (
    <div style={{ padding: '10px 14px' }}>
      <input autoFocus value={value} onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') cancelEdit() }}
        style={{ width: '100%', outline: 'none', border: 'none', borderBottom: `1px solid ${accent}`, fontSize: 14, fontWeight: 600, fontFamily: 'Arial, sans-serif', background: 'transparent', paddingBottom: 4, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSave} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: accent, color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600, opacity: loading ? 0.5 : 1 }}>
          <Check size={12} /> Speichern
        </button>
        <button onClick={cancelEdit}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#666', border: '1px solid #c8d4e8', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
          <X size={12} /> Abbrechen
        </button>
      </div>
    </div>
  )

  return (
    <div>
      {divisions.map(div => {
        const divDepts = departments.filter(d => d.division_id === div.id)
        const isOpen = expandedDivisions.has(div.id)
        const isEditingThis = editing?.type === 'division' && editing.id === div.id

        return (
          <div key={div.id} style={{ marginBottom: 10 }}>
            <div style={{ background: 'white', borderRadius: 12, border: `1px solid ${isEditingThis ? '#0099cc' : '#c8d4e8'}`, overflow: 'hidden' }}>

              {isEditingThis && editing.type === 'division' ? (
                inlineEditRow(editing.name, v => setEditing({ ...editing, name: v }), saveEdit, '#003366')
              ) : (
                <div onClick={() => setExpandedDivisions(s => toggle(s, div.id))}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isOpen ? <ChevronDown size={16} color="#003366" /> : <ChevronRight size={16} color="#003366" />}
                    <Layers size={16} color="#003366" />
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#000' }}>{div.name}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {iconBtn(<Pencil size={14} />, e => startEdit(e, { type: 'division', id: div.id, name: div.name }), 'Bearbeiten', '#96aed2')}
                    {iconBtn(<Plus size={16} />, e => { e.stopPropagation(); startAdding('department', div.id) }, 'Abteilung hinzufügen', '#0099cc')}
                    {iconBtn(<Trash2 size={15} />, e => { e.stopPropagation(); deleteItem('division', div.id) }, 'Löschen')}
                  </div>
                </div>
              )}

              {isOpen && !isEditingThis && (
                <div style={{ borderTop: '1px solid #e8eef6', padding: '8px 12px 12px 32px' }}>
                  {divDepts.map(dept => {
                    const deptTeams = teams.filter(t => t.department_id === dept.id)
                    const deptOpen = expandedDepartments.has(dept.id)
                    const isEditingDept = editing?.type === 'department' && editing.id === dept.id

                    return (
                      <div key={dept.id} style={{ marginTop: 8 }}>
                        <div style={{ background: '#f5f8fc', borderRadius: 8, border: `1px solid ${isEditingDept ? '#0099cc' : '#dce6f0'}`, overflow: 'hidden' }}>

                          {isEditingDept && editing.type === 'department' ? (
                            inlineEditRow(editing.name, v => setEditing({ ...editing, name: v }), saveEdit, '#0099cc')
                          ) : (
                            <div onClick={() => setExpandedDepartments(s => toggle(s, dept.id))}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {deptOpen ? <ChevronDown size={14} color="#0099cc" /> : <ChevronRight size={14} color="#0099cc" />}
                                <FolderOpen size={14} color="#0099cc" />
                                <span style={{ fontSize: 14, color: '#000', fontWeight: 600 }}>{dept.name}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {iconBtn(<Pencil size={13} />, e => startEdit(e, { type: 'department', id: dept.id, name: dept.name }), 'Bearbeiten', '#96aed2')}
                                {iconBtn(<Plus size={14} />, e => { e.stopPropagation(); startAdding('team', dept.id) }, 'Team hinzufügen', '#0099cc')}
                                {iconBtn(<Trash2 size={13} />, e => { e.stopPropagation(); deleteItem('department', dept.id) }, 'Löschen')}
                              </div>
                            </div>
                          )}

                          {deptOpen && !isEditingDept && (
                            <div style={{ borderTop: '1px solid #dce6f0', padding: '6px 10px 10px 28px' }}>
                              {deptTeams.map(team => (
                                <div key={team.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 8px', borderRadius: 6, marginTop: 4, background: 'white', border: '1px solid #e8eef6' }}>
                                  <Link href={`/teams/team/${team.id}`} style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flex: 1, minWidth: 0 }}>
                                    <Users size={13} color="#8B5CF6" />
                                    <div style={{ minWidth: 0 }}>
                                      <span style={{ fontSize: 13, color: '#222', fontWeight: 600 }}>{team.name}</span>
                                      {team.areas && (
                                        <span style={{ fontSize: 11, color: '#96aed2', marginLeft: 6 }}>· {team.areas.name}</span>
                                      )}
                                    </div>
                                  </Link>
                                  {iconBtn(<Trash2 size={12} />, e => { e.stopPropagation(); deleteItem('team', team.id) }, 'Löschen')}
                                </div>
                              ))}

                              {isAdding('team', dept.id) && inputBox('Teamname z.B. Instandhaltung')}
                              {!isAdding('team', dept.id) && (
                                <button onClick={() => startAdding('team', dept.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0099cc', padding: '4px 0', fontFamily: 'Arial, sans-serif' }}>
                                  <Plus size={13} /> Team hinzufügen
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {isAdding('department', div.id) && inputBox('Abteilungsname z.B. Produktion')}
                  {!isAdding('department', div.id) && (
                    <button onClick={() => startAdding('department', div.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0099cc', padding: '4px 0', fontFamily: 'Arial, sans-serif' }}>
                      <Plus size={13} /> Abteilung hinzufügen
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {isAdding('division', undefined) && (
        <div style={{ marginBottom: 10 }}>{inputBox('Bereichsname z.B. Fertigung')}</div>
      )}

      {!isAdding('division', undefined) && (
        <button onClick={() => startAdding('division')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'white', border: '2px dashed #c8d4e8', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', color: '#003366', fontFamily: 'Arial, sans-serif', fontSize: 14, fontWeight: 600, marginTop: divisions.length > 0 ? 4 : 0 }}>
          <Plus size={16} /> Bereich hinzufügen
        </button>
      )}

      {divisions.length === 0 && !adding && (
        <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 24 }}>
          Noch keine Bereiche angelegt. Füge deinen ersten Bereich hinzu.
        </p>
      )}
    </div>
  )
}
