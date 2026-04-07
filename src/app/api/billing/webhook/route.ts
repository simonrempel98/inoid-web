import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlan } from '@/lib/plans'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e) {
    return NextResponse.json({ error: `Webhook error: ${String(e)}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { organization_id, plan_id } = session.metadata ?? {}

    if (!organization_id || !plan_id) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const plan = getPlan(plan_id)
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('organizations')
      .update({
        plan: plan_id,
        asset_limit: plan.asset_limit,
        stripe_subscription_id: session.id,
        subscription_status: 'active',
      } as never)
      .eq('id', organization_id)

    if (error) {
      console.error('Webhook org update failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
