import { execInContainer } from '../docker'
import { v4 as uuidv4 } from 'uuid'
import { createProjectInternal } from '../projects'
import { supabaseAdmin } from '../supabase'

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
const GEMINI_MODEL = 'gemini-3-flash-preview'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`

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

const SYSTEM_INSTRUCTION = `You are CloudCode AI, an expert coding assistant embedded in a cloud development environment. You have direct access to the user's project files running inside a Docker container.

CAPABILITIES:
- Read, create, edit, and delete files in the project.
- Run terminal commands (npm install, git, node, etc.)
- Understand project structure and architecture.
- Debug errors by reading code and terminal output.

RULES:
1. ALWAYS read a file before editing it to understand its current content.
2. When editing, use the exact target content that exists in the file.
3. Explain what you're doing and why before making changes.
4. After making changes, briefly confirm what was done.
5. If a command fails, read the error and try to fix it.
6. Keep responses concise but helpful.
7. For multi-file changes, handle them one at a time.`

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done'
  content?: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  toolResult?: unknown
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
      const escaped = newContent.replace(/'/g, "'\\''")
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
 * Chat with Gemini using function calling (non-streaming for reliability)
 * Returns an async generator of StreamChunks
 */
export async function* chatWithGemini(
  messages: GeminiMessage[],
  containerId: string,
  context?: { fileTree?: string; openFile?: { path: string; content: string }; userId?: string },
  customApiKey?: string
): AsyncGenerator<StreamChunk> {
  let totalTokens = 0
  const isBYOK = !!(customApiKey && customApiKey.trim() !== '')

  try {
    // Build the full message history with context
    const contents: GeminiMessage[] = [...messages]

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
      }
    }

    // Agentic loop — keep going until we get a text-only response
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

      const response = await fetch(`${GEMINI_API_URL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(toolsToProvide.length > 0 ? { tools: [{ functionDeclarations: toolsToProvide }] } : {}),
          systemInstruction: {
            parts: [{
              text: hasContainer 
                ? SYSTEM_INSTRUCTION 
                : 'You are CloudCode AI, a general helpful developer assistant. You can create a new project/workspace using the create_project tool when the user requests it. If they ask to read, edit, or run commands on files, advise them to select or create a project first.'
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
        return
      }

      const data = await response.json()

      if (!data.candidates?.[0]?.content?.parts) {
        yield { type: 'error', content: 'No response from Gemini' }
        return
      }

      const parts = data.candidates[0].content.parts as GeminiPart[]
      let hasFunctionCall = false

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
        if ('text' in part && part.text) {
          yield { type: 'text', content: part.text }
        }

        if ('functionCall' in part) {
          hasFunctionCall = true
          const { name, args } = part.functionCall

          let result: any
          if (name === 'run_command') {
            const command = args.command as string
            const approvalId = uuidv4()

            // Yield tool call as pending first
            yield { 
              type: 'tool_call', 
              toolName: name, 
              toolArgs: { ...args, approvalId, status: 'pending' } 
            }

            // Create a pending promise to wait for client approval
            const approvalPromise = new Promise<boolean>((resolve) => {
              (global as any).pendingCommands.set(approvalId, { resolve, command })
            })

            const approved = await approvalPromise

            if (approved) {
              // Yield status update to running
              yield { 
                type: 'tool_call', 
                toolName: name, 
                toolArgs: { ...args, approvalId, status: 'running' } 
              }
              result = await executeTool(containerId, name, args as Record<string, unknown>, context?.userId)
            } else {
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

          // Add function response to history for next loop iteration
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

      // If no function calls, we're done
      if (!hasFunctionCall) {
        break
      }
    }
  } catch (err) {
    yield { type: 'error', content: `Error: ${(err as Error).message}` }
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
  context?: { fileTree?: string; openFile?: { path: string; content: string }; userId?: string },
  customApiKey?: string
): AsyncGenerator<StreamChunk> {
  const hasContainer = containerId && containerId !== 'global' && containerId !== 'none'
  const apiKey = customApiKey && customApiKey.trim() !== '' ? customApiKey.trim() : OPENAI_API_KEY

  if (!apiKey) {
    yield { type: 'error', content: 'OpenAI API key not configured. Please add it under AI API Keys (BYOK) in settings.' }
    return
  }

  const toolsToProvide = hasContainer 
    ? TOOL_DECLARATIONS 
    : TOOL_DECLARATIONS.filter(t => t.name === 'create_project')

  // Convert schema types to lowercase for OpenAI function calling compatibility
  const openAITools = toolsToProvide.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: convertSchemaToLowercase(tool.parameters)
    }
  }))

  const openAIMessages: any[] = []
  openAIMessages.push({
    role: 'system',
    content: hasContainer 
      ? SYSTEM_INSTRUCTION 
      : 'You are CloudCode AI, a general helpful developer assistant. You can create a new project/workspace using the create_project tool when the user requests it. If they ask to read, edit, or run commands on files, advise them to select or create a project first.'
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
  }

  let totalTokens = 0
  const isBYOK = !!(customApiKey && customApiKey.trim() !== '')

  try {
    let loopCount = 0
    const MAX_LOOPS = 10

    while (loopCount < MAX_LOOPS) {
      loopCount++

      // Calculate input prompt tokens
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
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        yield { type: 'error', content: `OpenAI API error: ${response.status} - ${errText}` }
        return
      }

      const data = await response.json()
      const choice = data.choices?.[0]
      if (!choice || !choice.message) {
        yield { type: 'error', content: 'No response from OpenAI' }
        return
      }

      const assistantMsg = choice.message
      openAIMessages.push(assistantMsg)

      // Calculate output tokens
      let outputCompletionText = ''
      if (assistantMsg.content) {
        outputCompletionText += assistantMsg.content
      }
      if (assistantMsg.tool_calls) {
        outputCompletionText += JSON.stringify(assistantMsg.tool_calls)
      }
      totalTokens += estimateTokens(outputCompletionText)

      if (assistantMsg.content) {
        yield { type: 'text', content: assistantMsg.content }
      }

      const toolCalls = assistantMsg.tool_calls
      if (!toolCalls || toolCalls.length === 0) {
        break
      }

      for (const tc of toolCalls) {
        const name = tc.function.name
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(tc.function.arguments)
        } catch (e) {
          console.error('Failed to parse tool arguments:', e)
        }

        let result: any
        if (name === 'run_command') {
          const command = args.command as string
          const approvalId = uuidv4()

          yield { 
            type: 'tool_call', 
            toolName: name, 
            toolArgs: { ...args, approvalId, status: 'pending' } 
          }

          const approvalPromise = new Promise<boolean>((resolve) => {
            (global as any).pendingCommands.set(approvalId, { resolve, command })
          })

          const approved = await approvalPromise

          if (approved) {
            yield { 
              type: 'tool_call', 
              toolName: name, 
              toolArgs: { ...args, approvalId, status: 'running' } 
            }
            result = await executeTool(containerId, name, args, context?.userId)
          } else {
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

        openAIMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result)
        })
      }
    }
  } catch (err) {
    yield { type: 'error', content: `Error: ${(err as Error).message}` }
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
  context?: { fileTree?: string; openFile?: { path: string; content: string }; userId?: string },
  customApiKey?: string
): AsyncGenerator<StreamChunk> {
  const hasContainer = containerId && containerId !== 'global' && containerId !== 'none'
  const apiKey = customApiKey && customApiKey.trim() !== '' ? customApiKey.trim() : ANTHROPIC_API_KEY

  if (!apiKey) {
    yield { type: 'error', content: 'Anthropic API key not configured. Please add it under AI API Keys (BYOK) in settings.' }
    return
  }

  const toolsToProvide = hasContainer 
    ? TOOL_DECLARATIONS 
    : TOOL_DECLARATIONS.filter(t => t.name === 'create_project')

  const anthropicTools = toolsToProvide.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: convertSchemaToLowercase(tool.parameters)
  }))

  const anthropicMessages: any[] = []
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
  }

  let totalTokens = 0
  const isBYOK = !!(customApiKey && customApiKey.trim() !== '')

  try {
    let loopCount = 0
    const MAX_LOOPS = 10

    while (loopCount < MAX_LOOPS) {
      loopCount++

      // Calculate input prompt tokens
      let inputPromptText = ''
      inputPromptText += hasContainer 
        ? SYSTEM_INSTRUCTION 
        : 'You are CloudCode AI, a general helpful developer assistant.'
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
          system: hasContainer 
            ? SYSTEM_INSTRUCTION 
            : 'You are CloudCode AI, a general helpful developer assistant. You can create a new project/workspace using the create_project tool when the user requests it. If they ask to read, edit, or run commands on files, advise them to select or create a project first.',
          messages: anthropicMessages,
          ...(toolsToProvide.length > 0 ? { tools: anthropicTools } : {}),
          temperature: 0.7,
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        yield { type: 'error', content: `Anthropic API error: ${response.status} - ${errText}` }
        return
      }

      const data = await response.json()
      if (!data.content || data.content.length === 0) {
        yield { type: 'error', content: 'No response from Anthropic' }
        return
      }

      // Calculate output tokens
      let outputCompletionText = ''
      for (const block of data.content) {
        if (block.type === 'text') {
          outputCompletionText += block.text
        } else if (block.type === 'tool_use') {
          outputCompletionText += JSON.stringify(block)
        }
      }
      totalTokens += estimateTokens(outputCompletionText)

      // Add to messages array
      anthropicMessages.push({
        role: 'assistant',
        content: data.content
      })

      const toolResultBlocks: any[] = []
      let hasToolUse = false

      for (const block of data.content) {
        if (block.type === 'text') {
          yield { type: 'text', content: block.text }
        }

        if (block.type === 'tool_use') {
          hasToolUse = true
          const name = block.name
          const args = block.input || {}
          
          let result: any
          if (name === 'run_command') {
            const command = args.command as string
            const approvalId = uuidv4()

            yield { 
              type: 'tool_call', 
              toolName: name, 
              toolArgs: { ...args, approvalId, status: 'pending' } 
            }

            const approvalPromise = new Promise<boolean>((resolve) => {
              (global as any).pendingCommands.set(approvalId, { resolve, command })
            })

            const approved = await approvalPromise

            if (approved) {
              yield { 
                type: 'tool_call', 
                toolName: name, 
                toolArgs: { ...args, approvalId, status: 'running' } 
              }
              result = await executeTool(containerId, name, args, context?.userId)
            } else {
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
  } catch (err) {
    yield { type: 'error', content: `Error: ${(err as Error).message}` }
    return
  } finally {
    if (context?.userId && totalTokens > 0) {
      await recordTokens(context.userId, isBYOK, totalTokens)
    }
  }

  yield { type: 'done' }
}
