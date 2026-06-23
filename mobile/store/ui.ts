import { create } from 'zustand'

interface UIState {
  tabBarVisible: boolean
  setTabBarVisible: (visible: boolean) => void
  settingsSubScreen: 'main' | 'billing' | 'gitSsh' | 'dependencies' | 'aiKeys' | 'profile' | 'about'
  setSettingsSubScreen: (screen: 'main' | 'billing' | 'gitSsh' | 'dependencies' | 'aiKeys' | 'profile' | 'about') => void
  
  // Limit Exceeded Modal state
  limitModalVisible: boolean
  limitModalType: 'workspace' | 'ai' | 'general'
  showLimitModal: (type?: 'workspace' | 'ai' | 'general') => void
  hideLimitModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  tabBarVisible: true,
  setTabBarVisible: (visible) => set({ tabBarVisible: visible }),
  settingsSubScreen: 'main',
  setSettingsSubScreen: (screen) => set({ settingsSubScreen: screen }),

  limitModalVisible: false,
  limitModalType: 'general',
  showLimitModal: (type = 'general') => set({ limitModalVisible: true, limitModalType: type }),
  hideLimitModal: () => set({ limitModalVisible: false }),
}))
