export type ProjectType = 'node' | 'react' | 'empty'
export type ProjectStatus = 'creating' | 'ready' | 'running' | 'stopped' | 'error'

export interface Project {
  id: string
  user_id: string
  name: string
  type: ProjectType
  status: ProjectStatus
  container_id: string | null
  port: number | null
  github_url: string | null
  created_at: string
  updated_at: string
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  size?: number
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
