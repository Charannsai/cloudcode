import { execInContainer } from '../docker'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`

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
  args: Record<string, unknown>
): Promise<unknown> {
  const WORKSPACE = '/workspace'

  switch (toolName) {
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
  context?: { fileTree?: string; openFile?: { path: string; content: string } }
): AsyncGenerator<StreamChunk> {
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

    try {
      const response = await fetch(`${GEMINI_API_URL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
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

          yield { type: 'tool_call', toolName: name, toolArgs: args as Record<string, unknown> }

          // Execute the tool
          const result = await executeTool(containerId, name, args as Record<string, unknown>)

          yield { type: 'tool_result', toolName: name, toolResult: result }

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
    } catch (err) {
      yield { type: 'error', content: `Error: ${(err as Error).message}` }
      return
    }
  }

  yield { type: 'done' }
}
