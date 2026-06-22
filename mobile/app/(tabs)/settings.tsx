import { useState, useEffect, useCallback } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, Switch, ScrollView, 
  TextInput, ActivityIndicator, Alert, Modal, RefreshControl, BackHandler
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { 
  Moon, Sun, Shield, LogOut, Github, Server, Lock, Cpu, ChevronRight,
  Key, Copy, RefreshCw, AlertCircle, Check, Zap, HardDrive, Wifi, Clock,
  CreditCard, ArrowUpRight, TrendingUp, History, BarChart2, ArrowLeft,
  Eye, EyeOff, Sparkles, Trash2, Laptop, GitCommit
} from 'lucide-react-native'
import { ConfirmModal } from '@/components/ConfirmModal'
import { api } from '@/lib/api'
import * as Clipboard from 'expo-clipboard'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useUIStore } from '@/store/ui'

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  const { colors, toggleTheme, isDark } = useAppTheme()
  const [showSignOutModal, setShowSignOutModal] = useState(false)

  const { setTabBarVisible, settingsSubScreen: currentSubScreen, setSettingsSubScreen: setCurrentSubScreen } = useUIStore()
  const [isFocused, setIsFocused] = useState(false)

  // Visibility toggles for BYOK keys
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)

  // Profile settings state
  const [profileName, setProfileName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

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
        setTabBarVisible(true)
      }
    }, [setTabBarVisible])
  )

  // Dynamically set tab bar visibility based on current subscreen
  useEffect(() => {
    if (isFocused) {
      setTabBarVisible(currentSubScreen === 'main')
    }
  }, [currentSubScreen, isFocused, setTabBarVisible])

  // Intercept Android hardware back press inside subscreens
  useEffect(() => {
    const onBackPress = () => {
      if (currentSubScreen !== 'main') {
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
    if (!silent) setLoadingRuntimes(true)
    try {
      const data = await api.system.runtimes()
      setRuntimesList(data.runtimes || [])
    } catch (err) {
      console.warn('Failed to load system runtimes:', err)
    } finally {
      if (!silent) setLoadingRuntimes(false)
    }
  }, [])

  async function fetchGitSshData(silent = false) {
    if (!silent) setLoadingSsh(true)
    try {
      const ssh = await api.git.ssh.globalGet()
      setHasSshKey(ssh.hasKey)
      setSshPublicKey(ssh.publicKey)
      setSshHistory(ssh.history || [])
    } catch (err) {
      console.warn('Failed to load global SSH key:', err)
    } finally {
      if (!silent) setLoadingSsh(false)
    }
  }

  async function fetchBillingStatus(silent = false) {
    if (!silent) setLoadingBilling(true)
    try {
      const data = await api.billing.status()
      setBillingData(data)
    } catch (err) {
      console.warn('Failed to load billing status:', err)
    } finally {
      if (!silent) setLoadingBilling(false)
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
      if (currentSubScreen === 'billing') {
        fetchBillingStatus(true)
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
      }

      const interval = setInterval(() => {
        if (currentSubScreen === 'billing') {
          fetchBillingStatus(true)
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
    }, [currentSubScreen, fetchRuntimesData])
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

      // 2. Load SSH key status
      fetchGitSshData(false)

      // 3. Load Billing status
      fetchBillingStatus(false)

      // 4. Load System Runtimes
      fetchRuntimesData(false)

      // 5. Load AI Keys
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

      // 6. Load Profile settings
      const cachedProfileName = await AsyncStorage.getItem('profile_name')
      const initialName = cachedProfileName || user?.name || user?.login || ''
      setProfileName(initialName)
      setInitialProfileName(initialName)
      loadLocalAuditLogs()
    }
    loadData()
  }, [fetchRuntimesData, loadLocalAuditLogs])

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
        visible={upgradeModal.visible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setUpgradeModal({ visible: false, tierName: null })}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: isDark ? '#0F141C' : '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, width: '100%', maxWidth: 320, gap: 12 }}>
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
          </View>
        </View>
      </Modal>
    )
  }

  function renderBillingView() {
    if (loadingBilling) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 300, paddingTop: 100 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12, fontFamily: 'Inter_500Medium' }}>Loading billing details...</Text>
        </View>
      )
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

    return (
      <View style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 }}>
        <TouchableOpacity 
          onPress={() => setCurrentSubScreen('main')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}
        >
          <ArrowLeft size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Back to Settings</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 24, marginBottom: 20 }}>Billing & Usage</Text>
        <View style={{ backgroundColor: isDark ? '#151922' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 18, marginBottom: 24, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: currentTier.name === 'free' ? 'rgba(107, 114, 128, 0.1)' : 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} color={currentTier.name === 'free' ? '#9CA3AF' : '#3B82F6'} strokeWidth={2} />
              </View>
              <View>
                <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 }}>{currentTier.displayName}</Text>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12 }}>
                  {currentTier.name === 'free' ? '$0 / month' : currentTier.name === 'pro' ? '$25 / month' : '$99 / month'}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: currentTier.name === 'free' ? 'rgba(107, 114, 128, 0.12)' : 'rgba(59, 130, 246, 0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: currentTier.name === 'free' ? '#9CA3AF40' : '#3B82F640' }}>
              <Text style={{ color: currentTier.name === 'free' ? '#9CA3AF' : '#3B82F6', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
                {subscription.status === 'active' ? 'ACTIVE' : 'FREE TIER'}
              </Text>
            </View>
          </View>
          {currentTier.name === 'free' && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setUpgradeModal({ visible: true, tierName: 'pro' })}
                style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: isDark ? '#000' : '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Upgrade to Pro</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setUpgradeModal({ visible: true, tierName: 'advanced' })}
                style={{ flex: 1, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Upgrade to Adv</Text>
              </TouchableOpacity>
            </View>
          )}
          {currentTier.name === 'pro' && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setUpgradeModal({ visible: true, tierName: 'advanced' })}
                style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: isDark ? '#000' : '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Upgrade to Advanced</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <BarChart2 size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>CURRENT MONTH USAGE</Text>
          </View>
          <View style={{ backgroundColor: isDark ? '#151922' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, gap: 16 }}>
            {renderUsageRow('Compute (CPU Hours)', usage.cpu.usedHours, usage.cpu.limitHours === 99999 ? 'Unlimited' : `${usage.cpu.limitHours} hrs`, (usage.cpu.usedHours / (usage.cpu.limitHours || 1)) * 100, Cpu, '#8B5CF6')}
            {renderUsageRow('Active RAM', usage.ram.usedMB + ' MB', usage.ram.limitMB + ' MB', (usage.ram.usedMB / (usage.ram.limitMB || 1)) * 100, HardDrive, '#3B82F6')}
            {renderUsageRow('Disk Space', usage.disk.usedGB + ' GB', usage.disk.limitGB + ' GB', (usage.disk.usedGB / (usage.disk.limitGB || 1)) * 100, HardDrive, '#F59E0B')}
            {renderUsageRow('Workspaces Created', usage.workspaces.used, usage.workspaces.limit, (usage.workspaces.used / (usage.workspaces.limit || 1)) * 100, Server, '#EF4444')}
            {renderUsageRow('AI Tokens Consumed', usage.aiTokens.used.toLocaleString(), usage.aiTokens.limit.toLocaleString(), (usage.aiTokens.used / (usage.aiTokens.limit || 1)) * 100, Zap, '#10B981')}
          </View>
        </View>
        {billingData?.usageHistory && billingData.usageHistory.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <TrendingUp size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>USAGE HISTORY</Text>
            </View>
            <View style={{ backgroundColor: isDark ? '#151922' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' }}>
              {billingData.usageHistory.map((item: any, idx: number, arr: any[]) => (
                <View key={item.month} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                  <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 13 }}>{item.month}</Text>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
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
        {billingData?.billingHistory && billingData.billingHistory.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <History size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>BILLING HISTORY</Text>
            </View>
            <View style={{ backgroundColor: isDark ? '#151922' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' }}>
              {billingData.billingHistory.map((item: any, idx: number, arr: any[]) => (
                <View key={item.invoiceId} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                  <View style={{ gap: 2 }}>
                    <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{item.plan}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{item.date} · {item.invoiceId}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_400Regular', fontSize: 13 }}>{item.amount}</Text>
                    <View style={{ backgroundColor: '#22c55e15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: '#22c55e', fontSize: 9, fontFamily: 'Inter_700Bold' }}>PAID</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    )
  }

  function renderGitSshView() {
    return (
      <View style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 }}>
        {/* Back navigation */}
        <TouchableOpacity 
          onPress={() => setCurrentSubScreen('main')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}
        >
          <ArrowLeft size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Back to Settings</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 24, marginBottom: 20 }}>Git & SSH Keys</Text>

        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, padding: 16, gap: 16, marginHorizontal: 0 }]}>
          
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
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
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

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />

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
                      style={{ alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.primary, borderRadius: 6 }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: isDark ? '#000' : '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Open GitHub Settings ↗</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={promptGenerateSsh} 
                  style={[styles.secondaryBtn, { borderColor: colors.border }]}
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
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
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
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5, marginBottom: 12 }}>SSH GENERATION HISTORY</Text>
            <View style={{ backgroundColor: isDark ? '#151922' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' }}>
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
    )
  }

  if (currentSubScreen === 'billing') {
    return (
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
      <View style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 }}>
        {/* Back navigation */}
        <TouchableOpacity 
          onPress={() => setCurrentSubScreen('main')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}
        >
          <ArrowLeft size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Back to Settings</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 24, marginBottom: 20 }}>Edit Profile</Text>

        <View style={{ alignItems: 'center', marginBottom: 24, gap: 10 }}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.primary }} />
          ) : (
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? '#151922' : '#E5E7EB', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary }}>
              <Text style={{ color: colors.text, fontSize: 32, fontFamily: 'Inter_600SemiBold' }}>
                {user?.login?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
            GitHub Account: @{user?.login}
          </Text>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, padding: 16, gap: 16, marginHorizontal: 0 }]}>
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
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <History size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>ACTIVE SESSIONS</Text>
          </View>
          <View style={{ backgroundColor: isDark ? '#151922' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' }}>
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
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5 }}>RECENT COMMITS FROM THIS APP</Text>
          </View>
          <View style={{ backgroundColor: isDark ? '#151922' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' }}>
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

        {/* Delete Account */}
        <TouchableOpacity 
          onPress={handleDeleteAccountPrompt} 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 8, 
            marginTop: 32, 
            paddingVertical: 12, 
            borderRadius: 10, 
            borderWidth: 1, 
            borderColor: '#F85149', 
            backgroundColor: 'rgba(248, 81, 73, 0.06)' 
          }}
          disabled={deletingAccount}
          activeOpacity={0.6}
        >
          {deletingAccount ? (
            <ActivityIndicator color="#F85149" />
          ) : (
            <>
              <Trash2 size={16} color="#F85149" strokeWidth={1.5} />
              <Text style={{ color: '#F85149', fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Delete Account Permanently</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  const renderAiKeysView = () => {
    return (
      <View style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 }}>
        {/* Back navigation */}
        <TouchableOpacity 
          onPress={() => setCurrentSubScreen('main')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}
        >
          <ArrowLeft size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Back to Settings</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 24, marginBottom: 20 }}>AI Providers</Text>

        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, padding: 16, gap: 16, marginHorizontal: 0 }]}>
          {/* Toggle BYOK */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: isDark ? 'rgba(243, 244, 246, 0.1)' : 'rgba(14, 17, 22, 0.05)', alignItems: 'center', justifyContent: 'center' }}>
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
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />

              <View style={{ gap: 16 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>API KEYS CONFIGURATION</Text>
                
                {/* Gemini API Key */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} color="#8B5CF6" />
                    <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Gemini API Key</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>*Required</Text>
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
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Optional</Text>
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
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Optional</Text>
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
    )
  }

  if (currentSubScreen === 'aiKeys') {
    return (
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
      <View style={{ gap: 20 }}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentSubScreen('main')} style={styles.backBtn}>
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>System Runtimes</Text>
        </View>

        <TextInput
          value={runtimesSearch}
          onChangeText={setRuntimesSearch}
          placeholder="Search runtimes, compilers..."
          placeholderTextColor={colors.textSecondary + '70'}
          style={[styles.inputField, { color: colors.text, borderColor: colors.border }]}
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
                      borderRadius: 14,
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

  if (currentSubScreen === 'dependencies') {
    return (
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
    )
  }

  if (currentSubScreen === 'gitSsh') {
    return (
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
    )
  }

  if (currentSubScreen === 'profile') {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderProfileView()}
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
    const content = (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
        {/* Icon Wrapper */}
        <View style={{ 
          width: 32, 
          height: 32, 
          borderRadius: 16, 
          backgroundColor: iconBg, 
          alignItems: 'center', 
          justifyContent: 'center',
          marginRight: 12 
        }}>
          <IconComponent size={16} color={iconColor} strokeWidth={2} />
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
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Settings</Text>
      </View>

      {/* Profile Card Banner */}
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => setCurrentSubScreen('profile')}
        style={{
          marginHorizontal: 24,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: isDark ? '#151922' : '#FFFFFF',
          padding: 16,
          marginBottom: 24,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, marginRight: 8 }}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={{ width: 48, height: 48, borderRadius: 24 }} />
          ) : (
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.text, fontSize: 20, fontFamily: 'Inter_600SemiBold' }}>
                {user?.login?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 }} numberOfLines={1}>
              {profileName || user?.name || user?.login}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Github size={12} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12 }}>
                GitHub Connected
              </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
      </TouchableOpacity>

      {/* Account & Integrations Group Card */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginHorizontal: 24, marginBottom: 8, color: colors.textSecondary }}>
          ACCOUNT & INTEGRATION
        </Text>
        <View style={{ marginHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: isDark ? '#151922' : '#FFFFFF', overflow: 'hidden' }}>
          {renderSettingsRow({
            icon: CreditCard,
            iconColor: '#3B82F6',
            iconBg: 'rgba(59, 130, 246, 0.1)',
            label: 'Billing & Usage',
            subtitle: billingData ? `${billingData.tier.displayName} · Active` : 'Manage plan & usage analytics',
            rightElement: (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {billingData?.tier.name && billingData?.tier.name !== 'free' && (
                  <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: '#22C55E', fontSize: 9, fontFamily: 'Inter_700Bold' }}>
                      {billingData.tier.name.toUpperCase()}
                    </Text>
                  </View>
                )}
                <ChevronRight size={16} color={colors.textSecondary} strokeWidth={1.5} />
              </View>
            ),
            onPress: () => setCurrentSubScreen('billing')
          })}
          {renderSettingsRow({
            icon: Key,
            iconColor: '#22C55E',
            iconBg: 'rgba(34, 197, 94, 0.1)',
            label: 'Git & SSH Keys',
            subtitle: gitName ? `${gitName} · Configured` : 'Configure credentials & deploy keys',
            onPress: () => setCurrentSubScreen('gitSsh')
          })}
          {renderSettingsRow({
            icon: Sparkles,
            iconColor: '#8B5CF6',
            iconBg: 'rgba(139, 92, 246, 0.1)',
            label: 'AI API Keys (BYOK)',
            subtitle: byokMode ? 'Custom Keys Enabled' : 'Configure third-party LLM providers',
            onPress: () => setCurrentSubScreen('aiKeys')
          })}
          {renderSettingsRow({
            icon: LogOut,
            iconColor: '#F85149',
            iconBg: 'rgba(248, 81, 73, 0.08)',
            label: 'Sign Out',
            subtitle: 'Disconnect account from this device',
            onPress: handleSignOut,
            showDivider: false
          })}
        </View>
      </View>

      {/* Preferences & System Group Card */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginHorizontal: 24, marginBottom: 8, color: colors.textSecondary }}>
          PREFERENCES & SYSTEM
        </Text>
        <View style={{ marginHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: isDark ? '#151922' : '#FFFFFF', overflow: 'hidden' }}>
          {renderSettingsRow({
            icon: ThemeIcon,
            iconColor: isDark ? '#FBBF24' : '#D97706',
            iconBg: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(217, 119, 6, 0.1)',
            label: 'Dark Mode',
            subtitle: 'Toggle dark interface appearance',
            rightElement: (
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.text }}
                thumbColor={colors.background}
              />
            ),
            showDivider: true
          })}
          {renderSettingsRow({
            icon: Server,
            iconColor: '#EC4899',
            iconBg: 'rgba(236, 72, 153, 0.1)',
            label: 'System Runtimes',
            subtitle: 'Verify compilers (Node, Python, Go, Rust)',
            onPress: () => setCurrentSubScreen('dependencies'),
            showDivider: true
          })}

          {/* Engine Status Details */}
          <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)', paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Server size={14} color={colors.textSecondary} strokeWidth={1.5} />
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 12 }}>Runtime Engine</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 11.5 }}>v1.0.0</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Cpu size={14} color={colors.textSecondary} strokeWidth={1.5} />
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 12 }}>Cloud Gateway</Text>
              </View>
              <Text style={{ color: '#3FB950', fontFamily: 'JetBrainsMono_400Regular', fontSize: 11.5, fontWeight: 'bold' }}>Active</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Lock size={14} color={colors.textSecondary} strokeWidth={1.5} />
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 12 }}>Encryption</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 11.5 }}>AES-256</Text>
            </View>
          </View>
        </View>
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
    </ScrollView>
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
