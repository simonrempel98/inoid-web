// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PLANS } from '@/lib/plans'
import { ROLE_COLORS, ROLE_BG, type AppRole } from '@/lib/permissions'
import { getTranslations, getLocale } from 'next-intl/server'
import {
  Package, Users, Wrench, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, FileText, CreditCard, Activity,
  BarChart3, Zap, MapPin, MessageSquare, Cpu, Bot,
  Printer, ChevronRight, Calendar, BookOpen, Wifi,
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
}

type ModuleCardProps = {
  href: string
  icon: React.ReactNode
  color: string
  title: string
  desc: string
  stat?: string | number
  statLabel?: string
  alert?: boolean
}

type ProgressBarProps = { value: number; max: number; color?: string }

// ── Sub-Komponenten ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color, accent, trend }: StatCardProps) {
  return (
    <div className="db-stat-card" style={{
      background: 'var(--ds-surface, white)', borderRadius: 14, padding: '18px',
      border: '1px solid var(--ds-border, #e8edf5)',
      boxShadow: '0 1px 4px var(--ds-shadow, rgba(0,51,102,0.05))',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          backgroundColor: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 20,
            backgroundColor: trend.positive ? '#dcfce7' : '#fee2e2',
            color: trend.positive ? '#166534' : '#991b1b',
          }}>
            {trend.label}
          </span>
        )}
      </div>
      <div>
        <div className="db-stat-val" style={{
          fontSize: 26, fontWeight: 800,
          color: accent ?? 'var(--ds-text, #003366)', lineHeight: 1,
        }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ds-text3, #555)', marginTop: 3, fontWeight: 600 }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: 'var(--ds-text4, #999)', marginTop: 2 }}>{sub}</div>
        )}
      </div>
    </div>
  )
}

function ModuleCard({ href, icon, color, title, desc, stat, statLabel, alert }: ModuleCardProps) {
  return (
    <a href={href} className="db-module-card" style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--ds-surface, white)', borderRadius: 16,
      border: `1px solid var(--ds-border, #e8edf5)`,
      boxShadow: '0 1px 4px var(--ds-shadow, rgba(0,51,102,0.05))',
      padding: '20px', textDecoration: 'none',
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    }}>
      {/* Top color accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: color, borderRadius: '16px 16px 0 0',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {stat !== undefined && (
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 28, fontWeight: 800, lineHeight: 1,
              color: alert ? '#ef4444' : color,
            }}>{stat}</div>
            {statLabel && (
              <div style={{
                fontSize: 10, color: 'var(--ds-text4, #aaa)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2,
              }}>{statLabel}</div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{
        fontSize: 15, fontWeight: 700,
        color: 'var(--ds-text, #1a2940)', marginBottom: 5,
      }}>{title}</div>
      <div style={{
        fontSize: 12, color: 'var(--ds-text3, #6b7280)',
        lineHeight: 1.55, flex: 1,
      }}>{desc}</div>

      {/* Footer */}
      <div style={{
        marginTop: 16, display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 12, fontWeight: 700, color,
      }}>
        <span>Öffnen</span>
        <ChevronRight size={14} />
      </div>
    </a>
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
      <div className="ds-track" style={{
        height: 7, borderRadius: 7,
        backgroundColor: 'var(--ds-border, #e8edf5)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 7,
          backgroundColor: barColor, transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 10, fontWeight: 700, color: '#96aed2',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6,
    }}>
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
    .from('profiles')
    .select('organization_id, full_name, app_role, is_platform_admin')
    .eq('id', user.id).single()
  const orgId = profile?.organization_id

  // ── Org-Daten + Features + Assets laden ────────────────────────────────────
  const [{ data: org }, { data: assets }] = await Promise.all([
    supabase.from('organizations')
      .select('name, plan, asset_limit, user_limit, subscription_status, features')
      .eq('id', orgId ?? '').single(),
    db.from('assets')
      .select('id, status, category, created_at')
      .eq('organization_id', orgId ?? '').is('deleted_at', null),
  ])

  const features = (org?.features as Record<string, boolean>) ?? {}
  const showWartung     = features.wartung     !== false
  const showServiceheft = features.serviceheft !== false
  const showTeamchat    = features.teamchat    !== false
  const showSensorik    = features.sensorik    === true
  const showFlexodruck  = features.flexodruck  === true
  const showInoai       = features.inoai       === true

  const assetIds = (assets ?? []).map((a: { id: string }) => a.id)

  // ── Restliche Daten parallel laden ────────────────────────────────────────
  const [
    { data: members },
    { data: schedules },
    { data: events },
    { data: recentEvents },
    { data: activeSensors },
    { data: flexoMachines },
  ] = await Promise.all([
    supabase.from('organization_members')
      .select('id, created_at').eq('organization_id', orgId ?? ''),
    db.from('maintenance_schedules')
      .select('id, next_service_date, is_active')
      .eq('organization_id', orgId ?? '').eq('is_active', true),
    db.from('asset_lifecycle_events')
      .select('id, cost_eur, event_date, event_type')
      .eq('organization_id', orgId ?? ''),
    db.from('asset_lifecycle_events')
      .select('id, title, event_type, event_date, assets(title)')
      .eq('organization_id', orgId ?? '')
      .order('event_date', { ascending: false }).limit(5),
    showSensorik && assetIds.length > 0
      ? db.from('sensors').select('id').eq('is_active', true).in('asset_id', assetIds)
      : Promise.resolve({ data: [] }),
    showFlexodruck
      ? db.from('flexo_machines').select('id').eq('org_id', orgId ?? '').eq('is_active', true)
      : Promise.resolve({ data: [] }),
  ])

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear  = new Date(now.getFullYear(), 0, 1)
  const nowStr      = now.toISOString().slice(0, 10)
  const weekStr     = new Date(now.getTime() + 7  * 86400000).toISOString().slice(0, 10)
  const thirtyStr   = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10)

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalAssets        = assets?.length ?? 0
  const assetLimit         = org?.asset_limit ?? 20
  const assetsActive       = assets?.filter(a => a.status === 'active').length ?? 0
  const assetsInService    = assets?.filter(a => a.status === 'in_service').length ?? 0
  const assetsDecommissioned = assets?.filter(a => a.status === 'decommissioned').length ?? 0

  const categoryMap: Record<string, number> = {}
  assets?.forEach(a => { const k = a.category ?? '–'; categoryMap[k] = (categoryMap[k] ?? 0) + 1 })
  const topCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const totalMembers       = members?.length ?? 0
  const overdueSchedules   = schedules?.filter(s => s.next_service_date && s.next_service_date < nowStr).length ?? 0
  const dueThisWeek        = schedules?.filter(s => s.next_service_date && s.next_service_date >= nowStr && s.next_service_date <= weekStr).length ?? 0
  const dueThirtyDays      = schedules?.filter(s => s.next_service_date && s.next_service_date >= nowStr && s.next_service_date <= thirtyStr).length ?? 0
  const totalSchedules     = schedules?.length ?? 0
  const costThisMonth      = events?.filter(e => e.event_date && new Date(e.event_date) >= startOfMonth).reduce((s, e) => s + (e.cost_eur ?? 0), 0) ?? 0
  const costThisYear       = events?.filter(e => e.event_date && new Date(e.event_date) >= startOfYear).reduce((s, e) => s + (e.cost_eur ?? 0), 0) ?? 0
  const totalServiceEntries = events?.length ?? 0
  const entriesThisMonth   = events?.filter(e => e.event_date && new Date(e.event_date) >= startOfMonth).length ?? 0
  const activeSensorCount  = activeSensors?.length ?? 0
  const flexoMachineCount  = flexoMachines?.length ?? 0

  const plan      = PLANS.find(p => p.id === org?.plan) ?? PLANS[0]
  const planLabel: Record<string, string> = {
    free: 'Free', starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise',
  }

  const statusColor: Record<string, string> = {
    active: '#22c55e', in_service: '#f59e0b', decommissioned: '#94a3b8',
  }

  const eventTypeIcon: Record<string, string> = {
    maintenance: '🔧', repair: '🛠️', inspection: '🔍', cleaning: '🧹',
    overhaul: '⚙️', installation: '📦', incident: '⚠️', other: '📝',
  }

  const t = await getTranslations()
  const locale = await getLocale()

  const appRole = (profile?.app_role ?? 'leser') as AppRole
  const ROLE_LABEL_MAP: Record<AppRole, string> = {
    superadmin: 'Superadmin', admin: 'Admin', techniker: 'Techniker', leser: 'Leser',
  }
  const roleLabel = profile?.is_platform_admin ? 'Superadmin' : (ROLE_LABEL_MAP[appRole] ?? appRole)

  // Welche Module sollen als Kacheln erscheinen?
  const moduleCards = [
    {
      show: showWartung,
      href: '/wartung',
      icon: <Calendar size={22} />,
      color: '#f59e0b',
      title: 'Wartung',
      desc: 'Wartungspläne, Intervalle & fällige Aufgaben im Überblick',
      stat: overdueSchedules > 0 ? overdueSchedules : totalSchedules,
      statLabel: overdueSchedules > 0 ? 'Überfällig' : 'Pläne aktiv',
      alert: overdueSchedules > 0,
    },
    {
      show: showServiceheft,
      href: '/assets',
      icon: <BookOpen size={22} />,
      color: '#0099cc',
      title: 'Serviceheft',
      desc: 'Serviceeinträge, Reparaturen & Wartungshistorie pro Asset',
      stat: entriesThisMonth,
      statLabel: 'Einträge/Monat',
      alert: false,
    },
    {
      show: showTeamchat,
      href: '/teams/chat',
      icon: <MessageSquare size={22} />,
      color: '#22c55e',
      title: 'Team-Chat',
      desc: 'Teaminterne Kommunikation mit Asset-Erwähnungen & 30 Tage Verlauf',
      stat: undefined,
      statLabel: undefined,
      alert: false,
    },
    {
      show: showSensorik,
      href: '/assets',
      icon: <Cpu size={22} />,
      color: '#8b5cf6',
      title: 'Sensorik',
      desc: 'Echtzeit-Messdaten: Temperatur, Vibration, Druck, Drehzahl u.v.m.',
      stat: activeSensorCount,
      statLabel: 'Sensoren aktiv',
      alert: false,
    },
    {
      show: showFlexodruck,
      href: '/flexodruck',
      icon: <Printer size={22} />,
      color: '#ec4899',
      title: 'Flexodruck',
      desc: 'Druckmaschinen, Setup-Vorlagen, Rüstvorgänge & Anilox-Rechner',
      stat: flexoMachineCount,
      statLabel: 'Maschinen',
      alert: false,
    },
    {
      show: showInoai,
      href: '/inoai',
      icon: <Bot size={22} />,
      color: '#6366f1',
      title: 'INOai',
      desc: 'KI-Produktassistent auf Basis der INOMETA-Wissensbasis',
      stat: undefined,
      statLabel: undefined,
      alert: false,
    },
  ].filter(m => m.show)

  return (
    <div
      style={{
        padding: '28px 24px 60px',
        maxWidth: 1140,
        fontFamily: 'Arial, sans-serif',
        background: 'var(--ds-bg)',
        minHeight: '100vh',
      }}
      className="db-wrap ds-page-bg"
    >
      <style>{`
        /* ── Hover-Effekte ── */
        .db-module-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--ds-shadow, rgba(0,51,102,0.10)) !important;
        }
        .ds-quicklink:hover {
          background: var(--ds-surface3, #eef2ff) !important;
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .db-wrap { padding: 16px 14px 48px !important; }
          .db-greeting { font-size: 18px !important; }
          .db-kpi { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .db-stat-card { padding: 14px !important; gap: 8px !important; }
          .db-stat-val { font-size: 22px !important; }
          .db-modules { grid-template-columns: 1fr !important; gap: 10px !important; }
          .db-mid { grid-template-columns: 1fr !important; }
          .db-bot { grid-template-columns: 1fr !important; }
          .db-plan { grid-template-columns: 1fr !important; }
          .db-quicklinks { grid-template-columns: 1fr 1fr !important; }
          .db-section-gap { margin-bottom: 20px !important; }
          .db-module-card { padding: 16px !important; }
        }
        @media (min-width: 641px) and (max-width: 860px) {
          .db-kpi { grid-template-columns: repeat(3, 1fr) !important; }
          .db-modules { grid-template-columns: repeat(2, 1fr) !important; }
          .db-mid { grid-template-columns: 1fr !important; }
          .db-bot { grid-template-columns: 1fr !important; }
          .db-plan { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 861px) and (max-width: 1060px) {
          .db-modules { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: 28, display: 'flex',
        alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{ fontSize: 20, fontWeight: 800, color: 'var(--ds-text, #1a2940)', letterSpacing: '-0.01em' }}
              className="db-greeting"
            >
              {profile?.full_name
                ? `Hallo, ${profile.full_name.split(' ')[0]}`
                : user.email}
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
            {showWartung && overdueSchedules > 0 && (
              <span style={{ marginLeft: 8, color: '#ef4444', fontWeight: 700 }}>
                · {overdueSchedules} überfällige Wartung{overdueSchedules !== 1 ? 'en' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── KPI-Grid ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12, marginBottom: 28,
        }}
        className="db-kpi db-section-gap"
      >
        <StatCard
          label={t('dashboard.stats.assetsTotal')} value={totalAssets}
          sub={t('dashboard.stats.limit', { n: assetLimit })}
          icon={<Package size={18} />} color="#003366"
        />
        <StatCard
          label={t('dashboard.stats.active')} value={assetsActive}
          sub={totalAssets > 0 ? `${Math.round((assetsActive / totalAssets) * 100)} %` : '—'}
          icon={<CheckCircle2 size={18} />} color="#22c55e" accent="#16a34a"
        />
        <StatCard
          label={t('dashboard.stats.inService')} value={assetsInService}
          sub={totalAssets > 0 ? `${Math.round((assetsInService / totalAssets) * 100)} %` : '—'}
          icon={<Wrench size={18} />} color="#f59e0b" accent="#d97706"
        />
        <StatCard
          label={t('dashboard.stats.users')} value={totalMembers}
          sub={org?.user_limit ? `max. ${org.user_limit}` : '∞'}
          icon={<Users size={18} />} color="#0099cc"
        />
        {showWartung && (
          <StatCard
            label="Überfällig" value={overdueSchedules}
            icon={<AlertTriangle size={18} />}
            color={overdueSchedules > 0 ? '#ef4444' : '#22c55e'}
            accent={overdueSchedules > 0 ? '#dc2626' : '#16a34a'}
            trend={overdueSchedules === 0 ? { label: '✓ Alles erledigt', positive: true } : undefined}
          />
        )}
        {showWartung && (
          <StatCard
            label="Diese Woche fällig" value={dueThisWeek}
            icon={<Clock size={18} />} color="#8b5cf6" accent="#7c3aed"
          />
        )}
        {showServiceheft && (
          <StatCard
            label="Serviceeinträge" value={entriesThisMonth}
            sub={`${totalServiceEntries} gesamt`}
            icon={<Activity size={18} />} color="#0099cc"
          />
        )}
        {showServiceheft && (
          <StatCard
            label="Kosten dieses Jahr" value={`${costThisYear.toFixed(0)} €`}
            sub={`${costThisMonth.toFixed(0)} € diesen Monat`}
            icon={<TrendingUp size={18} />} color="#003366"
          />
        )}
      </div>

      {/* ── Module-Kacheln ──────────────────────────────────────────────────── */}
      {moduleCards.length > 0 && (
        <div style={{ marginBottom: 28 }} className="db-section-gap">
          <SectionTitle>Deine Module</SectionTitle>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}
            className="db-modules"
          >
            {moduleCards.map(m => (
              <ModuleCard
                key={m.href + m.title}
                href={m.href}
                icon={m.icon}
                color={m.color}
                title={m.title}
                desc={m.desc}
                stat={m.stat}
                statLabel={m.statLabel}
                alert={m.alert}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Mittlere Reihe: Auslastung + Wartungsübersicht ──────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showWartung ? '1fr 1fr' : '1fr',
          gap: 12, marginBottom: 28,
        }}
        className="db-mid db-section-gap"
      >
        {/* Asset-Auslastung */}
        <div className="ds-panel" style={{
          background: 'var(--ds-surface, white)', borderRadius: 14, padding: '20px',
          border: '1px solid var(--ds-border, #e8edf5)',
          boxShadow: '0 1px 4px var(--ds-shadow, rgba(0,51,102,0.05))',
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
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                      <span style={{ color: 'var(--ds-text2, #444)', fontWeight: 600 }}>{s.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: s.color, fontSize: 13 }}>{s.count}</span>
                      <span style={{ color: 'var(--ds-text4, #aab8cc)', fontSize: 11 }}>{pct} %</span>
                    </div>
                  </div>
                  <div className="ds-track" style={{
                    height: 5, borderRadius: 5,
                    backgroundColor: 'var(--ds-border, #e8edf5)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: 5,
                      backgroundColor: s.color, transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Wartungsübersicht */}
        {showWartung && (
          <div className="ds-panel" style={{
            background: 'var(--ds-surface, white)', borderRadius: 14, padding: '20px',
            border: '1px solid var(--ds-border, #e8edf5)',
            boxShadow: '0 1px 4px var(--ds-shadow, rgba(0,51,102,0.05))',
          }}>
            <SectionTitle>{t('dashboard.sections.maintenanceOverview')}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                  <span style={{ fontSize: 13, color: 'var(--ds-text2, #333)', fontWeight: 600 }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: row.color, minWidth: 28, textAlign: 'right' }}>
                    {row.count}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Untere Reihe: Kategorien + letzte Aktivitäten ───────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showServiceheft ? '1fr 2fr' : '1fr',
          gap: 12, marginBottom: 28,
        }}
        className="db-bot db-section-gap"
      >
        {/* Top-Kategorien */}
        <div className="ds-panel" style={{
          background: 'var(--ds-surface, white)', borderRadius: 14, padding: '20px',
          border: '1px solid var(--ds-border, #e8edf5)',
          boxShadow: '0 1px 4px var(--ds-shadow, rgba(0,51,102,0.05))',
        }}>
          <SectionTitle>{t('dashboard.sections.assetsByCategory')}</SectionTitle>
          {topCategories.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ds-text4, #999)', margin: 0 }}>
              {t('dashboard.sections.noCategories')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topCategories.map(([name, count]) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
                    <span style={{
                      color: 'var(--ds-text2, #444)', fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%',
                    }}>{name}</span>
                    <span style={{ color: 'var(--ds-text, #003366)', fontWeight: 700 }}>{count}</span>
                  </div>
                  <div className="ds-track" style={{
                    height: 4, borderRadius: 4,
                    backgroundColor: 'var(--ds-border, #e8edf5)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${totalAssets > 0 ? (count / totalAssets) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #0099cc, #003366)',
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
            background: 'var(--ds-surface, white)', borderRadius: 14, padding: '20px',
            border: '1px solid var(--ds-border, #e8edf5)',
            boxShadow: '0 1px 4px var(--ds-shadow, rgba(0,51,102,0.05))',
          }}>
            <SectionTitle>{t('dashboard.sections.recentActivity')}</SectionTitle>
            {!recentEvents || recentEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ds-text4, #999)', margin: 0 }}>
                {t('dashboard.sections.noActivity')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(recentEvents as Array<{
                  id: string; title: string; event_type: string
                  event_date: string; assets: { title: string } | null
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
                      fontSize: 14,
                    }}>
                      {eventTypeIcon[e.event_type] ?? '📝'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700, color: 'var(--ds-text, #1a2940)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
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

      {/* ── Plan & Schnelllinks ──────────────────────────────────────────────── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        className="db-plan"
      >
        {/* Abo-Karte */}
        <div style={{
          background: 'linear-gradient(135deg, #003366 0%, #005599 100%)',
          borderRadius: 16, padding: '20px',
          boxShadow: '0 4px 20px rgba(0,51,102,0.22)',
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
              <div style={{ fontSize: 10, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {t('dashboard.sections.currentPlan')}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>
                {planLabel[org?.plan ?? 'free'] ?? org?.plan}
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                backgroundColor: org?.subscription_status === 'active' ? '#0099cc' : '#6b7280',
              }}>
                {org?.subscription_status === 'active'
                  ? t('dashboard.plan.active')
                  : t('dashboard.plan.inactive')}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: t('dashboard.plan.assets'), value: `${totalAssets} / ${assetLimit}` },
              { label: t('dashboard.plan.users'), value: org?.user_limit ? `${totalMembers} / ${org.user_limit}` : `${totalMembers} ∞` },
            ].map(f => (
              <div key={f.label} style={{
                background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{f.value}</div>
                <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>{f.label}</div>
              </div>
            ))}
          </div>
          <a href="/settings/billing" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 14, padding: '9px', borderRadius: 10,
            background: 'rgba(255,255,255,0.1)',
            color: 'white', textDecoration: 'none',
            fontSize: 12, fontWeight: 700, gap: 6,
            border: '1px solid rgba(255,255,255,0.18)',
          }}>
            <Zap size={13} /> {t('dashboard.plan.manageBilling')}
          </a>
        </div>

        {/* Schnell-Links */}
        <div className="ds-panel" style={{
          background: 'var(--ds-surface, white)', borderRadius: 16, padding: '20px',
          border: '1px solid var(--ds-border, #e8edf5)',
          boxShadow: '0 1px 4px var(--ds-shadow, rgba(0,51,102,0.05))',
        }}>
          <SectionTitle>{t('dashboard.sections.quickAccess')}</SectionTitle>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
            className="db-quicklinks"
          >
            {([
              { href: '/assets/neu', label: t('dashboard.quickLinks.createAsset'), icon: <Package size={15} />, color: '#003366', show: true },
              { href: '/wartung', label: t('dashboard.quickLinks.openMaintenance'), icon: <Calendar size={15} />, color: '#f59e0b', show: showWartung },
              { href: '/scan', label: t('dashboard.quickLinks.scanAsset'), icon: <BarChart3 size={15} />, color: '#0099cc', show: true },
              { href: '/organisation', label: t('dashboard.quickLinks.locations'), icon: <MapPin size={15} />, color: '#8b5cf6', show: true },
              { href: '/teams/chat', label: 'Team-Chat', icon: <MessageSquare size={15} />, color: '#22c55e', show: showTeamchat },
              { href: '/flexodruck', label: 'Flexodruck', icon: <Printer size={15} />, color: '#ec4899', show: showFlexodruck },
              { href: '/inoai', label: 'INOai', icon: <Bot size={15} />, color: '#6366f1', show: showInoai },
              { href: '/settings/invite', label: t('dashboard.quickLinks.addUser'), icon: <Users size={15} />, color: '#22c55e', show: true },
              { href: '/docs', label: t('dashboard.quickLinks.documentation'), icon: <FileText size={15} />, color: '#96aed2', show: true },
            ] as { href: string; label: string; icon: React.ReactNode; color: string; show: boolean }[])
              .filter(l => l.show)
              .map(l => (
                <a key={l.href} href={l.href} className="ds-quicklink" style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 11px', borderRadius: 10,
                  background: 'var(--ds-surface2, #f8faff)',
                  border: '1px solid var(--ds-border, #e8edf5)',
                  color: 'var(--ds-text, #1a2940)', textDecoration: 'none',
                  fontSize: 12, fontWeight: 600,
                  transition: 'background 0.15s',
                }}>
                  <span style={{ color: l.color, display: 'flex', flexShrink: 0 }}>{l.icon}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.label}
                  </span>
                </a>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
