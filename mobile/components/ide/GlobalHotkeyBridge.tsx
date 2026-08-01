import { useEffect } from 'react'
import { useTabletLayoutStore } from '@/store/tabletLayoutStore'

interface GlobalHotkeyBridgeProps {
  onSave?: () => void
}

/**
 * Global Hardware Hotkey Bridge for Tablet / Web IDE
 *
 * Listens for hardware keyboard key presses (Ctrl+~, Ctrl+B, Ctrl+S, Ctrl+W, Ctrl+Shift+F).
 * Safely guards against non-DOM environments so it never crashes in Expo Go or React Native.
 */
export function GlobalHotkeyBridge({ onSave }: GlobalHotkeyBridgeProps) {
  const {
    toggleSidebar,
    toggleBottomPanel,
    setSidebarPanel,
    setBottomTab,
    activeEditorTab,
    closeFile,
  } = useTabletLayoutStore()

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey
      const key = e.key ? e.key.toLowerCase() : ''
      const code = e.code || ''

      // Ctrl + ~ or Ctrl + ` (Toggle Terminal)
      if (isCtrlOrCmd && (key === '`' || key === '~' || code === 'Backquote' || e.keyCode === 192)) {
        e.preventDefault()
        e.stopPropagation()
        setBottomTab('terminal')
        toggleBottomPanel()
        return
      }

      // Ctrl + B (Toggle Sidebar)
      if (isCtrlOrCmd && !e.shiftKey && key === 'b') {
        e.preventDefault()
        e.stopPropagation()
        toggleSidebar()
        return
      }

      // Ctrl + Shift + F (Search Panel)
      if (isCtrlOrCmd && e.shiftKey && key === 'f') {
        e.preventDefault()
        e.stopPropagation()
        setSidebarPanel('search')
        return
      }

      // Ctrl + Shift + M (Problems Panel)
      if (isCtrlOrCmd && e.shiftKey && key === 'm') {
        e.preventDefault()
        e.stopPropagation()
        setBottomTab('problems')
        toggleBottomPanel()
        return
      }

      // Ctrl + S (Save)
      if (isCtrlOrCmd && !e.shiftKey && key === 's') {
        e.preventDefault()
        e.stopPropagation()
        if (onSave) onSave()
        return
      }

      // Ctrl + W (Close Active Tab)
      if (isCtrlOrCmd && !e.shiftKey && key === 'w') {
        e.preventDefault()
        e.stopPropagation()
        if (activeEditorTab) closeFile(activeEditorTab)
        return
      }
    }

    // Capture phase listener so hotkeys are intercepted globally on Web
    window.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [
    toggleSidebar,
    toggleBottomPanel,
    setSidebarPanel,
    setBottomTab,
    activeEditorTab,
    closeFile,
    onSave,
  ])

  return null
}
