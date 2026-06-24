import { NextRequest } from 'next/server'
import { successResponse, errorResponse, getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const runId = params.id
  if (!runId) {
    return errorResponse('Missing runId', 400)
  }

  try {
    // Validate run ownership
    const { data: run } = await supabaseAdmin
      .from('agent_runs')
      .select('user_github_id')
      .eq('id', runId)
      .single()

    if (!run) {
      return errorResponse('Agent run not found', 404)
    }

    if (run.user_github_id !== user.id) {
      return errorResponse('Unauthorized', 403)
    }

    const body = await req.json()
    const { approvalId, action } = body as { approvalId: string; action: 'approve' | 'reject' }

    if (!approvalId || !action) {
      return errorResponse('Missing approvalId or action', 400)
    }

    const pending = (global as any).pendingCommands?.get(approvalId)
    if (!pending) {
      return errorResponse('Pending command not found or expired', 404)
    }

    // Resolve the promise waiting in the generator loop
    pending.resolve(action === 'approve')
    ;(global as any).pendingCommands.delete(approvalId)

    // Update run status in Supabase
    const newStatus = action === 'approve' ? 'executing' : 'paused'
    await supabaseAdmin
      .from('agent_runs')
      .update({ status: newStatus })
      .eq('id', runId)

    // Log the event
    await supabaseAdmin
      .from('agent_events')
      .insert({
        run_id: runId,
        event_type: 'info',
        message: `User ${action}d pending command: "${pending.command}".`
      })

    return successResponse({ success: true, status: newStatus })
  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}
