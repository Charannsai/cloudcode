import { execInContainer, ensureContainerRunning } from '../docker'
import { v4 as uuidv4 } from 'uuid'
import { createProjectInternal } from '../projects'
import { supabaseAdmin } from '../supabase'
import { PlanningGuard } from './planningGuard'
import { ExecutionGuard } from './governance'
import { z } from 'zod'
import { tool } from '@langchain/core/tools'
import { BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGroq } from '@langchain/groq'
import { Annotation, StateGraph, START, END } from '@langchain/langgraph'

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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''

const SYSTEM_INSTRUCTION = `You are CloudCode AI — an autonomous coding agent embedded in a cloud IDE. You have full access to the user's project files inside a Docker container. You are NOT a chatbot. You are an AGENT.

CORE IDENTITY & AGENTIC BEHAVIOR:
1. ACT IMMEDIATELY — When given a task, execute it immediately and completely. You don't ask for permission or confirmation (unless a tool specifically requires approval) — you just do the work.
2. PLAN FIRST — At the very beginning of your response, before calling any tools, you MUST write a clear, step-by-step checklist of the tasks you will perform to accomplish the user's request. Format this checklist as a standard markdown list (e.g., "- [ ] Read existing code", "- [ ] Create new component", "- [ ] Run tests"). This plan will be parsed and displayed as a progress checklist in the UI.
3. REASON OUT LOUD — You must explain your reasoning and thoughts progressively in real-time. Before every single tool call, output a short, action-focused sentence explaining *why* you are calling that tool and what you expect to achieve (e.g., "Reading src/App.tsx to understand the current layout...", "Running npm run build to verify our changes...").
4. STREAM PROGRESSIVELY — Output your thoughts and explanations continuously word-by-word. This provides a smooth, real-time streaming experience for the user. Do not remain silent or output sudden leaps of action.
5. ALWAYS read a file before editing it to understand its current content.
6. When editing, use the exact target content that exists in the file.
7. Execute ALL steps needed to complete the task in a single conversation turn. If a command fails, read the error output and fix it automatically.
8. NEVER say things like "Here's how you can do it" or "You can run this command" — YOU run the command, YOU make the change.
9. After completing all actions, mark the plan items as completed and give a brief, factual summary of what was accomplished.
10. SMART TOOL-CALLING — Do NOT invoke any tools (e.g., read_file, edit_file, run_command, list_files) for simple greetings, social chit-chat, or general questions that do not require project context (e.g., "Hi", "Hello", "How are you?", "What is a closure in JavaScript?"). Instead, respond politely and directly in pure English. Only invoke tools when the user explicitly asks you to perform a task on their projects, files, or workspace terminal.`

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done' | 'reasoning_event' | 'plan_event'
  content?: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  toolResult?: unknown
  items?: string[]
}

/**
 * Execute a tool call inside the Docker container (Used directly by approve route)
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
        const resourceCtx = await PlanningGuard.loadContext(userId)
        if (resourceCtx.workspacesLimit !== 0 && resourceCtx.workspacesUsed >= resourceCtx.workspacesLimit) {
          return { error: `Workspace limit exceeded. You have already used ${resourceCtx.workspacesUsed} out of ${resourceCtx.workspacesLimit} workspaces. Please upgrade your plan in settings or delete existing workspaces.` }
        }

        const name = args.name as string
        const setupCommands = args.setupCommands as string[] | undefined
        const project = await createProjectInternal(userId, name, 'empty')
        
        let projectContainerId: string | null = null
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 1000))
          const { data: updatedProject } = await supabaseAdmin
            .from('projects')
            .select('container_id, status')
            .eq('id', project.id)
            .single()
          if (updatedProject?.container_id && updatedProject.status === 'ready') {
            projectContainerId = updatedProject.container_id
            break
          }
          if (updatedProject?.status === 'error') {
            return { success: true, project, container_id: null, message: 'Project created but container failed to provision.' }
          }
        }

        // Auto-run setup commands to scaffold any tech stack
        if (projectContainerId && setupCommands && setupCommands.length > 0) {
          for (const cmd of setupCommands) {
            try {
              await execInContainer(projectContainerId, ['sh', '-c', `cd /workspace && ${cmd}`], () => {})
            } catch (e) {
              console.error(`[CreateProject] Setup command failed: ${cmd}`, (e as Error).message)
            }
          }
        }
        
        return { success: true, project, container_id: projectContainerId }
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
      let current = ''
      await execInContainer(containerId, ['cat', filePath], (data) => { current += data })

      const target = args.target as string
      const replacement = args.replacement as string

      if (!current.includes(target)) {
        return { error: `Target content not found in ${args.path}. File content may have changed. Read the file again.` }
      }

      const newContent = current.replace(target, replacement)
      await execInContainer(containerId, ['sh', '-c', `cat > '${filePath}' << 'CLOUDCODE_EOF'\n${newContent}\nCLOUDCODE_EOF`], () => {})
      return { success: true, path: args.path, message: `File edited successfully` }
    }

    case 'create_file': {
      const filePath = `${WORKSPACE}/${args.path}`
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'))
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

function extractPlanItems(text: string): string[] {
  const lines = text.split('\n')
  const items: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
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

    for (const step of this.dbSteps) {
      if (step.type === 'tool_call') {
        const resultStep = this.dbSteps.find(
          (s) => s.type === 'tool_result' && s.content.name === step.content.name
        )
        if (resultStep) {
          this.completedTools.push({
            name: step.content.name,
            args: step.content.args,
            response: resultStep.content.response,
          })
        }
      }
    }
  }

  async saveStep(type: 'plan' | 'reasoning' | 'tool_call' | 'tool_result' | 'error', content: any) {
    if (!this.runId || this.runId === 'global' || this.runId === 'none') return
    try {
      await supabaseAdmin
        .from('agent_steps')
        .insert({
          run_id: this.runId,
          step_index: this.stepIndex,
          type,
          content,
        })
      this.stepIndex++
      console.log(`[AgentRunContext] Saved ${type} step for run ${this.runId}`)
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
    if (this.dbSteps.length === 0) return initialMessages
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
    if (this.dbSteps.length === 0) return initialMessages
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
    if (this.dbSteps.length === 0) return initialMessages
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
          content: [
            {
              type: 'tool_use',
              id: step.content.toolCallId || 'call_' + step.id,
              name: step.content.name,
              input: step.content.args
            }
          ]
        })
      } else if (step.type === 'tool_result') {
        const callStep = this.dbSteps.find(s => s.type === 'tool_call' && s.content.name === step.content.name)
        const toolCallId = callStep?.content?.toolCallId || 'call_' + (callStep?.id || step.id)
        messages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolCallId,
              content: JSON.stringify(step.content.response)
            }
          ]
        })
      }
    }
    return messages
  }
}

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

export type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: { content: unknown } } }

function rehydrateLangChainHistory(dbSteps: any[]): BaseMessage[] {
  const messages: BaseMessage[] = []
  for (const step of dbSteps) {
    if (step.type === 'reasoning') {
      const role = step.content.role || 'model'
      const text = step.content.text || ''
      if (role === 'user') {
        messages.push(new HumanMessage(text))
      } else {
        messages.push(new AIMessage(text))
      }
    } else if (step.type === 'plan') {
      const text = step.content.plan || ''
      messages.push(new AIMessage(text))
    } else if (step.type === 'tool_call') {
      const lastMsg = messages[messages.length - 1]
      const toolCall = {
        name: step.content.name,
        args: step.content.args,
        id: step.content.toolCallId || 'call_' + step.id,
      }
      if (lastMsg && lastMsg instanceof AIMessage) {
        const existingCalls = (lastMsg.tool_calls || []) as any[]
        lastMsg.tool_calls = [...existingCalls, toolCall]
      } else {
        messages.push(new AIMessage({
          content: '',
          tool_calls: [toolCall],
        }))
      }
    } else if (step.type === 'tool_result') {
      const toolCallId = step.content.toolCallId || 'call_' + step.id
      messages.push(new ToolMessage({
        content: typeof step.content.response === 'string' 
          ? step.content.response 
          : JSON.stringify(step.content.response),
        name: step.content.name,
        tool_call_id: toolCallId,
      }))
    }
  }
  return messages
}

function getModelInstance(
  provider: 'gemini' | 'openai' | 'anthropic' | 'groq',
  customApiKey?: string
) {
  if (provider === 'openai') {
    return new ChatOpenAI({
      apiKey: customApiKey || OPENAI_API_KEY,
      modelName: 'gpt-4o',
      temperature: 0.7,
    })
  } else if (provider === 'anthropic') {
    return new ChatAnthropic({
      apiKey: customApiKey || ANTHROPIC_API_KEY,
      modelName: 'claude-3-5-sonnet-latest',
      temperature: 0.7,
    })
  } else if (provider === 'groq') {
    return new ChatGroq({
      apiKey: customApiKey || GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    })
  } else {
    return new ChatGoogleGenerativeAI({
      apiKey: customApiKey || GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
    })
  }
}

/**
 * Core LangGraph Shared Executor
 */
export async function* executeLangGraph(
  modelProvider: 'gemini' | 'openai' | 'anthropic' | 'groq',
  rawMessages: any[],
  containerId: string,
  context?: { fileTree?: string; openFile?: { path: string; content: string }; userId?: string; runId?: string; userWorkspaces?: { id: string; name: string; status: string }[] },
  customApiKey?: string
): AsyncGenerator<StreamChunk> {
  let activeContainerId = containerId
  
  let runCtx: AgentRunContext | null = null
  if (context?.runId && context?.userId) {
    runCtx = new AgentRunContext(context.runId, context.userId)
    await runCtx.init()
  }

  // 1. Gather resource context
  let capabilityPrompt = ''
  if (context?.userId) {
    const resourceCtx = await PlanningGuard.loadContext(context.userId)
    capabilityPrompt = PlanningGuard.buildSystemPrompt(resourceCtx)
    yield { 
      type: 'reasoning_event', 
      content: `Available resources: ${resourceCtx.tokensRemaining === 999999999 ? 'Unlimited' : resourceCtx.tokensRemaining} tokens, ${resourceCtx.workspacesLimit - resourceCtx.workspacesUsed} workspace slots remaining.` 
    }
  }

  // 2. Rehydrate history
  let initialMessages: BaseMessage[] = []
  if (runCtx && runCtx.dbSteps.length > 0) {
    initialMessages = rehydrateLangChainHistory(runCtx.dbSteps)
    const planStep = runCtx.dbSteps.find(s => s.type === 'plan')
    if (planStep) {
      yield { type: 'plan_event', items: planStep.content.items }
    }
  } else {
    // Convert rawMessages from frontend to LangChain messages
    for (const m of rawMessages) {
      const text = m.text || m.parts?.[0]?.text || ''
      if (m.role === 'user') {
        initialMessages.push(new HumanMessage(text))
      } else {
        initialMessages.push(new AIMessage(text))
      }
    }
    
    // Inject file tree & open file context into the first user message if present
    if (context && initialMessages.length > 0) {
      const firstMsg = initialMessages[0]
      if (firstMsg instanceof HumanMessage) {
        let contextPrefix = ''
        if (context.fileTree) {
          contextPrefix += `[Project files:\n${context.fileTree}]\n\n`
        }
        if (context.openFile) {
          contextPrefix += `[Currently open file: ${context.openFile.path}]\n\`\`\`\n${context.openFile.content}\n\`\`\`\n\n`
        }
        firstMsg.content = contextPrefix + firstMsg.content
        
        if (runCtx) {
          await runCtx.saveStep('reasoning', { text: firstMsg.content as string, role: 'user' })
        }
      }
    }
  }

  // Set run status to executing in DB
  if (runCtx) {
    await supabaseAdmin
      .from('agent_runs')
      .update({ status: 'executing' })
      .eq('id', runCtx.runId)
  }

  // 3. Initialize model & tools
  const model = getModelInstance(modelProvider, customApiKey)
  
  // Define tools dynamically bound to activeContainerId and contexts
  const createProject = tool(
    async ({ name, setupCommands }) => {
      if (!context?.userId) return JSON.stringify({ error: 'Unauthorized: User context missing' })
      try {
        const resourceCtx = await PlanningGuard.loadContext(context.userId)
        if (resourceCtx.workspacesLimit !== 0 && resourceCtx.workspacesUsed >= resourceCtx.workspacesLimit) {
          return JSON.stringify({ error: `Workspace limit exceeded. You have already used ${resourceCtx.workspacesUsed} out of ${resourceCtx.workspacesLimit} workspaces.` })
        }
        const project = await createProjectInternal(context.userId, name, 'empty')
        
        let projectContainerId: string | null = null
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 1000))
          const { data: updatedProject } = await supabaseAdmin
            .from('projects')
            .select('container_id, status')
            .eq('id', project.id)
            .single()
          if (updatedProject?.container_id && updatedProject.status === 'ready') {
            projectContainerId = updatedProject.container_id
            break
          }
        }

        // Auto-run setup commands to scaffold any tech stack
        if (projectContainerId && setupCommands && setupCommands.length > 0) {
          for (const cmd of setupCommands) {
            try {
              let output = ''
              await execInContainer(projectContainerId, ['sh', '-c', `cd /workspace && ${cmd}`], (data) => { output += data })
            } catch (e) {
              // Non-fatal: log but continue with remaining commands
              console.error(`[CreateProject] Setup command failed: ${cmd}`, (e as Error).message)
            }
          }
        }

        return JSON.stringify({ success: true, project, container_id: projectContainerId })
      } catch (err) {
        return JSON.stringify({ error: (err as Error).message })
      }
    },
    {
      name: 'create_project',
      description: 'Create a new project workspace and optionally scaffold it with shell commands. Always creates an empty workspace first, then runs setupCommands to install any framework/tech stack. Examples: setupCommands=["npx -y create-next-app@latest . --ts --eslint --tailwind --app --use-npm"] or ["npx -y create-vite . --template react-ts", "npm install"] or ["pip install django", "django-admin startproject myapp ."]',
      schema: z.object({
        name: z.string().describe('The name of the project to create'),
        setupCommands: z.array(z.string()).optional().describe('Shell commands to run inside the workspace to scaffold the project. Runs sequentially without user approval. Use npx -y for npm init scripts.'),
      })
    }
  );

  const listWorkspaces = tool(
    async () => {
      if (!context?.userId) return JSON.stringify({ error: 'Unauthorized: User context missing' })
      try {
        const { data: projects } = await supabaseAdmin
          .from('projects')
          .select('id, name, status, container_id')
          .eq('user_github_id', context.userId)
        return JSON.stringify({ success: true, workspaces: projects || [] })
      } catch (err) {
        return JSON.stringify({ error: (err as Error).message })
      }
    },
    {
      name: 'list_workspaces',
      description: 'List all of the user\'s project workspaces, including their names, IDs, and current statuses (ready, sleeping). Use this to discover which projects are available.',
      schema: z.object({}),
    }
  );

  const selectWorkspace = tool(
    async ({ workspaceIdOrName }) => {
      if (!context?.userId) return JSON.stringify({ error: 'Unauthorized: User context missing' })
      try {
        // 1. Try exact match by ID or Name
        let { data: project } = await supabaseAdmin
          .from('projects')
          .select('*')
          .eq('user_github_id', context.userId)
          .or(`id.eq.${workspaceIdOrName},name.eq.${workspaceIdOrName}`)
          .maybeSingle()

        // 2. Fallback: case-insensitive + fuzzy partial match
        if (!project) {
          const { data: allProjects } = await supabaseAdmin
            .from('projects')
            .select('*')
            .eq('user_github_id', context.userId)

          if (allProjects && allProjects.length > 0) {
            const searchLower = workspaceIdOrName.toLowerCase()
            // Try exact case-insensitive match first
            project = allProjects.find(p => p.name.toLowerCase() === searchLower) || null
            // Then try partial/contains match
            if (!project) {
              project = allProjects.find(p => 
                p.name.toLowerCase().includes(searchLower) || 
                searchLower.includes(p.name.toLowerCase())
              ) || null
            }
          }
        }

        if (!project) {
          // Return available workspace names so the AI can self-correct
          const { data: all } = await supabaseAdmin
            .from('projects')
            .select('name, id')
            .eq('user_github_id', context.userId)
          return JSON.stringify({ 
            error: `Workspace '${workspaceIdOrName}' not found.`,
            available_workspaces: all?.map(p => ({ name: p.name, id: p.id })) || []
          })
        }

        // Auto-wake container if asleep/sleeping
        await ensureContainerRunning(project.id)

        // Re-fetch to get the active container ID
        const { data: updatedProject } = await supabaseAdmin
          .from('projects')
          .select('container_id')
          .eq('id', project.id)
          .single()

        if (!updatedProject?.container_id) {
          return JSON.stringify({ error: 'Failed to boot workspace container.' })
        }

        // Update the active container ID in the outer scope
        activeContainerId = updatedProject.container_id

        return JSON.stringify({ 
          success: true, 
          message: `Workspace '${project.name}' is now active and its container is running. You can now read/edit its files and run commands in it.` 
        })
      } catch (err) {
        return JSON.stringify({ error: (err as Error).message })
      }
    },
    {
      name: 'select_workspace',
      description: 'Select and activate a project workspace by name or ID. Supports fuzzy matching (case-insensitive). This will automatically wake up the container if it is sleeping.',
      schema: z.object({
        workspaceIdOrName: z.string().describe('The ID or Name of the project workspace to activate. Case-insensitive matching is supported.'),
      }),
    }
  );

  const readFile = tool(
    async ({ path }) => {
      if (!activeContainerId || activeContainerId === 'global' || activeContainerId === 'none') {
        return JSON.stringify({ error: "No active workspace selected. You must first use list_workspaces to see your projects, and select_workspace to activate one." })
      }
      const WORKSPACE = '/workspace'
      const filePath = `${WORKSPACE}/${path}`
      let content = ''
      await execInContainer(activeContainerId, ['cat', filePath], (data) => { content += data })
      return JSON.stringify({ content: content || '(empty file)' })
    },
    {
      name: 'read_file',
      description: 'Read the contents of a file in the project workspace.',
      schema: z.object({
        path: z.string().describe('Relative path to the file from workspace root, e.g. "src/index.ts"'),
      })
    }
  );

  const editFile = tool(
    async ({ path, target, replacement }) => {
      if (!activeContainerId || activeContainerId === 'global' || activeContainerId === 'none') {
        return JSON.stringify({ error: "No active workspace selected. You must first use list_workspaces to see your projects, and select_workspace to activate one." })
      }
      const WORKSPACE = '/workspace'
      const filePath = `${WORKSPACE}/${path}`
      let current = ''
      await execInContainer(activeContainerId, ['cat', filePath], (data) => { current += data })
      if (!current.includes(target)) {
        return JSON.stringify({ error: `Target content not found in ${path}. File content may have changed. Read the file again.` })
      }
      const newContent = current.replace(target, replacement)
      await execInContainer(activeContainerId, ['sh', '-c', `cat > '${filePath}' << 'CLOUDCODE_EOF'\n${newContent}\nCLOUDCODE_EOF`], () => {})
      return JSON.stringify({ success: true, path, message: 'File edited successfully' })
    },
    {
      name: 'edit_file',
      description: 'Edit an existing file by replacing specific target content with new content.',
      schema: z.object({
        path: z.string().describe('Relative path to the file'),
        target: z.string().describe('The exact existing content to find and replace'),
        replacement: z.string().describe('The new content to replace the target with'),
      })
    }
  );

  const createFile = tool(
    async ({ path, content }) => {
      if (!activeContainerId || activeContainerId === 'global' || activeContainerId === 'none') {
        return JSON.stringify({ error: "No active workspace selected. You must first use list_workspaces to see your projects, and select_workspace to activate one." })
      }
      const WORKSPACE = '/workspace'
      const filePath = `${WORKSPACE}/${path}`
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'))
      if (dirPath) {
        await execInContainer(activeContainerId, ['mkdir', '-p', dirPath], () => {})
      }
      await execInContainer(activeContainerId, ['sh', '-c', `cat > '${filePath}' << 'CLOUDCODE_EOF'\n${content}\nCLOUDCODE_EOF`], () => {})
      return JSON.stringify({ success: true, path, message: 'File created' })
    },
    {
      name: 'create_file',
      description: 'Create a new file with the given content. Overwrites if it already exists.',
      schema: z.object({
        path: z.string().describe('Relative path for the new file'),
        content: z.string().describe('Full content for the new file'),
      })
    }
  );

  const deleteFile = tool(
    async ({ path }) => {
      if (!activeContainerId || activeContainerId === 'global' || activeContainerId === 'none') {
        return JSON.stringify({ error: "No active workspace selected. You must first use list_workspaces to see your projects, and select_workspace to activate one." })
      }
      const WORKSPACE = '/workspace'
      const filePath = `${WORKSPACE}/${path}`
      await execInContainer(activeContainerId, ['rm', '-f', filePath], () => {})
      return JSON.stringify({ success: true, path, message: 'File deleted' })
    },
    {
      name: 'delete_file',
      description: 'Delete a file from the project workspace.',
      schema: z.object({
        path: z.string().describe('Relative path to the file to delete'),
      })
    }
  );

  const listFiles = tool(
    async ({ path }) => {
      if (!activeContainerId || activeContainerId === 'global' || activeContainerId === 'none') {
        return JSON.stringify({ error: "No active workspace selected. You must first use list_workspaces to see your projects, and select_workspace to activate one." })
      }
      const WORKSPACE = '/workspace'
      const dirPath = `${WORKSPACE}/${path === '.' ? '' : path}`
      let output = ''
      await execInContainer(activeContainerId, ['find', dirPath, '-maxdepth', '3', '-not', '-path', '*/node_modules/*', '-not', '-path', '*/.git/*'], (data) => { output += data })
      return JSON.stringify({ files: output.trim().split('\n').map(f => f.replace(WORKSPACE + '/', '')) })
    },
    {
      name: 'list_files',
      description: 'List files and directories in the project workspace. Returns a tree structure.',
      schema: z.object({
        path: z.string().describe('Relative path to list. Use "." for root.'),
      })
    }
  );

  const runCommand = tool(
    async ({ command }, config?: any) => {
      if (!activeContainerId || activeContainerId === 'global' || activeContainerId === 'none') {
        return JSON.stringify({ error: "No active workspace selected. You must first use list_workspaces to see your projects, and select_workspace to activate one." })
      }
      // 1. STATEFUL MODE INTERRUPT (SAVES STEP AND PAUSES GRAPH)
      if (runCtx && context?.userId) {
        const approvalId = uuidv4()
        await supabaseAdmin.from('agent_runs').update({ status: 'paused' }).eq('id', runCtx.runId)
        await runCtx.saveStep('tool_call', { name: 'run_command', args: { command, approvalId, status: 'pending' } })
        await supabaseAdmin.from('agent_events').insert({
          run_id: runCtx.runId,
          event_type: 'info',
          message: `Command execution paused waiting for user approval: "${command}".`
        })
        throw new Error(`AGENT_PAUSED:${JSON.stringify({ approvalId, command })}`)
      }

      // 2. STATELESS MODE BLOCKING APPROVAL (STALLS GRAPH THREAD IN MEMORY)
      const approvalId = config?.runId || config?.run_id || uuidv4()
      const approvalPromise = new Promise<boolean>((resolve) => {
        const existing = (global as any).pendingCommands.get(approvalId)
        ;(global as any).pendingCommands.set(approvalId, { 
          resolve, 
          command,
          ...(existing || {})
        })
      })

      const approved = await approvalPromise
      if (!approved) {
        return JSON.stringify({ error: 'Command execution rejected by user.' })
      }

      const WORKSPACE = '/workspace'
      let output = ''
      try {
        await execInContainer(activeContainerId, ['sh', '-c', `cd ${WORKSPACE} && ${command}`], (data) => { output += data })
      } catch (e) {
        output += `\nCommand error: ${(e as Error).message}`
      }
      if (output.length > 4000) {
        output = output.substring(0, 2000) + '\n...(truncated)...\n' + output.substring(output.length - 1500)
      }
      return JSON.stringify({ output: output || '(no output)' })
    },
    {
      name: 'run_command',
      description: 'Run a shell command in the project workspace terminal.',
      schema: z.object({
        command: z.string().describe('The shell command to execute, e.g. "npm install express"'),
      })
    }
  );

  const tools = [createProject, listWorkspaces, selectWorkspace, readFile, editFile, createFile, deleteFile, listFiles, runCommand]

  const modelWithTools = model.bindTools(tools)

  // 4. State Graph Assembly
  const userWorkspaces = context?.userWorkspaces || []
  const workspaceListStr = userWorkspaces.length > 0 
    ? `\n\nThe user has the following workspaces available:\n${userWorkspaces.map(w => `- "${w.name}" (ID: ${w.id}, Status: ${w.status})`).join('\n')}\n` 
    : ''

  const agentNode = async (state: typeof AgentState.State) => {
    const currentMessages = [...state.messages]
    const hasContainer = activeContainerId && activeContainerId !== 'global' && activeContainerId !== 'none'
    const systemPromptText = hasContainer 
      ? SYSTEM_INSTRUCTION 
      : SYSTEM_INSTRUCTION + `\n\nYou are currently in GLOBAL mode — no workspace is selected yet. Follow these additional rules:\n1. For simple greetings or general questions ("Hi", "What is a closure?"), respond directly WITHOUT calling any tools.\n2. When the user references a project/workspace by name (even partially), IMMEDIATELY call select_workspace with that name to activate it. Do NOT ask "which workspace" — deduce it from context and act.\n3. If the user asks to work on code but doesn't mention a specific workspace: if they have only ONE workspace, auto-select it. If they have multiple, briefly list them and ask which one.\n4. After selecting a workspace, proceed to execute the user's task completely — read files, edit code, run commands — just like you would inside a project.\n5. If a workspace name doesn't match exactly, select_workspace supports fuzzy matching, so pass what the user said directly.${workspaceListStr}`

    const systemMessage = new SystemMessage(systemPromptText + '\n' + capabilityPrompt)
    const response = await modelWithTools.invoke([systemMessage, ...currentMessages])
    return { messages: [response] }
  }

  const toolsNode = async (state: typeof AgentState.State) => {
    const lastMessage = state.messages[state.messages.length - 1]
    const toolCalls = lastMessage.additional_kwargs.tool_calls || (lastMessage as any).tool_calls || []
    const newMessages: BaseMessage[] = []
    
    for (const toolCall of toolCalls) {
      const toolInstance = tools.find(t => t.name === toolCall.name)
      if (!toolInstance) {
        newMessages.push(new ToolMessage({
          content: JSON.stringify({ error: `Tool ${toolCall.name} not found` }),
          name: toolCall.name,
          tool_call_id: toolCall.id || '',
        }))
        continue
      }
      
      try {
        if (runCtx && context?.userId) {
          await ExecutionGuard.validate(runCtx.runId, toolCall.name, toolCall.args, context.userId)
        }

        const result = await (toolInstance as any).invoke(toolCall.args)
        
        if (toolCall.name === 'create_project') {
          const resObj = JSON.parse(result)
          if (resObj.success && resObj.container_id) {
            activeContainerId = resObj.container_id
          }
        }

        newMessages.push(new ToolMessage({
          content: result,
          name: toolCall.name,
          tool_call_id: toolCall.id || '',
        }))
      } catch (err) {
        const msg = (err as Error).message
        if (msg.startsWith('AGENT_PAUSED:')) {
          throw err // Bubble up stateful pause interrupts
        }
        newMessages.push(new ToolMessage({
          content: JSON.stringify({ error: msg }),
          name: toolCall.name,
          tool_call_id: toolCall.id || '',
        }))
      }
    }
    return { messages: newMessages }
  }

  const MAX_AGENT_ITERATIONS = 15

  const shouldContinue = (state: typeof AgentState.State) => {
    const lastMessage = state.messages[state.messages.length - 1]
    const toolCalls = lastMessage.additional_kwargs.tool_calls || (lastMessage as any).tool_calls || []
    
    // Circuit breaker: prevent infinite tool-call loops
    const toolMessages = state.messages.filter(m => m._getType() === 'tool')
    if (toolMessages.length >= MAX_AGENT_ITERATIONS) {
      return "end"
    }
    
    if (toolCalls.length > 0) {
      return "continue"
    }
    return "end"
  }

  const AgentState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
      reducer: (x, y) => x.concat(y),
      default: () => [],
    }),
  })

  const workflow = new StateGraph(AgentState)
    .addNode("agent", agentNode)
    .addNode("tools", toolsNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, {
      continue: "tools",
      end: END,
    })
    .addEdge("tools", "agent")

  const graph = workflow.compile()

  // 5. Run Graph and progressive SSE streaming
  let fullText = ''

  try {
    const eventStream = graph.streamEvents(
      { messages: initialMessages },
      { version: "v2" }
    )

    for await (const event of eventStream) {
      // 5a. Stream Text Tokens
      if (event.event === "on_chat_model_stream") {
        const chunk = event.data.chunk
        const text = chunk.content || ''
        if (text) {
          fullText += text
          yield { type: 'text', content: text }
        }
      }
      
      // 5b. Stream Tool Calls
      else if (event.event === "on_tool_start") {
        const name = event.name
        const args = event.data.input
        const toolCallId = event.run_id
        
        // Save thoughts/plan checklist as steps before starting tool
        if (fullText.trim() && runCtx) {
          await runCtx.saveStep('reasoning', { text: fullText, role: 'model' })
          const planItems = extractPlanItems(fullText)
          if (planItems.length > 0) {
            await runCtx.saveStep('plan', { items: planItems, plan: fullText })
            yield { type: 'plan_event', items: planItems }
          }
          fullText = ''
        }

        if (runCtx) {
          await runCtx.saveStep('tool_call', { name, args, toolCallId })
        }

        // For stateless run_command, hook up approvalId so blocking works
        if (name === 'run_command' && !runCtx) {
          const approvalId = toolCallId
          args.approvalId = approvalId
          const existing = (global as any).pendingCommands.get(approvalId)
          ;(global as any).pendingCommands.set(approvalId, { 
            resolve: existing?.resolve || (() => {}), 
            command: args.command 
          })
          yield {
            type: 'tool_call',
            toolName: name,
            toolArgs: { ...args, approvalId, status: 'pending' }
          }
        } else {
          yield {
            type: 'tool_call',
            toolName: name,
            toolArgs: { ...args, status: 'running' }
          }
        }
      }
      
      // 5c. Stream Tool Results
      else if (event.event === "on_tool_end") {
        const name = event.name
        let result = event.data.output
        try {
          result = JSON.parse(result)
        } catch {}

        if (runCtx) {
          await runCtx.saveStep('tool_result', { name, response: result })
        }

        yield {
          type: 'tool_result',
          toolName: name,
          toolResult: result
        }
      }
    }

    // Graph completed successfully
    if (fullText.trim() && runCtx) {
      await runCtx.saveStep('reasoning', { text: fullText, role: 'model' })
      const planItems = extractPlanItems(fullText)
      if (planItems.length > 0) {
        await runCtx.saveStep('plan', { items: planItems, plan: fullText })
        yield { type: 'plan_event', items: planItems }
      }
    }

    if (runCtx) {
      await supabaseAdmin
        .from('agent_runs')
        .update({ status: 'completed' })
        .eq('id', runCtx.runId)
    }

  } catch (err) {
    const msg = (err as Error).message
    
    // Handle stateful agent pause interrupt
    if (msg.startsWith('AGENT_PAUSED:')) {
      const { approvalId, command } = JSON.parse(msg.substring(13))
      yield {
        type: 'tool_call',
        toolName: 'run_command',
        toolArgs: { command, approvalId, status: 'pending' }
      }
      return // Exit stream cleanly
    }

    // Capture standard error
    yield { type: 'error', content: msg }
    if (runCtx) {
      await runCtx.saveStep('error', { message: msg })
      await supabaseAdmin
        .from('agent_runs')
        .update({ status: 'failed' })
        .eq('id', runCtx.runId)
    }
  }
}

/**
 * Backward-compatible wrapper for Gemini
 */
export async function* chatWithGemini(
  messages: GeminiMessage[],
  containerId: string,
  context?: { fileTree?: string; openFile?: { path: string; content: string }; userId?: string; runId?: string; userWorkspaces?: { id: string; name: string; status: string }[] },
  customApiKey?: string
): AsyncGenerator<StreamChunk> {
  const mappedHistory = messages.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    text: m.parts?.[0] && 'text' in m.parts[0] ? m.parts[0].text : ''
  }))

  const generator = executeLangGraph('gemini', mappedHistory, containerId, context, customApiKey)
  for await (const chunk of generator) {
    yield chunk
  }
}

/**
 * Backward-compatible wrapper for OpenAI
 */
export async function* chatWithOpenAI(
  messages: { role: 'user' | 'model' | 'assistant'; text: string }[],
  containerId: string,
  context?: { fileTree?: string; openFile?: { path: string; content: string }; userId?: string; runId?: string; userWorkspaces?: { id: string; name: string; status: string }[] },
  customApiKey?: string
): AsyncGenerator<StreamChunk> {
  const mappedHistory = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    text: m.text
  }))

  const generator = executeLangGraph('openai', mappedHistory, containerId, context, customApiKey)
  for await (const chunk of generator) {
    yield chunk
  }
}

/**
 * Backward-compatible wrapper for Anthropic
 */
export async function* chatWithAnthropic(
  messages: { role: 'user' | 'model' | 'assistant'; text: string }[],
  containerId: string,
  context?: { fileTree?: string; openFile?: { path: string; content: string }; userId?: string; runId?: string; userWorkspaces?: { id: string; name: string; status: string }[] },
  customApiKey?: string
): AsyncGenerator<StreamChunk> {
  const mappedHistory = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    text: m.text
  }))

  const generator = executeLangGraph('anthropic', mappedHistory, containerId, context, customApiKey)
  for await (const chunk of generator) {
    yield chunk
  }
}

/**
 * Backward-compatible wrapper for Groq
 */
export async function* chatWithGroq(
  messages: { role: 'user' | 'model' | 'assistant'; text: string }[],
  containerId: string,
  context?: { fileTree?: string; openFile?: { path: string; content: string }; userId?: string; runId?: string; userWorkspaces?: { id: string; name: string; status: string }[] },
  customApiKey?: string
): AsyncGenerator<StreamChunk> {
  const mappedHistory = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    text: m.text
  }))

  const generator = executeLangGraph('groq', mappedHistory, containerId, context, customApiKey)
  for await (const chunk of generator) {
    yield chunk
  }
}
