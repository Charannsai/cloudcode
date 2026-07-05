import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { chatWithGemini, chatWithOpenAI, chatWithAnthropic, chatWithGroq, GeminiMessage } from '@/lib/ai/gemini'
import { execInContainer, ensureContainerRunning } from '@/lib/docker'

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const runId = params.id
  if (!runId) {
    return errorResponse('Missing runId')
  }

  const customGeminiKey = req.headers.get('x-gemini-key') || undefined
  const customOpenaiKey = req.headers.get('x-openai-key') || undefined
  const customAnthropicKey = req.headers.get('x-anthropic-key') || undefined
  const customGroqKey = req.headers.get('x-groq-key') || undefined

  try {
    // 1. Fetch active run details
    const { data: run, error: runErr } = await supabaseAdmin
      .from('agent_runs')
      .select('*')
      .eq('id', runId)
      .single()

    if (runErr || !run) {
      return errorResponse(`Agent run not found: ${runErr?.message || 'Record missing'}`, 404)
    }

    if (run.user_github_id !== user.id) {
      return errorResponse('Unauthorized access to this agent run', 403)
    }

    const body = await req.json().catch(() => ({}))
    const { newMessage, openFile } = body as {
      newMessage?: string
      openFile?: { path: string; content: string }
    }

    // 2. If a new user message is provided, append it to the steps list
    if (newMessage) {
      const { count } = await supabaseAdmin
        .from('agent_steps')
        .select('*', { count: 'exact', head: true })
        .eq('run_id', runId)

      const nextIndex = count || 0

      await supabaseAdmin
        .from('agent_steps')
        .insert({
          run_id: runId,
          step_index: nextIndex,
          type: 'reasoning',
          content: {
            role: 'user',
            text: newMessage
          }
        })
    }

    const model = run.model
    const projectId = run.project_id

    // Check user tier if calling premium models (openai / anthropic)
    let userTier = 'free'
    try {
      const { data: dbUser } = await supabaseAdmin
        .from('users')
        .select('tier')
        .eq('github_id', user.id)
        .single()
      if (dbUser) {
        userTier = dbUser.tier || 'free'
      }
    } catch (err) {
      console.error('[Stateful AI Chat] Failed to fetch user tier:', err)
    }

    const isBYOK = !!(customGeminiKey || customOpenaiKey || customAnthropicKey || customGroqKey)

    const byokEnabledHeader = req.headers.get('x-byok-enabled') === 'true'
    if (byokEnabledHeader) {
      let missingKeyModel = ''
      if (model === 'openai' && !customOpenaiKey) {
        missingKeyModel = 'ChatGPT 5.5'
      } else if (model === 'anthropic' && !customAnthropicKey) {
        missingKeyModel = 'Claude 4.6 Opus'
      } else if (model === 'groq' && !customGroqKey) {
        missingKeyModel = 'Groq'
      } else if ((model === 'gemini' || !model) && !customGeminiKey) {
        missingKeyModel = 'Gemini 3.5 Flash'
      }

      if (missingKeyModel) {
        const encoder = new TextEncoder()
        const errMsg = JSON.stringify({
          type: 'error',
          content: `API key for ${missingKeyModel} is missing. Please configure it in Settings.`
        })
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${errMsg}\n\n`))
            controller.close()
          }
        })
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }
    }

    if ((model === 'openai' || model === 'anthropic' || model === 'groq') && userTier === 'free' && !isBYOK) {
      const encoder = new TextEncoder()
      const errMsg = JSON.stringify({
        type: 'error',
        content: `LIMIT_EXCEEDED: ${model === 'openai' ? 'gpt-4o' : 'Claude Opus 4.6'} is a premium model restricted to Pro and Advanced subscriptions. Please upgrade your billing plan in Settings.`
      })
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${errMsg}\n\n`))
          controller.close()
        }
      })
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Setup project container if associated
    let containerId = 'none'
    let fileTree = ''

    if (projectId) {
      // Auto-wake container if asleep
      try {
        await ensureContainerRunning(projectId)
      } catch (err) {
        console.error('[Stateful AI Chat] Failed to ensure container is running:', err)
      }

      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('container_id')
        .eq('id', projectId)
        .single()

      if (project?.container_id) {
        containerId = project.container_id

        // Build file tree
        try {
          await execInContainer(
            containerId,
            ['find', '/workspace', '-maxdepth', '3', '-not', '-path', '*/node_modules/*', '-not', '-path', '*/.git/*'],
            (data) => { fileTree += data }
          )
          fileTree = fileTree.trim().split('\n').map(f => f.replace('/workspace/', '')).join('\n')
        } catch {
          fileTree = '(unable to read file tree)'
        }
      }
    }

    const context = {
      fileTree: fileTree || undefined,
      openFile,
      userId: user.id,
      runId: run.id
    }

    // Setup generator
    const getGenerator = () => {
      if (model === 'openai') {
        return chatWithOpenAI([], containerId, context, customOpenaiKey)
      } else if (model === 'anthropic') {
        return chatWithAnthropic([], containerId, context, customAnthropicKey)
      } else if (model === 'groq') {
        return chatWithGroq([], containerId, context, customGroqKey)
      } else {
        return chatWithGemini([], containerId, context, customGeminiKey)
      }
    }

    // Stream response using SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = getGenerator()

          for await (const chunk of generator) {
            const data = JSON.stringify(chunk) + '\n'
            controller.enqueue(encoder.encode(`data: ${data}\n`))
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          const errMsg = JSON.stringify({ type: 'error', content: (err as Error).message })
          controller.enqueue(encoder.encode(`data: ${errMsg}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}
