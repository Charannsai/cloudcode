import { useEffect } from 'react'
import { useTabletLayoutStore } from '@/store/tabletLayoutStore'

export interface KeyboardShortcutHandlers {
  onSave?: () => void
  onCloseTab?: () => void
}

/**
 * Global Hardware Keyboard Shortcuts Listener for Tablet/Web IDE
 *
 * Listens for hardware keyboard key combinations:
 *   - Ctrl + ~ / Cmd + ~ (or Ctrl + `): Toggle Terminal / Bottom Panel
 *   - Ctrl + B / Cmd + B: Toggle Sidebar Explorer
 *   - Ctrl + Shift + F: Open Search Panel
 *   - Ctrl + Shift + M: Toggle Problems / Bottom Panel
 *   - Ctrl + S / Cmd + S: Save File
 *   - Ctrl + W / Cmd + W: Close Active Tab
 */
export function useGlobalKeyboardShortcuts(handlers?: KeyboardShortcutHandlers) {
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

      // Ctrl + ~ or Ctrl + ` (Toggle Terminal / Bottom Panel)
      if (isCtrlOrCmd && (key === '`' || key === '~' || code === 'Backquote' || e.keyCode === 192)) {
        e.preventDefault()
        setBottomTab('terminal')
        toggleBottomPanel()
        return
      }

      // Ctrl + B (Toggle Sidebar)
      if (isCtrlOrCmd && !e.shiftKey && key === 'b') {
        e.preventDefault()
        toggleSidebar()
        return
      }

      // Ctrl + Shift + F (Open Search Panel)
      if (isCtrlOrCmd && e.shiftKey && key === 'f') {
        e.preventDefault()
        setSidebarPanel('search')
        return
      }

      // Ctrl + Shift + M (Toggle Problems / Bottom Panel)
      if (isCtrlOrCmd && e.shiftKey && key === 'm') {
        e.preventDefault()
        setBottomTab('problems')
        toggleBottomPanel()
        return
      }

      // Ctrl + S (Save File)
      if (isCtrlOrCmd && !e.shiftKey && key === 's') {
        e.preventDefault()
        if (handlers?.onSave) {
          handlers.onSave()
        }
        return
      }

      // Ctrl + W (Close Active Tab)
      if (isCtrlOrCmd && !e.shiftKey && key === 'w') {
        e.preventDefault()
        if (handlers?.onCloseTab) {
          handlers.onCloseTab()
        } else if (activeEditorTab) {
          closeFile(activeEditorTab)
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    toggleSidebar,
    toggleBottomPanel,
    setSidebarPanel,
    setBottomTab,
    activeEditorTab,
    closeFile,
    handlers,
  ])
}
