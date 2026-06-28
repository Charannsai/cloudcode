import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native'
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  FileCode,
  Sparkles,
  ArrowLeft,
  CornerDownRight,
  Send,
  GitMerge,
  GitBranch,
  FileText,
  ChevronRight,
  RefreshCw,
  User,
} from 'lucide-react-native'
import { usePRStore } from '@/store/prStore'
import { useAppTheme } from '@/hooks/useAppTheme'
import { ConfirmModal } from '@/components/ConfirmModal'
import Animated, { FadeIn, FadeInRight, SlideInBottom } from 'react-native-reanimated'
import { api } from '@/lib/api'

const { width, height } = Dimensions.get('window')

interface PRsTabProps {
  projectId: string
}

type SubTab = 'conversation' | 'files' | 'ai-review'

export default function PRsTab({ projectId }: PRsTabProps) {
  const { colors, isDark } = useAppTheme()
  const { prs, activePR, loading, error, fetchPRs, fetchPRDetail, submitReview, mergePR, clearActivePR } = usePRStore()
  
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('conversation')
  const [selectedFile, setSelectedFile] = useState<any>(null)
  
  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [reviewEvent, setReviewEvent] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT'>('COMMENT')
  const [reviewBody, setReviewBody] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Merge Modal State
  const [mergeModalVisible, setMergeModalVisible] = useState(false)
  const [mergeMethod, setMergeMethod] = useState<'merge' | 'squash' | 'rebase'>('merge')
  const [commitTitle, setCommitTitle] = useState('')
  const [commitMessage, setCommitMessage] = useState('')
  const [merging, setMerging] = useState(false)

  // AI Review State
  const [aiReviewText, setAiReviewText] = useState('')
  const [generatingAiReview, setGeneratingAiReview] = useState(false)

  // Alert Modal State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  }>({ visible: false, title: '', message: '', type: 'info' })

  // Create PR Modal State
  // Create PR State
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'create'>('list')
  const [newPrTitle, setNewPrTitle] = useState('')
  const [newPrBody, setNewPrBody] = useState('')
  const [newPrHead, setNewPrHead] = useState('')
  const [newPrBase, setNewPrBase] = useState('main')
  const [creatingPr, setCreatingPr] = useState(false)

  useEffect(() => {
    fetchPRs(projectId)
    return () => clearActivePR()
  }, [projectId])

  const handleSelectPR = (number: number) => {
    fetchPRDetail(projectId, number)
    setActiveSubTab('conversation')
    setAiReviewText('')
    setViewMode('detail')
  }

  const handleBackToList = () => {
    clearActivePR()
    setViewMode('list')
  }

  const handleRefresh = () => {
    if (activePR) {
      fetchPRDetail(projectId, activePR.pr.number)
    } else {
      fetchPRs(projectId)
    }
  }

  const handleOpenCreate = async () => {
    setViewMode('create')
    setNewPrTitle('')
    setNewPrBody('')
    setNewPrBase('main')
    setNewPrHead('')
    
    // Try to auto-fetch current branch from git status
    try {
      const status = await api.git.status(projectId)
      if (status.branch) {
        setNewPrHead(status.branch)
        setNewPrTitle(`Merge ${status.branch} into main`)
      }
    } catch (_) {}
  }

  const handleCreatePR = async () => {
    if (!newPrTitle.trim() || !newPrHead.trim()) {
      showAlert('Validation Error', 'PR Title and Source Branch (Head) are required.', 'warning')
      return
    }
    setCreatingPr(true)
    try {
      await usePRStore.getState().createPR(projectId, newPrTitle.trim(), newPrBody.trim(), newPrHead.trim(), newPrBase.trim())
      setViewMode('list')
      showAlert('Success', 'Pull Request created successfully!', 'success')
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to create PR', 'error')
    } finally {
      setCreatingPr(false)
    }
  }

  const handleSendReview = async () => {
    if (!reviewBody.trim() && reviewEvent !== 'APPROVE') {
      showAlert('Validation Error', 'Please enter a review comment.', 'warning')
      return
    }
    setSubmittingReview(true)
    try {
      await submitReview(projectId, activePR!.pr.number, reviewEvent, reviewBody)
      setReviewModalVisible(false)
      setReviewBody('')
      showAlert('Success', 'Review submitted successfully!', 'success')
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to submit review', 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleMerge = async () => {
    setMerging(true)
    try {
      await mergePR(
        projectId,
        activePR!.pr.number,
        mergeMethod,
        commitTitle.trim() || undefined,
        commitMessage.trim() || undefined
      )
      setMergeModalVisible(false)
      showAlert('Success', 'Pull Request merged successfully!', 'success')
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to merge PR', 'error')
    } finally {
      setMerging(false)
    }
  }

  const handleGenerateAiReview = async () => {
    if (!activePR || activePR.files.length === 0) {
      showAlert('Info', 'No file changes available to review.', 'info')
      return
    }

    setGeneratingAiReview(true)
    setAiReviewText('')
    try {
      // Prepare PR diff context for AI
      const diffSummary = activePR.files
        .map((f) => `File: ${f.filename}\nStatus: ${f.status}\nChanges: +${f.additions} -${f.deletions}\nDiff:\n${f.patch || 'No diff available'}`)
        .join('\n\n')

      const prompt = `You are an expert Senior Code Reviewer. Review the following Pull Request changes. Summarize the changes, highlight any bugs, security vulnerabilities, or performance issues, and suggest improvements. Keep your response structured, professional, and clear.\n\n${diffSummary}`

      // Create a temporary stateful run to stream the AI response
      const run = await api.ai.runs.create(projectId, prompt, 'gemini')
      
      let fullResponse = ''
      await api.ai.runs.chat(projectId, run.id, prompt, (chunk) => {
        if (chunk.type === 'text' && chunk.content) {
          fullResponse += chunk.content
          setAiReviewText(fullResponse)
        }
      })
    } catch (err: any) {
      showAlert('Error', 'Failed to generate AI review: ' + err.message, 'error')
    } finally {
      setGeneratingAiReview(false)
    }
  }

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setAlertConfig({ visible: true, title, message, type })
  }

  const getPrStateStyles = (state: string, merged: boolean) => {
    if (merged) return { bg: '#8B5CF620', text: '#A78BFA', label: 'Merged', icon: GitMerge }
    if (state === 'open') return { bg: '#22C55E20', text: '#4ADE80', label: 'Open', icon: GitPullRequest }
    return { bg: '#EF444420', text: '#F87171', label: 'Closed', icon: XCircle }
  }

  const renderPRItem = ({ item }: { item: any }) => {
    const stateStyle = getPrStateStyles(item.state, !!item.merged_at)
    const StateIcon = stateStyle.icon

    return (
      <TouchableOpacity
        style={[styles.prCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleSelectPR(item.number)}
        activeOpacity={0.7}
      >
        <View style={styles.prCardHeader}>
          <View style={[styles.stateBadge, { backgroundColor: stateStyle.bg }]}>
            <StateIcon size={12} color={stateStyle.text} />
            <Text style={[styles.stateBadgeText, { color: stateStyle.text }]}>{stateStyle.label}</Text>
          </View>
          <Text style={[styles.prNumber, { color: colors.textSecondary }]}>#{item.number}</Text>
        </View>

        <Text style={[styles.prTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.prMetaRow}>
          <View style={styles.authorContainer}>
            {item.user?.avatar_url ? (
              <Image source={{ uri: item.user.avatar_url }} style={styles.authorAvatar} />
            ) : (
              <View style={[styles.authorAvatar, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                <User size={10} color={colors.textSecondary} />
              </View>
            )}
            <Text style={[styles.authorName, { color: colors.textSecondary }]}>{item.user?.login}</Text>
          </View>

          <View style={styles.branchContainer}>
            <GitBranch size={12} color={colors.textSecondary} />
            <Text style={[styles.branchText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.head?.ref}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderDiffLine = (line: string, index: number) => {
    let bg = 'transparent'
    let color = colors.text
    if (line.startsWith('+')) {
      bg = '#22C55E15'
      color = '#4ADE80'
    } else if (line.startsWith('-')) {
      bg = '#EF444415'
      color = '#F87171'
    } else if (line.startsWith('@@')) {
      bg = '#3B82F610'
      color = '#60A5FA'
    }

    return (
      <View key={index} style={[styles.diffLine, { backgroundColor: bg }]}>
        <Text style={[styles.diffLineText, { color, fontFamily: 'monospace' }]}>{line}</Text>
      </View>
    )
  }

  const renderDiffViewer = () => {
    if (!selectedFile) return null
    const lines = (selectedFile.patch || 'No diff patch available for this file.').split('\n')

    return (
      <Modal visible={!!selectedFile} animationType="slide" transparent>
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
          <Animated.View entering={SlideInBottom} style={[styles.diffModalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                  {selectedFile.filename}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  +{selectedFile.additions} additions · -{selectedFile.deletions} deletions
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.card }]}
                onPress={() => setSelectedFile(null)}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.diffScrollView} horizontal>
              <ScrollView style={{ minWidth: width }}>
                {lines.map((line: string, idx: number) => renderDiffLine(line, idx))}
              </ScrollView>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    )
  }

  const renderActivePRDetail = () => {
    if (!activePR) return null
    const { pr, conversation, files } = activePR
    const stateStyle = getPrStateStyles(pr.state, !!pr.merged_at)
    const StateIcon = stateStyle.icon

    return (
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBackToList} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.detailTitle, { color: colors.text }]} numberOfLines={2}>
              {pr.title}
            </Text>
            <View style={styles.detailMeta}>
              <View style={[styles.stateBadge, { backgroundColor: stateStyle.bg }]}>
                <StateIcon size={12} color={stateStyle.text} />
                <Text style={[styles.stateBadgeText, { color: stateStyle.text }]}>{stateStyle.label}</Text>
              </View>
              <Text style={[styles.prNumberDetail, { color: colors.textSecondary }]}>#{pr.number}</Text>
              <Text style={[styles.authorNameDetail, { color: colors.textSecondary }]}>by {pr.user?.login}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
            <RefreshCw size={16} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Sub-tabs */}
        <View style={[styles.subTabsContainer, { borderBottomColor: colors.border }]}>
          {(['conversation', 'files', 'ai-review'] as SubTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.subTabButton,
                activeSubTab === tab && { borderBottomColor: colors.text, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveSubTab(tab)}
            >
              <Text
                style={[
                  styles.subTabLabel,
                  { color: activeSubTab === tab ? colors.text : colors.textSecondary },
                ]}
              >
                {tab === 'conversation' ? 'Conversation' : tab === 'files' ? `Files (${files.length})` : 'AI Review'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          {activeSubTab === 'conversation' && (
            <View style={{ padding: 16 }}>
              {/* Description */}
              {pr.body ? (
                <View style={[styles.commentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.commentHeader}>
                    <Image source={{ uri: pr.user?.avatar_url }} style={styles.commentAvatar} />
                    <Text style={[styles.commentAuthor, { color: colors.text }]}>{pr.user?.login}</Text>
                    <Text style={[styles.commentTime, { color: colors.textSecondary }]}>opened this PR</Text>
                  </View>
                  <Text style={[styles.commentBody, { color: colors.text }]}>{pr.body}</Text>
                </View>
              ) : (
                <Text style={[styles.noDescription, { color: colors.textSecondary }]}>No description provided.</Text>
              )}

              {/* Timeline Comments */}
              {conversation.map((item: any) => (
                <View key={item.id} style={[styles.commentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.commentHeader}>
                    <Image source={{ uri: item.user?.avatar_url }} style={styles.commentAvatar} />
                    <Text style={[styles.commentAuthor, { color: colors.text }]}>{item.user?.login}</Text>
                    <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {item.type === 'review_comment' && (
                    <View style={[styles.fileContextBadge, { backgroundColor: colors.background }]}>
                      <FileCode size={12} color={colors.textSecondary} />
                      <Text style={[styles.fileContextText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.path}:{item.line}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.commentBody, { color: colors.text }]}>{item.body}</Text>
                </View>
              ))}
            </View>
          )}

          {activeSubTab === 'files' && (
            <View style={{ padding: 16 }}>
              {files.map((file: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.fileItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setSelectedFile(file)}
                >
                  <FileCode size={18} color={colors.text} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                      {file.filename}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                      {file.status}
                    </Text>
                  </View>
                  <View style={styles.fileChanges}>
                    <Text style={{ color: '#4ADE80', fontSize: 12, marginRight: 8 }}>+{file.additions}</Text>
                    <Text style={{ color: '#F87171', fontSize: 12 }}>-{file.deletions}</Text>
                    <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 8 }} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeSubTab === 'ai-review' && (
            <View style={{ padding: 16 }}>
              <TouchableOpacity
                style={[styles.aiBtn, { backgroundColor: colors.text }]}
                onPress={handleGenerateAiReview}
                disabled={generatingAiReview}
              >
                {generatingAiReview ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <>
                    <Sparkles size={16} color={colors.background} style={{ marginRight: 8 }} />
                    <Text style={[styles.aiBtnText, { color: colors.background }]}>
                      Generate AI Code Review
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {aiReviewText ? (
                <View style={[styles.aiReviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.aiReviewHeader}>
                    <Sparkles size={16} color={colors.text} />
                    <Text style={[styles.aiReviewTitle, { color: colors.text }]}>AI Review Report</Text>
                  </View>
                  <Text style={[styles.aiReviewContent, { color: colors.text }]}>
                    {aiReviewText}
                  </Text>
                </View>
              ) : (
                !generatingAiReview && (
                  <View style={styles.aiReviewPlaceholder}>
                    <Sparkles size={32} color={colors.textSecondary + '40'} />
                    <Text style={[styles.aiPlaceholderText, { color: colors.textSecondary }]}>
                      Tap the button above to let CloudCode AI review your code changes, find potential bugs, and summarize the pull request.
                    </Text>
                  </View>
                )
              )}
            </View>
          )}
        </ScrollView>

        {/* Floating Actions Bar */}
        {pr.state === 'open' && (
          <View style={[styles.actionsBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.reviewBtn, { borderColor: colors.border }]}
              onPress={() => setReviewModalVisible(true)}
            >
              <MessageSquare size={16} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium' }}>Submit Review</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mergeBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={() => setMergeModalVisible(true)}
            >
              <GitMerge size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold' }}>Merge Pull Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Review Modal */}
        <Modal visible={reviewModalVisible} animationType="slide" transparent>
          <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <Animated.View entering={SlideInBottom} style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitleText, { color: colors.text }]}>Submit Review</Text>
              
              {/* Event selector */}
              <View style={styles.segmentedControl}>
                {(['COMMENT', 'APPROVE', 'REQUEST_CHANGES'] as const).map((ev) => (
                  <TouchableOpacity
                    key={ev}
                    style={[
                      styles.segmentButton,
                      reviewEvent === ev && { backgroundColor: colors.text },
                    ]}
                    onPress={() => setReviewEvent(ev)}
                  >
                    <Text
                      style={[
                        styles.segmentLabel,
                        { color: reviewEvent === ev ? colors.background : colors.textSecondary },
                      ]}
                    >
                      {ev === 'REQUEST_CHANGES' ? 'Request Changes' : ev.charAt(0) + ev.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.commentInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Write your review comment here..."
                placeholderTextColor={colors.textSecondary + '80'}
                value={reviewBody}
                onChangeText={setReviewBody}
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setReviewModalVisible(false)}
                >
                  <Text style={{ color: colors.text }}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: colors.text }]}
                  onPress={handleSendReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text style={{ color: colors.background, fontWeight: '600' }}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* Merge Modal */}
        <Modal visible={mergeModalVisible} animationType="slide" transparent>
          <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <Animated.View entering={SlideInBottom} style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitleText, { color: colors.text }]}>Merge Pull Request</Text>

              {/* Merge method selector */}
              <View style={styles.segmentedControl}>
                {(['merge', 'squash', 'rebase'] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.segmentButton,
                      mergeMethod === method && { backgroundColor: colors.text },
                    ]}
                    onPress={() => setMergeMethod(method)}
                  >
                    <Text
                      style={[
                        styles.segmentLabel,
                        { color: mergeMethod === method ? colors.background : colors.textSecondary },
                      ]}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Commit Title (Optional)"
                placeholderTextColor={colors.textSecondary + '80'}
                value={commitTitle}
                onChangeText={setCommitTitle}
              />

              <TextInput
                style={[styles.textInput, { borderColor: colors.border, color: colors.text, marginTop: 12 }]}
                placeholder="Commit Message (Optional)"
                placeholderTextColor={colors.textSecondary + '80'}
                value={commitMessage}
                onChangeText={setCommitMessage}
                multiline
                numberOfLines={2}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setMergeModalVisible(false)}
                >
                  <Text style={{ color: colors.text }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: '#8B5CF6' }]}
                  onPress={handleMerge}
                  disabled={merging}
                >
                  {merging ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Confirm Merge</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {renderDiffViewer()}
      </View>
    )
  }

  const renderCreatePRView = () => {
    return (
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setViewMode('list')} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.detailTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
              New Pull Request
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              Create a new review for your branch
            </Text>
          </View>
        </View>

        {/* Form */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>PULL REQUEST TITLE</Text>
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              placeholder="e.g., Implement OAuth user login flow"
              placeholderTextColor={colors.textSecondary + '80'}
              value={newPrTitle}
              onChangeText={setNewPrTitle}
            />
          </View>

          <View style={[styles.formSection, { marginTop: 20 }]}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card, height: 120, textAlignVertical: 'top' }]}
              placeholder="Describe the changes made, fixed issues, or testing steps..."
              placeholderTextColor={colors.textSecondary + '80'}
              value={newPrBody}
              onChangeText={setNewPrBody}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 16, marginTop: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>SOURCE BRANCH (HEAD)</Text>
              <View style={[styles.branchInputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <GitBranch size={14} color={colors.textSecondary} />
                <TextInput
                  style={[styles.branchInput, { color: colors.text }]}
                  placeholder="feature-branch"
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={newPrHead}
                  onChangeText={setNewPrHead}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>BASE BRANCH</Text>
              <View style={[styles.branchInputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <GitBranch size={14} color={colors.textSecondary} />
                <TextInput
                  style={[styles.branchInput, { color: colors.text }]}
                  placeholder="main"
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={newPrBase}
                  onChangeText={setNewPrBase}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitPrBtn, { backgroundColor: colors.text, marginTop: 32, opacity: creatingPr ? 0.7 : 1 }]}
            onPress={handleCreatePR}
            disabled={creatingPr}
            activeOpacity={0.8}
          >
            {creatingPr ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <>
                <Sparkles size={16} color={colors.background} style={{ marginRight: 8 }} />
                <Text style={[styles.submitPrBtnText, { color: colors.background }]}>
                  Create Pull Request
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading && viewMode === 'list' && prs.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.text} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Pull Requests...</Text>
        </View>
      ) : viewMode === 'detail' ? (
        renderActivePRDetail()
      ) : viewMode === 'create' ? (
        renderCreatePRView()
      ) : (
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <GitPullRequest size={20} color={colors.text} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Pull Requests</Text>
            <TouchableOpacity
              onPress={handleOpenCreate}
              style={[styles.newPrHeaderBtn, { backgroundColor: colors.text }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.newPrHeaderBtnText, { color: colors.background }]}>New PR</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh} style={[styles.refreshBtn, { marginLeft: 8 }]}>
              <RefreshCw size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          {prs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <GitPullRequest size={48} color={colors.textSecondary + '40'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No Pull Requests found for this repository.
              </Text>
            </View>
          ) : (
            <FlatList
              data={prs}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderPRItem}
              contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
            />
          )}
        </View>
      )}

      {/* Custom Alert Modal */}
      <ConfirmModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        singleButton
        onConfirm={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginLeft: 10, flex: 1 },
  refreshBtn: { padding: 6, borderRadius: 8 },
  prCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  prCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  stateBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  prNumber: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  prTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', lineHeight: 20, marginBottom: 12 },
  prMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authorContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorAvatar: { width: 18, height: 18, borderRadius: 9 },
  authorName: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  branchContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '50%' },
  branchText: { fontSize: 12, fontFamily: 'monospace' },

  // Detail view styles
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  detailTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', lineHeight: 20 },
  detailMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  prNumberDetail: { fontSize: 12 },
  authorNameDetail: { fontSize: 12 },
  subTabsContainer: { flexDirection: 'row', borderBottomWidth: 1 },
  subTabButton: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  subTabLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  // Comments & Timeline
  commentCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  commentAvatar: { width: 22, height: 22, borderRadius: 11, marginRight: 8 },
  commentAuthor: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  commentTime: { fontSize: 11, marginLeft: 8 },
  commentBody: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  noDescription: { fontSize: 13, textAlign: 'center', marginVertical: 32 },
  fileContextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  fileContextText: { fontSize: 11, fontFamily: 'monospace' },

  // Files Tab
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  fileName: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  fileChanges: { flexDirection: 'row', alignItems: 'center' },

  // Diff Viewer Modal
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  diffModalContent: { height: height * 0.85, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  closeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  diffScrollView: { flex: 1, backgroundColor: '#0a0a0f' },
  diffLine: { paddingHorizontal: 12, paddingVertical: 4, minHeight: 24, justifyContent: 'center' },
  diffLineText: { fontSize: 12, lineHeight: 16 },

  // AI Review Tab
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  aiBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  aiReviewCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
  aiReviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiReviewTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  aiReviewContent: { fontSize: 13, lineHeight: 20 },
  aiReviewPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 12 },
  aiPlaceholderText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  // Floating Action Bar
  actionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  reviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  mergeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },

  // Modal Dialogs
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitleText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 16 },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#ffffff08',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  segmentButton: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
  segmentLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 13,
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
  },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  modalConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPrHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newPrHeaderBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  formSection: {
    marginBottom: 4,
  },
  formLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  branchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  branchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  submitPrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 10,
  },
  submitPrBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
})
