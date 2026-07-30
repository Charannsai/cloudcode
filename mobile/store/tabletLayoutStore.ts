import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type SidebarPanel = 'explorer' | 'search' | 'git' | 'extensions'
export type BottomPanelTab = 'terminal' | 'preview' | 'problems'

interface TabletLayoutState {
  // Panel visibility
  sidebarVisible: boolean
  rightPanelVisible: boolean
  bottomPanelVisible: boolean

  // Active panel selections
  activeSidebarPanel: SidebarPanel
  activeBottomTab: BottomPanelTab

  // Open file tabs in the editor
  openEditorTabs: { path: string; name: string }[]
  activeEditorTab: string | null // file path of the active tab

  // Dirty (modified) file paths
  dirtyFiles: Set<string>

  // Cursor position for status bar
  cursorLine: number
  cursorCol: number

  // Actions
  toggleSidebar: () => void
  toggleRightPanel: () => void
  toggleBottomPanel: () => void
  setSidebarPanel: (panel: SidebarPanel) => void
  setBottomTab: (tab: BottomPanelTab) => void

  openFile: (path: string, name: string) => void
  closeFile: (path: string) => void
  setActiveFile: (path: string) => void
  markDirty: (path: string) => void
  markClean: (path: string) => void

  setCursorPosition: (line: number, col: number) => void

  setSidebarVisible: (v: boolean) => void
  setRightPanelVisible: (v: boolean) => void
  setBottomPanelVisible: (v: boolean) => void
}

export const useTabletLayoutStore = create<TabletLayoutState>()(
  persist(
    (set, get) => ({
      // Defaults
      sidebarVisible: true,
      rightPanelVisible: false,
      bottomPanelVisible: true,
      activeSidebarPanel: 'explorer',
      activeBottomTab: 'terminal',
      openEditorTabs: [],
      activeEditorTab: null,
      dirtyFiles: new Set(),
      cursorLine: 1,
      cursorCol: 1,

      // Toggles
      toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
      toggleRightPanel: () => set((s) => ({ rightPanelVisible: !s.rightPanelVisible })),
      toggleBottomPanel: () => set((s) => ({ bottomPanelVisible: !s.bottomPanelVisible })),

      setSidebarVisible: (v) => set({ sidebarVisible: v }),
      setRightPanelVisible: (v) => set({ rightPanelVisible: v }),
      setBottomPanelVisible: (v) => set({ bottomPanelVisible: v }),

      setSidebarPanel: (panel) => {
        const state = get()
        if (state.activeSidebarPanel === panel && state.sidebarVisible) {
          // Clicking the same panel toggles sidebar off
          set({ sidebarVisible: false })
        } else {
          set({ activeSidebarPanel: panel, sidebarVisible: true })
        }
      },
      setBottomTab: (tab) => set({ activeBottomTab: tab, bottomPanelVisible: true }),

      // File tab management
      openFile: (path, name) => {
        const state = get()
        const alreadyOpen = state.openEditorTabs.some((t) => t.path === path)
        if (alreadyOpen) {
          set({ activeEditorTab: path })
        } else {
          set({
            openEditorTabs: [...state.openEditorTabs, { path, name }],
            activeEditorTab: path,
          })
        }
      },
      closeFile: (path) => {
        const state = get()
        const newTabs = state.openEditorTabs.filter((t) => t.path !== path)
        let newActive = state.activeEditorTab
        if (state.activeEditorTab === path) {
          const idx = state.openEditorTabs.findIndex((t) => t.path === path)
          newActive = newTabs.length > 0
            ? newTabs[Math.max(0, idx - 1)]?.path ?? null
            : null
        }
        const newDirty = new Set(state.dirtyFiles)
        newDirty.delete(path)
        set({ openEditorTabs: newTabs, activeEditorTab: newActive, dirtyFiles: newDirty })
      },
      setActiveFile: (path) => set({ activeEditorTab: path }),

      markDirty: (path) => set((s) => {
        const next = new Set(s.dirtyFiles)
        next.add(path)
        return { dirtyFiles: next }
      }),
      markClean: (path) => set((s) => {
        const next = new Set(s.dirtyFiles)
        next.delete(path)
        return { dirtyFiles: next }
      }),

      setCursorPosition: (line, col) => set({ cursorLine: line, cursorCol: col }),
    }),
    {
      name: 'tablet-layout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist layout preferences, not transient state
      partialize: (state) => ({
        sidebarVisible: state.sidebarVisible,
        rightPanelVisible: state.rightPanelVisible,
        bottomPanelVisible: state.bottomPanelVisible,
        activeSidebarPanel: state.activeSidebarPanel,
        activeBottomTab: state.activeBottomTab,
      }),
    }
  )
)
