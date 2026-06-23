import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { createCheckoutSession, DODO_PRODUCTS, type PlanType } from '@/lib/payments'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/billing/checkout
 * 
 * Creates a Dodo Payments checkout session for upgrading to Pro or Advanced.
 * Requires authentication. Returns the checkout URL to open in WebBrowser.
 *
 * Body: { planType: 'pro_monthly' | 'pro_yearly' | 'advanced_monthly' | 'advanced_yearly', returnUrl: string }
 */
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const body = await req.json()
    const { planType, returnUrl } = body as { planType?: string; returnUrl?: string }

    if (!planType || !(planType in DODO_PRODUCTS)) {
      return errorResponse('Invalid planType. Must be one of: pro_monthly, pro_yearly, advanced_monthly, advanced_yearly')
    }

    if (!returnUrl) {
      return errorResponse('returnUrl is required')
    }

    // Get user email from Supabase
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('github_id', user.id)
      .single()

    const email = dbUser?.email || user.email || ''

    const result = await createCheckoutSession({
      planType: planType as PlanType,
      userId: user.id,
      email,
      returnUrl,
    })

    return successResponse({
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
    })
  } catch (err) {
    console.error('Checkout creation error:', err)
    return errorResponse('Failed to create checkout session', 500)
  }
}
