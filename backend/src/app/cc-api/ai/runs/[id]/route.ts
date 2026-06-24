import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const runId = params.id
  if (!runId) {
    return errorResponse('Missing runId', 400)
  }

  try {
    // 1. Fetch run details
    const { data: run, error: runErr } = await supabaseAdmin
      .from('agent_runs')
      .select('*')
      .eq('id', runId)
      .single()

    if (runErr || !run) {
      return errorResponse(`Agent run not found: ${runErr?.message || 'Record missing'}`, 404)
    }

    if (run.user_github_id !== user.id) {
      return errorResponse('Unauthorized access to this run', 403)
    }

    // 2. Fetch steps
    const { data: steps } = await supabaseAdmin
      .from('agent_steps')
      .select('*')
      .eq('run_id', runId)
      .order('step_index', { ascending: true })

    // 3. Fetch events
    const { data: events } = await supabaseAdmin
      .from('agent_events')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: true })

    return successResponse({
      run,
      steps: steps || [],
      events: events || []
    })
  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}
