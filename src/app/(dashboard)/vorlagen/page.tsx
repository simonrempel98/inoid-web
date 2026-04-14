import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TemplateIcon } from '@/components/template-icon'
import { ClipboardList } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function VorlagenPage() {
  const supabase = await createClient()
  const t = await getTranslations('vorlagen')

  const { data: templates } = await supabase
    .from('asset_templates')
    .select('*')
    .order('usage_count', { ascending: false })

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ds-text)', margin: '0 0 2px' }}>{t('title')}</h1>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
            {templates?.length ?? 0} {templates?.length === 1 ? t('title').replace('n', '') : t('title')}
          </p>
        </div>
        <Link href="/vorlagen/neu" style={{
          backgroundColor: '#003366', color: 'white',
          padding: '10px 18px', borderRadius: 50,
          textDecoration: 'none', fontSize: 14, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> {t('new')}
        </Link>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{
          backgroundColor: '#f0f4ff', borderRadius: 12, padding: '12px 16px',
          border: '1px solid var(--ds-border)',
        }}>
          <p style={{ fontSize: 13, color: '#003366', margin: 0, lineHeight: 1.5 }}>
            {t('info')}
          </p>
        </div>
      </div>

      {/* Liste */}
      <div style={{ padding: '16px 20px' }}>
        {!templates || templates.length === 0 ? (
          <div style={{
            background: 'var(--ds-surface)', borderRadius: 16, padding: 40,
            border: '1px solid var(--ds-border)', textAlign: 'center',
          }}>
            <div style={{ marginBottom: 12 }}><ClipboardList size={40} style={{ color: '#96aed2' }} /></div>
            <p style={{ fontWeight: 700, color: 'var(--ds-text)', fontSize: 16, margin: '0 0 8px' }}>
              {t('noTitle')}
            </p>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 20px' }}>
              {t('noDesc')}
            </p>
            <Link href="/vorlagen/neu" style={{
              backgroundColor: '#003366', color: 'white',
              padding: '12px 24px', borderRadius: 50,
              textDecoration: 'none', fontSize: 14, fontWeight: 700,
            }}>
              {t('noAction')}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {templates.map(tpl => {
              const techFields = Array.isArray(tpl.technical_fields) ? tpl.technical_fields as { label: string; unit?: string }[] : []
              const commFields = Array.isArray(tpl.commercial_fields) ? tpl.commercial_fields as { label: string }[] : []
              return (
                <Link key={tpl.id} href={`/vorlagen/${tpl.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--ds-surface)', borderRadius: 14, padding: '14px 16px',
                    border: '1px solid var(--ds-border)',
                    display: 'flex', alignItems: 'center', gap: 14,
                    boxShadow: '0 1px 3px rgba(0,51,102,0.06)',
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                      backgroundColor: '#f0f4ff', border: '1px solid var(--ds-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <TemplateIcon name={tpl.icon ?? '📦'} size={26} color="#003366" />
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: 'var(--ds-text)', fontSize: 15, margin: '0 0 3px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tpl.name}
                      </p>
                      <p style={{ color: '#666', fontSize: 12, margin: '0 0 5px' }}>
                        {[tpl.category, tpl.manufacturer].filter(Boolean).join(' · ') || t('noCategory')}
                      </p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={tagStyle}>{t('techFields', { count: techFields.length })}</span>
                        <span style={tagStyle}>{t('commFields', { count: commFields.length })}</span>
                        {tpl.usage_count > 0 && (
                          <span style={{ ...tagStyle, backgroundColor: '#f0fdf4', color: '#27AE60', borderColor: '#bbf7d0' }}>
                            {t('usedCount', { count: tpl.usage_count })}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Pfeil */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const tagStyle: React.CSSProperties = {
  display: 'inline-block', fontSize: 10, fontWeight: 700,
  padding: '2px 8px', borderRadius: 10,
  backgroundColor: '#f4f6f9', color: '#666', border: '1px solid var(--ds-border)',
  fontFamily: 'Arial, sans-serif',
}
