import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlan } from '@/lib/plans'

type InvoiceRow = {
  id: string
  organization_id: string
  plan: string
  status: string
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
    const { code } = body

    if (!code || !/^\d{9}$/.test(code)) {
      return NextResponse.json({ error: 'Ungültiger Code (9 Ziffern erforderlich)' }, { status: 400 })
    }

    // Find invoice with this activation code
    const { data: invoice } = await db
      .from('invoices')
      .select('*')
      .eq('activation_code', code)
      .eq('status', 'pending')
      .single() as { data: InvoiceRow | null }

    if (!invoice) {
      return NextResponse.json({ error: 'Code ungültig oder bereits verwendet' }, { status: 404 })
    }

    // Verify the invoice belongs to this organization
    if (invoice.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Code gehört nicht zu dieser Organisation' }, { status: 403 })
    }

    const plan = getPlan(invoice.plan)

    // Mark invoice as paid
    const { error: invoiceError } = await db
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoice.id)

    if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 })

    // Upgrade organization plan
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        plan: invoice.plan,
        asset_limit: plan.asset_limit,
        subscription_status: 'active',
      } as never)
      .eq('id', profile.organization_id)

    if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 })

    return NextResponse.json({ success: true, plan: invoice.plan })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
