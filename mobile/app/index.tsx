import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  interpolateColor,
  Easing,
  SharedValue,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated'
import Svg, { Path, Defs, RadialGradient, Rect, Stop, Line, Circle, G, Ellipse, LinearGradient } from 'react-native-svg'
import { BlurView } from 'expo-blur'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
const { width, height } = Dimensions.get('window')

// Exact CloudCode logo path from provided SVG asset
const CLOUD_PATH = "M744.133 448.718L745.663 450.478C749.573 448.638 756.023 442.638 759.343 439.478C801.523 399.328 807.143 335.468 773.443 288.286C752.363 258.958 720.453 239.246 684.793 233.516C627.733 224.495 571.543 240.02 532.953 284.215C513.333 306.683 501.953 327.078 486.903 352.228L446.383 419.478C424.033 456.788 407.123 486.278 370.333 511.798C322.653 544.868 277.043 552.878 220.513 550.948C199.333 550.218 189.463 551.898 167.033 548.058C111.983 538.618 66.3532 511.758 33.9532 466.048C4.72322 424.818 -6.02688 369.558 3.23312 320.198C19.2031 235.074 86.2132 173.155 171.333 161.818C178.423 160.874 215.733 159.576 216.813 157.721C221.973 148.846 231.733 123.239 239.273 112.014C258.803 82.9043 278.733 62.4333 306.733 42.3943C378.113 -8.68767 483.363 -13.7167 560.263 27.9013C568.783 32.5103 577.823 38.6133 586.293 44.0923C591.413 47.4043 600.223 56.2653 605.963 58.4383C606.413 58.4743 606.863 58.5104 607.323 58.5464C625.333 70.3774 639.813 94.3024 651.953 111.494C653.613 113.836 663.243 137.014 663.103 140.089C659.363 141.274 631.283 140.277 624.573 140.763C613.183 141.589 588.323 150.591 580.113 150.2C577.063 142.857 564.713 129.099 559.173 122.493C559.073 117.483 555.773 114.043 552.203 110.704C491.283 53.7463 386.263 57.7693 331.443 121.487C304.553 152.739 287.003 190.663 285.093 232.343C219.143 232.831 161.143 218.294 109.883 270.641C87.5331 293.249 75.2332 323.908 75.7732 355.698C76.5632 387.998 90.4232 418.588 114.173 440.488C147.973 472.268 189.523 480.028 234.743 478.448C279.973 476.878 316.993 460.968 348.503 427.798C362.653 412.718 372.893 395.008 384.023 377.728C434.863 298.804 467.723 210.738 563.753 176.305C645.703 146.92 740.993 155.774 808.173 214.497C846.483 247.982 870.443 294.617 873.453 345.588C873.823 351.568 873.993 374.398 873.413 379.908C869.123 419.878 851.813 457.338 824.153 486.518C786.803 525.918 735.413 548.968 681.153 550.678C669.933 551.018 658.523 550.698 647.273 550.768C569.733 551.188 491.963 549.938 414.443 550.988C420.043 546.248 432.513 537.208 433.173 530.618C439.673 521.988 452.193 510.948 458.973 500.978C461.403 497.408 474.013 475.968 476.413 475.308C482.143 473.738 503.713 474.508 510.313 474.548L616.123 474.668C660.013 474.668 701.183 478.218 739.293 451.948C741.343 450.538 742.053 450.628 744.133 448.718Z"

const AnimatedPath = Animated.createAnimatedComponent(Path)

// Subcomponent: Tech Grid Background
const GridBackground = ({ 
  isDark, 
  opacity,
  themeTransition 
}: { 
  isDark: boolean; 
  opacity: SharedValue<number>;
  themeTransition: SharedValue<number>;
}) => {
  const spacing = 70
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)'
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value * (1 - themeTransition.value),
  }))

  const vLinesCount = Math.ceil(width / spacing)
  const hLinesCount = Math.ceil(height / spacing)

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style, { pointerEvents: 'none' }]}>
      <Svg style={StyleSheet.absoluteFill}>
        {Array.from({ length: vLinesCount }).map((_, i) => (
          <Line
            key={`v-${i}`}
            x1={i * spacing}
            y1={0}
            x2={i * spacing}
            y2={height}
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: hLinesCount }).map((_, i) => (
          <Line
            key={`h-${i}`}
            x1={0}
            y1={i * spacing}
            x2={width}
            y2={i * spacing}
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
      </Svg>
    </Animated.View>
  )
}

// -------------------------------------------------------------
// Helper Component: High-Fidelity Official Logos
// -------------------------------------------------------------
const ReactLogo = () => (
  <Svg width={20} height={20} viewBox="-11.5 -10.23174 23 20.46348">
    <Circle cx={0} cy={0} r={2.05} fill="#61DAFB" />
    <G stroke="#61DAFB" strokeWidth={1} fill="none">
      <Ellipse rx={11} ry={4.2} />
      <Ellipse rx={11} ry={4.2} transform="rotate(60)" />
      <Ellipse rx={11} ry={4.2} transform="rotate(120)" />
    </G>
  </Svg>
)

const DockerLogo = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path
      d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"
      fill="#2496ED"
    />
  </Svg>
)

const GoLogo = () => (
  <Svg width={36} height={14} viewBox="0 0 207 78">
    <G fill="#00acd7" fillRule="evenodd">
      <Path d="m16.2 24.1c-.4 0-.5-.2-.3-.5l2.1-2.7c.2-.3.7-.5 1.1-.5h35.7c.4 0 .5.3.3.6l-1.7 2.6c-.2.3-.7.6-1 .6z"/>
      <Path d="m1.1 33.3c-.4 0-.5-.2-.3-.5l2.1-2.7c.2-.3.7-.5 1.1-.5h45.6c.4 0 .6.3.5.6l-.8 2.4c-.1.4-.5.6-.9.6z"/>
      <Path d="m25.3 42.5c-.4 0-.5-.3-.3-.6l1.4-2.5c.2-.3.6-.6 1-.6h20c.4 0 .6.3.6.7l-.2 2.4c0 .4-.4.7-.7.7z"/>
      <G transform="translate(55)">
        <Path d="m74.1 22.3c-6.3 1.6-10.6 2.8-16.8 4.4-1.5.4-1.6.5-2.9-1-1.5-1.7-2.6-2.8-4.7-3.8-6.3-3.1-12.4-2.2-18.1 1.5-6.8 4.4-10.3 10.9-10.2 19 .1 8 5.6 14.6 13.5 15.7 6.8.9 12.5-1.5 17-6.6.9-1.1 1.7-2.3 2.7-3.7-3.6 0-8.1 0-19.3 0-2.1 0-2.6-1.3-1.9-3 1.3-3.1 3.7-8.3 5.1-10.9.3-.6 1-1.6 2.5-1.6h36.4c-.2 2.7-.2 5.4-.6 8.1-1.1 7.2-3.8 13.8-8.2 19.6-7.2 9.5-16.6 15.4-28.5 17-9.8 1.3-18.9-.6-26.9-6.6-7.4-5.6-11.6-13-12.7-22.2-1.3-10.9 1.9-20.7 8.5-29.3 7.1-9.3 16.5-15.2 28-17.3 9.4-1.7 18.4-.6 26.5 4.9 5.3 3.5 9.1 8.3 11.6 14.1.6.9.2 1.4-1 1.7z"/>
        <Path d="m107.2 77.6c-9.1-.2-17.4-2.8-24.4-8.8-5.9-5.1-9.6-11.6-10.8-19.3-1.8-11.3 1.3-21.3 8.1-30.2 7.3-9.6 16.1-14.6 28-16.7 10.2-1.8 19.8-.8 28.5 5.1 7.9 5.4 12.8 12.7 14.1 22.3 1.7 13.5-2.2 24.5-11.5 33.9-6.6 6.7-14.7 10.9-24 12.8-2.7.5-5.4.6-8 .9zm23.8-40.4c-.1-1.3-.1-2.3-.3-3.3-1.8-9.9-10.9-15.5-20.4-13.3-9.3 2.1-15.3 8-17.5 17.4-1.8 7.8 2 15.7 9.2 18.9 5.5 2.4 11 2.1 16.3-.6 7.9-4.1 12.2-10.5 12.7-19.1z" fillRule="nonzero"/>
      </G>
    </G>
  </Svg>
)

const TypeScriptLogo = () => (
  <Svg width={18} height={18} viewBox="0 0 16 16">
    <Path
      d="M14 0a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm-1.139 7.488q-.585 0-1.006.244a1.67 1.67 0 0 0-.634.674 2.1 2.1 0 0 0-.225.996q0 .753.293 1.182.303.42.967.732l.469.215q.438.186.625.43.185.244.185.635 0 .478-.166.703-.156.224-.527.224-.361.001-.547-.244-.186-.243-.205-.752h-1.162q.02.996.498 1.524.479.527 1.386.527.909 0 1.417-.518.507-.517.507-1.484 0-.81-.332-1.289t-1.045-.79l-.449-.196q-.39-.166-.556-.381-.166-.214-.166-.576 0-.4.165-.596.177-.195.508-.195.361 0 .508.234.156.234.176.703h1.123q-.03-.976-.498-1.484-.47-.518-1.309-.518M7 7.596v1.113h1.3V14.5h1.221V8.709h1.289V7.596z"
      fill="#3178C6"
    />
  </Svg>
)

const OpenAILogo = () => (
  <Svg width={18} height={18} viewBox="0 0 16 16">
    <Path
      d="M14.949 6.547a3.94 3.94 0 0 0-.348-3.273 4.11 4.11 0 0 0-4.4-1.934A4.1 4.1 0 0 0 8.423.2 4.15 4.15 0 0 0 6.305.086a4.1 4.1 0 0 0-1.891.948 4.04 4.04 0 0 0-1.158 1.753 4.1 4.1 0 0 0-1.563.679A4 4 0 0 0 .554 4.72a3.99 3.99 0 0 0 .502 4.731 3.94 3.94 0 0 0 .346 3.274 4.11 4.11 0 0 0 4.402 1.933c.382.425.852.764 1.377.995.526.231 1.095.35 1.67.346 1.78.002 3.358-1.132 3.901-2.804a4.1 4.1 0 0 0 1.563-.68 4 4 0 0 0 1.14-1.253 3.99 3.99 0 0 0-.506-4.716m-6.097 8.406a3.05 3.05 0 0 1-1.945-.694l.096-.054 3.23-1.838a.53.53 0 0 0 .265-.455v-4.49l1.366.778q.02.011.025.035v3.722c-.003 1.653-1.361 2.992-3.037 2.996m-6.53-2.75a2.95 2.95 0 0 1-.36-2.01l.095.057L5.29 12.09a.53.53 0 0 0 .527 0l3.949-2.246v1.555a.05.05 0 0 1-.022.041L6.473 13.3c-1.454.826-3.311.335-4.15-1.098m-.85-6.94A3.02 3.02 0 0 1 3.07 3.949v3.785a.51.51 0 0 0 .262.451l3.93 2.237-1.366.779a.05.05 0 0 1-.048 0L2.585 9.342a2.98 2.98 0 0 1-1.113-4.094zm11.216 2.571L8.747 5.576l1.362-.776a.05.05 0 0 1 .048 0l3.265 1.86a3 3 0 0 1 1.173 1.207 2.96 2.96 0 0 1-.27 3.2 3.05 3.05 0 0 1-1.36.997V8.279a.52.52 0 0 0-.276-.445m1.36-2.015-.097-.057-3.226-1.855a.53.53 0 0 0-.53 0L6.249 6.153V4.598a.04.04 0 0 1 .019-.04L9.533 2.7a3.07 3.07 0 0 1 3.257.139c.474.325.843.778 1.066 1.303.223.526.289 1.103.191 1.664z"
      fill="#10A37F"
    />
  </Svg>
)

const ClaudeLogo = () => (
  <Svg width={18} height={18} viewBox="0 0 16 16">
    <Path
      d="m3.127 10.604 3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212Z"
      fill="#D97756"
    />
  </Svg>
)

const GeminiLogo = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#9E7AFF" />
        <Stop offset="50%" stopColor="#5CA6FF" />
        <Stop offset="100%" stopColor="#3C52FF" />
      </LinearGradient>
    </Defs>
    <Path d="M12 0 Q12 12 24 12 Q12 12 12 24 Q12 12 0 12 Q12 12 12 0 Z" fill="url(#geminiGrad)" />
  </Svg>
)

// -------------------------------------------------------------
// Onboarding Illustration Component 0: Glowing CC Logo
// -------------------------------------------------------------
const Screen0Illustration = () => {
  const floatAnim = useSharedValue(0)
  useEffect(() => {
    floatAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: '8deg' },
      { rotateY: '-6deg' },
      { translateY: floatAnim.value * 12 - 6 }
    ]
  }))

  return (
    <View style={styles.showcaseWrapper}>
      <Animated.View style={[styles.workspaceCard, cardStyle, styles.glassCard3d]}>
        <BlurView intensity={35} tint="dark" style={styles.workspaceBlur}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={90} height={90} viewBox="0 0 874 552">
              <Path
                d={CLOUD_PATH}
                fill="#00E5FF"
                fillOpacity={0.15}
                stroke="#00E5FF"
                strokeWidth={4}
              />
            </Svg>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 1: Workspaces Showcase
// -------------------------------------------------------------
const Screen1Illustration = () => {
  const floatAnim = useSharedValue(0)
  useEffect(() => {
    floatAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  const card1Style = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: '8deg' },
      { rotateY: '-6deg' },
      { translateY: floatAnim.value * 12 - 6 }
    ],
  }))
  const badgeReactStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -floatAnim.value * 8 + 4 }, { translateX: -10 }],
  }))
  const badgeDockerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value * 6 - 3 }, { translateX: 15 }],
  }))
  const badgeGoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -floatAnim.value * 10 + 5 }, { translateX: 20 }],
  }))
  const badgeTsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value * 8 - 4 }, { translateX: -15 }],
  }))

  return (
    <View style={styles.showcaseWrapper}>
      {/* Center Desktop Workspace Card (Glassmorphic) */}
      <Animated.View style={[styles.workspaceCard, card1Style, styles.glassCard3d]}>
        <BlurView intensity={30} tint="dark" style={styles.workspaceBlur}>
          <View style={styles.workspaceHeader}>
            <View style={[styles.windowDot, { backgroundColor: '#FF5F56' }]} />
            <View style={[styles.windowDot, { backgroundColor: '#FFBD2E' }]} />
            <View style={[styles.windowDot, { backgroundColor: '#27C93F' }]} />
            <Text style={styles.windowTitle}>workspace_main</Text>
          </View>
          <View style={styles.workspaceBody}>
            <Text style={styles.codeText}>$ git clone https://github.com/cloudcode/app.git</Text>
            <Text style={[styles.codeText, { color: '#4ADE80', marginTop: 4 }]}>✓ Repository cloned successfully.</Text>
            <Text style={[styles.codeText, { color: '#60A5FA', marginTop: 4 }]}>$ npm install && npm run dev</Text>
            <Text style={[styles.codeText, { color: '#E2E8F0', marginTop: 4 }]}>✓ Server running on port 3000</Text>
          </View>
        </BlurView>
      </Animated.View>

      {/* Floating framework badges */}
      {/* React Badge */}
      <Animated.View style={[styles.floatingBadge, { left: 10, top: 20 }, badgeReactStyle]}>
        <BlurView intensity={30} tint="dark" style={styles.badgeBlur}>
          <ReactLogo />
          <Text style={[styles.badgeText, { marginLeft: 6 }]}>React</Text>
        </BlurView>
      </Animated.View>

      {/* Docker Badge */}
      <Animated.View style={[styles.floatingBadge, { right: 15, top: 40 }, badgeDockerStyle]}>
        <BlurView intensity={30} tint="dark" style={styles.badgeBlur}>
          <DockerLogo />
          <Text style={[styles.badgeText, { marginLeft: 6 }]}>Docker</Text>
        </BlurView>
      </Animated.View>

      {/* Go Badge */}
      <Animated.View style={[styles.floatingBadge, { right: 40, bottom: 30 }, badgeGoStyle]}>
        <BlurView intensity={30} tint="dark" style={styles.badgeBlur}>
          <GoLogo />
          <Text style={[styles.badgeText, { marginLeft: 6 }]}>Go</Text>
        </BlurView>
      </Animated.View>

      {/* TypeScript Badge */}
      <Animated.View style={[styles.floatingBadge, { left: 20, bottom: 20 }, badgeTsStyle]}>
        <BlurView intensity={30} tint="dark" style={styles.badgeBlur}>
          <TypeScriptLogo />
          <Text style={[styles.badgeText, { marginLeft: 6 }]}>TypeScript</Text>
        </BlurView>
      </Animated.View>
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 2: Build with AI
// -------------------------------------------------------------
const Screen2Illustration = () => {
  const floatAnim = useSharedValue(0)
  useEffect(() => {
    floatAnim.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  // Typewriter effect
  const prompts = [
    "Make an AI app that lets me take a picture of a meal and counts calories",
    "Add ChatGPT AI to my app.",
    "Refactor this async function to handle all exceptions",
    "Generate a beautiful Next.js landing page with a sleek dark theme"
  ]
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [typedText, setTypedText] = useState("")
  
  useEffect(() => {
    let letterIndex = 0
    let text = ""
    let isDeleting = false
    let timer: any

    const type = () => {
      const fullPrompt = prompts[currentPromptIndex]
      if (!isDeleting) {
        text = fullPrompt.slice(0, letterIndex + 1)
        letterIndex++
        setTypedText(text)
        if (letterIndex === fullPrompt.length) {
          isDeleting = true
          timer = setTimeout(type, 2000) // Hold prompt for 2s
        } else {
          timer = setTimeout(type, 50) // Speed of typing
        }
      } else {
        text = fullPrompt.slice(0, letterIndex - 1)
        letterIndex--
        setTypedText(text)
        if (letterIndex === 0) {
          isDeleting = false
          setCurrentPromptIndex((prev) => (prev + 1) % prompts.length)
          timer = setTimeout(type, 500)
        } else {
          timer = setTimeout(type, 30) // Speed of deleting
        }
      }
    }

    type()
    return () => clearTimeout(timer)
  }, [currentPromptIndex])

  const centerCardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: '12deg' },
      { rotateY: '-8deg' },
      { translateY: floatAnim.value * 8 - 4 }
    ],
  }))
  const bgCard1Style = {
    transform: [{ perspective: 800 }, { translateX: -30 }, { translateY: -30 }, { rotateX: '-10deg' }, { rotateY: '-15deg' }, { scale: 0.9 }],
  }
  const bgCard2Style = {
    transform: [{ perspective: 800 }, { translateX: 30 }, { translateY: -15 }, { rotateX: '-10deg' }, { rotateY: '15deg' }, { scale: 0.9 }],
  }

  return (
    <View style={styles.showcaseWrapper}>
      {/* Blurred Backround Prompt Card 1 */}
      <View style={[styles.aiPromptCardBack, bgCard1Style]}>
        <Text style={styles.aiPromptBackText}>Generate a new project with Node.js and Express...</Text>
      </View>

      {/* Blurred Backround Prompt Card 2 */}
      <View style={[styles.aiPromptCardBack, bgCard2Style]}>
        <Text style={styles.aiPromptBackText}>Build a landing page with glassmorphism components...</Text>
      </View>

      {/* Center Glassmorphic Typewriter Prompt Field */}
      <Animated.View style={[styles.aiPromptCardActive, centerCardStyle, styles.glassCard3d]}>
        <BlurView intensity={35} tint="dark" style={styles.aiPromptBlur}>
          <Text style={styles.aiPromptText}>{typedText}<Text style={styles.cursor}>|</Text></Text>
          <View style={styles.aiPromptFooter}>
            <View style={styles.aiPromptBtn}>
              <Text style={styles.aiPromptBtnText}>Auto</Text>
            </View>
            <View style={styles.aiSendCircle}>
              <Text style={{ fontSize: 10, color: '#FFFFFF' }}>▲</Text>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      {/* Floating AI Provider Icons */}
      {/* OpenAI */}
      <Animated.View style={[styles.aiIconBadge, { left: 0, bottom: 20 }, useAnimatedStyle(() => ({
        transform: [{ translateY: floatAnim.value * 6 - 3 }]
      }))]}>
        <BlurView intensity={30} tint="dark" style={styles.aiIconBlur}>
          <OpenAILogo />
          <Text style={[styles.badgeText, { marginLeft: 6, fontSize: 10, color: '#10A37F', fontFamily: 'Inter_700Bold' }]}>GPT</Text>
        </BlurView>
      </Animated.View>

      {/* Claude */}
      <Animated.View style={[styles.aiIconBadge, { right: 10, bottom: 10 }, useAnimatedStyle(() => ({
        transform: [{ translateY: -floatAnim.value * 8 + 4 }]
      }))]}>
        <BlurView intensity={30} tint="dark" style={styles.aiIconBlur}>
          <ClaudeLogo />
          <Text style={[styles.badgeText, { marginLeft: 6, fontSize: 10, color: '#D97756', fontFamily: 'Inter_700Bold' }]}>Claude</Text>
        </BlurView>
      </Animated.View>

      {/* Gemini */}
      <Animated.View style={[styles.aiIconBadge, { right: 30, top: 10 }, useAnimatedStyle(() => ({
        transform: [{ translateY: floatAnim.value * 10 - 5 }]
      }))]}>
        <BlurView intensity={30} tint="dark" style={styles.aiIconBlur}>
          <GeminiLogo />
          <Text style={[styles.badgeText, { marginLeft: 6, fontSize: 10, color: '#60A5FA', fontFamily: 'Inter_700Bold' }]}>Gemini</Text>
        </BlurView>
      </Animated.View>
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 3: Terminal & Git
// -------------------------------------------------------------
const Screen3Illustration = () => {
  const [activeCommand, setActiveCommand] = useState(0)
  const pulseAnim = useSharedValue(0)

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )

    const timer = setInterval(() => {
      setActiveCommand((prev) => (prev + 1) % 4)
    }, 2500)

    return () => clearInterval(timer)
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseAnim.value, [0, 1], [0.3, 0.9]),
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [0.8, 1.3]) }]
  }))

  const terminalStyle = {
    transform: [
      { perspective: 1000 },
      { rotateX: '6deg' },
      { rotateY: '8deg' }
    ]
  }

  return (
    <View style={styles.showcaseWrapper}>
      {/* Terminal Glass Container */}
      <View style={[styles.terminalContainer, terminalStyle, styles.glassCard3d]}>
        <BlurView intensity={25} tint="dark" style={styles.terminalBlur}>
          <View style={styles.terminalHeader}>
            <View style={[styles.windowDot, { backgroundColor: '#FF5F56' }]} />
            <View style={[styles.windowDot, { backgroundColor: '#FFBD2E' }]} />
            <View style={[styles.windowDot, { backgroundColor: '#27C93F' }]} />
            <Text style={styles.terminalTitle}>bash · cloudcode</Text>
          </View>
          <View style={styles.terminalBody}>
            <Text style={styles.terminalLine}>$ git checkout -b feature/auth</Text>
            {activeCommand >= 1 && (
              <Text style={[styles.terminalLine, { color: '#94A3B8' }]}>Switched to new branch 'feature/auth'</Text>
            )}
            {activeCommand >= 2 && (
              <Text style={styles.terminalLine}>$ git add . && git commit -m "feat: oauth"</Text>
            )}
            {activeCommand >= 3 && (
              <Text style={[styles.terminalLine, { color: '#4ADE80' }]}>[feature/auth a1b2c3d] feat: oauth ✓</Text>
            )}
          </View>
        </BlurView>
      </View>

      {/* Animated Git Workflow Branching Diagram */}
      <View style={styles.gitDiagram}>
        <Svg width="180" height="60" viewBox="0 0 180 60">
          <Line x1="10" y1="30" x2="170" y2="30" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
          <Path d="M 50 30 Q 75 10 100 10 L 140 10 Q 155 10 170 30" fill="none" stroke="#A78BFA" strokeWidth="2" strokeDasharray="4,4" />
          
          <Circle cx="30" cy="30" r="4" fill="#60A5FA" />
          <Circle cx="50" cy="30" r="4" fill="#60A5FA" />
          <Circle cx="170" cy="30" r="4" fill="#60A5FA" />
          
          <Circle cx="90" cy="10" r="4" fill="#A78BFA" />
          <Circle cx="130" cy="10" r="4" fill="#A78BFA" />
          
          <Animated.View style={[styles.pulseCircle, { left: 126, top: 4 }, pulseStyle]} />
          <View style={[styles.gitActiveDot, { left: 128, top: 6 }]} />
        </Svg>
      </View>
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 4: Preview, Cloud & Security
// -------------------------------------------------------------
const Screen4Illustration = () => {
  const floatAnim = useSharedValue(0)
  const rotateAnim = useSharedValue(0)

  useEffect(() => {
    floatAnim.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    rotateAnim.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    )
  }, [])

  const browserStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: '-6deg' },
      { rotateY: '-8deg' },
      { translateY: floatAnim.value * 10 - 5 }
    ],
  }))
  const shieldStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: '15deg' },
      { rotateY: '10deg' },
      { translateY: -floatAnim.value * 8 + 4 }
    ],
  }))
  const cloudNodeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatAnim.value * 6 - 3 },
      { rotate: rotateAnim.value * 360 + 'deg' }
    ]
  }))

  return (
    <View style={styles.showcaseWrapper}>
      {/* Browser App Preview Window */}
      <Animated.View style={[styles.previewWindow, browserStyle, styles.glassCard3d]}>
        <BlurView intensity={30} tint="dark" style={styles.previewBlur}>
          <View style={styles.previewHeader}>
            <View style={styles.previewAddressBar}>
              <Text style={styles.previewUrl}>localhost:3000</Text>
            </View>
          </View>
          <View style={styles.previewBody}>
            <View style={styles.previewBoxSmall} />
            <View style={styles.previewLineWide} />
            <View style={styles.previewLineMedium} />
          </View>
        </BlurView>
      </Animated.View>

      {/* Cloud Nodes Rotating Visual */}
      <Animated.View style={[styles.cloudNodesContainer, cloudNodeStyle]}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Circle cx="40" cy="40" r="30" fill="none" stroke="rgba(0, 229, 255, 0.15)" strokeWidth="1" strokeDasharray="3,3" />
          <Circle cx="40" cy="10" r="5" fill="#00E5FF" />
          <Circle cx="40" cy="70" r="5" fill="#00E5FF" />
          <Circle cx="10" cy="40" r="5" fill="#00E5FF" />
          <Circle cx="70" cy="40" r="5" fill="#00E5FF" />
        </Svg>
      </Animated.View>

      {/* Security Shield Card */}
      <Animated.View style={[styles.shieldContainer, shieldStyle]}>
        <BlurView intensity={35} tint="dark" style={styles.shieldBlur}>
          <Svg width={24} height={28} viewBox="0 0 24 28" fill="none">
            <Path d="M12 2L2 7v8c0 5.52 4.48 10 10 10s10-4.48 10-10V7L12 2z" stroke="#34D399" strokeWidth={2} fill="rgba(52, 211, 153, 0.1)" />
            <Path d="M9 13.5l2 2 4-4" stroke="#34D399" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={[styles.badgeText, { color: '#34D399', marginTop: 4, fontSize: 10 }]}>SECURE</Text>
        </BlurView>
      </Animated.View>
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 5: Parallax columns
// -------------------------------------------------------------
const Screen5Illustration = () => {
  const scrollY1 = useSharedValue(0)
  const scrollY2 = useSharedValue(0)

  useEffect(() => {
    scrollY1.value = withRepeat(
      withTiming(-120, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    )
    scrollY2.value = withRepeat(
      withTiming(120, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    )
  }, [])

  const col1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY1.value }],
  }))
  const col2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY2.value - 60 }],
  }))
  const col3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY1.value - 30 }],
  }))

  const gridStyle = {
    transform: [
      { perspective: 1000 },
      { rotateX: '20deg' },
      { rotateY: '-15deg' },
      { skewY: '-4deg' }
    ]
  }

  return (
    <Animated.View style={[styles.gridOuterContainer, gridStyle]}>
      {/* Column 1 - Slides UP */}
      <Animated.View style={[styles.gridColumn, col1Style]}>
        <View style={styles.gridItemCard}>
          <Text style={styles.gridItemHeader}>Explorer</Text>
          <Text style={styles.gridItemBody}>index.js{"\n"}package.json{"\n"}utils.ts</Text>
        </View>
        <View style={styles.gridItemCard}>
          <Text style={styles.gridItemHeader}>Console</Text>
          <Text style={[styles.gridItemBody, { color: '#059669' }]}>[INFO] build ok</Text>
        </View>
        <View style={styles.gridItemCard}>
          <Text style={styles.gridItemHeader}>Settings</Text>
          <Text style={styles.gridItemBody}>Port: 80{"\n"}Host: 0.0.0.0</Text>
        </View>
      </Animated.View>

      {/* Column 2 - Slides DOWN */}
      <Animated.View style={[styles.gridColumn, col2Style]}>
        <View style={[styles.gridItemCard, { height: 95 }]}>
          <Text style={styles.gridItemHeader}>Code</Text>
          <Text style={[styles.gridItemBody, { color: '#2563EB' }]}>const app = express()</Text>
        </View>
        <View style={styles.gridItemCard}>
          <Text style={styles.gridItemHeader}>Deploy</Text>
          <Text style={styles.gridItemBody}>AWS: active{"\n"}CPU: 2%</Text>
        </View>
        <View style={[styles.gridItemCard, { height: 95 }]}>
          <Text style={styles.gridItemHeader}>Git Branch</Text>
          <Text style={styles.gridItemBody}>main · checkout</Text>
        </View>
      </Animated.View>

      {/* Column 3 - Slides UP */}
      <Animated.View style={[styles.gridColumn, col3Style]}>
        <View style={styles.gridItemCard}>
          <Text style={styles.gridItemHeader}>Database</Text>
          <Text style={styles.gridItemBody}>Users (1.2k){"\n"}Projects (48)</Text>
        </View>
        <View style={styles.gridItemCard}>
          <Text style={styles.gridItemHeader}>Terminal</Text>
          <Text style={styles.gridItemBody}>$ ping google.com</Text>
        </View>
        <View style={styles.gridItemCard}>
          <Text style={styles.gridItemHeader}>Stats</Text>
          <Text style={styles.gridItemBody}>Memory: 91MB</Text>
        </View>
      </Animated.View>
    </Animated.View>
  )
}

// -------------------------------------------------------------
// Animated Progress Dots Helper Component
// -------------------------------------------------------------
const AnimatedDot = ({ 
  index, 
  currentScreen, 
  bgThemeTransition 
}: { 
  index: number; 
  currentScreen: number; 
  bgThemeTransition: SharedValue<number>;
}) => {
  const isActive = currentScreen === index
  
  const style = useAnimatedStyle(() => {
    const activeWidth = isActive ? 16 : 6
    const activeColor = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      [isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)', isActive ? '#05070B' : 'rgba(15, 23, 42, 0.2)']
    )
    return {
      width: withTiming(activeWidth, { duration: 250 }),
      backgroundColor: activeColor,
    }
  })

  return <Animated.View style={[styles.dot, style]} />
}

// -------------------------------------------------------------
// Main WelcomeScreen Component
// -------------------------------------------------------------
export default function WelcomeScreen() {
  const { user, loading, setToken } = useAuthStore()
  const { isDark } = useAppTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [signingIn, setSigningIn] = useState(false)
  const [isWelcomePhase, setIsWelcomePhase] = useState(false)
  const [currentScreen, setCurrentScreen] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)

  // Scroll to current page when currentScreen changes programmatically
  useEffect(() => {
    if (isWelcomePhase) {
      scrollViewRef.current?.scrollTo({
        x: currentScreen * width,
        animated: true,
      })
    }
  }, [currentScreen, isWelcomePhase])

  // Animation values
  const drawingProgress = useSharedValue(0)
  const fillOpacity = useSharedValue(0)
  const logoScale = useSharedValue(1)
  const logoTranslateY = useSharedValue(0)
  const brandOpacity = useSharedValue(0)
  const brandTranslateY = useSharedValue(20)
  const welcomeTransition = useSharedValue(0)
  const outlineGlow = useSharedValue(0)
  
  // Theme and page transitions
  const bgThemeTransition = useSharedValue(0)

  // Measure path length dynamically
  const [pathLength, setPathLength] = useState(0)

  // Handle auto redirect if logged in after the splash screen completes (4.1s)
  useEffect(() => {
    if (!loading && user) {
      const redirectTimer = setTimeout(() => {
        router.replace('/(tabs)/dashboard')
      }, 4100)
      return () => clearTimeout(redirectTimer)
    }
  }, [user, loading, router])

  // Trigger initial tracing animations
  useEffect(() => {
    if (!loading) {
      // 0.0s → 1.6s: Outline drawing
      drawingProgress.value = withTiming(1, { duration: 1600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })

      // 1.2s → 1.6s: Final fill fade in
      fillOpacity.value = withDelay(
        1200,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
      )

      // 1.2s → 1.6s: Outline shine flash
      outlineGlow.value = withDelay(
        1200,
        withSequence(
          withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) })
        )
      )

      // 1.6s → 1.9s: Scale pulse
      logoScale.value = withDelay(
        1600,
        withSequence(
          withTiming(1.03, { duration: 150, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 150, easing: Easing.in(Easing.ease) })
        )
      )

      // 1.9s → 2.6s: Brand reveal (Logo moves up, text fades in)
      logoTranslateY.value = withDelay(
        1900,
        withTiming(-20, { duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1) })
      )
      brandOpacity.value = withDelay(
        1900,
        withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) })
      )
      brandTranslateY.value = withDelay(
        1900,
        withTiming(0, { duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1) })
      )

      // If user is a guest, transition to the Welcome Screen after the branding text has been visible
      if (!user) {
        welcomeTransition.value = withDelay(
          4100,
          withTiming(1, { duration: 500, easing: Easing.bezier(0.16, 1, 0.3, 1) })
        )

        // Sync status bar style change with start of Welcome Transition at 4.1s
        const timer = setTimeout(() => {
          setIsWelcomePhase(true)
        }, 4100)

        return () => clearTimeout(timer)
      }
    }
  }, [loading, user])

  // Handles theme transition when changing screens
  useEffect(() => {
    if (currentScreen === 5) {
      bgThemeTransition.value = withTiming(1, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    } else {
      bgThemeTransition.value = withTiming(0, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    }
  }, [currentScreen])

  // Auto-advance onboarding timer
  useEffect(() => {
    if (isWelcomePhase && currentScreen < 5 && !signingIn) {
      const timer = setInterval(() => {
        setCurrentScreen((prev) => (prev < 5 ? prev + 1 : prev))
      }, 6000)
      return () => clearInterval(timer)
    }
  }, [isWelcomePhase, currentScreen, signingIn])

  // GitHub Auth Flow
  async function signInWithGitHub() {
    setSigningIn(true)
    try {
      const redirectUri = Linking.createURL('/auth')
      const authUrl = `${API_URL}/api/auth/github?redirect_uri=${encodeURIComponent(redirectUri)}`
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      )

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url)
        const token = url.searchParams.get('token')
        if (token) {
          setToken(token)
          router.replace('/(tabs)/dashboard')
        }
      }
    } catch (err) {
      console.error('Auth Error:', err)
    } finally {
      setSigningIn(false)
    }
  }

  // Ref callback to measure length of path
  const handlePathRef = (ref: any) => {
    if (ref) {
      try {
        const length = ref.getTotalLength()
        if (length && length > 0) {
          setPathLength(length)
        }
      } catch (e) {
        setPathLength(140)
      }
    }
  }

  // Handle Manual Continue
  const handleContinue = () => {
    if (currentScreen < 5) {
      setCurrentScreen(currentScreen + 1)
    }
  }

  // Interpolated Styles for Theme Shifts
  const containerStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      ['#05070B', '#FAFAFA']
    )
    return {
      backgroundColor: bgColor,
    }
  })

  const skipButtonStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.45)', 'rgba(15, 23, 42, 0.45)']
    )
    return {
      color,
    }
  })

  const ctaButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      ['#FFFFFF', '#05070B']
    )
    return {
      backgroundColor,
    }
  })

  const ctaButtonTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      ['#000000', '#FFFFFF']
    )
    return {
      color,
    }
  })

  const lightLogoStyle = useAnimatedStyle(() => ({
    opacity: 1 - bgThemeTransition.value,
  }))

  const darkLogoStyle = useAnimatedStyle(() => ({
    opacity: bgThemeTransition.value,
  }))

  // Centered Splash Logo animated styles
  const splashLogoStyle = useAnimatedStyle(() => {
    const t = welcomeTransition.value
    const targetCenterX = 24 + 16
    const targetCenterY = insets.top + 16 + 16

    const initialCenterX = width / 2
    const initialCenterY = height / 2

    const transX = interpolate(t, [0, 1], [0, targetCenterX - initialCenterX])
    const transY = interpolate(t, [0, 1], [logoTranslateY.value, targetCenterY - initialCenterY])
    const scale = interpolate(t, [0, 1], [logoScale.value, 0.32])
    const opacity = interpolate(t, [0, 1], [1, 0])

    return {
      opacity: opacity,
      transform: [
        { translateX: transX },
        { translateY: transY },
        { scale: scale },
      ],
    }
  })

  // SVG drawing paths animations
  const animatedBaseOutlineProps = useAnimatedProps(() => {
    return {
      opacity: interpolate(drawingProgress.value, [0, 1], [0.12, 0.4]),
    }
  })

  const animatedForwardsTrailProps = useAnimatedProps(() => {
    const len = pathLength || 140
    return {
      strokeDashoffset: (1 - drawingProgress.value) * len,
    }
  })

  const animatedBackwardsTrailProps = useAnimatedProps(() => {
    const len = pathLength || 140
    return {
      strokeDashoffset: -(1 - drawingProgress.value) * len,
    }
  })

  // Glow points traveling along the path
  const animatedForwardsGlowProps = useAnimatedProps(() => {
    const len = pathLength || 140
    return {
      strokeDashoffset: -drawingProgress.value * len,
    }
  })

  const animatedBackwardsGlowProps = useAnimatedProps(() => {
    const len = pathLength || 140
    return {
      strokeDashoffset: drawingProgress.value * len,
    }
  })

  const animatedPathFillProps = useAnimatedProps(() => {
    return {
      fillOpacity: fillOpacity.value,
      fill: '#0F172A',
    }
  })

  // Full outline flash glow animation props
  const animatedOutlineGlowProps = useAnimatedProps(() => {
    return {
      opacity: outlineGlow.value,
    }
  })

  // Brand Reveal Text styles
  const brandTextStyle = useAnimatedStyle(() => {
    const opacity = brandOpacity.value * (1 - welcomeTransition.value)
    const translateY = brandTranslateY.value - (welcomeTransition.value * 20)
    return {
      opacity: opacity,
      transform: [{ translateY: translateY }],
    }
  })

  // Iris-closing white background overlay style
  const whiteOverlayStyle = useAnimatedStyle(() => {
    const t = welcomeTransition.value
    const maxDim = Math.max(width, height)
    const startSize = maxDim * 2.5
    const endSize = 32
    const size = interpolate(t, [0, 1], [startSize, endSize])

    const initialCenterX = width / 2
    const initialCenterY = height / 2
    const targetCenterX = 24 + 16
    const targetCenterY = insets.top + 16 + 16

    const centerX = interpolate(t, [0, 1], [initialCenterX, targetCenterX])
    const centerY = interpolate(t, [0, 1], [initialCenterY, targetCenterY])
    const opacity = interpolate(t, [0, 0.85, 1], [1, 1, 0])

    return {
      width: size,
      height: size,
      left: centerX - size / 2,
      top: centerY - size / 2,
      borderRadius: size / 2,
      opacity: opacity,
    }
  })

  // Welcome Screen Components animation styles
  const headerTextStyle = useAnimatedStyle(() => {
    return {
      opacity: welcomeTransition.value,
    }
  })

  const watermarkStyle = useAnimatedStyle(() => {
    const targetOpacity = 0.08
    const finalOpacity = targetOpacity * (1 - bgThemeTransition.value)
    return {
      opacity: interpolate(welcomeTransition.value, [0, 1], [0, finalOpacity]),
    }
  })

  const welcomeContentStyle = useAnimatedStyle(() => {
    return {
      opacity: welcomeTransition.value,
      transform: [
        { translateY: interpolate(welcomeTransition.value, [0, 1], [40, 0]) }
      ],
    }
  })

  const ambientGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: welcomeTransition.value * (1 - bgThemeTransition.value),
    }
  })

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#05070B' }]}>
        <StatusBar style="light" />
      </View>
    )
  }

  const staticPathLength = pathLength || 140



  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Dynamic StatusBar style based on current screen's theme */}
      <StatusBar style={currentScreen === 5 ? "dark" : "light"} />

      {/* Welcome Screen Ambient Glow (Hidden in light theme Screen 5) */}
      <Animated.View style={[StyleSheet.absoluteFill, ambientGlowStyle]}>
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient
              id="ambientGlow"
              cx="50%"
              cy="0%"
              rx="60%"
              ry="60%"
              fx="50%"
              fy="0%"
            >
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.2} />
              <Stop offset="100%" stopColor="#05070B" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambientGlow)" />
        </Svg>
      </Animated.View>

      {/* Welcome Screen Tech Grid Background */}
      <GridBackground isDark={true} opacity={welcomeTransition} themeTransition={bgThemeTransition} />

      {/* Welcome Screen Giant Watermark Logo */}
      <Animated.View style={[styles.watermarkContainer, watermarkStyle]}>
        <Svg width={550} height={550} viewBox="0 0 874 552">
          <Path
            d={CLOUD_PATH}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
        </Svg>
      </Animated.View>

      {/* Header Branding Logo Images (Cross-fading between light and dark versions) */}
      <Animated.View style={[styles.headerContainer, { top: insets.top + 16, left: 24 }, headerTextStyle]}>
        <Animated.Image
          source={require('@/assets/cloudcodelogolight.png')}
          style={[{ width: 132.8, height: 32, position: 'absolute' }, lightLogoStyle]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require('@/assets/cloudcodelogo.png')}
          style={[{ width: 132.8, height: 32 }, darkLogoStyle]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Skip Button (Low opacity skip in top right corner for Screens 0-4) */}
      {isWelcomePhase && currentScreen < 5 && (
        <TouchableOpacity
          activeOpacity={0.6}
          style={[styles.skipButton, { top: insets.top + 16 }]}
          onPress={() => setCurrentScreen(5)}
        >
          <Animated.Text style={[styles.skipText, { fontFamily: 'Inter_500Medium' }, skipButtonStyle]}>
            Skip
          </Animated.Text>
        </TouchableOpacity>
      )}

      {/* Iris-closing White Background Overlay */}
      <Animated.View style={[styles.whiteOverlay, whiteOverlayStyle]} />

      {/* Centered Splash Logo (Translates to header in Phase 5) */}
      <Animated.View style={[styles.logoCenterContainer, splashLogoStyle]}>
        <Svg width={100} height={100} viewBox="0 0 874 552">
          {/* Phase 1 — Sleeping outline */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="rgba(0, 229, 255, 0.15)"
            strokeWidth={1.2}
            animatedProps={animatedBaseOutlineProps}
          />

          {/* Phase 2 — Forwards trail */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="rgba(0, 229, 255, 0.35)"
            strokeWidth={1.2}
            strokeDasharray={staticPathLength}
            animatedProps={animatedForwardsTrailProps}
          />

          {/* Phase 2 — Backwards trail */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="rgba(0, 229, 255, 0.35)"
            strokeWidth={1.2}
            strokeDasharray={staticPathLength}
            animatedProps={animatedBackwardsTrailProps}
          />

          {/* Phase 2 — Forwards laser shine (Aura, Glow, and White Core) */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#4F9DFF"
            strokeWidth={6}
            strokeDasharray={[40, 3000]}
            opacity={0.2}
            animatedProps={animatedForwardsGlowProps}
          />
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#00E5FF"
            strokeWidth={2.2}
            strokeDasharray={[20, 3000]}
            opacity={0.7}
            animatedProps={animatedForwardsGlowProps}
          />
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.0}
            strokeDasharray={[10, 3000]}
            animatedProps={animatedForwardsGlowProps}
          />

          {/* Phase 2 — Backwards laser shine (Aura, Glow, and White Core) */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#4F9DFF"
            strokeWidth={6}
            strokeDasharray={[40, 3000]}
            opacity={0.2}
            animatedProps={animatedBackwardsGlowProps}
          />
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#00E5FF"
            strokeWidth={2.2}
            strokeDasharray={[20, 3000]}
            opacity={0.7}
            animatedProps={animatedBackwardsGlowProps}
          />
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.0}
            strokeDasharray={[10, 3000]}
            animatedProps={animatedBackwardsGlowProps}
          />

          {/* Phase 2.5 — Full Outline Shine Glow (Neon blue) */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#00E5FF"
            strokeWidth={4}
            animatedProps={animatedOutlineGlowProps}
          />

          {/* Phase 2.5 — Full Outline Shine Core (White-hot) */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.2}
            animatedProps={animatedOutlineGlowProps}
          />

          {/* Phase 3 & Transition — Fill of the Cloud logo */}
          <AnimatedPath
            ref={handlePathRef}
            d={CLOUD_PATH}
            fill="#0F172A"
            stroke="none"
            animatedProps={animatedPathFillProps}
          />
        </Svg>
      </Animated.View>

      {/* Phase 4 — Splash Brand Reveal Text */}
      <Animated.View style={[styles.brandTextContainer, brandTextStyle]}>
        <Text style={[styles.brandTitle, { color: '#0F172A', fontFamily: 'Inter_800ExtraBold' }]}>
          CloudCode
        </Text>
      </Animated.View>

      {/* Onboarding Pages (Horizontally Swipeable & Paged) */}
      {isWelcomePhase && (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x
            const index = Math.round(offsetX / width)
            if (index !== currentScreen && index >= 0 && index <= 5) {
              setCurrentScreen(index)
            }
          }}
          scrollEnabled={!signingIn}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Page 0: Welcome Screen */}
          <View style={styles.pageContainer}>
            <View style={styles.pageIllustrationContainer}>
              <Screen0Illustration />
            </View>
            <View style={styles.textWrapper}>
              <Text style={[styles.title, { color: currentScreen === 5 ? '#0F172A' : '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
                Welcome to{"\n"}CloudCode
              </Text>
              <Text style={[styles.description, { color: currentScreen === 5 ? '#475569' : '#8B929A', fontFamily: 'Inter_400Regular' }]}>
                Your secure hub for code, collaboration, and cloud automation. Build. Deploy. Scale — all in one place.
              </Text>
            </View>
          </View>

          {/* Page 1: Desktop Workspaces */}
          <View style={styles.pageContainer}>
            <View style={styles.pageIllustrationContainer}>
              <Screen1Illustration />
            </View>
            <View style={styles.textWrapper}>
              <Text style={[styles.showcaseTitle, { color: currentScreen === 5 ? '#0F172A' : '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
                Desktop-Class{"\n"}Workspaces
              </Text>
              <Text style={[styles.showcaseDescription, { color: currentScreen === 5 ? '#475569' : '#8B929A', fontFamily: 'Inter_400Regular' }]}>
                Instantly create projects, clone git repositories, and launch dev environments from your phone. Full desktop performance, anywhere.
              </Text>
            </View>
          </View>

          {/* Page 2: Build with AI */}
          <View style={styles.pageContainer}>
            <View style={styles.pageIllustrationContainer}>
              <Screen2Illustration />
            </View>
            <View style={styles.textWrapper}>
              <Text style={[styles.showcaseTitle, { color: currentScreen === 5 ? '#0F172A' : '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
                Build Code{"\n"}Powered by AI
              </Text>
              <Text style={[styles.showcaseDescription, { color: currentScreen === 5 ? '#475569' : '#8B929A', fontFamily: 'Inter_400Regular' }]}>
                Code with specialized AI developer models working together. Generate complex applications simply by describing them.
              </Text>
            </View>
          </View>

          {/* Page 3: Terminal & Git */}
          <View style={styles.pageContainer}>
            <View style={styles.pageIllustrationContainer}>
              <Screen3Illustration />
            </View>
            <View style={styles.textWrapper}>
              <Text style={[styles.showcaseTitle, { color: currentScreen === 5 ? '#0F172A' : '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
                Interactive Terminal{"\n"}& Git Workflows
              </Text>
              <Text style={[styles.showcaseDescription, { color: currentScreen === 5 ? '#475569' : '#8B929A', fontFamily: 'Inter_400Regular' }]}>
                Run professional tools and command-line execution remotely. Manage git branching, commits, and synchronization without limits.
              </Text>
            </View>
          </View>

          {/* Page 4: Preview/Cloud/Security */}
          <View style={styles.pageContainer}>
            <View style={styles.pageIllustrationContainer}>
              <Screen4Illustration />
            </View>
            <View style={styles.textWrapper}>
              <Text style={[styles.showcaseTitle, { color: currentScreen === 5 ? '#0F172A' : '#FFFFFF', fontFamily: 'Inter_700Bold' }]}>
                Browser Previews{"\n"}& Infrastructure
              </Text>
              <Text style={[styles.showcaseDescription, { color: currentScreen === 5 ? '#475569' : '#8B929A', fontFamily: 'Inter_400Regular' }]}>
                Preview running applications in real-time. Everything builds securely on isolated, compliant remote cloud servers.
              </Text>
            </View>
          </View>

          {/* Page 5: Parallax Grid & Auth */}
          <View style={styles.pageContainer}>
            <View style={styles.pageIllustrationContainer}>
              <Screen5Illustration />
            </View>
            <View style={styles.textWrapper}>
              <Text style={[styles.showcaseTitle, { color: '#0F172A', fontFamily: 'Inter_700Bold' }]}>
                Ready to code?
              </Text>
              <Text style={[styles.showcaseDescription, { color: '#475569', fontFamily: 'Inter_400Regular' }]}>
                Sign in with your GitHub account to access your repositories and spin up secure, remote workspaces on the go.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Fixed Bottom Indicators and Primary CTA Button */}
      {isWelcomePhase && (
        <Animated.View style={[styles.welcomeContentFixed, welcomeContentStyle]}>
          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {Array.from({ length: 6 }).map((_, i) => (
              <AnimatedDot 
                key={i} 
                index={i} 
                currentScreen={currentScreen} 
                bgThemeTransition={bgThemeTransition} 
              />
            ))}
          </View>

          {/* Primary Action CTA Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={currentScreen === 5 ? signInWithGitHub : handleContinue}
            disabled={signingIn}
          >
            <Animated.View style={[styles.ctaButton, ctaButtonStyle]}>
              {signingIn ? (
                <ActivityIndicator color={currentScreen === 5 ? "#FFFFFF" : "#000000"} />
              ) : (
                <View style={styles.ctaButtonContent}>
                  {currentScreen === 5 && (
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} style={{ marginRight: 8 }}>
                      <Path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </Svg>
                  )}
                  <Animated.Text style={[
                    styles.ctaText, 
                    ctaButtonTextStyle,
                    { 
                      fontFamily: 'Inter_600SemiBold' 
                    }
                  ]}>
                    {currentScreen === 5 ? 'Get Started with GitHub' : 'Continue'}
                  </Animated.Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  )
}

// -------------------------------------------------------------
// Stylesheet Definitions
// -------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoCenterContainer: {
    position: 'absolute',
    left: width / 2 - 50,
    top: height / 2 - 40,
    width: 100,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  brandTextContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: height / 2 + 44,
    alignItems: 'center',
    zIndex: 6,
  },
  brandTitle: {
    fontSize: 32,
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  whiteOverlay: {
    position: 'absolute',
    backgroundColor: '#FAFAFA',
    zIndex: 5,
  },
  headerContainer: {
    position: 'absolute',
    left: 24,
    zIndex: 2,
  },
  watermarkContainer: {
    position: 'absolute',
    left: '-45%',
    top: '12%',
    transform: [{ rotate: '-15deg' }],
    zIndex: 1,
  },
  welcomeContent: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    zIndex: 3,
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
    maxWidth: '90%',
  },
  ctaButton: {
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  ctaText: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  // Showcase Illustrations & Layout Styles
  showcaseIllustrationContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: height * 0.14,
    height: height * 0.42,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  showcaseWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workspaceCard: {
    width: width - 80,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  workspaceBlur: {
    flex: 1,
    padding: 16,
  },
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  windowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  windowTitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4,
    fontFamily: 'Inter_500Medium',
  },
  workspaceBody: {
    flex: 1,
  },
  codeText: {
    fontSize: 10,
    color: '#E2E8F0',
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 14,
  },
  floatingBadge: {
    position: 'absolute',
    borderRadius: 99,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  aiPromptCardBack: {
    position: 'absolute',
    width: width - 120,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    justifyContent: 'center',
    opacity: 0.15,
  },
  aiPromptBackText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
  },
  aiPromptCardActive: {
    width: width - 80,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  aiPromptBlur: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  aiPromptText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },
  cursor: {
    color: '#00E5FF',
    fontFamily: 'Inter_700Bold',
  },
  aiPromptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiPromptBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  aiPromptBtnText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'Inter_500Medium',
  },
  aiSendCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiIconBadge: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  aiIconBlur: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminalContainer: {
    width: width - 80,
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  terminalBlur: {
    flex: 1,
    padding: 14,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  terminalTitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 4,
    fontFamily: 'Inter_500Medium',
  },
  terminalBody: {
    flex: 1,
  },
  terminalLine: {
    fontSize: 10,
    color: '#E2E8F0',
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 15,
  },
  gitDiagram: {
    marginTop: 16,
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(167, 139, 250, 0.4)',
  },
  gitActiveDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A78BFA',
  },
  previewWindow: {
    width: width - 110,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 2,
  },
  previewBlur: {
    flex: 1,
    padding: 12,
  },
  previewHeader: {
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 12,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  previewAddressBar: {
    alignItems: 'center',
  },
  previewUrl: {
    fontSize: 8,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
  },
  previewBody: {
    flex: 1,
    gap: 8,
  },
  previewBoxSmall: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  previewLineWide: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  previewLineMedium: {
    width: '70%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cloudNodesContainer: {
    position: 'absolute',
    left: 10,
    bottom: 20,
    zIndex: 1,
  },
  shieldContainer: {
    position: 'absolute',
    right: 20,
    top: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 3,
  },
  shieldBlur: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOuterContainer: {
    width: width,
    height: height * 0.40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  gridColumn: {
    width: (width - 64) / 3,
    gap: 12,
  },
  gridItemCard: {
    width: '100%',
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    padding: 10,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  gridItemHeader: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridItemBody: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono_400Regular',
    color: '#0F172A',
    lineHeight: 12,
  },
  welcomeTextWrapper: {
    marginBottom: 24,
  },
  textWrapper: {
    width: '100%',
    paddingHorizontal: 24,
    height: 120,
    justifyContent: 'center',
    marginBottom: 20,
  },
  showcaseTitle: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    marginBottom: 12,
    textAlign: 'left',
  },
  showcaseDescription: {
    fontSize: 14,
    lineHeight: 22,
    maxWidth: '95%',
    textAlign: 'left',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  ctaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    position: 'absolute',
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 100,
  },
  skipText: {
    fontSize: 14,
  },
  scrollView: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: height * 0.12,
    height: height * 0.65,
    zIndex: 4,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  pageContainer: {
    width: width,
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageIllustrationContainer: {
    width: '100%',
    height: height * 0.38,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  glassCard3d: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  welcomeContentFixed: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    zIndex: 3,
  },
})
