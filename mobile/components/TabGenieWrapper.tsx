import React, { useEffect } from 'react'
import { Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useIsFocused } from '@react-navigation/native'
import { useUIStore } from '@/store/ui'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface TabGenieWrapperProps {
  children: React.ReactNode
  index: number
  style?: any
}

export function TabGenieWrapper({ children, index, style }: TabGenieWrapperProps) {
  const isFocused = useIsFocused()
  const progress = useSharedValue(1)
  const slideDirection = useSharedValue(1) // 1 = slide from right, -1 = slide from left

  const { previousTabIndex, currentTabIndex } = useUIStore()

  useEffect(() => {
    if (isFocused) {
      // If navigating to a higher tab index, slide in from right (+1). If going back, slide in from left (-1).
      const direction = currentTabIndex >= previousTabIndex ? 1 : -1
      slideDirection.value = direction
      progress.value = 0
      progress.value = withTiming(1, { 
        duration: 160, 
        easing: Easing.out(Easing.quad) 
      })
    }
  }, [isFocused, currentTabIndex])

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value
    const dir = slideDirection.value
    // Smooth 50px directional slide matching SlideInRight style
    const translateX = (1 - p) * dir * 50

    return {
      opacity: p,
      transform: [
        { translateX },
      ]
    }
  })

  return (
    <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>
      {children}
    </Animated.View>
  )
}
