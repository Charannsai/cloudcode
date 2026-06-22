import { create } from 'zustand'

interface UIState {
  tabBarVisible: boolean
  setTabBarVisible: (visible: boolean) => void
  settingsSubScreen: 'main' | 'billing' | 'gitSsh' | 'dependencies' | 'aiKeys' | 'profile' | 'about'
  setSettingsSubScreen: (screen: 'main' | 'billing' | 'gitSsh' | 'dependencies' | 'aiKeys' | 'profile' | 'about') => void
}

export const useUIStore = create<UIState>((set) => ({
  tabBarVisible: true,
  setTabBarVisible: (visible) => set({ tabBarVisible: visible }),
  settingsSubScreen: 'main',
  setSettingsSubScreen: (screen) => set({ settingsSubScreen: screen }),
}))
