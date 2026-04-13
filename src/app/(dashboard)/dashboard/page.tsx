import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PLANS } from '@/lib/plans'
import { ROLE_COLORS, ROLE_BG, type AppRole } from '@/lib/permissions'
import { getTranslations, getLocale } from 'next-intl/server'
import {
  Package, Users, Wrench, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, FileText, CreditCard, Activity,
  BarChart3, Zap, MapPin, MessageSquare,
} from 'lucide-react'

// ── Typen ────────────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
  accent?: string
  trend?: { label: string; positive: boolean }
  wide?: boolean
}

type ProgressBarProps = { value: number; max: number; color?: string }

// ── Sub-Komponenten ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color, accent, trend }: StatCardProps) {
  return (
    <div className="db-stat-card" style={{
      background: 'var(--ds-surface, white)', borderRadius: 16, padding: '20px',
      border: '1px solid var(--ds-border, #e8edf5)',
      boxShadow: '0 2px 8px var(--ds-shadow, rgba(0,51,102,0.06))',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          backgroundColor: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
            backgroundColor: trend.positive ? '#dcfce7' : '#fee2e2',
            color: trend.positive ? '#166534' : '#991b1b',
          }}>
            {trend.label}
          </span>
        )}
      </div>
      <div>
        <div className="db-stat-val" style={{ fontSize: 28, fontWeight: 800, color: accent ?? 'var(--ds-text, #003366)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ds-text3, #555)', marginTop: 4, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--ds-text4, #999)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function ProgressBar({ value, max, color = '#0099cc' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const danger = pct >= 90
  const warn = pct >= 75
  const barColor = danger ? '#ef4444' : warn ? '#f59e0b' : color
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
        <span style={{ color: 'var(--ds-text3, #555)', fontWeight: 600 }}>{value} / {max}</span>
        <span style={{ fontWeight: 700, color: barColor }}>{pct} %</span>
      </div>
      <div className="ds-track" style={{ height: 8, borderRadius: 8, backgroundColor: 'var(--ds-border, #e8edf5)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 8, backgroundColor: barColor, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 11, fontWeight: 700, color: '#96aed2', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
      {children}
    </h2>
  )
}

// ── Haupt-Seite ───────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, full_name, app_role, is_platform_admin').eq('id', user.id).single()
  const orgId = profile?.organization_id

  // ── Alle Daten parallel laden ──────────────────────────────────────────────
  const [
    { data: org },
    { data: assets },
    { data: members },
    { data: schedules },
    { data: events },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.from('organizations').select('name, plan, asset_limit, user_limit, subscription_status, features').eq('id', orgId ?? '').single(),
    supabase.from('assets').select('id, status, category, created_at').eq('organization_id', orgId ?? '').is('deleted_at', null),
    supabase.from('organization_members').select('id, created_at').eq('organization_id', orgId ?? ''),
    supabase.from('maintenance_schedules').select('id, next_service_date, is_active').eq('organization_id', orgId ?? '').eq('is_active', true),
    supabase.from('asset_lifecycle_events').select('id, cost_eur, event_date, event_type').eq('organization_id', orgId ?? ''),
    supabase.from('asset_lifecycle_events').select('id, title, event_type, event_date, assets(title)').eq('organization_id', orgId ?? '').order('event_date', { ascending: false }).limit(6),
  ])

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // Date strings for consistent comparison (same logic as WartungTaskList)
  const nowStr      = now.toISOString().slice(0, 10)
  const weekStr     = new Date(now.getTime() + 7  * 86400000).toISOString().slice(0, 10)
  const thirtyStr   = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10)

  // ── KPI-Berechnungen ───────────────────────────────────────────────────────
  const totalAssets = assets?.length ?? 0
  const assetLimit = org?.asset_limit ?? 20
  const assetsActive = assets?.filter(a => a.status === 'active').length ?? 0
  const assetsInService = assets?.filter(a => a.status === 'in_service').length ?? 0
  const assetsDecommissioned = assets?.filter(a => a.status === 'decommissioned').length ?? 0

  // Kategorie-Aufteilung
  const categoryMap: Record<string, number> = {}
  assets?.forEach(a => {
    const k = a.category ?? '–'
    categoryMap[k] = (categoryMap[k] ?? 0) + 1
  })
  const topCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const totalMembers = members?.length ?? 0

  // Wartung — string comparison to match WartungTaskList behavior
  const overdueSchedules = schedules?.filter(s => s.next_service_date && s.next_service_date < nowStr).length ?? 0
  const dueThisWeek = schedules?.filter(s => s.next_service_date && s.next_service_date >= nowStr && s.next_service_date <= weekStr).length ?? 0
  const dueThirtyDays = schedules?.filter(s => s.next_service_date && s.next_service_date >= nowStr && s.next_service_date <= thirtyStr).length ?? 0
  const totalSchedules = schedules?.length ?? 0

  // Kosten
  const costThisMonth = events?.filter(e => e.event_date && new Date(e.event_date) >= startOfMonth)
    .reduce((s, e) => s + (e.cost_eur ?? 0), 0) ?? 0
  const costThisYear = events?.filter(e => e.event_date && new Date(e.event_date) >= startOfYear)
    .reduce((s, e) => s + (e.cost_eur ?? 0), 0) ?? 0
  const totalServiceEntries = events?.length ?? 0

  // Serviceheft diesen Monat
  const entriesThisMonth = events?.filter(e => e.event_date && new Date(e.event_date) >= startOfMonth).length ?? 0

  const features = (org?.features as Record<string, boolean>) ?? {}
  const showWartung     = features.wartung     !== false
  const showServiceheft = features.serviceheft !== false
  const showTeamchat    = features.teamchat    !== false

  const plan = PLANS.find(p => p.id === org?.plan) ?? PLANS[0]
  const planLabel: Record<string, string> = {
    free: 'Free', starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise',
  }

  const statusColor: Record<string, string> = {
    active: '#22c55e',
    in_service: '#f59e0b',
    decommissioned: '#94a3b8',
  }
  const statusLabel: Record<string, string> = {
    active: 'Aktiv',
    in_service: 'Im Service',
    decommissioned: 'Außer Betrieb',
  }

  const eventTypeIcon: Record<string, string> = {
    maintenance: '🔧', repair: '🛠️', inspection: '🔍', cleaning: '🧹',
    overhaul: '⚙️', installation: '📦', incident: '⚠️', other: '📝',
  }

  const t = await getTranslations()
  const locale = await getLocale()

  const appRole = (profile?.app_role ?? 'leser') as AppRole
  const ROLE_LABEL_MAP: Record<AppRole, string> = {
    superadmin: 'Superadmin',
    admin: 'Admin',
    techniker: 'Techniker',
    leser: 'Leser',
  }
  const roleLabel = profile?.is_platform_admin ? 'Superadmin' : (ROLE_LABEL_MAP[appRole] ?? appRole)

  return (
    <div style={{ padding: '28px 20px 40px', maxWidth: 1100, fontFamily: 'Arial, sans-serif', background: 'var(--ds-bg)', minHeight: '100vh' }} className="db-wrap ds-page-bg">
    <style>{`
      @media (max-width: 640px) {
        .db-wrap { padding: 18px 14px 36px !important; }
        .db-greeting { font-size: 20px !important; }
        .db-kpi { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; margin-bottom: 18px !important; }
        .db-stat-card { padding: 14px !important; gap: 8px !important; }
        .db-stat-val { font-size: 22px !important; }
        .db-mid { grid-template-columns: 1fr !important; margin-bottom: 14px !important; }
        .db-bot { grid-template-columns: 1fr !important; margin-bottom: 14px !important; }
        .db-bot-span2 { grid-column: span 1 !important; }
        .db-plan { grid-template-columns: 1fr !important; }
        .db-quicklinks { grid-template-columns: 1fr 1fr !important; }
      }
      @media (min-width: 641px) and (max-width: 960px) {
        .db-kpi { grid-template-columns: repeat(3, 1fr) !important; }
        .db-mid { grid-template-columns: 1fr !important; }
        .db-bot { grid-template-columns: 1fr !important; }
        .db-bot-span2 { grid-column: span 1 !important; }
        .db-plan { grid-template-columns: 1fr !important; }
      }
    `}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ds-text, #1a2940)' }} className="db-greeting">
              {profile?.full_name ?? user.email}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: ROLE_BG[appRole] ?? '#e8edf5',
              color: ROLE_COLORS[appRole] ?? '#003366',
              padding: '3px 9px', borderRadius: 20, letterSpacing: '0.04em',
            }}>
              {roleLabel}
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#96aed2', margin: '4px 0 0' }}>
            {now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            {now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
            {showWartung && overdueSchedules > 0 && (
              <span style={{ marginLeft: 10, color: '#ef4444', fontWeight: 700 }}>
                · {overdueSchedules > 1
                    ? t('dashboard.overdueWarningPlural', { n: overdueSchedules })
                    : t('dashboard.overdueWarning', { n: overdueSchedules })}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Haupt-KPI-Grid ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }} className="db-kpi">
        <StatCard label={t('dashboard.stats.assetsTotal')} value={totalAssets}
          sub={t('dashboard.stats.limit', { n: assetLimit })}
          icon={<Package size={20} />} color="#003366" />
        <StatCard label={t('dashboard.stats.active')} value={assetsActive}
          sub={totalAssets > 0 ? t('dashboard.stats.percentOfStock', { n: Math.round((assetsActive / totalAssets) * 100) }) : '—'}
          icon={<CheckCircle2 size={20} />} color="#22c55e" accent="#16a34a" />
        <StatCard label={t('dashboard.stats.inService')} value={assetsInService}
          sub={totalAssets > 0 ? t('dashboard.stats.percentOfStock', { n: Math.round((assetsInService / totalAssets) * 100) }) : '—'}
          icon={<Wrench size={20} />} color="#f59e0b" accent="#d97706" />
        <StatCard label={t('dashboard.stats.decommissioned')} value={assetsDecommissioned}
          sub={totalAssets > 0 ? t('dashboard.stats.percentOfStock', { n: Math.round((assetsDecommissioned / totalAssets) * 100) }) : '—'}
          icon={<Package size={20} />} color="#94a3b8" accent="#64748b" />
        <StatCard label={t('dashboard.stats.users')} value={totalMembers}
          sub={org?.user_limit ? t('dashboard.stats.limit', { n: org.user_limit }) : t('dashboard.stats.unlimited')}
          icon={<Users size={20} />} color="#0099cc" />
        {showWartung && (
          <StatCard label={t('dashboard.stats.overdueServices')} value={overdueSchedules}
            icon={<AlertTriangle size={20} />}
            color={overdueSchedules > 0 ? '#ef4444' : '#22c55e'}
            accent={overdueSchedules > 0 ? '#dc2626' : '#16a34a'}
            trend={overdueSchedules === 0 ? { label: t('dashboard.stats.allDone'), positive: true } : undefined} />
        )}
        {showWartung && (
          <StatCard label={t('dashboard.stats.dueThisWeek')} value={dueThisWeek}
            icon={<Clock size={20} />} color="#8b5cf6" accent="#7c3aed" />
        )}
        {showServiceheft && (
          <StatCard label={t('dashboard.stats.serviceEventsMonth')} value={entriesThisMonth}
            sub={t('dashboard.stats.totalSub', { n: totalServiceEntries })}
            icon={<Activity size={20} />} color="#0099cc" />
        )}
        {showServiceheft && (
          <StatCard label={t('dashboard.stats.maintenanceCostYear')} value={`${costThisYear.toFixed(0)} €`}
            sub={t('dashboard.stats.monthSub', { n: costThisMonth.toFixed(0) })}
            icon={<TrendingUp size={20} />} color="#003366" />
        )}
      </div>

      {/* ── Mittlere Reihe ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: showWartung ? '1fr 1fr' : '1fr', gap: 14, marginBottom: 28 }} className="db-mid">

        {/* Asset-Auslastung */}
        <div className="ds-panel" style={{
          background: 'var(--ds-surface, white)', borderRadius: 16, padding: '20px',
          border: '1px solid var(--ds-border, #e8edf5)', boxShadow: '0 2px 8px var(--ds-shadow, rgba(0,51,102,0.06))',
        }}>
          <SectionTitle>{t('dashboard.sections.assetUtilization')}</SectionTitle>
          <ProgressBar value={totalAssets} max={assetLimit} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {[
              { label: t('dashboard.stats.active'), count: assetsActive, color: '#22c55e' },
              { label: t('dashboard.stats.inService'), count: assetsInService, color: '#f59e0b' },
              { label: t('dashboard.stats.decommissioned'), count: assetsDecommissioned, color: '#94a3b8' },
            ].map(s => {
              const pct = totalAssets > 0 ? Math.round((s.count / totalAssets) * 100) : 0
              return (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                      <span style={{ color: 'var(--ds-text2, #444)', fontWeight: 600 }}>{s.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: s.color, fontSize: 14 }}>{s.count}</span>
                      <span style={{ color: 'var(--ds-text4, #aab8cc)', fontSize: 11 }}>{pct} %</span>
                    </div>
                  </div>
                  <div className="ds-track" style={{ height: 6, borderRadius: 6, backgroundColor: 'var(--ds-border, #e8edf5)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, backgroundColor: s.color, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Wartungsübersicht */}
        {showWartung && (
          <div className="ds-panel" style={{
            background: 'var(--ds-surface, white)', borderRadius: 16, padding: '20px',
            border: '1px solid var(--ds-border, #e8edf5)', boxShadow: '0 2px 8px var(--ds-shadow, rgba(0,51,102,0.06))',
          }}>
            <SectionTitle>{t('dashboard.sections.maintenanceOverview')}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: t('dashboard.maintenance.overdue'), count: overdueSchedules, color: '#ef4444' },
                { label: t('dashboard.maintenance.thisWeek'), count: dueThisWeek, color: '#a855f7' },
                { label: t('dashboard.maintenance.next30Days'), count: dueThirtyDays, color: '#8b5cf6' },
                { label: t('dashboard.maintenance.totalIntervals'), count: totalSchedules, color: '#0099cc' },
              ].map(row => (
                <a key={row.label} href="/wartung" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--ds-surface2, #f5f7fa)',
                  border: `1px solid ${row.color}22`,
                  textDecoration: 'none',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--ds-text2, #333)', fontWeight: 600 }}>{row.label}</span>
                  <span style={{
                    fontSize: 18, fontWeight: 800, color: row.color,
                    minWidth: 28, textAlign: 'right',
                  }}>{row.count}</span>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Untere Reihe ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: showServiceheft ? '1fr 2fr' : '1fr', gap: 14, marginBottom: 28 }} className="db-bot">

        {/* Top-Kategorien */}
        <div className="ds-panel" style={{
          background: 'var(--ds-surface, white)', borderRadius: 16, padding: '20px',
          border: '1px solid var(--ds-border, #e8edf5)', boxShadow: '0 2px 8px var(--ds-shadow, rgba(0,51,102,0.06))',
        }}>
          <SectionTitle>{t('dashboard.sections.assetsByCategory')}</SectionTitle>
          {topCategories.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ds-text4, #999)', margin: 0 }}>{t('dashboard.sections.noCategories')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topCategories.map(([name, count]) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: 'var(--ds-text2, #444)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{name}</span>
                    <span style={{ color: 'var(--ds-text, #003366)', fontWeight: 700 }}>{count}</span>
                  </div>
                  <div className="ds-track" style={{ height: 5, borderRadius: 5, backgroundColor: 'var(--ds-border, #e8edf5)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 5,
                      width: `${totalAssets > 0 ? (count / totalAssets) * 100 : 0}%`,
                      backgroundColor: '#0099cc',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Letzte Aktivitäten */}
        {showServiceheft && (
          <div className="ds-panel" style={{
            background: 'var(--ds-surface, white)', borderRadius: 16, padding: '20px',
            border: '1px solid var(--ds-border, #e8edf5)', boxShadow: '0 2px 8px var(--ds-shadow, rgba(0,51,102,0.06))',
            gridColumn: 'span 1',
          }}>
            <SectionTitle>{t('dashboard.sections.recentActivity')}</SectionTitle>
            {!recentEvents || recentEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ds-text4, #999)', margin: 0 }}>{t('dashboard.sections.noActivity')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {(recentEvents as Array<{
                  id: string
                  title: string
                  event_type: string
                  event_date: string
                  assets: { title: string } | null
                }>).map((e, i) => (
                  <div key={e.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 0',
                    borderTop: i > 0 ? '1px solid var(--ds-border2, #f0f4f8)' : 'none',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: 'var(--ds-surface2, #f0f6ff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15,
                    }}>
                      {eventTypeIcon[e.event_type] ?? '📝'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ds-text, #1a2940)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#96aed2' }}>
                        {e.assets?.title ?? '—'}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#aab8cc', flexShrink: 0 }}>
                      {new Date(e.event_date).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Plan & System ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="db-plan">

        {/* Abo-Karte */}
        <div style={{
          background: 'linear-gradient(135deg, #003366 0%, #005599 100%)',
          borderRadius: 16, padding: '20px',
          boxShadow: '0 4px 20px rgba(0,51,102,0.25)',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: 'rgba(0,153,204,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CreditCard size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('dashboard.sections.currentPlan')}</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{planLabel[org?.plan ?? 'free'] ?? org?.plan}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                backgroundColor: org?.subscription_status === 'active' ? '#0099cc' : '#6b7280',
              }}>
                {org?.subscription_status === 'active' ? t('dashboard.plan.active') : t('dashboard.plan.inactive')}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: t('dashboard.plan.assets'), value: `${totalAssets} / ${assetLimit}` },
              { label: t('dashboard.plan.users'), value: org?.user_limit ? `${totalMembers} / ${org.user_limit}` : `${totalMembers} ∞` },
            ].map(f => (
              <div key={f.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{f.value}</div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{f.label}</div>
              </div>
            ))}
          </div>
          <a href="/settings/billing" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 14, padding: '9px', borderRadius: 10,
            background: 'rgba(255,255,255,0.12)',
            color: 'white', textDecoration: 'none',
            fontSize: 12, fontWeight: 700, gap: 6,
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <Zap size={13} /> {t('dashboard.plan.manageBilling')}
          </a>
        </div>

        {/* Schnell-Links */}
        <div className="ds-panel" style={{
          background: 'var(--ds-surface, white)', borderRadius: 16, padding: '20px',
          border: '1px solid var(--ds-border, #e8edf5)', boxShadow: '0 2px 8px var(--ds-shadow, rgba(0,51,102,0.06))',
        }}>
          <SectionTitle>{t('dashboard.sections.quickAccess')}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }} className="db-quicklinks">
            {([
              { href: '/assets/neu', label: t('dashboard.quickLinks.createAsset'), icon: <Package size={16} />, color: '#003366', show: true },
              { href: '/wartung', label: t('dashboard.quickLinks.openMaintenance'), icon: <Wrench size={16} />, color: '#f59e0b', show: showWartung },
              { href: '/scan', label: t('dashboard.quickLinks.scanAsset'), icon: <BarChart3 size={16} />, color: '#0099cc', show: true },
              { href: '/organisation', label: t('dashboard.quickLinks.locations'), icon: <MapPin size={16} />, color: '#8b5cf6', show: true },
              { href: '/teams/chat', label: 'Team-Chat', icon: <MessageSquare size={16} />, color: '#0099cc', show: showTeamchat },
              { href: '/settings/invite', label: t('dashboard.quickLinks.addUser'), icon: <Users size={16} />, color: '#22c55e', show: true },
              { href: '/docs', label: t('dashboard.quickLinks.documentation'), icon: <FileText size={16} />, color: '#96aed2', show: true },
            ] as { href: string; label: string; icon: React.ReactNode; color: string; show: boolean }[])
              .filter(l => l.show)
              .map(l => (
              <a key={l.href} href={l.href} className="ds-quicklink" style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '11px 12px', borderRadius: 10,
                background: 'var(--ds-surface2, #f8faff)', border: '1px solid var(--ds-border, #e8edf5)',
                color: 'var(--ds-text, #1a2940)', textDecoration: 'none',
                fontSize: 13, fontWeight: 600,
                transition: 'background 0.15s',
              }}>
                <span style={{ color: l.color, display: 'flex' }}>{l.icon}</span>
                {l.label}
              </a>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}
