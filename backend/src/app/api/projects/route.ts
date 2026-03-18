import { NextRequest } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { createContainer } from '@/lib/docker'

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(60).regex(/^[a-zA-Z0-9_\- ]+$/),
  type: z.enum(['node', 'react', 'empty']),
})

// GET /api/projects — list user's projects
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_github_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return errorResponse(error.message, 500)
  return successResponse(data)
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const parsed = CreateProjectSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.message)

  const { name, type } = parsed.data
  const projectId = uuidv4()

  const { data: project, error: dbError } = await supabaseAdmin
    .from('projects')
    .insert({
      id: projectId,
      user_github_id: user.id,
      name,
      type,
      status: 'creating',
    })
    .select()
    .single()

  if (dbError) return errorResponse(dbError.message, 500)

  const workspacePath = path.join(process.cwd(), 'projects', projectId)
  await fs.mkdir(workspacePath, { recursive: true })
  await seedTemplate(workspacePath, type)

  provisionContainer(projectId).catch(console.error)

  return successResponse(project, 201)
}

async function seedTemplate(dir: string, type: string) {
  if (type === 'node') {
    await fs.writeFile(
      path.join(dir, 'index.js'),
      `const http = require('http');\nconst port = 3000;\n\nhttp.createServer((req, res) => {\n  res.end('Hello from CloudCode!\\n');\n}).listen(port, () => console.log(\`Server on port \${port}\`));\n`
    )
    await fs.writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify({
        name: 'cloudcode-project',
        version: '1.0.0',
        main: 'index.js',
        scripts: { start: 'node index.js', dev: 'node index.js' },
      }, null, 2)
    )
  } else if (type === 'react') {
    await fs.writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify({
        name: 'cloudcode-react',
        version: '1.0.0',
        scripts: { dev: 'vite', build: 'vite build', start: 'vite preview' },
        dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
        devDependencies: { vite: '^5.0.0', '@vitejs/plugin-react': '^4.0.0' },
      }, null, 2)
    )
    await fs.writeFile(
      path.join(dir, 'index.html'),
      `<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><title>CloudCode App</title></head>\n<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>\n`
    )
    await fs.mkdir(path.join(dir, 'src'), { recursive: true })
    await fs.writeFile(
      path.join(dir, 'src', 'main.jsx'),
      `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nReactDOM.createRoot(document.getElementById('root')).render(<h1>Hello from CloudCode!</h1>);\n`
    )
  } else {
    await fs.writeFile(path.join(dir, 'README.md'), '# My CloudCode Project\n\nStart coding!\n')
  }
}

async function provisionContainer(projectId: string) {
  try {
    const { containerId } = await createContainer(projectId)
    await supabaseAdmin
      .from('projects')
      .update({ status: 'ready', container_id: containerId })
      .eq('id', projectId)
  } catch (err) {
    console.error('Container provisioning failed:', err)
    await supabaseAdmin
      .from('projects')
      .update({ status: 'error' })
      .eq('id', projectId)
  }
}
