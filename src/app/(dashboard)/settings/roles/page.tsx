import { createClient } from '@/lib/supabase/server'
import { getRole } from '@/lib/get-role'
import { RolesManager } from './roles-manager'
import type { AppRole } from '@/lib/permissions'
import { getTranslations } from 'next-intl/server'

export default async function RolesPage() {
  const supabase = await createClient()
  const t = await getTranslations()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, app_role')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.organization_id ?? ''
  const currentRole = (profile?.app_role as AppRole) ?? 'leser'

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, app_role')
    .eq('organization_id', orgId)
    .order('full_name')

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '24px 16px', maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000', margin: '0 0 4px' }}>
        {t('nav.roles')}
      </h1>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 24px' }}>
        {t('roles.subtitle')}
      </p>

      <RolesManager
        members={(members ?? []) as { id: string; full_name: string | null; email: string; app_role: AppRole }[]}
        currentUserId={user!.id}
        isAdmin={currentRole === 'admin'}
      />
    </div>
  )
}
