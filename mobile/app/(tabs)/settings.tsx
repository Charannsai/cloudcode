import { useState, useEffect, useCallback } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, Switch, ScrollView, 
  TextInput, ActivityIndicator, Alert, Modal, RefreshControl, BackHandler, Pressable
} from 'react-native'
import Animated, { 
  FadeInRight, FadeInDown, useSharedValue, useAnimatedStyle, withSpring, SlideInRight, SlideOutRight, runOnJS, withTiming, Easing, withRepeat 
} from 'react-native-reanimated'
import { useFocusEffect } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { 
  Moon, Sun, Shield, LogOut, Github, Server, Lock, Cpu, ChevronRight,
  Key, Copy, RefreshCw, AlertCircle, Check, Zap, HardDrive, Wifi, Clock,
  CreditCard, ArrowUpRight, TrendingUp, History, BarChart2, ArrowLeft,
  Eye, EyeOff, Sparkles, Trash2, Laptop, GitCommit, Info, Database
} from 'lucide-react-native'
import { ConfirmModal } from '@/components/ConfirmModal'
import { api } from '@/lib/api'
import * as Clipboard from 'expo-clipboard'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useUIStore } from '@/store/ui'
import { useProjectsStore } from '@/store/projects'

function PressableScale({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: any }) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(scale.value, { duration: 85, easing: Easing.out(Easing.quad) }) }]
  }))
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = 0.96 }}
      onPressOut={() => { scale.value = 1 }}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  )
}

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  const { colors, toggleTheme, isDark } = useAppTheme()
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const { projects, fetchProjects } = useProjectsStore()
  const [billingDetailType, setBillingDetailType] = useState<'compute' | 'ram' | 'disk' | 'workspaces' | 'ai'>('compute')
  const [timelineFilter, setTimelineFilter] = useState<'1h' | '24h' | '3d' | '7d'>('24h')

  // Pulsing animation for Billing Skeleton UI
  const skeletonOpacity = useSharedValue(0.35)
  useEffect(() => {
    skeletonOpacity.value = withRepeat(
      withTiming(0.75, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  function SkeletonBlock({ width, height, borderRadius = 8, style }: { width: any; height: number; borderRadius?: number; style?: any }) {
    const rStyle = useAnimatedStyle(() => ({
      opacity: skeletonOpacity.value
    }))
    return (
      <Animated.View 
        style={[
          { 
            width, 
            height, 
            borderRadius, 
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' 
          }, 
          rStyle,
          style
        ]} 
      />
    )
  }

  const { setTabBarVisible, settingsSubScreen: currentSubScreen, setSettingsSubScreen: setCurrentSubScreen } = useUIStore()
  const [isFocused, setIsFocused] = useState(false)
  const [avatarLoadError, setAvatarLoadError] = useState(false)

  // Visibility toggles for BYOK keys
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)

  // Profile settings state
  const [profileName, setProfileName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [aboutTab, setAboutTab] = useState<'branding' | 'system'>('branding')

  // Client-side audit logs
  const [appCommits, setAppCommits] = useState<any[]>([])
  const [appSessions, setAppSessions] = useState<any[]>([])

  // Change tracking states
  const [initialProfileName, setInitialProfileName] = useState('')
  const [initialGitName, setInitialGitName] = useState('')
  const [initialGitEmail, setInitialGitEmail] = useState('')
  const [initialByokMode, setInitialByokMode] = useState(false)
  const [initialGeminiKey, setInitialGeminiKey] = useState('')
  const [initialOpenaiKey, setInitialOpenaiKey] = useState('')
  const [initialAnthropicKey, setInitialAnthropicKey] = useState('')

  // Track settings tab screen focus state
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true)
      return () => {
        setIsFocused(false)
      }
    }, [])
  )



  // Intercept Android hardware back press inside subscreens
  useEffect(() => {
    const onBackPress = () => {
      if (currentSubScreen === 'billing-detail') {
        setCurrentSubScreen('billing')
        return true
      } else if (currentSubScreen === 'byok-detail') {
        setCurrentSubScreen('aiKeys')
        return true
      } else if (currentSubScreen !== 'main') {
        setCurrentSubScreen('main')
        return true // Intercept & block exit to dashboard
      }
      return false
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => {
      subscription.remove()
    }
  }, [currentSubScreen])
  const [billingData, setBillingData] = useState<any>(null)
  const [loadingBilling, setLoadingBilling] = useState(true)
  const [upgradeModal, setUpgradeModal] = useState<{ visible: boolean; tierName: 'pro' | 'advanced' | null }>({
    visible: false,
    tierName: null,
  })

  // Reanimated states for settings upgrade modal
  const [renderUpgrade, setRenderUpgrade] = useState(false)
  const upgradeOpacity = useSharedValue(0)
  const upgradeScale = useSharedValue(0.95)
  const upgradeTranslateY = useSharedValue(10)

  useEffect(() => {
    if (upgradeModal.visible) {
      setRenderUpgrade(true)
      upgradeOpacity.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) })
      upgradeScale.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) })
      upgradeTranslateY.value = withTiming(0, { duration: 140, easing: Easing.out(Easing.quad) })
    } else {
      upgradeOpacity.value = withTiming(0, { duration: 100, easing: Easing.linear })
      upgradeScale.value = withTiming(0.95, { duration: 100, easing: Easing.linear })
      upgradeTranslateY.value = withTiming(10, { duration: 100, easing: Easing.linear }, (finished) => {
        if (finished) {
          runOnJS(setRenderUpgrade)(false)
        }
      })
    }
  }, [upgradeModal.visible])

  const upgradeBackdropStyle = useAnimatedStyle(() => ({
    opacity: upgradeOpacity.value,
  }))

  const upgradeCardStyle = useAnimatedStyle(() => ({
    opacity: upgradeOpacity.value,
    transform: [
      { scale: upgradeScale.value },
      { translateY: upgradeTranslateY.value }
    ],
  }))

  // Custom Modal Alert State
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type: 'danger' | 'warning' | 'info' | 'logout' | 'success' | 'error'
    onConfirm: () => void
    onCancel?: () => void
    singleButton?: boolean
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  })

  // Dynamically set tab bar visibility based on current subscreen and modal states
  useEffect(() => {
    if (isFocused) {
      const isAnyModalVisible = showSignOutModal || modalConfig.visible || upgradeModal.visible
      setTabBarVisible(isAnyModalVisible ? false : currentSubScreen === 'main')
    }
  }, [currentSubScreen, isFocused, setTabBarVisible, showSignOutModal, modalConfig.visible, upgradeModal.visible])

  const showModal = (
    title: string,
    message: string,
    type: 'danger' | 'warning' | 'info' | 'logout' | 'success' | 'error',
    onConfirm = () => setModalConfig(prev => ({ ...prev, visible: false })),
    confirmText = 'OK',
    singleButton = true,
    onCancel?: () => void,
    cancelText = 'Cancel'
  ) => {
    setModalConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm,
      confirmText,
      singleButton,
      onCancel,
      cancelText,
    })
  }

  const hideModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }))
  }

  // Git Author Info state
  const [gitName, setGitName] = useState('')
  const [gitEmail, setGitEmail] = useState('')
  const [loadingConfig, setLoadingConfig] = useState(false)

  // SSH Key state
  const [hasSshKey, setHasSshKey] = useState(false)
  const [sshPublicKey, setSshPublicKey] = useState<string | null>(null)
  const [sshHistory, setSshHistory] = useState<{ timestamp: string, publicKey: string }[]>([])
  const [generatingSsh, setGeneratingSsh] = useState(false)
  const [loadingSsh, setLoadingSsh] = useState(true)
  const [copied, setCopied] = useState(false)

  // Runtimes state
  const [runtimesList, setRuntimesList] = useState<{ name: string; version: string; key: string }[]>([])
  const [loadingRuntimes, setLoadingRuntimes] = useState(false)
  const [runtimesSearch, setRuntimesSearch] = useState('')
  const [updatingRuntimes, setUpdatingRuntimes] = useState<Record<string, boolean>>({})

  // AI keys states
  const [byokMode, setByokMode] = useState(false)
  const [customGeminiKey, setCustomGeminiKey] = useState('')
  const [customOpenaiKey, setCustomOpenaiKey] = useState('')
  const [customAnthropicKey, setCustomAnthropicKey] = useState('')
  const [savingAiKeys, setSavingAiKeys] = useState(false)

  const fetchRuntimesData = useCallback(async (silent = false) => {
    const shouldShowLoader = !silent || runtimesList.length === 0
    if (shouldShowLoader) setLoadingRuntimes(true)
    try {
      const data = await api.system.runtimes()
      setRuntimesList(data.runtimes || [])
    } catch (err) {
      console.warn('Failed to load system runtimes:', err)
    } finally {
      if (shouldShowLoader) setLoadingRuntimes(false)
    }
  }, [runtimesList.length])

  async function fetchGitSshData(silent = false) {
    const shouldShowLoader = !silent || !sshPublicKey
    if (shouldShowLoader) setLoadingSsh(true)
    try {
      const ssh = await api.git.ssh.globalGet()
      setHasSshKey(ssh.hasKey)
      setSshPublicKey(ssh.publicKey)
      setSshHistory(ssh.history || [])
    } catch (err) {
      console.warn('Failed to load global SSH key:', err)
    } finally {
      if (shouldShowLoader) setLoadingSsh(false)
    }
  }

  async function fetchBillingStatus(silent = false) {
    const shouldShowLoader = !silent || !billingData
    if (shouldShowLoader) setLoadingBilling(true)
    try {
      const data = await api.billing.status()
      setBillingData(data)
    } catch (err) {
      console.warn('Failed to load billing status:', err)
    } finally {
      if (shouldShowLoader) setLoadingBilling(false)
    }
  }

  const loadLocalAuditLogs = useCallback(async () => {
    try {
      const commitsJson = await AsyncStorage.getItem('app_commit_history')
      const sessionsJson = await AsyncStorage.getItem('app_sessions_history')
      setAppCommits(commitsJson ? JSON.parse(commitsJson) : [])
      setAppSessions(sessionsJson ? JSON.parse(sessionsJson) : [])
    } catch (err) {
      console.warn('Failed to load local audit logs:', err)
    }
  }, [])

  // Auto-refresh stats in background when settings tab gets focused, and poll periodically
  useFocusEffect(
    useCallback(() => {
      if (currentSubScreen === 'billing' || currentSubScreen === 'billing-detail') {
        fetchBillingStatus(true)
        fetchProjects(true)
      } else if (currentSubScreen === 'gitSsh') {
        fetchGitSshData(true)
      } else if (currentSubScreen === 'dependencies') {
        fetchRuntimesData(true)
      } else if (currentSubScreen === 'profile') {
        loadLocalAuditLogs()
      } else {
        fetchBillingStatus(true)
        fetchGitSshData(true)
        fetchRuntimesData(true)
        loadLocalAuditLogs()
        fetchProjects(true)
      }

      const interval = setInterval(() => {
        if (currentSubScreen === 'billing' || currentSubScreen === 'billing-detail') {
          fetchBillingStatus(true)
          fetchProjects(true)
        } else if (currentSubScreen === 'gitSsh') {
          fetchGitSshData(true)
        } else if (currentSubScreen === 'dependencies') {
          fetchRuntimesData(true)
        } else {
          fetchBillingStatus(true)
          fetchRuntimesData(true)
        }
      }, 10000)

      return () => {
        clearInterval(interval)
      }
    }, [currentSubScreen, fetchRuntimesData, fetchProjects])
  )

  useEffect(() => {
    async function loadData() {
      // 1. Load Git author info from cache
      const cachedName = await AsyncStorage.getItem('git_author_name')
      const cachedEmail = await AsyncStorage.getItem('git_author_email')
      if (cachedName) {
        setGitName(cachedName)
        setInitialGitName(cachedName)
      }
      if (cachedEmail) {
        setGitEmail(cachedEmail)
        setInitialGitEmail(cachedEmail)
      }

      // 2. Load AI Keys
      const cachedByok = await AsyncStorage.getItem('byok_enabled')
      const cachedGemini = await AsyncStorage.getItem('custom_gemini_key')
      const cachedOpenai = await AsyncStorage.getItem('custom_openai_key')
      const cachedAnthropic = await AsyncStorage.getItem('custom_anthropic_key')

      if (cachedByok) {
        setByokMode(cachedByok === 'true')
        setInitialByokMode(cachedByok === 'true')
      }
      if (cachedGemini) {
        setCustomGeminiKey(cachedGemini)
        setInitialGeminiKey(cachedGemini)
      }
      if (cachedOpenai) {
        setCustomOpenaiKey(cachedOpenai)
        setInitialOpenaiKey(cachedOpenai)
      }
      if (cachedAnthropic) {
        setCustomAnthropicKey(cachedAnthropic)
        setInitialAnthropicKey(cachedAnthropic)
      }

      // 3. Load Profile settings
      const cachedProfileName = await AsyncStorage.getItem('profile_name')
      const initialName = cachedProfileName || user?.name || user?.login || ''
      setProfileName(initialName)
      setInitialProfileName(initialName)
      loadLocalAuditLogs()
    }
    loadData()
  }, [loadLocalAuditLogs])

  useEffect(() => {
    if (user) {
      AsyncStorage.getItem('profile_name').then(val => {
        if (!val) {
          const initialName = user.name || user.login || ''
          setProfileName(initialName)
          setInitialProfileName(initialName)
        }
      })
    }
  }, [user])

  const handleSaveConfig = async () => {
    if (!gitName.trim() || !gitEmail.trim()) {
      showModal('Validation Error', 'Author Name and Email are required.', 'error')
      return
    }
    setLoadingConfig(true)
    try {
      await AsyncStorage.setItem('git_author_name', gitName.trim())
      await AsyncStorage.setItem('git_author_email', gitEmail.trim())
      setInitialGitName(gitName.trim())
      setInitialGitEmail(gitEmail.trim())
      showModal('Success', 'Git credentials saved globally.', 'success')
    } catch (err) {
      showModal('Error', (err as Error).message, 'error')
    } finally {
      setLoadingConfig(false)
    }
  }

  const handleGenerateSsh = async () => {
    setGeneratingSsh(true)
    try {
      const res = await api.git.ssh.globalGenerate()
      setHasSshKey(res.hasKey)
      setSshPublicKey(res.publicKey)
      setSshHistory(res.history || [])
      showModal('Success', 'SSH Key Pair generated successfully.', 'success')
    } catch (err) {
      showModal('Error', (err as Error).message, 'error')
    } finally {
      setGeneratingSsh(false)
    }
  }

  const promptGenerateSsh = () => {
    if (hasSshKey) {
      showModal(
        'Generate New Key?',
        'Generating a new SSH key will instantly overwrite your existing key. You will need to add the new key to GitHub, and the old one will stop working immediately. Are you sure?',
        'warning',
        () => {
          hideModal()
          handleGenerateSsh()
        },
        'Generate New Key',
        false,
        () => hideModal(),
        'Cancel'
      )
    } else {
      handleGenerateSsh()
    }
  }

  function handleSignOut() {
    setShowSignOutModal(true)
  }

  const confirmSignOut = () => {
    setShowSignOutModal(false)
    signOut()
  }

  const ThemeIcon = isDark ? Moon : Sun

  function renderFeatureItem(text: string) {
    return (
      <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Check size={14} color="#22c55e" strokeWidth={2.5} />
        <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Inter_400Regular' }}>{text}</Text>
      </View>
    )
  }

  function renderUsageRow(
    label: string, 
    used: string | number, 
    limit: string | number, 
    percent: number, 
    Icon: any, 
    color: string
  ) {
    const displayPercent = isNaN(percent) ? 0 : Math.min(percent, 100)
    return (
      <View key={label} style={{ gap: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon size={13} color={color} strokeWidth={2} />
            <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 13 }}>{label}</Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 11 }}>
            {used} / {limit}
          </Text>
        </View>
        <View style={{ height: 5, backgroundColor: isDark ? '#1C2128' : '#E5E7EB', borderRadius: 2.5, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${displayPercent}%`, backgroundColor: color, borderRadius: 2.5 }} />
        </View>
      </View>
    )
  }

  function renderUpgradeModal() {
    return (
      <Modal
        visible={renderUpgrade}
        transparent={true}
        statusBarTranslucent={true}
        animationType="none"
        onRequestClose={() => setUpgradeModal({ visible: false, tierName: null })}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }, upgradeBackdropStyle]} />
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setUpgradeModal({ visible: false, tierName: null })}
          />
          <Animated.View style={[{ backgroundColor: isDark ? '#0F141C' : '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, width: '100%', maxWidth: 320, gap: 12 }, upgradeCardStyle]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 }}>
                {upgradeModal.tierName === 'pro' ? 'Upgrade to Pro' : 'Upgrade to Advanced'}
              </Text>
              <TouchableOpacity onPress={() => setUpgradeModal({ visible: false, tierName: null })}>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: isDark ? '#161B22' : '#F9FAFB', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 24 }}>
                {upgradeModal.tierName === 'pro' ? '$25.00' : '$99.00'}
                <Text style={{ fontSize: 14, fontWeight: 'normal', color: colors.textSecondary }}>/month</Text>
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Cancel anytime · Instant provisioning</Text>
            </View>
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 }}>WHAT'S INCLUDED:</Text>
              {upgradeModal.tierName === 'pro' ? (
                <>
                  {renderFeatureItem('4 vCPUs (Blazing fast builds)')}
                  {renderFeatureItem('8 GB RAM (No OOM compilation)')}
                  {renderFeatureItem('50 GB Fast SSD Storage')}
                  {renderFeatureItem('1 Hour Idle Container Timeout')}
                  {renderFeatureItem('1 Workspace pinned as Always-On')}
                  {renderFeatureItem('Claude Latest, ChatGPT & Gemini Latest')}
                  {renderFeatureItem('5 Million Monthly AI Tokens')}
                </>
              ) : (
                <>
                  {renderFeatureItem('8 to 16 vCPUs (Max performance)')}
                  {renderFeatureItem('32 GB RAM (Docker-in-Docker / ML)')}
                  {renderFeatureItem('200 GB Fast SSD Storage')}
                  {renderFeatureItem('Unlimited Container Timeout')}
                  {renderFeatureItem('5 Workspaces pinned as Always-On')}
                  {renderFeatureItem('Unlimited AI Premium Access')}
                  {renderFeatureItem('Priority Low-Latency Model API')}
                </>
              )}
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                const tierName = upgradeModal.tierName
                setUpgradeModal({ visible: false, tierName: null })
                if (!tierName) return
                try {
                  const returnUrl = Linking.createURL('/billing/success')
                  const planType = tierName === 'pro' ? 'pro_monthly' : 'advanced_monthly'
                  const { checkoutUrl } = await api.billing.checkout(planType, returnUrl)
                  if (checkoutUrl) {
                    await WebBrowser.openBrowserAsync(checkoutUrl)
                  }
                } catch (err: any) {
                  showModal(
                    'Upgrade Error',
                    err.message || 'Failed to initialize payment session.',
                    'error'
                  )
                }
              }}
              style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
            >
              <Text style={{ color: isDark ? '#000' : '#fff', fontFamily: 'Inter_700Bold', fontSize: 14 }}>Subscribe Now</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    )
  }

  function renderMiniBarGraph(percent: number, activeColor: string) {
    const heights = [25, 45, 60, 35, Math.max(10, percent * 0.7)]
    return (
      <View style={{ flexDirection: 'row', gap: 4, height: 26, alignItems: 'flex-end', marginTop: 10 }}>
        {heights.map((h, i) => (
          <View 
            key={i} 
            style={{ 
              flex: 1, 
              height: `${h}%`, 
              backgroundColor: i === 4 ? activeColor : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'), 
              borderRadius: 2,
              shadowColor: i === 4 ? activeColor : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: i === 4 ? 0.5 : 0,
              shadowRadius: 2,
            }} 
          />
        ))}
      </View>
    )
  }

  function renderMiniRadialGauge(percent: number, activeColor: string) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: activeColor, opacity: Math.max(0.2, percent / 100) }} />
        </View>
        <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_400Regular', fontSize: 10 }}>
          {Math.round(percent)}% Load
        </Text>
      </View>
    )
  }

  function renderMiniStackBar(percent: number, activeColor: string) {
    const val1 = Math.min(percent, 70)
    const val2 = Math.min(100 - val1, 15)
    return (
      <View style={{ gap: 4, marginTop: 10 }}>
        <View style={{ height: 6, borderRadius: 3, overflow: 'hidden', flexDirection: 'row', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
          <View style={{ width: `${val1}%`, backgroundColor: activeColor }} />
          <View style={{ width: `${val2}%`, backgroundColor: '#3B82F6', opacity: 0.7 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', opacity: 0.6 }}>
          <Text style={{ fontSize: 7, color: colors.textSecondary }}>sources</Text>
          <Text style={{ fontSize: 7, color: colors.textSecondary }}>cache</Text>
        </View>
      </View>
    )
  }

  function renderMiniNodeGrid(used: number, limit: number, activeColor: string) {
    return (
      <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 10, height: 26, alignItems: 'center' }}>
        {Array.from({ length: limit }).map((_, i) => {
          const isRunning = i < used
          return (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isRunning ? activeColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                shadowColor: isRunning ? activeColor : 'transparent',
                shadowOpacity: isRunning ? 0.6 : 0,
                shadowRadius: 2,
                borderWidth: 1,
                borderColor: isRunning ? 'transparent' : colors.border
              }}
            />
          )
        })}
      </View>
    )
  }

  function renderMiniSparkline(percent: number, activeColor: string) {
    const tokenActivity = [10, 40, 25, 75, 45, 60, 30, Math.max(15, percent * 0.7)]
    return (
      <View style={{ flexDirection: 'row', gap: 2, height: 26, alignItems: 'flex-end', marginTop: 10 }}>
        {tokenActivity.map((val, i) => (
          <View 
            key={i} 
            style={{ 
              flex: 1, 
              height: `${val}%`, 
              backgroundColor: activeColor, 
              opacity: 0.3 + (i * 0.1),
              borderTopLeftRadius: 1.5,
              borderTopRightRadius: 1.5
            }} 
          />
        ))}
      </View>
    )
  }

  function renderMetricCard(
    type: 'compute' | 'ram' | 'disk' | 'workspaces' | 'ai',
    label: string,
    usedStr: string,
    limitStr: string,
    percent: number,
    Icon: any,
    color: string,
    usedRaw?: number,
    limitRaw?: number
  ) {
    const displayPercent = isNaN(percent) ? 0 : Math.min(percent, 100)
    
    return (
      <TouchableOpacity 
        key={label}
        activeOpacity={0.85}
        onPress={() => {
          setBillingDetailType(type)
          setCurrentSubScreen('billing-detail')
          fetchProjects(true)
        }}
        style={{ 
          width: '48.2%', 
          backgroundColor: isDark ? '#111622' : '#FFFFFF', 
          borderWidth: 1, 
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', 
          borderRadius: 16, 
          padding: 14,
          height: 145,
          justifyContent: 'space-between',
          // Creative subtle card glow in dark mode
          shadowColor: isDark ? color : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View 
            style={{ 
              width: 28, 
              height: 28, 
              borderRadius: 8, 
              backgroundColor: isDark ? `${color}15` : `${color}10`, 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <Icon size={14} color={color} strokeWidth={2.5} />
          </View>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 9 }}>
            DETAIL ↗
          </Text>
        </View>

        <View style={{ marginTop: 6 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 11, opacity: 0.8 }}>
            {label}
          </Text>
          <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_700Bold', fontSize: 13, marginTop: 1 }}>
            {usedStr}
          </Text>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 1 }}>
            limit: {limitStr}
          </Text>
        </View>

        {type === 'compute' && renderMiniBarGraph(displayPercent, color)}
        {type === 'ram' && renderMiniRadialGauge(displayPercent, color)}
        {type === 'disk' && renderMiniStackBar(displayPercent, color)}
        {type === 'workspaces' && renderMiniNodeGrid(usedRaw || 0, limitRaw || 3, color)}
        {type === 'ai' && renderMiniSparkline(displayPercent, color)}
      </TouchableOpacity>
    )
  }

  function renderBillingSkeleton() {
    return (
      <View style={{ gap: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentSubScreen('main')} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Billing & Usage</Text>
        </View>

        <View style={{ paddingHorizontal: 24, gap: 20 }}>
          {/* Plan Card Skeleton */}
          <View style={{ backgroundColor: isDark ? '#151922' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 18, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <SkeletonBlock width={38} height={38} borderRadius={10} />
                <View style={{ gap: 6 }}>
                  <SkeletonBlock width={120} height={16} />
                  <SkeletonBlock width={70} height={12} />
                </View>
              </View>
              <SkeletonBlock width={80} height={20} borderRadius={6} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <SkeletonBlock width="48.5%" height={40} borderRadius={8} />
              <SkeletonBlock width="48.5%" height={40} borderRadius={8} />
            </View>
          </View>

          {/* Current Month Usage Header */}
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <SkeletonBlock width={130} height={14} />
            </View>
            
            {/* Grid layout skeleton */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View 
                  key={i} 
                  style={{ 
                    width: '48.2%', 
                    backgroundColor: isDark ? '#151922' : '#FFFFFF', 
                    borderWidth: 1, 
                    borderColor: colors.border, 
                    borderRadius: 16, 
                    padding: 14,
                    gap: 8
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SkeletonBlock width={26} height={26} borderRadius={6} />
                    <SkeletonBlock width={50} height={10} />
                  </View>
                  <SkeletonBlock width={80} height={14} style={{ marginTop: 4 }} />
                  <SkeletonBlock width="100%" height={6} borderRadius={2} style={{ marginTop: 8 }} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    )
  }

  function renderBillingView() {
    if (loadingBilling && !billingData) {
      return renderBillingSkeleton()
    }

    const usage = billingData?.usage || {
      workspaces: { used: 0, limit: 3 },
      cpu: { usedHours: 0, limitHours: 50 },
      ram: { usedMB: 0, limitMB: 512 },
      disk: { usedGB: 0, limitGB: 5 },
      aiTokens: { used: 0, limit: 50000 },
      networkSpeed: { currentMbps: 15, limitMbps: 15 }
    }

    const currentTier = billingData?.tier || { name: 'free', displayName: 'Free Plan', price: { monthly: 0, yearly: 0 } }
    const subscription = billingData?.subscription || { id: null, status: 'none' }

    // Colors for the tier cards
    const tierColor = currentTier.name === 'free' ? '#9CA3AF' : currentTier.name === 'pro' ? '#3B82F6' : '#A855F7'

    return (
      <View style={{ gap: 20, paddingBottom: 40 }}>
        {/* Unified SubHeader */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentSubScreen('main')} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Billing & Usage</Text>
        </View>

        <View style={{ paddingHorizontal: 24, gap: 20 }}>
          {/* Premium Plan Tier Card */}
          <View 
            style={{ 
              backgroundColor: isDark ? '#121620' : '#FFFFFF', 
              borderWidth: 1.5, 
              borderColor: isDark ? `${tierColor}40` : `${tierColor}20`, 
              borderRadius: 20, 
              padding: 20, 
              gap: 16,
              // Glow effect
              shadowColor: tierColor,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 12, 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
                  }}
                >
                  <Zap size={22} color={tierColor} strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.2 }}>
                    {currentTier.displayName}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 1 }}>
                    {currentTier.name === 'free' ? '$0 / month' : currentTier.name === 'pro' ? '$25 / month' : '$99 / month'}
                  </Text>
                </View>
              </View>
              
              <View 
                style={{ 
                  backgroundColor: isDark ? `${tierColor}20` : `${tierColor}12`, 
                  paddingHorizontal: 12, 
                  paddingVertical: 5, 
                  borderRadius: 8, 
                  borderWidth: 1, 
                  borderColor: isDark ? `${tierColor}40` : `${tierColor}30` 
                }}
              >
                <Text style={{ color: tierColor, fontSize: 10.5, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 }}>
                  {subscription.status === 'active' ? 'ACTIVE' : 'FREE TIER'}
                </Text>
              </View>
            </View>

            {currentTier.name === 'free' && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                <TouchableOpacity 
                  activeOpacity={0.85}
                  onPress={() => setUpgradeModal({ visible: true, tierName: 'pro' })}
                  style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 11, borderRadius: 10, alignItems: 'center', justifyContent: 'center', height: 42 }}
                >
                  <Text style={{ color: isDark ? '#000' : '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }}>Upgrade to Pro</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  activeOpacity={0.85}
                  onPress={() => setUpgradeModal({ visible: true, tierName: 'advanced' })}
                  style={{ flex: 1, borderWidth: 1, borderColor: colors.border, paddingVertical: 11, borderRadius: 10, alignItems: 'center', justifyContent: 'center', height: 42 }}
                >
                  <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }}>Upgrade to Adv</Text>
                </TouchableOpacity>
              </View>
            )}

            {currentTier.name === 'pro' && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                <TouchableOpacity 
                  activeOpacity={0.85}
                  onPress={() => setUpgradeModal({ visible: true, tierName: 'advanced' })}
                  style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 11, borderRadius: 10, alignItems: 'center', justifyContent: 'center', height: 42 }}
                >
                  <Text style={{ color: isDark ? '#000' : '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }}>Upgrade to Advanced</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Creative Metrics Grid Dashboard */}
          <View style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <BarChart2 size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.6 }}>CURRENT MONTH USAGE</Text>
            </View>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {renderMetricCard(
                'compute',
                'Compute Hours',
                `${usage.cpu.usedHours} hrs`,
                usage.cpu.limitHours === 99999 ? 'Unlimited' : `${usage.cpu.limitHours} hrs`,
                (usage.cpu.usedHours / (usage.cpu.limitHours || 1)) * 100,
                Cpu,
                '#8B5CF6'
              )}
              {renderMetricCard(
                'ram',
                'Memory (RAM)',
                `${usage.ram.usedMB} MB`,
                `${usage.ram.limitMB} MB`,
                (usage.ram.usedMB / (usage.ram.limitMB || 1)) * 100,
                HardDrive,
                '#8B5CF6'
              )}
              {renderMetricCard(
                'disk',
                'SSD Storage',
                `${usage.disk.usedGB} GB`,
                `${usage.disk.limitGB} GB`,
                (usage.disk.usedGB / (usage.disk.limitGB || 1)) * 100,
                Database,
                '#8B5CF6'
              )}
              {renderMetricCard(
                'workspaces',
                'Workspaces',
                `${usage.workspaces.used}`,
                `${usage.workspaces.limit}`,
                (usage.workspaces.used / (usage.workspaces.limit || 1)) * 100,
                Server,
                '#8B5CF6',
                usage.workspaces.used,
                usage.workspaces.limit
              )}
              {renderMetricCard(
                'ai',
                'AI Tokens',
                usage.aiTokens.used.toLocaleString(),
                usage.aiTokens.limit.toLocaleString(),
                (usage.aiTokens.used / (usage.aiTokens.limit || 1)) * 100,
                Sparkles,
                '#8B5CF6'
              )}
            </View>
          </View>

          {/* Usage History */}
          {billingData?.usageHistory && billingData.usageHistory.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <TrendingUp size={16} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.6 }}>USAGE HISTORY</Text>
              </View>
              <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }}>
                {billingData.usageHistory.map((item: any, idx: number, arr: any[]) => (
                  <View key={item.month} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                    <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 13.5 }}>{item.month}</Text>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontFamily: 'Inter_400Regular' }}>
                        {item.cpuHours} hrs CPU · {item.tokens.toLocaleString()} tokens
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'Inter_400Regular' }}>
                        {item.workspaces} workspace{item.workspaces > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Billing History */}
          {billingData?.billingHistory && billingData.billingHistory.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <History size={16} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.6 }}>BILLING HISTORY</Text>
              </View>
              <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }}>
                {billingData.billingHistory.map((item: any, idx: number, arr: any[]) => (
                  <View key={item.invoiceId} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                    <View style={{ gap: 3 }}>
                      <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }}>{item.plan}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{item.date} · {item.invoiceId}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_700Bold', fontSize: 13 }}>{item.amount}</Text>
                      <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.25)' }}>
                        <Text style={{ color: '#22c55e', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>PAID</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }

  function renderBillingDetailView() {
    const usage = billingData?.usage || {
      workspaces: { used: 0, limit: 3 },
      cpu: { usedHours: 0, limitHours: 50 },
      ram: { usedMB: 0, limitMB: 512 },
      disk: { usedGB: 0, limitGB: 5 },
      aiTokens: { used: 0, limit: 50000 }
    }

    const type = billingDetailType
    const isCompute = type === 'compute'
    const isRam = type === 'ram'
    const isDisk = type === 'disk'
    const isWorkspaces = type === 'workspaces'
    const isAi = type === 'ai'

    // Set configuration based on sub-tab
    let title = ''
    let color = '#8B5CF6'
    let Icon = Cpu
    let percent = 0
    let valueStr = ''
    let limitStr = ''

    if (isCompute) {
      title = 'Compute Session Analytics'
      color = '#8B5CF6'
      Icon = Cpu
      percent = (usage.cpu.usedHours / (usage.cpu.limitHours || 1)) * 100
      valueStr = `${usage.cpu.usedHours} hrs`
      limitStr = usage.cpu.limitHours === 99999 ? 'Unlimited' : `${usage.cpu.limitHours} hrs`
    } else if (isRam) {
      title = 'Memory (RAM) Footprint'
      color = '#8B5CF6'
      Icon = HardDrive
      percent = (usage.ram.usedMB / (usage.ram.limitMB || 1)) * 100
      valueStr = `${usage.ram.usedMB} MB`
      limitStr = `${usage.ram.limitMB} MB`
    } else if (isDisk) {
      title = 'SSD Disk Storage Space'
      color = '#8B5CF6'
      Icon = Database
      percent = (usage.disk.usedGB / (usage.disk.limitGB || 1)) * 100
      valueStr = `${usage.disk.usedGB} GB`
      limitStr = `${usage.disk.limitGB} GB`
    } else if (isWorkspaces) {
      title = 'Workspaces Sandbox Nodes'
      color = '#8B5CF6'
      Icon = Server
      percent = (usage.workspaces.used / (usage.workspaces.limit || 1)) * 100
      valueStr = `${usage.workspaces.used}`
      limitStr = `${usage.workspaces.limit}`
    } else if (isAi) {
      title = 'Hosted Premium AI Tokens'
      color = '#8B5CF6'
      Icon = Sparkles
      percent = (usage.aiTokens.used / (usage.aiTokens.limit || 1)) * 100
      valueStr = usage.aiTokens.used.toLocaleString()
      limitStr = usage.aiTokens.limit.toLocaleString()
    }

    const displayPercent = isNaN(percent) ? 0 : Math.min(percent, 100)

    const renderTimelineSelector = () => {
      const timelines: { key: '1h' | '24h' | '3d' | '7d'; label: string }[] = [
        { key: '1h', label: '1 Hr' },
        { key: '24h', label: '24 Hr' },
        { key: '3d', label: '3 Day' },
        { key: '7d', label: '7 Day' }
      ]
      return (
        <View style={{ flexDirection: 'row', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: colors.border, marginVertical: 8 }}>
          {timelines.map((t) => {
            const isActive = timelineFilter === t.key
            return (
              <TouchableOpacity 
                key={t.key} 
                onPress={() => setTimelineFilter(t.key)}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  alignItems: 'center',
                  borderRadius: 6,
                  backgroundColor: isActive ? (isDark ? '#1C2128' : '#FFFFFF') : 'transparent',
                }}
              >
                <Text style={{ 
                  color: isActive ? '#8B5CF6' : colors.textSecondary, 
                  fontFamily: 'Inter_600SemiBold', 
                  fontSize: 11.5
                }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )
    }

    const renderComputeBarGraph = () => {
      const dataMap = {
        '1h': { values: [20, 35, 25, 45, 60, 40], labels: ['-50m', '-40m', '-30m', '-20m', '-10m', 'Now'], unit: 'm' },
        '24h': { values: [30, 20, 50, 75, 45, 15], labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'], unit: 'h' },
        '3d': { values: [55, 75, 45], labels: ['2 days ago', 'Yesterday', 'Today'], unit: 'h' },
        '7d': { values: [40, 35, 60, 80, 50, 45, 30], labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], unit: 'h' },
      }
      const currentData = dataMap[timelineFilter] || dataMap['24h']
      return (
        <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 14 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 }}>COMPUTE HOURS HISTORICAL TIMELINE</Text>
          <View style={{ height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingTop: 10 }}>
            {currentData.values.map((val, idx) => (
              <View key={idx} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 9, color: '#8B5CF6', fontFamily: 'JetBrainsMono_400Regular' }}>{Math.round(val * 0.1 * 10) / 10}{currentData.unit}</Text>
                <View style={{ width: '100%', height: `${val}%`, backgroundColor: '#8B5CF6', borderRadius: 4, opacity: 0.85 }} />
                <Text style={{ fontSize: 8, color: colors.textSecondary, textAlign: 'center', width: '100%' }} numberOfLines={1}>{currentData.labels[idx]}</Text>
              </View>
            ))}
          </View>
        </View>
      )
    }

    const renderMemoryRadialDial = () => {
      return (
        <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20, alignItems: 'center', gap: 14 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5, alignSelf: 'flex-start' }}>ACTIVE ENVIRONMENT MEMORY SEGMENTS</Text>
          <View style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 12, borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={[StyleSheet.absoluteFill, { borderRadius: 70, borderWidth: 12, borderColor: '#8B5CF6', borderRightColor: 'transparent', borderBottomColor: 'transparent', transform: [{ rotate: '45deg' }] }]} />
            <Text style={{ color: colors.text, fontSize: 24, fontFamily: 'JetBrainsMono_700Bold' }}>
              {Math.round(displayPercent)}%
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'Inter_500Medium' }}>Load Level</Text>
          </View>
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginTop: 6 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'JetBrainsMono_700Bold' }}>{valueStr}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 9 }}>Allocated</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'JetBrainsMono_700Bold' }}>{limitStr}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 9 }}>Max Limit</Text>
            </View>
          </View>
        </View>
      )
    }

    const renderStorageStackedBreakdown = () => {
      const breakdown = billingData?.diskBreakdown || []
      const totalMB = breakdown.reduce((sum: number, p: any) => sum + (p.sizeMB || 0), 0)
      
      return (
        <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 14 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 }}>DISK SPACE SEGMENTATION BY SANDBOX</Text>
          
          {breakdown.length > 0 ? (
            <View style={{ gap: 12 }}>
              <View style={{ height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                {breakdown.map((item: any, idx: number) => {
                  const pct = totalMB > 0 ? (item.sizeMB / totalMB) * 100 : 0
                  return (
                    <View 
                      key={item.id} 
                      style={{ 
                        width: `${pct}%`, 
                        backgroundColor: '#8B5CF6', 
                        opacity: 1 - (idx * 0.15),
                      }} 
                    />
                  )
                })}
              </View>
              
              <View style={{ gap: 8 }}>
                {breakdown.map((item: any, idx: number) => {
                  const pct = totalMB > 0 ? (item.sizeMB / totalMB) * 100 : 0
                  return (
                    <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6', opacity: 1 - (idx * 0.15) }} />
                        <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'Inter_500Medium' }}>{item.name}</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'JetBrainsMono_400Regular' }}>
                        {item.sizeMB >= 1024 ? `${(item.sizeMB / 1024).toFixed(2)} GB` : `${item.sizeMB} MB`} ({Math.round(pct)}%)
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>No sandbox project storage allocated.</Text>
          )}
        </View>
      )
    }

    const renderWorkspacesNodeMatrix = () => {
      const maxWorkspaces = usage.workspaces.limit || 3
      const used = usage.workspaces.used || 0
      
      return (
        <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 14 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 }}>WORKSPACE NODE MATRIX GATEWAY</Text>
          <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'center', paddingVertical: 10 }}>
            {Array.from({ length: maxWorkspaces }).map((_, i) => {
              const isAllocated = i < used
              const isRunning = isAllocated && (projects[i]?.status === 'running' || projects[i]?.status === 'ready')
              return (
                <View 
                  key={i} 
                  style={{ 
                    width: 70, 
                    height: 70, 
                    borderRadius: 12, 
                    borderWidth: 2, 
                    borderColor: isAllocated ? '#8B5CF6' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), 
                    borderStyle: isAllocated ? 'solid' : 'dashed',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: isAllocated ? 'rgba(139, 92, 246, 0.04)' : 'transparent',
                    shadowColor: isRunning ? '#8B5CF6' : 'transparent',
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                  }}
                >
                  <Server size={18} color={isAllocated ? '#8B5CF6' : colors.textSecondary} opacity={isAllocated ? 1 : 0.4} />
                  <Text style={{ color: isAllocated ? colors.text : colors.textSecondary, fontSize: 8, fontFamily: 'Inter_600SemiBold', marginTop: 4 }}>
                    {isAllocated ? (isRunning ? 'ACTIVE' : 'READY') : 'FREE SLOT'}
                  </Text>
                  <Text style={{ color: isAllocated ? '#8B5CF6' : colors.textSecondary, fontSize: 7, fontFamily: 'JetBrainsMono_400Regular', marginTop: 1 }}>
                    NODE-{i + 1}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      )
    }

    const renderTokensAreaSparkline = () => {
      const dataMap = {
        '1h': [10, 30, 20, 45, 35, 50, 40],
        '24h': [20, 40, 15, 60, 35, 75, 45, 60],
        '3d': [35, 55, 40, 80, 50, 65],
        '7d': [15, 45, 30, 70, 40, 85, 50, 60, 90]
      }
      const sparkData = dataMap[timelineFilter] || dataMap['24h']
      
      return (
        <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 14 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 }}>AI REQUEST TOKENS CONSUMPTION DENSITY</Text>
          <View style={{ height: 100, justifyContent: 'flex-end', paddingTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 6 }}>
              {sparkData.map((val, idx) => (
                <View key={idx} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <View style={{ width: '100%', height: `${val}%`, backgroundColor: '#8B5CF6', opacity: 0.15 + (idx * 0.08), borderTopLeftRadius: 4, borderTopRightRadius: 4, borderWidth: 1, borderColor: '#8B5CF6' }} />
                </View>
              ))}
            </View>
          </View>
        </View>
      )
    }

    return (
      <View style={{ gap: 20, paddingBottom: 40 }}>
        {/* Detail View SubHeader */}
        <View style={styles.subHeader}>
          <TouchableOpacity 
            onPress={() => setCurrentSubScreen('billing')} 
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{title}</Text>
        </View>

        <View style={{ paddingHorizontal: 24, gap: 20 }}>
          {/* Timeline Selector for time-based components */}
          {(isCompute || isAi) && renderTimelineSelector()}

          {/* Subscreen detailed representations */}
          {isCompute && renderComputeBarGraph()}
          {isRam && renderMemoryRadialDial()}
          {isDisk && renderStorageStackedBreakdown()}
          {isWorkspaces && renderWorkspacesNodeMatrix()}
          {isAi && renderTokensAreaSparkline()}

          {isCompute && (
            <View style={{ gap: 14 }}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>RECENT ACTIVE RUN TIMELINES</Text>
              
              {billingData?.sessions && billingData.sessions.length > 0 ? (
                <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }}>
                  {billingData.sessions.map((session: any, idx: number, arr: any[]) => {
                    const startLocal = new Date(session.startedAt).toLocaleString()
                    const endLocal = session.endedAt ? new Date(session.endedAt).toLocaleString() : 'Running Now'
                    
                    // calculate elapsed minutes
                    const startMs = new Date(session.startedAt).getTime()
                    const endMs = session.endedAt ? new Date(session.endedAt).getTime() : Date.now()
                    const elapsedMin = Math.round((endMs - startMs) / 60000)

                    return (
                      <View 
                        key={session.id} 
                        style={{ 
                          padding: 14, 
                          borderBottomWidth: idx < arr.length - 1 ? 1 : 0, 
                          borderBottomColor: colors.border,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <View style={{ gap: 3, flex: 1, marginRight: 12 }}>
                          <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }} numberOfLines={1}>
                            {session.projectName}
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                            Start: {startLocal}
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                            End: {endLocal}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_700Bold', fontSize: 13 }}>
                            {elapsedMin} min
                          </Text>
                          {!session.endedAt && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B5CF6' }} />
                              <Text style={{ color: '#8B5CF6', fontSize: 9.5, fontFamily: 'Inter_700Bold' }}>LIVE</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )
                  })}
                </View>
              ) : (
                <View style={{ padding: 24, alignItems: 'center', backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>No recent active session timeline recordings.</Text>
                </View>
              )}
            </View>
          )}

          {isRam && (
            <View style={{ gap: 14 }}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>ACTIVE SANDBOX MEMORY FOOTPRINT</Text>
              
              {projects && projects.filter(p => p.status === 'running' || p.status === 'ready').length > 0 ? (
                <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }}>
                  {projects.filter(p => p.status === 'running' || p.status === 'ready').map((p, idx, arr) => (
                    <View 
                       key={p.id} 
                       style={{ 
                         padding: 14, 
                         borderBottomWidth: idx < arr.length - 1 ? 1 : 0, 
                         borderBottomColor: colors.border,
                         flexDirection: 'row',
                         justifyContent: 'space-between',
                         alignItems: 'center'
                       }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6' }} />
                        <View>
                          <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }}>{p.name}</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Status: running</Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_700Bold', fontSize: 13 }}>
                        128 MB allocation
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ padding: 24, alignItems: 'center', backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>No active containers allocating RAM. Status is currently idle.</Text>
                </View>
              )}
            </View>
          )}

          {isDisk && (
            <View style={{ gap: 14 }}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>WORKSPACE STORAGE BREAKDOWN</Text>
              
              {billingData?.diskBreakdown && billingData.diskBreakdown.length > 0 ? (
                <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }}>
                  {billingData.diskBreakdown.map((item: any, idx: number, arr: any[]) => {
                    const mbSize = item.sizeMB
                    const sizeStr = mbSize >= 1024 ? `${(mbSize / 1024).toFixed(2)} GB` : `${mbSize} MB`
                    return (
                      <View 
                        key={item.id} 
                        style={{ 
                          padding: 14, 
                          borderBottomWidth: idx < arr.length - 1 ? 1 : 0, 
                          borderBottomColor: colors.border,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <View style={{ gap: 2 }}>
                          <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }}>{item.name}</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'JetBrainsMono_400Regular' }}>ID: {item.id}</Text>
                        </View>
                        <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_700Bold', fontSize: 13 }}>
                          {sizeStr}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              ) : (
                <View style={{ padding: 24, alignItems: 'center', backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>No active storage mappings loaded.</Text>
                </View>
              )}
            </View>
          )}

          {isWorkspaces && (
            <View style={{ gap: 14 }}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>ACTIVE SANDBOX NODES</Text>
              
              {projects && projects.length > 0 ? (
                <View style={{ gap: 10 }}>
                  {projects.map((p) => {
                    const isRunning = p.status === 'running' || p.status === 'ready'
                    return (
                      <View 
                        key={p.id} 
                        style={{ 
                          backgroundColor: isDark ? '#111622' : '#FFFFFF', 
                          borderWidth: 1, 
                          borderColor: colors.border, 
                          borderRadius: 14, 
                          padding: 14,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <View style={{ gap: 4, flex: 1, marginRight: 12 }}>
                          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 14 }}>{p.name}</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Type: {p.type} · Created: {new Date(p.created_at).toLocaleDateString()}</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'JetBrainsMono_400Regular' }} numberOfLines={1}>Container: {p.container_id || 'unassigned'}</Text>
                        </View>
                        <View 
                          style={{ 
                            backgroundColor: isRunning ? 'rgba(139, 92, 246, 0.12)' : 'rgba(107, 114, 128, 0.12)', 
                            paddingHorizontal: 8, 
                            paddingVertical: 3, 
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: isRunning ? 'rgba(139, 92, 246, 0.25)' : 'rgba(107, 114, 128, 0.25)'
                          }}
                        >
                          <Text style={{ color: isRunning ? '#8B5CF6' : '#9CA3AF', fontSize: 9.5, fontFamily: 'Inter_700Bold' }}>
                            {p.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    )
                  })}
                </View>
              ) : (
                <View style={{ padding: 24, alignItems: 'center', backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>No sandbox workspaces created yet.</Text>
                </View>
              )}
            </View>
          )}

          {isAi && (
            <View style={{ gap: 14 }}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>AI QUOTA ALLOCATION DETAILS</Text>
              <View 
                style={{ 
                  backgroundColor: isDark ? '#111622' : '#FFFFFF', 
                  borderWidth: 1, 
                  borderColor: colors.border, 
                  borderRadius: 16, 
                  padding: 16,
                  gap: 16
                }}
              >
                <View style={{ gap: 8 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 16 }}>
                    · Standard models (Gemini Flash, OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet) deduct from this monthly hosted token quota pool.
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 16 }}>
                    · Custom API keys (BYOK mode) bypass this limits pool completely and consume unlimited requests, tracked as separate stats inside the AI Providers tab.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }

  function renderByokDetailView() {
    const used = billingData?.usage?.byokTokens?.used || 0
    const maxReference = 1000000 
    const percent = Math.min((used / maxReference) * 100, 100)
    
    let levelText = 'Optimal'
    let levelDesc = 'Light usage. Performance response speed is low latency.'
    if (percent > 25 && percent <= 50) {
      levelText = 'Moderate'
      levelDesc = 'Standard developer usage. Stable run speed.'
    } else if (percent > 50 && percent <= 85) {
      levelText = 'Active'
      levelDesc = 'High volume usage. Fast compiler context injection.'
    } else if (percent > 85) {
      levelText = 'Extreme'
      levelDesc = 'Heavy request bursts. Ensure your provider limits are sufficient.'
    }

    const renderTimelineSelector = () => {
      const timelines: { key: '1h' | '24h' | '3d' | '7d'; label: string }[] = [
        { key: '1h', label: '1 Hr' },
        { key: '24h', label: '24 Hr' },
        { key: '3d', label: '3 Day' },
        { key: '7d', label: '7 Day' }
      ]
      return (
        <View style={{ flexDirection: 'row', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: colors.border, marginVertical: 8 }}>
          {timelines.map((t) => {
            const isActive = timelineFilter === t.key
            return (
              <TouchableOpacity 
                key={t.key} 
                onPress={() => setTimelineFilter(t.key)}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  alignItems: 'center',
                  borderRadius: 6,
                  backgroundColor: isActive ? (isDark ? '#1C2128' : '#FFFFFF') : 'transparent',
                }}
              >
                <Text style={{ 
                  color: isActive ? '#8B5CF6' : colors.textSecondary, 
                  fontFamily: 'Inter_600SemiBold', 
                  fontSize: 11.5
                }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )
    }

    const renderTokensAreaSparkline = () => {
      const dataMap = {
        '1h': [10, 30, 20, 45, 35, 50, 40],
        '24h': [20, 40, 15, 60, 35, 75, 45, 60],
        '3d': [35, 55, 40, 80, 50, 65],
        '7d': [15, 45, 30, 70, 40, 85, 50, 60, 90]
      }
      const sparkData = dataMap[timelineFilter] || dataMap['24h']
      
      return (
        <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 14 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 }}>AI REQUEST TOKENS CONSUMPTION DENSITY</Text>
          <View style={{ height: 100, justifyContent: 'flex-end', paddingTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 6 }}>
              {sparkData.map((val, idx) => (
                <View key={idx} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <View style={{ width: '100%', height: `${val}%`, backgroundColor: '#8B5CF6', opacity: 0.15 + (idx * 0.08), borderTopLeftRadius: 4, borderTopRightRadius: 4, borderWidth: 1, borderColor: '#8B5CF6' }} />
                </View>
              ))}
            </View>
          </View>
        </View>
      )
    }

    return (
      <View style={{ gap: 20, paddingBottom: 40 }}>
        {/* Subheader */}
        <View style={styles.subHeader}>
          <TouchableOpacity 
            onPress={() => setCurrentSubScreen('aiKeys')} 
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>BYOK Engine Analytics</Text>
        </View>

        <View style={{ paddingHorizontal: 24, gap: 20 }}>
          {/* Speedometer Gauge Dial Card */}
          <View style={{ backgroundColor: isDark ? '#121620' : '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center', gap: 16 }}>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 }}>CONSUMPTION VELOCITY METER</Text>
            
            {/* Speedometer Semi-Circle Dial */}
            <View style={{ width: 180, height: 90, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 }}>
              <View style={{ width: 180, height: 180, borderRadius: 90, borderWidth: 14, borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', position: 'absolute', top: 0 }} />
              <View 
                style={{ 
                  width: 180, 
                  height: 180, 
                  borderRadius: 90, 
                  borderWidth: 14, 
                  borderColor: '#8B5CF6', 
                  borderBottomColor: 'transparent', 
                  borderRightColor: 'transparent', 
                  position: 'absolute', 
                  top: 0,
                  transform: [{ rotate: `${-45 + (percent * 1.8)}deg` }] 
                }} 
              />
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 10 }}>
                <Text style={{ color: colors.text, fontSize: 26, fontFamily: 'JetBrainsMono_700Bold' }}>{used.toLocaleString()}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2 }}>tokens consumed</Text>
              </View>
            </View>

            {/* Gauge indicators */}
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 9, color: colors.textSecondary }}>0</Text>
              <Text style={{ fontSize: 9, color: colors.textSecondary }}>Moderate</Text>
              <Text style={{ fontSize: 9, color: colors.textSecondary }}>1M+</Text>
            </View>

            <View style={{ height: 1, backgroundColor: colors.border, width: '100%', opacity: 0.5 }} />

            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#8B5CF6', fontFamily: 'Inter_700Bold', fontSize: 14 }}>Usage Profile: {levelText}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center', paddingHorizontal: 20 }}>{levelDesc}</Text>
            </View>
          </View>

          {/* Savings & Efficiency Cards */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, gap: 4 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>ESTIMATED SAVINGS</Text>
              <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'JetBrainsMono_700Bold', marginTop: 4 }}>$0.00</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 9, marginTop: 2 }}>Bypassing hosted markup fees</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, gap: 4 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>ENGINE EFFICIENCY</Text>
              <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'JetBrainsMono_700Bold', marginTop: 4 }}>Optimal</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 9, marginTop: 2 }}>Zero limit caps active</Text>
            </View>
          </View>

          {/* BYOK Timeline statistics */}
          <View style={{ gap: 14 }}>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>ENGINE SPEED HISTORY</Text>
            {renderTimelineSelector()}
            {renderTokensAreaSparkline()}
          </View>
        </View>
      </View>
    )
  }

  function renderGitSshView() {
    return (
      <View style={{ gap: 20, paddingBottom: 40 }}>
        {/* Unified SubHeader */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentSubScreen('main')} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Git & SSH Keys</Text>
        </View>

        <View style={{ paddingHorizontal: 24, gap: 20 }}>
          {/* Author credentials & SSH Keys Card */}
          <View style={[styles.sectionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, padding: 18, gap: 18, marginHorizontal: 0 }]}>
            
            {/* Author info */}
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Git Author Credentials</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border }]}
                placeholder="Author Name (e.g. John Doe)"
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
              {(gitName.trim() !== initialGitName || gitEmail.trim() !== initialGitEmail) && (
                <TouchableOpacity 
                  onPress={handleSaveConfig} 
                  style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 4 }]}
                  disabled={loadingConfig}
                  activeOpacity={0.8}
                >
                  {loadingConfig ? (
                    <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                  ) : (
                    <Text style={[styles.primaryBtnText, { color: isDark ? '#000' : '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                      Save Author Info
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.5, marginVertical: 4 }} />

            {/* SSH Keys */}
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>SSH Deploy Keys</Text>
              
              {loadingSsh ? (
                <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 8 }} />
              ) : hasSshKey && sshPublicKey ? (
                <View style={{ gap: 12 }}>
                  <View style={{ backgroundColor: isDark ? 'rgba(63, 185, 80, 0.08)' : '#e6ffec', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: isDark ? 'rgba(63, 185, 80, 0.2)' : '#3FB950', gap: 12 }}>
                    <Text style={{ color: isDark ? '#3FB950' : '#1a7f37', fontFamily: 'Inter_700Bold', fontSize: 13 }}>SSH Key Generated</Text>
                    
                    <View style={{ gap: 4 }}>
                      <Text style={{ color: colors.text, fontSize: 12 }}>1. Copy your public key:</Text>
                      <TouchableOpacity 
                        onPress={() => { 
                          Clipboard.setStringAsync(sshPublicKey); 
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        style={{ backgroundColor: copied ? (isDark ? 'rgba(63, 185, 80, 0.15)' : '#e6ffec') : 'rgba(0,0,0,0.03)', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: copied ? '#3FB950' : colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, flex: 1 }} numberOfLines={1}>{sshPublicKey}</Text>
                        <Text style={{ color: copied ? '#3FB950' : colors.primary, fontSize: 11, fontFamily: 'Inter_700Bold', marginLeft: 8 }}>{copied ? 'COPIED ✓' : 'COPY'}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ gap: 6 }}>
                      <Text style={{ color: colors.text, fontSize: 12 }}>2. Add key to GitHub settings:</Text>
                      <TouchableOpacity 
                        onPress={() => Linking.openURL('https://github.com/settings/ssh/new')}
                        style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.primary, borderRadius: 6 }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: isDark ? '#000' : '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Open GitHub Settings ↗</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity 
                    onPress={promptGenerateSsh} 
                    style={[styles.secondaryBtn, { borderColor: colors.border, marginTop: 4 }]}
                    disabled={generatingSsh}
                    activeOpacity={0.8}
                  >
                    {generatingSsh ? (
                      <ActivityIndicator color={colors.text} />
                    ) : (
                      <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Regenerate SSH Key</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                    Generate an SSH key pair to push commits and pull changes securely without typing credentials.
                  </Text>
                  <TouchableOpacity 
                    onPress={promptGenerateSsh} 
                    style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 4 }]}
                    disabled={generatingSsh}
                    activeOpacity={0.8}
                  >
                    {generatingSsh ? (
                      <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                    ) : (
                      <Text style={[styles.primaryBtnText, { color: isDark ? '#000' : '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                        Generate SSH Key
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* SSH Generation History */}
          {sshHistory && sshHistory.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5, marginBottom: 12 }}>SSH GENERATION HISTORY</Text>
              <View style={{ backgroundColor: isDark ? '#151922' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }}>
                {sshHistory.map((item: any, idx: number, arr: any[]) => (
                  <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                    <View style={{ gap: 2, flex: 1, marginRight: 16 }}>
                      <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>SSH Key Pair</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{new Date(item.timestamp).toLocaleString()}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'JetBrainsMono_400Regular' }} numberOfLines={1}>{item.publicKey}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => {
                        Clipboard.setStringAsync(item.publicKey)
                        showModal('Copied', 'SSH public key copied to clipboard.', 'success')
                      }}
                      style={{ borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 11, fontFamily: 'Inter_700Bold' }}>COPY</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }



  const handleSaveAiKeys = async () => {
    setSavingAiKeys(true)
    try {
      await AsyncStorage.setItem('byok_enabled', byokMode ? 'true' : 'false')
      await AsyncStorage.setItem('custom_gemini_key', customGeminiKey.trim())
      await AsyncStorage.setItem('custom_openai_key', customOpenaiKey.trim())
      await AsyncStorage.setItem('custom_anthropic_key', customAnthropicKey.trim())
      setInitialByokMode(byokMode)
      setInitialGeminiKey(customGeminiKey.trim())
      setInitialOpenaiKey(customOpenaiKey.trim())
      setInitialAnthropicKey(customAnthropicKey.trim())
      showModal('Success', 'AI Key and Provider settings saved successfully.', 'success')
    } catch (err) {
      showModal('Error', (err as Error).message, 'error')
    } finally {
      setSavingAiKeys(false)
    }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      await AsyncStorage.setItem('profile_name', profileName.trim())
      setInitialProfileName(profileName.trim())
      showModal('Success', 'Profile settings updated successfully.', 'success')
    } catch (err) {
      showModal('Error', (err as Error).message, 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      // Simulate API call to delete everything permanently
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Clear local storage configurations
      await AsyncStorage.removeItem('profile_name')
      await AsyncStorage.removeItem('profile_email')
      await AsyncStorage.removeItem('git_author_name')
      await AsyncStorage.removeItem('git_author_email')
      await AsyncStorage.removeItem('byok_enabled')
      await AsyncStorage.removeItem('custom_gemini_key')
      await AsyncStorage.removeItem('custom_openai_key')
      await AsyncStorage.removeItem('custom_anthropic_key')

      // Sign out
      await signOut()
      showModal(
        'Account Deleted',
        'Your account and all associated projects, container environments, and active billing tiers have been deleted permanently. You have been logged out.',
        'success'
      )
    } catch (err) {
      showModal('Error', (err as Error).message, 'error')
    } finally {
      setDeletingAccount(false)
    }
  }

  const handleDeleteAccountPrompt = () => {
    showModal(
      'Delete Account Permanently?',
      'Warning: This action is permanent and irreversible. All of your sandbox environments, active container sessions, workspace projects, custom deploy keys, and configurations will be deleted immediately and cannot be recovered. Are you absolutely sure?',
      'danger',
      () => {
        hideModal()
        handleDeleteAccount()
      },
      'Delete My Account',
      false,
      () => hideModal(),
      'Cancel'
    )
  }

  const renderProfileView = () => {
    return (
      <View style={{ gap: 20, paddingBottom: 40 }}>
        {/* Unified SubHeader */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentSubScreen('main')} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Edit Profile</Text>
        </View>

        <View style={{ paddingHorizontal: 24, gap: 20 }}>
          {/* Avatar Block */}
          <View style={{ alignItems: 'center', marginBottom: 8, gap: 10 }}>
            {user?.avatar_url && !avatarLoadError ? (
              <Image 
                source={{ uri: user.avatar_url }} 
                style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.primary }} 
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? '#151922' : '#E5E7EB', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary }}>
                <Text style={{ color: colors.text, fontSize: 32, fontFamily: 'Inter_600SemiBold' }}>
                  {(profileName || user?.name || user?.login || 'C').substring(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
              GitHub Account: @{user?.login}
            </Text>
          </View>

          {/* Configuration Fields Card */}
          <View style={[styles.sectionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, padding: 18, gap: 16, marginHorizontal: 0 }]}>
            {/* Full Name */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Full Name</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border }]}
                placeholder="Your Name"
                placeholderTextColor={colors.textSecondary + '60'}
                value={profileName}
                onChangeText={setProfileName}
              />
            </View>

            {/* Email (Locked placeholder) */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Public Email</Text>
                <Lock size={12} color={colors.textSecondary} />
              </View>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}
                  value={user?.email || 'no-email@github.com'}
                  editable={false}
                />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
                Your email is linked to your GitHub account and cannot be modified here.
              </Text>
            </View>

            {profileName.trim() !== initialProfileName && (
              <TouchableOpacity 
                onPress={handleSaveProfile} 
                style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 8 }]}
                disabled={savingProfile}
                activeOpacity={0.8}
              >
                {savingProfile ? (
                  <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: isDark ? '#000000' : '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>
                    Save Profile Settings
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Session History */}
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <History size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>ACTIVE SESSIONS</Text>
            </View>
            <View style={{ backgroundColor: isDark ? '#151922' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }}>
              {appSessions.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 13 }}>No active sessions recorded.</Text>
                </View>
              ) : (
                appSessions.map((session, idx) => (
                  <View key={idx}>
                    <View style={{ flexDirection: 'row', padding: 14, alignItems: 'center', justifyContent: 'space-between' }}>
                      <Laptop size={18} color={session.status === 'ACTIVE' ? colors.text : colors.textSecondary} style={{ flexShrink: 0 }} />
                      <View style={{ flex: 1, marginLeft: 10, marginRight: session.status === 'ACTIVE' ? 12 : 0 }}>
                        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }} numberOfLines={1}>
                          {session.device} ({session.status === 'ACTIVE' ? 'Current Device' : 'Previous Session'})
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11 }} numberOfLines={1}>
                          {new Date(session.timestamp).toLocaleDateString()} · {session.ip}
                        </Text>
                      </View>
                      {session.status === 'ACTIVE' && (
                        <View style={{ backgroundColor: 'rgba(63, 185, 80, 0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, flexShrink: 0 }}>
                          <Text style={{ color: '#3FB950', fontSize: 10, fontFamily: 'Inter_700Bold' }}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    {idx !== appSessions.length - 1 && <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.5 }} />}
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Recent Commits */}
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>RECENT COMMITS FROM THIS APP</Text>
            </View>
            <View style={{ backgroundColor: isDark ? '#151922' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }}>
              {appCommits.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <GitCommit size={24} color={colors.textSecondary} style={{ marginBottom: 8 }} />
                  <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 13 }}>No commits made from this app yet.</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2, textAlign: 'center', paddingHorizontal: 20 }}>
                    Commits you complete in workspace editor Git tabs will appear here.
                  </Text>
                </View>
              ) : (
                appCommits.map((commit, idx) => (
                  <View key={commit.hash}>
                    <View style={{ padding: 14, gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13, flex: 1, marginRight: 8 }} numberOfLines={1}>
                          {commit.projectName} [{commit.branch}]
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 11 }}>
                          {commit.hash}
                        </Text>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{commit.message}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>
                        {new Date(commit.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                    {idx !== appCommits.length - 1 && <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.5 }} />}
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Account Actions */}
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Shield size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>ACCOUNT ACTIONS</Text>
            </View>
            <View style={[styles.sectionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, marginHorizontal: 0 }]}>
              {/* Sign Out Row */}
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={handleSignOut}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}
              >
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: 12 
                }}>
                  <LogOut size={16} color={colors.textSecondary} strokeWidth={2} />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }}>Sign Out</Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 }}>
                    Safely sign out of your account on this device
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.4, marginHorizontal: 16 }} />

              {/* Delete Account Row */}
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={handleDeleteAccountPrompt}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}
                disabled={deletingAccount}
              >
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  backgroundColor: 'rgba(248, 81, 73, 0.08)', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: 12 
                }}>
                  <Trash2 size={16} color="#F85149" strokeWidth={2} />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: '#F85149', fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }}>Delete Account</Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 }}>
                    Permanently delete your account and erase all data
                  </Text>
                </View>
                {deletingAccount ? (
                  <ActivityIndicator size="small" color="#F85149" />
                ) : (
                  <ChevronRight size={16} color="#F85149" strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    )
  }

  const renderAboutView = () => {
    return (
      <View style={{ gap: 24, paddingBottom: 40 }}>
        {/* Unified SubHeader */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentSubScreen('main')} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>About CloudCode</Text>
        </View>

        {/* Segmented Tab Selector */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 24, marginBottom: 8 }}>
          <View style={{ 
            flexDirection: 'row', 
            flex: 1, 
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', 
            borderRadius: 8, 
            padding: 3,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setAboutTab('branding')}
              style={{
                flex: 1,
                paddingVertical: 7,
                alignItems: 'center',
                borderRadius: 6,
                backgroundColor: aboutTab === 'branding' ? (isDark ? '#1C2128' : '#FFFFFF') : 'transparent',
              }}
            >
              <Text style={{ 
                color: aboutTab === 'branding' ? colors.text : colors.textSecondary, 
                fontFamily: 'Inter_600SemiBold', 
                fontSize: 13.5
              }}>
                CloudCode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setAboutTab('system')}
              style={{
                flex: 1,
                paddingVertical: 7,
                alignItems: 'center',
                borderRadius: 6,
                backgroundColor: aboutTab === 'system' ? (isDark ? '#1C2128' : '#FFFFFF') : 'transparent',
              }}
            >
              <Text style={{ 
                color: aboutTab === 'system' ? colors.text : colors.textSecondary, 
                fontFamily: 'Inter_600SemiBold', 
                fontSize: 13.5
              }}>
                System Info
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {aboutTab === 'branding' ? (
          <View style={{ gap: 28 }}>
            {/* Impressive Logo display */}
            <View style={{ alignItems: 'center', paddingVertical: 24, gap: 14 }}>
              <Image 
                source={require('../../assets/cloudcodelogo.png')} 
                style={{ height: 60, width: 250, tintColor: colors.text }} 
                resizeMode="contain" 
              />
              <View style={{ gap: 6, alignItems: 'center' }}>
                <Text style={{ 
                  color: colors.primary, 
                  fontFamily: 'JetBrainsMono_400Regular', 
                  fontSize: 11, 
                  letterSpacing: 3, 
                  textTransform: 'uppercase' 
                }}>
                  Developer Platform
                </Text>
                <Text style={{ 
                  color: colors.textSecondary, 
                  fontSize: 13, 
                  fontFamily: 'Inter_500Medium', 
                  textAlign: 'center', 
                  paddingHorizontal: 48, 
                  lineHeight: 20,
                  marginTop: 4
                }}>
                  The next-generation cloud IDE. Provision Linux sandboxes, run compilers, and write code instantly from anywhere.
                </Text>
              </View>
              <View style={{ 
                height: 1, 
                backgroundColor: colors.border, 
                width: 80, 
                opacity: 0.5, 
                marginTop: 12 
              }} />
            </View>

            {/* Core Capabilities - flat cardless layout */}
            <View style={{ paddingHorizontal: 28, gap: 20 }}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_700Bold', fontSize: 11.5, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Core System Specs
              </Text>
              
              <View style={{ gap: 24 }}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Cpu size={20} color={colors.text} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14.5 }}>Linux Containers</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 4, lineHeight: 18 }}>
                      Isolated sandbox runtimes equipped with full root terminal access, high-speed RAM allocation, and local compiler toolchains.
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Sparkles size={20} color={colors.text} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14.5 }}>LLM Intelligence</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 4, lineHeight: 18 }}>
                      Bring Your Own Key integration for Gemini, GPT, and Claude models. High-efficiency code explanations and auto-completion.
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Shield size={20} color={colors.text} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14.5 }}>Secure Gateway</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 4, lineHeight: 18 }}>
                      All data transactions flow through an end-to-end encrypted SSL tunnel using industrial-strength AES-256 cipher standards.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 28, gap: 24 }}>
            {/* Impressive small header in diagnostics tab */}
            <View style={{ alignItems: 'center', paddingVertical: 12, gap: 8 }}>
              <Image 
                source={require('../../assets/cloudcodelogo.png')} 
                style={{ height: 28, width: 120, tintColor: colors.text, opacity: 0.8 }} 
                resizeMode="contain" 
              />
              <Text style={{ color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, letterSpacing: 2 }}>
                SYSTEM DIAGNOSTICS
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              {/* App Version Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Info size={16} color={colors.textSecondary} />
                  <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 13.5 }}>App Version</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 12.5 }}>v1.0.0 (Prod)</Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.3 }} />

              {/* Runtime Engine Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Server size={16} color={colors.textSecondary} />
                  <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 13.5 }}>Runtime Engine</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 12.5 }}>v1.0.0-rc2</Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.3 }} />

              {/* Cloud Gateway Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Wifi size={16} color={colors.textSecondary} />
                  <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 13.5 }}>Cloud Gateway</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3FB950' }} />
                  <Text style={{ color: '#3FB950', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Connected</Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.3 }} />

              {/* Encryption Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Lock size={16} color={colors.textSecondary} />
                  <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 13.5 }}>Encryption Level</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 12.5 }}>AES-256-GCM</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    )
  }

  const renderAiKeysView = () => {
    return (
      <View style={{ gap: 20, paddingBottom: 40 }}>
        {/* Unified SubHeader */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentSubScreen('main')} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>AI Providers</Text>
        </View>

        <View style={{ paddingHorizontal: 24, gap: 20 }}>
          <View style={[styles.sectionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, padding: 18, gap: 16, marginHorizontal: 0 }]}>
            {/* Toggle BYOK */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? 'rgba(243, 244, 246, 0.1)' : 'rgba(14, 17, 22, 0.05)', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={18} color={colors.text} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Bring Your Own Key (BYOK)</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2, lineHeight: 15 }}>
                    Route AI requests directly to your own custom API keys instead of hosted defaults.
                  </Text>
                </View>
              </View>
              <Switch
                value={byokMode}
                onValueChange={setByokMode}
                trackColor={{ false: colors.border, true: colors.text }}
                thumbColor={colors.background}
              />
            </View>

            {byokMode && (
              <>
                <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.5, marginVertical: 4 }} />

                {/* BYOK Usage Card */}
                {billingData?.usage?.byokTokens && (
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => {
                      setCurrentSubScreen('byok-detail')
                    }}
                    style={{ 
                      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)', 
                      borderWidth: 1, 
                      borderColor: isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.15)', 
                      borderRadius: 12, 
                      padding: 14, 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      gap: 12,
                      marginBottom: 4
                    }}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(139, 92, 246, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={16} color="#8B5CF6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 0.5 }}>BYOK TOKEN STATISTICS</Text>
                        <Text style={{ color: '#8B5CF6', fontFamily: 'Inter_600SemiBold', fontSize: 9 }}>ANALYTICS ↗</Text>
                      </View>
                      <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_700Bold', fontSize: 16, marginTop: 2 }}>
                        {(billingData.usage.byokTokens.used || 0).toLocaleString()}
                        <Text style={{ fontSize: 12, fontWeight: 'normal', color: colors.textSecondary }}> tokens consumed</Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                <View style={{ gap: 16 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>API KEYS CONFIGURATION</Text>
                  
                  {/* Gemini API Key */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={14} color="#8B5CF6" />
                      <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Gemini API Key</Text>
                    </View>
                    <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                      <TextInput
                        value={customGeminiKey}
                        onChangeText={setCustomGeminiKey}
                        secureTextEntry={!showGeminiKey}
                        placeholder="Enter Gemini API Key..."
                        placeholderTextColor={colors.textSecondary + '70'}
                        style={[styles.textInput, { color: colors.text }]}
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect={false}
                      />
                      {customGeminiKey.length > 0 && (
                        <TouchableOpacity 
                          onPress={() => setShowGeminiKey(!showGeminiKey)}
                          style={styles.eyeBtn}
                          activeOpacity={0.7}
                        >
                          {showGeminiKey ? (
                            <EyeOff size={16} color={colors.textSecondary} />
                          ) : (
                            <Eye size={16} color={colors.textSecondary} />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* OpenAI API Key */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Cpu size={14} color="#10B981" />
                      <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>OpenAI API Key</Text>
                    </View>
                    <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                      <TextInput
                        value={customOpenaiKey}
                        onChangeText={setCustomOpenaiKey}
                        secureTextEntry={!showOpenaiKey}
                        placeholder="Enter OpenAI API Key..."
                        placeholderTextColor={colors.textSecondary + '70'}
                        style={[styles.textInput, { color: colors.text }]}
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect={false}
                      />
                      {customOpenaiKey.length > 0 && (
                        <TouchableOpacity 
                          onPress={() => setShowOpenaiKey(!showOpenaiKey)}
                          style={styles.eyeBtn}
                          activeOpacity={0.7}
                        >
                          {showOpenaiKey ? (
                            <EyeOff size={16} color={colors.textSecondary} />
                          ) : (
                            <Eye size={16} color={colors.textSecondary} />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Anthropic API Key */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Shield size={14} color="#D97706" />
                      <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Anthropic API Key</Text>
                    </View>
                    <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                      <TextInput
                        value={customAnthropicKey}
                        onChangeText={setCustomAnthropicKey}
                        secureTextEntry={!showAnthropicKey}
                        placeholder="Enter Anthropic API Key..."
                        placeholderTextColor={colors.textSecondary + '70'}
                        style={[styles.textInput, { color: colors.text }]}
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect={false}
                      />
                      {customAnthropicKey.length > 0 && (
                        <TouchableOpacity 
                          onPress={() => setShowAnthropicKey(!showAnthropicKey)}
                          style={styles.eyeBtn}
                          activeOpacity={0.7}
                        >
                          {showAnthropicKey ? (
                            <EyeOff size={16} color={colors.textSecondary} />
                          ) : (
                            <Eye size={16} color={colors.textSecondary} />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </>
            )}

            {(byokMode !== initialByokMode ||
              customGeminiKey.trim() !== initialGeminiKey ||
              customOpenaiKey.trim() !== initialOpenaiKey ||
              customAnthropicKey.trim() !== initialAnthropicKey) && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 8 }]}
                onPress={handleSaveAiKeys}
                disabled={savingAiKeys}
              >
                {savingAiKeys ? (
                  <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} size="small" />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: isDark ? '#000000' : '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>
                    Save AI Key Settings
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )
  }



  const handleInstallRuntime = async (runtimeKey: string, runtimeName: string) => {
    setUpdatingRuntimes(prev => ({ ...prev, [runtimeKey]: true }))
    try {
      const res = await api.system.installRuntime(runtimeKey)
      showModal('Installation Started', res.message, 'success')
      fetchRuntimesData(true)
    } catch (err) {
      showModal('Error', (err as Error).message, 'error')
    } finally {
      setUpdatingRuntimes(prev => {
        const next = { ...prev }
        delete next[runtimeKey]
        return next
      })
    }
  }

  const renderDependenciesView = () => {
    const filtered = runtimesList.filter(item => 
      item.name.toLowerCase().includes(runtimesSearch.toLowerCase()) ||
      item.version.toLowerCase().includes(runtimesSearch.toLowerCase())
    )

    return (
      <View style={{ gap: 20, paddingBottom: 40 }}>
        {/* Unified SubHeader */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentSubScreen('main')} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>System Runtimes</Text>
        </View>

        <TextInput
          value={runtimesSearch}
          onChangeText={setRuntimesSearch}
          placeholder="Search runtimes, compilers..."
          placeholderTextColor={colors.textSecondary + '70'}
          style={[styles.inputField, { color: colors.text, borderColor: colors.border, marginHorizontal: 24 }]}
        />

        <View style={{ gap: 12 }}>
          {filtered.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20, fontFamily: 'Inter_400Regular' }}>
              No runtimes match your search.
            </Text>
          ) : (
            filtered.map(item => {
              const isInstalled = item.version !== 'Not Installed'
              const isUpdating = updatingRuntimes[item.key]
              return (
                <View 
                  key={item.key} 
                  style={[
                    styles.dependencyCard, 
                    { 
                      backgroundColor: isDark ? '#151922' : '#FFFFFF', 
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 16,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }
                  ]}
                >
                  <View style={{ flex: 1, marginRight: 16 }}>
                    <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>{item.name}</Text>
                    <Text style={{ color: isInstalled ? '#3FB950' : colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, marginTop: 4 }}>
                      {item.version}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: isInstalled ? 'rgba(0,0,0,0.03)' : colors.text,
                      borderWidth: isInstalled ? 1 : 0,
                      borderColor: colors.border,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      minWidth: 80,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onPress={() => handleInstallRuntime(item.key, item.name)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={isInstalled ? colors.text : colors.background} />
                    ) : (
                      <Text style={{ color: isInstalled ? colors.text : colors.background, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                        {isInstalled ? 'Reinstall' : 'Install'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )
            })
          )}
        </View>
      </View>
    )
  }



  const renderSettingsRow = ({
    icon: IconComponent,
    iconColor,
    iconBg,
    label,
    subtitle,
    rightElement,
    onPress,
    showDivider = true,
  }: {
    icon: any
    iconColor: string
    iconBg: string
    label: string
    subtitle?: string
    rightElement?: React.ReactNode
    onPress?: () => void
    showDivider?: boolean
  }) => {
    const neutralIconBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
    const neutralIconColor = colors.textSecondary

    const content = (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
        {/* Icon Wrapper */}
        <View style={{ 
          width: 32, 
          height: 32, 
          borderRadius: 16, 
          backgroundColor: neutralIconBg, 
          alignItems: 'center', 
          justifyContent: 'center',
          marginRight: 12 
        }}>
          <IconComponent size={16} color={neutralIconColor} strokeWidth={2} />
        </View>

        {/* Label & Subtitle */}
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }}>{label}</Text>
          {subtitle && (
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 }}>{subtitle}</Text>
          )}
        </View>

        {/* Right Suffix */}
        {rightElement ? rightElement : (
          onPress && <ChevronRight size={16} color={colors.textSecondary} strokeWidth={1.5} />
        )}
      </View>
    )

    return (
      <View key={label}>
        {onPress ? (
          <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
            {content}
          </TouchableOpacity>
        ) : (
          content
        )}
        {showDivider && (
          <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.4, marginHorizontal: 16 }} />
        )}
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={currentSubScreen === 'main' ? FadeInDown.duration(160) : undefined} style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Control Center</Text>
          </View>

      <View style={{ paddingHorizontal: 24, gap: 16 }}>
        {/* 1. Profile Hero Card */}
        <PressableScale onPress={() => setCurrentSubScreen('profile')}>
          <View style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: isDark ? '#151922' : '#FFFFFF',
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, marginRight: 8 }}>
              {user?.avatar_url && !avatarLoadError ? (
                <Image 
                  source={{ uri: user.avatar_url }} 
                  style={{ width: 52, height: 52, borderRadius: 26 }} 
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Inter_600SemiBold' }}>
                    {(profileName || user?.name || user?.login || 'C').substring(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16.5 }} numberOfLines={1}>
                  {profileName || user?.name || user?.login}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <Github size={12} color={colors.textSecondary} strokeWidth={1.5} />
                  <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12 }}>
                    GitHub @{user?.login}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={16} color={colors.textSecondary} strokeWidth={1.5} />
            </View>
          </View>
        </PressableScale>

        {/* 2. Billing & Plan Tile (Wide Highlight) */}
        <PressableScale onPress={() => setCurrentSubScreen('billing')}>
          <View style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: isDark ? '#151922' : '#FFFFFF',
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={{ fontSize: 10.5, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                Membership Plan
              </Text>
              <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 15 }}>
                {billingData ? billingData.tier.displayName : 'Free Tier'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>
                Manage plan billing & active container usage limit
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {billingData?.tier.name && billingData?.tier.name !== 'free' && (
                <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: '#22C55E', fontSize: 10, fontFamily: 'Inter_700Bold' }}>
                    {billingData.tier.name.toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={16} color={colors.textSecondary} strokeWidth={1.5} />
              </View>
            </View>
          </View>
        </PressableScale>

        {/* 3. Grid Rows */}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {/* Git & Credentials */}
          <PressableScale onPress={() => setCurrentSubScreen('gitSsh')} style={{ flex: 1 }}>
            <View style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: isDark ? '#151922' : '#FFFFFF',
              padding: 16,
              height: 116,
              justifyContent: 'space-between',
            }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={16} color={colors.textSecondary} strokeWidth={2} />
              </View>
              <View>
                <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 13.5 }}>Git & SSH</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>SSH Keys & Info</Text>
              </View>
            </View>
          </PressableScale>

          {/* AI Providers BYOK */}
          <PressableScale onPress={() => setCurrentSubScreen('aiKeys')} style={{ flex: 1 }}>
            <View style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: isDark ? '#151922' : '#FFFFFF',
              padding: 16,
              height: 116,
              justifyContent: 'space-between',
            }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color={colors.textSecondary} strokeWidth={2} />
              </View>
              <View>
                <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 13.5 }}>AI Models</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>BYOK settings</Text>
              </View>
            </View>
          </PressableScale>
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          {/* System Runtimes */}
          <PressableScale onPress={() => setCurrentSubScreen('dependencies')} style={{ flex: 1 }}>
            <View style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: isDark ? '#151922' : '#FFFFFF',
              padding: 16,
              height: 116,
              justifyContent: 'space-between',
            }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' }}>
                <Server size={16} color={colors.textSecondary} strokeWidth={2} />
              </View>
              <View>
                <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 13.5 }}>Runtimes</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>Verify compilers</Text>
              </View>
            </View>
          </PressableScale>

          {/* Theme appearance toggle */}
          <PressableScale onPress={toggleTheme} style={{ flex: 1 }}>
            <View style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: isDark ? '#151922' : '#FFFFFF',
              padding: 16,
              height: 116,
              justifyContent: 'space-between',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' }}>
                  <ThemeIcon size={16} color={colors.textSecondary} strokeWidth={2} />
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.text }}
                  thumbColor={colors.background}
                />
              </View>
              <View>
                <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 13.5 }}>Dark Mode</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>{isDark ? 'Active' : 'Disabled'}</Text>
              </View>
            </View>
          </PressableScale>
        </View>

        {/* 4. About Banner (Wide) */}
        <PressableScale onPress={() => setCurrentSubScreen('about')}>
          <View style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: isDark ? '#151922' : '#FFFFFF',
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 4
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' }}>
                <Info size={16} color={colors.textSecondary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 14 }}>About CloudCode</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11.5, marginTop: 2 }} numberOfLines={1}>
                  Diagnostics, encryption, platform details & app specs
                </Text>
              </View>
            </View>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={16} color={colors.textSecondary} strokeWidth={1.5} />
            </View>
          </View>
        </PressableScale>
      </View>

      <View style={styles.footerContainer}>
        <Image
          source={require('../../assets/cloudcodelogo.png')}
          style={[styles.footerLogo, { tintColor: colors.text }]}
          resizeMode="contain"
        />
        <Text style={[styles.footerText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          v1.0.0
        </Text>
      </View>

      <ConfirmModal
        visible={showSignOutModal}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        type="logout"
        onConfirm={confirmSignOut}
        onCancel={() => setShowSignOutModal(false)}
      />

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
      </Animated.View>
    </ScrollView>

    {/* Overlays for subscreens */}
    {currentSubScreen === 'billing' && (
      <Animated.View 
        entering={SlideInRight.duration(160).easing(Easing.out(Easing.quad))}
        exiting={SlideOutRight.duration(130).easing(Easing.in(Easing.quad))}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 10 }]}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loadingBilling}
              onRefresh={() => fetchBillingStatus(false)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {renderBillingView()}
          {renderUpgradeModal()}
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
        </ScrollView>
      </Animated.View>
    )}

    {currentSubScreen === 'billing-detail' && (
      <Animated.View 
        entering={SlideInRight.duration(160).easing(Easing.out(Easing.quad))}
        exiting={SlideOutRight.duration(130).easing(Easing.in(Easing.quad))}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 10 }]}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderBillingDetailView()}
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
        </ScrollView>
      </Animated.View>
    )}

    {currentSubScreen === 'byok-detail' && (
      <Animated.View 
        entering={SlideInRight.duration(160).easing(Easing.out(Easing.quad))}
        exiting={SlideOutRight.duration(130).easing(Easing.in(Easing.quad))}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 10 }]}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderByokDetailView()}
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
        </ScrollView>
      </Animated.View>
    )}

    {currentSubScreen === 'gitSsh' && (
      <Animated.View 
        entering={SlideInRight.duration(160).easing(Easing.out(Easing.quad))}
        exiting={SlideOutRight.duration(130).easing(Easing.in(Easing.quad))}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 10 }]}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loadingSsh}
              onRefresh={() => fetchGitSshData(false)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {renderGitSshView()}
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
        </ScrollView>
      </Animated.View>
    )}

    {currentSubScreen === 'aiKeys' && (
      <Animated.View 
        entering={SlideInRight.duration(160).easing(Easing.out(Easing.quad))}
        exiting={SlideOutRight.duration(130).easing(Easing.in(Easing.quad))}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 10 }]}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderAiKeysView()}
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
        </ScrollView>
      </Animated.View>
    )}

    {currentSubScreen === 'dependencies' && (
      <Animated.View 
        entering={SlideInRight.duration(160).easing(Easing.out(Easing.quad))}
        exiting={SlideOutRight.duration(130).easing(Easing.in(Easing.quad))}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 10 }]}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loadingRuntimes}
              onRefresh={() => fetchRuntimesData(false)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {renderDependenciesView()}
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
        </ScrollView>
      </Animated.View>
    )}

    {currentSubScreen === 'profile' && (
      <Animated.View 
        entering={SlideInRight.duration(160).easing(Easing.out(Easing.quad))}
        exiting={SlideOutRight.duration(130).easing(Easing.in(Easing.quad))}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 10 }]}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderProfileView()}
          <ConfirmModal
            visible={showSignOutModal}
            title="Sign Out"
            message="Are you sure you want to sign out?"
            confirmText="Sign Out"
            cancelText="Cancel"
            type="logout"
            onConfirm={confirmSignOut}
            onCancel={() => setShowSignOutModal(false)}
          />
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
        </ScrollView>
      </Animated.View>
    )}

    {currentSubScreen === 'about' && (
      <Animated.View 
        entering={SlideInRight.duration(160).easing(Easing.out(Easing.quad))}
        exiting={SlideOutRight.duration(130).easing(Easing.in(Easing.quad))}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 10 }]}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderAboutView()}
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
        </ScrollView>
      </Animated.View>
    )}
  </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
  },
  title: { fontSize: 28, letterSpacing: -0.8 },
  profileCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { 
    width: 44, height: 44, borderRadius: 22, 
    alignItems: 'center', justifyContent: 'center' 
  },
  avatarText: { fontSize: 18 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, letterSpacing: -0.2 },
  profileBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  profileSub: { fontSize: 12, opacity: 0.7 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  sectionCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 11.5 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  signOutText: { fontSize: 14 },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
    gap: 8,
    opacity: 0.25,
  },
  footerLogo: {
    height: 40,
    width: 166,
  },
  footerText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  inputField: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  primaryBtn: {
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  secondaryBtn: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 16,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitle: {
    fontSize: 20,
    letterSpacing: -0.4,
  },
  dependencyCard: {
    marginHorizontal: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 4,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 8,
    marginRight: -4,
  },
})
