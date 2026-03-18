import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

// GET /api/projects/[id]/files/content?path=src/index.js
export async function GET(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)
  const { id } = await params

  const filePath = req.nextUrl.searchParams.get('path')
  if (!filePath) return errorResponse('Missing path query param')

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_github_id', user.id)
    .single()

  if (!project) return errorResponse('Project not found', 404)

  const safeFilePath = sanitizePath(id, filePath)
  if (!safeFilePath) return errorResponse('Invalid file path', 400)

  try {
    const content = await fs.readFile(safeFilePath, 'utf-8')
    return successResponse({ path: filePath, content })
  } catch {
    return errorResponse('File not found', 404)
  }
}

// PUT /api/projects/[id]/files/content
export async function PUT(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)
  const { id } = await params

  const body = await req.json().catch(() => null)
  if (!body?.path || typeof body.content !== 'string') {
    return errorResponse('Missing path or content')
  }

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_github_id', user.id)
    .single()

  if (!project) return errorResponse('Project not found', 404)

  const safeFilePath = sanitizePath(id, body.path)
  if (!safeFilePath) return errorResponse('Invalid file path', 400)

  try {
    // Ensure parent directory exists
    await fs.mkdir(path.dirname(safeFilePath), { recursive: true })
    await fs.writeFile(safeFilePath, body.content, 'utf-8')
    return successResponse({ saved: true, path: body.path })
  } catch {
    return errorResponse('Failed to save file', 500)
  }
}

function sanitizePath(projectId: string, filePath: string): string | null {
  const workspacePath = path.join(process.cwd(), 'projects', projectId)
  const resolved = path.resolve(workspacePath, filePath)
  
  // Prevent path traversal attacks
  if (!resolved.startsWith(workspacePath)) return null
  
  return resolved
}
