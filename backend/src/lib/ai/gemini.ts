import { execInContainer } from '../docker'
import { v4 as uuidv4 } from 'uuid'
import { createProjectInternal } from '../projects'
import { supabaseAdmin } from '../supabase'
import { PlanningGuard } from './planningGuard'
import { ExecutionGuard } from './governance'

export function estimateTokens(text: string): number {
  if (!text) return 0
  // Standard token estimation heuristic (1 token = ~4 characters)
  return Math.ceil(text.length / 4)
}

export async function recordTokens(userId: string | undefined, isBYOK: boolean, tokens: number) {
  if (!userId || tokens <= 0) return
  try {
    const field = isBYOK ? 'byok_tokens_used' : 'ai_tokens_used'
    
    // Fetch current tokens to increment safely
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('ai_tokens_used, byok_tokens_used')
      .eq('github_id', userId)
      .single()

    const currentVal = dbUser?.[field] || 0
    await supabaseAdmin
      .from('users')
      .update({
        [field]: currentVal + tokens,
        updated_at: new Date().toISOString()
      })
      .eq('github_id', userId)
      
    console.log(`[AI Token Tracker] Recorded ${tokens} tokens for user ${userId} (BYOK: ${isBYOK})`)
  } catch (err) {
    console.error('[AI Token Tracker] Failed to record tokens:', err)
  }
}

if (!(global as any).pendingCommands) {
  (global as any).pendingCommands = new Map()
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

export type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: { content: unknown } } }

const TOOL_DECLARATIONS = [
  {
    name: 'read_file',
    description: 'Read the contents of a file in the project workspace. Use this to understand existing code before making changes.',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Relative path to the file from workspace root, e.g. "src/index.ts"' },
      },
      required: ['path'],
    },
  },
  {
    name: 'edit_file',
    description: 'Edit an existing file by replacing specific target content with new content. Always read the file first to know the exact content to replace.',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Relative path to the file' },
        target: { type: 'STRING', description: 'The exact existing content to find and replace (must match exactly)' },
        replacement: { type: 'STRING', description: 'The new content to replace the target with' },
      },
      required: ['path', 'target', 'replacement'],
    },
  },
  {
    name: 'create_file',
    description: 'Create a new file with the given content. Will overwrite if already exists.',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Relative path for the new file' },
        content: { type: 'STRING', description: 'Full content for the new file' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the project workspace.',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Relative path to the file to delete' },
      },
      required: ['path'],
    },
  },
  {
    name: 'run_command',
    description: 'Run a shell command in the project workspace terminal. Use for installing packages, running scripts, git commands, etc.',
    parameters: {
      type: 'OBJECT',
      properties: {
        command: { type: 'STRING', description: 'The shell command to execute, e.g. "npm install express"' },
      },
      required: ['command'],
    },
  },
  {
    name: 'list_files',
    description: 'List files and directories in the project workspace. Returns a tree structure.',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Relative path to list. Use "." for root.' },
      },
      required: ['path'],
    },
  },
  {
    name: 'create_project',
    description: 'Create a new project/workspace with the given name and template type. Use this when the user asks you to create a workspace or project. Valid templates are "node", "react", "empty", "flask", "fastapi", "rust", "gin", "nextjs". Default to "empty" if type is not specified.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'The name of the project/workspace to create' },
        type: {
          type: 'STRING',
          description: 'The template type. Allowed values: "node", "react", "empty", "flask", "fastapi", "rust", "gin", "nextjs"',
          enum: ['node', 'react', 'empty', 'flask', 'fastapi', 'rust', 'gin', 'nextjs']
        },
      },
      required: ['name', 'type'],
    },
  },
]

const SYSTEM_INSTRUCTION = `You are CloudCode AI — an autonomous coding agent embedded in a cloud IDE. You have full access to the user's project files inside a Docker container. You are NOT a chatbot. You are an AGENT.

CORE IDENTITY:
You act, you don't ask. When the user gives you a task, you execute it immediately and completely. You never ask for confirmation, permission, or "would you like me to…?" — you just do it.

CAPABILITIES:
- Read, create, edit, and delete files in the project.
- Run terminal commands (npm install, git, build, test, etc.)
- Understand project structure and architecture.
- Debug errors by reading code and terminal output.
- Create new projects/workspaces from templates.

AGENT RULES:
1. ACT IMMEDIATELY — When given a task, start executing it right away. Do NOT ask "Would you like me to…?" or "Shall I proceed?" — just do the work.
2. ALWAYS read a file before editing it to understand its current content.
3. When editing, use the exact target content that exists in the file.
4. Execute ALL steps needed to complete the task in a single conversation turn. If the task requires creating files, installing packages, and running commands — do all of them.
5. If a command fails, read the error output and fix it automatically.
6. Keep text responses SHORT and action-focused. Show what you did, not what you plan to do.
7. For multi-file changes, execute them all sequentially without pausing for user input.
8. NEVER say things like "Here's how you can do it" or "You can run this command" — YOU run the command, YOU make the change.
9. After completing all actions, give a brief summary of what was accomplished.`

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done' | 'reasoning_event' | 'plan_event'
  content?: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  toolResult?: unknown
  items?: string[]
}

/**
 * Execute a tool call inside the Docker container
 */
export async function executeTool(
  containerId: string,
  toolName: string,
  args: Record<string, unknown>,
  userId?: string
): Promise<unknown> {
  const WORKSPACE = '/workspace'

  switch (toolName) {
    case 'create_project': {
      if (!userId) {
        return { error: 'Unauthorized: User context is missing' }
      }
      try {
        const name = args.name as string
        const type = args.type as any
        const project = await createProjectInternal(userId, name, type)
        return { success: true, project }
      } catch (err) {
        return { error: `Failed to create project: ${(err as Error).message}` }
      }
    }
    case 'read_file': {
      const filePath = `${WORKSPACE}/${args.path}`
      let content = ''
      await execInContainer(containerId, ['cat', filePath], (data) => { content += data })
      return { content: content || '(empty file)' }
    }

    case 'edit_file': {
      const filePath = `${WORKSPACE}/${args.path}`
      // Read current content
      let current = ''
      await execInContainer(containerId, ['cat', filePath], (data) => { current += data })

      const target = args.target as string
      const replacement = args.replacement as string

      if (!current.includes(target)) {
        return { error: `Target content not found in ${args.path}. File content may have changed. Read the file again.` }
      }

      const newContent = current.replace(target, replacement)
      // Write via heredoc to handle special chars
      await execInContainer(containerId, ['sh', '-c', `cat > '${filePath}' << 'CLOUDCODE_EOF'\n${newContent}\nCLOUDCODE_EOF`], () => {})
      return { success: true, path: args.path, message: `File edited successfully` }
    }

    case 'create_file': {
      const filePath = `${WORKSPACE}/${args.path}`
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'))
      // Create directory if needed
      if (dirPath) {
        await execInContainer(containerId, ['mkdir', '-p', dirPath], () => {})
      }
      const content = args.content as string
      await execInContainer(containerId, ['sh', '-c', `cat > '${filePath}' << 'CLOUDCODE_EOF'\n${content}\nCLOUDCODE_EOF`], () => {})
      return { success: true, path: args.path, message: `File created` }
    }

    case 'delete_file': {
      const filePath = `${WORKSPACE}/${args.path}`
      await execInContainer(containerId, ['rm', '-f', filePath], () => {})
      return { success: true, path: args.path, message: `File deleted` }
    }

    case 'run_command': {
      const cmd = args.command as string
      let output = ''
      try {
        await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && ${cmd}`], (data) => { output += data })
      } catch (e) {
        output += `\nCommand error: ${(e as Error).message}`
      }
      // Truncate if too long  
      if (output.length > 4000) {
        output = output.substring(0, 2000) + '\n...(truncated)...\n' + output.substring(output.length - 1500)
      }
      return { output: output || '(no output)' }
    }

    case 'list_files': {
      const dirPath = `${WORKSPACE}/${args.path === '.' ? '' : args.path}`
      let output = ''
      await execInContainer(containerId, ['find', dirPath, '-maxdepth', '3', '-not', '-path', '*/node_modules/*', '-not', '-path', '*/.git/*'], (data) => { output += data })
      return { files: output.trim().split('\n').map(f => f.replace(WORKSPACE + '/', '')) }
    }

    default:
      return { error: `Unknown tool: ${toolName}` }
  }
}

/**
 * Extracts list items from markdown plan/checklist text
 */
function extractPlanItems(text: string): string[] {
  const lines = text.split('\n')
  const items: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    // Match "- [ ] task", "- task", "1. task", "* task"
    const match = trimmed.match(/^(?:-\s*\[\s*\]|-\s*|\*\s*|\d+\.\s*)(.+)$/)
    if (match) {
      const itemText = match[1].trim()
      if (itemText && !itemText.toLowerCase().includes('plan') && itemText.length > 3) {
        items.push(itemText)
      }
    }
  }
  return items
}

/**
 * Stateful run context helper to manage DB storage and re-hydration
 */
export class AgentRunContext {
  runId: string
  userId: string
  stepIndex: number = 0
  callCounter: number = 0
  dbSteps: any[] = []
  completedTools: { name: string; args: any; response: any }[] = []

  constructor(runId: string, userId: string) {
    this.runId = runId
    this.userId = userId
  }

  async init() {
    if (!this.runId || this.runId === 'global' || this.runId === 'none') return

    const { data: dbSteps, error } = await supabaseAdmin
      .from('agent_steps')
      .select('*')
      .eq('run_id', this.runId)
      .order('step_index', { ascending: true })

    if (error) {
      console.error('[AgentRunContext] Failed to load steps:', error)
      return
    }

    this.dbSteps = dbSteps || []
    this.stepIndex = this.dbSteps.length

    // Pair tool calls and results
    for (let i = 0; i < this.dbSteps.length; i++) {
      const step = this.dbSteps[i]
      if (step.type === 'tool_call') {
        const resultStep = this.dbSteps.find((s, idx) => idx > i && s.type === 'tool_result' && s.content.name === step.content.name)
        if (resultStep) {
          this.completedTools.push({
            name: step.content.name,
            args: step.content.args,
            response: resultStep.content.response
          })
        }
      }
    }
    console.log(`[AgentRunContext] Initialized run ${this.runId} with ${this.dbSteps.length} steps. Found ${this.completedTools.length} pre-recorded tool executions.`)
  }

  async saveStep(type: 'plan' | 'reasoning' | 'tool_call' | 'tool_result' | 'error', content: any) {
    if (!this.runId || this.runId === 'global' || this.runId === 'none') return
    try {
      await supabaseAdmin
        .from('agent_steps')
        .insert({
          run_id: this.runId,
          step_index: this.stepIndex++,
          type,
          content
        })
    } catch (err) {
      console.error('[AgentRunContext] Failed to save step:', err)
    }
  }

  getPreRecordedTool(name: string): any | null {
    const preRecorded = this.completedTools[this.callCounter]
    if (preRecorded && preRecorded.name === name) {
      this.callCounter++
      return preRecorded.response
    }
    return null
  }

  rehydrateGeminiHistory(initialMessages: GeminiMessage[]): GeminiMessage[] {
    if (this.dbSteps.length === 0) {
      return initialMessages
    }

    const contents: GeminiMessage[] = []
    
    for (const step of this.dbSteps) {
      if (step.type === 'reasoning') {
        const role = step.content.role || 'model'
        const text = step.content.text || step.content.plan || ''
        
        if (role === 'user') {
          contents.push({ role: 'user', parts: [{ text }] })
        } else {
          const lastMsg = contents[contents.length - 1]
          if (lastMsg && lastMsg.role === 'model') {
            lastMsg.parts.push({ text })
          } else {
            contents.push({ role: 'model', parts: [{ text }] })
          }
        }
      } else if (step.type === 'plan') {
        const text = step.content.plan || `Plan:\n${step.content.items?.map((it: string) => `- ${it}`).join('\n') || ''}`
        const lastMsg = contents[contents.length - 1]
        if (lastMsg && lastMsg.role === 'model') {
          lastMsg.parts.push({ text })
        } else {
          contents.push({ role: 'model', parts: [{ text }] })
        }
      } else if (step.type === 'tool_call') {
        let lastMsg = contents[contents.length - 1]
        if (!lastMsg || lastMsg.role !== 'model') {
          lastMsg = { role: 'model', parts: [] }
          contents.push(lastMsg)
        }
        lastMsg.parts.push({
          functionCall: {
            name: step.content.name,
            args: step.content.args
          }
        })
      } else if (step.type === 'tool_result') {
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: step.content.name,
              response: { content: step.content.response }
            }
          }]
        })
      }
    }

    return contents
  }

  rehydrateOpenAIHistory(initialMessages: any[]): any[] {
    if (this.dbSteps.length === 0) {
      return initialMessages
    }

    const messages: any[] = []
    for (const step of this.dbSteps) {
      if (step.type === 'reasoning') {
        const role = step.content.role || 'assistant'
        const text = step.content.text || step.content.plan || ''
        messages.push({
          role: role === 'user' ? 'user' : 'assistant',
          content: text
        })
      } else if (step.type === 'plan') {
        const text = step.content.plan || `Plan:\n${step.content.items?.map((it: string) => `- ${it}`).join('\n') || ''}`
        messages.push({
          role: 'assistant',
          content: text
        })
      } else if (step.type === 'tool_call') {
        messages.push({
          role: 'assistant',
          tool_calls: [{
            id: step.content.toolCallId || 'call_' + step.id,
            type: 'function',
            function: {
              name: step.content.name,
              arguments: JSON.stringify(step.content.args)
            }
          }]
        })
      } else if (step.type === 'tool_result') {
        const callStep = this.dbSteps.find(s => s.type === 'tool_call' && s.content.name === step.content.name)
        const toolCallId = callStep?.content?.toolCallId || 'call_' + (callStep?.id || step.id)
        messages.push({
          role: 'tool',
          tool_call_id: toolCallId,
          content: JSON.stringify(step.content.response)
        })
      }
    }
    return messages
  }

  rehydrateAnthropicHistory(initialMessages: any[]): any[] {
    if (this.dbSteps.length === 0) {
      return initialMessages
    }

    const messages: any[] = []
    for (const step of this.dbSteps) {
      if (step.type === 'reasoning') {
        const role = step.content.role || 'assistant'
        const text = step.content.text || step.content.plan || ''
        messages.push({
          role: role === 'user' ? 'user' : 'assistant',
          content: text
        })
      } else if (step.type === 'plan') {
        const text = step.content.plan || `Plan:\n${step.content.items?.map((it: string) => `- ${it}`).join('\n') || ''}`
        messages.push({
          role: 'assistant',
          content: text
        })
      } else if (step.type === 'tool_call') {
        messages.push({
          role: 'assistant',
          content: [{
            type: 'tool_use',
            id: step.content.toolCallId || 'call_' + step.id,
            name: step.content.name,
            input: step.content.args
          }]
        })
      } else if (step.type === 'tool_result') {
        const callStep = this.dbSteps.find(s => s.type === 'tool_call' && s.content.name === step.content.name)
        const toolCallId = callStep?.content?.toolCallId || 'call_' + (callStep?.id || step.id)
        messages.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: toolCallId,
            content: JSON.stringify(step.content.response)
          }]
        })
      }
    }
    return messages
  }
}

/**
 * Chat with Gemini using function calling (non-streaming for reliability)
 * Returns an async generator of StreamChunks
 */
export async function* chatWithGemini(
  messages: GeminiMessage[],
  containerId: string,
  context?: { fileTree?: string; openFile?: { path: string; content: string }; userId?: string; runId?: string },
  customApiKey?: string
): AsyncGenerator<StreamChunk> {
  let totalTokens = 0
  const isBYOK = !!(customApiKey && customApiKey.trim() !== '')

  let runCtx: AgentRunContext | null = null
  if (context?.runId && context?.userId) {
    runCtx = new AgentRunContext(context.runId, context.userId)
    await runCtx.init()
  }

  try {
    // 1. Pre-Planning: Gather resource context & inject capability system prompt
    let capabilityPrompt = ''
    if (context?.userId) {
      const resourceCtx = await PlanningGuard.loadContext(context.userId)
      capabilityPrompt = PlanningGuard.buildSystemPrompt(resourceCtx)
      
      // Stream initial resource allocation event to user
      yield { 
        type: 'reasoning_event', 
        content: `Available resources: ${resourceCtx.tokensRemaining === 999999999 ? 'Unlimited' : resourceCtx.tokensRemaining} tokens, ${resourceCtx.workspacesLimit - resourceCtx.workspacesUsed} workspace slots remaining.` 
      }
    }

    // 2. Re-hydrate contents from runCtx if resuming, otherwise use passed messages
    let contents: GeminiMessage[] = []
    if (runCtx && runCtx.dbSteps.length > 0) {
      contents = runCtx.rehydrateGeminiHistory(messages)
      // If we are resuming, stream the rehydrated plan to client
      const planStep = runCtx.dbSteps.find(s => s.type === 'plan')
      if (planStep) {
        yield { type: 'plan_event', items: planStep.content.items }
      }
    } else {
      contents = [...messages]
      // Inject context into the first user message
      if (context && contents.length > 0 && contents[0].role === 'user') {
        let contextPrefix = ''
        if (context.fileTree) {
          contextPrefix += `[Project files:\n${context.fileTree}]\n\n`
        }
        if (context.openFile) {
          contextPrefix += `[Currently open file: ${context.openFile.path}]\n\`\`\`\n${context.openFile.content}\n\`\`\`\n\n`
        }
        const firstPart = contents[0].parts[0]
        if ('text' in firstPart) {
          firstPart.text = contextPrefix + firstPart.text
          // Save initial user message step inside the narrowed scope
          if (runCtx) {
            await runCtx.saveStep('reasoning', { text: firstPart.text, role: 'user' })
          }
        }
      }
    }

    // Update run status in DB to executing
    if (runCtx) {
      await supabaseAdmin
        .from('agent_runs')
        .update({ status: 'executing' })
        .eq('id', runCtx.runId)
    }

    let loopCount = 0
    const MAX_LOOPS = 10

    while (loopCount < MAX_LOOPS) {
      loopCount++

      const hasContainer = containerId && containerId !== 'global' && containerId !== 'none'
      const apiKey = customApiKey && customApiKey.trim() !== '' ? customApiKey.trim() : GEMINI_API_KEY
      const toolsToProvide = hasContainer 
        ? TOOL_DECLARATIONS 
        : TOOL_DECLARATIONS.filter(t => t.name === 'create_project')

      // Calculate input prompt tokens
      let inputPromptText = ''
      inputPromptText += hasContainer 
        ? SYSTEM_INSTRUCTION 
        : 'You are CloudCode AI, a general helpful developer assistant.'
      inputPromptText += '\n' + capabilityPrompt
      
      for (const content of contents) {
        for (const part of content.parts) {
          if ('text' in part) {
            inputPromptText += part.text
          } else if ('functionCall' in part) {
            inputPromptText += JSON.stringify(part.functionCall)
          } else if ('functionResponse' in part) {
            inputPromptText += JSON.stringify(part.functionResponse)
          }
        }
      }
      if (toolsToProvide.length > 0) {
        inputPromptText += JSON.stringify(toolsToProvide)
      }
      totalTokens += estimateTokens(inputPromptText)

      const response = await fetch(`${GEMINI_API_URL.replace('generateContent', 'streamGenerateContent')}?alt=sse&key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(toolsToProvide.length > 0 ? { tools: [{ functionDeclarations: toolsToProvide }] } : {}),
          systemInstruction: {
            parts: [{
              text: (hasContainer 
                ? SYSTEM_INSTRUCTION 
                : 'You are CloudCode AI — an autonomous coding agent. You act, you don\'t ask. When the user wants a project, create it immediately using the create_project tool. Never ask for confirmation. If they want file operations but have no project, create the project first, then tell them to open it.')
                + '\n' + capabilityPrompt
            }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        yield { type: 'error', content: `Gemini API error: ${response.status} - ${errText}` }
        if (runCtx) {
          await runCtx.saveStep('error', { message: `Gemini API error: ${response.status}` })
          await supabaseAdmin.from('agent_runs').update({ status: 'failed' }).eq('id', runCtx.runId)
        }
        return
      }

      if (!response.body) {
        yield { type: 'error', content: 'No response body from Gemini' }
        return
      }

      const reader = (response.body as any).getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let fullText = ''
      const parts: GeminiPart[] = []

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          
          const jsonStr = trimmed.substring(5).trim()
          if (!jsonStr) continue
          
          try {
            const chunkData = JSON.parse(jsonStr)
            const chunkParts = chunkData.candidates?.[0]?.content?.parts
            if (chunkParts && Array.isArray(chunkParts)) {
              for (const part of chunkParts) {
                if ('text' in part && part.text) {
                  const chunkText = part.text
                  fullText += chunkText
                  yield { type: 'text', content: chunkText }
                }
                if ('functionCall' in part) {
                  parts.push(part)
                }
              }
            }
          } catch (e) {
            // Ignore incomplete JSON errors in chunk boundaries
          }
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim()
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.substring(5).trim()
          try {
            const chunkData = JSON.parse(jsonStr)
            const chunkParts = chunkData.candidates?.[0]?.content?.parts
            if (chunkParts && Array.isArray(chunkParts)) {
              for (const part of chunkParts) {
                if ('text' in part && part.text) {
                  const chunkText = part.text
                  fullText += chunkText
                  yield { type: 'text', content: chunkText }
                }
                if ('functionCall' in part) {
                  parts.push(part)
                }
              }
            }
          } catch {}
        }
      }

      if (fullText) {
        parts.unshift({ text: fullText })
        
        if (runCtx) {
          await runCtx.saveStep('reasoning', { text: fullText, role: 'model' })
          
          const planItems = extractPlanItems(fullText)
          if (planItems.length > 0) {
            await runCtx.saveStep('plan', { items: planItems, plan: fullText })
            yield { type: 'plan_event', items: planItems }
          }
        }
      }

      let hasFunctionCall = false
      if (parts.some(p => 'functionCall' in p)) {
        hasFunctionCall = true
      }

      // Calculate output completion tokens
      let outputCompletionText = ''
      for (const part of parts) {
        if ('text' in part && part.text) {
          outputCompletionText += part.text
        } else if ('functionCall' in part) {
          outputCompletionText += JSON.stringify(part.functionCall)
        }
      }
      totalTokens += estimateTokens(outputCompletionText)

      // Add model response to history
      contents.push({
        role: 'model',
        parts,
      })

      for (const part of parts) {
        if ('functionCall' in part) {
          const { name, args } = part.functionCall

          let result: any

          const preRecorded = runCtx ? runCtx.getPreRecordedTool(name) : null
          if (preRecorded !== null) {
            console.log(`[Gemini Loop] Reusing pre-recorded result for tool ${name}`)
            result = preRecorded
            yield { type: 'tool_call', toolName: name, toolArgs: args }
            yield { type: 'tool_result', toolName: name, toolResult: result }
          } else {
            if (runCtx && context?.userId) {
              try {
                await ExecutionGuard.validate(runCtx.runId, name, args, context.userId)
              } catch (validationErr) {
                const errMsg = (validationErr as Error).message
                yield { type: 'error', content: errMsg }
                await runCtx.saveStep('error', { message: errMsg })
                await supabaseAdmin.from('agent_runs').update({ status: 'failed' }).eq('id', runCtx.runId)
                return
              }
            }

            if (runCtx) {
              await runCtx.saveStep('tool_call', { name, args })
            }

            if (name === 'run_command') {
              const command = args.command as string
              const approvalId = uuidv4()

              yield { 
                type: 'tool_call', 
                toolName: name, 
                toolArgs: { ...args, approvalId, status: 'pending' } 
              }

              if (runCtx) {
                await supabaseAdmin
                  .from('agent_runs')
                  .update({ status: 'waiting' })
                  .eq('id', runCtx.runId)
              }

              const approvalPromise = new Promise<boolean>((resolve) => {
                (global as any).pendingCommands.set(approvalId, { resolve, command })
              })

              const approved = await approvalPromise

              if (approved) {
                if (runCtx) {
                  await supabaseAdmin
                    .from('agent_runs')
                    .update({ status: 'executing' })
                    .eq('id', runCtx.runId)
                }

                yield { 
                  type: 'tool_call', 
                  toolName: name, 
                  toolArgs: { ...args, approvalId, status: 'running' } 
                }
                result = await executeTool(containerId, name, args as Record<string, unknown>, context?.userId)
              } else {
                if (runCtx) {
                  await supabaseAdmin
                    .from('agent_runs')
                    .update({ status: 'paused' })
                    .eq('id', runCtx.runId)
                }
                result = { error: 'Command execution rejected by user.' }
              }
            } else {
              yield { type: 'tool_call', toolName: name, toolArgs: args as Record<string, unknown> }
              result = await executeTool(containerId, name, args as Record<string, unknown>, context?.userId)
            }

            yield { 
              type: 'tool_result', 
              toolName: name, 
              toolResult: result,
              toolArgs: { approvalId: (args as any).approvalId }
            }

            if (runCtx) {
              await runCtx.saveStep('tool_result', { name, response: result })
              
              const tokensCost = estimateTokens(JSON.stringify(result))
              const commandsCost = name === 'run_command' ? 1 : 0
              const writesCost = (name === 'edit_file' || name === 'create_file') ? 1 : 0
              
              await ExecutionGuard.recordExecution(runCtx.runId, name, {
                tokens: tokensCost,
                commands: commandsCost,
                writes: writesCost
              }, args)
            }
          }

          contents.push({
            role: 'user',
            parts: [{
              functionResponse: {
                name,
                response: { content: result },
              },
            }],
          })
        }
      }

      if (!hasFunctionCall) {
        break
      }
    }

    if (runCtx) {
      await supabaseAdmin
        .from('agent_runs')
        .update({ status: 'completed' })
        .eq('id', runCtx.runId)
    }
  } catch (err) {
    yield { type: 'error', content: `Error: ${(err as Error).message}` }
    if (runCtx) {
      await runCtx.saveStep('error', { message: (err as Error).message })
      await supabaseAdmin.from('agent_runs').update({ status: 'failed' }).eq('id', runCtx.runId)
    }
    return
  } finally {
    if (context?.userId && totalTokens > 0) {
      await recordTokens(context.userId, isBYOK, totalTokens)
    }
  }

  yield { type: 'done' }
}

function convertSchemaToLowercase(schema: any): any {
  if (!schema) return schema
  const newSchema = { ...schema }
  if (typeof newSchema.type === 'string') {
    newSchema.type = newSchema.type.toLowerCase()
  }
  if (newSchema.properties) {
    const newProps: any = {}
    for (const key of Object.keys(newSchema.properties)) {
      newProps[key] = convertSchemaToLowercase(newSchema.properties[key])
    }
    newSchema.properties = newProps
  }
  return newSchema
}

export async function* chatWithOpenAI(
  messages: { role: 'user' | 'model'; text: string }[],
  containerId: string,
  context?: { fileTree?: string; openFile?: { path: string; content: string }; userId?: string; runId?: string },
  customApiKey?: string
): AsyncGenerator<StreamChunk> {
  const hasContainer = containerId && containerId !== 'global' && containerId !== 'none'
  const apiKey = customApiKey && customApiKey.trim() !== '' ? customApiKey.trim() : OPENAI_API_KEY

  if (!apiKey) {
    yield { type: 'error', content: 'OpenAI API key not configured. Please add it under AI API Keys (BYOK) in settings.' }
    return
  }

  let runCtx: AgentRunContext | null = null
  if (context?.runId && context?.userId) {
    runCtx = new AgentRunContext(context.runId, context.userId)
    await runCtx.init()
  }

  const toolsToProvide = hasContainer 
    ? TOOL_DECLARATIONS 
    : TOOL_DECLARATIONS.filter(t => t.name === 'create_project')

  const openAITools = toolsToProvide.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: convertSchemaToLowercase(tool.parameters)
    }
  }))

  let capabilityPrompt = ''
  if (context?.userId) {
    const resourceCtx = await PlanningGuard.loadContext(context.userId)
    capabilityPrompt = PlanningGuard.buildSystemPrompt(resourceCtx)
    yield { 
      type: 'reasoning_event', 
      content: `Available resources: ${resourceCtx.tokensRemaining === 999999999 ? 'Unlimited' : resourceCtx.tokensRemaining} tokens, ${resourceCtx.workspacesLimit - resourceCtx.workspacesUsed} workspace slots remaining.` 
    }
  }

  let openAIMessages: any[] = []
  
  if (runCtx && runCtx.dbSteps.length > 0) {
    openAIMessages = runCtx.rehydrateOpenAIHistory([])
    const planStep = runCtx.dbSteps.find(s => s.type === 'plan')
    if (planStep) {
      yield { type: 'plan_event', items: planStep.content.items }
    }
  } else {
    openAIMessages.push({
      role: 'system',
      content: (hasContainer 
        ? SYSTEM_INSTRUCTION 
        : 'You are CloudCode AI, a general helpful developer assistant. You can create a new project/workspace using the create_project tool when the user requests it. If they ask to read, edit, or run commands on files, advise them to select or create a project first.')
        + '\n' + capabilityPrompt
    })

    let firstUserProcessed = false
    for (const m of messages) {
      let content = m.text
      if (!firstUserProcessed && m.role === 'user' && context) {
        firstUserProcessed = true
        let contextPrefix = ''
        if (context.fileTree) {
          contextPrefix += `[Project files:\n${context.fileTree}]\n\n`
        }
        if (context.openFile) {
          contextPrefix += `[Currently open file: ${context.openFile.path}]\n\`\`\`\n${context.openFile.content}\n\`\`\`\n\n`
        }
        content = contextPrefix + content
      }
      openAIMessages.push({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: content
      })
      
      if (runCtx && m.role === 'user') {
        await runCtx.saveStep('reasoning', { text: content, role: 'user' })
      }
    }
  }

  if (runCtx) {
    await supabaseAdmin
      .from('agent_runs')
      .update({ status: 'executing' })
      .eq('id', runCtx.runId)
  }

  let totalTokens = 0
  const isBYOK = !!(customApiKey && customApiKey.trim() !== '')

  try {
    let loopCount = 0
    const MAX_LOOPS = 10

    while (loopCount < MAX_LOOPS) {
      loopCount++

      let inputPromptText = ''
      for (const msg of openAIMessages) {
        if (typeof msg.content === 'string') {
          inputPromptText += msg.content
        } else if (Array.isArray(msg.content)) {
          inputPromptText += JSON.stringify(msg.content)
        }
        if (msg.tool_calls) {
          inputPromptText += JSON.stringify(msg.tool_calls)
        }
      }
      if (toolsToProvide.length > 0) {
        inputPromptText += JSON.stringify(openAITools)
      }
      totalTokens += estimateTokens(inputPromptText)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: openAIMessages,
          ...(toolsToProvide.length > 0 ? { tools: openAITools, tool_choice: 'auto' } : {}),
          temperature: 0.7,
          stream: true
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        yield { type: 'error', content: `OpenAI API error: ${response.status} - ${errText}` }
        if (runCtx) {
          await runCtx.saveStep('error', { message: `OpenAI API error: ${response.status}` })
          await supabaseAdmin.from('agent_runs').update({ status: 'failed' }).eq('id', runCtx.runId)
        }
        return
      }

      if (!response.body) {
        yield { type: 'error', content: 'No response body from OpenAI' }
        return
      }

      const reader = (response.body as any).getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let fullText = ''
      const toolCalls: any[] = []

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          
          const jsonStr = trimmed.substring(5).trim()
          if (jsonStr === '[DONE]') continue
          if (!jsonStr) continue
          
          try {
            const chunkData = JSON.parse(jsonStr)
            const choice = chunkData.choices?.[0]
            if (choice && choice.delta) {
              if (choice.delta.content) {
                const chunkText = choice.delta.content
                fullText += chunkText
                yield { type: 'text', content: chunkText }
              }
              if (choice.delta.tool_calls) {
                for (const tc of choice.delta.tool_calls) {
                  const idx = tc.index
                  if (idx === undefined) continue
                  if (!toolCalls[idx]) {
                    toolCalls[idx] = {
                      id: tc.id || '',
                      type: tc.type || 'function',
                      function: { name: '', arguments: '' }
                    }
                  }
                  if (tc.id) toolCalls[idx].id = tc.id
                  if (tc.type) toolCalls[idx].type = tc.type
                  if (tc.function) {
                    if (tc.function.name) toolCalls[idx].function.name = tc.function.name
                    if (tc.function.arguments) toolCalls[idx].function.arguments += tc.function.arguments
                  }
                }
              }
            }
          } catch (e) {
            // Ignore incomplete JSON errors in chunk boundaries
          }
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim()
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.substring(5).trim()
          if (jsonStr !== '[DONE]') {
            try {
              const chunkData = JSON.parse(jsonStr)
              const choice = chunkData.choices?.[0]
              if (choice && choice.delta) {
                if (choice.delta.content) {
                  const chunkText = choice.delta.content
                  fullText += chunkText
                  yield { type: 'text', content: chunkText }
                }
                if (choice.delta.tool_calls) {
                  for (const tc of choice.delta.tool_calls) {
                    const idx = tc.index
                    if (idx === undefined) continue
                    if (!toolCalls[idx]) {
                      toolCalls[idx] = {
                        id: tc.id || '',
                        type: tc.type || 'function',
                        function: { name: '', arguments: '' }
                      }
                    }
                    if (tc.id) toolCalls[idx].id = tc.id
                    if (tc.type) toolCalls[idx].type = tc.type
                    if (tc.function) {
                      if (tc.function.name) toolCalls[idx].function.name = tc.function.name
                      if (tc.function.arguments) toolCalls[idx].function.arguments += tc.function.arguments
                    }
                  }
                }
              }
            } catch {}
          }
        }
      }

      const finalToolCalls = toolCalls.filter(Boolean)

      const assistantMsg: any = { role: 'assistant' }
      if (fullText) {
        assistantMsg.content = fullText
        
        if (runCtx) {
          await runCtx.saveStep('reasoning', { text: fullText, role: 'model' })
          
          const planItems = extractPlanItems(fullText)
          if (planItems.length > 0) {
            await runCtx.saveStep('plan', { items: planItems, plan: fullText })
            yield { type: 'plan_event', items: planItems }
          }
        }
      }
      if (finalToolCalls.length > 0) {
        assistantMsg.tool_calls = finalToolCalls
      }

      let outputCompletionText = ''
      if (fullText) outputCompletionText += fullText
      if (finalToolCalls.length > 0) outputCompletionText += JSON.stringify(finalToolCalls)
      totalTokens += estimateTokens(outputCompletionText)

      openAIMessages.push(assistantMsg)

      if (finalToolCalls.length === 0) {
        break
      }

      for (const tc of finalToolCalls) {
        const name = tc.function.name
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(tc.function.arguments)
        } catch (e) {
          console.error('Failed to parse tool arguments:', e)
        }

        let result: any

        const preRecorded = runCtx ? runCtx.getPreRecordedTool(name) : null
        if (preRecorded !== null) {
          console.log(`[OpenAI Loop] Reusing pre-recorded result for tool ${name}`)
          result = preRecorded
          yield { type: 'tool_call', toolName: name, toolArgs: args }
          yield { type: 'tool_result', toolName: name, toolResult: result }
        } else {
          if (runCtx && context?.userId) {
            try {
              await ExecutionGuard.validate(runCtx.runId, name, args, context.userId)
            } catch (validationErr) {
              const errMsg = (validationErr as Error).message
              yield { type: 'error', content: errMsg }
              await runCtx.saveStep('error', { message: errMsg })
              await supabaseAdmin.from('agent_runs').update({ status: 'failed' }).eq('id', runCtx.runId)
              return
            }
          }

          if (runCtx) {
            await runCtx.saveStep('tool_call', { name, args, toolCallId: tc.id })
          }

          if (name === 'run_command') {
            const command = args.command as string
            const approvalId = uuidv4()

            yield { 
              type: 'tool_call', 
              toolName: name, 
              toolArgs: { ...args, approvalId, status: 'pending' } 
            }

            if (runCtx) {
              await supabaseAdmin
                .from('agent_runs')
                .update({ status: 'waiting' })
                .eq('id', runCtx.runId)
            }

            const approvalPromise = new Promise<boolean>((resolve) => {
              (global as any).pendingCommands.set(approvalId, { resolve, command })
            })

            const approved = await approvalPromise

            if (approved) {
              if (runCtx) {
                await supabaseAdmin
                  .from('agent_runs')
                  .update({ status: 'executing' })
                  .eq('id', runCtx.runId)
              }

              yield { 
                type: 'tool_call', 
                toolName: name, 
                toolArgs: { ...args, approvalId, status: 'running' } 
              }
              result = await executeTool(containerId, name, args, context?.userId)
            } else {
              if (runCtx) {
                await supabaseAdmin
                  .from('agent_runs')
                  .update({ status: 'paused' })
                  .eq('id', runCtx.runId)
              }
              result = { error: 'Command execution rejected by user.' }
            }
          } else {
            yield { type: 'tool_call', toolName: name, toolArgs: args }
            result = await executeTool(containerId, name, args, context?.userId)
          }

          yield { 
            type: 'tool_result', 
            toolName: name, 
            toolResult: result,
            toolArgs: { approvalId: (args as any).approvalId }
          }

          if (runCtx) {
            await runCtx.saveStep('tool_result', { name, response: result })
            
            const tokensCost = estimateTokens(JSON.stringify(result))
            const commandsCost = name === 'run_command' ? 1 : 0
            const writesCost = (name === 'edit_file' || name === 'create_file') ? 1 : 0
            
            await ExecutionGuard.recordExecution(runCtx.runId, name, {
              tokens: tokensCost,
              commands: commandsCost,
              writes: writesCost
            }, args)
          }
        }

        openAIMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result)
        })
      }
    }

    if (runCtx) {
      await supabaseAdmin
        .from('agent_runs')
        .update({ status: 'completed' })
        .eq('id', runCtx.runId)
    }
  } catch (err) {
    yield { type: 'error', content: `Error: ${(err as Error).message}` }
    if (runCtx) {
      await runCtx.saveStep('error', { message: (err as Error).message })
      await supabaseAdmin.from('agent_runs').update({ status: 'failed' }).eq('id', runCtx.runId)
    }
    return
  } finally {
    if (context?.userId && totalTokens > 0) {
      await recordTokens(context.userId, isBYOK, totalTokens)
    }
  }

  yield { type: 'done' }
}

export async function* chatWithAnthropic(
  messages: { role: 'user' | 'model'; text: string }[],
  containerId: string,
  context?: { fileTree?: string; openFile?: { path: string; content: string }; userId?: string; runId?: string },
  customApiKey?: string
): AsyncGenerator<StreamChunk> {
  const hasContainer = containerId && containerId !== 'global' && containerId !== 'none'
  const apiKey = customApiKey && customApiKey.trim() !== '' ? customApiKey.trim() : ANTHROPIC_API_KEY

  if (!apiKey) {
    yield { type: 'error', content: 'Anthropic API key not configured. Please add it under AI API Keys (BYOK) in settings.' }
    return
  }

  let runCtx: AgentRunContext | null = null
  if (context?.runId && context?.userId) {
    runCtx = new AgentRunContext(context.runId, context.userId)
    await runCtx.init()
  }

  const toolsToProvide = hasContainer 
    ? TOOL_DECLARATIONS 
    : TOOL_DECLARATIONS.filter(t => t.name === 'create_project')

  const anthropicTools = toolsToProvide.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: convertSchemaToLowercase(tool.parameters)
  }))

  let capabilityPrompt = ''
  if (context?.userId) {
    const resourceCtx = await PlanningGuard.loadContext(context.userId)
    capabilityPrompt = PlanningGuard.buildSystemPrompt(resourceCtx)
    yield { 
      type: 'reasoning_event', 
      content: `Available resources: ${resourceCtx.tokensRemaining === 999999999 ? 'Unlimited' : resourceCtx.tokensRemaining} tokens, ${resourceCtx.workspacesLimit - resourceCtx.workspacesUsed} workspace slots remaining.` 
    }
  }

  let anthropicMessages: any[] = []
  
  if (runCtx && runCtx.dbSteps.length > 0) {
    anthropicMessages = runCtx.rehydrateAnthropicHistory([])
    const planStep = runCtx.dbSteps.find(s => s.type === 'plan')
    if (planStep) {
      yield { type: 'plan_event', items: planStep.content.items }
    }
  } else {
    let firstUserProcessed = false
    for (const m of messages) {
      let content = m.text
      if (!firstUserProcessed && m.role === 'user' && context) {
        firstUserProcessed = true
        let contextPrefix = ''
        if (context.fileTree) {
          contextPrefix += `[Project files:\n${context.fileTree}]\n\n`
        }
        if (context.openFile) {
          contextPrefix += `[Currently open file: ${context.openFile.path}]\n\`\`\`\n${context.openFile.content}\n\`\`\`\n\n`
        }
        content = contextPrefix + content
      }
      anthropicMessages.push({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: content
      })
      
      if (runCtx && m.role === 'user') {
        await runCtx.saveStep('reasoning', { text: content, role: 'user' })
      }
    }
  }

  if (runCtx) {
    await supabaseAdmin
      .from('agent_runs')
      .update({ status: 'executing' })
      .eq('id', runCtx.runId)
  }

  let totalTokens = 0
  const isBYOK = !!(customApiKey && customApiKey.trim() !== '')

  try {
    let loopCount = 0
    const MAX_LOOPS = 10

    while (loopCount < MAX_LOOPS) {
      loopCount++

      let inputPromptText = ''
      inputPromptText += hasContainer 
        ? SYSTEM_INSTRUCTION 
        : 'You are CloudCode AI, a general helpful developer assistant.'
      inputPromptText += '\n' + capabilityPrompt
      
      for (const msg of anthropicMessages) {
        if (typeof msg.content === 'string') {
          inputPromptText += msg.content
        } else {
          inputPromptText += JSON.stringify(msg.content)
        }
      }
      if (toolsToProvide.length > 0) {
        inputPromptText += JSON.stringify(anthropicTools)
      }
      totalTokens += estimateTokens(inputPromptText)

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          system: (hasContainer 
            ? SYSTEM_INSTRUCTION 
            : 'You are CloudCode AI, a general helpful developer assistant. You can create a new project/workspace using the create_project tool when the user requests it. If they ask to read, edit, or run commands on files, advise them to select or create a project first.')
            + '\n' + capabilityPrompt,
          messages: anthropicMessages,
          ...(toolsToProvide.length > 0 ? { tools: anthropicTools } : {}),
          temperature: 0.7,
          stream: true
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        yield { type: 'error', content: `Anthropic API error: ${response.status} - ${errText}` }
        if (runCtx) {
          await runCtx.saveStep('error', { message: `Anthropic API error: ${response.status}` })
          await supabaseAdmin.from('agent_runs').update({ status: 'failed' }).eq('id', runCtx.runId)
        }
        return
      }

      if (!response.body) {
        yield { type: 'error', content: 'No response body from Anthropic' }
        return
      }

      const reader = (response.body as any).getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let fullText = ''
      const contentBlocks: any[] = []

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          
          const jsonStr = trimmed.substring(5).trim()
          if (!jsonStr) continue
          
          try {
            const chunkData = JSON.parse(jsonStr)
            if (chunkData.type === 'content_block_start') {
              const idx = chunkData.index
              if (chunkData.content_block) {
                contentBlocks[idx] = chunkData.content_block
                if (contentBlocks[idx].type === 'tool_use') {
                  contentBlocks[idx].input = ''
                }
              }
            } else if (chunkData.type === 'content_block_delta') {
              const idx = chunkData.index
              const delta = chunkData.delta
              if (delta) {
                if (delta.type === 'text_delta' && delta.text) {
                  fullText += delta.text
                  yield { type: 'text', content: delta.text }
                  if (!contentBlocks[idx]) {
                    contentBlocks[idx] = { type: 'text', text: '' }
                  }
                  contentBlocks[idx].text = (contentBlocks[idx].text || '') + delta.text
                } else if (delta.type === 'input_json_delta' && delta.partial_json) {
                  if (!contentBlocks[idx]) {
                    contentBlocks[idx] = { type: 'tool_use', name: '', input: '' }
                  }
                  contentBlocks[idx].input += delta.partial_json
                }
              }
            }
          } catch (e) {
            // Ignore incomplete JSON errors in chunk boundaries
          }
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim()
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.substring(5).trim()
          try {
            const chunkData = JSON.parse(jsonStr)
            if (chunkData.type === 'content_block_delta') {
              const idx = chunkData.index
              const delta = chunkData.delta
              if (delta) {
                if (delta.type === 'text_delta' && delta.text) {
                  fullText += delta.text
                  yield { type: 'text', content: delta.text }
                  if (!contentBlocks[idx]) {
                    contentBlocks[idx] = { type: 'text', text: '' }
                  }
                  contentBlocks[idx].text = (contentBlocks[idx].text || '') + delta.text
                } else if (delta.type === 'input_json_delta' && delta.partial_json) {
                  if (!contentBlocks[idx]) {
                    contentBlocks[idx] = { type: 'tool_use', name: '', input: '' }
                  }
                  contentBlocks[idx].input += delta.partial_json
                }
              }
            }
          } catch {}
        }
      }

      const finalContent = contentBlocks.filter(Boolean)
      for (const block of finalContent) {
        if (block.type === 'tool_use' && typeof block.input === 'string') {
          try {
            block.input = JSON.parse(block.input)
          } catch (e) {
            block.input = {}
          }
        }
      }

      if (fullText) {
        if (runCtx) {
          await runCtx.saveStep('reasoning', { text: fullText, role: 'model' })
          
          const planItems = extractPlanItems(fullText)
          if (planItems.length > 0) {
            await runCtx.saveStep('plan', { items: planItems, plan: fullText })
            yield { type: 'plan_event', items: planItems }
          }
        }
      }

      let outputCompletionText = ''
      for (const block of finalContent) {
        if (block.type === 'text') {
          outputCompletionText += block.text
        } else if (block.type === 'tool_use') {
          outputCompletionText += JSON.stringify(block)
        }
      }
      totalTokens += estimateTokens(outputCompletionText)

      anthropicMessages.push({
        role: 'assistant',
        content: finalContent
      })

      const toolResultBlocks: any[] = []
      let hasToolUse = false

      for (const block of finalContent) {
        if (block.type === 'tool_use') {
          hasToolUse = true
          const name = block.name
          const args = block.input || {}
          
          let result: any

          const preRecorded = runCtx ? runCtx.getPreRecordedTool(name) : null
          if (preRecorded !== null) {
            console.log(`[Anthropic Loop] Reusing pre-recorded result for tool ${name}`)
            result = preRecorded
            yield { type: 'tool_call', toolName: name, toolArgs: args }
            yield { type: 'tool_result', toolName: name, toolResult: result }
          } else {
            if (runCtx && context?.userId) {
              try {
                await ExecutionGuard.validate(runCtx.runId, name, args, context.userId)
              } catch (validationErr) {
                const errMsg = (validationErr as Error).message
                yield { type: 'error', content: errMsg }
                await runCtx.saveStep('error', { message: errMsg })
                await supabaseAdmin.from('agent_runs').update({ status: 'failed' }).eq('id', runCtx.runId)
                return
              }
            }

            if (runCtx) {
              await runCtx.saveStep('tool_call', { name, args, toolCallId: block.id })
            }

            if (name === 'run_command') {
              const command = args.command as string
              const approvalId = uuidv4()

              yield { 
                type: 'tool_call', 
                toolName: name, 
                toolArgs: { ...args, approvalId, status: 'pending' } 
              }

              if (runCtx) {
                await supabaseAdmin
                  .from('agent_runs')
                  .update({ status: 'waiting' })
                  .eq('id', runCtx.runId)
              }

              const approvalPromise = new Promise<boolean>((resolve) => {
                (global as any).pendingCommands.set(approvalId, { resolve, command })
              })

              const approved = await approvalPromise

              if (approved) {
                if (runCtx) {
                  await supabaseAdmin
                    .from('agent_runs')
                    .update({ status: 'executing' })
                    .eq('id', runCtx.runId)
                }

                yield { 
                  type: 'tool_call', 
                  toolName: name, 
                  toolArgs: { ...args, approvalId, status: 'running' } 
                }
                result = await executeTool(containerId, name, args, context?.userId)
              } else {
                if (runCtx) {
                  await supabaseAdmin
                    .from('agent_runs')
                    .update({ status: 'paused' })
                    .eq('id', runCtx.runId)
                }
                result = { error: 'Command execution rejected by user.' }
              }
            } else {
              yield { type: 'tool_call', toolName: name, toolArgs: args }
              result = await executeTool(containerId, name, args, context?.userId)
            }

            yield { 
              type: 'tool_result', 
              toolName: name, 
              toolResult: result,
              toolArgs: { approvalId: (args as any).approvalId }
            }

            if (runCtx) {
              await runCtx.saveStep('tool_result', { name, response: result })
              
              const tokensCost = estimateTokens(JSON.stringify(result))
              const commandsCost = name === 'run_command' ? 1 : 0
              const writesCost = (name === 'edit_file' || name === 'create_file') ? 1 : 0
              
              await ExecutionGuard.recordExecution(runCtx.runId, name, {
                tokens: tokensCost,
                commands: commandsCost,
                writes: writesCost
              }, args)
            }
          }

          toolResultBlocks.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result)
          })
        }
      }

      if (!hasToolUse) {
        break
      }

      anthropicMessages.push({
        role: 'user',
        content: toolResultBlocks
      })
    }

    if (runCtx) {
      await supabaseAdmin
        .from('agent_runs')
        .update({ status: 'completed' })
        .eq('id', runCtx.runId)
    }
  } catch (err) {
    yield { type: 'error', content: `Error: ${(err as Error).message}` }
    if (runCtx) {
      await runCtx.saveStep('error', { message: (err as Error).message })
      await supabaseAdmin.from('agent_runs').update({ status: 'failed' }).eq('id', runCtx.runId)
    }
    return
  } finally {
    if (context?.userId && totalTokens > 0) {
      await recordTokens(context.userId, isBYOK, totalTokens)
    }
  }

  yield { type: 'done' }
}
