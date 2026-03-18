import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { TerminalMessage } from '@/types'

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000'

interface UseTerminalOptions {
  projectId: string
  onReady?: () => void
}

interface UseTerminalReturn {
  output: string
  connected: boolean
  error: string | null
  sendInput: (text: string) => void
  resize: (cols: number, rows: number) => void
  clear: () => void
}

export function useTerminal({ projectId, onReady }: UseTerminalOptions): UseTerminalReturn {
  const [output, setOutput] = useState('')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let ws: WebSocket | null = null

    async function connect() {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        setError('Not authenticated')
        return
      }

      const url = `${WS_URL}/api/terminal/${projectId}?token=${encodeURIComponent(token)}`
      ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)

      ws.onmessage = (event) => {
        try {
          const msg: TerminalMessage = JSON.parse(event.data)
          if (msg.type === 'output' && msg.data) {
            setOutput((prev) => prev + msg.data)
          } else if (msg.type === 'ready') {
            onReady?.()
          } else if (msg.type === 'error') {
            setError(msg.message || 'Terminal error')
          }
        } catch {
          // Non-JSON message
          setOutput((prev) => prev + event.data)
        }
      }

      ws.onerror = () => setError('WebSocket connection error')
      ws.onclose = (e) => {
        setConnected(false)
        if (e.code !== 1000) {
          setError(`Connection closed (${e.code}: ${e.reason || 'unknown'})`)
        }
      }
    }

    connect()

    return () => {
      ws?.close(1000, 'Component unmounted')
    }
  }, [projectId, onReady])

  const sendInput = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input', data: text }))
    }
  }, [])

  const resize = useCallback((cols: number, rows: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }))
    }
  }, [])

  const clear = useCallback(() => setOutput(''), [])

  return { output, connected, error, sendInput, resize, clear }
}
