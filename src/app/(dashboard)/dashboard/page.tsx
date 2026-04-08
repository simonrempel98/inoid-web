import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PLANS } from '@/lib/plans'
import { getTranslations, getLocale } from 'next-intl/server'
import {
  Package, Users, Wrench, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, FileText, CreditCard, Activity,
  BarChart3, Zap, MapPin, Calendar,
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
      background: 'white', borderRadius: 16, padding: '20px',
      border: '1px solid #e8edf5',
      boxShadow: '0 2px 8px rgba(0,51,102,0.06)',
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
        <div className="db-stat-val" style={{ fontSize: 28, fontWeight: 800, color: accent ?? '#003366', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: '#555', marginTop: 4, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{sub}</div>}
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
        <span style={{ color: '#555', fontWeight: 600 }}>{value} von {max} genutzt</span>
        <span style={{ fontWeight: 700, color: barColor }}>{pct} %</span>
      </div>
      <div style={{ height: 8, borderRadius: 8, backgroundColor: '#e8edf5', overflow: 'hidden' }}>
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
    .from('profiles').select('organization_id, full_name').eq('id', user.id).single()
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
    supabase.from('organizations').select('name, plan, asset_limit, subscription_status').eq('id', orgId ?? '').single(),
    supabase.from('assets').select('id, status, category, created_at').eq('organization_id', orgId ?? '').is('deleted_at', null),
    supabase.from('organization_members').select('id, created_at').eq('organization_id', orgId ?? ''),
    supabase.from('maintenance_schedules').select('id, next_service_date, is_active').eq('organization_id', orgId ?? '').eq('is_active', true),
    supabase.from('asset_lifecycle_events').select('id, cost_eur, event_date, event_type').eq('organization_id', orgId ?? ''),
    supabase.from('asset_lifecycle_events').select('id, title, event_type, event_date, assets(title)').eq('organization_id', orgId ?? '').order('event_date', { ascending: false }).limit(6),
  ])

  const now = new Date()
  const weekFromNow = new Date(now); weekFromNow.setDate(now.getDate() + 7)
  const thirtyFromNow = new Date(now); thirtyFromNow.setDate(now.getDate() + 30)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // ── KPI-Berechnungen ───────────────────────────────────────────────────────
  const totalAssets = assets?.length ?? 0
  const assetLimit = org?.asset_limit ?? 20
  const assetsActive = assets?.filter(a => a.status === 'active').length ?? 0
  const assetsInService = assets?.filter(a => a.status === 'in_service').length ?? 0
  const assetsDecommissioned = assets?.filter(a => a.status === 'decommissioned').length ?? 0

  // Kategorie-Aufteilung
  const categoryMap: Record<string, number> = {}
  assets?.forEach(a => {
    const k = a.category ?? 'Ohne Kategorie'
    categoryMap[k] = (categoryMap[k] ?? 0) + 1
  })
  const topCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const totalMembers = members?.length ?? 0

  // Wartung
  const overdueSchedules = schedules?.filter(s => s.next_service_date && new Date(s.next_service_date) < now).length ?? 0
  const dueThisWeek = schedules?.filter(s => {
    if (!s.next_service_date) return false
    const d = new Date(s.next_service_date)
    return d >= now && d <= weekFromNow
  }).length ?? 0
  const dueThirtyDays = schedules?.filter(s => {
    if (!s.next_service_date) return false
    const d = new Date(s.next_service_date)
    return d >= now && d <= thirtyFromNow
  }).length ?? 0
  const totalSchedules = schedules?.length ?? 0

  // Kosten
  const costThisMonth = events?.filter(e => e.event_date && new Date(e.event_date) >= startOfMonth)
    .reduce((s, e) => s + (e.cost_eur ?? 0), 0) ?? 0
  const costThisYear = events?.filter(e => e.event_date && new Date(e.event_date) >= startOfYear)
    .reduce((s, e) => s + (e.cost_eur ?? 0), 0) ?? 0
  const totalServiceEntries = events?.length ?? 0

  // Serviceheft diesen Monat
  const entriesThisMonth = events?.filter(e => e.event_date && new Date(e.event_date) >= startOfMonth).length ?? 0

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

  const hour = now.getHours()
  const greetingKey = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const greeting = t(`dashboard.greeting.${greetingKey}`)
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <div style={{ padding: '28px 20px 40px', maxWidth: 1100, fontFamily: 'Arial, sans-serif' }} className="db-wrap">
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

      {/* ── Begrüßung ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#003366', margin: '0 0 4px' }} className="db-greeting">
          {greeting}, {firstName}!
        </h1>
        <p style={{ fontSize: 14, color: '#96aed2', margin: 0 }}>
          {now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {overdueSchedules > 0 && (
            <span style={{ marginLeft: 12, color: '#ef4444', fontWeight: 700 }}>
              · {overdueSchedules > 1
                  ? t('dashboard.overdueWarningPlural', { n: overdueSchedules })
                  : t('dashboard.overdueWarning', { n: overdueSchedules })}
            </span>
          )}
        </p>
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
          sub={plan.user_limit ? t('dashboard.stats.limit', { n: plan.user_limit }) : t('dashboard.stats.unlimited')}
          icon={<Users size={20} />} color="#0099cc" />
        <StatCard label={t('dashboard.stats.overdueServices')} value={overdueSchedules}
          icon={<AlertTriangle size={20} />}
          color={overdueSchedules > 0 ? '#ef4444' : '#22c55e'}
          accent={overdueSchedules > 0 ? '#dc2626' : '#16a34a'}
          trend={overdueSchedules === 0 ? { label: t('dashboard.stats.allDone'), positive: true } : undefined} />
        <StatCard label={t('dashboard.stats.dueThisWeek')} value={dueThisWeek}
          icon={<Clock size={20} />} color="#8b5cf6" accent="#7c3aed" />
        <StatCard label={t('dashboard.stats.serviceEventsMonth')} value={entriesThisMonth}
          sub={t('dashboard.stats.totalSub', { n: totalServiceEntries })}
          icon={<Activity size={20} />} color="#0099cc" />
        <StatCard label={t('dashboard.stats.maintenanceCostYear')} value={`${costThisYear.toFixed(0)} €`}
          sub={t('dashboard.stats.monthSub', { n: costThisMonth.toFixed(0) })}
          icon={<TrendingUp size={20} />} color="#003366" />
      </div>

      {/* ── Mittlere Reihe ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }} className="db-mid">

        {/* Asset-Auslastung */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '20px',
          border: '1px solid #e8edf5', boxShadow: '0 2px 8px rgba(0,51,102,0.06)',
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
                      <span style={{ color: '#444', fontWeight: 600 }}>{s.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: s.color, fontSize: 14 }}>{s.count}</span>
                      <span style={{ color: '#aab8cc', fontSize: 11 }}>{pct} %</span>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, backgroundColor: '#e8edf5', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, backgroundColor: s.color, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Wartungsübersicht */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '20px',
          border: '1px solid #e8edf5', boxShadow: '0 2px 8px rgba(0,51,102,0.06)',
        }}>
          <SectionTitle>{t('dashboard.sections.maintenanceOverview')}</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: t('dashboard.maintenance.overdue'), count: overdueSchedules, color: '#ef4444', bg: '#fef2f2' },
              { label: t('dashboard.maintenance.thisWeek'), count: dueThisWeek, color: '#a855f7', bg: '#faf5ff' },
              { label: t('dashboard.maintenance.next30Days'), count: dueThirtyDays, color: '#8b5cf6', bg: '#f5f3ff' },
              { label: t('dashboard.maintenance.totalIntervals'), count: totalSchedules, color: '#0099cc', bg: '#f0f9ff' },
            ].map(row => (
              <a key={row.label} href="/wartung" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10, backgroundColor: row.bg,
                textDecoration: 'none',
              }}>
                <span style={{ fontSize: 13, color: '#333', fontWeight: 600 }}>{row.label}</span>
                <span style={{
                  fontSize: 18, fontWeight: 800, color: row.color,
                  minWidth: 28, textAlign: 'right',
                }}>{row.count}</span>
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* ── Untere Reihe ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 28 }} className="db-bot">

        {/* Top-Kategorien */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '20px',
          border: '1px solid #e8edf5', boxShadow: '0 2px 8px rgba(0,51,102,0.06)',
        }}>
          <SectionTitle>{t('dashboard.sections.assetsByCategory')}</SectionTitle>
          {topCategories.length === 0 ? (
            <p style={{ fontSize: 13, color: '#999', margin: 0 }}>{t('dashboard.sections.noCategories')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topCategories.map(([name, count]) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: '#444', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{name}</span>
                    <span style={{ color: '#003366', fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 5, backgroundColor: '#e8edf5', overflow: 'hidden' }}>
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
        <div style={{
          background: 'white', borderRadius: 16, padding: '20px',
          border: '1px solid #e8edf5', boxShadow: '0 2px 8px rgba(0,51,102,0.06)',
          gridColumn: 'span 1',
        }}>
          <SectionTitle>{t('dashboard.sections.recentActivity')}</SectionTitle>
          {!recentEvents || recentEvents.length === 0 ? (
            <p style={{ fontSize: 13, color: '#999', margin: 0 }}>{t('dashboard.sections.noActivity')}</p>
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
                  borderTop: i > 0 ? '1px solid #f0f4f8' : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: '#f0f6ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15,
                  }}>
                    {eventTypeIcon[e.event_type] ?? '📝'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2940', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              { label: t('dashboard.plan.users'), value: plan.user_limit ? `${totalMembers} / ${plan.user_limit}` : `${totalMembers} ∞` },
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
        <div style={{
          background: 'white', borderRadius: 16, padding: '20px',
          border: '1px solid #e8edf5', boxShadow: '0 2px 8px rgba(0,51,102,0.06)',
        }}>
          <SectionTitle>{t('dashboard.sections.quickAccess')}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }} className="db-quicklinks">
            {[
              { href: '/assets/neu', label: t('dashboard.quickLinks.createAsset'), icon: <Package size={16} />, color: '#003366' },
              { href: '/wartung', label: t('dashboard.quickLinks.openMaintenance'), icon: <Wrench size={16} />, color: '#f59e0b' },
              { href: '/scan', label: t('dashboard.quickLinks.scanAsset'), icon: <BarChart3 size={16} />, color: '#0099cc' },
              { href: '/organisation', label: t('dashboard.quickLinks.locations'), icon: <MapPin size={16} />, color: '#8b5cf6' },
              { href: '/settings/invite', label: t('dashboard.quickLinks.addUser'), icon: <Users size={16} />, color: '#22c55e' },
              { href: '/docs', label: t('dashboard.quickLinks.documentation'), icon: <FileText size={16} />, color: '#96aed2' },
            ].map(l => (
              <a key={l.href} href={l.href} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '11px 12px', borderRadius: 10,
                background: '#f8faff', border: '1px solid #e8edf5',
                color: '#1a2940', textDecoration: 'none',
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
