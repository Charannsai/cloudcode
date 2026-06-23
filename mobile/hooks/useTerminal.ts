import { useEffect, useRef, useState, useCallback } from 'react'
import { getToken } from '@/lib/auth'
import { TerminalMessage } from '@/types'

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000'

interface UseTerminalOptions {
  projectId: string
  terminalId?: string
  onOutput?: (data: string, shouldClear: boolean) => void
  onReady?: () => void
}

interface UseTerminalReturn {
  connected: boolean
  error: string | null
  sendInput: (text: string) => void
  resize: (cols: number, rows: number) => void
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

export function useTerminal({ projectId, terminalId, onOutput, onReady }: UseTerminalOptions): UseTerminalReturn {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const onOutputRef = useRef(onOutput)
  const onReadyRef = useRef(onReady)

  useEffect(() => {
    onOutputRef.current = onOutput
  }, [onOutput])

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    let ws: WebSocket | null = null

    async function connect() {
      const token = await getToken()
      if (!token) {
        setError('Not authenticated')
        return
      }

      const terminalParam = terminalId ? `&terminalId=${encodeURIComponent(terminalId)}` : ''
      const url = `${WS_URL}/cc-api/terminal/${projectId}?token=${encodeURIComponent(token)}${terminalParam}`
      ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)

      ws.onmessage = (event) => {
        try {
          const msg: TerminalMessage = JSON.parse(event.data)
          if (msg.type === 'output' && typeof msg.data === 'string') {
            let data = msg.data;
            
            // Post-process the output to change # to > as requested
            // We only want to target the end of the prompt, usually # followed by a space or end of line
            data = data.replace(/([#])(?=\s|$)/g, '>')

            const cleanData = stripAnsi(data)
            const shouldClear = data.includes('\u001b[2J') || data.includes('\u001b[H')
            onOutputRef.current?.(cleanData, shouldClear)
          } else if (msg.type === 'ready') {
            onReadyRef.current?.()
          } else if (msg.type === 'error') {
            setError(msg.message || 'Terminal error')
          }
        } catch {
          // Non-JSON message?
          let data = typeof event.data === 'string' ? event.data : ''
          data = data.replace(/([#])(?=\s|$)/g, '>')
          const cleanData = stripAnsi(data)
          const shouldClear = data.includes('\u001b[2J') || data.includes('\u001b[H')
          onOutputRef.current?.(cleanData, shouldClear)
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
  }, [projectId, terminalId])

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

  return { connected, error, sendInput, resize }
}
