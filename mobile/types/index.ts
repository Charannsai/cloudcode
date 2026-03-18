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
  container_status?: string
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  size?: number
}

export interface TerminalMessage {
  type: 'output' | 'ready' | 'error'
  data?: string
  message?: string
}
