import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlan, planVat, planGross } from '@/lib/plans'

function generateActivationCode(): string {
  return Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('')
}

function generateInvoiceNumber(count: number): string {
  const year = new Date().getFullYear()
  const seq = String(count + 1).padStart(4, '0')
  return `INO-${year}-${seq}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) return NextResponse.json({ error: 'Keine Organisation' }, { status: 400 })

    const body = await req.json()
    const { plan_id, billing_name, billing_street, billing_city, billing_country, billing_vat_id } = body

    if (!plan_id || plan_id === 'free') {
      return NextResponse.json({ error: 'Ungültiger Plan' }, { status: 400 })
    }
    if (!billing_name?.trim()) {
      return NextResponse.json({ error: 'Rechnungsname erforderlich' }, { status: 400 })
    }

    const plan = getPlan(plan_id)
    const amount_vat = planVat(plan)
    const amount_gross = planGross(plan)

    // Invoice number based on total count of existing invoices
    const { count } = await db
      .from('invoices').select('*', { count: 'exact', head: true })
    const invoice_number = generateInvoiceNumber(count ?? 0)
    const activation_code = generateActivationCode()

    const { data: invoice, error } = await db
      .from('invoices')
      .insert({
        organization_id: profile.organization_id,
        invoice_number,
        plan: plan_id,
        amount_net: plan.price_net,
        vat_rate: plan.vat_rate,
        amount_vat,
        amount_gross,
        status: 'pending',
        activation_code,
        billing_name: billing_name.trim(),
        billing_street: billing_street?.trim() || null,
        billing_city: billing_city?.trim() || null,
        billing_country: billing_country?.trim() || 'Deutschland',
        billing_vat_id: billing_vat_id?.trim() || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ invoice })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
