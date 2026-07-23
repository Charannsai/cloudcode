import { create } from 'zustand'

interface UIState {
  tabBarVisible: boolean
  setTabBarVisible: (visible: boolean) => void
  settingsSubScreen: 'main' | 'billing' | 'billing-detail' | 'byok-detail' | 'gitSsh' | 'dependencies' | 'aiKeys' | 'profile' | 'about' | 'history' | 'limits'
  setSettingsSubScreen: (screen: 'main' | 'billing' | 'billing-detail' | 'byok-detail' | 'gitSsh' | 'dependencies' | 'aiKeys' | 'profile' | 'about' | 'history' | 'limits') => void
  
  // Usage tab sub-screen navigation
  usageSubScreen: 'main' | 'detail'
  setUsageSubScreen: (screen: 'main' | 'detail') => void

  // Tab index tracking for slide direction
  previousTabIndex: number
  currentTabIndex: number
  setTabIndex: (index: number) => void

  // Limit Exceeded Modal state
  limitModalVisible: boolean
  limitModalType: 'workspace' | 'ai' | 'general'
  showLimitModal: (type?: 'workspace' | 'ai' | 'general') => void
  hideLimitModal: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  tabBarVisible: true,
  setTabBarVisible: (visible) => set({ tabBarVisible: visible }),
  settingsSubScreen: 'main',
  setSettingsSubScreen: (screen) => set({ settingsSubScreen: screen }),

  usageSubScreen: 'main',
  setUsageSubScreen: (screen) => set({ usageSubScreen: screen }),

  previousTabIndex: 0,
  currentTabIndex: 0,
  setTabIndex: (index) => set((state) => ({
    previousTabIndex: state.currentTabIndex,
    currentTabIndex: index,
  })),

  limitModalVisible: false,
  limitModalType: 'general',
  showLimitModal: (type = 'general') => set({ limitModalVisible: true, limitModalType: type }),
  hideLimitModal: () => set({ limitModalVisible: false }),
}))
