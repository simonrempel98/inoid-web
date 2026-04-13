import { createAdminClient } from '@/lib/supabase/admin'
import { SensorDemoPanel, type SensorRow } from './sensor-demo-panel'

export default async function AdminSensorsPage() {
  const supabase = createAdminClient()

  // Alle aktiven Sensoren mit Asset- und Org-Infos
  const { data: sensors } = await supabase
    .from('sensors')
    .select(`
      id, name, type, unit,
      assets ( name ),
      organizations ( name, sensor_api_key )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Letzter Messwert pro Sensor
  const sensorIds = (sensors ?? []).map(s => s.id)
  const latestMap: Record<string, { value: number; recorded_at: string }> = {}

  if (sensorIds.length > 0) {
    // Für jeden Sensor den neuesten Wert holen
    const { data: readings } = await supabase
      .from('sensor_readings')
      .select('sensor_id, value, recorded_at')
      .in('sensor_id', sensorIds)
      .order('recorded_at', { ascending: false })

    // Ersten (neuesten) Wert pro Sensor merken
    for (const r of readings ?? []) {
      if (!latestMap[r.sensor_id]) {
        latestMap[r.sensor_id] = { value: Number(r.value), recorded_at: r.recorded_at }
      }
    }
  }

  const rows: SensorRow[] = (sensors ?? []).map(s => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asset = (s.assets as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const org   = (s.organizations as any)
    const latest = latestMap[s.id]
    return {
      id:          s.id,
      name:        s.name,
      type:        s.type,
      unit:        s.unit,
      asset_name:  asset?.name ?? '–',
      org_name:    org?.name  ?? '–',
      org_api_key: org?.sensor_api_key ?? '',
      latestValue: latest ? latest.value : null,
      latestAt:    latest ? latest.recorded_at : null,
    }
  })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')

  // Statistiken
  const orgCount   = new Set(rows.map(r => r.org_name)).size
  const liveCount  = rows.filter(r => r.latestAt &&
    Date.now() - new Date(r.latestAt).getTime() < 5 * 60 * 1000
  ).length

  return (
    <div>
      <div className="adm-page-header" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--adm-text)', margin: '0 0 4px' }}>
            Sensoren
          </h1>
          <p style={{ fontSize: 13, color: 'var(--adm-text3)', margin: 0 }}>
            {rows.length} Sensoren · {orgCount} Organisationen · {liveCount} live
          </p>
        </div>
      </div>

      {/* KPI-Kacheln */}
      <div className="rg-3" style={{ display: 'grid', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Sensoren gesamt', value: rows.length, color: '#0099cc' },
          { label: 'Live (< 5 min)',  value: liveCount,   color: '#27AE60' },
          { label: 'Offline',         value: rows.length - liveCount, color: '#ef4444' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: 'var(--adm-surface)', borderRadius: 14,
            border: '1px solid var(--adm-border)', padding: '18px 20px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text3)', margin: '0 0 6px',
              textTransform: 'uppercase', letterSpacing: '0.04em' }}>{kpi.label}</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: kpi.color, margin: 0 }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Demo-Panel (Client Component) */}
      <div style={{
        background: 'var(--adm-surface)', borderRadius: 16,
        border: '1px solid var(--adm-border)', padding: '20px 24px',
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text3)', margin: '0 0 16px',
          textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Test-Daten senden
        </p>
        <SensorDemoPanel initialSensors={rows} appUrl={appUrl} />
      </div>
    </div>
  )
}
