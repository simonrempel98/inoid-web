// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TemplateEditClient } from './template-edit-client'

export default async function VorlageBearbeitenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role').eq('id', user.id).single()
  if (!['admin', 'superadmin'].includes(profile?.app_role ?? '')) redirect(`/flexodruck/vorlagen/${id}`)

  const orgId = profile!.organization_id

  const { data: tpl, error } = await supabase
    .from('flexo_templates')
    .select('id, name, description, is_active, primary_machine_id')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error || !tpl) notFound()

  const { data: machine } = await supabase
    .from('flexo_machines')
    .select('id, name')
    .eq('id', tpl.primary_machine_id)
    .single()

  return (
    <TemplateEditClient
      templateId={id}
      initialName={tpl.name}
      initialDescription={tpl.description ?? ''}
      initialIsActive={tpl.is_active}
      machineId={machine?.id ?? ''}
      machineName={machine?.name ?? ''}
    />
  )
}
