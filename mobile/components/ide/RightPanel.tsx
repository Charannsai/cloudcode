import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useTabletLayoutStore } from '@/store/tabletLayoutStore'
import { useAIStore } from '@/store/ai'
import { IDE_LAYOUT } from '@/constants/tokens'
import { X, Plus, History, MoreVertical } from '@/components/HugeIconsShim'
import { AITab } from '@/components/project/AITab'

interface RightPanelProps {
  projectId: string
  visible: boolean
}

export default function RightPanel({ projectId, visible }: RightPanelProps) {
  const { colors, isDark } = useAppTheme()
  const { toggleRightPanel } = useTabletLayoutStore()
  const { startNewChat, savedConversations, loadConversation } = useAIStore()
  const [historyModalOpen, setHistoryModalOpen] = useState(false)

  if (!visible) return null

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? '#0F1218' : '#FFFFFF',
      borderLeftColor: colors.border,
    }]}>
      {/* Panel Header (matching Image 1) */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
          Agent
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <TouchableOpacity onPress={startNewChat} style={styles.closeBtn} activeOpacity={0.7}>
            <Plus size={14} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setHistoryModalOpen(true)} style={styles.closeBtn} activeOpacity={0.7}>
            <History size={14} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleRightPanel} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={14} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Chat Content */}
      <View style={styles.content}>
        <AITab projectId={projectId} hideHeader={true} />
      </View>

      {/* History Conversations Modal */}
      {historyModalOpen && (
        <Modal transparent visible={historyModalOpen} animationType="fade" onRequestClose={() => setHistoryModalOpen(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setHistoryModalOpen(false)}>
            <View style={[styles.historyCard, { backgroundColor: isDark ? '#161821' : '#FFFFFF', borderColor: colors.border }]}>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text, marginBottom: 8 }}>
                Past Conversations
              </Text>
              {savedConversations.slice(0, 8).map((thread) => (
                <TouchableOpacity
                  key={thread.id}
                  onPress={async () => {
                    await loadConversation(thread.id)
                    setHistoryModalOpen(false)
                  }}
                  style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}
                >
                  <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'Inter_500Medium' }} numberOfLines={1}>
                    {thread.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: IDE_LAYOUT.rightPanelWidth,
    borderLeftWidth: 1,
  },
  header: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 12,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCard: {
    width: 260,
    maxHeight: 320,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    elevation: 8,
  },
})
