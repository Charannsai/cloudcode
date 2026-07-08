import { useState, useEffect, useCallback, useRef } from 'react'
import { useFocusEffect, router } from 'expo-router'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Platform
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { api } from '@/lib/api'
import {
  GitBranch, GitCommit, Plus, Minus, Check,
  ChevronDown, ChevronRight, RefreshCw, Upload, Download,
  FileCode, FilePlus, Trash, AlertCircle, Circle as CircleIcon,
  FileText, X, ArrowLeft
} from 'lucide-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { recordAppCommit } from '@/lib/appAudit'
import { ConfirmModal } from '@/components/ConfirmModal'
import PRsTab from './PRsTab'

interface Props {
  projectId: string
  isActive?: boolean
}

interface GitFileChange {
  path: string
  status: string
}

interface GitStatusData {
  staged: GitFileChange[]
  unstaged: GitFileChange[]
  untracked: string[]
  branch: string
  ahead: number
  behind: number
}

export default function GitTab({ projectId, isActive }: Props) {
  const { colors, isDark } = useAppTheme()
  const [status, setStatus] = useState<GitStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [committing, setCommitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [gitSubTab, setGitSubTab] = useState<'changes' | 'prs'>('changes')
  const [syncAction, setSyncAction] = useState<'push' | 'pull' | null>(null)
  const [conflicts, setConflicts] = useState<string[]>([])
  const [expandedSections, setExpandedSections] = useState({
    staged: true,
    changes: true,
    untracked: true,
    conflicts: true,
  })

  // ConfirmModal State
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info' | 'logout' | 'success' | 'error'
    singleButton?: boolean
    onConfirm: () => void
    onCancel?: () => void
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    onConfirm?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    setModalConfig({
      visible: true,
      title,
      message,
      confirmText: confirmText || 'OK',
      cancelText: cancelText || 'Cancel',
      type: type === 'error' ? 'danger' : type,
      singleButton: !onConfirm,
      onConfirm: onConfirm || (() => setModalConfig(prev => ({ ...prev, visible: false }))),
      onCancel: onConfirm ? (() => setModalConfig(prev => ({ ...prev, visible: false }))) : undefined
    })
  }

  // Git configurations and SSH state keys
  const [gitName, setGitName] = useState('')
  const [gitEmail, setGitEmail] = useState('')
  const [hasSshKey, setHasSshKey] = useState(false)
  const [sshPublicKey, setSshPublicKey] = useState<string | null>(null)

  // Git commit history logs
  const [commitHistory, setCommitHistory] = useState<{ hash: string, message: string }[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Track which files are currently being staged/unstaged to show inline indicators
  const [stagingFiles, setStagingFiles] = useState<Record<string, boolean>>({})

  const fetchHistory = useCallback(async (silent = false) => {
    if (!silent) setLoadingHistory(true)
    try {
      const res = await api.git.log(projectId, 10)
      if (res.log) {
        const parsed = res.log
          .split('\n')
          .filter(Boolean)
          .map(line => {
            const spaceIndex = line.indexOf(' ')
            if (spaceIndex === -1) return { hash: line, message: '' }
            return {
              hash: line.substring(0, spaceIndex),
              message: line.substring(spaceIndex + 1).trim()
            }
          })
        setCommitHistory(parsed)
      } else {
        setCommitHistory([])
      }
    } catch (err) {
      console.warn('Failed to load git history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }, [projectId])

  const loadGitConfig = useCallback(async () => {
    try {
      const config = await api.git.config.get(projectId)
      let name = config.name || ''
      let email = config.email || ''

      if (!name || !email) {
        const cachedName = await AsyncStorage.getItem('git_author_name')
        const cachedEmail = await AsyncStorage.getItem('git_author_email')
        if (cachedName && cachedEmail) {
          name = cachedName
          email = cachedEmail
          await api.git.config.set(projectId, cachedName, cachedEmail)
        }
      }

      setGitName(name)
      setGitEmail(email)
      
      const ssh = await api.git.ssh.get(projectId)
      setHasSshKey(ssh.hasKey)
      setSshPublicKey(ssh.publicKey)
    } catch (err) {
      console.warn('Failed to load git configs:', err)
    }
  }, [projectId])

  useEffect(() => {
    loadGitConfig()
  }, [loadGitConfig])

  const [branches, setBranches] = useState<string[]>([])
  const [showBranches, setShowBranches] = useState(false)
  const [diffText, setDiffText] = useState<string | null>(null)
  const [diffFile, setDiffFile] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const [data, conflictData] = await Promise.all([
        api.git.status(projectId),
        api.git.conflicts(projectId).catch(err => {
          console.warn('Failed to fetch git conflicts:', err)
          return { conflicts: [] }
        })
      ])
      
      setStatus(data)
      setConflicts(conflictData.conflicts || [])
      
      // Fetch history in background
      fetchHistory(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [projectId, fetchHistory])

  useEffect(() => {
    if (isActive) {
      fetchStatus(true)
    }
  }, [isActive, fetchStatus])

  useFocusEffect(
    useCallback(() => {
      if (isActive) {
        fetchStatus(true)
      }
    }, [isActive, fetchStatus])
  )

  const handleStage = async (files: string[]) => {
    const nextStaging = { ...stagingFiles }
    files.forEach(f => { nextStaging[f] = true })
    setStagingFiles(nextStaging)

    try {
      await api.git.stage(projectId, files)
      fetchStatus(true)
    } catch (err) {
      showAlert('Error', (err as Error).message, 'error')
    } finally {
      setStagingFiles(prev => {
        const updated = { ...prev }
        files.forEach(f => { delete updated[f] })
        return updated
      })
    }
  }

  const handleUnstage = async (files: string[]) => {
    const nextStaging = { ...stagingFiles }
    files.forEach(f => { nextStaging[f] = true })
    setStagingFiles(nextStaging)

    try {
      await api.git.unstage(projectId, files)
      fetchStatus(true)
    } catch (err) {
      showAlert('Error', (err as Error).message, 'error')
    } finally {
      setStagingFiles(prev => {
        const updated = { ...prev }
        files.forEach(f => { delete updated[f] })
        return updated
      })
    }
  }

  const handleCommit = async () => {
    if (!gitName.trim() || !gitEmail.trim()) {
      showAlert(
        'Git Author Required',
        'Please configure your Git Author Name and Email in Settings to attribute your commits correctly.',
        'warning',
        () => {
          setModalConfig(prev => ({ ...prev, visible: false }))
          router.navigate('/(tabs)/settings')
        },
        'Go to Settings',
        'Cancel'
      )
      return
    }
    if (!commitMessage.trim()) return
    setCommitting(true)
    try {
      await api.git.commit(projectId, commitMessage.trim())
      
      try {
        let projectName = 'Workspace'
        try {
          const proj = await api.projects.get(projectId)
          if (proj && proj.name) projectName = proj.name
        } catch (_) {}
        const shortHash = Math.random().toString(16).substring(2, 9)
        const branchName = status?.branch || 'main'
        await recordAppCommit(projectId, projectName, branchName, commitMessage.trim(), shortHash)
      } catch (auditErr) {
        console.warn('Failed to audit log app commit:', auditErr)
      }

      setCommitMessage('')
      fetchStatus(true)
    } catch (err) {
      showAlert('Error', (err as Error).message, 'error')
    } finally {
      setCommitting(false)
    }
  }

  const handleSync = async (action: 'push' | 'pull') => {
    if (!hasSshKey) {
      showAlert(
        'SSH Key Required',
        'You need to generate an SSH key in Settings and add it to your GitHub account to sync changes securely.',
        'warning',
        () => {
          setModalConfig(prev => ({ ...prev, visible: false }))
          router.navigate('/(tabs)/settings')
        },
        'Go to Settings',
        'Cancel'
      )
      return
    }

    if (action === 'push' && status && status.behind > 0) {
      showAlert(
        'Out of Sync',
        `Your local branch is behind the remote repository by ${status.behind} commit(s). Please pull changes from the remote first to merge before pushing.`,
        'warning',
        () => {
          setModalConfig(prev => ({ ...prev, visible: false }))
          handleSync('pull')
        },
        'Pull Now',
        'Cancel'
      )
      return
    }

    setSyncing(true)
    setSyncAction(action)
    try {
      const result = await api.git.sync(projectId, action)
      showAlert(action === 'push' ? 'Pushed Successfully' : 'Pulled Successfully', result.output || 'No output received.', 'success')
      fetchStatus(true)
    } catch (err) {
      if (action === 'pull') {
        try {
          const conflictData = await api.git.conflicts(projectId)
          if (conflictData.conflicts && conflictData.conflicts.length > 0) {
            setConflicts(conflictData.conflicts)
            showAlert(
              'Merge Conflicts',
              'Merge conflicts detected. Please resolve them using the strategy options under the Conflicts section below.',
              'warning'
            )
            fetchStatus(true)
            return
          }
        } catch (confErr) {
          console.warn('Failed to inspect merge conflicts:', confErr)
        }
      }
      showAlert('Sync Failed', (err as Error).message, 'error')
    } finally {
      setSyncing(false)
      setSyncAction(null)
    }
  }

  const handleViewDiff = async (file: string) => {
    if (diffFile === file) {
      setDiffFile(null)
      setDiffText(null)
      return
    }
    try {
      const result = await api.git.diff(projectId, file)
      setDiffText(result.diff || '(no diff)')
      setDiffFile(file)
    } catch (err) {
      showAlert('Error', (err as Error).message, 'error')
    }
  }

  const handleLoadBranches = async () => {
    try {
      const result = await api.git.branches(projectId)
      setBranches(result.branches)
      setShowBranches(prev => !prev)
    } catch (err) {
      showAlert('Error', (err as Error).message, 'error')
    }
  }

  const handleCheckout = async (branch: string) => {
    try {
      await api.git.checkout(projectId, branch)
      setShowBranches(false)
      fetchStatus(true)
    } catch (err) {
      showAlert('Error', (err as Error).message, 'error')
    }
  }

  const [resolvingFiles, setResolvingFiles] = useState<Record<string, boolean>>({})

  const handleResolve = async (file: string, strategy: 'ours' | 'theirs') => {
    setResolvingFiles(prev => ({ ...prev, [file]: true }))
    try {
      await api.git.resolve(projectId, file, strategy)
      showAlert('Conflict Resolved', `Conflict in ${file} resolved successfully.`, 'success')
      fetchStatus(true)
    } catch (err) {
      showAlert('Error', (err as Error).message, 'error')
    } finally {
      setResolvingFiles(prev => {
        const next = { ...prev }
        delete next[file]
        return next
      })
    }
  }

  const handleOpenInEditor = (file: string) => {
    router.navigate({
      pathname: `/project/${projectId}/editor` as any,
      params: { path: file }
    })
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const totalChanges = (status?.staged.length || 0) + (status?.unstaged.length || 0) + (status?.untracked.length || 0) + (conflicts.length || 0)

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading git status...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <AlertCircle size={40} color={colors.textSecondary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Not a Git Repository</Text>
        <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
          Initialize a Git repository to track your project changes.
        </Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.card }]} onPress={() => fetchStatus()}>
          <RefreshCw size={14} color={colors.text} />
          <Text style={[styles.retryText, { color: colors.text }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Tab Selector */}
      <View style={[styles.tabSelectorContainer, { borderBottomColor: colors.border, backgroundColor: isDark ? '#030303' : '#FFFFFF' }]}>
        <TouchableOpacity
          style={[styles.tabSelectorBtn, gitSubTab === 'changes' && { borderBottomColor: colors.text, borderBottomWidth: 2 }]}
          onPress={() => setGitSubTab('changes')}
        >
          <Text style={[styles.tabSelectorText, { color: gitSubTab === 'changes' ? colors.text : colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabSelectorBtn, gitSubTab === 'prs' && { borderBottomColor: colors.text, borderBottomWidth: 2 }]}
          onPress={() => setGitSubTab('prs')}
        >
          <Text style={[styles.tabSelectorText, { color: gitSubTab === 'prs' ? colors.text : colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>Pull Requests</Text>
        </TouchableOpacity>
      </View>

      {gitSubTab === 'prs' ? (
        <PRsTab projectId={projectId} />
      ) : (
        <>
          {/* Branch & Sync Header Panel */}
          <View style={[styles.branchBar, { backgroundColor: isDark ? '#161B22' : '#FFFFFF', borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.branchSelector, { backgroundColor: isDark ? '#1A1C23' : '#F3F4F6' }]} onPress={handleLoadBranches}>
          <GitBranch size={13} color={isDark ? '#58A6FF' : '#0969da'} />
          <Text style={[styles.branchName, { color: isDark ? '#C9D1D9' : '#1F2328' }]}>
            {status?.branch || 'main'}
          </Text>
          <ChevronDown size={11} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.syncButtons}>
          {(status?.ahead || 0) > 0 && (
            <View style={[styles.syncBadge, { backgroundColor: 'rgba(56, 139, 253, 0.15)' }]}>
              <Text style={[styles.syncBadgeText, { color: '#58A6FF' }]}>↑{status?.ahead}</Text>
            </View>
          )}
          {(status?.behind || 0) > 0 && (
            <View style={[styles.syncBadge, { backgroundColor: 'rgba(248, 81, 73, 0.15)' }]}>
              <Text style={[styles.syncBadgeText, { color: '#F85149' }]}>↓{status?.behind}</Text>
            </View>
          )}
          <TouchableOpacity 
            style={[styles.syncBtn, { backgroundColor: isDark ? '#1A1C23' : '#F3F4F6' }]} 
            onPress={() => handleSync('pull')} 
            disabled={syncing}
            activeOpacity={0.7}
          >
            {syncAction === 'pull' ? <ActivityIndicator size="small" color={colors.text} /> : <Download size={14} color={colors.text} strokeWidth={2.2} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.syncBtn, { backgroundColor: isDark ? '#1A1C23' : '#F3F4F6' }]} 
            onPress={() => handleSync('push')} 
            disabled={syncing}
            activeOpacity={0.7}
          >
            {syncAction === 'push' ? <ActivityIndicator size="small" color={colors.text} /> : <Upload size={14} color={colors.text} strokeWidth={2.2} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.syncBtn, { backgroundColor: isDark ? '#1A1C23' : '#F3F4F6' }]} 
            onPress={() => fetchStatus(true)}
            activeOpacity={0.7}
          >
            <RefreshCw size={13} color={colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Branch Dropdown Panel */}
      {showBranches && (
        <View style={[styles.branchDropdown, { backgroundColor: isDark ? 'rgba(22, 27, 34, 0.95)' : 'rgba(255, 255, 255, 0.98)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          {branches.map(b => (
            <TouchableOpacity 
              key={b} 
              style={[
                styles.branchItem, 
                b === status?.branch && { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }
              ]} 
              onPress={() => handleCheckout(b)}
            >
              <View style={{ width: 14, alignItems: 'center' }}>
                {b === status?.branch && <Check size={13} color="#3FB950" strokeWidth={2.5} />}
              </View>
              <Text style={[styles.branchItemText, { color: colors.text, fontFamily: b === status?.branch ? 'Inter_600SemiBold' : 'Inter_500Medium' }]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStatus(true) }} tintColor={colors.text} />
        }
      >
        {totalChanges === 0 ? (
          <View style={styles.noChanges}>
            <View style={[styles.cleanIconCircle, { backgroundColor: isDark ? 'rgba(63, 185, 80, 0.12)' : 'rgba(63, 185, 80, 0.08)' }]}>
              <Check size={28} color={'#3FB950'} strokeWidth={2.5} />
            </View>
            <Text style={[styles.noChangesTitle, { color: colors.text }]}>Working tree clean</Text>
            <Text style={[styles.noChangesSubtitle, { color: colors.textSecondary }]}>All project files are up to date</Text>
          </View>
        ) : (
          <View style={{ paddingVertical: 16 }}>
            
            {/* Summary Banner */}
            <View style={[styles.summaryBanner, { backgroundColor: isDark ? '#161821' : '#F3F4F6', borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
                {totalChanges} pending {totalChanges === 1 ? 'change' : 'changes'} in workspace
              </Text>
            </View>

            {/* Conflicts Section */}
            {conflicts.length > 0 && (
              <View style={[styles.sectionContainer, { borderColor: '#F85149', backgroundColor: isDark ? 'rgba(248, 81, 73, 0.04)' : 'rgba(248, 81, 73, 0.02)' }]}>
                <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('conflicts')}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    {expandedSections.conflicts ? <ChevronDown size={14} color="#F85149" /> : <ChevronRight size={14} color="#F85149" />}
                    <Text style={[styles.sectionTitle, { color: '#F85149' }]}>Conflicts</Text>
                    <View style={[styles.countBadge, { backgroundColor: '#F85149' }]}>
                      <Text style={styles.countText}>{conflicts.length}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                {expandedSections.conflicts && conflicts.map(file => (
                  <View key={file} style={[styles.conflictRow, { borderTopColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <AlertCircle size={13} color="#F85149" />
                      <Text style={[styles.filePath, { color: colors.text }]} numberOfLines={1}>{file}</Text>
                      {resolvingFiles[file] && <ActivityIndicator size="small" color="#F85149" />}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={[styles.strategyBtn, { backgroundColor: isDark ? '#1A1C23' : '#FFFFFF', borderColor: colors.border, borderWidth: 1 }]}
                        onPress={() => handleResolve(file, 'ours')}
                        disabled={resolvingFiles[file]}
                      >
                        <Text style={[styles.strategyBtnText, { color: colors.text }]}>Keep Mine</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.strategyBtn, { backgroundColor: isDark ? '#1A1C23' : '#FFFFFF', borderColor: colors.border, borderWidth: 1 }]}
                        onPress={() => handleResolve(file, 'theirs')}
                        disabled={resolvingFiles[file]}
                      >
                        <Text style={[styles.strategyBtnText, { color: colors.text }]}>Keep Theirs</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.strategyBtn, { backgroundColor: colors.text }]}
                        onPress={() => handleOpenInEditor(file)}
                        disabled={resolvingFiles[file]}
                      >
                        <Text style={[styles.strategyBtnText, { color: colors.background }]}>Open Editor</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Staged Section */}
            {status!.staged.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('staged')}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    {expandedSections.staged ? <ChevronDown size={14} color={colors.textSecondary} /> : <ChevronRight size={14} color={colors.textSecondary} />}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Staged Changes</Text>
                    <View style={[styles.countBadge, { backgroundColor: '#3FB950' }]}>
                      <Text style={styles.countText}>{status!.staged.length}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleUnstage(status!.staged.map(f => f.path))} style={styles.sectionAction}>
                    <Minus size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
                {expandedSections.staged && status!.staged.map(f => {
                  return (
                    <TouchableOpacity key={f.path} style={[styles.fileRow, { borderTopColor: colors.border }]} onPress={() => handleViewDiff(f.path)}>
                      <View style={[styles.statusBadge, { backgroundColor: 'rgba(63, 185, 80, 0.12)' }]}>
                        <Text style={{ color: '#3FB950', fontSize: 9.5, fontFamily: 'Inter_700Bold' }}>
                          {f.status === 'added' ? 'A' : f.status === 'deleted' ? 'D' : 'M'}
                        </Text>
                      </View>
                      <Text style={[styles.filePath, { color: colors.text }]} numberOfLines={1}>{f.path}</Text>
                      {stagingFiles[f.path] ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <TouchableOpacity onPress={() => handleUnstage([f.path])} style={styles.rowAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Minus size={13} color={colors.textSecondary} strokeWidth={2.5} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {/* Unstaged Section */}
            {status!.unstaged.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('changes')}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    {expandedSections.changes ? <ChevronDown size={14} color={colors.textSecondary} /> : <ChevronRight size={14} color={colors.textSecondary} />}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Changes</Text>
                    <View style={[styles.countBadge, { backgroundColor: '#F0883E' }]}>
                      <Text style={styles.countText}>{status!.unstaged.length}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleStage(status!.unstaged.map(f => f.path))} style={styles.sectionAction}>
                    <Plus size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
                {expandedSections.changes && status!.unstaged.map(f => {
                  return (
                    <TouchableOpacity key={f.path} style={[styles.fileRow, { borderTopColor: colors.border }]} onPress={() => handleViewDiff(f.path)}>
                      <View style={[styles.statusBadge, { backgroundColor: 'rgba(240, 136, 62, 0.12)' }]}>
                        <Text style={{ color: '#F0883E', fontSize: 9.5, fontFamily: 'Inter_700Bold' }}>
                          {f.status === 'deleted' ? 'D' : 'M'}
                        </Text>
                      </View>
                      <Text style={[styles.filePath, { color: colors.text }]} numberOfLines={1}>{f.path}</Text>
                      {stagingFiles[f.path] ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <TouchableOpacity onPress={() => handleStage([f.path])} style={styles.rowAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Plus size={13} color={colors.textSecondary} strokeWidth={2.5} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {/* Untracked Section */}
            {status!.untracked.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('untracked')}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    {expandedSections.untracked ? <ChevronDown size={14} color={colors.textSecondary} /> : <ChevronRight size={14} color={colors.textSecondary} />}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Untracked</Text>
                    <View style={[styles.countBadge, { backgroundColor: '#8B949E' }]}>
                      <Text style={styles.countText}>{status!.untracked.length}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleStage(status!.untracked)} style={styles.sectionAction}>
                    <Plus size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
                {expandedSections.untracked && status!.untracked.map(f => (
                  <TouchableOpacity key={f} style={[styles.fileRow, { borderTopColor: colors.border }]} onPress={() => handleStage([f])}>
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(139, 148, 158, 0.12)' }]}>
                      <Text style={{ color: '#8B949E', fontSize: 9.5, fontFamily: 'Inter_700Bold' }}>U</Text>
                    </View>
                    <Text style={[styles.filePath, { color: colors.text }]} numberOfLines={1}>{f}</Text>
                    {stagingFiles[f] ? (
                      <ActivityIndicator size="small" color={colors.textSecondary} />
                    ) : (
                      <Plus size={13} color={colors.textSecondary} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Diff Viewer Card */}
        {diffFile && diffText && (
          <View style={[styles.diffContainer, { backgroundColor: '#030303', borderColor: '#30363D' }]}>
            <View style={[styles.diffHeader, { borderBottomColor: '#30363D' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FileCode size={13} color="#58A6FF" />
                <Text style={styles.diffTitle} numberOfLines={1}>{diffFile}</Text>
              </View>
              <TouchableOpacity onPress={() => { setDiffFile(null); setDiffText(null) }} style={styles.diffCloseBtn}>
                <X size={14} color="#8B949E" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ padding: 12 }}>
                {diffText.split('\n').map((line, i) => {
                  let lineColor = '#C9D1D9'
                  let bg = 'transparent'
                  if (line.startsWith('+') && !line.startsWith('+++')) {
                    lineColor = '#58A6FF'
                    bg = 'rgba(56, 139, 253, 0.1)'
                  } else if (line.startsWith('-') && !line.startsWith('---')) {
                    lineColor = '#FF7B72'
                    bg = 'rgba(248, 81, 73, 0.1)'
                  } else if (line.startsWith('@@')) {
                    lineColor = '#D2A8FF'
                  }
                  return (
                    <View key={i} style={{ backgroundColor: bg, paddingHorizontal: 4, borderRadius: 2 }}>
                      <Text style={[styles.diffContent, { color: lineColor }]}>{line}</Text>
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Commit Input Box Panel */}
        {(status?.staged.length || 0) > 0 && (
          <View style={[styles.commitBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 4 }}>
              COMMIT CHANGES
            </Text>
            <TextInput
              value={commitMessage}
              onChangeText={setCommitMessage}
              placeholder="Provide a concise commit message..."
              placeholderTextColor={colors.textSecondary + '60'}
              style={[styles.commitInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : '#FFFFFF' }]}
              multiline
            />
            <TouchableOpacity
              style={[styles.commitBtn, {
                backgroundColor: commitMessage.trim() ? '#2EA44F' : (isDark ? '#1A1C23' : '#E9ECEF'),
              }]}
              onPress={handleCommit}
              disabled={!commitMessage.trim() || committing}
              activeOpacity={0.8}
            >
              {committing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <GitCommit size={14} color={commitMessage.trim() ? '#FFFFFF' : colors.textSecondary} />
                  <Text style={[styles.commitBtnText, {
                    color: commitMessage.trim() ? '#FFFFFF' : colors.textSecondary
                  }]}>Commit to {status?.branch || 'main'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Commit History Timeline Section */}
        <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitleHeader, { color: colors.textSecondary }]}>
            Commit History
          </Text>
          
          {loadingHistory ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} size="small" />
          ) : commitHistory.length === 0 ? (
            <Text style={[styles.historyEmpty, { color: colors.textSecondary }]}>
              No commits recorded in this repository.
            </Text>
          ) : (
            <View style={styles.historyTimeline}>
              {commitHistory.map((commit, idx) => (
                <View key={commit.hash} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                    {idx !== commitHistory.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={[styles.commitHash, { color: colors.primary }]}>
                      {commit.hash.substring(0, 7)}
                    </Text>
                    <Text style={[styles.commitMsg, { color: colors.text }]} numberOfLines={2}>
                      {commit.message}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      </>
      )}

      {/* Global reusable ConfirmModal */}
      <ConfirmModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        type={modalConfig.type}
        singleButton={modalConfig.singleButton}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabSelectorContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 44,
  },
  tabSelectorBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelectorText: {
    fontSize: 13,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  errorTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 8 },
  errorSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40, opacity: 0.8 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginTop: 12 },
  retryText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  branchBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  branchSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  branchName: { fontSize: 12.5, fontFamily: 'Inter_600SemiBold' },
  syncButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  syncBadgeText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  syncBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  branchDropdown: {
    marginHorizontal: 16, 
    borderRadius: 16, 
    borderWidth: 1,
    padding: 6,
    marginTop: 6,
    position: 'absolute', top: 50, left: 0, right: 0, zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  branchItem: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10,
    paddingHorizontal: 12, 
    paddingVertical: 10,
    borderRadius: 10,
  },
  branchItemText: { 
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  noChanges: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  cleanIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  noChangesTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  noChangesSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', opacity: 0.8 },
  summaryBanner: {
    marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  sectionContainer: {
    marginHorizontal: 16, marginVertical: 8, borderRadius: 10,
    borderWidth: 1, overflow: 'hidden',
  },
  sectionCard: {
    marginHorizontal: 16, marginVertical: 8, borderRadius: 10,
    borderWidth: 1, overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.3, flex: 1 },
  countBadge: {
    paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 8,
  },
  countText: { fontSize: 9.5, color: '#fff', fontFamily: 'Inter_700Bold' },
  sectionAction: { padding: 4 },
  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: 1,
  },
  statusBadge: {
    width: 18, height: 18, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  filePath: { flex: 1, fontSize: 12.5, fontFamily: 'JetBrainsMono_400Regular' },
  rowAction: { padding: 4 },
  diffContainer: {
    margin: 16, borderRadius: 10, borderWidth: 1, overflow: 'hidden',
  },
  diffHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1,
  },
  diffTitle: { fontSize: 12, fontFamily: 'JetBrainsMono_400Regular', color: '#C9D1D9', flex: 1 },
  diffCloseBtn: { padding: 4 },
  diffContent: { fontSize: 11, fontFamily: 'JetBrainsMono_400Regular', lineHeight: 16 },
  commitBox: {
    margin: 16, padding: 14, borderRadius: 10, borderWidth: 1, gap: 10,
  },
  commitInput: {
    fontSize: 13.5, fontFamily: 'Inter_400Regular',
    borderWidth: 1, borderRadius: 8, padding: 10,
    minHeight: 64, textAlignVertical: 'top',
  },
  commitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 11, borderRadius: 8,
  },
  commitBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  strategyBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  strategyBtnText: { fontSize: 11.5, fontFamily: 'Inter_600SemiBold' },
  conflictRow: {
    padding: 12, borderTopWidth: 1,
  },
  sectionDivider: {
    height: 1, marginVertical: 16, opacity: 0.15,
  },
  historySection: {
    paddingHorizontal: 16,
  },
  sectionTitleHeader: {
    fontSize: 11, fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 14,
  },
  historyEmpty: {
    fontSize: 12.5, fontFamily: 'Inter_400Regular',
    textAlign: 'center', marginTop: 8, opacity: 0.7,
  },
  historyTimeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row', minHeight: 48,
  },
  timelineLeft: {
    alignItems: 'center', width: 20,
  },
  timelineDot: {
    width: 7, height: 7, borderRadius: 3.5,
    marginTop: 6,
  },
  timelineLine: {
    width: 1.5, flex: 1,
    marginVertical: 4, opacity: 0.15,
  },
  timelineRight: {
    flex: 1, paddingLeft: 12,
    paddingBottom: 12, gap: 2,
  },
  commitHash: {
    fontSize: 9.5, fontFamily: 'JetBrainsMono_400Regular',
    letterSpacing: 0.1, opacity: 0.8,
  },
  commitMsg: {
    fontSize: 12.5, fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
})
