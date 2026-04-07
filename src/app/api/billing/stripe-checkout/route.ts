import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlan } from '@/lib/plans'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) return NextResponse.json({ error: 'Keine Organisation' }, { status: 400 })

    const { data: org } = await supabase
      .from('organizations')
      .select('name, stripe_customer_id')
      .eq('id', profile.organization_id)
      .single()

    const body = await req.json()
    const { plan_id } = body

    const plan = getPlan(plan_id)
    if (!plan || plan.id === 'free' || !plan.stripe_price_id) {
      return NextResponse.json({ error: 'Ungültiger Plan oder kein Stripe-Preis konfiguriert' }, { status: 400 })
    }

    // Get or create Stripe customer
    let customerId = org?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org?.name,
        metadata: { organization_id: profile.organization_id },
      })
      customerId = customer.id

      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.organization_id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: `${appUrl}/settings/billing?success=1&plan=${plan_id}`,
      cancel_url: `${appUrl}/settings/billing?cancelled=1`,
      metadata: {
        organization_id: profile.organization_id,
        plan_id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
