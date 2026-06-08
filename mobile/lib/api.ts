import { getToken } from './auth'
import { Project, FileNode } from '@/types'
import EventSource from 'react-native-sse'

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
    create: (projectId: string, filePath: string, type: 'file' | 'directory') =>
      apiFetch<{ created: boolean; path: string; type: 'file' | 'directory' }>(
        `/api/projects/${projectId}/files`,
        { method: 'POST', body: JSON.stringify({ path: filePath, type }) }
      ),
    delete: (projectId: string, filePath: string) =>
      apiFetch<{ deleted: boolean; path: string }>(
        `/api/projects/${projectId}/files?path=${encodeURIComponent(filePath)}`,
        { method: 'DELETE' }
      ),
    rename: (projectId: string, oldPath: string, newPath: string) =>
      apiFetch<{ renamed: boolean; oldPath: string; newPath: string }>(
        `/api/projects/${projectId}/files`,
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

    ssh: {
      get: (projectId: string) =>
        apiFetch<{ hasKey: boolean; publicKey: string | null }>(`/api/projects/${projectId}/git/ssh`),
      generate: (projectId: string) =>
        apiFetch<{ hasKey: boolean; publicKey: string }>(`/api/projects/${projectId}/git/ssh`, { method: 'POST' }),
    },

    config: {
      get: (projectId: string) =>
        apiFetch<{ name: string | null; email: string | null }>(`/api/projects/${projectId}/git/config`),
      set: (projectId: string, name: string, email: string) =>
        apiFetch<{ saved: boolean }>(`/api/projects/${projectId}/git/config`, {
          method: 'POST',
          body: JSON.stringify({ name, email }),
        }),
    },
  },

  ai: {
    chat: async (
      projectId: string,
      messages: { role: 'user' | 'model'; text: string }[],
      openFile?: { path: string; content: string },
      onChunk?: (chunk: AIStreamChunk) => void
    ) => {
      const token = await getToken()

      return new Promise<void>((resolve, reject) => {
        const es = new EventSource(`${API_URL}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ projectId, messages, openFile }),
        })

        es.addEventListener('message', (event) => {
          if (!event.data) return
          if (event.data === '[DONE]') {
            es.close()
            resolve()
            return
          }
          try {
            const chunk = JSON.parse(event.data) as AIStreamChunk
            onChunk?.(chunk)
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        })

        es.addEventListener('error', (event) => {
          console.error('SSE Error:', event)
          es.close()
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
