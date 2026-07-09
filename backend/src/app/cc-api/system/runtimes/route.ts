import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { execSync } from 'child_process'
import { execInContainer, installRuntimeInContainerAsync } from '@/lib/docker'

function getRuntimeVersion(command: string): string {
  try {
    const output = execSync(command, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 })
    const trimmed = output.toString().trim()
    return trimmed.split('\n')[0] || trimmed
  } catch (err) {
    return 'Not Installed'
  }
}

async function getContainerRuntimeVersion(containerId: string, command: string[]): Promise<string> {
  let output = ''
  try {
    const exitCode = await execInContainer(containerId, command, (data) => {
      output += data
    })
    if (exitCode !== 0) return 'Not Installed'
    const trimmed = output.trim()
    return trimmed.split('\n')[0] || trimmed
  } catch (err) {
    return 'Not Installed'
  }
}

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (projectId) {
    // Verify project belongs to user
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_github_id', user.id)
      .single()

    if (!project) return errorResponse('Project not found', 404)
    if (!project.container_id) return errorResponse('Container not provisioned yet', 400)

    const runtimes = [
      { name: 'Node.js', version: await getContainerRuntimeVersion(project.container_id, ['node', '-v']), key: 'node' },
      { name: 'Git', version: await getContainerRuntimeVersion(project.container_id, ['git', '--version']), key: 'git' },
      { name: 'C/C++ (GCC)', version: await getContainerRuntimeVersion(project.container_id, ['gcc', '--version']), key: 'gcc' },
      { name: 'Python 3', version: await getContainerRuntimeVersion(project.container_id, ['python3', '--version']), key: 'python' },
      { name: 'Go Runtime', version: await getContainerRuntimeVersion(project.container_id, ['go', 'version']), key: 'go' },
      { name: 'Rust Engine', version: await getContainerRuntimeVersion(project.container_id, ['rustc', '--version']), key: 'rust' },
      { name: 'Ruby', version: await getContainerRuntimeVersion(project.container_id, ['ruby', '-v']), key: 'ruby' },
      { name: 'Java (JDK)', version: await getContainerRuntimeVersion(project.container_id, ['java', '-version']), key: 'java' },
      { name: 'PHP', version: await getContainerRuntimeVersion(project.container_id, ['php', '-v']), key: 'php' },
    ]

    return successResponse({ runtimes })
  }

  // Fallback to checking the host VPS runtimes
  const runtimes = [
    { name: 'Node.js', version: getRuntimeVersion('node -v'), key: 'node' },
    { name: 'Git', version: getRuntimeVersion('git --version'), key: 'git' },
    { name: 'C/C++ (GCC)', version: getRuntimeVersion('gcc --version'), key: 'gcc' },
    { name: 'Python 3', version: getRuntimeVersion('python3 --version || python --version'), key: 'python' },
    { name: 'Go Runtime', version: getRuntimeVersion('go version'), key: 'go' },
    { name: 'Rust Engine', version: getRuntimeVersion('rustc --version'), key: 'rust' },
    { name: 'Ruby', version: getRuntimeVersion('ruby -v'), key: 'ruby' },
    { name: 'Java (JDK)', version: getRuntimeVersion('java -version'), key: 'java' },
    { name: 'PHP', version: getRuntimeVersion('php -v'), key: 'php' },
  ]

  return successResponse({ runtimes })
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const body = await req.json().catch(() => ({}))
  const { runtime, projectId } = body as { runtime: string; projectId?: string }

  if (!runtime) return errorResponse('Missing runtime parameter', 400)
  if (!projectId) return errorResponse('Missing projectId parameter', 400)

  // Verify project ownership
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_github_id', user.id)
    .single()

  if (!project) return errorResponse('Project not found', 404)
  if (!project.container_id) return errorResponse('Container not provisioned yet', 400)

  // Kick off installation inside the container in the background
  installRuntimeInContainerAsync(project.container_id, runtime).catch((err) => {
    console.error(`[Background Runtime Install Failed] ${runtime}:`, err)
  })

  return successResponse({
    success: true,
    message: `Installation/Update of ${runtime} initiated successfully inside workspace. It will be available shortly.`
  })
}
