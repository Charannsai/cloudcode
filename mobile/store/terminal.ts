import { create } from 'zustand'

/**
 * Per-project terminal state that survives navigation.
 * This is in-memory only (not persisted to AsyncStorage) since
 * terminal processes restart on app kill anyway.
 */
interface ProjectTerminalState {
  terminals: string[]
  activeTerminalId: string
  outputs: Record<string, string>
  commandHistory: string[]
}

interface TerminalStore {
  // Map of projectId -> terminal state
  projects: Record<string, ProjectTerminalState>

  // Get or initialize project state
  getProjectState: (projectId: string) => ProjectTerminalState

  // Terminal tab management
  addTerminal: (projectId: string, terminalId: string) => void
  removeTerminal: (projectId: string, terminalId: string) => void
  setActiveTerminal: (projectId: string, terminalId: string) => void

  // Output management
  appendOutput: (projectId: string, terminalId: string, data: string) => void
  clearOutput: (projectId: string, terminalId: string) => void
  setOutput: (projectId: string, terminalId: string, data: string) => void

  // Command history
  addToHistory: (projectId: string, command: string) => void
}

const DEFAULT_STATE: ProjectTerminalState = {
  terminals: ['main'],
  activeTerminalId: 'main',
  outputs: {},
  commandHistory: [],
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  projects: {},

  getProjectState: (projectId: string) => {
    const state = get().projects[projectId]
    if (state) return state
    // Initialize default state for this project
    const newState = { ...DEFAULT_STATE, outputs: {} }
    set((s) => ({
      projects: { ...s.projects, [projectId]: newState },
    }))
    return newState
  },

  addTerminal: (projectId: string, terminalId: string) => {
    set((s) => {
      const proj = s.projects[projectId] || { ...DEFAULT_STATE, outputs: {} }
      if (proj.terminals.includes(terminalId)) return s
      return {
        projects: {
          ...s.projects,
          [projectId]: {
            ...proj,
            terminals: [...proj.terminals, terminalId],
            activeTerminalId: terminalId,
          },
        },
      }
    })
  },

  removeTerminal: (projectId: string, terminalId: string) => {
    set((s) => {
      const proj = s.projects[projectId]
      if (!proj || proj.terminals.length <= 1) return s
      const idx = proj.terminals.indexOf(terminalId)
      const newTerminals = proj.terminals.filter((t) => t !== terminalId)
      const newOutputs = { ...proj.outputs }
      delete newOutputs[terminalId]
      const newActive =
        proj.activeTerminalId === terminalId
          ? newTerminals[Math.max(0, idx - 1)]
          : proj.activeTerminalId
      return {
        projects: {
          ...s.projects,
          [projectId]: {
            ...proj,
            terminals: newTerminals,
            activeTerminalId: newActive,
            outputs: newOutputs,
          },
        },
      }
    })
  },

  setActiveTerminal: (projectId: string, terminalId: string) => {
    set((s) => {
      const proj = s.projects[projectId]
      if (!proj) return s
      return {
        projects: {
          ...s.projects,
          [projectId]: { ...proj, activeTerminalId: terminalId },
        },
      }
    })
  },

  appendOutput: (projectId: string, terminalId: string, data: string) => {
    set((s) => {
      const proj = s.projects[projectId] || { ...DEFAULT_STATE, outputs: {} }
      const existing = proj.outputs[terminalId] || ''
      return {
        projects: {
          ...s.projects,
          [projectId]: {
            ...proj,
            outputs: { ...proj.outputs, [terminalId]: existing + data },
          },
        },
      }
    })
  },

  clearOutput: (projectId: string, terminalId: string) => {
    set((s) => {
      const proj = s.projects[projectId]
      if (!proj) return s
      return {
        projects: {
          ...s.projects,
          [projectId]: {
            ...proj,
            outputs: { ...proj.outputs, [terminalId]: '' },
          },
        },
      }
    })
  },

  setOutput: (projectId: string, terminalId: string, data: string) => {
    set((s) => {
      const proj = s.projects[projectId] || { ...DEFAULT_STATE, outputs: {} }
      return {
        projects: {
          ...s.projects,
          [projectId]: {
            ...proj,
            outputs: { ...proj.outputs, [terminalId]: data },
          },
        },
      }
    })
  },

  addToHistory: (projectId: string, command: string) => {
    if (!command.trim()) return
    set((s) => {
      const proj = s.projects[projectId] || { ...DEFAULT_STATE, outputs: {} }
      return {
        projects: {
          ...s.projects,
          [projectId]: {
            ...proj,
            commandHistory: [...proj.commandHistory, command.trim()],
          },
        },
      }
    })
  },
}))
