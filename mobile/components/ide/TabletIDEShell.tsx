import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useTabletLayoutStore } from '@/store/tabletLayoutStore'
import { Project } from '@/types'

// IDE Shell Components
import TitleBar from './TitleBar'
import MenuBar from './MenuBar'
import ActivityBar from './ActivityBar'
import Sidebar from './Sidebar'
import EditorTabBar from './EditorTabBar'
import InlineEditor from './InlineEditor'
import BottomPanel from './BottomPanel'
import RightPanel from './RightPanel'
import StatusBar from './StatusBar'

interface TabletIDEShellProps {
  project: Project
  onRefresh: () => void
}

export default function TabletIDEShell({ project, onRefresh }: TabletIDEShellProps) {
  const { colors, isDark } = useAppTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const {
    sidebarVisible,
    rightPanelVisible,
    bottomPanelVisible,
    activeEditorTab,
    openEditorTabs,
    toggleSidebar,
    toggleRightPanel,
    toggleBottomPanel,
    setSidebarPanel,
    setBottomTab,
    closeFile,
  } = useTabletLayoutStore()

  // Menu bar action handlers
  const handleSave = async () => {
    if (InlineEditor.save) {
      await InlineEditor.save()
    }
  }

  const handleCloseFile = () => {
    if (activeEditorTab) {
      closeFile(activeEditorTab)
    }
  }

  const handleOpenFilePicker = () => {
    setSidebarPanel('explorer')
  }

  const handleExitEditor = () => {
    router.back()
  }

  const handleRunFile = () => {
    // Switch to terminal bottom panel
    setBottomTab('terminal')
  }

  const handleGoToTerminal = () => {
    setBottomTab('terminal')
  }

  const handleGoToGit = () => {
    setSidebarPanel('git')
  }

  const handleGoToPreview = () => {
    setBottomTab('preview')
  }

  const handleOpenExplorer = () => {
    setSidebarPanel('explorer')
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Title Bar */}
      <TitleBar
        projectName={project.name}
        projectStatus={project.container_status || project.status}
        onBack={handleExitEditor}
        onRefresh={onRefresh}
      />

      {/* Menu Bar */}
      <MenuBar
        onSave={handleSave}
        onCloseFile={handleCloseFile}
        onOpenFilePicker={handleOpenFilePicker}
        onExitEditor={handleExitEditor}
        onRunFile={handleRunFile}
        onToggleSidebar={toggleSidebar}
        onToggleBottomPanel={toggleBottomPanel}
        onToggleRightPanel={toggleRightPanel}
        onGoToTerminal={handleGoToTerminal}
        onGoToGit={handleGoToGit}
        onGoToPreview={handleGoToPreview}
      />

      {/* Main Content Area */}
      <View style={styles.mainArea}>
        {/* Activity Bar (leftmost) */}
        <ActivityBar />

        {/* Sidebar */}
        <Sidebar projectId={project.id} visible={sidebarVisible} />

        {/* Editor + Bottom Panel Area */}
        <View style={styles.editorArea}>
          {/* Editor Tab Bar */}
          <EditorTabBar />

          {/* Editor Content */}
          <View style={styles.editorContent}>
            <InlineEditor projectId={project.id} onOpenExplorer={handleOpenExplorer} />
          </View>

          {/* Bottom Panel */}
          <BottomPanel
            projectId={project.id}
            visible={bottomPanelVisible}
            port={project.port}
            ports={project.ports}
          />
        </View>

        {/* Right Panel (AI Chat) */}
        <RightPanel projectId={project.id} visible={rightPanelVisible} />
      </View>

      {/* Status Bar */}
      <StatusBar
        branch="main"
        projectStatus={project.container_status || project.status}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
  },
  editorArea: {
    flex: 1,
    flexDirection: 'column',
  },
  editorContent: {
    flex: 1,
  },
})
