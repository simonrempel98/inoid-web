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

  const orgId = profile.organization_id

  // 1. Vorlage laden (flach)
  const { data: tpl, error } = await supabase
    .from('flexo_templates')
    .select('id, name, description, is_active, created_at, primary_machine_id')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error || !tpl) notFound()

  // 2. Maschine laden
  const { data: machine } = await supabase
    .from('flexo_machines')
    .select('id, name, num_druckwerke')
    .eq('id', tpl.primary_machine_id)
    .single()

  // 3. Druckwerke laden
  const { data: druckwerkeRaw } = machine
    ? await supabase
        .from('flexo_druckwerke')
        .select('id, position, label, color_hint')
        .eq('machine_id', machine.id)
        .order('position')
    : { data: [] }

  const druckwerke = druckwerkeRaw ?? []

  // 4. Template-Slots laden
  const { data: slotsRaw } = await supabase
    .from('flexo_template_slots')
    .select('id, label, sort_order')
    .eq('template_id', id)
    .order('sort_order')

  const slots = slotsRaw ?? []

  // 5. Assignments laden
  const { data: assignmentsRaw } = await supabase
    .from('flexo_template_assignments')
    .select('id, druckwerk_id, slot_id, asset_id, notes')
    .eq('template_id', id)

  // 6. Asset-Namen für belegte Assignments laden
  const assetIds = [...new Set((assignmentsRaw ?? []).map((a: any) => a.asset_id).filter(Boolean))]
  const { data: assignmentAssets } = assetIds.length > 0
    ? await supabase.from('assets').select('id, title, serial_number').in('id', assetIds)
    : { data: [] }
  const assetMap = Object.fromEntries((assignmentAssets ?? []).map((a: any) => [a.id, a]))

  const assignments: Record<string, { asset_id: string | null; asset_name: string | null; serial_number: string | null }> = {}
  for (const a of (assignmentsRaw ?? [])) {
    const key = `${a.slot_id}__${a.druckwerk_id}`
    const asset = a.asset_id ? assetMap[a.asset_id] : null
    assignments[key] = {
      asset_id: a.asset_id,
      asset_name: asset?.title ?? null,
      serial_number: asset?.serial_number ?? null,
    }
  }

  // 7. Assets für Dropdown
  const { data: assetsRaw } = await supabase
    .from('assets')
    .select('id, title, serial_number')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('title')
    .limit(500)
  const assets = (assetsRaw ?? []).map((a: any) => ({ ...a, name: a.title }))

  const canEdit = ['admin', 'superadmin', 'technician'].includes(profile.app_role)

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
      assets={assets}
      canEdit={canEdit}
      orgId={orgId}
      sharedMachines={[]}
    />
  )
}
