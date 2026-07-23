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
  const progress = useSharedValue(0)
  const slideDirection = useSharedValue(0) // -1 = slide from left, 1 = slide from right

  const { previousTabIndex, currentTabIndex } = useUIStore()

  useEffect(() => {
    if (isFocused) {
      // Determine slide direction: if current tab index > previous, slide from right
      const direction = currentTabIndex >= previousTabIndex ? 1 : -1
      slideDirection.value = direction
      // Start off-screen in the slide direction
      progress.value = 0
      progress.value = withTiming(1, { duration: 220, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    } else {
      progress.value = 0
    }
  }, [isFocused, currentTabIndex])

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value
    const dir = slideDirection.value
    // Slide in from the direction: from 40px offset to 0
    const translateX = (1 - p) * dir * 40

    return {
      opacity: 0.4 + 0.6 * p,
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
