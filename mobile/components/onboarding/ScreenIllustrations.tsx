import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSpring,
  Easing,
} from 'react-native-reanimated'
import Svg, { Path, Defs, Rect, Stop, Line, Circle, LinearGradient, RadialGradient } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Terminal,
  Shield,
  Check,
  Cpu,
  Globe,
  GitBranch,
  Lock,
  ExternalLink,
  Server,
  Code,
  Box,
  Sparkles,
  CheckCircle,
  Activity,
  RefreshCw
} from 'lucide-react-native'

import {
  ReactLogo,
  DockerLogo,
  GoLogo,
  TypeScriptLogo,
  OpenAILogo,
  ClaudeLogo,
  GeminiLogo,
  DeepSeekLogo,
  LlamaLogo,
  PythonLogo,
} from './LogoIcons'

const { width } = Dimensions.get('window')

// Exact CloudCode logo path from SVG asset
const CLOUD_PATH = "M744.133 448.718L745.663 450.478C749.573 448.638 756.023 442.638 759.343 439.478C801.523 399.328 807.143 335.468 773.443 288.286C752.363 258.958 720.453 239.246 684.793 233.516C627.733 224.495 571.543 240.02 532.953 284.215C513.333 306.683 501.953 327.078 486.903 352.228L446.383 419.478C424.033 456.788 407.123 486.278 370.333 511.798C322.653 544.868 277.043 552.878 220.513 550.948C199.333 550.218 189.463 551.898 167.033 548.058C111.983 538.618 66.3532 511.758 33.9532 466.048C4.72322 424.818 -6.02688 369.558 3.23312 320.198C19.2031 235.074 86.2132 173.155 171.333 161.818C178.423 160.874 215.733 159.576 216.813 157.721C221.973 148.846 231.733 123.239 239.273 112.014C258.803 82.9043 278.733 62.4333 306.733 42.3943C378.113 -8.68767 483.363 -13.7167 560.263 27.9013C568.783 32.5103 577.823 38.6133 586.293 44.0923C591.413 47.4043 600.223 56.2653 605.963 58.4383C606.413 58.4743 606.863 58.5104 607.323 58.5464C625.333 70.3774 639.813 94.3024 651.953 111.494C653.613 113.836 663.243 137.014 663.103 140.089C659.363 141.274 631.283 140.277 624.573 140.763C613.183 141.589 588.323 150.591 580.113 150.2C577.063 142.857 564.713 129.099 559.173 122.493C559.073 117.483 555.773 114.043 552.203 110.704C491.283 53.7463 386.263 57.7693 331.443 121.487C304.553 152.739 287.003 190.663 285.093 232.343C219.143 232.831 161.143 218.294 109.883 270.641C87.5331 293.249 75.2332 323.908 75.7732 355.698C76.5632 387.998 90.4232 418.588 114.173 440.488C147.973 472.268 189.523 480.028 234.743 478.448C279.973 476.878 316.993 460.968 348.503 427.798C362.653 412.718 372.893 395.008 384.023 377.728C434.863 298.804 467.723 210.738 563.753 176.305C645.703 146.92 740.993 155.774 808.173 214.497C846.483 247.982 870.443 294.617 873.453 345.588C873.823 351.568 873.993 374.398 873.413 379.908C869.123 419.878 851.813 457.338 824.153 486.518C786.803 525.918 735.413 548.968 681.153 550.678C669.933 551.018 658.523 550.698 647.273 550.768C569.733 551.188 491.963 549.938 414.443 550.988C420.043 546.248 432.513 537.208 433.173 530.618C439.673 521.988 452.193 510.948 458.973 500.978C461.403 497.408 474.013 475.968 476.413 475.308C482.143 473.738 503.713 474.508 510.313 474.548L616.123 474.668C660.013 474.668 701.183 478.218 739.293 451.948C741.343 450.538 742.053 450.628 744.133 448.718Z"

// -------------------------------------------------------------
// Helper Component: Soft Ambient Background Glow
// -------------------------------------------------------------
const AmbientGlow = ({ color, isDark = true }: { color: string; isDark?: boolean }) => {
  const bg = isDark ? '#05070B' : '#FAFAFA'
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="radialGlow" cx="50%" cy="30%" rx="48%" ry="48%">
            <Stop offset="0%" stopColor={color} stopOpacity={isDark ? 0.32 : 0.2} />
            <Stop offset="100%" stopColor={bg} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#radialGlow)" />
      </Svg>
    </View>
  )
}

// -------------------------------------------------------------
// Helper Component: Bottom Fading Gradient Overlay (Fades bottom half)
// -------------------------------------------------------------
const BottomFadeOverlay = ({ isDark = true }: { isDark?: boolean }) => {
  const bg = isDark ? '#05070B' : '#FAFAFA'
  return (
    <View style={styles.fadeOverlayContainer} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="fadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={bg} stopOpacity={0} />
            <Stop offset="35%" stopColor={bg} stopOpacity={0.5} />
            <Stop offset="100%" stopColor={bg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#fadeGrad)" />
      </Svg>
    </View>
  )
}

// -------------------------------------------------------------
// Helper Component: Premium Bezel-less Mobile Mock (Cut off at bottom)
// -------------------------------------------------------------
export const MobilePhoneMock = ({ children, isDarkInner = true }: { children: React.ReactNode; isDarkInner?: boolean }) => {
  const { isDark } = useAppTheme()
  return (
    <View style={[
      styles.phoneFrame,
      {
        borderColor: isDark ? '#1E293B' : '#E2E8F0',
        backgroundColor: isDark ? '#090D16' : '#FFFFFF',
      }
    ]}>
      {/* Notch / Dynamic Island */}
      <View style={styles.dynamicIsland} />
      
      {/* Reflective Sheen Highlights */}
      <View style={styles.reflectionOverlay} />

      {/* Internal Phone Screen Container */}
      <View style={[styles.screenInner, { backgroundColor: isDarkInner ? '#05070B' : '#FAFAFA' }]}>
        {children}
      </View>
    </View>
  )
}

// -------------------------------------------------------------
// Helper Component: Reanimated Floating Popup Card (Pops from behind phone)
// -------------------------------------------------------------
interface FloatingCardProps {
  active: boolean
  delay?: number
  x: number // Target X coordinate offset relative to phone center
  y: number // Target Y coordinate offset relative to phone center
  icon: React.ReactNode
  label: string
  isDarkTheme?: boolean
}

export const FloatingCard = ({
  active,
  delay = 0,
  x,
  y,
  icon,
  label,
  isDarkTheme = true,
}: FloatingCardProps) => {
  const scale = useSharedValue(0)
  const animX = useSharedValue(0)
  const animY = useSharedValue(0)
  const hoverOffset = useSharedValue(0)

  useEffect(() => {
    if (active) {
      // 1. Popup card scaling & moving out from behind center of phone (0, 0)
      scale.value = withDelay(
        delay,
        withSpring(1, { damping: 14, stiffness: 85 })
      )
      animX.value = withDelay(
        delay,
        withSpring(x, { damping: 14, stiffness: 85 })
      )
      animY.value = withDelay(
        delay,
        withSpring(y, { damping: 14, stiffness: 85 })
      )
      
      // 2. Loop hover bobbing animation (sine wave behavior, only active when fully popped out)
      hoverOffset.value = withDelay(
        delay + 450,
        withRepeat(
          withTiming(6, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        )
      )
    } else {
      scale.value = withTiming(0, { duration: 250 })
      animX.value = withTiming(0, { duration: 250 })
      animY.value = withTiming(0, { duration: 250 })
      hoverOffset.value = withTiming(0, { duration: 250 })
    }
  }, [active, x, y, delay])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: scale.value,
      transform: [
        { translateX: animX.value },
        { translateY: animY.value + hoverOffset.value },
        { scale: scale.value },
      ],
    }
  })

  return (
    <Animated.View style={[
      styles.floatingCardContainer,
      animatedStyle,
      {
        backgroundColor: isDarkTheme ? 'rgba(21, 26, 38, 0.85)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)',
      }
    ]}>
      <BlurView intensity={isDarkTheme ? 25 : 30} tint={isDarkTheme ? 'dark' : 'light'} style={styles.floatingCardBlur}>
        <View style={styles.floatingCardIconWrapper}>
          {icon}
        </View>
        <Text style={[
          styles.floatingCardLabel,
          { color: isDarkTheme ? '#E2E8F0' : '#0F172A', fontFamily: 'Inter_600SemiBold' }
        ]}>
          {label}
        </Text>
      </BlurView>
    </Animated.View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 0: Glowing CC Logo (Splash)
// -------------------------------------------------------------
export const Screen0Illustration = ({ active = false }: { active?: boolean }) => {
  const pulse = useSharedValue(0.96)

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withTiming(1.04, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    } else {
      pulse.value = 0.96
    }
  }, [active])

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  return (
    <View style={styles.showcaseWrapper}>
      {/* Soft Purple Glow Behind Phone */}
      <AmbientGlow color="#8B5CF6" />

      {/* Floating Cards Popup & Hover (Layered behind phone, positioned fully outside) */}
      <FloatingCard
        active={active}
        delay={0}
        x={-135}
        y={-100}
        icon={<Sparkles size={16} color="#C084FC" />}
        label="AI Composer"
      />
      <FloatingCard
        active={active}
        delay={150}
        x={135}
        y={-105}
        icon={<Box size={16} color="#60A5FA" />}
        label="Containers"
      />
      <FloatingCard
        active={active}
        delay={300}
        x={-145}
        y={10}
        icon={<Terminal size={16} color="#34D399" />}
        label="Remote Shell"
      />
      <FloatingCard
        active={active}
        delay={450}
        x={145}
        y={20}
        icon={<Globe size={16} color="#F59E0B" />}
        label="Live Preview"
      />

      {/* Main Bezel-less Mobile Phone */}
      <MobilePhoneMock>
        <View style={[styles.screenContentCentered, { padding: 14, paddingTop: 24 }]}>
          <Text style={styles.miniHeader}>CLOUDCODE</Text>
          <Animated.View style={[styles.pulseLogoContainer, logoAnimatedStyle]}>
            <Svg width={72} height={72} viewBox="0 0 874 552">
              <Path
                d={CLOUD_PATH}
                fill="none"
                stroke="#00E5FF"
                strokeWidth={18}
              />
            </Svg>
            <View style={styles.logoAura} />
          </Animated.View>
          
          <View style={styles.miniEditorMock}>
            <Text style={styles.editorLineText}><Text style={styles.keywordColor}>const</Text> config = <Text style={styles.keywordColor}>await</Text> CC.init()</Text>
            <Text style={styles.editorLineText}>CC.startContainer(<Text style={styles.stringColor}>'react-app'</Text>)</Text>
          </View>
        </View>
      </MobilePhoneMock>

      {/* Bottom Fade Gradient Cover */}
      <BottomFadeOverlay />
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 1: Cloud Runtimes
// -------------------------------------------------------------
export const Screen1Illustration = ({ active = false }: { active?: boolean }) => {
  return (
    <View style={styles.showcaseWrapper}>
      {/* Soft Teal Glow Behind Phone */}
      <AmbientGlow color="#0D9488" />

      {/* Floating Cards (Runtimes - Layered behind phone, positioned fully outside) */}
      <FloatingCard
        active={active}
        delay={0}
        x={-135}
        y={-100}
        icon={<DockerLogo />}
        label="Docker Dev"
      />
      <FloatingCard
        active={active}
        delay={150}
        x={135}
        y={-105}
        icon={<ReactLogo />}
        label="Node.js"
      />
      <FloatingCard
        active={active}
        delay={300}
        x={-145}
        y={10}
        icon={<PythonLogo />}
        label="Python 3"
      />
      <FloatingCard
        active={active}
        delay={450}
        x={145}
        y={20}
        icon={<TypeScriptLogo />}
        label="TypeScript"
      />

      {/* Bezel-less Mobile Phone */}
      <MobilePhoneMock>
        <View style={[styles.screenContentCentered, { paddingTop: 24 }]}>
          <Text style={styles.miniHeader}>CONTAINERS</Text>
          
          <View style={styles.containerStatusList}>
            {/* Row 1: Node.js Container */}
            <View style={styles.containerStatusRow}>
              <View style={styles.logoContainerSmall}>
                <ReactLogo />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.containerRowTitle}>Nodejs Runtime</Text>
                <Text style={styles.containerRowDesc}>Port 3000 · Active</Text>
              </View>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            </View>

            {/* Row 2: Python Container */}
            <View style={styles.containerStatusRow}>
              <View style={styles.logoContainerSmall}>
                <PythonLogo />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.containerRowTitle}>Python 3 Box</Text>
                <Text style={styles.containerRowDesc}>WSGI · Sleeping</Text>
              </View>
              <View style={[styles.statusIndicator, { backgroundColor: '#F59E0B' }]} />
            </View>

            {/* Row 3: Docker Container */}
            <View style={styles.containerStatusRow}>
              <View style={styles.logoContainerSmall}>
                <DockerLogo />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.containerRowTitle}>Docker Engine</Text>
                <Text style={styles.containerRowDesc}>Active · 1.4 GB</Text>
              </View>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            </View>
          </View>

          <View style={styles.miniInfraFooter}>
            <Activity size={10} color="#00E5FF" style={{ marginRight: 4 }} />
            <Text style={styles.infraStatsText}>CPU: 1.2%  RAM: 512MB / 2GB</Text>
          </View>
        </View>
      </MobilePhoneMock>

      {/* Bottom Fade Gradient Cover */}
      <BottomFadeOverlay />
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 2: Describe & AI Composer
// -------------------------------------------------------------
export const Screen2Illustration = ({ active = false }: { active?: boolean }) => {
  return (
    <View style={styles.showcaseWrapper}>
      {/* Soft Indigo Glow Behind Phone */}
      <AmbientGlow color="#6366F1" />

      {/* Floating Cards (AI Models - Layered behind phone, positioned fully outside) */}
      <FloatingCard
        active={active}
        delay={0}
        x={-135}
        y={-100}
        icon={<ClaudeLogo />}
        label="Claude 3.5"
      />
      <FloatingCard
        active={active}
        delay={150}
        x={135}
        y={-105}
        icon={<OpenAILogo />}
        label="GPT-4o"
      />
      <FloatingCard
        active={active}
        delay={300}
        x={-145}
        y={10}
        icon={<GeminiLogo />}
        label="Gemini Flash"
      />
      <FloatingCard
        active={active}
        delay={450}
        x={145}
        y={20}
        icon={<DeepSeekLogo />}
        label="DeepSeek"
      />

      {/* Bezel-less Mobile Phone */}
      <MobilePhoneMock>
        <View style={[styles.screenContentCentered, { paddingTop: 24 }]}>
          <Text style={styles.miniHeader}>AI COMPOSER</Text>

          <View style={styles.chatContainer}>
            {/* User Prompt */}
            <View style={styles.chatBubbleUser}>
              <Text style={styles.chatTextUser}>Create express auth API...</Text>
            </View>

            {/* AI Assistant Output */}
            <View style={styles.chatBubbleAi}>
              <Text style={styles.chatTextAi}>Spinning up Docker workspace. Running code assembly...</Text>
              
              <View style={styles.miniCheckList}>
                <View style={styles.miniCheckRow}>
                  <Check size={8} color="#34D399" strokeWidth={3} />
                  <Text style={styles.miniCheckText}>PostgreSQL DB active</Text>
                </View>
                <View style={styles.miniCheckRow}>
                  <Check size={8} color="#34D399" strokeWidth={3} />
                  <Text style={styles.miniCheckText}>Express routes generated</Text>
                </View>
                <View style={styles.miniCheckRow}>
                  <Animated.View style={styles.spinningIndicatorContainer}>
                    <RefreshCw size={8} color="#00E5FF" />
                  </Animated.View>
                  <Text style={[styles.miniCheckText, { color: '#00E5FF' }]}>Bundling JWT auth...</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </MobilePhoneMock>

      {/* Bottom Fade Gradient Cover */}
      <BottomFadeOverlay />
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 3: Git Branch & Terminal
// -------------------------------------------------------------
export const Screen3Illustration = ({ active = false }: { active?: boolean }) => {
  return (
    <View style={styles.showcaseWrapper}>
      {/* Soft Blue Glow Behind Phone */}
      <AmbientGlow color="#2563EB" />

      {/* Floating Cards (Git/Terminal - Layered behind phone, positioned fully outside) */}
      <FloatingCard
        active={active}
        delay={0}
        x={-135}
        y={-100}
        icon={<Terminal size={16} color="#00E5FF" />}
        label="Remote Shell"
      />
      <FloatingCard
        active={active}
        delay={150}
        x={135}
        y={-105}
        icon={<GitBranch size={16} color="#A78BFA" />}
        label="Branching"
      />
      <FloatingCard
        active={active}
        delay={300}
        x={-145}
        y={10}
        icon={<Lock size={16} color="#34D399" />}
        label="Secrets"
      />
      <FloatingCard
        active={active}
        delay={450}
        x={145}
        y={20}
        icon={<CheckCircle size={16} color="#60A5FA" />}
        label="PR Verified"
      />

      {/* Bezel-less Mobile Phone */}
      <MobilePhoneMock>
        <View style={[styles.screenContentCentered, { paddingTop: 24 }]}>
          <Text style={styles.miniHeader}>WORKFLOWS</Text>

          {/* Terminal Console Mock */}
          <View style={styles.miniTerminalWindow}>
            <View style={styles.miniTerminalHeader}>
              <View style={[styles.terminalDot, { backgroundColor: '#EF4444' }]} />
              <View style={[styles.terminalDot, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.terminalDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.terminalTitleText}>bash · auth</Text>
            </View>
            <View style={styles.miniTerminalBody}>
              <Text style={styles.terminalTextLine}>$ git checkout -b feat/jwt</Text>
              <Text style={styles.terminalTextLine}>$ git commit -m "feat: jwt auth"</Text>
              <Text style={styles.terminalTextLineSuccess}>[feat/jwt 4c82b9] commit OK</Text>
            </View>
          </View>

          {/* Visual Branch Diagram */}
          <View style={styles.gitVisualContainer}>
            <Svg width="100%" height={28} viewBox="0 0 100 28">
              <Line x1="5" y1="14" x2="95" y2="14" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <Path d="M 25 14 Q 48 3 70 14" fill="none" stroke="#A78BFA" strokeWidth="1.5" />
              <Circle cx="12" cy="14" r="3.5" fill="#10B981" />
              <Circle cx="25" cy="14" r="2.5" fill="#FFFFFF" />
              <Circle cx="48" cy="7" r="3" fill="#A78BFA" />
              <Circle cx="70" cy="14" r="3" fill="#00E5FF" />
            </Svg>
            <Text style={styles.gitStatusBadgeText}>✓ Branch synchronized</Text>
          </View>
        </View>
      </MobilePhoneMock>

      {/* Bottom Fade Gradient Cover */}
      <BottomFadeOverlay />
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 4: Previews & Deploy
// -------------------------------------------------------------
export const Screen4Illustration = ({ active = false }: { active?: boolean }) => {
  return (
    <View style={styles.showcaseWrapper}>
      {/* Soft Emerald Glow Behind Phone */}
      <AmbientGlow color="#059669" />

      {/* Floating Cards (SSL / Previews - Layered behind phone, positioned fully outside) */}
      <FloatingCard
        active={active}
        delay={0}
        x={-135}
        y={-100}
        icon={<Shield size={16} color="#34D399" />}
        label="TLS Tunnel"
      />
      <FloatingCard
        active={active}
        delay={150}
        x={135}
        y={-105}
        icon={<ExternalLink size={16} color="#00E5FF" />}
        label="Live URL"
      />
      <FloatingCard
        active={active}
        delay={300}
        x={-145}
        y={10}
        icon={<Lock size={16} color="#A78BFA" />}
        label="SSL Secure"
      />
      <FloatingCard
        active={active}
        delay={450}
        x={145}
        y={20}
        icon={<Server size={16} color="#F59E0B" />}
        label="Edge Deploy"
      />

      {/* Bezel-less Mobile Phone */}
      <MobilePhoneMock>
        <View style={[styles.screenContentCentered, { paddingTop: 24 }]}>
          <Text style={styles.miniHeader}>LIVE PREVIEW</Text>

          {/* Faux Web Browser Screen */}
          <View style={styles.miniBrowserWindow}>
            <View style={styles.miniBrowserAddressBar}>
              <Lock size={6} color="#10B981" style={{ marginRight: 2 }} />
              <Text style={styles.miniBrowserUrlText}>my-app.cloudcode.live</Text>
            </View>
            <View style={styles.miniBrowserContent}>
              <Text style={styles.browserTitleText}>Traffic Analytics</Text>
              
              {/* Svg Graph */}
              <Svg width="100%" height={24} viewBox="0 0 80 24">
                <Path
                  d="M 0 18 Q 20 5 40 14 T 80 7"
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth="1.5"
                />
                <Path
                  d="M 0 18 Q 20 5 40 14 T 80 7 L 80 24 L 0 24 Z"
                  fill="rgba(0, 229, 255, 0.08)"
                />
              </Svg>

              <View style={styles.browserStatsRow}>
                <View style={styles.browserStatBox}>
                  <Text style={styles.browserStatVal}>12.4k</Text>
                  <Text style={styles.browserStatLbl}>visits</Text>
                </View>
                <View style={styles.browserStatBox}>
                  <Text style={styles.browserStatVal}>99.9%</Text>
                  <Text style={styles.browserStatLbl}>uptime</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </MobilePhoneMock>

      {/* Bottom Fade Gradient Cover */}
      <BottomFadeOverlay />
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 5: Final Overview (Light Theme)
// -------------------------------------------------------------
export const Screen5Illustration = ({ active = false }: { active?: boolean }) => {
  return (
    <View style={styles.showcaseWrapper}>
      {/* Soft Gray/Slate Glow Behind Phone - Adapts to Light Mode background */}
      <AmbientGlow color="#64748B" isDark={false} />

      {/* Floating Cards (Light Mode styled cards since Screen 5 background is light - Layered behind phone, positioned fully outside) */}
      <FloatingCard
        active={active}
        delay={0}
        x={-135}
        y={-100}
        icon={<CheckCircle size={16} color="#10B981" />}
        label="Workspace Ready"
        isDarkTheme={false}
      />
      <FloatingCard
        active={active}
        delay={150}
        x={135}
        y={-105}
        icon={<Code size={16} color="#0F172A" />}
        label="GitHub Auth"
        isDarkTheme={false}
      />
      <FloatingCard
        active={active}
        delay={300}
        x={-145}
        y={10}
        icon={<Box size={16} color="#3B82F6" />}
        label="Cloud Box"
        isDarkTheme={false}
      />
      <FloatingCard
        active={active}
        delay={450}
        x={145}
        y={20}
        icon={<Sparkles size={16} color="#8B5CF6" />}
        label="Start Coding"
        isDarkTheme={false}
      />

      {/* Bezel-less Mobile Phone (Styled with dark internal content to pop against the light screen background) */}
      <MobilePhoneMock isDarkInner={true}>
        <View style={[styles.screenContentCentered, { paddingTop: 24 }]}>
          <Text style={styles.miniHeader}>DASHBOARD</Text>
          
          <View style={styles.summaryDashboardMock}>
            <View style={styles.summaryDashboardHeader}>
              <CheckCircle size={10} color="#10B981" />
              <Text style={styles.summaryDashboardTitle}>Workspace Configured</Text>
            </View>
            
            <View style={styles.summaryMetricsGrid}>
              <View style={styles.summaryMetricItem}>
                <Text style={styles.summaryMetricVal}>4</Text>
                <Text style={styles.summaryMetricLbl}>Runtimes</Text>
              </View>
              <View style={styles.summaryMetricItem}>
                <Text style={styles.summaryMetricVal}>2</Text>
                <Text style={styles.summaryMetricLbl}>Containers</Text>
              </View>
            </View>

            <View style={styles.editorLineTextSmallContainer}>
              <Text style={styles.editorLineTextSmall}>· Node.js v20 (active)</Text>
              <Text style={styles.editorLineTextSmall}>· PostgreSQL (ready)</Text>
              <Text style={styles.editorLineTextSmall}>· Secure TLS tunnel (OK)</Text>
            </View>
          </View>
        </View>
      </MobilePhoneMock>

      {/* Bottom Fade Gradient Cover (Light Mode version) */}
      <BottomFadeOverlay isDark={false} />
    </View>
  )
}

// -------------------------------------------------------------
// Component Stylesheet
// -------------------------------------------------------------
const styles = StyleSheet.create({
  showcaseWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  // Mobile Phone Mock frame - giant size, positioned to crop exactly the bottom half
  phoneFrame: {
    width: 220,
    height: 380,
    borderRadius: 36,
    borderWidth: 8,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    position: 'absolute',
    bottom: -190, // Pushed exactly half-way down (380 / 2 = 190)
    zIndex: 5,    // Above the floating cards, below the bottom fade overlay
  },
  dynamicIsland: {
    position: 'absolute',
    top: 12,
    left: '50%',
    marginLeft: -32,
    width: 64,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#000000',
    zIndex: 99,
  },
  reflectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    pointerEvents: 'none',
    zIndex: 98,
  },
  screenInner: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
  },
  screenContentCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    paddingTop: 28,
  },
  // Floating popup cards positioned behind the phone (compact 70x70 size)
  floatingCardContainer: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 2, // Layered behind the phone Frame (which is zIndex 5)
  },
  floatingCardBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  floatingCardIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  floatingCardLabel: {
    fontSize: 7.5,
    textAlign: 'center',
    lineHeight: 9.5,
    letterSpacing: -0.1,
  },
  // Bottom Fade Gradient container overlay (Deep fade covering the bottom half of the phone)
  fadeOverlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180, // Taller fade overlay to cover the bottom half of the phone
    zIndex: 8,   // Placed above phoneFrame (5) to fade out the bottom device half
  },
  // Screen 0 Previews
  miniHeader: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.45)',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  pulseLogoContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  logoAura: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    zIndex: -1,
  },
  miniEditorMock: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 6,
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  editorLineText: {
    fontSize: 6,
    color: '#E2E8F0',
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 8,
    marginBottom: 2,
  },
  keywordColor: {
    color: '#F472B6',
  },
  stringColor: {
    color: '#34D399',
  },
  // Screen 1 Previews
  containerStatusList: {
    width: '100%',
    gap: 5,
    marginVertical: 8,
  },
  containerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  logoContainerSmall: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerRowTitle: {
    fontSize: 7,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  containerRowDesc: {
    fontSize: 6,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  statusIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 4,
  },
  miniInfraFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infraStatsText: {
    fontSize: 5.5,
    color: 'rgba(255, 255, 255, 0.35)',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  // Screen 2 Previews
  chatContainer: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366F1',
    borderRadius: 8,
    borderBottomRightRadius: 2,
    padding: 6,
    maxWidth: '85%',
  },
  chatTextUser: {
    fontSize: 6.5,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  chatBubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    borderBottomLeftRadius: 2,
    padding: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
    width: '95%',
  },
  chatTextAi: {
    fontSize: 6,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 8.5,
  },
  miniCheckList: {
    marginTop: 6,
    gap: 3.5,
  },
  miniCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniCheckText: {
    fontSize: 5.5,
    color: '#A7F3D0',
    fontFamily: 'Inter_600SemiBold',
  },
  spinningIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Screen 3 Previews
  miniTerminalWindow: {
    width: '100%',
    backgroundColor: '#020617',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginVertical: 6,
  },
  miniTerminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  terminalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 2.5,
  },
  terminalTitleText: {
    fontSize: 5.5,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_500Medium',
    marginLeft: 3,
  },
  miniTerminalBody: {
    padding: 6,
    gap: 3,
  },
  terminalTextLine: {
    fontSize: 5.5,
    color: '#E2E8F0',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  terminalTextLineSuccess: {
    fontSize: 5.5,
    color: '#10B981',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  gitVisualContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  gitStatusBadgeText: {
    fontSize: 5.5,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  // Screen 4 Previews
  miniBrowserWindow: {
    width: '100%',
    backgroundColor: '#030712',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginVertical: 4,
  },
  miniBrowserAddressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  miniBrowserUrlText: {
    fontSize: 5,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_400Regular',
  },
  miniBrowserContent: {
    padding: 6,
  },
  browserTitleText: {
    fontSize: 6,
    color: '#10B981',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  browserStatsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  browserStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    padding: 3,
    alignItems: 'center',
  },
  browserStatVal: {
    fontSize: 7,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  browserStatLbl: {
    fontSize: 4.5,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
  },
  // Screen 5 Previews
  summaryDashboardMock: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    marginVertical: 4,
  },
  summaryDashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 5,
    marginBottom: 6,
  },
  summaryDashboardTitle: {
    fontSize: 6.5,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  summaryMetricsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  summaryMetricItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    padding: 4,
    alignItems: 'center',
  },
  summaryMetricVal: {
    fontSize: 9,
    color: '#00E5FF',
    fontFamily: 'Inter_700Bold',
  },
  summaryMetricLbl: {
    fontSize: 5,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_500Medium',
  },
  editorLineTextSmallContainer: {
    gap: 2,
  },
  editorLineTextSmall: {
    fontSize: 5.5,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'JetBrainsMono_400Regular',
  },
})
