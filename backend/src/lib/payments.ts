/**
 * Dodo Payments — Subscription billing integration.
 *
 * Uses Dodo Payments Checkout Sessions API to create subscription checkouts.
 * Products (Pro/Advanced) must be created in the Dodo Payments Dashboard first.
 * Their IDs are stored here as constants.
 *
 * Flow:
 * 1. User taps "Upgrade to Pro" in mobile settings
 * 2. Mobile calls POST /api/billing/checkout → returns checkout_url
 * 3. Mobile opens checkout_url in WebBrowser
 * 4. After payment, Dodo Payments fires webhooks → POST /api/billing/webhook
 * 5. Webhook handler updates user tier in Supabase
 */

import DodoPayments from 'dodopayments'

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: 'test_mode', // Switch to 'live_mode' for production
})

export default dodo

/**
 * Product IDs from Dodo Payments Dashboard.
 * TODO: Replace with actual product IDs once created in the Dodo dashboard.
 */
export const DODO_PRODUCTS = {
  pro_monthly: process.env.DODO_PRO_MONTHLY_PRODUCT_ID || 'prod_placeholder_pro_monthly',
  pro_yearly: process.env.DODO_PRO_YEARLY_PRODUCT_ID || 'prod_placeholder_pro_yearly',
  advanced_monthly: process.env.DODO_ADVANCED_MONTHLY_PRODUCT_ID || 'prod_placeholder_advanced_monthly',
  advanced_yearly: process.env.DODO_ADVANCED_YEARLY_PRODUCT_ID || 'prod_placeholder_advanced_yearly',
} as const

export type PlanType = keyof typeof DODO_PRODUCTS

/**
 * Create a Dodo Payments checkout session for a subscription upgrade.
 */
export async function createCheckoutSession(params: {
  planType: PlanType
  userId: string
  email: string
  returnUrl: string
}) {
  const productId = DODO_PRODUCTS[params.planType]

  const session = await dodo.checkoutSessions.create({
    product_cart: [{
      product_id: productId,
      quantity: 1,
    }],
    customer: {
      email: params.email,
    },
    payment_link: true,
    metadata: {
      cloudcode_user_id: params.userId,
      plan_type: params.planType,
    },
    success_url: params.returnUrl,
  })

  return {
    checkoutUrl: session.url,
    sessionId: session.checkout_session_id,
  }
}

/**
 * Get subscription details from Dodo Payments.
 */
export async function getSubscription(subscriptionId: string) {
  return dodo.subscriptions.retrieve(subscriptionId)
}

/**
 * Cancel a subscription (at period end).
 */
export async function cancelSubscription(subscriptionId: string) {
  return dodo.subscriptions.update(subscriptionId, {
    status: 'cancelled',
  })
}
