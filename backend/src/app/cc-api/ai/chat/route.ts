

import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { chatWithGemini, chatWithOpenAI, chatWithAnthropic, chatWithGroq, GeminiMessage } from '@/lib/ai/gemini'
import { execInContainer, ensureContainerRunning } from '@/lib/docker'

import { getTierConfig } from '@/lib/tiers'

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const customGeminiKey = req.headers.get('x-gemini-key') || undefined
  const customOpenaiKey = req.headers.get('x-openai-key') || undefined
  const customAnthropicKey = req.headers.get('x-anthropic-key') || undefined
  const customGroqKey = req.headers.get('x-groq-key') || undefined

  const body = await req.json()
  const { projectId, messages, openFile, model, threadId } = body as {
    projectId: string
    messages: { role: 'user' | 'model'; text: string }[]
    openFile?: { path: string; content: string }
    model?: string
    threadId?: string
  }

  if (!projectId || !messages || messages.length === 0) {
    return errorResponse('Missing projectId or messages')
  }

  // Check user tier if calling premium models (openai / anthropic) and enforce quotas
  let userTier = 'free'
  let aiTokensUsed = 0
  try {
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('tier, ai_tokens_used')
      .eq('github_id', user.id)
      .single()
    if (dbUser) {
      userTier = dbUser.tier || 'free'
      aiTokensUsed = dbUser.ai_tokens_used || 0
    }
  } catch (err) {
    console.error('[AI Chat] Failed to fetch user tier/tokens:', err)
  }

  const isBYOK = !!(customGeminiKey || customOpenaiKey || customAnthropicKey || customGroqKey)
  const tier = getTierConfig(userTier)

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

  // Enforce AI token limits (only for non-BYOK requests)
  if (!isBYOK && tier.ai.monthlyTokens > 0 && aiTokensUsed >= tier.ai.monthlyTokens) {
    const encoder = new TextEncoder()
    const errMsg = JSON.stringify({
      type: 'error',
      content: `LIMIT_EXCEEDED: You have run out of AI tokens on your ${tier.displayName} plan. Please upgrade to continue using CloudCode AI.`
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

  // Ensure stateful run exists if threadId is provided
  if (threadId) {
    try {
      const { data: existingRun } = await supabaseAdmin
        .from('agent_runs')
        .select('id')
        .eq('id', threadId)
        .single()

      if (!existingRun) {
        await supabaseAdmin
          .from('agent_runs')
          .insert({
            id: threadId,
            user_github_id: user.id,
            project_id: projectId === 'global' || !projectId ? null : projectId,
            status: 'planning',
            model: model || 'gemini',
            budget_tokens: 100000,
            budget_commands: 10,
            budget_file_writes: 50,
            budget_duration_sec: 1200
          })
      }

      // Load existing steps to avoid inserting duplicate user messages
      const { data: dbSteps } = await supabaseAdmin
        .from('agent_steps')
        .select('*')
        .eq('run_id', threadId)
        .order('step_index', { ascending: true })

      const latestUserMsg = messages.filter(m => m.role === 'user').pop()
      if (latestUserMsg) {
        const hasUserMsgInDb = dbSteps?.some(
          s => s.type === 'reasoning' && 
          s.content.role === 'user' && 
          s.content.text === latestUserMsg.text
        )

        if (!hasUserMsgInDb) {
          const nextIndex = dbSteps ? dbSteps.length : 0
          await supabaseAdmin
            .from('agent_steps')
            .insert({
              run_id: threadId,
              step_index: nextIndex,
              type: 'reasoning',
              content: {
                role: 'user',
                text: latestUserMsg.text
              }
            })
        }
      }
    } catch (err) {
      console.error('[AI Chat] Failed to initialize stateful run:', err)
    }
  }

  const getGenerator = (containerId: string, context?: { fileTree?: string; openFile?: { path: string; content: string }; userId?: string; runId?: string; userWorkspaces?: { id: string; name: string; status: string }[] }) => {
    if (model === 'openai') {
      return chatWithOpenAI(threadId ? [] : messages, containerId, context, customOpenaiKey)
    } else if (model === 'anthropic') {
      return chatWithAnthropic(threadId ? [] : messages, containerId, context, customAnthropicKey)
    } else if (model === 'groq') {
      return chatWithGroq(threadId ? [] : messages, containerId, context, customGroqKey)
    } else {
      const geminiMessages: GeminiMessage[] = threadId ? [] : messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }))
      return chatWithGemini(geminiMessages, containerId, context, customGeminiKey)
    }
  }

  if (projectId === 'global') {
    // Pre-fetch user's workspaces so the AI has context in global mode
    let userWorkspaces: { id: string; name: string; status: string }[] = []
    try {
      const { data } = await supabaseAdmin
        .from('projects')
        .select('id, name, status')
        .eq('user_github_id', user.id)
      userWorkspaces = data || []
    } catch (e) {
      console.error('[AI Chat] Failed to pre-fetch workspaces:', e)
    }

    // Stream response using SSE without docker or database checks
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = getGenerator('global', { userId: user.id, runId: threadId, userWorkspaces })

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
  }

  // WAKE CONTAINER: Auto-wake container if it is asleep
  try {
    await ensureContainerRunning(projectId)
  } catch (err) {
    console.error('[AI Chat] Failed to ensure container is running:', err)
  }

  // Get project container
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id, user_github_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_github_id !== user.id) {
    return errorResponse('Project not found', 404)
  }

  if (!project.container_id) {
    return errorResponse('Container not running', 400)
  }

  // Build file tree context
  let fileTree = ''
  try {
    await execInContainer(
      project.container_id,
      ['find', '/workspace', '-maxdepth', '3', '-not', '-path', '*/node_modules/*', '-not', '-path', '*/.git/*'],
      (data) => { fileTree += data }
    )
    fileTree = fileTree.trim().split('\n').map(f => f.replace('/workspace/', '')).join('\n')
  } catch {
    fileTree = '(unable to read file tree)'
  }

  // Stream response using SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = getGenerator(project.container_id!, { fileTree, openFile, userId: user.id, runId: threadId })

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
}
