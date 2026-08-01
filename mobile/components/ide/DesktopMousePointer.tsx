import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

const AnimatedView = Reanimated.createAnimatedComponent(View)

interface DesktopMousePointerProps {
  enabled?: boolean
}

/**
 * Visual Desktop Mouse Cursor Overlay for iPad
 * 
 * Uses react-native-gesture-handler's Hover gesture to track
 * connected mouse / trackpad movement in real-time on iPadOS.
 * Renders a crisp macOS/Windows style Desktop Arrow pointer overlay.
 * 
 * NOTE: This renders on top of the entire app with pointerEvents="none"
 * so it never intercepts touches or clicks.
 */
export function DesktopMousePointer({ enabled = true }: DesktopMousePointerProps) {
  const pointerX = useSharedValue(-100)
  const pointerY = useSharedValue(-100)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(1)

  // Track mouse movement using Hover gesture (works with iPadOS hardware mouse)
  const hoverGesture = Gesture.Hover()
    .onBegin((e) => {
      'worklet'
      pointerX.value = e.absoluteX
      pointerY.value = e.absoluteY
      opacity.value = withTiming(1, { duration: 150 })
    })
    .onUpdate((e) => {
      'worklet'
      pointerX.value = e.absoluteX
      pointerY.value = e.absoluteY
      opacity.value = 1
    })
    .onEnd(() => {
      'worklet'
      opacity.value = withTiming(0, { duration: 300 })
    })
    .onFinalize(() => {
      'worklet'
      opacity.value = withTiming(0, { duration: 300 })
    })

  // Track press for click animation
  const pressGesture = Gesture.Manual()
    .onTouchesDown(() => {
      'worklet'
      scale.value = withTiming(0.82, { duration: 80 })
    })
    .onTouchesUp(() => {
      'worklet'
      scale.value = withTiming(1, { duration: 120 })
    })

  const combinedGesture = Gesture.Simultaneous(hoverGesture, pressGesture)

  const cursorStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: 0,
    top: 0,
    transform: [
      { translateX: pointerX.value },
      { translateY: pointerY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: 99999,
  }))

  if (!enabled) return null

  return (
    <GestureDetector gesture={combinedGesture}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <AnimatedView style={cursorStyle} pointerEvents="none">
          {/* Crisp macOS/Windows Desktop Pointer Arrow */}
          <Svg width="24" height="28" viewBox="0 0 24 28" fill="none">
            <Path
              d="M3 2L4.5 22L9.5 16L15 24L18 22L13 14L20 13L3 2Z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </Svg>
        </AnimatedView>
      </View>
    </GestureDetector>
  )
}
