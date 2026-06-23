import { useEffect, useCallback, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, ScrollView, Pressable, Modal, Dimensions,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useProjectsStore } from '@/store/projects'
import { useAIStore } from '@/store/ai'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useAppTheme } from '@/hooks/useAppTheme'
import { api } from '@/lib/api'
import { Project } from '@/types'
import {
  Plus,
  Trash2,
  Terminal,
  GitBranch,
  ChevronRight,
  Sparkles,
  Search,
  X,
  MoreVertical,
  List,
  Grid,
} from 'lucide-react-native'
import { TextInput } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
import { ProjectIcon, detectProjectTech, getTechColors } from '@/components/ProjectIcon'
import { useScrollVisibility } from '@/hooks/useScrollVisibility'
import Animated, { 
  FadeInDown, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  useSharedValue, 
  Easing,
  interpolate,
  Keyframe
} from 'react-native-reanimated'

const paperOpening = new Keyframe({
  0: {
    transform: [{ scale: 0.8 }, { translateY: -10 }, { rotateX: '20deg' }],
    opacity: 0,
  },
  100: {
    transform: [{ scale: 1 }, { translateY: 0 }, { rotateX: '0deg' }],
    opacity: 1,
  },
}).duration(150);

function PressableScale({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: any }) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(scale.value, { duration: 85, easing: Easing.out(Easing.quad) }) }]
  }))
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = 0.97 }}
      onPressOut={() => { scale.value = 1 }}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}

const PulseDot = ({ color }: { color: string }) => {
  const opacity = useSharedValue(0.4)
  
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])
  
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: interpolate(opacity.value, [0.4, 1], [0.85, 1.2]) }]
  }))
  
  return (
    <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }, animStyle]} />
  )
}

export default function ProjectsScreen() {
  const router = useRouter()
  const { colors, isDark } = useAppTheme()
  const { handleScroll } = useScrollVisibility()
  const { projects, loading, fetchProjects, removeProject, updateProject } = useProjectsStore()

  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'idle'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  const [activeProjectForMenu, setActiveProjectForMenu] = useState<Project | null>(null)
  const [isRenameMode, setIsRenameMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null)

  const handleRenameSubmit = async () => {
    if (!activeProjectForMenu || !newName.trim()) return
    setIsRenaming(true)
    try {
      const updated = await api.projects.rename(activeProjectForMenu.id, newName.trim())
      updateProject(activeProjectForMenu.id, { name: updated.name })
      setActiveProjectForMenu(null)
      setIsRenameMode(false)
      setNewName('')
      setMenuPosition(null)
    } catch (err) {
      Alert.alert('Failed to Rename', (err as Error).message)
    } finally {
      setIsRenaming(false)
    }
  }

  const cardBg = isDark ? '#161B22' : '#FFFFFF'
  const cardBorder = isDark ? '#30363D' : '#E1E4E8'
  const subtleBg = isDark ? '#21262D' : '#F6F8FA'

  useEffect(() => {
    let t: any
    if (loading) {
      t = setTimeout(() => {
        setShowSkeleton(true)
      }, 150)
    } else {
      setShowSkeleton(false)
    }
    return () => clearTimeout(t)
  }, [loading])

  const showSkeletonState = showSkeleton && projects.length === 0

  useEffect(() => {
    fetchProjects(false)
  }, [fetchProjects])

  useFocusEffect(
    useCallback(() => {
      fetchProjects(true)
      const interval = setInterval(() => {
        fetchProjects(true)
      }, 10000)
      return () => {
        clearInterval(interval)
      }
    }, [fetchProjects])
  )

  const handleDelete = useCallback((id: string, name: string) => {
    setProjectToDelete({ id, name })
  }, [])

  const confirmDelete = async () => {
    if (!projectToDelete) return
    setIsDeleting(true)
    try {
      await api.projects.delete(projectToDelete.id)
      removeProject(projectToDelete.id)
      setProjectToDelete(null)
    } catch (err) {
      Alert.alert('Failed', (err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.github_url || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase())
      
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'running' ? p.status === 'running' :
      p.status !== 'running'
      
    return matchesSearch && matchesStatus
  })

  const renderProject = ({ item: p, index }: { item: Project; index: number }) => {
    const tech = detectProjectTech(p.type, p.name, p.github_url)
    const techColors = getTechColors(tech, isDark)
    const isRunning = p.status === 'running'

    if (viewMode === 'grid') {
      return (
        <Animated.View 
          entering={FadeInDown.delay(Math.min(index * 25, 100)).duration(180)}
          style={{ width: (SCREEN_WIDTH - 40 - 10) / 2 }}
        >
          <PressableScale
            style={[styles.projectGridCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            onPress={() => router.push(`/project/${p.id}`)}
          >
            {/* Header: Icon + Menu Button */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <View style={[styles.projectGridIcon, { backgroundColor: techColors.bg }]}>
                <ProjectIcon type={p.type} name={p.name} githubUrl={p.github_url} size={18} isDark={isDark} />
              </View>
              <TouchableOpacity 
                onPress={(e) => {
                  setActiveProjectForMenu(p)
                  setNewName(p.name)
                  setMenuPosition({
                    x: e.nativeEvent.pageX,
                    y: e.nativeEvent.pageY,
                  })
                }} 
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ padding: 4 }}
              >
                <MoreVertical size={16} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Name */}
            <View style={{ marginTop: 16, width: '100%' }}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11.5, marginTop: 2, textTransform: 'capitalize' }} numberOfLines={1}>
                {tech}
              </Text>
            </View>

            {/* Status Footer */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14, width: '100%' }}>
              {isRunning ? (
                <>
                  <PulseDot color="#3FB950" />
                  <Text style={{ color: isDark ? '#3FB950' : '#16A34A', fontSize: 10.5, fontFamily: 'Inter_600SemiBold' }}>Active</Text>
                </>
              ) : (
                <>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textSecondary, opacity: 0.4 }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontFamily: 'Inter_500Medium' }}>Idle</Text>
                </>
              )}
            </View>
          </PressableScale>
        </Animated.View>
      )
    }

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index * 25, 100)).duration(180)}>
        <PressableScale
          style={[styles.projectRow, { backgroundColor: cardBg, borderColor: cardBorder }]}
          onPress={() => router.push(`/project/${p.id}`)}
        >
          {/* Tech Icon */}
          <View style={[styles.projectIcon, { backgroundColor: techColors.bg }]}>
            <ProjectIcon type={p.type} name={p.name} githubUrl={p.github_url} size={22} isDark={isDark} />
          </View>

          {/* Info */}
          <View style={styles.projectInfo}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 }} numberOfLines={1}>
              {p.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
              {isRunning ? (
                <>
                  <PulseDot color="#3FB950" />
                  <Text style={{ color: isDark ? '#3FB950' : '#16A34A', fontSize: 11, fontFamily: 'Inter_500Medium' }}>Running</Text>
                </>
              ) : (
                <>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.textSecondary, opacity: 0.35 }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular' }}>Idle</Text>
                </>
              )}
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
                · {tech}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.projectActions}>
            <TouchableOpacity 
              onPress={(e) => {
                setActiveProjectForMenu(p)
                setNewName(p.name)
                setMenuPosition({
                  x: e.nativeEvent.pageX,
                  y: e.nativeEvent.pageY,
                })
              }} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ padding: 6, marginRight: -4 }}
            >
              <MoreVertical size={18} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </PressableScale>
      </Animated.View>
    )
  }

  const ProjectSkeleton = () => {
    if (viewMode === 'grid') {
      return (
        <View style={[styles.projectGridCard, { backgroundColor: cardBg, borderColor: cardBorder, opacity: 0.5, width: (SCREEN_WIDTH - 40 - 10) / 2 }]}>
          <View style={[styles.projectGridIcon, { backgroundColor: subtleBg }]} />
          <View style={{ marginTop: 16, width: '100%' }}>
            <View style={{ backgroundColor: subtleBg, height: 12, width: '70%', borderRadius: 4 }} />
            <View style={{ backgroundColor: subtleBg, height: 9, width: '45%', borderRadius: 4, marginTop: 6 }} />
          </View>
          <View style={{ backgroundColor: subtleBg, height: 8, width: '30%', borderRadius: 4, marginTop: 14 }} />
        </View>
      )
    }
    return (
      <View style={[styles.projectRow, { backgroundColor: cardBg, borderColor: cardBorder, opacity: 0.5 }]}>
        <View style={[styles.projectIcon, { backgroundColor: subtleBg }]} />
        <View style={styles.projectInfo}>
          <View style={{ backgroundColor: subtleBg, height: 14, width: '65%', borderRadius: 4 }} />
          <View style={{ backgroundColor: subtleBg, height: 10, width: '35%', borderRadius: 4, marginTop: 6 }} />
        </View>
        <MoreVertical size={16} color={cardBorder} strokeWidth={1.5} />
      </View>
    )
  }

  const emptyState = (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: subtleBg, borderColor: cardBorder }]}>
        <Terminal size={28} color={colors.textSecondary} strokeWidth={1.3} />
      </View>
      <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.5, marginTop: 16 }}>
        No workspaces yet
      </Text>
      <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6, paddingHorizontal: 20 }}>
        Create a sandbox environment to start coding in the cloud.
      </Text>

      <View style={{ width: '100%', marginTop: 28, gap: 8 }}>
        <PressableScale
          onPress={() => router.push('/new-project')}
          style={[styles.emptyAction, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <View style={[styles.emptyActionIcon, { backgroundColor: isDark ? 'rgba(63,185,80,0.12)' : 'rgba(34,197,94,0.08)' }]}>
            <Plus size={16} color={isDark ? '#3FB950' : '#22C55E'} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>New from Template</Text>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 }}>Node, React, Next.js, FastAPI, Flask, Rust, Go</Text>
          </View>
          <ChevronRight size={15} color={colors.textSecondary} />
        </PressableScale>

        <PressableScale
          onPress={() => router.push({ pathname: '/new-project', params: { initialMode: 'clone' } })}
          style={[styles.emptyAction, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <View style={[styles.emptyActionIcon, { backgroundColor: isDark ? 'rgba(88,166,255,0.12)' : 'rgba(59,130,246,0.08)' }]}>
            <GitBranch size={16} color={isDark ? '#58A6FF' : '#3B82F6'} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Clone Repository</Text>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 }}>Import from GitHub, GitLab, or any Git URL</Text>
          </View>
          <ChevronRight size={15} color={colors.textSecondary} />
        </PressableScale>

        <PressableScale
          onPress={() => {
            useAIStore.setState({ pendingPrompt: "Help me design and build a new workspace application..." })
            router.push('/(tabs)/ai')
          }}
          style={[styles.emptyAction, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <View style={[styles.emptyActionIcon, { backgroundColor: isDark ? 'rgba(210,168,255,0.12)' : 'rgba(139,92,246,0.08)' }]}>
            <Sparkles size={16} color={isDark ? '#D2A8FF' : '#8B5CF6'} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Ask AI to Build</Text>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 }}>Let the AI assistant scaffold your app</Text>
          </View>
          <ChevronRight size={15} color={colors.textSecondary} />
        </PressableScale>
      </View>
    </View>
  )


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.5 }}>
            Workspaces
          </Text>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 }}>
            {projects.length} {projects.length === 1 ? 'workspace' : 'workspaces'}
          </Text>
        </View>
        <PressableScale
          onPress={() => router.push('/new-project')}
          style={[styles.newBtn, { backgroundColor: isDark ? '#F3F4F6' : '#0E1116' }]}
        >
          <Plus size={16} color={isDark ? '#0E1116' : '#FFFFFF'} strokeWidth={2.5} />
        </PressableScale>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, marginBottom: 6 }}>
        <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Search size={15} color={colors.textSecondary} />
          <TextInput
            placeholder="Search workspaces..."
            placeholderTextColor={colors.textSecondary + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              fontSize: 14,
              fontFamily: 'Inter_400Regular',
              color: colors.text,
              padding: 0,
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter pills and Layout Switch */}
      <View style={{ paddingHorizontal: 20, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flex: 1 }}>
          {(['all', 'running', 'idle'] as const).map(f => {
            const isActive = statusFilter === f
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setStatusFilter(f)}
                style={[styles.filterPill, {
                  backgroundColor: isActive 
                    ? (isDark ? '#F3F4F6' : '#0E1116') 
                    : (isDark ? '#21262D' : '#F6F8FA'),
                  borderColor: isActive 
                    ? 'transparent'
                    : cardBorder,
                }]}
              >
                <Text style={{
                  fontSize: 12,
                  fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_500Medium',
                  color: isActive 
                    ? (isDark ? '#0E1116' : '#FFFFFF') 
                    : colors.textSecondary,
                  textTransform: 'capitalize',
                }}>
                  {f}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Layout Switcher */}
        <View style={{ flexDirection: 'row', gap: 4, backgroundColor: isDark ? '#21262D' : '#F6F8FA', borderRadius: 8, padding: 2, borderWidth: 1, borderColor: cardBorder }}>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={{
              padding: 6,
              borderRadius: 6,
              backgroundColor: viewMode === 'list' ? (isDark ? '#30363D' : '#FFFFFF') : 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: viewMode === 'list' ? 0.1 : 0,
              shadowRadius: 1,
            }}
          >
            <List size={16} color={viewMode === 'list' ? colors.text : colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('grid')}
            style={{
              padding: 6,
              borderRadius: 6,
              backgroundColor: viewMode === 'grid' ? (isDark ? '#30363D' : '#FFFFFF') : 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: viewMode === 'grid' ? 0.1 : 0,
              shadowRadius: 1,
            }}
          >
            <Grid size={16} color={viewMode === 'grid' ? colors.text : colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {showSkeletonState ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[{ paddingHorizontal: 20, paddingBottom: 140 }, viewMode === 'grid' && { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }]} showsVerticalScrollIndicator={false}>
          <ProjectSkeleton />
          <ProjectSkeleton />
          <ProjectSkeleton />
          <ProjectSkeleton />
        </ScrollView>
      ) : (
        <FlatList
          key={viewMode}
          numColumns={viewMode === 'grid' ? 2 : 1}
          data={filteredProjects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between', marginBottom: 10 } : null}
          ListEmptyComponent={loading ? null : (
            searchQuery !== '' ? (
              <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 13.5 }}>No matching workspaces found</Text>
              </View>
            ) : emptyState
          )}
          ListFooterComponent={null}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchProjects} tintColor={colors.text} />
          }
        />
      )}

      <ConfirmModal
        visible={!!projectToDelete}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${projectToDelete?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setProjectToDelete(null)}
      />

      {/* Project Actions Popover Modal */}
      <Modal
        visible={activeProjectForMenu !== null && menuPosition !== null}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setActiveProjectForMenu(null)
          setMenuPosition(null)
        }}
      >
        <View style={styles.popoverBackdrop}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => {
              setActiveProjectForMenu(null)
              setMenuPosition(null)
            }}
          />
          <Animated.View 
            entering={paperOpening}
            style={[
              styles.popoverMenu, 
              { 
                backgroundColor: isDark ? 'rgba(22, 27, 34, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                borderColor: isDark ? 'rgba(240, 246, 252, 0.15)' : 'rgba(48, 54, 61, 0.15)',
                top: menuPosition ? Math.max(50, Math.min(menuPosition.y - 20, SCREEN_HEIGHT - 180)) : 100,
                left: menuPosition 
                  ? (menuPosition.x < SCREEN_WIDTH / 2
                      ? Math.max(12, Math.min(menuPosition.x + 15, SCREEN_WIDTH - 170))
                      : Math.max(12, Math.min(menuPosition.x - 160, SCREEN_WIDTH - 170)))
                  : 100,
              }
            ]}
          >
            <View style={{ padding: 6, gap: 4 }}>
              <TouchableOpacity 
                activeOpacity={0.6}
                onPress={() => {
                  if (activeProjectForMenu) {
                    const id = activeProjectForMenu.id
                    setActiveProjectForMenu(null)
                    setMenuPosition(null)
                    router.push(`/project/${id}`)
                  }
                }}
                style={[styles.popoverItem, { backgroundColor: isDark ? 'rgba(88,166,255,0.08)' : 'rgba(9,105,218,0.05)' }]}
              >
                <Text style={[styles.popoverItemText, { color: isDark ? '#58A6FF' : '#0969DA', fontFamily: 'Inter_700Bold' }]}>Open Workspace</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.6}
                onPress={() => {
                  if (activeProjectForMenu) {
                    setNewName(activeProjectForMenu.name)
                    setIsRenameMode(true)
                    setMenuPosition(null)
                  }
                }}
                style={styles.popoverItem}
              >
                <Text style={[styles.popoverItemText, { color: colors.text, opacity: 0.9 }]}>Rename</Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: isDark ? 'rgba(240, 246, 252, 0.1)' : 'rgba(48, 54, 61, 0.1)', marginVertical: 4 }} />

              <TouchableOpacity 
                activeOpacity={0.6}
                onPress={() => {
                  if (activeProjectForMenu) {
                    const { id, name } = activeProjectForMenu
                    setActiveProjectForMenu(null)
                    setMenuPosition(null)
                    handleDelete(id, name)
                  }
                }}
                style={[styles.popoverItem, { backgroundColor: isDark ? 'rgba(248,81,73,0.08)' : 'rgba(248,81,73,0.04)' }]}
              >
                <Text style={[styles.popoverItemText, { color: '#FF6B6B', fontFamily: 'Inter_700Bold' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Centered Rename Workspace Modal */}
      <Modal
        visible={isRenameMode && activeProjectForMenu !== null}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setIsRenameMode(false)
          setNewName('')
          setActiveProjectForMenu(null)
        }}
      >
        <View style={styles.centeredModalBackdrop}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => {
              setIsRenameMode(false)
              setNewName('')
              setActiveProjectForMenu(null)
            }}
          />
          <Animated.View 
            entering={FadeInDown.duration(150)}
            style={[styles.centeredModalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 12 }}>
              Rename Workspace
            </Text>
            <View style={[styles.searchBar, { backgroundColor: subtleBg, borderColor: cardBorder, marginBottom: 16, height: 42, paddingHorizontal: 12 }]}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Workspace Name"
                placeholderTextColor={colors.textSecondary + '80'}
                style={{ flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text, padding: 0 }}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleRenameSubmit}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
              <TouchableOpacity 
                onPress={() => { setIsRenameMode(false); setNewName(''); setActiveProjectForMenu(null); }}
                style={[styles.popoverButton, { flex: 1, backgroundColor: isDark ? '#21262D' : '#F6F8FA', borderColor: cardBorder, height: 38 }]}
              >
                <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleRenameSubmit}
                disabled={isRenaming || !newName.trim()}
                style={[styles.popoverButton, { flex: 1, backgroundColor: isDark ? '#F3F4F6' : '#0E1116', opacity: isRenaming || !newName.trim() ? 0.6 : 1, height: 38 }]}
              >
                <Text style={{ color: isDark ? '#0E1116' : '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                  {isRenaming ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  projectIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectInfo: { flex: 1 },
  projectActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
  },
  emptyContainer: {
    paddingTop: 48,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  emptyActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaText: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 8,
    textAlign: 'center',
  },
  projectGridCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'flex-start',
    height: 136,
  },
  projectGridIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popoverBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  centeredModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centeredModalCard: {
    width: '100%',
    maxWidth: 320,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  popoverMenu: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    minWidth: 130,
  },
  popoverItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  popoverItemText: {
    fontSize: 13.5,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  popoverButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
})
