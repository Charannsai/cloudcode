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
  status: 'running' | 'done' | 'error'
}

interface AIState {
  messages: ChatMessage[]
  isStreaming: boolean
  currentStreamText: string
  currentToolCalls: ToolCallInfo[]
  activeProjectId: string | null

  setActiveProject: (projectId: string) => void
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

  setActiveProject: (projectId) => set({ activeProjectId: projectId }),

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
            const tc: ToolCallInfo = {
              name: chunk.toolName || '',
              args: chunk.toolArgs || {},
              status: 'running',
            }
            toolCalls.push(tc)
            set({ currentToolCalls: [...toolCalls] })
            break
          }

          case 'tool_result': {
            const lastTc = toolCalls[toolCalls.length - 1]
            if (lastTc) {
              lastTc.result = chunk.toolResult
              lastTc.status = 'done'
              set({ currentToolCalls: [...toolCalls] })
            }
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
