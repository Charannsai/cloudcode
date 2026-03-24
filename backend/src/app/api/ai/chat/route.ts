import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { chatWithGemini, GeminiMessage } from '@/lib/ai/gemini'
import { execInContainer } from '@/lib/docker'

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const body = await req.json()
  const { projectId, messages, openFile } = body as {
    projectId: string
    messages: { role: 'user' | 'model'; text: string }[]
    openFile?: { path: string; content: string }
  }

  if (!projectId || !messages || messages.length === 0) {
    return errorResponse('Missing projectId or messages')
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

  // Convert messages to Gemini format
  const geminiMessages: GeminiMessage[] = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }))

  // Stream response using SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = chatWithGemini(
          geminiMessages,
          project.container_id!,
          { fileTree, openFile }
        )

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
