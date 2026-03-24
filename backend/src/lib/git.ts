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

export async function getGitStatus(containerId: string): Promise<GitStatus> {
  let statusOutput = ''
  let branchOutput = ''

  await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git status --porcelain -b 2>&1`], (data) => {
    statusOutput += data
  })

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
  const args = staged ? ['git', 'diff', '--cached'] : ['git', 'diff']
  if (filePath) args.push(filePath)

  await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && ${args.join(' ')}`], (data) => {
    output += data
  })

  return output
}

export async function gitStage(containerId: string, files: string[]): Promise<string> {
  let output = ''
  const fileList = files.join(' ')
  await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git add ${fileList} 2>&1`], (data) => {
    output += data
  })
  return output
}

export async function gitUnstage(containerId: string, files: string[]): Promise<string> {
  let output = ''
  const fileList = files.join(' ')
  await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git reset HEAD ${fileList} 2>&1`], (data) => {
    output += data
  })
  return output
}

export async function gitCommit(containerId: string, message: string): Promise<string> {
  let output = ''
  const escaped = message.replace(/"/g, '\\"')
  await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git commit -m "${escaped}" 2>&1`], (data) => {
    output += data
  })
  return output
}

export async function gitPush(containerId: string, remote = 'origin', branch?: string): Promise<string> {
  let output = ''
  const branchArg = branch || ''
  await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git push ${remote} ${branchArg} 2>&1`], (data) => {
    output += data
  })
  return output
}

export async function gitPull(containerId: string, remote = 'origin', branch?: string): Promise<string> {
  let output = ''
  const branchArg = branch || ''
  await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git pull ${remote} ${branchArg} 2>&1`], (data) => {
    output += data
  })
  return output
}

export async function gitBranches(containerId: string): Promise<{ branches: string[]; current: string }> {
  let output = ''
  await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git branch 2>&1`], (data) => {
    output += data
  })

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
  await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git checkout ${flag} ${branch} 2>&1`], (data) => {
    output += data
  })
  return output
}

export async function gitLog(containerId: string, count = 20): Promise<string> {
  let output = ''
  await execInContainer(containerId, ['sh', '-c', `cd ${WORKSPACE} && git log --oneline -n ${count} 2>&1`], (data) => {
    output += data
  })
  return output
}
