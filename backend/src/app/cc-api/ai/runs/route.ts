import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /cc-api/ai/runs - Create a new stateful agent run
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  try {
    const body = await req.json()
    const { projectId, model, initialMessage, budgetTokens, budgetCommands } = body as {
      projectId?: string
      model: string
      initialMessage?: string
      budgetTokens?: number
      budgetCommands?: number
    }

    if (!model) {
      return errorResponse('Missing model type')
    }

    // 1. Create agent run record
    const { data: run, error: runErr } = await supabaseAdmin
      .from('agent_runs')
      .insert({
        user_github_id: user.id,
        project_id: projectId === 'global' || !projectId ? null : projectId,
        status: 'planning',
        model,
        budget_tokens: budgetTokens || 100000,
        budget_commands: budgetCommands || 10,
        budget_file_writes: 50,
        budget_duration_sec: 1200
      })
      .select('*')
      .single()

    if (runErr || !run) {
      return errorResponse(`Failed to create agent run: ${runErr?.message}`, 500)
    }

    // 2. If there is an initial message, save it as the first step (type 'reasoning' from user)
    if (initialMessage) {
      const { error: stepErr } = await supabaseAdmin
        .from('agent_steps')
        .insert({
          run_id: run.id,
          step_index: 0,
          type: 'reasoning',
          content: {
            role: 'user',
            text: initialMessage
          }
        })

      if (stepErr) {
        console.error('[Runs API] Failed to save initial message step:', stepErr)
      }
    }

    // 3. Log an info event in agent_events
    await supabaseAdmin
      .from('agent_events')
      .insert({
        run_id: run.id,
        event_type: 'info',
        message: `Agent run initialized with model ${model}.`
      })

    return successResponse({ run })
  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}

// GET /cc-api/ai/runs - List active/past runs for the authenticated user
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  try {
    let query = supabaseAdmin
      .from('agent_runs')
      .select(`
        *,
        agent_steps (
          content
        )
      `)
      .eq('user_github_id', user.id)
      .eq('agent_steps.step_index', 0)
      .order('created_at', { ascending: false })

    if (projectId) {
      if (projectId === 'global') {
        query = query.is('project_id', null)
      } else {
        query = query.eq('project_id', projectId)
      }
    }

    const { data: runs, error } = await query

    if (error) {
      return errorResponse(error.message, 500)
    }

    return successResponse({ runs })
  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}

// DELETE /cc-api/ai/runs - Bulk delete agent runs for the user
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  try {
    const body = await req.json()
    const { runIds } = body as { runIds: string[] }

    if (!runIds || !Array.isArray(runIds) || runIds.length === 0) {
      return errorResponse('Missing or invalid runIds array', 400)
    }

    // Delete runs that belong to the authenticated user
    const { error } = await supabaseAdmin
      .from('agent_runs')
      .delete()
      .eq('user_github_id', user.id)
      .in('id', runIds)

    if (error) {
      return errorResponse(`Failed to delete agent runs: ${error.message}`, 500)
    }

    return successResponse({ success: true, message: 'Conversations deleted successfully' })
  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}
