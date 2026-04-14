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

  // 1. Vorlage laden
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

  // 3. Druckwerke laden (alle der Maschine)
  const { data: druckwerkeRaw } = machine
    ? await supabase
        .from('flexo_druckwerke')
        .select('id, position, label, color_hint')
        .eq('machine_id', machine.id)
        .order('position')
    : { data: [] }

  // 3b. Nur die im Setup ausgewählten Druckwerke anzeigen
  const { data: includedDWs } = await supabase
    .from('flexo_template_assignments')
    .select('druckwerk_id')
    .eq('template_id', id)

  const includedIds = new Set((includedDWs ?? []).map((a: any) => a.druckwerk_id))
  const druckwerke = (druckwerkeRaw ?? []).filter(dw => includedIds.has(dw.id))

  // 4. Template-Slots laden
  const { data: slotsRaw } = await supabase
    .from('flexo_template_slots')
    .select('id, label, sort_order')
    .eq('template_id', id)
    .order('sort_order')

  const slots = slotsRaw ?? []

  // 5. Zell-Assets laden (mehrere Assets pro Zelle)
  const { data: cellAssetsRaw } = await supabase
    .from('flexo_template_cell_assets')
    .select('slot_id, druckwerk_id, asset_id')
    .eq('template_id', id)
    .order('sort_order')

  // 6. Asset-Details laden
  const assetIds = [...new Set((cellAssetsRaw ?? []).map((ca: any) => ca.asset_id))]
  const { data: assetDetails } = assetIds.length > 0
    ? await supabase.from('assets').select('id, title, serial_number').in('id', assetIds)
    : { data: [] }

  const assetMap = Object.fromEntries((assetDetails ?? []).map((a: any) => [a.id, a]))

  // assignments: key = `${slot_id}__${druckwerk_id}` → [{ id, name, serial_number }]
  const assignments: Record<string, { id: string; name: string; serial_number: string | null }[]> = {}
  for (const ca of (cellAssetsRaw ?? [])) {
    const key = `${ca.slot_id}__${ca.druckwerk_id}`
    if (!assignments[key]) assignments[key] = []
    const a = assetMap[ca.asset_id]
    if (a) assignments[key].push({ id: ca.asset_id, name: a.title, serial_number: a.serial_number ?? null })
  }

  // 7. Assets für Dropdown
  const { data: assetsRaw } = await supabase
    .from('assets')
    .select('id, title, serial_number')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('title')
    .limit(500)
  const assets = (assetsRaw ?? []).map((a: any) => ({ id: a.id, name: a.title, serial_number: a.serial_number ?? null }))

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
