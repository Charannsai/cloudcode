import { create } from 'zustand'
import { api, AIStreamChunk } from '@/lib/api'

export interface ChatMessage {
  id: string
  role: 'user' | 'model'
  text: string
  toolCalls?: ToolCallInfo[]
  timestamp: number
}

export interface ToolCallInfo {
  name: string
  args: Record<string, unknown>
  result?: unknown
  status: 'running' | 'done' | 'error' | 'pending'
}

interface AIState {
  messages: ChatMessage[]
  isStreaming: boolean
  currentStreamText: string
  currentToolCalls: ToolCallInfo[]
  activeProjectId: string | null
  pendingPrompt: string | null

  setActiveProject: (projectId: string) => void
  setPendingPrompt: (prompt: string | null) => void
  sendMessage: (
    text: string,
    projectId: string,
    openFile?: { path: string; content: string }
  ) => Promise<void>
  clearChat: () => void
}

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentStreamText: '',
  currentToolCalls: [],
  activeProjectId: null,
  pendingPrompt: null,

  setActiveProject: (projectId) => set({ activeProjectId: projectId }),
  setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),

  sendMessage: async (text, projectId, openFile) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now(),
    }

    set((state) => ({
      messages: [...state.messages, userMsg],
      isStreaming: true,
      currentStreamText: '',
      currentToolCalls: [],
    }))

    // Build message history for API (last 10 messages for context)
    const history = [...get().messages].slice(-10).map((m) => ({
      role: m.role,
      text: m.text,
    }))

    let fullText = ''
    const toolCalls: ToolCallInfo[] = []

    try {
      await api.ai.chat(projectId, history, openFile, (chunk: AIStreamChunk) => {
        switch (chunk.type) {
          case 'text':
            fullText += chunk.content || ''
            set({ currentStreamText: fullText })
            break

          case 'tool_call': {
            const args = chunk.toolArgs || {}
            const approvalId = args.approvalId as string | undefined
            const name = chunk.toolName || ''
            const status = (args.status as 'pending' | 'running' | 'done' | 'error') || 'running'

            if (name === 'run_command' && approvalId) {
              const existingIndex = toolCalls.findIndex(
                (tc) => tc.name === 'run_command' && tc.args?.approvalId === approvalId
              )
              if (existingIndex !== -1) {
                toolCalls[existingIndex] = {
                  ...toolCalls[existingIndex],
                  args,
                  status,
                }
              } else {
                toolCalls.push({
                  name,
                  args,
                  status,
                })
              }
            } else {
              toolCalls.push({
                name,
                args,
                status: 'running',
              })
            }
            set({ currentToolCalls: [...toolCalls] })
            break
          }

          case 'tool_result': {
            const approvalId = chunk.toolArgs?.approvalId as string | undefined
            let updated = false
            if (approvalId) {
              const existingIndex = toolCalls.findIndex(
                (tc) => tc.name === 'run_command' && tc.args?.approvalId === approvalId
              )
              if (existingIndex !== -1) {
                const res = chunk.toolResult as any
                const isError = res && (typeof res === 'object' && ('error' in res || 'err' in res))
                toolCalls[existingIndex] = {
                  ...toolCalls[existingIndex],
                  result: chunk.toolResult,
                  status: isError ? 'error' : 'done',
                }
                updated = true
              }
            }

            if (!updated) {
              const lastTc = toolCalls[toolCalls.length - 1]
              if (lastTc) {
                const res = chunk.toolResult as any
                const isError = res && (typeof res === 'object' && ('error' in res || 'err' in res))
                lastTc.result = chunk.toolResult
                lastTc.status = isError ? 'error' : 'done'
              }
            }
            set({ currentToolCalls: [...toolCalls] })
            break
          }

          case 'error':
            fullText += `\n⚠️ Error: ${chunk.content}`
            set({ currentStreamText: fullText })
            break
        }
      })
    } catch (err) {
      fullText += `\n⚠️ ${(err as Error).message}`
    }

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: fullText || '(No response)',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      timestamp: Date.now(),
    }

    set((state) => ({
      messages: [...state.messages, modelMsg],
      isStreaming: false,
      currentStreamText: '',
      currentToolCalls: [],
    }))
  },

  clearChat: () => set({ messages: [], currentStreamText: '', currentToolCalls: [] }),
}))
