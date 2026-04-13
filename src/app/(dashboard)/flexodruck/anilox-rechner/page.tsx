// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AniloxCalculator } from './calculator-client'

export default async function AniloxRechnerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) redirect('/dashboard')

  const { data: org } = await supabase
    .from('organizations')
    .select('features')
    .eq('id', profile.organization_id)
    .single()

  if ((org as any)?.features?.flexodruck !== true) redirect('/dashboard')

  return <AniloxCalculator />
}
