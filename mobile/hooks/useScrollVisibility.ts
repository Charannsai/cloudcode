import { useUIStore } from '@/store/ui'
import { useCallback, useRef } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

export function useScrollVisibility() {
  const setTabBarVisible = useUIStore((state) => state.setTabBarVisible)
  const lastScrollY = useRef(0)

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y
    const diff = currentScrollY - lastScrollY.current

    // Hide on scroll down, show on scroll up
    // threshold of 5 to avoid jitter
    if (Math.abs(diff) > 5) {
      if (diff > 0 && currentScrollY > 100) {
        setTabBarVisible(false)
      } else if (diff < 0) {
        setTabBarVisible(true)
      }
    }
    
    lastScrollY.current = currentScrollY
  }, [setTabBarVisible])

  return { handleScroll }
}
