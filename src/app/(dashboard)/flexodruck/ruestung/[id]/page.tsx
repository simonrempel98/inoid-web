// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SetupWizard } from './setup-wizard'

export default async function RuestvorgangPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('organization_id, app_role, full_name').eq('id', user.id).single()
  if (!profile?.organization_id) redirect('/dashboard')

  // 1. Setup laden (flach)
  const { data: setup, error } = await supabase
    .from('flexo_setups')
    .select('id, name, job_number, status, notes, planned_at, started_at, completed_at, created_at, machine_id, template_id')
    .eq('id', id)
    .eq('org_id', profile.organization_id)
    .single()

  if (error || !setup) notFound()

  // 2. Maschine laden
  const { data: machine } = await supabase
    .from('flexo_machines')
    .select('id, name, num_druckwerke')
    .eq('id', setup.machine_id)
    .single()

  // 3. Vorlage laden (optional)
  const { data: template } = setup.template_id
    ? await supabase.from('flexo_templates').select('id, name').eq('id', setup.template_id).single()
    : { data: null }

  // 4. Setup-Schritte laden
  const { data: stepsRaw } = await supabase
    .from('flexo_setup_steps')
    .select('id, druckwerk_id, slot_id, slot_label, is_fixed, asset_id, status, notes, installed_at, sort_order')
    .eq('setup_id', id)
    .order('sort_order')

  const steps = stepsRaw ?? []

  // 5. Druckwerke der Schritte laden
  const dwIds = [...new Set(steps.map((s: any) => s.druckwerk_id).filter(Boolean))]
  const { data: druckwerkeRaw } = dwIds.length > 0
    ? await supabase
        .from('flexo_druckwerke')
        .select('id, position, label, color_hint')
        .in('id', dwIds)
        .order('position')
    : { data: [] }

  const druckwerke = druckwerkeRaw ?? []

  // 6. Assets der Schritte laden
  const assetIds = [...new Set(steps.map((s: any) => s.asset_id).filter(Boolean))]
  const { data: assetsRaw } = assetIds.length > 0
    ? await supabase.from('assets').select('id, title, serial_number').in('id', assetIds)
    : { data: [] }

  const assetMap = Object.fromEntries((assetsRaw ?? []).map((a: any) => [a.id, { id: a.id, name: a.title, serial_number: a.serial_number }]))

  // 7. Steps anreichern
  const stepsFull = steps.map((s: any) => ({
    ...s,
    assets: s.asset_id ? (assetMap[s.asset_id] ?? null) : null,
    flexo_druckwerke: druckwerke.find((d: any) => d.id === s.druckwerk_id) ?? null,
  }))

  // 8. Steps nach Druckwerk gruppieren
  const stepsByDW: Record<string, any[]> = {}
  for (const step of stepsFull) {
    if (!stepsByDW[step.druckwerk_id]) stepsByDW[step.druckwerk_id] = []
    stepsByDW[step.druckwerk_id].push(step)
  }

  // 9. Assets für Inline-Wechsel
  const { data: allAssetsRaw } = await supabase
    .from('assets')
    .select('id, title, serial_number')
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .order('title')
    .limit(500)
  const allAssets = (allAssetsRaw ?? []).map((a: any) => ({ ...a, name: a.title }))

  // Druckwerke anzeigen die mindestens einen Schritt haben (mit oder ohne Asset)
  const druckwerkeWithSteps = druckwerke.filter(dw =>
    (stepsByDW[dw.id] ?? []).length > 0
  )

  const canEdit = !['completed', 'cancelled'].includes(setup.status)

  return (
    <SetupWizard
      setupId={id}
      setupName={setup.name}
      jobNumber={setup.job_number}
      status={setup.status}
      machineName={machine?.name ?? ''}
      machineId={machine?.id ?? ''}
      templateName={template?.name ?? null}
      druckwerke={druckwerkeWithSteps}
      stepsByDW={stepsByDW}
      assets={allAssets}
      canEdit={canEdit}
    />
  )
}
