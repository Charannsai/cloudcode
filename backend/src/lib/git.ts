import { execInContainer } from './docker'

const WORKSPACE = '/workspace'

export interface GitStatus {
  staged: GitFileChange[]
  unstaged: GitFileChange[]
  untracked: string[]
  branch: string
  ahead: number
  behind: number
}

export interface GitFileChange {
  path: string
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'copied'
}

function parseStatusCode(code: string): 'modified' | 'added' | 'deleted' | 'renamed' | 'copied' {
  switch (code) {
    case 'M': return 'modified'
    case 'A': return 'added'
    case 'D': return 'deleted'
    case 'R': return 'renamed'
    case 'C': return 'copied'
    default: return 'modified'
  }
}

async function ensureSshRemote(containerId: string): Promise<void> {
  let remoteUrl = ''
  try {
    await execInContainer(containerId, ['git', '-c', 'safe.directory=/workspace', 'config', 'remote.origin.url'], (data) => {
      remoteUrl += data
    })
    remoteUrl = remoteUrl.trim()
    if (remoteUrl.startsWith('https://github.com/')) {
      const cleanUrl = remoteUrl.replace(/\/$/, '')
      const match = cleanUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/\?#]+)/)
      if (match) {
        const owner = match[1]
        let repo = match[2]
        if (!repo.endsWith('.git')) repo = repo + '.git'
        const sshUrl = `git@github.com:${owner}/${repo}`
        await execInContainer(containerId, ['git', '-c', 'safe.directory=/workspace', 'remote', 'set-url', 'origin', sshUrl], () => {})
        console.log(`Rewrote remote URL from ${remoteUrl} to ${sshUrl}`)
      }
    }
  } catch (err) {
    console.warn('Failed to ensure SSH remote URL:', err)
  }
}

export async function getGitStatus(containerId: string): Promise<GitStatus> {
  let statusOutput = ''

  let exitCode = await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git -c safe.directory=/workspace -c core.fileMode=false status --porcelain -b 2>&1`], (data) => {
    statusOutput += data
  })

  if (exitCode !== 0) {
    // Check if it is a dubious ownership error or safe directory trust issue
    if (statusOutput.includes('dubious ownership') || statusOutput.includes('safe.directory')) {
      console.log(`[Self-Healing] Detected dubious ownership in container ${containerId}. Auto-bypassing system-wide...`)
      try {
        await execInContainer(containerId, ['git', 'config', '--system', '--add', 'safe.directory', '*'], () => {}, 'root')
        await execInContainer(containerId, ['git', 'config', '--system', 'core.fileMode', 'false'], () => {}, 'root')
        // Retry git status
        statusOutput = ''
        exitCode = await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git status --porcelain -b 2>&1`], (data) => {
          statusOutput += data
        })
      } catch (gitErr) {
        console.error('Self-healing git config failed:', gitErr)
      }
    }
    
    if (exitCode !== 0) {
      throw new Error(statusOutput.trim() || `git status failed with exit code ${exitCode}`)
    }
  }

  const lines = statusOutput.trim().split('\n').filter(Boolean)
  const status: GitStatus = {
    staged: [],
    unstaged: [],
    untracked: [],
    branch: 'main',
    ahead: 0,
    behind: 0,
  }

  for (const line of lines) {
    if (line.startsWith('##')) {
      // Parse branch info
      const branchMatch = line.match(/## (\S+?)(?:\.\.\.|$)/)
      if (branchMatch) status.branch = branchMatch[1]
      const aheadMatch = line.match(/ahead (\d+)/)
      const behindMatch = line.match(/behind (\d+)/)
      if (aheadMatch) status.ahead = parseInt(aheadMatch[1])
      if (behindMatch) status.behind = parseInt(behindMatch[1])
      continue
    }

    const x = line[0] // staged status
    const y = line[1] // unstaged status
    const filePath = line.substring(3).trim()

    if (x === '?' && y === '?') {
      status.untracked.push(filePath)
    } else {
      if (x && x !== ' ' && x !== '?') {
        status.staged.push({ path: filePath, status: parseStatusCode(x) })
      }
      if (y && y !== ' ' && y !== '?') {
        status.unstaged.push({ path: filePath, status: parseStatusCode(y) })
      }
    }
  }

  return status
}

export async function getGitDiff(containerId: string, filePath?: string, staged?: boolean): Promise<string> {
  let output = ''
  const args = staged ? ['git', '-c', 'safe.directory=/workspace', '-c', 'core.fileMode=false', 'diff', '--cached'] : ['git', '-c', 'safe.directory=/workspace', '-c', 'core.fileMode=false', 'diff']
  if (filePath) args.push(`"${filePath.replace(/"/g, '\\"')}"`)

  const exitCode = await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && ${args.join(' ')} 2>&1`], (data) => {
    output += data
  })

  if (exitCode !== 0) {
    throw new Error(output.trim() || `git diff failed with exit code ${exitCode}`)
  }

  return output
}

export async function gitStage(containerId: string, files: string[]): Promise<string> {
  let output = ''
  const fileList = files.map(f => `"${f.replace(/"/g, '\\"')}"`).join(' ')
  const exitCode = await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git -c safe.directory=/workspace -c core.fileMode=false add ${fileList} 2>&1`], (data) => {
    output += data
  })
  if (exitCode !== 0) {
    throw new Error(output.trim() || `git add failed with exit code ${exitCode}`)
  }
  return output
}

export async function gitUnstage(containerId: string, files: string[]): Promise<string> {
  let output = ''
  const fileList = files.map(f => `"${f.replace(/"/g, '\\"')}"`).join(' ')
  const exitCode = await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git -c safe.directory=/workspace -c core.fileMode=false reset HEAD ${fileList} 2>&1`], (data) => {
    output += data
  })
  if (exitCode !== 0) {
    throw new Error(output.trim() || `git reset failed with exit code ${exitCode}`)
  }
  return output
}

export async function gitCommit(containerId: string, message: string): Promise<string> {
  let output = ''
  const escaped = message.replace(/"/g, '\\"')
  const exitCode = await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git -c safe.directory=/workspace -c core.fileMode=false commit -m "${escaped}" 2>&1`], (data) => {
    output += data
  })
  if (exitCode !== 0) {
    throw new Error(output.trim() || `git commit failed with exit code ${exitCode}`)
  }
  return output
}

export async function gitPush(containerId: string, remote = 'origin', branch?: string): Promise<string> {
  await ensureSshRemote(containerId)
  let output = ''
  const branchArg = branch || ''
  const exitCode = await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git -c safe.directory=/workspace -c core.fileMode=false push ${remote} ${branchArg} 2>&1`], (data) => {
    output += data
  })
  if (exitCode !== 0) {
    throw new Error(output.trim() || `git push failed with exit code ${exitCode}`)
  }
  return output
}

export async function gitPull(containerId: string, remote = 'origin', branch?: string): Promise<string> {
  await ensureSshRemote(containerId)
  let output = ''
  const branchArg = branch || ''
  const exitCode = await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git -c safe.directory=/workspace -c core.fileMode=false pull ${remote} ${branchArg} 2>&1`], (data) => {
    output += data
  })
  if (exitCode !== 0) {
    throw new Error(output.trim() || `git pull failed with exit code ${exitCode}`)
  }
  return output
}

export async function gitBranches(containerId: string): Promise<{ branches: string[]; current: string }> {
  let output = ''
  const exitCode = await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git -c safe.directory=/workspace -c core.fileMode=false branch 2>&1`], (data) => {
    output += data
  })
  if (exitCode !== 0) {
    throw new Error(output.trim() || `git branch failed with exit code ${exitCode}`)
  }

  const branches: string[] = []
  let current = ''

  for (const line of output.trim().split('\n').filter(Boolean)) {
    const name = line.replace(/^\*?\s+/, '').trim()
    if (line.startsWith('*')) current = name
    branches.push(name)
  }

  return { branches, current }
}

export async function gitCheckout(containerId: string, branch: string, create = false): Promise<string> {
  let output = ''
  const flag = create ? '-b' : ''
  const exitCode = await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git -c safe.directory=/workspace -c core.fileMode=false checkout ${flag} ${branch} 2>&1`], (data) => {
    output += data
  })
  if (exitCode !== 0) {
    throw new Error(output.trim() || `git checkout failed with exit code ${exitCode}`)
  }
  return output
}

export async function gitLog(containerId: string, count = 20): Promise<string> {
  let output = ''
  const exitCode = await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git -c safe.directory=/workspace -c core.fileMode=false log --oneline -n ${count} 2>&1`], (data) => {
    output += data
  })
  if (exitCode !== 0) {
    throw new Error(output.trim() || `git log failed with exit code ${exitCode}`)
  }
  return output
}
