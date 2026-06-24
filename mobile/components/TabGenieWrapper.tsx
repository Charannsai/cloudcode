import React, { useEffect } from 'react'
import { Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useIsFocused } from '@react-navigation/native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface TabGenieWrapperProps {
  children: React.ReactNode
  index: number
  style?: any
}

export function TabGenieWrapper({ children, index, style }: TabGenieWrapperProps) {
  const isFocused = useIsFocused()
  const progress = useSharedValue(0)

  useEffect(() => {
    if (isFocused) {
      // Snappy, highly responsive Apple-style ease-out curve (200ms) for high performance
      progress.value = withTiming(1, { duration: 200, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    } else {
      progress.value = 0
    }
  }, [isFocused])

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value
    const opacity = p
    
    // Determine the source X and Y of the tab icon
    const tabWidth = 62
    const dockWidth = 310
    const dockLeft = (SCREEN_WIDTH - dockWidth) / 2
    const targetX = dockLeft + index * tabWidth + tabWidth / 2
    const targetY = SCREEN_HEIGHT - 60 // Approximate dock vertical center

    // 1. S-curve lateral swoop: swoops slightly sideways based on direction before sucking into the icon
    const dx = targetX - SCREEN_WIDTH / 2
    const swoopX = Math.sin((1 - p) * Math.PI) * dx * 0.26
    const translateX = (1 - p) * dx + swoopX

    // 2. Quadratic vertical swoop: swoops down quickly into the slot
    const translateY = (1 - p) * (1 - p) * (targetY - SCREEN_HEIGHT / 2)
    
    // 3. Non-uniform scale: collapses to near 0 near the icon, with scaleY shrinking faster
    const scaleX = 0.01 + 0.99 * Math.pow(p, 0.85)
    const scaleY = 0.01 + 0.99 * Math.pow(p, 1.4)
    
    // 4. Perspectival 3D tilting & rotation to simulate a piece of paper folding in 3D space
    // Negative rotateX tilts the top forward/bottom back, creating a gorgeous funnel-shaped taper (narrow bottom)
    const rotateX = `${(1 - p) * -35}deg`
    // rotateY tilts it towards the dock icon laterally
    const rotateY = `${(1 - p) * (dx > 0 ? 14 : -14)}deg`
    // rotateZ spins it slightly along the curve path
    const rotateZ = `${(1 - p) * (dx > 0 ? 5 : -5)}deg`
    const skewX = `${(1 - p) * (dx > 0 ? -6 : 6)}deg`

    return {
      opacity,
      transform: [
        { perspective: 380 },
        { translateX },
        { translateY },
        { scaleX },
        { scaleY },
        { rotateX },
        { rotateY },
        { rotateZ },
        { skewX }
      ]
    }
  })

  return (
    <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>
      {children}
    </Animated.View>
  )
}
