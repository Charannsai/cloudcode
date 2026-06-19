import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { TIERS, getTierConfig, type TierName } from '@/lib/tiers'

/**
 * GET /api/billing/status
 * 
 * Returns the authenticated user's current billing status:
 * - Current tier (free/pro/advanced) 
 * - Subscription status
 * - Tier resource limits
 * - Upgrade options with pricing
 */
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('tier, subscription_id, subscription_status')
      .eq('github_id', user.id)
      .single()

    const tierName = (dbUser?.tier || 'free') as TierName
    const tier = getTierConfig(tierName)

    return successResponse({
      tier: {
        name: tier.name,
        displayName: tier.displayName,
        price: tier.price,
      },
      subscription: {
        id: dbUser?.subscription_id || null,
        status: dbUser?.subscription_status || 'none',
      },
      limits: {
        container: tier.container,
        api: tier.api,
        ai: tier.ai,
      },
      upgrades: Object.values(TIERS)
        .filter(t => t.name !== tierName)
        .map(t => ({
          name: t.name,
          displayName: t.displayName,
          price: t.price,
          container: t.container,
          ai: t.ai,
        })),
    })
  } catch (err) {
    console.error('Billing status error:', err)
    return errorResponse('Failed to fetch billing status', 500)
  }
}
