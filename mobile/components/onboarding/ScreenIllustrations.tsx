import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import Svg, { Path, Defs, Rect, Stop, Line, Circle, LinearGradient, RadialGradient } from 'react-native-svg'
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
export const AmbientGlow = ({ color, isDark = true }: { color: string; isDark?: boolean }) => {
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
export const BottomFadeOverlay = ({ isDark = true }: { isDark?: boolean }) => {
  const bg = isDark ? '#05070B' : '#FAFAFA'
  return (
    <View style={styles.fadeOverlayContainer} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="fadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={bg} stopOpacity={0} />
            <Stop offset="30%" stopColor={bg} stopOpacity={0.4} />
            <Stop offset="65%" stopColor={bg} stopOpacity={1} />
            <Stop offset="100%" stopColor={bg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#fadeGrad)" />
      </Svg>
    </View>
  )
}

// -------------------------------------------------------------
// Helper Component: Premium Bezel-less Mobile Mock
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
// Onboarding Illustration Component 0: Glowing CC Logo (Splash - Empty Foreground)
// -------------------------------------------------------------
export const Screen0Illustration = ({ active = false }: { active?: boolean }) => {
  return (
    <View style={styles.showcaseWrapper} />
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 1: Cloud Runtimes
// -------------------------------------------------------------
export const Screen1Illustration = ({ active = false }: { active?: boolean }) => {
  return (
    <View style={styles.showcaseWrapper}>
      {/* Bezel-less Mobile Phone */}
      <MobilePhoneMock>
        <View style={[styles.screenContentCentered, { paddingTop: 28 }]}>
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
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 2: Describe & AI Composer
// -------------------------------------------------------------
export const Screen2Illustration = ({ active = false }: { active?: boolean }) => {
  return (
    <View style={styles.showcaseWrapper}>
      {/* Bezel-less Mobile Phone */}
      <MobilePhoneMock>
        <View style={[styles.screenContentCentered, { paddingTop: 28 }]}>
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
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 3: Git Branch & Terminal
// -------------------------------------------------------------
export const Screen3Illustration = ({ active = false }: { active?: boolean }) => {
  return (
    <View style={styles.showcaseWrapper}>
      {/* Bezel-less Mobile Phone */}
      <MobilePhoneMock>
        <View style={[styles.screenContentCentered, { paddingTop: 28 }]}>
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
            <Svg width="100%" height={26} viewBox="0 0 100 26">
              <Line x1="5" y1="13" x2="95" y2="13" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <Path d="M 25 13 Q 48 3 70 13" fill="none" stroke="#A78BFA" strokeWidth="1.5" />
              <Circle cx="12" cy="13" r="3" fill="#10B981" />
              <Circle cx="25" cy="13" r="2" fill="#FFFFFF" />
              <Circle cx="48" cy="7" r="2.5" fill="#A78BFA" />
              <Circle cx="70" cy="13" r="2.5" fill="#00E5FF" />
            </Svg>
            <Text style={styles.gitStatusBadgeText}>✓ Branch synchronized</Text>
          </View>
        </View>
      </MobilePhoneMock>
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 4: Previews & Deploy
// -------------------------------------------------------------
export const Screen4Illustration = ({ active = false }: { active?: boolean }) => {
  return (
    <View style={styles.showcaseWrapper}>
      {/* Bezel-less Mobile Phone */}
      <MobilePhoneMock>
        <View style={[styles.screenContentCentered, { paddingTop: 28 }]}>
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
              <Svg width="100%" height={22} viewBox="0 0 80 22">
                <Path
                  d="M 0 16 Q 20 5 40 13 T 80 6"
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth="1.5"
                />
                <Path
                  d="M 0 16 Q 20 5 40 13 T 80 6 L 80 22 L 0 22 Z"
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
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 5: Final Overview (Light Theme)
// -------------------------------------------------------------
export const Screen5Illustration = ({ active = false }: { active?: boolean }) => {
  return (
    <View style={styles.showcaseWrapper}>
      {/* Bezel-less Mobile Phone (Styled with dark internal content to pop against the light screen background) */}
      <MobilePhoneMock isDarkInner={true}>
        <View style={[styles.screenContentCentered, { paddingTop: 28 }]}>
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
  // Mobile Phone Mock frame — large size, pushed down so only top half visible
  phoneFrame: {
    width: 290,
    height: 520,
    borderRadius: 38,
    borderWidth: 4,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
    position: 'absolute',
    bottom: -160,
    zIndex: 5,
  },
  dynamicIsland: {
    position: 'absolute',
    top: 12,
    left: '50%',
    marginLeft: -32,
    width: 64,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#000000',
    zIndex: 99,
  },
  reflectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    pointerEvents: 'none',
    zIndex: 98,
  },
  screenInner: {
    flex: 1,
    borderRadius: 33,
    overflow: 'hidden',
  },
  screenContentCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    paddingTop: 32,
  },
  // Bottom Fade Gradient container overlay (Deep fade covering the bottom half of the phone)
  fadeOverlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: -24,
    right: -24,
    height: 220,
    zIndex: 8,
  },
  // Welcome Screen (No Mobile Frame) Styles
  welcomeCenterContent: {
    position: 'absolute',
    bottom: 155,
    alignItems: 'center',
    justifyContent: 'center',
    width: width - 48,
    zIndex: 5,
  },
  pulseLogoContainerLarge: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  logoAuraLarge: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    zIndex: -1,
  },
  editorGlassCard: {
    width: 270,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  editorGlassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 6,
    marginBottom: 8,
  },
  editorGlassTitle: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'Inter_500Medium',
    marginLeft: 6,
  },
  editorGlassBody: {
    gap: 4,
  },
  editorLineTextLarge: {
    fontSize: 7.5,
    color: '#F8FAFC',
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 12,
  },
  // Screen 0 Previews
  miniHeader: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.45)',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  pulseLogoContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 6,
  },
  logoAura: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    zIndex: -1,
  },
  miniEditorMock: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  editorLineText: {
    fontSize: 7,
    color: '#E2E8F0',
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 10,
    marginBottom: 3,
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
    gap: 6,
    marginVertical: 10,
  },
  containerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  logoContainerSmall: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerRowTitle: {
    fontSize: 8,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  containerRowDesc: {
    fontSize: 6.5,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  miniInfraFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infraStatsText: {
    fontSize: 6,
    color: 'rgba(255, 255, 255, 0.35)',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  // Screen 2 Previews
  chatContainer: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366F1',
    borderRadius: 8,
    borderBottomRightRadius: 2,
    padding: 8,
    maxWidth: '85%',
  },
  chatTextUser: {
    fontSize: 7.5,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  chatBubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    borderBottomLeftRadius: 2,
    padding: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
    width: '95%',
  },
  chatTextAi: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 9.5,
  },
  miniCheckList: {
    marginTop: 8,
    gap: 4,
  },
  miniCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  miniCheckText: {
    fontSize: 6.5,
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
    marginVertical: 8,
  },
  miniTerminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  terminalDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 3,
  },
  terminalTitleText: {
    fontSize: 6,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_500Medium',
    marginLeft: 4,
  },
  miniTerminalBody: {
    padding: 8,
    gap: 4,
  },
  terminalTextLine: {
    fontSize: 6,
    color: '#E2E8F0',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  terminalTextLineSuccess: {
    fontSize: 6,
    color: '#10B981',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  gitVisualContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  gitStatusBadgeText: {
    fontSize: 6,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_500Medium',
    marginTop: 3,
  },
  // Screen 4 Previews
  miniBrowserWindow: {
    width: '100%',
    backgroundColor: '#030712',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginVertical: 6,
  },
  miniBrowserAddressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  miniBrowserUrlText: {
    fontSize: 5.5,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_400Regular',
  },
  miniBrowserContent: {
    padding: 8,
  },
  browserTitleText: {
    fontSize: 7,
    color: '#10B981',
    fontFamily: 'Inter_700Bold',
    marginBottom: 5,
  },
  browserStatsRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 8,
  },
  browserStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    padding: 4,
    alignItems: 'center',
  },
  browserStatVal: {
    fontSize: 8,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  browserStatLbl: {
    fontSize: 5,
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
    padding: 10,
    marginVertical: 6,
  },
  summaryDashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 6,
    marginBottom: 8,
  },
  summaryDashboardTitle: {
    fontSize: 7.5,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  summaryMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  summaryMetricItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    padding: 5,
    alignItems: 'center',
  },
  summaryMetricVal: {
    fontSize: 10,
    color: '#00E5FF',
    fontFamily: 'Inter_700Bold',
  },
  summaryMetricLbl: {
    fontSize: 6,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_500Medium',
  },
  editorLineTextSmallContainer: {
    gap: 3,
  },
  editorLineTextSmall: {
    fontSize: 6,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'JetBrainsMono_400Regular',
  },
})
