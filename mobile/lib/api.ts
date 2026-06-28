import { getToken } from './auth'
import { Project, FileNode } from '@/types'
import EventSource from 'react-native-sse'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { useUIStore } from '../store/ui'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const byokEnabled = await AsyncStorage.getItem('byok_enabled')
  const customGeminiKey = await AsyncStorage.getItem('custom_gemini_key')
  const customOpenaiKey = await AsyncStorage.getItem('custom_openai_key')
  const customAnthropicKey = await AsyncStorage.getItem('custom_anthropic_key')

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-byok-enabled': byokEnabled || 'false',
      ...(byokEnabled === 'true' && customGeminiKey ? { 'x-gemini-key': customGeminiKey } : {}),
      ...(byokEnabled === 'true' && customOpenaiKey ? { 'x-openai-key': customOpenaiKey } : {}),
      ...(byokEnabled === 'true' && customAnthropicKey ? { 'x-anthropic-key': customAnthropicKey } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }))
    const errorMsg = err.error || `Request failed: ${response.status}`
    if (response.status === 403 && errorMsg.includes('LIMIT_EXCEEDED')) {
      useUIStore.getState().showLimitModal('workspace')
    }
    throw new Error(errorMsg)
  }

  const result = await response.json()
  return result.data as T
}

let activeAbort: (() => void) | null = null

export const api = {
  projects: {
    list: () => apiFetch<Project[]>('/cc-api/projects'),
    get: (id: string) => apiFetch<Project>(`/cc-api/projects/${id}`),
    create: (name: string, type: 'node' | 'react' | 'empty' | 'flask' | 'fastapi' | 'rust' | 'gin' | 'nextjs') =>
      apiFetch<Project>('/cc-api/projects', {
        method: 'POST',
        body: JSON.stringify({ name, type }),
      }),
    import: (name: string, githubUrl: string) =>
      apiFetch<Project>('/cc-api/projects/import', {
        method: 'POST',
        body: JSON.stringify({ name, githubUrl }),
      }),
    delete: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/cc-api/projects/${id}`, { method: 'DELETE' }),
    rename: (id: string, name: string) =>
      apiFetch<Project>(`/cc-api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
  },

  prs: {
    list: (projectId: string) =>
      apiFetch<any[]>(`/cc-api/git/prs?projectId=${projectId}`),
    get: (projectId: string, number: number) =>
      apiFetch<{ pr: any; conversation: any[]; files: any[] }>(`/cc-api/git/prs/${number}?projectId=${projectId}`),
    create: (projectId: string, title: string, body: string, head: string, base = 'main') =>
      apiFetch<any>('/cc-api/git/prs/create', {
        method: 'POST',
        body: JSON.stringify({ projectId, title, body, head, base }),
      }),
    review: (projectId: string, number: number, event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT', body: string) =>
      apiFetch<any>(`/cc-api/git/prs/${number}/review?projectId=${projectId}`, {
        method: 'POST',
        body: JSON.stringify({ event, body }),
      }),
    merge: (projectId: string, number: number, mergeMethod: 'merge' | 'squash' | 'rebase', commitTitle?: string, commitMessage?: string) =>
      apiFetch<any>(`/cc-api/git/prs/${number}/merge?projectId=${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({ merge_method: mergeMethod, commit_title: commitTitle, commit_message: commitMessage }),
      }),
  },

  files: {
    list: (projectId: string) =>
      apiFetch<FileNode[]>(`/cc-api/projects/${projectId}/files`),
    read: (projectId: string, filePath: string) =>
      apiFetch<{ path: string; content: string }>(
        `/cc-api/projects/${projectId}/files/content?path=${encodeURIComponent(filePath)}`
      ),
    write: (projectId: string, filePath: string, content: string) =>
      apiFetch<{ saved: boolean; path: string }>(
        `/cc-api/projects/${projectId}/files/content`,
        { method: 'PUT', body: JSON.stringify({ path: filePath, content }) }
      ),
    create: (projectId: string, filePath: string, type: 'file' | 'directory') =>
      apiFetch<{ created: boolean; path: string; type: 'file' | 'directory' }>(
        `/cc-api/projects/${projectId}/files`,
        { method: 'POST', body: JSON.stringify({ path: filePath, type }) }
      ),
    delete: (projectId: string, filePath: string) =>
      apiFetch<{ deleted: boolean; path: string }>(
        `/cc-api/projects/${projectId}/files?path=${encodeURIComponent(filePath)}`,
        { method: 'DELETE' }
      ),
    rename: (projectId: string, oldPath: string, newPath: string) =>
      apiFetch<{ renamed: boolean; oldPath: string; newPath: string }>(
        `/cc-api/projects/${projectId}/files`,
        { method: 'PATCH', body: JSON.stringify({ oldPath, newPath }) }
      ),
  },

  git: {
    status: (projectId: string) =>
      apiFetch<{
        staged: { path: string; status: string }[]
        unstaged: { path: string; status: string }[]
        untracked: string[]
        branch: string
        ahead: number
        behind: number
      }>(`/cc-api/projects/${projectId}/git/status`),

    diff: (projectId: string, file?: string, staged?: boolean) => {
      const params = new URLSearchParams()
      if (file) params.set('file', file)
      if (staged) params.set('staged', 'true')
      return apiFetch<{ diff: string }>(`/cc-api/projects/${projectId}/git/diff?${params}`)
    },

    stage: (projectId: string, files: string[]) =>
      apiFetch<{ output: string }>(`/cc-api/projects/${projectId}/git/stage`, {
        method: 'POST',
        body: JSON.stringify({ files, action: 'stage' }),
      }),

    unstage: (projectId: string, files: string[]) =>
      apiFetch<{ output: string }>(`/cc-api/projects/${projectId}/git/stage`, {
        method: 'POST',
        body: JSON.stringify({ files, action: 'unstage' }),
      }),

    commit: (projectId: string, message: string) =>
      apiFetch<{ output: string }>(`/cc-api/projects/${projectId}/git/commit`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),

    sync: (projectId: string, action: 'push' | 'pull', remote?: string, branch?: string) =>
      apiFetch<{ output: string }>(`/cc-api/projects/${projectId}/git/sync`, {
        method: 'POST',
        body: JSON.stringify({ action, remote, branch }),
      }),

    branches: (projectId: string) =>
      apiFetch<{ branches: string[]; current: string }>(`/cc-api/projects/${projectId}/git/branches`),

    checkout: (projectId: string, branch: string, create?: boolean) =>
      apiFetch<{ output: string }>(`/cc-api/projects/${projectId}/git/branches`, {
        method: 'POST',
        body: JSON.stringify({ branch, create }),
      }),

    ssh: {
      get: (projectId: string) =>
        apiFetch<{ hasKey: boolean; publicKey: string | null; history: { timestamp: string; publicKey: string }[] }>(`/cc-api/projects/${projectId}/git/ssh`),
      generate: (projectId: string) =>
        apiFetch<{ hasKey: boolean; publicKey: string; history: { timestamp: string; publicKey: string }[] }>(`/cc-api/projects/${projectId}/git/ssh`, { method: 'POST' }),
      globalGet: () =>
        apiFetch<{ hasKey: boolean; publicKey: string | null; history: { timestamp: string; publicKey: string }[] }>('/cc-api/user/git/ssh'),
      globalGenerate: () =>
        apiFetch<{ hasKey: boolean; publicKey: string; history: { timestamp: string; publicKey: string }[] }>('/cc-api/user/git/ssh', { method: 'POST' }),
    },

    config: {
      get: (projectId: string) =>
        apiFetch<{ name: string | null; email: string | null }>(`/cc-api/projects/${projectId}/git/config`),
      set: (projectId: string, name: string, email: string) =>
        apiFetch<{ saved: boolean }>(`/cc-api/projects/${projectId}/git/config`, {
          method: 'POST',
          body: JSON.stringify({ name, email }),
        }),
    },
    log: (projectId: string, count?: number) => {
      const params = new URLSearchParams()
      if (count) params.set('count', count.toString())
      return apiFetch<{ log: string }>(`/cc-api/projects/${projectId}/git/log?${params}`)
    },
    conflicts: (projectId: string) =>
      apiFetch<{ conflicts: string[] }>(`/cc-api/projects/${projectId}/git/conflicts`),
    resolve: (projectId: string, file: string, strategy: 'ours' | 'theirs') =>
      apiFetch<{ success: boolean; output: string }>(`/cc-api/projects/${projectId}/git/resolve`, {
        method: 'POST',
        body: JSON.stringify({ file, strategy }),
      }),
  },

  billing: {
    status: () =>
      apiFetch<{
        tier: { name: string; displayName: string; price: { monthly: number; yearly: number } }
        subscription: { id: string | null; status: string }
        limits: {
          container: { cpus: number; memoryMB: number; diskGB: number; maxWorkspaces: number; idleTimeoutMinutes: number; networkSpeedMbps: number; alwaysOnSlots: number }
          api: { requestsPerMinute: number }
          ai: { monthlyTokens: number; premiumModels: boolean; byokSupported: boolean }
        }
        upgrades: { name: string; displayName: string; price: { monthly: number; yearly: number }; container: any; ai: any }[]
        usage: {
          workspaces: { used: number; limit: number }
          cpu: { usedHours: number; limitHours: number | string }
          ram: { usedMB: number; limitMB: number }
          disk: { usedGB: number; limitGB: number }
          aiTokens: { used: number; limit: number }
          byokTokens?: { used: number }
          networkSpeed: { currentMbps: number; limitMbps: number }
        }
        billingHistory?: any[]
        usageHistory?: any[]
      }>('/cc-api/billing/status'),

    checkout: (planType: string, returnUrl: string) =>
      apiFetch<{ checkoutUrl: string; sessionId: string }>('/cc-api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planType, returnUrl }),
      }),
  },

  system: {
    runtimes: () =>
      apiFetch<{ runtimes: { name: string; version: string; key: string }[] }>('/cc-api/system/runtimes'),
    installRuntime: (runtime: string) =>
      apiFetch<{ success: boolean; message: string }>('/cc-api/system/runtimes', {
        method: 'POST',
        body: JSON.stringify({ runtime }),
      }),
    diagnostics: () =>
      apiFetch<{
        cpuLoad: number
        memoryUsage: number
        runningContainers: number
        platform: string
        uptime: number
        timestamp: number
      }>('/cc-api/system/diagnostics'),
  },

  terminal: {
    kill: (projectId: string, terminalId: string) =>
      apiFetch<{ killed: boolean }>(`/cc-api/projects/${projectId}/terminal/kill`, {
        method: 'POST',
        body: JSON.stringify({ terminalId }),
      }),
  },

  ai: {
    abort: () => {
      if (activeAbort) {
        activeAbort()
      }
    },
    approve: (approvalId: string, action: 'approve' | 'reject') =>
      apiFetch<{ success: boolean }>('/cc-api/ai/approve', {
        method: 'POST',
        body: JSON.stringify({ approvalId, action }),
      }),
    createRun: (projectId: string | null, model: string, initialMessage?: string, budgetTokens?: number, budgetCommands?: number) =>
      apiFetch<{ run: any }>('/cc-api/ai/runs', {
        method: 'POST',
        body: JSON.stringify({ projectId, model, initialMessage, budgetTokens, budgetCommands }),
      }),
    listRuns: (projectId?: string) => {
      const url = projectId ? `/cc-api/ai/runs?projectId=${projectId}` : '/cc-api/ai/runs'
      return apiFetch<{ runs: any[] }>(url)
    },
    getRun: (runId: string) =>
      apiFetch<{ run: any; steps: any[]; events: any[] }>(`/cc-api/ai/runs/${runId}`),
    deleteRun: (runId: string) =>
      apiFetch<{ success: boolean }>(`/cc-api/ai/runs/${runId}`, { method: 'DELETE' }),
    deleteRuns: (runIds: string[]) =>
      apiFetch<{ success: boolean }>('/cc-api/ai/runs', {
        method: 'DELETE',
        body: JSON.stringify({ runIds }),
      }),
    approveRun: (runId: string, approvalId: string, action: 'approve' | 'reject') =>
      apiFetch<{ success: boolean; status: string }>(`/cc-api/ai/runs/${runId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approvalId, action }),
      }),
    runChat: async (
      runId: string,
      newMessage?: string,
      openFile?: { path: string; content: string },
      onChunk?: (chunk: any) => void
    ) => {
      const token = await getToken()
      const byokEnabled = await AsyncStorage.getItem('byok_enabled')
      const customGeminiKey = await AsyncStorage.getItem('custom_gemini_key')
      const customOpenaiKey = await AsyncStorage.getItem('custom_openai_key')
      const customAnthropicKey = await AsyncStorage.getItem('custom_anthropic_key')

      return new Promise<void>((resolve, reject) => {
        let aborted = false
        const es = new EventSource(`${API_URL}/cc-api/ai/runs/${runId}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'x-byok-enabled': byokEnabled || 'false',
            ...(byokEnabled === 'true' && customGeminiKey ? { 'x-gemini-key': customGeminiKey } : {}),
            ...(byokEnabled === 'true' && customOpenaiKey ? { 'x-openai-key': customOpenaiKey } : {}),
            ...(byokEnabled === 'true' && customAnthropicKey ? { 'x-anthropic-key': customAnthropicKey } : {}),
          },
          body: JSON.stringify({ newMessage, openFile }),
        })

        const onAbort = () => {
          if (aborted) return
          aborted = true
          es.close()
          cleanup()
          reject(new Error('Generation stopped by user.'))
        }

        activeAbort = onAbort

        const cleanup = () => {
          if (activeAbort === onAbort) {
            activeAbort = null
          }
        }

        es.addEventListener('message', (event) => {
          if (aborted) return
          if (!event.data) return
          if (event.data === '[DONE]') {
            aborted = true
            es.close()
            cleanup()
            resolve()
            return
          }
          try {
            const chunk = JSON.parse(event.data)
            onChunk?.(chunk)

            // Reconnection Loop Fix: If a terminal quota or limit error is received, close the EventSource immediately
            if (
              chunk.type === 'error' && 
              (chunk.content?.includes('LIMIT_EXCEEDED') || 
               chunk.content?.includes('monthly token limit exceeded') ||
               chunk.content?.includes('restricted to Pro'))
            ) {
              aborted = true
              es.close()
              cleanup()
              resolve()
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        })

        es.addEventListener('error', (event) => {
          if (aborted) return
          aborted = true
          console.error('SSE Error:', event)
          es.close()
          cleanup()
          reject(new Error('AI stream failed or closed prematurely'))
        })
      })
    },
    chat: async (
      projectId: string,
      messages: { role: 'user' | 'model'; text: string }[],
      openFile?: { path: string; content: string },
      model?: string,
      threadId?: string,
      onChunk?: (chunk: AIStreamChunk) => void
    ) => {
      const token = await getToken()
      const byokEnabled = await AsyncStorage.getItem('byok_enabled')
      const customGeminiKey = await AsyncStorage.getItem('custom_gemini_key')
      const customOpenaiKey = await AsyncStorage.getItem('custom_openai_key')
      const customAnthropicKey = await AsyncStorage.getItem('custom_anthropic_key')

      return new Promise<void>((resolve, reject) => {
        let aborted = false
        const es = new EventSource(`${API_URL}/cc-api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'x-byok-enabled': byokEnabled || 'false',
            ...(byokEnabled === 'true' && customGeminiKey ? { 'x-gemini-key': customGeminiKey } : {}),
            ...(byokEnabled === 'true' && customOpenaiKey ? { 'x-openai-key': customOpenaiKey } : {}),
            ...(byokEnabled === 'true' && customAnthropicKey ? { 'x-anthropic-key': customAnthropicKey } : {}),
          },
          body: JSON.stringify({ projectId, messages, openFile, model, threadId }),
        })

        const onAbort = () => {
          if (aborted) return
          aborted = true
          es.close()
          cleanup()
          reject(new Error('Generation stopped by user.'))
        }

        activeAbort = onAbort

        const cleanup = () => {
          if (activeAbort === onAbort) {
            activeAbort = null
          }
        }

        es.addEventListener('message', (event) => {
          if (aborted) return
          if (!event.data) return
          if (event.data === '[DONE]') {
            aborted = true
            es.close()
            cleanup()
            resolve()
            return
          }
          try {
            const chunk = JSON.parse(event.data) as AIStreamChunk
            onChunk?.(chunk)

            // Reconnection Loop Fix: If a terminal quota or limit error is received, close the EventSource immediately
            if (
              chunk.type === 'error' && 
              (chunk.content?.includes('LIMIT_EXCEEDED') || 
               chunk.content?.includes('monthly token limit exceeded') ||
               chunk.content?.includes('restricted to Pro'))
            ) {
              aborted = true
              es.close()
              cleanup()
              resolve()
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        })

        es.addEventListener('error', (event) => {
          if (aborted) return
          aborted = true
          console.error('SSE Error:', event)
          es.close()
          cleanup()
          reject(new Error('AI stream failed or closed prematurely'))
        })
      })
    },
  },
}

export interface AIStreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done'
  content?: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  toolResult?: unknown
}
