import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CompleteForm } from './complete-form'

export default async function WillkommenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, organization_id')
    .eq('id', user.id)
    .single()

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile?.organization_id ?? '')
    .single()

  return (
    <CompleteForm
      email={user.email ?? ''}
      orgName={org?.name ?? ''}
      defaultName={profile?.full_name ?? ''}
    />
  )
}
