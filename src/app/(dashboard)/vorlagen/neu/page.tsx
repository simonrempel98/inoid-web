'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { ICON_MAP, ICON_GROUPS, TemplateIcon } from '@/components/template-icon'
import { ClipboardList, Settings2, Briefcase } from 'lucide-react'

type Field = { label: string; unit: string }

export default function NeueVorlagePage() {
  const t = useTranslations('vorlagen.form')
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [icon, setIcon] = useState('Package')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [iconSearch, setIconSearch] = useState('')

  const [techFields, setTechFields] = useState<Field[]>([{ label: '', unit: '' }])
  const [commFields, setCommFields] = useState<Field[]>([{ label: '' }])
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>({})

  function addTechField() {
    setTechFields(f => [...f, { label: '', unit: '' }])
  }
  function removeTechField(i: number) {
    const removed = techFields[i]
    setTechFields(f => f.filter((_, j) => j !== i))
    if (removed.label) {
      const newDef = { ...defaultValues }
      delete newDef[removed.label]
      setDefaultValues(newDef)
    }
  }
  function updateTechField(i: number, key: keyof Field, value: string) {
    const old = techFields[i].label
    const updated = techFields.map((f, j) => j === i ? { ...f, [key]: value } : f)
    setTechFields(updated)
    if (key === 'label' && old && old !== value) {
      const newDef = { ...defaultValues }
      newDef[value] = newDef[old] ?? ''
      delete newDef[old]
      setDefaultValues(newDef)
    }
  }

  function addCommField() {
    setCommFields(f => [...f, { label: '' }])
  }
  function removeCommField(i: number) {
    const removed = commFields[i]
    setCommFields(f => f.filter((_, j) => j !== i))
    if (removed.label) {
      const newDef = { ...defaultValues }
      delete newDef[removed.label]
      setDefaultValues(newDef)
    }
  }
  function updateCommField(i: number, value: string) {
    const old = commFields[i].label
    setCommFields(f => f.map((field, j) => j === i ? { label: value } : field))
    if (old && old !== value) {
      const newDef = { ...defaultValues }
      newDef[value] = newDef[old] ?? ''
      delete newDef[old]
      setDefaultValues(newDef)
    }
  }

  async function handleSave() {
    if (!name.trim()) { setError(t('nameRequired')); return }
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

      const cleanTech = techFields.filter(f => f.label.trim())
      const cleanComm = commFields.filter(f => f.label.trim())

      const { error: insertError } = await supabase
        .from('asset_templates')
        .insert({
          organization_id: profile.organization_id,
          name: name.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          manufacturer: manufacturer.trim() || null,
          icon,
          technical_fields: cleanTech.map(f => ({ label: f.label.trim(), ...(f.unit ? { unit: f.unit.trim() } : {}) })),
          commercial_fields: cleanComm.map(f => ({ label: f.label.trim() })),
          default_values: defaultValues,
          created_by: user.id,
        })

      if (insertError) throw new Error(insertError.message)
      router.push('/vorlagen')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('nameRequired'))
    } finally {
      setLoading(false)
    }
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
  const sectionTitle: React.CSSProperties = {
    fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 12px',
    fontFamily: 'Arial, sans-serif',
  }

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
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#000', margin: 0 }}>{t('title')}</h1>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', color: '#dc2626', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Grunddaten */}
        <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #c8d4e8', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardList size={15} /> {t('basics')}</p>

          {/* Icon Picker */}
          <div>
            <label style={labelStyle}>{t('iconLabel')}</label>
            <button type="button" onClick={() => setShowIconPicker(v => !v)}
              style={{
                width: 56, height: 56, borderRadius: 12, border: `2px solid ${showIconPicker ? '#003366' : '#c8d4e8'}`,
                background: '#f4f6f9', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <TemplateIcon name={icon} size={26} color="#003366" />
            </button>

            {showIconPicker && (
              <div style={{
                marginTop: 8, background: 'white', borderRadius: 14, padding: 14,
                border: '1px solid #c8d4e8', boxShadow: '0 4px 20px rgba(0,51,102,0.12)',
              }}>
                <input
                  value={iconSearch}
                  onChange={e => setIconSearch(e.target.value)}
                  placeholder={t('iconSearch')}
                  autoFocus
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #c8d4e8', fontSize: 13, fontFamily: 'Arial, sans-serif',
                    outline: 'none', boxSizing: 'border-box', marginBottom: 12,
                  }}
                />

                {iconSearch.trim() ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                    {Object.keys(ICON_MAP)
                      .filter(n => n.toLowerCase().includes(iconSearch.toLowerCase()))
                      .map(n => (
                        <IconPickerBtn key={n} name={n} selected={icon === n}
                          onSelect={() => { setIcon(n); setShowIconPicker(false); setIconSearch('') }} />
                      ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 340, overflowY: 'auto' }}>
                    {ICON_GROUPS.map(group => (
                      <div key={group.label}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#96aed2', margin: '0 0 6px',
                          textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Arial, sans-serif' }}>
                          {group.label}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                          {group.icons.filter(n => ICON_MAP[n]).map(n => (
                            <IconPickerBtn key={n} name={n} selected={icon === n}
                              onSelect={() => { setIcon(n); setShowIconPicker(false) }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>{t('nameLabel')}</label>
            <input value={name} onChange={e => setName(e.target.value)}
              style={inputStyle} placeholder={t('namePlaceholder')} />
          </div>
          <div>
            <label style={labelStyle}>{t('descLabel')}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} style={{ ...inputStyle, resize: 'none' }} placeholder={t('descPlaceholder')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>{t('categoryLabel')}</label>
              <input value={category} onChange={e => setCategory(e.target.value)}
                style={inputStyle} placeholder={t('categoryPlaceholder')} />
            </div>
            <div>
              <label style={labelStyle}>{t('manufacturerLabel')}</label>
              <input value={manufacturer} onChange={e => setManufacturer(e.target.value)}
                style={inputStyle} placeholder={t('manufacturerPlaceholder')} />
            </div>
          </div>
        </div>

        {/* Technische Felder */}
        <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #c8d4e8' }}>
          <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 6 }}><Settings2 size={15} /> {t('techFieldsTitle')}</p>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px' }}>
            {t('techFieldsDesc')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {techFields.map((f, i) => (
              <div key={i}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 2 }}>
                    {i === 0 && <label style={labelStyle}>{t('fieldName')}</label>}
                    <input value={f.label} onChange={e => updateTechField(i, 'label', e.target.value)}
                      style={inputStyle} placeholder="z.B. Durchmesser" />
                  </div>
                  <div style={{ flex: 1 }}>
                    {i === 0 && <label style={labelStyle}>{t('unit')}</label>}
                    <input value={f.unit} onChange={e => updateTechField(i, 'unit', e.target.value)}
                      style={inputStyle} placeholder={t('unitPlaceholder')} />
                  </div>
                  <div style={{ paddingTop: i === 0 ? 20 : 0 }}>
                    <button type="button" onClick={() => removeTechField(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 20, padding: '8px 4px' }}>
                      ×
                    </button>
                  </div>
                </div>
                {f.label && (
                  <div style={{ marginTop: 4 }}>
                    <input
                      value={defaultValues[f.label] ?? ''}
                      onChange={e => setDefaultValues({ ...defaultValues, [f.label]: e.target.value })}
                      style={{ ...inputStyle, fontSize: 12, padding: '7px 10px', backgroundColor: '#f9fbff' }}
                      placeholder={t('defaultValuePlaceholder', { label: f.label, unit: f.unit ? ` (${f.unit})` : '' })}
                    />
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={addTechField}
              style={{
                border: '1px dashed #c8d4e8', background: 'none', borderRadius: 10,
                padding: '8px 16px', color: '#003366', fontSize: 13, cursor: 'pointer', fontWeight: 600,
              }}>
              {t('addField')}
            </button>
          </div>
        </div>

        {/* Kommerzielle Felder */}
        <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #c8d4e8' }}>
          <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 6 }}><Briefcase size={15} /> {t('commFieldsTitle')}</p>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px' }}>
            {t('commFieldsDesc')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {commFields.map((f, i) => (
              <div key={i}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {i === 0 && <label style={labelStyle}>{t('fieldName')}</label>}
                    <input value={f.label} onChange={e => updateCommField(i, e.target.value)}
                      style={inputStyle} placeholder="z.B. Lieferant" />
                  </div>
                  <div style={{ paddingTop: i === 0 ? 20 : 0 }}>
                    <button type="button" onClick={() => removeCommField(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 20, padding: '8px 4px' }}>
                      ×
                    </button>
                  </div>
                </div>
                {f.label && (
                  <div style={{ marginTop: 4 }}>
                    <input
                      value={defaultValues[f.label] ?? ''}
                      onChange={e => setDefaultValues({ ...defaultValues, [f.label]: e.target.value })}
                      style={{ ...inputStyle, fontSize: 12, padding: '7px 10px', backgroundColor: '#f9fbff' }}
                      placeholder={t('commDefaultPlaceholder', { label: f.label })}
                    />
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={addCommField}
              style={{
                border: '1px dashed #c8d4e8', background: 'none', borderRadius: 10,
                padding: '8px 16px', color: '#003366', fontSize: 13, cursor: 'pointer', fontWeight: 600,
              }}>
              {t('addField')}
            </button>
          </div>
        </div>

        {/* Speichern */}
        <button type="button" onClick={handleSave} disabled={loading}
          style={{
            padding: '14px', borderRadius: 50, border: 'none',
            background: loading ? '#c8d4e8' : '#003366',
            color: 'white', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer', fontFamily: 'Arial, sans-serif',
          }}>
          {loading ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  )
}

function IconPickerBtn({ name, selected, onSelect }: { name: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      title={name}
      onClick={onSelect}
      style={{
        aspectRatio: '1', borderRadius: 8, border: 'none',
        background: selected ? '#003366' : '#f4f6f9',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 3, cursor: 'pointer', padding: '6px 4px',
      }}
    >
      <TemplateIcon name={name} size={18} color={selected ? 'white' : '#003366'} />
      <span style={{
        fontSize: 8, color: selected ? 'white' : '#96aed2',
        fontFamily: 'Arial, sans-serif', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
      }}>
        {name}
      </span>
    </button>
  )
}
