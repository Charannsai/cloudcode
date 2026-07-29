import { NextRequest, NextResponse } from 'next/server'
import os from 'os'
import { docker } from '@/lib/docker'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const rawAuth = req.headers.get('authorization')
    console.log('[Diagnostics Debug] Raw auth header:', rawAuth ? rawAuth.slice(0, 20) + '...' : 'NULL')
    const user = getUserFromRequest(req)

    // 1. Calculate real CPU Load (based on 1-min loadavg relative to core count)
    const loadavg = os.loadavg()
    const cpusCount = os.cpus().length || 1
    const cpuLoad = Math.min(100, Math.round((loadavg[0] / cpusCount) * 100))

    // 2. Calculate real Memory Usage
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100)

    // 3. Count active workspace docker containers belonging to the user's active projects
    let runningContainers = 0
    try {
      console.log('[Diagnostics Debug] Incoming request user:', user ? user.id : 'UNAUTHENTICATED (null)')
      if (user) {
        const { data: userProjects, error: dbErr } = await supabaseAdmin
          .from('projects')
          .select('id, name, container_id, status')
          .eq('user_github_id', user.id)
          .eq('status', 'running')

        console.log('[Diagnostics Debug] DB userProjects query result:', { userProjects, dbErr })

        if (userProjects && userProjects.length > 0) {
          const liveContainersList = await docker.listContainers({ all: true })
          console.log('[Diagnostics Debug] Live Docker Containers:', liveContainersList.map(c => ({ id: c.Id.slice(0, 12), names: c.Names, state: c.State })))

          for (const p of userProjects) {
            if (!p.container_id || p.container_id.length < 4) continue
            
            const container = liveContainersList.find(c => {
              const isCloudCodeWorkspace = c.Names && c.Names.some(n => n.includes('cloudcode-'))
              if (!isCloudCodeWorkspace) return false

              return c.Id === p.container_id || 
                     (p.container_id.length >= 8 && c.Id.startsWith(p.container_id)) || 
                     (c.Id.length >= 8 && p.container_id.startsWith(c.Id))
            })

            console.log(`[Diagnostics Debug] Project ${p.name} (${p.id}) container_id: ${p.container_id} -> Matched Live Container:`, container ? { id: container.Id.slice(0, 12), state: container.State } : 'NONE')

            if (container && container.State === 'running') {
              runningContainers++
            } else {
              // Sync stale DB status to 'stopped'
              supabaseAdmin
                .from('projects')
                .update({ status: 'stopped' })
                .eq('id', p.id)
                .then(
                  () => console.log(`[Diagnostics Sync] Synced project ${p.id} status to stopped`),
                  (err) => console.error(`[Diagnostics Sync] Failed for ${p.id}:`, err)
                )
            }
          }
        }
      } else {
        // Unauthenticated request (e.g. curl / health checks): strictly 0 running containers
        runningContainers = 0
      }
    } catch (e) {
      console.warn('Docker list containers failed:', e)
    }

    console.log('[DIAGNOSTICS_FINAL_DEBUG]', JSON.stringify({ user: user ? user.id : null, runningContainers }))

    return NextResponse.json({
      success: true,
      data: {
        cpuLoad,
        memoryUsage,
        runningContainers,
        platform: os.platform(),
        uptime: Math.round(os.uptime()),
        timestamp: Date.now()
      }
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
