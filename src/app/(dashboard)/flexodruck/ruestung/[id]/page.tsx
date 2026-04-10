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

  const { data: setup, error } = await supabase
    .from('flexo_setups')
    .select(`
      id, name, job_number, status, notes, planned_at, started_at, completed_at, created_at,
      flexo_machines(id, name, num_druckwerke),
      flexo_templates(id, name),
      flexo_setup_steps(
        id, druckwerk_id, slot_id, slot_label, is_fixed,
        asset_id, status, notes, installed_at, sort_order,
        assets(id, name, serial_number),
        flexo_druckwerke(id, position, label, color_hint)
      )
    `)
    .eq('id', id)
    .eq('org_id', profile.organization_id)
    .single()

  if (error || !setup) notFound()

  // Assets für Inline-Wechsel
  const { data: assets } = await supabase
    .from('assets')
    .select('id, name, serial_number')
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .order('name')
    .limit(500)

  // Schritte nach Druckwerk + sort_order gruppieren
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stepsSorted = [...((setup as any).flexo_setup_steps ?? [])].sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)

  // Druckwerke als geordnete Liste (unique, nach position)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dwMap: Record<string, { id: string; position: number; label: string | null; color_hint: string | null }> = {}
  for (const step of stepsSorted) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dw = (step as any).flexo_druckwerke
    if (dw && !dwMap[dw.id]) dwMap[dw.id] = dw
  }
  const orderedDW = Object.values(dwMap).sort((a, b) => a.position - b.position)

  // Group steps by druckwerk_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stepsByDW: Record<string, any[]> = {}
  for (const step of stepsSorted) {
    if (!stepsByDW[step.druckwerk_id]) stepsByDW[step.druckwerk_id] = []
    stepsByDW[step.druckwerk_id].push(step)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canEdit = !['completed', 'cancelled'].includes((setup as any).status)

  return (
    <SetupWizard
      setupId={id}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setupName={(setup as any).name}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jobNumber={(setup as any).job_number}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status={(setup as any).status}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      machineName={(setup as any).flexo_machines?.name ?? ''}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      machineId={(setup as any).flexo_machines?.id ?? ''}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      templateName={(setup as any).flexo_templates?.name ?? null}
      druckwerke={orderedDW}
      stepsByDW={stepsByDW}
      assets={assets ?? []}
      canEdit={canEdit}
    />
  )
}
