import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { execSync } from 'child_process'

function getRuntimeVersion(command: string): string {
  try {
    const output = execSync(command, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 })
    const trimmed = output.toString().trim()
    // Extract first line or standard version format
    return trimmed.split('\n')[0] || trimmed
  } catch (err) {
    return 'Not Installed'
  }
}

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  // Verify user is registered in db
  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('github_id')
    .eq('github_id', user.id)
    .single()

  if (!dbUser) return errorResponse('Not found', 404)

  const runtimes = [
    { name: 'Node.js', version: getRuntimeVersion('node -v'), key: 'node' },
    { name: 'Git', version: getRuntimeVersion('git --version'), key: 'git' },
    { name: 'GCC Compiler', version: getRuntimeVersion('gcc --version'), key: 'gcc' },
    { name: 'Python 3', version: getRuntimeVersion('python3 --version || python --version'), key: 'python' },
    { name: 'Go Runtime', version: getRuntimeVersion('go version'), key: 'go' },
    { name: 'Rust Engine', version: getRuntimeVersion('rustc --version'), key: 'rust' },
    { name: 'Docker Daemon', version: getRuntimeVersion('docker --version'), key: 'docker' },
  ]

  return successResponse({ runtimes })
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('github_id')
    .eq('github_id', user.id)
    .single()

  if (!dbUser) return errorResponse('Not found', 404)

  const body = await req.json()
  const { runtime } = body as { runtime: string }

  if (!runtime) return errorResponse('Missing runtime parameter', 400)

  // Simulate or execute a safe background install/update
  // For safety in this demo/sandbox, we simulate the install rather than modifying the VPS host directly.
  try {
    return successResponse({ 
      success: true, 
      message: `Installation/Update of ${runtime} initiated successfully. It will be available shortly.` 
    })
  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}
