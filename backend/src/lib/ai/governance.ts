import { supabaseAdmin } from '../supabase'
import { getTierConfig } from '../tiers'

export interface RunBudget {
  tokenBudget: number
  commandBudget: number
  timeBudgetMin: number
  writeBudget: number
}

export class ExecutionGuard {
  /**
   * Validate if the agent is allowed to execute a tool.
   * Checks run-level budgets, security blocks, and user-level quotas.
   */
  static async validate(runId: string, action: string, args: any, userId: string): Promise<void> {
    if (runId === 'global' || runId === 'none' || !runId) {
      // Bypass validation for stateless global assistant run
      return
    }

    // 1. Fetch active run budgets and usage from the database
    const { data: run, error } = await supabaseAdmin
      .from('agent_runs')
      .select('*')
      .eq('id', runId)
      .single()

    if (error || !run) {
      throw new Error(`Agent run context not found: ${error?.message || 'Run record missing'}`)
    }

    // 2. Check run-level budgets
    if (action === 'run_command') {
      if (run.commands_run >= run.budget_commands) {
        throw new Error(`BUDGET_EXHAUSTED: Command budget of ${run.budget_commands} exhausted for this run.`)
      }
    }
    
    if (action === 'edit_file' || action === 'create_file' || action === 'delete_file') {
      if (run.file_writes_run >= run.budget_file_writes) {
        throw new Error(`BUDGET_EXHAUSTED: File write budget of ${run.budget_file_writes} exhausted for this run.`)
      }
    }

    // 3. Perform permission & safety checks on commands
    if (action === 'run_command') {
      const cmd = (args.command || '') as string
      const blockedPatterns = [
        'rm -rf /', 'dd ', ':(){ :|:& };:', 'mkfs', 'reboot', 'shutdown',
        'mv /', 'chmod -R 000', 'chown -R root', 'chmod 000 /'
      ]
      if (blockedPatterns.some(pat => cmd.includes(pat))) {
        throw new Error('PERMISSION_DENIED: Destructive shell command blocked by CloudCode Resource Governance.')
      }
    }

    // 4. Verify user-level monthly token quotas
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('tier, ai_tokens_used')
      .eq('github_id', userId)
      .single()

    const tierName = user?.tier || 'free'
    const tier = getTierConfig(tierName)

    if (tier.ai.monthlyTokens > 0 && (user?.ai_tokens_used || 0) >= tier.ai.monthlyTokens) {
      throw new Error('QUOTA_EXCEEDED: Monthly AI token limit exceeded. Please upgrade your subscription plan.')
    }
  }

  /**
   * Record the execution expenditure in Supabase (run counters and resource ledgers).
   */
  static async recordExecution(
    runId: string,
    action: string,
    cost: { tokens?: number; commands?: number; writes?: number },
    args?: any
  ) {
    if (runId === 'global' || runId === 'none' || !runId) {
      return
    }

    try {
      // Fetch current run state
      const { data: run } = await supabaseAdmin
        .from('agent_runs')
        .select('*')
        .eq('id', runId)
        .single()
      if (!run) return

      // Update counters in database
      await supabaseAdmin
        .from('agent_runs')
        .update({
          tokens_used: run.tokens_used + (cost.tokens || 0),
          commands_run: run.commands_run + (cost.commands || 0),
          file_writes_run: run.file_writes_run + (cost.writes || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', runId)

      // Add resource item entry to agent_resources
      if (action !== 'reasoning' && action !== 'plan') {
        let resource_type: 'file_read' | 'file_write' | 'file_delete' | 'command_execution' = 'file_read'
        
        if (action === 'edit_file' || action === 'create_file') resource_type = 'file_write'
        else if (action === 'delete_file') resource_type = 'file_delete'
        else if (action === 'run_command') resource_type = 'command_execution'

        const target_path = args?.path || args?.command || ''

        await supabaseAdmin
          .from('agent_resources')
          .insert({
            run_id: runId,
            resource_type,
            target_path,
            quantity: 1
          })
      }
    } catch (err) {
      console.error('[ExecutionGuard] Failed to record execution details:', err)
    }
  }
}
