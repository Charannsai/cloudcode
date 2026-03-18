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
}
