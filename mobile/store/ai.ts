import { create } from 'zustand'
import { api, AIStreamChunk } from '@/lib/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useProjectsStore } from './projects'
import { useUIStore } from './ui'



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

export interface ConversationThread {
  id: string
  title: string
  projectId: string
  messages: ChatMessage[]
  timestamp: number
}

interface AIState {
  messages: ChatMessage[]
  isStreaming: boolean
  currentStreamText: string
  currentToolCalls: ToolCallInfo[]
  activeProjectId: string | null
  pendingPrompt: string | null
  pinnedFile: { path: string; content: string } | null

  // Conversation History fields
  currentThreadId: string | null
  savedConversations: ConversationThread[]
  byokEnabled: boolean
  byokConfigured: boolean

  setActiveProject: (projectId: string) => void
  setPendingPrompt: (prompt: string | null) => void
  setPinnedFile: (file: { path: string; content: string } | null) => void
  sendMessage: (
    text: string,
    projectId: string,
    openFile?: { path: string; content: string },
    model?: string
  ) => Promise<void>
  clearChat: () => void
  stopGeneration: () => void

  // Conversation History actions
  initConversations: () => Promise<void>
  loadConversation: (threadId: string) => Promise<void>
  deleteConversation: (threadId: string) => Promise<void>
  toggleByok: (enabled: boolean) => Promise<void>
  checkByokStatus: () => Promise<void>
  startNewChat: () => void
}


export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentStreamText: '',
  currentToolCalls: [],
  activeProjectId: null,
  pendingPrompt: null,
  pinnedFile: null,

  currentThreadId: null,
  savedConversations: [],
  byokEnabled: false,
  byokConfigured: false,

  setActiveProject: (projectId) => set({ activeProjectId: projectId }),
  setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),
  setPinnedFile: (pinnedFile) => set({ pinnedFile }),

  sendMessage: async (text, projectId, openFile, model) => {
    let threadId = get().currentThreadId
    if (!threadId) {
      threadId = Date.now().toString()
      set({ currentThreadId: threadId })
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now(),
    }

    const updatedUserMessages = [...get().messages, userMsg]

    set((state) => ({
      messages: updatedUserMessages,
      isStreaming: true,
      currentStreamText: '',
      currentToolCalls: [],
    }))

    // Save user message step to AsyncStorage
    const firstUserMsg = updatedUserMessages.find(m => m.role === 'user')?.text || 'New Conversation'
    const title = firstUserMsg.length > 50 ? firstUserMsg.slice(0, 50) + '...' : firstUserMsg
    const userThread: ConversationThread = {
      id: threadId,
      title,
      projectId,
      messages: updatedUserMessages,
      timestamp: Date.now()
    }
    const saved = [...get().savedConversations]
    const idx = saved.findIndex(t => t.id === threadId)
    if (idx !== -1) {
      saved[idx] = userThread
    } else {
      saved.unshift(userThread)
    }
    await AsyncStorage.setItem('cloudcode_ai_conversations', JSON.stringify(saved))
    set({ savedConversations: saved })


    // Build message history for API (last 20 messages for better context)
    const history = [...get().messages].slice(-20).map((m) => {
      let msgText = m.text
      
      // Enrich model messages with tool action summaries so the AI remembers what it did
      if (m.role === 'model' && m.toolCalls && m.toolCalls.length > 0) {
        const toolSummaries = m.toolCalls.map(tc => {
          const argsStr = tc.args ? Object.entries(tc.args)
            .filter(([k]) => k !== 'approvalId' && k !== 'status')
            .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
            .join(', ') : ''
          const resultStr = tc.result 
            ? (typeof tc.result === 'string' 
              ? tc.result.slice(0, 500) 
              : JSON.stringify(tc.result).slice(0, 500))
            : '(no result)'
          return `[Tool: ${tc.name}(${argsStr}) → ${tc.status}: ${resultStr}]`
        }).join('\n')
        
        msgText = (msgText ? msgText + '\n\n' : '') + '--- Actions taken ---\n' + toolSummaries
      }
      
      return { role: m.role, text: msgText }
    })

    let fullText = ''
    const toolCalls: ToolCallInfo[] = []

    try {
      await api.ai.chat(projectId, history, openFile, model, (chunk: AIStreamChunk) => {
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

            // Handle create_project success callback to register & switch active context
            if (chunk.toolName === 'create_project' && chunk.toolResult) {
              const res = chunk.toolResult as any
              if (res.success && res.project) {
                useProjectsStore.getState().addProject(res.project)
                set({ activeProjectId: res.project.id })
                useProjectsStore.getState().fetchProjects(true).catch(console.error)
              }
            }
            break
          }

          case 'error':
            const errMsg = chunk.content || ''
            if (errMsg.includes('LIMIT_EXCEEDED')) {
              useUIStore.getState().showLimitModal('ai')
            }
            fullText += `\n⚠️ Error: ${errMsg}`
            set({ currentStreamText: fullText })
            break
        }
      })
    } catch (err) {
      const errMsg = (err as Error).message || ''
      if (errMsg.includes('LIMIT_EXCEEDED')) {
        useUIStore.getState().showLimitModal('ai')
      }
      if (errMsg === 'Generation stopped by user.') {
        fullText += `\n\n■ Generation stopped by user.`
      } else {
        fullText += `\n⚠️ ${errMsg}`
      }
    }

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: fullText || '(No response)',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      timestamp: Date.now(),
    }

    const updatedMessages = [...get().messages, modelMsg]

    set((state) => ({
      messages: updatedMessages,
      isStreaming: false,
      currentStreamText: '',
      currentToolCalls: [],
    }))

    // Save final response step to AsyncStorage
    const finalThreadId = get().currentThreadId || threadId
    const firstUserMsgFinal = updatedMessages.find(m => m.role === 'user')?.text || 'New Conversation'
    const titleFinal = firstUserMsgFinal.length > 50 ? firstUserMsgFinal.slice(0, 50) + '...' : firstUserMsgFinal
    const finalThread: ConversationThread = {
      id: finalThreadId,
      title: titleFinal,
      projectId: get().activeProjectId || projectId,
      messages: updatedMessages,
      timestamp: Date.now()
    }
    const savedFinal = [...get().savedConversations]
    const idxFinal = savedFinal.findIndex(t => t.id === finalThreadId)
    if (idxFinal !== -1) {
      savedFinal[idxFinal] = finalThread
    } else {
      savedFinal.unshift(finalThread)
    }
    await AsyncStorage.setItem('cloudcode_ai_conversations', JSON.stringify(savedFinal))
    set({ savedConversations: savedFinal })
  },

  clearChat: () => set({ messages: [], currentStreamText: '', currentToolCalls: [], currentThreadId: null }),
  stopGeneration: () => api.ai.abort(),

  initConversations: async () => {
    const stored = await AsyncStorage.getItem('cloudcode_ai_conversations')
    let saved: ConversationThread[] = []
    if (stored) {
      try {
        saved = JSON.parse(stored)
      } catch (e) {}
    }
    set({ savedConversations: saved })
    await get().checkByokStatus()
  },

  loadConversation: async (threadId) => {
    const thread = get().savedConversations.find(t => t.id === threadId)
    if (thread) {
      set({
        messages: thread.messages,
        currentThreadId: thread.id,
        activeProjectId: thread.projectId
      })
    }
  },

  deleteConversation: async (threadId) => {
    const filtered = get().savedConversations.filter(t => t.id !== threadId)
    await AsyncStorage.setItem('cloudcode_ai_conversations', JSON.stringify(filtered))
    set({ savedConversations: filtered })
    if (get().currentThreadId === threadId) {
      set({ messages: [], currentThreadId: null })
    }
  },

  toggleByok: async (enabled) => {
    await AsyncStorage.setItem('byok_enabled', enabled ? 'true' : 'false')
    set({ byokEnabled: enabled })
  },

  checkByokStatus: async () => {
    const byokEnabled = (await AsyncStorage.getItem('byok_enabled')) === 'true'
    const customGeminiKey = await AsyncStorage.getItem('custom_gemini_key')
    const byokConfigured = !!(customGeminiKey && customGeminiKey.trim())
    set({ byokEnabled, byokConfigured })
  },

  startNewChat: () => {
    set({ messages: [], currentStreamText: '', currentToolCalls: [], currentThreadId: null })
  }
}))
