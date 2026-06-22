import { useState, useEffect, useCallback } from 'react'
import { useFocusEffect, router } from 'expo-router'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, RefreshControl, Modal, KeyboardAvoidingView, Platform, Linking
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { api } from '@/lib/api'
import {
  GitBranch, GitCommit, GitPullRequest, Plus, Minus, Check,
  ChevronDown, ChevronRight, RefreshCw, Upload, Download,
  FileCode, FilePlus, Trash, AlertCircle, Circle as CircleIcon,
  Settings
} from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { recordAppCommit } from '@/lib/appAudit'

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

const STATUS_ICONS: Record<string, { icon: any; color: string }> = {
  modified: { icon: FileCode, color: '#F0883E' },
  added: { icon: FilePlus, color: '#3FB950' },
  deleted: { icon: Trash, color: '#F85149' },
}

export default function GitTab({ projectId, isActive }: Props) {
  const { colors, isDark } = useAppTheme()
  const [status, setStatus] = useState<GitStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [committing, setCommitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncAction, setSyncAction] = useState<'push' | 'pull' | null>(null)
  const [conflicts, setConflicts] = useState<string[]>([])
  const [expandedSections, setExpandedSections] = useState({
    staged: true,
    changes: true,
    untracked: true,
    conflicts: true,
  })
  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
  }>({ visible: false, title: '', message: '', type: 'info' })

  const showAlert = useCallback((
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    onConfirm?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm, confirmText, cancelText })
  }, [])
  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }))
  }, [])

  // Git configurations and SSH state keys
  const [gitName, setGitName] = useState('')
  const [gitEmail, setGitEmail] = useState('')
  const [hasSshKey, setHasSshKey] = useState(false)
  const [sshPublicKey, setSshPublicKey] = useState<string | null>(null)
  const [sshHistory, setSshHistory] = useState<{ timestamp: string, publicKey: string }[]>([])

  // Git commit history logs
  const [commitHistory, setCommitHistory] = useState<{ hash: string, message: string }[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Track which files are currently being staged/unstaged to show inline indicators
  const [stagingFiles, setStagingFiles] = useState<Record<string, boolean>>({})

  const fetchHistory = useCallback(async (silent = false) => {
    if (!silent) setLoadingHistory(true)
    try {
      const res = await api.git.log(projectId, 12)
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

      // Auto-configure from cached credentials if not set inside container
      if (!name || !email) {
        const cachedName = await AsyncStorage.getItem('git_author_name')
        const cachedEmail = await AsyncStorage.getItem('git_author_email')
        if (cachedName && cachedEmail) {
          name = cachedName
          email = cachedEmail
          // Set in container in background
          await api.git.config.set(projectId, cachedName, cachedEmail)
        }
      }

      setGitName(name)
      setGitEmail(email)
      
      const ssh = await api.git.ssh.get(projectId)
      setHasSshKey(ssh.hasKey)
      setSshPublicKey(ssh.publicKey)
      setSshHistory(ssh.history || [])
    } catch (err) {
      console.warn('Failed to load git configs:', err)
    }
  }, [projectId])

  useEffect(() => {
    loadGitConfig()
  }, [loadGitConfig])

  // Save credentials and SSH key are now managed globally in Settings screen

  const [branches, setBranches] = useState<string[]>([])
  const [showBranches, setShowBranches] = useState(false)
  const [diffText, setDiffText] = useState<string | null>(null)
  const [diffFile, setDiffFile] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await api.git.status(projectId)
      setStatus(data)
      
      // Fetch conflicts
      try {
        const conflictData = await api.git.conflicts(projectId)
        setConflicts(conflictData.conflicts || [])
      } catch (confErr) {
        console.warn('Failed to fetch git conflicts:', confErr)
      }

      // Fetch history alongside status
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
      loadGitConfig()
    }
  }, [isActive, fetchStatus, loadGitConfig])

  useFocusEffect(
    useCallback(() => {
      if (isActive) {
        fetchStatus(true)
        loadGitConfig()
      }
    }, [isActive, fetchStatus, loadGitConfig])
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
          hideAlert()
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
      
      // Track commit audit log locally in the app
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
          hideAlert()
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
          hideAlert()
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
      showAlert(action === 'push' ? 'Pushed' : 'Pulled', result.output || 'Success', 'success')
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
      showAlert('Error', (err as Error).message, 'error')
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
      setShowBranches(true)
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
      showAlert('Success', `Conflict in ${file} resolved successfully.`, 'success')
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
        <ActivityIndicator color={colors.textSecondary} size="small" />
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
          Run "git init" in the terminal to initialize a repo.
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
      {/* Branch bar */}
      <View style={[styles.branchBar, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.branchSelector} onPress={handleLoadBranches}>
          <GitBranch size={14} color={isDark ? '#58A6FF' : '#0969da'} />
          <Text style={[styles.branchName, { color: isDark ? '#58A6FF' : '#0969da' }]}>
            {status?.branch || 'main'}
          </Text>
          <ChevronDown size={12} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.syncButtons}>
          {(status?.ahead || 0) > 0 && (
            <View style={[styles.syncBadge, { backgroundColor: isDark ? '#1C2128' : '#dbeafe' }]}>
              <Text style={[styles.syncBadgeText, { color: isDark ? '#58A6FF' : '#2563eb' }]}>↑{status?.ahead}</Text>
            </View>
          )}
          {(status?.behind || 0) > 0 && (
            <View style={[styles.syncBadge, { backgroundColor: isDark ? '#3D1117' : '#fee2e2' }]}>
              <Text style={[styles.syncBadgeText, { color: isDark ? '#F85149' : '#dc2626' }]}>↓{status?.behind}</Text>
            </View>
          )}
          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA' }]} onPress={() => handleSync('pull')} disabled={syncing}>
            {syncAction === 'pull' ? <ActivityIndicator size="small" color={colors.textSecondary} /> : <Download size={14} color={colors.textSecondary} strokeWidth={1.8} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA' }]} onPress={() => handleSync('push')} disabled={syncing}>
            {syncAction === 'push' ? <ActivityIndicator size="small" color={colors.textSecondary} /> : <Upload size={14} color={colors.textSecondary} strokeWidth={1.8} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA' }]} onPress={() => fetchStatus(true)}>
            <RefreshCw size={14} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
          {/* Settings button is removed as configuration is global in Dashboard settings */}
        </View>
      </View>

      {/* Branch dropdown */}
      {showBranches && (
        <View style={[styles.branchDropdown, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}>
          {branches.map(b => (
            <TouchableOpacity key={b} style={styles.branchItem} onPress={() => handleCheckout(b)}>
              {b === status?.branch ? <Check size={14} color="#3FB950" /> : <View style={{ width: 14 }} />}
              <Text style={[styles.branchItemText, { color: colors.text }]}>{b}</Text>
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
            <Check size={40} color={'#3FB950'} strokeWidth={1.5} />
            <Text style={[styles.noChangesTitle, { color: colors.text }]}>Working tree clean</Text>
            <Text style={[styles.noChangesSubtitle, { color: colors.textSecondary }]}>No pending changes</Text>
          </View>
        ) : (
          <>
            {/* Conflicts Section */}
            {conflicts.length > 0 && (
              <View style={[styles.conflictContainer, { borderColor: '#F85149', borderWidth: 1, borderRadius: 8, margin: 16, backgroundColor: isDark ? 'rgba(248, 81, 73, 0.05)' : 'rgba(248, 81, 73, 0.03)', overflow: 'hidden' }]}>
                <TouchableOpacity style={[styles.sectionHeader, { borderBottomColor: colors.border }]} onPress={() => toggleSection('conflicts')}>
                  {expandedSections.conflicts ? <ChevronDown size={14} color="#F85149" /> : <ChevronRight size={14} color="#F85149" />}
                  <Text style={[styles.sectionTitle, { color: '#F85149' }]}>Conflicts</Text>
                  <View style={[styles.countBadge, { backgroundColor: '#F85149' }]}>
                    <Text style={styles.countText}>{conflicts.length}</Text>
                  </View>
                </TouchableOpacity>
                {expandedSections.conflicts && conflicts.map(file => (
                  <View key={file} style={[styles.conflictRow, { borderBottomColor: colors.border, padding: 12, borderBottomWidth: 1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <AlertCircle size={14} color="#F85149" />
                      <Text style={[styles.filePath, { color: colors.text, flex: 1 }]} numberOfLines={1}>{file}</Text>
                      {resolvingFiles[file] && <ActivityIndicator size="small" color="#F85149" />}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={[styles.strategyBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: colors.border, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }]}
                        onPress={() => handleResolve(file, 'ours')}
                        disabled={resolvingFiles[file]}
                      >
                        <Text style={[styles.strategyBtnText, { color: colors.text, fontSize: 11, fontFamily: 'Inter_600SemiBold' }]}>Keep Mine</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.strategyBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: colors.border, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }]}
                        onPress={() => handleResolve(file, 'theirs')}
                        disabled={resolvingFiles[file]}
                      >
                        <Text style={[styles.strategyBtnText, { color: colors.text, fontSize: 11, fontFamily: 'Inter_600SemiBold' }]}>Keep Theirs</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.strategyBtn, { backgroundColor: colors.text, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }]}
                        onPress={() => handleOpenInEditor(file)}
                        disabled={resolvingFiles[file]}
                      >
                        <Text style={[styles.strategyBtnText, { color: colors.background, fontSize: 11, fontFamily: 'Inter_600SemiBold' }]}>Open Editor</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Staged Section */}
            {status!.staged.length > 0 && (
              <View>
                <TouchableOpacity style={[styles.sectionHeader, { borderBottomColor: colors.border }]} onPress={() => toggleSection('staged')}>
                  {expandedSections.staged ? <ChevronDown size={14} color={colors.textSecondary} /> : <ChevronRight size={14} color={colors.textSecondary} />}
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Staged Changes</Text>
                  <View style={[styles.countBadge, { backgroundColor: '#3FB950' }]}>
                    <Text style={styles.countText}>{status!.staged.length}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleUnstage(status!.staged.map(f => f.path))} style={styles.sectionAction}>
                    <Minus size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
                {expandedSections.staged && status!.staged.map(f => {
                  const info = STATUS_ICONS[f.status] || STATUS_ICONS.modified
                  const Icon = info.icon
                  return (
                    <TouchableOpacity key={f.path} style={[styles.fileRow, { borderBottomColor: colors.border }]} onPress={() => handleViewDiff(f.path)}>
                      <Icon size={14} color={info.color} />
                      <Text style={[styles.filePath, { color: colors.text }]} numberOfLines={1}>{f.path}</Text>
                      {stagingFiles[f.path] ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <TouchableOpacity onPress={() => handleUnstage([f.path])} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Minus size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {/* Unstaged Section */}
            {status!.unstaged.length > 0 && (
              <View>
                <TouchableOpacity style={[styles.sectionHeader, { borderBottomColor: colors.border }]} onPress={() => toggleSection('changes')}>
                  {expandedSections.changes ? <ChevronDown size={14} color={colors.textSecondary} /> : <ChevronRight size={14} color={colors.textSecondary} />}
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Changes</Text>
                  <View style={[styles.countBadge, { backgroundColor: '#F0883E' }]}>
                    <Text style={styles.countText}>{status!.unstaged.length}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleStage(status!.unstaged.map(f => f.path))} style={styles.sectionAction}>
                    <Plus size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
                {expandedSections.changes && status!.unstaged.map(f => {
                  const info = STATUS_ICONS[f.status] || STATUS_ICONS.modified
                  const Icon = info.icon
                  return (
                    <TouchableOpacity key={f.path} style={[styles.fileRow, { borderBottomColor: colors.border }]} onPress={() => handleViewDiff(f.path)}>
                      <Icon size={14} color={info.color} />
                      <Text style={[styles.filePath, { color: colors.text }]} numberOfLines={1}>{f.path}</Text>
                      {stagingFiles[f.path] ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <TouchableOpacity onPress={() => handleStage([f.path])} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Plus size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {/* Untracked Section */}
            {status!.untracked.length > 0 && (
              <View>
                <TouchableOpacity style={[styles.sectionHeader, { borderBottomColor: colors.border }]} onPress={() => toggleSection('untracked')}>
                  {expandedSections.untracked ? <ChevronDown size={14} color={colors.textSecondary} /> : <ChevronRight size={14} color={colors.textSecondary} />}
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Untracked</Text>
                  <View style={[styles.countBadge, { backgroundColor: '#8B949E' }]}>
                    <Text style={styles.countText}>{status!.untracked.length}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleStage(status!.untracked)} style={styles.sectionAction}>
                    <Plus size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
                {expandedSections.untracked && status!.untracked.map(f => (
                  <TouchableOpacity key={f} style={[styles.fileRow, { borderBottomColor: colors.border }]} onPress={() => handleStage([f])}>
                    <CircleIcon size={14} color="#8B949E" />
                    <Text style={[styles.filePath, { color: colors.text }]} numberOfLines={1}>{f}</Text>
                    {stagingFiles[f] ? (
                      <ActivityIndicator size="small" color={colors.textSecondary} />
                    ) : (
                      <Plus size={14} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Diff viewer */}
        {diffFile && diffText && (
          <View style={[styles.diffContainer, { backgroundColor: isDark ? '#0E1116' : '#F6F8FA', borderColor: colors.border }]}>
            <View style={[styles.diffHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.diffTitle, { color: colors.text }]}>{diffFile}</Text>
              <TouchableOpacity onPress={() => { setDiffFile(null); setDiffText(null) }}>
                <Text style={[styles.diffClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={[styles.diffContent, { color: isDark ? '#c9d1d9' : '#1f2328' }]}>
                {diffText.split('\n').map((line, i) => {
                  let lineColor = isDark ? '#c9d1d9' : '#1f2328'
                  if (line.startsWith('+') && !line.startsWith('+++')) lineColor = '#3fb950'
                  else if (line.startsWith('-') && !line.startsWith('---')) lineColor = '#f85149'
                  else if (line.startsWith('@@')) lineColor = '#79c0ff'
                  return (
                    <Text key={i} style={{ color: lineColor }}>{line + '\n'}</Text>
                  )
                })}
              </Text>
            </ScrollView>
          </View>
        )}

        {/* Commit box */}
        {(status?.staged.length || 0) > 0 && (
          <View style={[styles.commitBox, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}>
            <TextInput
              value={commitMessage}
              onChangeText={setCommitMessage}
              placeholder="Commit message..."
              placeholderTextColor={colors.textSecondary + '60'}
              style={[styles.commitInput, { color: colors.text, borderColor: colors.border }]}
              multiline
            />
            <TouchableOpacity
              style={[styles.commitBtn, {
                backgroundColor: commitMessage.trim() ? '#3FB950' : (isDark ? '#1C2128' : '#EAEEF2'),
              }]}
              onPress={handleCommit}
              disabled={!commitMessage.trim() || committing}
            >
              {committing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <GitCommit size={16} color={commitMessage.trim() ? '#fff' : colors.textSecondary} />
                  <Text style={[styles.commitBtnText, {
                    color: commitMessage.trim() ? '#fff' : colors.textSecondary
                  }]}>Commit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Commit History Section */}
        <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitleHeader, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            Commit History
          </Text>
          
          {loadingHistory ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} size="small" />
          ) : commitHistory.length === 0 ? (
            <Text style={[styles.historyEmpty, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              No commits recorded yet.
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
                    <Text style={[styles.commitHash, { color: colors.primary, fontFamily: 'JetBrainsMono_400Regular' }]}>
                      {commit.hash.substring(0, 7)}
                    </Text>
                    <Text style={[styles.commitMsg, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={2}>
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

      {/* Git credentials and SSH key config modal has been moved to global settings page */}

      {/* Custom Alert Modal */}
      <Modal visible={alertConfig.visible} transparent animationType="none" onRequestClose={hideAlert}>
        <View style={styles.alertOverlay}>
          <View style={[styles.alertContent, { backgroundColor: isDark ? '#1C2128' : '#FFFFFF', borderColor: colors.border }]}>
            <View style={styles.alertIconContainer}>
              {alertConfig.type === 'success' && <View style={[styles.alertIconCircle, { backgroundColor: 'rgba(63, 185, 80, 0.15)' }]}><Check size={24} color="#3FB950" strokeWidth={2.5} /></View>}
              {alertConfig.type === 'error' && <View style={[styles.alertIconCircle, { backgroundColor: 'rgba(248, 81, 73, 0.15)' }]}><AlertCircle size={24} color="#F85149" strokeWidth={2.5} /></View>}
              {alertConfig.type === 'info' && <View style={[styles.alertIconCircle, { backgroundColor: 'rgba(88, 166, 255, 0.15)' }]}><AlertCircle size={24} color="#58A6FF" strokeWidth={2.5} /></View>}
              {alertConfig.type === 'warning' && <View style={[styles.alertIconCircle, { backgroundColor: 'rgba(210, 153, 34, 0.15)' }]}><AlertCircle size={24} color="#D29922" strokeWidth={2.5} /></View>}
            </View>
            <Text style={[styles.alertTitle, { color: colors.text }]}>{alertConfig.title}</Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>{alertConfig.message}</Text>
            
            {alertConfig.onConfirm ? (
              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <TouchableOpacity onPress={hideAlert} style={[styles.alertBtn, { flex: 1, backgroundColor: isDark ? '#21262D' : '#F6F8FA', borderWidth: 1, borderColor: colors.border }]} activeOpacity={0.8}>
                  <Text style={[styles.alertBtnText, { color: colors.text }]}>{alertConfig.cancelText || 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={alertConfig.onConfirm} style={[styles.alertBtn, { flex: 1, backgroundColor: colors.text }]} activeOpacity={0.8}>
                  <Text style={[styles.alertBtnText, { color: colors.background }]}>{alertConfig.confirmText || 'Confirm'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={hideAlert} style={[styles.alertBtn, { backgroundColor: colors.text }]} activeOpacity={0.8}>
                <Text style={[styles.alertBtnText, { color: colors.background }]}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  errorTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 8 },
  errorSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, marginTop: 12 },
  retryText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  branchBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  branchSelector: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  branchName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  syncButtons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  syncBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  syncBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  syncBtn: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  branchDropdown: {
    marginHorizontal: 16, borderRadius: 8, borderWidth: 1,
    overflow: 'hidden', marginTop: 4,
  },
  branchItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  branchItemText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  noChanges: { alignItems: 'center', paddingTop: 60, gap: 8 },
  noChangesTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  noChangesSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5,
  },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, textTransform: 'uppercase', flex: 1 },
  countBadge: {
    paddingHorizontal: 7, paddingVertical: 1, borderRadius: 8,
  },
  countText: { fontSize: 10, color: '#fff', fontFamily: 'Inter_700Bold' },
  sectionAction: { padding: 4 },
  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 0.5,
  },
  filePath: { flex: 1, fontSize: 13, fontFamily: 'JetBrainsMono_400Regular' },
  diffContainer: {
    margin: 16, borderRadius: 8, borderWidth: 1, overflow: 'hidden',
  },
  diffHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1,
  },
  diffTitle: { fontSize: 12, fontFamily: 'JetBrainsMono_400Regular' },
  diffClose: { fontSize: 16, padding: 4 },
  diffContent: { fontSize: 12, fontFamily: 'JetBrainsMono_400Regular', padding: 12, lineHeight: 18 },
  commitBox: {
    margin: 16, padding: 12, borderRadius: 8, borderWidth: 1, gap: 8,
  },
  commitInput: {
    fontSize: 14, fontFamily: 'Inter_400Regular',
    borderWidth: 1, borderRadius: 6, padding: 10,
    minHeight: 60, textAlignVertical: 'top',
  },
  commitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, borderRadius: 6,
  },
  commitBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  // Modal Configurations Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '80%',
    maxWidth: 380,
  },
  modalContent: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    padding: 4,
  },
  section: {
    gap: 10,
    marginBottom: 10,
  },
  inputField: {
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  primaryBtn: {
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 16,
    opacity: 0.8,
  },
  sshInfoBox: {
    gap: 10,
  },
  sshInfoText: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono_400Regular',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 10,
    borderRadius: 8,
  },
  sshActionRow: {
    flexDirection: 'row',
  },
  sshHelpText: {
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.8,
  },
  sshEmptyBox: {
    gap: 10,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 11.5,
  },
  // styles for Commit History Timeline
  sectionDivider: {
    height: 1,
    marginVertical: 24,
    opacity: 0.2,
  },
  historySection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitleHeader: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  historyEmpty: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.6,
  },
  historyTimeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    marginVertical: 4,
    opacity: 0.2,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 12,
    gap: 2,
  },
  commitHash: {
    fontSize: 10,
    letterSpacing: 0.2,
    opacity: 0.8,
  },
  commitMsg: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  alertContent: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  alertIconContainer: {
    marginBottom: 12,
  },
  alertIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    opacity: 0.9,
  },
  alertBtn: {
    width: '100%',
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  conflictContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
  },
  conflictRow: {
    padding: 12,
    borderBottomWidth: 1,
  },
  strategyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strategyBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
})
