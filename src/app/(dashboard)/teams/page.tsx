import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TeamsTree } from './teams-tree'

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id ?? ''

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, location_id, hall_id, area_id, locations(name), halls(name), areas(name)')
    .eq('organization_id', orgId)
    .order('name')

  return (
    <div style={{ padding: '24px 16px', fontFamily: 'Arial, sans-serif', maxWidth: 560 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000000', margin: 0 }}>Teams</h1>
        <Link href="/teams/neu" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#003366', color: 'white', borderRadius: 50,
          padding: '9px 18px', textDecoration: 'none', fontSize: 13, fontWeight: 700,
        }}>
          + Neues Team
        </Link>
      </div>
      <p style={{ fontSize: 13, color: '#666666', margin: '4px 0 24px' }}>
        Teams verwalten und bearbeiten
      </p>

      <TeamsTree teams={(teams ?? []) as any} />
    </div>
  )
}
