import { supabaseAdmin } from '../supabase'
import { getTierConfig } from '../tiers'

export interface ResourceContext {
  tier: string
  workspacesUsed: number
  workspacesLimit: number
  tokensRemaining: number
  commandsRemaining: number
  activeRuns: number
  activeRunsLimit: number
  storageUsedMb: number
  storageLimitMb: number
}

export class PlanningGuard {
  static async loadContext(userId: string): Promise<ResourceContext> {
    try {
      // 1. Fetch user tier and accumulated usage metrics
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('tier, ai_tokens_used')
        .eq('github_id', userId)
        .single()
        
      const tierName = user?.tier || 'free'
      const tier = getTierConfig(tierName)
      
      // 2. Fetch project counts
      const { count: workspacesCount } = await supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_github_id', userId)
        
      const workspacesUsed = workspacesCount || 0
      const workspacesLimit = tier.container.maxWorkspaces
      // If monthlyTokens is 0 (unlimited), represent it as a large number or handle it in prompt
      const tokensRemaining = tier.ai.monthlyTokens === 0 
        ? 999999999 
        : Math.max(0, tier.ai.monthlyTokens - (user?.ai_tokens_used || 0))

      return {
        tier: tierName,
        workspacesUsed,
        workspacesLimit,
        tokensRemaining,
        commandsRemaining: 10, // Default run command budget
        activeRuns: 1,
        activeRunsLimit: 1,
        storageUsedMb: 120, // Static estimation or placeholder
        storageLimitMb: tier.container.diskGB * 1024
      }
    } catch (err) {
      console.error('[PlanningGuard] Failed to load resource context:', err)
      // Safe fallback values on error
      return {
        tier: 'free',
        workspacesUsed: 0,
        workspacesLimit: 3,
        tokensRemaining: 50000,
        commandsRemaining: 10,
        activeRuns: 1,
        activeRunsLimit: 1,
        storageUsedMb: 0,
        storageLimitMb: 5120
      }
    }
  }

  static buildSystemPrompt(ctx: ResourceContext): string {
    const canCreateWorkspace = ctx.workspacesLimit === 0 || ctx.workspacesUsed < ctx.workspacesLimit
    const hasRemainingTokens = ctx.tokensRemaining > 0
    
    return `
=== RESOURCE-AWARE CAPABILITY PROFILE ===
User Subscription Tier: ${ctx.tier.toUpperCase()}
Active Workspaces: ${ctx.workspacesUsed} / ${ctx.workspacesLimit === 0 ? 'Unlimited' : ctx.workspacesLimit}
Available AI Tokens: ${ctx.tokensRemaining === 999999999 ? 'Unlimited' : ctx.tokensRemaining}

CAPABILITIES:
- Can Create Workspace: ${canCreateWorkspace ? 'YES' : 'NO'}
- Can Run Commands: ${hasRemainingTokens ? 'YES' : 'NO'}
- Can Install Packages: ${hasRemainingTokens ? 'YES' : 'NO'}
- Can Start Additional Agent Runs: NO

PLANNING RULES:
1. You MUST only generate plans utilizing available capabilities.
2. If "Can Create Workspace" is NO, you are STRICTLY PROHIBITED from planning workspace creation. Instead, explain the limitation to the user and generate an alternative plan (e.g., reusing the active workspace or cleaning up old ones).
3. Budget-Aware Execution: Explain the estimated command/token expenditures in your plan.
`
  }
}
