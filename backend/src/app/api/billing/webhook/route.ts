import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/billing/webhook
 * 
 * Dodo Payments webhook handler.
 * Receives subscription lifecycle events and updates user tier in Supabase.
 *
 * Events handled:
 * - subscription.active      → Upgrade user tier
 * - subscription.cancelled   → Downgrade to free
 * - subscription.expired     → Downgrade to free
 * - subscription.on_hold     → Mark subscription on hold
 * - payment.succeeded        → Log successful payment
 * - payment.failed           → Log failed payment
 *
 * Webhook signature verification is done via the webhook_secret.
 * TODO: Enable signature verification once DODO_PAYMENTS_WEBHOOK_SECRET is set.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const eventType = body.type || body.event_type
    const data = body.data || body

    console.log(`[Dodo Webhook] Received: ${eventType}`)

    // TODO: Verify webhook signature when DODO_PAYMENTS_WEBHOOK_SECRET is configured
    // const signature = req.headers.get('x-dodo-signature')
    // if (!verifySignature(signature, rawBody)) return new Response('Invalid signature', { status: 401 })

    switch (eventType) {
      case 'subscription.active': {
        // User subscription became active — upgrade their tier
        const metadata = data.metadata || {}
        const userId = metadata.cloudcode_user_id
        const planType: string = metadata.plan_type || ''

        if (!userId) {
          console.error('[Dodo Webhook] No cloudcode_user_id in subscription metadata')
          break
        }

        // Resolve tier name from plan type
        let tier = 'free'
        if (planType.startsWith('pro')) tier = 'pro'
        else if (planType.startsWith('advanced')) tier = 'advanced'

        const { error } = await supabaseAdmin
          .from('users')
          .update({
            tier,
            subscription_id: data.subscription_id || data.id,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('github_id', userId)

        if (error) {
          console.error('[Dodo Webhook] Failed to update user tier:', error)
        } else {
          console.log(`[Dodo Webhook] User ${userId} upgraded to ${tier} tier`)
        }
        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        const metadata = data.metadata || {}
        const userId = metadata.cloudcode_user_id

        if (!userId) {
          // Try to find user by subscription_id
          const subId = data.subscription_id || data.id
          if (subId) {
            const { error } = await supabaseAdmin
              .from('users')
              .update({
                tier: 'free',
                subscription_status: eventType === 'subscription.cancelled' ? 'cancelled' : 'expired',
                updated_at: new Date().toISOString(),
              })
              .eq('subscription_id', subId)

            if (error) console.error('[Dodo Webhook] Failed to downgrade by sub ID:', error)
            else console.log(`[Dodo Webhook] Subscription ${subId} → free tier (${eventType})`)
          }
          break
        }

        const { error } = await supabaseAdmin
          .from('users')
          .update({
            tier: 'free',
            subscription_status: eventType === 'subscription.cancelled' ? 'cancelled' : 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('github_id', userId)

        if (error) {
          console.error('[Dodo Webhook] Failed to downgrade user:', error)
        } else {
          console.log(`[Dodo Webhook] User ${userId} downgraded to free tier (${eventType})`)
        }
        break
      }

      case 'subscription.on_hold': {
        const metadata = data.metadata || {}
        const userId = metadata.cloudcode_user_id
        const subId = data.subscription_id || data.id

        if (userId) {
          await supabaseAdmin
            .from('users')
            .update({ subscription_status: 'on_hold', updated_at: new Date().toISOString() })
            .eq('github_id', userId)
        } else if (subId) {
          await supabaseAdmin
            .from('users')
            .update({ subscription_status: 'on_hold', updated_at: new Date().toISOString() })
            .eq('subscription_id', subId)
        }
        console.log(`[Dodo Webhook] Subscription on hold: ${subId || userId}`)
        break
      }

      case 'payment.succeeded': {
        console.log(`[Dodo Webhook] Payment succeeded: ${data.payment_id || data.id}`)
        break
      }

      case 'payment.failed': {
        console.log(`[Dodo Webhook] Payment failed: ${data.payment_id || data.id}`)
        break
      }

      default:
        console.log(`[Dodo Webhook] Unhandled event: ${eventType}`)
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[Dodo Webhook] Error processing webhook:', err)
    return new Response('Webhook processing error', { status: 500 })
  }
}
