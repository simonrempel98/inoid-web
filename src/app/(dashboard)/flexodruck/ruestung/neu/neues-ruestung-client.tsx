'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

type Template = { id: string; name: string }
type Machine = { id: string; name: string; manufacturer: string | null; model: string | null; num_druckwerke: number; templates: Template[] }

export function NeuesRuestungClient({
  machines,
  preselectedMachineId,
  preselectedTemplateId,
}: {
  machines: Machine[]
  preselectedMachineId: string | null
  preselectedTemplateId: string | null
}) {
  const router = useRouter()
  const t = useTranslations('flexodruck')
  const [machineId, setMachineId] = useState(preselectedMachineId ?? (machines[0]?.id ?? ''))
  const [templateId, setTemplateId] = useState(preselectedTemplateId ?? '')
  const [name, setName] = useState('')
  const [jobNumber, setJobNumber] = useState('')
  const [plannedAt, setPlannedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedMachine = machines.find(m => m.id === machineId)

  // Erste Vorlage vorauswählen wenn keine gewählt
  useEffect(() => {
    if (!templateId && selectedMachine?.templates?.length) {
      setTemplateId(selectedMachine.templates[0].id)
    }
  }, [machineId, selectedMachine]) // eslint-disable-line react-hooks/exhaustive-deps

  const input: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #c8d4e8', background: 'white', color: '#003366',
    fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
    fontFamily: 'Arial, sans-serif',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!machineId) { setError(t('selectMachineRequired')); return }
    if (!name.trim()) { setError(t('nameRequired')); return }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/flexodruck/setups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machine_id: machineId,
        template_id: templateId || null,
        name: name.trim(),
        job_number: jobNumber.trim() || null,
        planned_at: plannedAt || null,
        notes: notes.trim() || null,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? t('nameRequired')); return }
    router.push(`/flexodruck/ruestung/${data.id}`)
  }

  if (machines.length === 0) {
    return (
      <div style={{ padding: '28px 24px', maxWidth: 520 }}>
        <Link href="/flexodruck" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none', fontFamily: 'Arial, sans-serif' }}>← Flexodruck</Link>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#003366', margin: '8px 0 16px', fontFamily: 'Arial, sans-serif' }}>{t('newSetup')}</h1>
        <div style={{ background: '#fef3c7', borderRadius: 12, border: '1px solid #f59e0b', padding: '16px 20px' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontFamily: 'Arial, sans-serif' }}>
            {t('noMachinesYet')}
          </p>
        </div>
        <Link href="/flexodruck/maschinen/neu" style={{
          display: 'inline-block', marginTop: 16,
          background: '#003366', color: 'white', padding: '10px 24px',
          borderRadius: 50, fontSize: 13, fontWeight: 700,
          fontFamily: 'Arial, sans-serif', textDecoration: 'none',
        }}>
          + {t('newMachine')}
        </Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 24px 60px', maxWidth: 560 }}>
      <Link href="/flexodruck" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none', fontFamily: 'Arial, sans-serif' }}>← Flexodruck</Link>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#003366', margin: '8px 0 4px', fontFamily: 'Arial, sans-serif' }}>{t('newSetup')}</h1>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px', fontFamily: 'Arial, sans-serif' }}>
        {t('newSetupSubtitle')}
      </p>

      <form onSubmit={handleSubmit}>
        {/* Maschine */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '20px', marginBottom: 16 }}>
          <label style={labelStyle}>{t('machine')} *</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {machines.map(m => (
              <label key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                border: machineId === m.id ? '2px solid #0099cc' : '1px solid #c8d4e8',
                background: machineId === m.id ? '#e8f4fd' : 'white',
              }}>
                <input type="radio" name="machine" value={m.id} checked={machineId === m.id}
                  onChange={() => { setMachineId(m.id); setTemplateId('') }}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>{m.name}</p>
                  {(m.manufacturer || m.model) && (
                    <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>{[m.manufacturer, m.model].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#0099cc', background: '#e8f4fd', padding: '2px 8px', borderRadius: 20, fontFamily: 'Arial, sans-serif', fontWeight: 700, flexShrink: 0 }}>
                  {m.num_druckwerke} DW
                </span>
              </label>
            ))}
          </div>

          {/* Vorlage */}
          {selectedMachine && selectedMachine.templates.length > 0 && (
            <>
              <label style={labelStyle}>{t('template')}</label>
              <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={input}>
                <option value="">{t('withoutTemplate')}</option>
                {selectedMachine.templates.map(tmpl => (
                  <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                ))}
              </select>
            </>
          )}
          {selectedMachine && selectedMachine.templates.length === 0 && (
            <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 12px', marginTop: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontFamily: 'Arial, sans-serif' }}>
                {t('noTemplates')}{' '}
                <Link href={`/flexodruck/maschinen/${machineId}/vorlagen/neu`} style={{ color: '#0099cc', textDecoration: 'none', fontWeight: 700 }}>
                  {t('createTemplate')} →
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Rüstvorgang-Details */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '20px', marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('setupNameLabel')} *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="z.B. Rüstung Job 2024-001" required style={input} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }} className="rg-2">
            <div>
              <label style={labelStyle}>{t('jobNumber')}</label>
              <input value={jobNumber} onChange={e => setJobNumber(e.target.value)}
                placeholder="z.B. 2024-042" style={input} />
            </div>
            <div>
              <label style={labelStyle}>{t('plannedAt')}</label>
              <input type="datetime-local" value={plannedAt} onChange={e => setPlannedAt(e.target.value)} style={input} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>{t('notes')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Optional: Besonderheiten, Hinweise..." rows={2}
              style={{ ...input, resize: 'vertical' }} />
          </div>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12, fontFamily: 'Arial, sans-serif' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={loading}
            style={{
              background: loading ? '#c8d4e8' : '#003366', color: 'white',
              padding: '12px 28px', borderRadius: 50, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}>
            {loading ? t('creating_setup') : `▶ ${t('createSetup')}`}
          </button>
          <button type="button" onClick={() => router.back()}
            style={{
              background: 'transparent', color: '#6b7280',
              padding: '12px 20px', borderRadius: 50, border: '1px solid #c8d4e8',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}>
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
