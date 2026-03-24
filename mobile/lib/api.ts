import { getToken } from './auth'
import { Project, FileNode } from '@/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(err.error || `Request failed: ${response.status}`)
  }

  const result = await response.json()
  return result.data as T
}

export const api = {
  projects: {
    list: () => apiFetch<Project[]>('/api/projects'),
    get: (id: string) => apiFetch<Project>(`/api/projects/${id}`),
    create: (name: string, type: 'node' | 'react' | 'empty') =>
      apiFetch<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name, type }),
      }),
    import: (name: string, githubUrl: string) =>
      apiFetch<Project>('/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({ name, githubUrl }),
      }),
    delete: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),
  },

  files: {
    list: (projectId: string) =>
      apiFetch<FileNode[]>(`/api/projects/${projectId}/files`),
    read: (projectId: string, filePath: string) =>
      apiFetch<{ path: string; content: string }>(
        `/api/projects/${projectId}/files/content?path=${encodeURIComponent(filePath)}`
      ),
    write: (projectId: string, filePath: string, content: string) =>
      apiFetch<{ saved: boolean; path: string }>(
        `/api/projects/${projectId}/files/content`,
        { method: 'PUT', body: JSON.stringify({ path: filePath, content }) }
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
      }>(`/api/projects/${projectId}/git/status`),

    diff: (projectId: string, file?: string, staged?: boolean) => {
      const params = new URLSearchParams()
      if (file) params.set('file', file)
      if (staged) params.set('staged', 'true')
      return apiFetch<{ diff: string }>(`/api/projects/${projectId}/git/diff?${params}`)
    },

    stage: (projectId: string, files: string[]) =>
      apiFetch<{ output: string }>(`/api/projects/${projectId}/git/stage`, {
        method: 'POST',
        body: JSON.stringify({ files, action: 'stage' }),
      }),

    unstage: (projectId: string, files: string[]) =>
      apiFetch<{ output: string }>(`/api/projects/${projectId}/git/stage`, {
        method: 'POST',
        body: JSON.stringify({ files, action: 'unstage' }),
      }),

    commit: (projectId: string, message: string) =>
      apiFetch<{ output: string }>(`/api/projects/${projectId}/git/commit`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),

    sync: (projectId: string, action: 'push' | 'pull', remote?: string, branch?: string) =>
      apiFetch<{ output: string }>(`/api/projects/${projectId}/git/sync`, {
        method: 'POST',
        body: JSON.stringify({ action, remote, branch }),
      }),

    branches: (projectId: string) =>
      apiFetch<{ branches: string[]; current: string }>(`/api/projects/${projectId}/git/branches`),

    checkout: (projectId: string, branch: string, create?: boolean) =>
      apiFetch<{ output: string }>(`/api/projects/${projectId}/git/branches`, {
        method: 'POST',
        body: JSON.stringify({ branch, create }),
      }),
  },

  ai: {
    /** Stream AI chat via SSE — returns a ReadableStream */
    chat: async (
      projectId: string,
      messages: { role: 'user' | 'model'; text: string }[],
      openFile?: { path: string; content: string },
      onChunk?: (chunk: AIStreamChunk) => void
    ) => {
      const token = await getToken()
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, messages, openFile }),
      })

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') return
            try {
              const chunk = JSON.parse(data) as AIStreamChunk
              onChunk?.(chunk)
            } catch {}
          }
        }
      }
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
