import { create } from 'zustand'
import { api } from '@/lib/api'

interface PRState {
  prs: any[]
  activePR: {
    pr: any
    conversation: any[]
    files: any[]
  } | null
  loading: boolean
  error: string | null
  
  fetchPRs: (projectId: string) => Promise<void>
  fetchPRDetail: (projectId: string, number: number) => Promise<void>
  submitReview: (
    projectId: string,
    number: number,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
    body: string
  ) => Promise<void>
  mergePR: (
    projectId: string,
    number: number,
    mergeMethod: 'merge' | 'squash' | 'rebase',
    commitTitle?: string,
    commitMessage?: string
  ) => Promise<void>
  clearActivePR: () => void
}

export const usePRStore = create<PRState>((set, get) => ({
  prs: [],
  activePR: null,
  loading: false,
  error: null,

  fetchPRs: async (projectId: string) => {
    set({ loading: true, error: null })
    try {
      const prs = await api.prs.list(projectId)
      set({ prs, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch PRs', loading: false })
    }
  },

  fetchPRDetail: async (projectId: string, number: number) => {
    set({ loading: true, error: null })
    try {
      const detail = await api.prs.get(projectId, number)
      set({ activePR: detail, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch PR details', loading: false })
    }
  },

  submitReview: async (
    projectId: string,
    number: number,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
    body: string
  ) => {
    set({ loading: true, error: null })
    try {
      await api.prs.review(projectId, number, event, body)
      // Refetch PR details to show the new comment/review immediately
      const detail = await api.prs.get(projectId, number)
      set({ activePR: detail, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to submit review', loading: false })
    }
  },

  mergePR: async (
    projectId: string,
    number: number,
    mergeMethod: 'merge' | 'squash' | 'rebase',
    commitTitle?: string,
    commitMessage?: string
  ) => {
    set({ loading: true, error: null })
    try {
      await api.prs.merge(projectId, number, mergeMethod, commitTitle, commitMessage)
      // Refetch PR details to reflect the merged status
      const detail = await api.prs.get(projectId, number)
      set({ activePR: detail, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to merge PR', loading: false })
    }
  },

  clearActivePR: () => {
    set({ activePR: null })
  },
}))
