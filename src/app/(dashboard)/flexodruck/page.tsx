// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function FlexodruckPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, app_role')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) redirect('/dashboard')

  // Feature-Gate
  const { data: org } = await supabase
    .from('organizations')
    .select('features')
    .eq('id', profile.organization_id)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((org as any)?.features?.flexodruck === false) redirect('/dashboard')

  const t = await getTranslations()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canEdit = ['admin', 'superadmin'].includes((profile as any).app_role)

  const [{ data: machines }, { data: recentSetups }] = await Promise.all([
    supabase
      .from('flexo_machines')
      .select('id, name, manufacturer, model, num_druckwerke, is_active, created_at')
      .eq('org_id', profile.organization_id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('flexo_setups')
      .select('id, name, job_number, status, planned_at, created_at, flexo_machines(name)')
      .eq('org_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const statusColor: Record<string, string> = {
    planned:     '#0099cc',
    in_progress: '#f59e0b',
    completed:   '#34d399',
    cancelled:   '#6b7280',
  }

  return (
    <div style={{ padding: '28px 24px 40px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#003366', margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }}>
            {t('flexodruck.title')}
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0, fontFamily: 'Arial, sans-serif' }}>
            {t('flexodruck.machines')} · {t('flexodruck.templates')} · {t('flexodruck.setups')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/flexodruck/ruestung/neu" style={{
            background: '#003366', color: 'white',
            padding: '10px 20px', borderRadius: 50, border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Arial, sans-serif', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ▶ {t('flexodruck.newSetup')}
          </Link>
          {canEdit && (
            <Link href="/flexodruck/maschinen/neu" style={{
              background: '#f4f6f9', color: '#003366',
              padding: '10px 20px', borderRadius: 50,
              border: '1px solid #c8d4e8',
              fontSize: 13, fontWeight: 700,
              fontFamily: 'Arial, sans-serif', textDecoration: 'none',
            }}>
              + {t('flexodruck.newMachine')}
            </Link>
          )}
        </div>
      </div>

      {/* Maschinen */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#003366', margin: '0 0 12px', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {t('flexodruck.machines')}
      </h2>

      {(!machines || machines.length === 0) ? (
        <div style={{
          background: 'white', borderRadius: 14, border: '1px solid #c8d4e8',
          padding: '40px', textAlign: 'center', marginBottom: 28,
        }}>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }}>
            {t('flexodruck.noMachines')}
          </p>
          {canEdit && (
            <Link href="/flexodruck/maschinen/neu" style={{
              background: '#003366', color: 'white', padding: '10px 24px',
              borderRadius: 50, fontSize: 13, fontWeight: 700,
              fontFamily: 'Arial, sans-serif', textDecoration: 'none',
            }}>
              + {t('flexodruck.newMachine')}
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
          {machines.map(m => (
            <Link key={m.id} href={`/flexodruck/maschinen/${m.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'white', borderRadius: 14, border: '1px solid #c8d4e8',
                padding: '18px 20px', cursor: 'pointer',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,51,102,0.12)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = '#0099cc'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = ''
                  ;(e.currentTarget as HTMLElement).style.borderColor = '#c8d4e8'
                }}
              >
                {/* Maschinen-Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #003366, #0099cc)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="10" rx="2"/>
                    <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
                    <line x1="6" y1="12" x2="6.01" y2="12" strokeWidth="3"/>
                    <line x1="10" y1="12" x2="14" y2="12"/>
                  </svg>
                </div>

                <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
                  {m.name}
                </p>
                {(m.manufacturer || m.model) && (
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                    {[m.manufacturer, m.model].filter(Boolean).join(' · ')}
                  </p>
                )}

                {/* Druckwerk-Badges */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {Array.from({ length: m.num_druckwerke }).map((_, i) => (
                    <span key={i} style={{
                      fontSize: 11, fontWeight: 700, fontFamily: 'Arial, sans-serif',
                      background: '#e8f4fd', color: '#0099cc',
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      DW {i + 1}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Letzte Rüstvorgänge */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#003366', margin: '0 0 12px', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {t('flexodruck.setups')}
      </h2>

      {(!recentSetups || recentSetups.length === 0) ? (
        <div style={{
          background: 'white', borderRadius: 14, border: '1px solid #c8d4e8',
          padding: '28px', textAlign: 'center',
        }}>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0, fontFamily: 'Arial, sans-serif' }}>
            {t('flexodruck.noSetups')}
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
          {recentSetups.map((s, i) => (
            <Link key={s.id} href={`/flexodruck/ruestung/${s.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
                borderBottom: i < recentSetups.length - 1 ? '1px solid #e8edf4' : 'none',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: statusColor[s.status] ?? '#6b7280',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
                    {s.name}
                    {s.job_number && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280', fontWeight: 400 }}>#{s.job_number}</span>
                    )}
                  </p>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                    {(s as any).flexo_machines?.name}
                  </p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, fontFamily: 'Arial, sans-serif',
                  color: statusColor[s.status] ?? '#6b7280',
                  background: (statusColor[s.status] ?? '#6b7280') + '18',
                  padding: '3px 10px', borderRadius: 20,
                }}>
                  {t(`flexodruck.${s.status}` as Parameters<typeof t>[0])}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
