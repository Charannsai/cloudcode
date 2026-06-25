import { NextRequest } from 'next/server'
import { successResponse, errorResponse, getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { executeTool, AgentRunContext } from '@/lib/ai/gemini'

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  try {
    const body = await req.json()
    const { approvalId, action } = body as { approvalId: string; action: 'approve' | 'reject' }

    if (!approvalId || !action) {
      return errorResponse('Missing approvalId or action', 400)
    }

    // 1. Check if this is a stateful run by looking up the tool call step in agent_steps
    const { data: step, error: stepErr } = await supabaseAdmin
      .from('agent_steps')
      .select('run_id, content')
      .eq('type', 'tool_call')
      .filter('content->args->>approvalId', 'eq', approvalId)
      .maybeSingle()

    if (stepErr) {
      console.error('[AI Approve] Database error looking up step:', stepErr)
    }

    if (step) {
      const runId = step.run_id
      
      // Load the associated agent run to verify ownership and get project context
      const { data: run, error: runErr } = await supabaseAdmin
        .from('agent_runs')
        .select('*')
        .eq('id', runId)
        .single()

      if (runErr || !run) {
        return errorResponse('Associated agent run not found', 404)
      }

      if (run.user_github_id !== user.id) {
        return errorResponse('Unauthorized access to this agent run', 403)
      }

      const projectId = run.project_id
      let containerId = 'none'

      if (projectId) {
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('container_id')
          .eq('id', projectId)
          .single()
        
        if (project?.container_id) {
          containerId = project.container_id
        }
      }

      const runCtx = new AgentRunContext(runId, user.id)
      await runCtx.init()

      if (action === 'approve') {
        const command = step.content.args?.command as string
        
        // Execute the command in the container
        const result = await executeTool(containerId, 'run_command', { command }, user.id)

        // Save the result step
        await runCtx.saveStep('tool_result', { name: 'run_command', response: result })

        // Update run status in DB
        await supabaseAdmin
          .from('agent_runs')
          .update({ status: 'executing' })
          .eq('id', runId)
          
        // Log the event
        await supabaseAdmin
          .from('agent_events')
          .insert({
            run_id: runId,
            event_type: 'info',
            message: `User approved and executed command: "${command}".`
          })
      } else {
        // Rejected
        const result = { error: 'Command execution rejected by user.' }
        await runCtx.saveStep('tool_result', { name: 'run_command', response: result })

        await supabaseAdmin
          .from('agent_runs')
          .update({ status: 'paused' })
          .eq('id', runId)

        await supabaseAdmin
          .from('agent_events')
          .insert({
            run_id: runId,
            event_type: 'info',
            message: `User rejected command execution.`
          })
      }

      return successResponse({ success: true, stateful: true })
    }

    // 2. Fallback to stateless in-memory pending commands
    const pending = (global as any).pendingCommands?.get(approvalId)
    if (!pending) {
      return errorResponse('Pending command not found or expired', 404)
    }

    pending.resolve(action === 'approve')
    ;(global as any).pendingCommands.delete(approvalId)

    return successResponse({ success: true, stateful: false })
  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}
