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

  const supabase = createAdminClient()

  // Abo gestartet / Zahlung erfolgreich
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { organization_id, plan_id } = session.metadata ?? {}
    if (!organization_id || !plan_id) return NextResponse.json({ received: true })

    const plan = getPlan(plan_id)
    const { error } = await supabase
      .from('organizations')
      .update({
        plan: plan_id,
        asset_limit: plan.asset_limit,
        stripe_subscription_id: session.subscription as string ?? session.id,
        subscription_status: 'active',
      } as never)
      .eq('id', organization_id)

    if (error) console.error('checkout.session.completed org update failed:', error)
  }

  // Abo-Verlängerung bezahlt
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id

    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      const { organization_id, plan_id } = sub.metadata ?? {}
      if (organization_id && plan_id) {
        await supabase
          .from('organizations')
          .update({ subscription_status: 'active' } as never)
          .eq('id', organization_id)
      }
    }
  }

  // Abo gekündigt / abgelaufen → auf Free zurücksetzen
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const { organization_id } = sub.metadata ?? {}
    if (organization_id) {
      await supabase
        .from('organizations')
        .update({
          plan: 'free',
          asset_limit: 20,
          stripe_subscription_id: null,
          subscription_status: 'cancelled',
        } as never)
        .eq('id', organization_id)
    }
  }

  return NextResponse.json({ received: true })
}
