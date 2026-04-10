// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TemplateDetailClient } from './template-detail-client'

export default async function VorlageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role').eq('id', user.id).single()
  if (!profile?.organization_id) redirect('/dashboard')

  // Vorlage mit allen Relations laden
  const { data: tpl, error } = await supabase
    .from('flexo_templates')
    .select(`
      id, name, description, is_active, created_at,
      primary_machine_id,
      flexo_machines!primary_machine_id(id, name, num_druckwerke,
        flexo_druckwerke(id, position, label, color_hint)
      ),
      flexo_template_slots(id, label, sort_order),
      flexo_template_assignments(
        id, druckwerk_id, slot_id, asset_id, notes,
        assets(id, name, serial_number)
      ),
      flexo_template_machines(
        machine_id,
        flexo_machines(id, name)
      )
    `)
    .eq('id', id)
    .eq('org_id', profile.organization_id)
    .single()

  if (error || !tpl) notFound()

  // Assets für Dropdown
  const { data: assets } = await supabase
    .from('assets')
    .select('id, name, serial_number')
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .order('name')
    .limit(500)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canEdit = ['admin', 'superadmin', 'technician'].includes((profile as any).app_role)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const machine = (tpl as any).flexo_machines
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const druckwerke = [...(machine?.flexo_druckwerke ?? [])].sort((a: { position: number }, b: { position: number }) => a.position - b.position)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slots = [...((tpl as any).flexo_template_slots ?? [])].sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignments: Record<string, { asset_id: string | null; asset_name: string | null; serial_number: string | null }> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const a of ((tpl as any).flexo_template_assignments ?? [])) {
    const key = `${a.slot_id}__${a.druckwerk_id}`
    assignments[key] = {
      asset_id: a.asset_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      asset_name: (a as any).assets?.name ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serial_number: (a as any).assets?.serial_number ?? null,
    }
  }

  return (
    <TemplateDetailClient
      templateId={id}
      templateName={tpl.name}
      templateDescription={tpl.description}
      isActive={tpl.is_active}
      machineId={machine?.id}
      machineName={machine?.name ?? ''}
      druckwerke={druckwerke}
      slots={slots}
      assignments={assignments}
      assets={assets ?? []}
      canEdit={canEdit}
      orgId={profile.organization_id}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sharedMachines={(tpl as any).flexo_template_machines?.map((tm: any) => tm.flexo_machines?.name).filter(Boolean) ?? []}
    />
  )
}
