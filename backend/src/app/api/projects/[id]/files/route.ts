import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { FileNode } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

// GET /api/projects/[id]/files — list all files in project
export async function GET(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)
  const { id } = await params

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_github_id', user.id)
    .single()

  if (!project) return errorResponse('Project not found', 404)

  const workspacePath = path.join(process.cwd(), 'projects', id)

  try {
    const tree = await buildFileTree(workspacePath, workspacePath)
    return successResponse(tree)
  } catch {
    return errorResponse('Failed to read project files', 500)
  }
}

async function buildFileTree(basePath: string, currentPath: string): Promise<FileNode[]> {
  const IGNORED = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.DS_Store'])
  
  const entries = await fs.readdir(currentPath, { withFileTypes: true })
  const nodes: FileNode[] = []

  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue

    const fullPath = path.join(currentPath, entry.name)
    const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/')

    if (entry.isDirectory()) {
      const children = await buildFileTree(basePath, fullPath)
      nodes.push({ name: entry.name, path: relativePath, type: 'directory', children })
    } else {
      const stat = await fs.stat(fullPath)
      nodes.push({ name: entry.name, path: relativePath, type: 'file', size: stat.size })
    }
  }

  // Directories first, then files
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}
