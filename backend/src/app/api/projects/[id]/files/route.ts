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

function sanitizePath(projectId: string, filePath: string): string | null {
  const workspacePath = path.join(process.cwd(), 'projects', projectId)
  const resolved = path.resolve(workspacePath, filePath)
  if (!resolved.startsWith(workspacePath)) return null
  return resolved
}

// POST /api/projects/[id]/files — create file or directory
export async function POST(req: NextRequest, { params }: Params) {
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

  const body = await req.json().catch(() => null)
  if (!body?.path || !body?.type || !['file', 'directory'].includes(body.type)) {
    return errorResponse('Missing path or invalid type')
  }

  const safeFilePath = sanitizePath(id, body.path)
  if (!safeFilePath) return errorResponse('Invalid file path', 400)

  try {
    if (body.type === 'directory') {
      await fs.mkdir(safeFilePath, { recursive: true })
    } else {
      await fs.mkdir(path.dirname(safeFilePath), { recursive: true })
      await fs.writeFile(safeFilePath, '', 'utf-8')
    }
    return successResponse({ created: true, path: body.path, type: body.type })
  } catch (err) {
    return errorResponse(`Failed to create ${body.type}: ${(err as Error).message}`, 500)
  }
}

// DELETE /api/projects/[id]/files — delete file or directory
export async function DELETE(req: NextRequest, { params }: Params) {
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

  const filePath = req.nextUrl.searchParams.get('path')
  if (!filePath) return errorResponse('Missing path parameter')

  const safeFilePath = sanitizePath(id, filePath)
  if (!safeFilePath) return errorResponse('Invalid file path', 400)

  try {
    await fs.rm(safeFilePath, { recursive: true, force: true })
    return successResponse({ deleted: true, path: filePath })
  } catch (err) {
    return errorResponse(`Failed to delete: ${(err as Error).message}`, 500)
  }
}

// PATCH /api/projects/[id]/files — rename file or directory
export async function PATCH(req: NextRequest, { params }: Params) {
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

  const body = await req.json().catch(() => null)
  if (!body?.oldPath || !body?.newPath) {
    return errorResponse('Missing oldPath or newPath')
  }

  const safeOldPath = sanitizePath(id, body.oldPath)
  const safeNewPath = sanitizePath(id, body.newPath)

  if (!safeOldPath || !safeNewPath) {
    return errorResponse('Invalid file path', 400)
  }

  try {
    await fs.mkdir(path.dirname(safeNewPath), { recursive: true })
    await fs.rename(safeOldPath, safeNewPath)
    return successResponse({ renamed: true, oldPath: body.oldPath, newPath: body.newPath })
  } catch (err) {
    return errorResponse(`Failed to rename: ${(err as Error).message}`, 500)
  }
}
