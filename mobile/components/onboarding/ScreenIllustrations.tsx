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
  const btnColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'
  return (
    <View style={[
      styles.phoneFrame,
      {
        borderColor: isDark ? '#2A3244' : '#C8CDD5',
        backgroundColor: isDark ? '#111827' : '#F1F3F5',
      }
    ]}>
      {/* Dynamic Island */}
      <View style={styles.dynamicIsland} />

      {/* Top edge metallic highlight */}
      <View style={styles.topEdgeHighlight} />

      {/* Left side: Mute toggle switch */}
      <View style={[styles.muteToggle, { backgroundColor: btnColor }]} />

      {/* Left side: Volume Up */}
      <View style={[styles.volumeUp, { backgroundColor: btnColor }]} />

      {/* Left side: Volume Down */}
      <View style={[styles.volumeDown, { backgroundColor: btnColor }]} />

      {/* Right side: Power button */}
      <View style={[styles.powerButton, { backgroundColor: btnColor }]} />

      {/* Internal Phone Screen */}
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
      <MobilePhoneMock>
        <View style={styles.phoneScreenContent}>
          {/* Top Header */}
          <View style={styles.phoneHeader}>
            <Text style={styles.phoneHeaderTitle}>Environments</Text>
            <View style={styles.badgeActive}>
              <Text style={styles.badgeActiveText}>3 Active</Text>
            </View>
          </View>

          {/* Runtimes list */}
          <View style={styles.phoneCardList}>
            <View style={styles.phoneItemCard}>
              <View style={styles.phoneItemLeft}>
                <View style={[styles.phoneItemIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <ReactLogo />
                </View>
                <View>
                  <Text style={styles.phoneItemTitle}>Node.js Runtime</Text>
                  <Text style={styles.phoneItemSubtitle}>Port 3000 · main-server</Text>
                </View>
              </View>
              <View style={styles.phoneStatusDotGreen} />
            </View>

            <View style={styles.phoneItemCard}>
              <View style={styles.phoneItemLeft}>
                <View style={[styles.phoneItemIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <PythonLogo />
                </View>
                <View>
                  <Text style={styles.phoneItemTitle}>Python 3.11 Box</Text>
                  <Text style={styles.phoneItemSubtitle}>Port 8000 · ai-model</Text>
                </View>
              </View>
              <View style={styles.phoneStatusDotGreen} />
            </View>

            <View style={styles.phoneItemCard}>
              <View style={styles.phoneItemLeft}>
                <View style={[styles.phoneItemIconContainer, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                  <DockerLogo />
                </View>
                <View>
                  <Text style={styles.phoneItemTitle}>PostgreSQL DB</Text>
                  <Text style={styles.phoneItemSubtitle}>Port 5432 · postgres</Text>
                </View>
              </View>
              <View style={styles.phoneStatusDotGreen} />
            </View>
          </View>

          {/* Resource stats */}
          <View style={styles.phoneResourceStats}>
            <View style={styles.statBoxCol}>
              <Text style={styles.statBoxLabel}>CPU USAGE</Text>
              <Text style={styles.statBoxValue}>1.4%</Text>
            </View>
            <View style={styles.statBoxCol}>
              <Text style={styles.statBoxLabel}>RAM ALLOCATED</Text>
              <Text style={styles.statBoxValue}>512 MB</Text>
            </View>
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
      <MobilePhoneMock>
        <View style={styles.phoneScreenContent}>
          {/* Top Header */}
          <View style={styles.phoneHeader}>
            <Text style={styles.phoneHeaderTitle}>AI Composer</Text>
            <Sparkles size={14} color="#A78BFA" />
          </View>

          {/* Chat message bubbles */}
          <View style={styles.phoneChatList}>
            {/* User message */}
            <View style={styles.phoneChatUserBubble}>
              <Text style={styles.phoneChatUserText}>Create express app with JWT auth and Postgres DB</Text>
            </View>

            {/* AI Response Card */}
            <View style={styles.phoneChatAiCard}>
              <Text style={styles.phoneChatAiText}>
                I'm generating the workspace files and containers now...
              </Text>
              <View style={styles.phoneAiSeparator} />
              
              <View style={styles.phoneAiTaskList}>
                <View style={styles.phoneAiTaskRow}>
                  <CheckCircle size={10} color="#10B981" />
                  <Text style={styles.phoneAiTaskTextDone}>Docker compose configured</Text>
                </View>
                <View style={styles.phoneAiTaskRow}>
                  <CheckCircle size={10} color="#10B981" />
                  <Text style={styles.phoneAiTaskTextDone}>Express auth routes created</Text>
                </View>
                <View style={styles.phoneAiTaskRow}>
                  <RefreshCw size={10} color="#00E5FF" />
                  <Text style={styles.phoneAiTaskTextActive}>Provisioning PostgreSQL DB...</Text>
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
      <MobilePhoneMock>
        <View style={styles.phoneScreenContent}>
          {/* Top Header */}
          <View style={styles.phoneHeader}>
            <Text style={styles.phoneHeaderTitle}>Workflows</Text>
            <View style={styles.badgeGitBranch}>
              <GitBranch size={10} color="#818CF8" style={{ marginRight: 3 }} />
              <Text style={styles.badgeGitBranchText}>main</Text>
            </View>
          </View>

          {/* Terminal Box */}
          <View style={styles.phoneTerminalBox}>
            <View style={styles.phoneTerminalHeader}>
              <View style={styles.phoneTerminalDots}>
                <View style={[styles.terminalDot, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.terminalDot, { backgroundColor: '#F59E0B' }]} />
                <View style={[styles.terminalDot, { backgroundColor: '#10B981' }]} />
              </View>
              <Text style={styles.phoneTerminalTitle}>sh — cloudcode</Text>
            </View>
            <View style={styles.phoneTerminalBody}>
              <Text style={styles.phoneTermLine}>
                <Text style={{ color: '#818CF8' }}>$ </Text>git checkout -b feat/auth
              </Text>
              <Text style={styles.phoneTermLineDim}>Switched to branch 'feat/auth'</Text>
              <Text style={styles.phoneTermLine}>
                <Text style={{ color: '#818CF8' }}>$ </Text>git commit -am "add jwt"
              </Text>
              <Text style={styles.phoneTermLineGreen}>[feat/auth 9a2b8e] commit success</Text>
            </View>
          </View>

          {/* Action indicator */}
          <View style={styles.phoneActionIndicator}>
            <CheckCircle size={12} color="#10B981" />
            <Text style={styles.phoneActionIndicatorText}>Branch auto-synced with remote</Text>
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
      <MobilePhoneMock>
        <View style={styles.phoneScreenContent}>
          {/* Top Header */}
          <View style={styles.phoneHeader}>
            <Text style={styles.phoneHeaderTitle}>Live Preview</Text>
            <View style={styles.badgeStatusGreen}>
              <Text style={styles.badgeStatusGreenText}>Online</Text>
            </View>
          </View>

          {/* Browser Address Bar */}
          <View style={styles.phoneBrowserBox}>
            <View style={styles.phoneBrowserAddressBar}>
              <Lock size={8} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.phoneBrowserUrl}>my-app.cloudcode.live</Text>
            </View>
            
            <View style={styles.phoneBrowserBody}>
              <Text style={styles.phoneBrowserTitle}>Dashboard Analytics</Text>
              
              {/* Svg Graph */}
              <Svg width="100%" height={32} viewBox="0 0 100 32">
                <Path
                  d="M 0 24 C 20 8, 40 32, 60 12 C 80 -4, 100 16, 120 16"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                />
                <Path
                  d="M 0 24 C 20 8, 40 32, 60 12 C 80 -4, 100 16, 120 16 L 120 32 L 0 32 Z"
                  fill="rgba(16, 185, 129, 0.08)"
                />
              </Svg>

              <View style={styles.phoneBrowserMetrics}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricCardVal}>99.9%</Text>
                  <Text style={styles.metricCardLbl}>Uptime</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricCardVal}>42 ms</Text>
                  <Text style={styles.metricCardLbl}>Latency</Text>
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
      <MobilePhoneMock isDarkInner={true}>
        <View style={styles.phoneScreenContent}>
          {/* Top Header */}
          <View style={styles.phoneHeader}>
            <Text style={styles.phoneHeaderTitle}>Overview</Text>
            <View style={styles.badgeStatusGreen}>
              <Text style={styles.badgeStatusGreenText}>Connected</Text>
            </View>
          </View>

          {/* Summary Dashboard Mock */}
          <View style={styles.phoneDashboardMock}>
            <View style={styles.phoneDashboardHeader}>
              <CheckCircle size={12} color="#10B981" />
              <Text style={styles.phoneDashboardTitle}>All Systems Operational</Text>
            </View>

            <View style={styles.phoneDashboardMetrics}>
              <View style={styles.dashMetricItem}>
                <Text style={styles.dashMetricVal}>3</Text>
                <Text style={styles.dashMetricLbl}>Services</Text>
              </View>
              <View style={styles.dashMetricItem}>
                <Text style={styles.dashMetricVal}>2.4 GB</Text>
                <Text style={styles.dashMetricLbl}>Storage</Text>
              </View>
              <View style={styles.dashMetricItem}>
                <Text style={styles.dashMetricVal}>1</Text>
                <Text style={styles.dashMetricLbl}>Preview</Text>
              </View>
            </View>

            <View style={styles.dashStatusList}>
              <View style={styles.dashStatusRow}>
                <Server size={10} color="#10B981" />
                <Text style={styles.dashStatusText}>Node.js v20 (online)</Text>
              </View>
              <View style={styles.dashStatusRow}>
                <Globe size={10} color="#10B981" />
                <Text style={styles.dashStatusText}>Database (operational)</Text>
              </View>
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
  // Mobile Phone Mock frame — realistic thin-bezel design
  phoneFrame: {
    width: 320,
    height: 580,
    borderRadius: 46,
    borderWidth: 2.5,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    position: 'absolute',
    bottom: -160,
    zIndex: 5,
  },
  dynamicIsland: {
    position: 'absolute',
    top: 16,
    left: '50%',
    marginLeft: -46,
    width: 92,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    zIndex: 99,
  },
  topEdgeHighlight: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 1,
    zIndex: 98,
  },
  // Left side buttons
  muteToggle: {
    position: 'absolute',
    left: -3.5,
    top: 100,
    width: 3.5,
    height: 24,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    zIndex: 98,
  },
  volumeUp: {
    position: 'absolute',
    left: -3.5,
    top: 142,
    width: 3.5,
    height: 42,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    zIndex: 98,
  },
  volumeDown: {
    position: 'absolute',
    left: -3.5,
    top: 196,
    width: 3.5,
    height: 42,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    zIndex: 98,
  },
  // Right side button
  powerButton: {
    position: 'absolute',
    right: -3.5,
    top: 150,
    width: 3.5,
    height: 52,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 98,
  },
  screenInner: {
    flex: 1,
    borderRadius: 42,
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

  // NEW MOCKUP STYLES: Top-aligned modern layouts
  phoneScreenContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#05070B',
  },
  mockStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  mockTime: {
    color: '#E2E8F0',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  mockSignalGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginRight: 4,
  },
  mockSignalBar: {
    width: 2.5,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 0.5,
  },
  phoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  phoneHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeActiveText: {
    color: '#10B981',
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  badgeGitBranch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGitBranchText: {
    color: '#818CF8',
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  badgeStatusGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeStatusGreenText: {
    color: '#10B981',
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  phoneCardList: {
    gap: 8,
    marginBottom: 12,
  },
  phoneItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.8,
    borderRadius: 10,
    padding: 8.5,
  },
  phoneItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneItemIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneItemTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  phoneItemSubtitle: {
    color: '#64748B',
    fontSize: 8,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  phoneStatusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  phoneResourceStats: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#0F172A',
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.8,
    borderRadius: 10,
    padding: 10,
  },
  statBoxCol: {
    flex: 1,
  },
  statBoxLabel: {
    color: '#64748B',
    fontSize: 7,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
  },
  statBoxValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    marginTop: 2,
  },

  // AI Composer UI
  phoneChatList: {
    gap: 10,
  },
  phoneChatUserBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366F1',
    borderRadius: 10,
    borderBottomRightRadius: 2,
    padding: 10,
    maxWidth: '85%',
  },
  phoneChatUserText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: 'Inter_500Medium',
    lineHeight: 13,
  },
  phoneChatAiCard: {
    alignSelf: 'flex-start',
    backgroundColor: '#0F172A',
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.8,
    borderRadius: 10,
    borderBottomLeftRadius: 2,
    padding: 10,
    width: '95%',
  },
  phoneChatAiText: {
    color: '#E2E8F0',
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    lineHeight: 13.5,
  },
  phoneAiSeparator: {
    height: 0.8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 8,
  },
  phoneAiTaskList: {
    gap: 5,
  },
  phoneAiTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneAiTaskTextDone: {
    color: '#A7F3D0',
    fontSize: 8,
    fontFamily: 'Inter_500Medium',
  },
  phoneAiTaskTextActive: {
    color: '#00E5FF',
    fontSize: 8,
    fontFamily: 'Inter_500Medium',
  },

  // Terminal & Git UI
  phoneTerminalBox: {
    backgroundColor: '#020617',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.8,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  phoneTerminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.8,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  phoneTerminalDots: {
    flexDirection: 'row',
    gap: 4.5,
  },
  terminalDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 2.75,
  },
  phoneTerminalTitle: {
    color: '#64748B',
    fontSize: 7.5,
    fontFamily: 'Inter_500Medium',
    marginLeft: 10,
  },
  phoneTerminalBody: {
    padding: 10,
    gap: 4.5,
  },
  phoneTermLine: {
    color: '#F8FAFC',
    fontSize: 8.5,
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 12,
  },
  phoneTermLineDim: {
    color: '#64748B',
    fontSize: 8,
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 12.5,
  },
  phoneTermLineGreen: {
    color: '#10B981',
    fontSize: 8,
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 12.5,
  },
  phoneActionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6.5,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
    padding: 8,
  },
  phoneActionIndicatorText: {
    color: '#A7F3D0',
    fontSize: 8.5,
    fontFamily: 'Inter_600SemiBold',
  },

  // Browser Preview UI
  phoneBrowserBox: {
    backgroundColor: '#020617',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  phoneBrowserAddressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    borderBottomWidth: 0.8,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  phoneBrowserUrl: {
    color: '#64748B',
    fontSize: 8,
    fontFamily: 'Inter_400Regular',
  },
  phoneBrowserBody: {
    padding: 12,
  },
  phoneBrowserTitle: {
    color: '#10B981',
    fontSize: 9.5,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  phoneBrowserMetrics: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  metricCardVal: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  metricCardLbl: {
    color: '#64748B',
    fontSize: 6.5,
    fontFamily: 'Inter_500Medium',
    marginTop: 1,
  },

  // Final Overview UI
  phoneDashboardMock: {
    backgroundColor: '#0F172A',
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.8,
    borderRadius: 10,
    padding: 10,
  },
  phoneDashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 0.8,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 8,
    marginBottom: 10,
  },
  phoneDashboardTitle: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: 'Inter_600SemiBold',
  },
  phoneDashboardMetrics: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  dashMetricItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  dashMetricVal: {
    color: '#00E5FF',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  dashMetricLbl: {
    color: '#64748B',
    fontSize: 7,
    fontFamily: 'Inter_500Medium',
    marginTop: 1.5,
  },
  dashStatusList: {
    gap: 6,
  },
  dashStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dashStatusText: {
    color: '#E2E8F0',
    fontSize: 8.5,
    fontFamily: 'Inter_500Medium',
  },
})
