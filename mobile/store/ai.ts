import { create } from 'zustand'
import { api, AIStreamChunk } from '@/lib/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useProjectsStore } from './projects'
import { useUIStore } from './ui'

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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
  
  // Stateful & Non-blocking Approval actions
  submitApproval: (approvalId: string, action: 'approve' | 'reject') => Promise<void>
  loadStatefulConversation: (runId: string) => Promise<void>
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
      threadId = uuidv4()
      set({ currentThreadId: threadId })
    }

    let updatedUserMessages = [...get().messages]
    const isResume = text === ''

    if (!isResume) {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text,
        timestamp: Date.now(),
      }
      updatedUserMessages = [...updatedUserMessages, userMsg]

      set({
        messages: updatedUserMessages,
        isStreaming: true,
        currentStreamText: '',
        currentToolCalls: [],
      })

      // Save user message to AsyncStorage
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
    } else {
      // Resume mode: just start streaming
      set({
        isStreaming: true,
        currentStreamText: '',
        currentToolCalls: [],
      })
    }

    // Build clean message history for API without messy text enrichments
    const history = [...get().messages].slice(-20).map((m) => ({
      role: m.role,
      text: m.text
    }))

    let fullText = ''
    const toolCalls: ToolCallInfo[] = []
    let streamError: string | null = null

    try {
      await api.ai.chat(projectId, history, openFile, model, threadId, (chunk: AIStreamChunk) => {
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
            streamError = errMsg
            break
        }
      })

      if (streamError) {
        fullText += fullText.trim() ? '\n\n' : ''
        fullText += `Something went wrong. Please try again.`
      }
    } catch (err) {
      const errMsg = (err as Error).message || ''
      if (errMsg.includes('LIMIT_EXCEEDED')) {
        useUIStore.getState().showLimitModal('ai')
      }

      if (errMsg === 'Generation stopped by user.') {
        fullText += `\n\n■ Generation stopped.`
      } else if (errMsg.includes('LIMIT_EXCEEDED') || errMsg.includes('QUOTA_EXCEEDED')) {
        fullText += fullText.trim() ? '\n\n' : ''
        fullText += `Token limit reached. Switch model or try again later.`
      } else if (errMsg.includes('fetch failed') || errMsg.includes('network') || errMsg.includes('ECONNREFUSED')) {
        fullText += fullText.trim() ? '\n\n' : ''
        fullText += `Connection lost. Please check your network and retry.`
      } else {
        fullText += fullText.trim() ? '\n\n' : ''
        fullText += `Something went wrong. Please try again.`
      }
    }

    // Only add a new model response bubble if we actually streamed back content or ran tools.
    // If the stream ended immediately (e.g., paused for approval), we do not add an empty bubble
    // unless we have tool calls to render.
    const hasStreamed = fullText.trim() !== ''
    const hasTools = toolCalls.length > 0

    if (hasStreamed || hasTools) {
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: fullText || (hasTools ? '' : '(No response)'),
        toolCalls: hasTools ? toolCalls : undefined,
        timestamp: Date.now(),
      }

      const updatedMessages = [...get().messages, modelMsg]

      set({
        messages: updatedMessages,
        isStreaming: false,
        currentStreamText: '',
        currentToolCalls: [],
      })

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
    } else {
      set({
        isStreaming: false,
        currentStreamText: '',
        currentToolCalls: [],
      })
    }
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
  },

  submitApproval: async (approvalId, action) => {
    try {
      // 1. Submit approval/rejection request to backend
      await api.ai.approve(approvalId, action)

      // 2. Update local message state to mark this tool call as resolved
      const updatedMessages = get().messages.map((m) => {
        if (m.toolCalls) {
          const newToolCalls = m.toolCalls.map((tc) => {
            if (tc.name === 'run_command' && tc.args?.approvalId === approvalId) {
              return {
                ...tc,
                status: action === 'approve' ? 'done' : ('error' as any),
                result: action === 'approve' ? 'Running command...' : 'Command execution rejected by user.'
              }
            }
            return tc
          })
          return { ...m, toolCalls: newToolCalls }
        }
        return m
      })

      set({ messages: updatedMessages })

      // Save updated conversation locally
      const threadId = get().currentThreadId
      if (threadId) {
        const saved = [...get().savedConversations]
        const idx = saved.findIndex(t => t.id === threadId)
        if (idx !== -1) {
          saved[idx] = { ...saved[idx], messages: updatedMessages }
          await AsyncStorage.setItem('cloudcode_ai_conversations', JSON.stringify(saved))
          set({ savedConversations: saved })
        }
      }

      // 3. If approved, automatically trigger chat resumption to stream results
      if (action === 'approve') {
        await get().sendMessage("", get().activeProjectId || 'global', get().pinnedFile || undefined)
      }
    } catch (err) {
      console.error('[AI Store] Approval submit failed:', err)
      throw err
    }
  },

  loadStatefulConversation: async (runId) => {
    try {
      const { run, steps } = await api.ai.getRun(runId)
      const messages: ChatMessage[] = []

      for (const step of steps) {
        if (step.type === 'reasoning') {
          const role = step.content.role === 'user' ? 'user' : 'model'
          const text = step.content.text || step.content.message || ''
          if (text) {
            messages.push({
              id: step.id,
              role,
              text,
              timestamp: new Date(step.created_at).getTime()
            })
          }
        } else if (step.type === 'tool_call') {
          let lastModelMsg = messages[messages.length - 1]
          if (!lastModelMsg || lastModelMsg.role !== 'model') {
            lastModelMsg = {
              id: 'model_' + step.id,
              role: 'model',
              text: '',
              timestamp: new Date(step.created_at).getTime(),
              toolCalls: []
            }
            messages.push(lastModelMsg)
          }

          if (!lastModelMsg.toolCalls) lastModelMsg.toolCalls = []

          const approvalId = step.content.args?.approvalId
          lastModelMsg.toolCalls.push({
            name: step.content.name,
            args: step.content.args || {},
            status: approvalId ? 'pending' : 'done',
          })
        } else if (step.type === 'tool_result') {
          const lastModelMsg = messages[messages.length - 1]
          if (lastModelMsg && lastModelMsg.toolCalls) {
            const tc = lastModelMsg.toolCalls.find(t => t.name === step.content.name && t.status === 'pending') 
              || lastModelMsg.toolCalls[lastModelMsg.toolCalls.length - 1]

            if (tc) {
              const res = step.content.response
              const isError = res && (typeof res === 'object' && ('error' in res || 'err' in res))
              tc.result = res
              tc.status = isError ? 'error' : 'done'
            }
          }
        }
      }

      set({
        messages,
        currentThreadId: run.id,
        activeProjectId: run.project_id || 'global'
      })

      // Save to local conversations list
      const userThread: ConversationThread = {
        id: run.id,
        title: messages.find(m => m.role === 'user')?.text?.slice(0, 50) || 'Resumed Conversation',
        projectId: run.project_id || 'global',
        messages,
        timestamp: Date.now()
      }
      
      const saved = [...get().savedConversations]
      const idx = saved.findIndex(t => t.id === run.id)
      if (idx !== -1) {
        saved[idx] = userThread
      } else {
        saved.unshift(userThread)
      }
      await AsyncStorage.setItem('cloudcode_ai_conversations', JSON.stringify(saved))
      set({ savedConversations: saved })
    } catch (err) {
      console.error('[AI Store] Failed to load stateful conversation:', err)
      throw err
    }
  }
}))
