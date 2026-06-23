import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { approvalId, action } = body as { approvalId: string; action: 'approve' | 'reject' }

    if (!approvalId || !action) {
      return errorResponse('Missing approvalId or action', 400)
    }

    const pending = (global as any).pendingCommands?.get(approvalId)
    if (!pending) {
      return errorResponse('Pending command not found or expired', 404)
    }

    pending.resolve(action === 'approve')
    (global as any).pendingCommands.delete(approvalId)

    return successResponse({ success: true })
  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}
