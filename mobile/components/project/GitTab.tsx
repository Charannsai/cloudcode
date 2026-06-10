import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, RefreshControl, Modal, KeyboardAvoidingView, Platform,
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
  const [expandedSections, setExpandedSections] = useState({
    staged: true,
    changes: true,
    untracked: true,
  })

  // Git configurations and SSH state keys
  const [gitName, setGitName] = useState('')
  const [gitEmail, setGitEmail] = useState('')
  const [hasSshKey, setHasSshKey] = useState(false)
  const [sshPublicKey, setSshPublicKey] = useState<string | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(false)

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
    } catch (err) {
      console.warn('Failed to load git configs:', err)
    }
  }, [projectId])

  useEffect(() => {
    loadGitConfig()
  }, [loadGitConfig])

  const handleSaveConfig = async () => {
    if (!gitName.trim() || !gitEmail.trim()) {
      Alert.alert('Error', 'Author Name and Email are required.')
      return
    }
    setLoadingConfig(true)
    try {
      await api.git.config.set(projectId, gitName.trim(), gitEmail.trim())
      // Store in device persistent storage
      await AsyncStorage.setItem('git_author_name', gitName.trim())
      await AsyncStorage.setItem('git_author_email', gitEmail.trim())
      Alert.alert('Success', 'Git credentials saved and cached.')
      setShowConfigModal(false)
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
    } finally {
      setLoadingConfig(false)
    }
  }

  const handleGenerateSsh = async () => {
    setLoadingConfig(true)
    try {
      const res = await api.git.ssh.generate(projectId)
      setHasSshKey(res.hasKey)
      setSshPublicKey(res.publicKey)
      Alert.alert('Success', 'SSH Key Pair generated successfully.')
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
    } finally {
      setLoadingConfig(false)
    }
  }

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
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (isActive) {
      fetchStatus(true)
    }
  }, [isActive, fetchStatus])

  const handleStage = async (files: string[]) => {
    const nextStaging = { ...stagingFiles }
    files.forEach(f => { nextStaging[f] = true })
    setStagingFiles(nextStaging)

    try {
      await api.git.stage(projectId, files)
      fetchStatus(true)
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
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
      Alert.alert('Error', (err as Error).message)
    } finally {
      setStagingFiles(prev => {
        const updated = { ...prev }
        files.forEach(f => { delete updated[f] })
        return updated
      })
    }
  }

  const handleCommit = async () => {
    if (!commitMessage.trim()) return
    setCommitting(true)
    try {
      await api.git.commit(projectId, commitMessage.trim())
      setCommitMessage('')
      fetchStatus(true)
    } catch (err) {
      Alert.alert('Commit Failed', (err as Error).message)
    } finally {
      setCommitting(false)
    }
  }

  const handleSync = async (action: 'push' | 'pull') => {
    setSyncing(true)
    setSyncAction(action)
    try {
      const result = await api.git.sync(projectId, action)
      Alert.alert(action === 'push' ? 'Pushed' : 'Pulled', result.output || 'Success')
      fetchStatus(true)
    } catch (err) {
      Alert.alert('Sync Failed', (err as Error).message)
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
      Alert.alert('Error', (err as Error).message)
    }
  }

  const handleLoadBranches = async () => {
    try {
      const result = await api.git.branches(projectId)
      setBranches(result.branches)
      setShowBranches(true)
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
    }
  }

  const handleCheckout = async (branch: string) => {
    try {
      await api.git.checkout(projectId, branch)
      setShowBranches(false)
      fetchStatus(true)
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const totalChanges = (status?.staged.length || 0) + (status?.unstaged.length || 0) + (status?.untracked.length || 0)

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
          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA' }]} onPress={() => setShowConfigModal(true)}>
            <Settings size={14} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
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

      {/* Git Credentials & SSH Modal */}
      <Modal
        visible={showConfigModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <ScrollView style={[styles.modalContent, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                  Git Configuration & SSH
                </Text>
                <TouchableOpacity onPress={() => setShowConfigModal(false)} style={styles.modalCloseBtn}>
                  <Text style={{ color: colors.textSecondary, fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Git Author Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                  Git Author Info
                </Text>
                <TextInput
                  style={[styles.inputField, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Author Name"
                  placeholderTextColor={colors.textSecondary + '60'}
                  value={gitName}
                  onChangeText={setGitName}
                  autoCapitalize="words"
                />
                <TextInput
                  style={[styles.inputField, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Author Email"
                  placeholderTextColor={colors.textSecondary + '60'}
                  value={gitEmail}
                  onChangeText={setGitEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  onPress={handleSaveConfig} 
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                  disabled={loadingConfig}
                >
                  <Text style={[styles.primaryBtnText, { color: isDark ? '#000' : '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                    Save Config
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* SSH Authentication Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                  SSH Deploy Keys
                </Text>
                {hasSshKey && sshPublicKey ? (
                  <View style={styles.sshInfoBox}>
                    <Text style={[styles.sshInfoText, { color: colors.textSecondary }]} numberOfLines={3}>
                      {sshPublicKey}
                    </Text>
                    <View style={styles.sshActionRow}>
                      <TouchableOpacity 
                        onPress={() => {
                          Clipboard.setStringAsync(sshPublicKey)
                          Alert.alert('Copied', 'Public key copied to clipboard.')
                        }}
                        style={[styles.actionBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA' }]}
                      >
                        <Text style={[styles.actionBtnText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Copy Public Key</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.sshHelpText, { color: colors.textSecondary }]}>
                      Add this public key to your GitHub developer settings (Deploy keys) to push/pull securely over SSH.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.sshEmptyBox}>
                    <Text style={[styles.sshHelpText, { color: colors.textSecondary, marginBottom: 8 }]}>
                      Generate an SSH key pair inside your isolated workspace to push commits without typing credentials.
                    </Text>
                    <TouchableOpacity 
                      onPress={handleGenerateSsh} 
                      style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                      disabled={loadingConfig}
                    >
                      <Text style={[styles.primaryBtnText, { color: isDark ? '#000' : '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                        Generate SSH Key
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
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
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 12 },
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
  syncBtn: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  branchDropdown: {
    marginHorizontal: 16, borderRadius: 12, borderWidth: 1,
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
    margin: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden',
  },
  diffHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1,
  },
  diffTitle: { fontSize: 12, fontFamily: 'JetBrainsMono_400Regular' },
  diffClose: { fontSize: 16, padding: 4 },
  diffContent: { fontSize: 12, fontFamily: 'JetBrainsMono_400Regular', padding: 12, lineHeight: 18 },
  commitBox: {
    margin: 16, padding: 14, borderRadius: 14, borderWidth: 1, gap: 10,
  },
  commitInput: {
    fontSize: 14, fontFamily: 'Inter_400Regular',
    borderWidth: 1, borderRadius: 10, padding: 12,
    minHeight: 60, textAlignVertical: 'top',
  },
  commitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10,
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
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    letterSpacing: -0.4,
  },
  modalCloseBtn: {
    padding: 4,
  },
  section: {
    gap: 12,
    marginBottom: 12,
  },
  inputField: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 14,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
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
})
