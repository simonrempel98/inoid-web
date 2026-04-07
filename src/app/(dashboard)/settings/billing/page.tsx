import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PLANS } from '@/lib/plans'
import BillingClient from './billing-client'

export default async function BillingPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user.id).single()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, plan, asset_limit, subscription_status')
    .eq('id', profile?.organization_id ?? '')
    .single()

  const { data: invoices } = await db
    .from('invoices')
    .select('*')
    .eq('organization_id', profile?.organization_id ?? '')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <BillingClient
      currentPlan={org?.plan ?? 'free'}
      orgName={org?.name ?? ''}
      subscriptionStatus={org?.subscription_status ?? null}
      plans={PLANS}
      invoices={invoices ?? []}
    />
  )
}
