import { NextRequest, NextResponse } from 'next/server'
import os from 'os'
import { docker } from '@/lib/docker'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
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
      let query = supabaseAdmin
        .from('projects')
        .select('id, container_id, status')
        .in('status', ['running', 'ready'])

      if (user) {
        query = query.eq('user_github_id', user.id)
      }

      const { data: runningProjects } = await query

      if (runningProjects && runningProjects.length > 0) {
        const liveContainersList = await docker.listContainers()
        const liveContainerIds = new Set(liveContainersList.map(c => c.Id))
        
        runningContainers = runningProjects.filter(p => 
          p.container_id && liveContainerIds.has(p.container_id)
        ).length
      }
    } catch (e) {
      console.warn('Docker list containers failed:', e)
    }

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
