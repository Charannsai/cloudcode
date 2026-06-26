import { create } from 'zustand'
import { api } from '@/lib/api'
import { useUIStore } from './ui'

export interface PlanItem {
  label: string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export interface ReasoningEvent {
  id: string
  title: string
  message?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  timestamp: number
}

export interface AgentRun {
  id: string
  project_id: string | null
  status: 'planning' | 'executing' | 'waiting' | 'recovering' | 'paused' | 'completed' | 'failed'
  model: string
  budget_tokens: number
  budget_commands: number
  budget_file_writes: number
  budget_duration_sec: number
  tokens_used: number
  commands_run: number
  file_writes_run: number
  duration_sec: number
  created_at: string
  updated_at: string
}

interface AgentState {
  activeRun: AgentRun | null
  runsList: AgentRun[]
  isStreaming: boolean
  plan: PlanItem[]
  timeline: ReasoningEvent[]
  logs: string[]
  pendingApproval: { approvalId: string; command: string } | null
  activeProjectId: string | null

  setActiveProject: (projectId: string | null) => void
  loadRuns: (projectId?: string) => Promise<void>
  deleteRuns: (runIds: string[]) => Promise<void>
  startNewRun: (projectId: string | null, model: string, prompt: string) => Promise<void>
  resumeRun: (runId: string, prompt?: string) => Promise<void>
  approvePending: (action: 'approve' | 'reject') => Promise<void>
  clearActiveRun: () => void
  stopActiveRun: () => void
  executeStream: (runId: string, prompt?: string) => Promise<void>
}

export const useAgentStore = create<AgentState>((set, get) => ({
  activeRun: null,
  runsList: [],
  isStreaming: false,
  plan: [],
  timeline: [],
  logs: [],
  pendingApproval: null,
  activeProjectId: null,

  setActiveProject: (projectId) => {
    set({ activeProjectId: projectId })
    get().loadRuns(projectId || undefined)
  },

  loadRuns: async (projectId) => {
    try {
      const { runs } = await api.ai.listRuns(projectId)
      set({ runsList: runs || [] })
    } catch (err) {
      console.error('[AgentStore] Failed to load runs:', err)
    }
  },

  deleteRuns: async (runIds) => {
    try {
      await api.ai.deleteRuns(runIds)
      await get().loadRuns(get().activeProjectId || undefined)
    } catch (err) {
      console.error('[AgentStore] Failed to delete runs:', err)
      throw err
    }
  },

  startNewRun: async (projectId, model, prompt) => {
    set({
      isStreaming: true,
      plan: [],
      timeline: [],
      logs: [],
      pendingApproval: null,
      activeRun: null,
    })

    try {
      // 1. Create run on the backend
      const { run } = await api.ai.createRun(projectId, model, prompt)
      set({ activeRun: run })
      get().loadRuns(projectId || undefined)

      // 2. Start streaming the run chat execution
      await get().executeStream(run.id, prompt)
    } catch (err) {
      console.error('[AgentStore] Failed to start run:', err)
      set({ isStreaming: false })
    }
  },

  resumeRun: async (runId, prompt) => {
    set({
      isStreaming: true,
      pendingApproval: null,
    })

    // If resuming from a selected run in history, load past steps to build current visual state
    try {
      const { runs } = await api.ai.listRuns(get().activeProjectId || undefined)
      const matched = runs.find((r: any) => r.id === runId)
      if (matched) {
        set({ activeRun: matched })
      }
    } catch (e) {
      console.error('[AgentStore] Failed to sync run details on resume:', e)
    }

    await get().executeStream(runId, prompt)
  },

  approvePending: async (action) => {
    const run = get().activeRun
    const pending = get().pendingApproval
    if (!run || !pending) return

    set({ pendingApproval: null, isStreaming: true })

    try {
      const result = await api.ai.approveRun(run.id, pending.approvalId, action)
      set((state) => ({
        activeRun: state.activeRun ? { ...state.activeRun, status: result.status as any } : null
      }))

      // If approved, we re-trigger the stream to continue the generator loop execution
      if (action === 'approve') {
        await get().executeStream(run.id)
      } else {
        set({ isStreaming: false })
      }
    } catch (err) {
      console.error('[AgentStore] Approval failed:', err)
      set({ isStreaming: false })
    }
  },

  clearActiveRun: () => {
    set({
      activeRun: null,
      plan: [],
      timeline: [],
      logs: [],
      pendingApproval: null,
    })
  },

  stopActiveRun: () => {
    try {
      api.ai.abort()
    } catch (e) {}
    set((state) => ({
      isStreaming: false,
      timeline: [
        ...state.timeline,
        {
          id: Math.random().toString(),
          title: 'Agent Reasoning',
          message: 'Generation stopped by user.',
          status: 'failed',
          timestamp: Date.now()
        }
      ]
    }))
  },

  // Internal helper to run the chat generator stream and parse events
  executeStream: async (runId: string, prompt?: string) => {
    try {
      // Add initial user timeline event
      if (prompt) {
        set((state) => ({
          timeline: [
            ...state.timeline,
            {
              id: Math.random().toString(),
              title: 'User Prompt',
              message: prompt,
              status: 'completed',
              timestamp: Date.now()
            }
          ]
        }))
      }

      await api.ai.runChat(runId, prompt, undefined, (chunk) => {
        // Sync run consumption counters if embedded in event or refresh
        if (chunk.type === 'reasoning_event' && chunk.content?.startsWith('Available resources:')) {
          // Parse budget tokens from backend payload if available
          set((state) => {
            if (!state.activeRun) return {}
            return {
              activeRun: {
                ...state.activeRun,
                status: 'executing'
              }
            }
          })
        }

        switch (chunk.type) {
          case 'text': {
            // Append reasoning message
            set((state) => {
              const last = state.timeline[state.timeline.length - 1]
              if (last && last.title === 'Agent Reasoning') {
                const updated = [...state.timeline]
                updated[updated.length - 1] = {
                  ...last,
                  message: (last.message || '') + (chunk.content || '')
                }
                return { timeline: updated }
              } else {
                return {
                  timeline: [
                    ...state.timeline,
                    {
                      id: Math.random().toString(),
                      title: 'Agent Reasoning',
                      message: chunk.content || '',
                      status: 'running',
                      timestamp: Date.now()
                    }
                  ]
                }
              }
            })
            break
          }

          case 'plan_event': {
            if (chunk.items && chunk.items.length > 0) {
              const newPlan = chunk.items.map((it: string) => ({
                label: it,
                status: 'pending' as const
              }))
              set({ plan: newPlan })
              
              set((state) => ({
                timeline: [
                  ...state.timeline,
                  {
                    id: Math.random().toString(),
                    title: 'Plan Checklist Formulated',
                    message: `Prepared ${chunk.items?.length} execution tasks.`,
                    status: 'completed',
                    timestamp: Date.now()
                  }
                ]
              }))
            }
            break
          }

          case 'tool_call': {
            const name = chunk.toolName || ''
            const args = chunk.toolArgs || {}
            const approvalId = args.approvalId as string | undefined
            const status = args.status as string | undefined

            if (name === 'run_command' && status === 'pending' && approvalId) {
              // Wait for user approval
              set({
                pendingApproval: {
                  approvalId,
                  command: (args.command as string) || ''
                },
                isStreaming: false,
              })
              set((state) => ({
                timeline: [
                  ...state.timeline,
                  {
                    id: Math.random().toString(),
                    title: 'Action Approval Required',
                    message: `Command: "${args.command}" requires approval.`,
                    status: 'pending',
                    timestamp: Date.now()
                  }
                ]
              }))
            } else {
              // Mark corresponding plan item as running
              set((state) => {
                const nextPlan = [...state.plan]
                // Match command or file action to plan label
                const runningIdx = nextPlan.findIndex(p => p.status === 'pending')
                if (runningIdx !== -1) {
                  nextPlan[runningIdx].status = 'running'
                }
                return {
                  plan: nextPlan,
                  timeline: [
                    ...state.timeline,
                    {
                      id: Math.random().toString(),
                      title: `Executing Action: ${name}`,
                      message: args.path ? `Target: ${args.path}` : args.command ? `Command: ${args.command}` : undefined,
                      status: 'running',
                      timestamp: Date.now()
                    }
                  ]
                }
              })

              if (args.command) {
                set((state) => ({
                  logs: [...state.logs, `\n$ ${args.command}\n`]
                }))
              }
            }
            break
          }

          case 'tool_result': {
            const name = chunk.toolName || ''
            const res = chunk.toolResult as any
            const isError = res && (typeof res === 'object' && ('error' in res || 'err' in res))

            // Update plan checklist
            set((state) => {
              const nextPlan = [...state.plan]
              const activeIdx = nextPlan.findIndex(p => p.status === 'running')
              if (activeIdx !== -1) {
                nextPlan[activeIdx].status = isError ? 'failed' : 'completed'
              }

              // Finalize corresponding timeline item
              const nextTimeline = [...state.timeline]
              const activeTimelineIdx = nextTimeline.findIndex(t => t.status === 'running' && t.title.includes(name))
              if (activeTimelineIdx !== -1) {
                nextTimeline[activeTimelineIdx].status = isError ? 'failed' : 'completed'
              }

              return {
                plan: nextPlan,
                timeline: nextTimeline
              }
            })

            // Append console output if run_command
            if (name === 'run_command' && res?.output) {
              set((state) => ({
                logs: [...state.logs, res.output]
              }))
            }
            break
          }

          case 'error': {
            const errMsg = chunk.content || ''
            if (errMsg.includes('LIMIT_EXCEEDED') || errMsg.includes('QUOTA_EXCEEDED')) {
              useUIStore.getState().showLimitModal('ai')
            }
            set((state) => ({
              logs: [...state.logs, `\n⚠️ Error: ${errMsg}\n`],
              timeline: [
                ...state.timeline,
                {
                  id: Math.random().toString(),
                  title: 'Run Execution Failure',
                  message: errMsg,
                  status: 'failed',
                  timestamp: Date.now()
                }
              ]
            }))
            break
          }
        }
      })

      // Update active run status on successful completion of stream
      set((state) => {
        if (!state.activeRun) return {}
        return {
          isStreaming: false,
          activeRun: {
            ...state.activeRun,
            status: 'completed'
          }
        }
      })
      get().loadRuns(get().activeProjectId || undefined)

    } catch (err) {
      const errMsg = (err as Error).message || ''
      set((state) => ({
        isStreaming: false,
        activeRun: state.activeRun ? { ...state.activeRun, status: 'failed' } : null,
        logs: [...state.logs, `\nExecution Interrupted: ${errMsg}\n`]
      }))
      get().loadRuns(get().activeProjectId || undefined)
    }
  }
}))
