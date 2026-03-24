import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { api } from '@/lib/api'
import {
  GitBranch, GitCommit, GitPullRequest, Plus, Minus, Check,
  ChevronDown, ChevronRight, RefreshCw, Upload, Download,
  FileCode, FilePlus, Trash, AlertCircle, Circle as CircleIcon,
} from 'lucide-react-native'

interface Props {
  projectId: string
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
  modified: { icon: FileCode, color: '#f59e0b' },
  added: { icon: FilePlus, color: '#10b981' },
  deleted: { icon: Trash, color: '#ef4444' },
}

export default function GitTab({ projectId }: Props) {
  const { colors, isDark } = useAppTheme()
  const [status, setStatus] = useState<GitStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [committing, setCommitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    staged: true,
    changes: true,
    untracked: true,
  })
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
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [projectId])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  const handleStage = async (files: string[]) => {
    try {
      await api.git.stage(projectId, files)
      fetchStatus(true)
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
    }
  }

  const handleUnstage = async (files: string[]) => {
    try {
      await api.git.unstage(projectId, files)
      fetchStatus(true)
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
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
    try {
      const result = await api.git.sync(projectId, action)
      Alert.alert(action === 'push' ? 'Pushed' : 'Pulled', result.output || 'Success')
      fetchStatus(true)
    } catch (err) {
      Alert.alert('Sync Failed', (err as Error).message)
    } finally {
      setSyncing(false)
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
        <ActivityIndicator color={colors.text} size="small" />
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
      <View style={[styles.branchBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.branchSelector} onPress={handleLoadBranches}>
          <GitBranch size={14} color={isDark ? '#58a6ff' : '#0969da'} />
          <Text style={[styles.branchName, { color: isDark ? '#58a6ff' : '#0969da' }]}>
            {status?.branch || 'main'}
          </Text>
          <ChevronDown size={12} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.syncButtons}>
          {(status?.ahead || 0) > 0 && (
            <View style={[styles.syncBadge, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
              <Text style={[styles.syncBadgeText, { color: isDark ? '#60a5fa' : '#2563eb' }]}>↑{status?.ahead}</Text>
            </View>
          )}
          {(status?.behind || 0) > 0 && (
            <View style={[styles.syncBadge, { backgroundColor: isDark ? '#3b1818' : '#fee2e2' }]}>
              <Text style={[styles.syncBadgeText, { color: isDark ? '#f87171' : '#dc2626' }]}>↓{status?.behind}</Text>
            </View>
          )}
          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: isDark ? '#111' : '#f3f4f6' }]} onPress={() => handleSync('pull')} disabled={syncing}>
            <Download size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: isDark ? '#111' : '#f3f4f6' }]} onPress={() => handleSync('push')} disabled={syncing}>
            <Upload size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: isDark ? '#111' : '#f3f4f6' }]} onPress={() => fetchStatus(true)}>
            <RefreshCw size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Branch dropdown */}
      {showBranches && (
        <View style={[styles.branchDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {branches.map(b => (
            <TouchableOpacity key={b} style={styles.branchItem} onPress={() => handleCheckout(b)}>
              {b === status?.branch ? <Check size={14} color="#10b981" /> : <View style={{ width: 14 }} />}
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
            <Check size={40} color={isDark ? '#10b981' : '#059669'} />
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
                  <View style={[styles.countBadge, { backgroundColor: '#10b981' }]}>
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
                      <TouchableOpacity onPress={() => handleUnstage([f.path])} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Minus size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
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
                  <View style={[styles.countBadge, { backgroundColor: '#f59e0b' }]}>
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
                      <TouchableOpacity onPress={() => handleStage([f.path])} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Plus size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
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
                  <View style={[styles.countBadge, { backgroundColor: '#6366f1' }]}>
                    <Text style={styles.countText}>{status!.untracked.length}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleStage(status!.untracked)} style={styles.sectionAction}>
                    <Plus size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
                {expandedSections.untracked && status!.untracked.map(f => (
                  <TouchableOpacity key={f} style={[styles.fileRow, { borderBottomColor: colors.border }]} onPress={() => handleStage([f])}>
                    <CircleIcon size={14} color="#6366f1" />
                    <Text style={[styles.filePath, { color: colors.text }]} numberOfLines={1}>{f}</Text>
                    <Plus size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Diff viewer */}
        {diffFile && diffText && (
          <View style={[styles.diffContainer, { backgroundColor: isDark ? '#0d1117' : '#f6f8fa', borderColor: colors.border }]}>
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
          <View style={[styles.commitBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                backgroundColor: commitMessage.trim() ? (isDark ? '#238636' : '#1a7f37') : (isDark ? '#1a1a1a' : '#e5e7eb'),
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

        <View style={{ height: 40 }} />
      </ScrollView>
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
  syncBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
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
})
