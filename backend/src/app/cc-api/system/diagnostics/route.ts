import { NextRequest, NextResponse } from 'next/server'
import os from 'os'
import { docker } from '@/lib/docker'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    if (searchParams.get('test_error') === 'true') {
      throw new Error('Sentry Test Error from Diagnostics Route!')
    }
    // 1. Calculate real CPU Load (based on 1-min loadavg relative to core count)
    const loadavg = os.loadavg()
    const cpusCount = os.cpus().length || 1
    const cpuLoad = Math.min(100, Math.round((loadavg[0] / cpusCount) * 100))

    // 2. Calculate real Memory Usage
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100)

    // 3. Count active docker containers
    let runningContainers = 0
    try {
      const list = await docker.listContainers()
      runningContainers = list.length
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
