import React, { ReactNode } from 'react'
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated'

export interface TelegramPressableProps extends Omit<PressableProps, 'style'> {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  activeScale?: number
  activeOpacity?: number
  disabled?: boolean
  onPress?: () => void
  onLongPress?: () => void
}

const SPRING_CONFIG = {
  stiffness: 350,
  damping: 22,
  mass: 0.5,
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const TelegramPressable = React.memo(function TelegramPressable({
  children,
  style,
  activeScale = 0.982,
  activeOpacity = 0.92,
  disabled = false,
  onPress,
  onLongPress,
  ...props
}: TelegramPressableProps) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const handlePressIn = () => {
    if (disabled) return
    scale.value = withTiming(activeScale, { duration: 16, easing: Easing.out(Easing.quad) })
    opacity.value = withTiming(activeOpacity, { duration: 16, easing: Easing.out(Easing.quad) })
  }

  const handlePressOut = () => {
    if (disabled) return
    scale.value = withSpring(1, SPRING_CONFIG)
    opacity.value = withSpring(1, SPRING_CONFIG)
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  )
})
