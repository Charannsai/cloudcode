import { useEffect, useRef, useState, useCallback } from 'react'
import { getToken } from '@/lib/auth'
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

/**
 * Filter terminal control characters (ANSI codes).
 * This makes the output "clean" for basic text components.
 */
function stripAnsi(text: string): string {
  // Regex for most ANSI escape sequences including colors, movements, and erasures
  const ansiRegex = /[\u001b\u009b][[[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  return text.replace(ansiRegex, '');
}

export function useTerminal({ projectId, onReady }: UseTerminalOptions): UseTerminalReturn {
  const [output, setOutput] = useState('')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let ws: WebSocket | null = null

    async function connect() {
      const token = await getToken()
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
          if (msg.type === 'output' && typeof msg.data === 'string') {
            const data = msg.data;
            // Check for clear screen code (ESC[2J or \f)
            if (data.includes('\u001b[2J') || data.includes('\u001b[H')) {
              setOutput(stripAnsi(data))
            } else {
              setOutput((prev) => prev + stripAnsi(data))
            }
          } else if (msg.type === 'ready') {
            onReady?.()
          } else if (msg.type === 'error') {
            setError(msg.message || 'Terminal error')
          }
        } catch {
          // Non-JSON message?
          const data = typeof event.data === 'string' ? event.data : ''
          setOutput((prev) => prev + stripAnsi(data))
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

