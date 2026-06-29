import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withRepeat,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated'
import Svg, { Path, Defs, Rect, Stop, Line, Circle, LinearGradient } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import { useAppTheme } from '@/hooks/useAppTheme'
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
  FlutterLogo,
} from './LogoIcons'

const { width, height } = Dimensions.get('window')
const AnimatedPath = Animated.createAnimatedComponent(Path)

// Exact CloudCode logo path from provided SVG asset
const CLOUD_PATH = "M744.133 448.718L745.663 450.478C749.573 448.638 756.023 442.638 759.343 439.478C801.523 399.328 807.143 335.468 773.443 288.286C752.363 258.958 720.453 239.246 684.793 233.516C627.733 224.495 571.543 240.02 532.953 284.215C513.333 306.683 501.953 327.078 486.903 352.228L446.383 419.478C424.033 456.788 407.123 486.278 370.333 511.798C322.653 544.868 277.043 552.878 220.513 550.948C199.333 550.218 189.463 551.898 167.033 548.058C111.983 538.618 66.3532 511.758 33.9532 466.048C4.72322 424.818 -6.02688 369.558 3.23312 320.198C19.2031 235.074 86.2132 173.155 171.333 161.818C178.423 160.874 215.733 159.576 216.813 157.721C221.973 148.846 231.733 123.239 239.273 112.014C258.803 82.9043 278.733 62.4333 306.733 42.3943C378.113 -8.68767 483.363 -13.7167 560.263 27.9013C568.783 32.5103 577.823 38.6133 586.293 44.0923C591.413 47.4043 600.223 56.2653 605.963 58.4383C606.413 58.4743 606.863 58.5104 607.323 58.5464C625.333 70.3774 639.813 94.3024 651.953 111.494C653.613 113.836 663.243 137.014 663.103 140.089C659.363 141.274 631.283 140.277 624.573 140.763C613.183 141.589 588.323 150.591 580.113 150.2C577.063 142.857 564.713 129.099 559.173 122.493C559.073 117.483 555.773 114.043 552.203 110.704C491.283 53.7463 386.263 57.7693 331.443 121.487C304.553 152.739 287.003 190.663 285.093 232.343C219.143 232.831 161.143 218.294 109.883 270.641C87.5331 293.249 75.2332 323.908 75.7732 355.698C76.5632 387.998 90.4232 418.588 114.173 440.488C147.973 472.268 189.523 480.028 234.743 478.448C279.973 476.878 316.993 460.968 348.503 427.798C362.653 412.718 372.893 395.008 384.023 377.728C434.863 298.804 467.723 210.738 563.753 176.305C645.703 146.92 740.993 155.774 808.173 214.497C846.483 247.982 870.443 294.617 873.453 345.588C873.823 351.568 873.993 374.398 873.413 379.908C869.123 419.878 851.813 457.338 824.153 486.518C786.803 525.918 735.413 548.968 681.153 550.678C669.933 551.018 658.523 550.698 647.273 550.768C569.733 551.188 491.963 549.938 414.443 550.988C420.043 546.248 432.513 537.208 433.173 530.618C439.673 521.988 452.193 510.948 458.973 500.978C461.403 497.408 474.013 475.968 476.413 475.308C482.143 473.738 503.713 474.508 510.313 474.548L616.123 474.668C660.013 474.668 701.183 478.218 739.293 451.948C741.343 450.538 742.053 450.628 744.133 448.718Z"

// -------------------------------------------------------------
// Onboarding Illustration Component 0: Glowing CC Logo (Splash)
// -------------------------------------------------------------
export const Screen0Illustration = () => {
  return null
}

// -------------------------------------------------------------
// Onboarding Illustration Component 1: Dual Vertical Marquee Columns
// -------------------------------------------------------------

const MarqueeIconTile = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <View style={styles.marqueeIconTile}>
    {children}
    <Text style={styles.marqueeIconLabel}>{label}</Text>
  </View>
)

const COL_LEFT_ICONS = [
  { key: 'react', label: 'React', icon: <ReactLogo /> },
  { key: 'docker', label: 'Docker', icon: <DockerLogo /> },
  { key: 'go', label: 'Go', icon: <GoLogo /> },
  { key: 'ts', label: 'TypeScript', icon: <TypeScriptLogo /> },
  { key: 'python', label: 'Python', icon: <PythonLogo /> },
  { key: 'flutter', label: 'Flutter', icon: <FlutterLogo /> },
  { key: 'openai', label: 'OpenAI', icon: <OpenAILogo /> },
  { key: 'claude', label: 'Claude', icon: <ClaudeLogo /> },
]

const COL_RIGHT_ICONS = [
  { key: 'gemini', label: 'Gemini', icon: <GeminiLogo /> },
  { key: 'deepseek', label: 'DeepSeek', icon: <DeepSeekLogo /> },
  { key: 'llama', label: 'Llama', icon: <LlamaLogo /> },
  { key: 'react2', label: 'React', icon: <ReactLogo /> },
  { key: 'docker2', label: 'Docker', icon: <DockerLogo /> },
  { key: 'go2', label: 'Go', icon: <GoLogo /> },
  { key: 'ts2', label: 'TypeScript', icon: <TypeScriptLogo /> },
  { key: 'flutter2', label: 'Flutter', icon: <FlutterLogo /> },
]

const ICON_TILE_HEIGHT = 66
const MARQUEE_COL_HEIGHT = COL_LEFT_ICONS.length * ICON_TILE_HEIGHT

export const Screen1Illustration = () => {
  const leftColAnim = useSharedValue(0)
  const rightColAnim = useSharedValue(0)
  const flashAnim = useSharedValue(0)

  useEffect(() => {
    leftColAnim.value = withRepeat(
      withTiming(-MARQUEE_COL_HEIGHT, { duration: 14000, easing: Easing.linear }),
      -1,
      false
    )
    rightColAnim.value = withRepeat(
      withTiming(MARQUEE_COL_HEIGHT, { duration: 14000, easing: Easing.linear }),
      -1,
      false
    )
    flashAnim.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    )
  }, [])

  const leftColStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: leftColAnim.value }],
  }))

  const rightColStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: rightColAnim.value - MARQUEE_COL_HEIGHT }],
  }))

  const leftFlashStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
    left: interpolate(flashAnim.value, [0, 1], [0, 44]),
    top: -3,
    opacity: interpolate(flashAnim.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
  }))

  const rightFlashStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
    right: interpolate(flashAnim.value, [0, 1], [0, 44]),
    top: -3,
    opacity: interpolate(flashAnim.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
  }))

  const renderColumn = (icons: typeof COL_LEFT_ICONS) => (
    <>
      {icons.map((item) => (
        <MarqueeIconTile key={item.key} label={item.label}>
          {item.icon}
        </MarqueeIconTile>
      ))}
      {icons.map((item) => (
        <MarqueeIconTile key={`${item.key}-dup`} label={item.label}>
          {item.icon}
        </MarqueeIconTile>
      ))}
    </>
  )

  return (
    <View style={[styles.showcaseWrapper, { flexDirection: 'row', paddingHorizontal: 20 }]}>
      <View style={{ height: '100%', overflow: 'hidden', width: 56 }}>
        <Animated.View style={[{ alignItems: 'center' }, leftColStyle]}>
          {renderColumn(COL_LEFT_ICONS)}
        </Animated.View>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <View style={{ position: 'absolute', left: 0, width: 50, height: 1, top: '50%' }}>
          <View style={{ width: '100%', height: 1, backgroundColor: 'rgba(0, 229, 255, 0.15)' }} />
          <Animated.View style={leftFlashStyle} />
        </View>

        <View style={{ position: 'absolute', right: 0, width: 50, height: 1, top: '50%' }}>
          <View style={{ width: '100%', height: 1, backgroundColor: 'rgba(0, 229, 255, 0.15)' }} />
          <Animated.View style={rightFlashStyle} />
        </View>

        <View style={{
          width: 68,
          height: 68,
          borderRadius: 18,
          backgroundColor: '#141824',
          borderWidth: 1.5,
          borderColor: '#2A3040',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Svg width={38} height={38} viewBox="0 0 874 552">
            <Path
              d={CLOUD_PATH}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={18}
            />
          </Svg>
        </View>
      </View>

      <View style={{ height: '100%', overflow: 'hidden', width: 56 }}>
        <Animated.View style={[{ alignItems: 'center' }, rightColStyle]}>
          {renderColumn(COL_RIGHT_ICONS)}
        </Animated.View>
      </View>

      {/* Top edge fade overlay */}
      <View style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 80, zIndex: 20, pointerEvents: 'none' }}>
        <View style={{ flex: 1, backgroundColor: '#05070B', opacity: 1 }} />
        <View style={{ flex: 1, backgroundColor: '#05070B', opacity: 0.85 }} />
        <View style={{ flex: 1, backgroundColor: '#05070B', opacity: 0.65 }} />
        <View style={{ flex: 1, backgroundColor: '#05070B', opacity: 0.4 }} />
        <View style={{ flex: 1, backgroundColor: '#05070B', opacity: 0.2 }} />
        <View style={{ flex: 1, backgroundColor: '#05070B', opacity: 0.05 }} />
      </View>

      {/* Bottom edge fade overlay */}
      <View style={{ position: 'absolute', left: 0, bottom: 0, right: 0, height: 80, zIndex: 20, pointerEvents: 'none' }}>
        <View style={{ flex: 1, backgroundColor: '#05070B', opacity: 0.05 }} />
        <View style={{ flex: 1, backgroundColor: '#05070B', opacity: 0.2 }} />
        <View style={{ flex: 1, backgroundColor: '#05070B', opacity: 0.4 }} />
        <View style={{ flex: 1, backgroundColor: '#05070B', opacity: 0.65 }} />
        <View style={{ flex: 1, backgroundColor: '#05070B', opacity: 0.85 }} />
        <View style={{ flex: 1, backgroundColor: '#05070B', opacity: 1 }} />
      </View>
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 2: Build with AI
// -------------------------------------------------------------
export const Screen2Illustration = () => {
  const angle = useSharedValue(0)
  const floatAnim = useSharedValue(0)
  const [typedText, setTypedText] = useState("")
  const [checkPhase, setCheckPhase] = useState(0)

  useEffect(() => {
    angle.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    )
    floatAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  const fullPrompt = "Build a SaaS dashboard with auth and billing..."
  
  useEffect(() => {
    let timer: any
    let charIndex = 0
    let text = ""
    let isDeleting = false

    const run = () => {
      if (!isDeleting) {
        text = fullPrompt.substring(0, charIndex + 1)
        setTypedText(text)
        charIndex++
        if (charIndex === fullPrompt.length) {
          setCheckPhase(1)
          timer = setTimeout(() => {
            setCheckPhase(2)
            timer = setTimeout(() => {
              setCheckPhase(3)
              timer = setTimeout(() => {
                setCheckPhase(4)
                timer = setTimeout(() => {
                  isDeleting = true
                  timer = setTimeout(run, 1500)
                }, 1500)
              }, 400)
            }, 400)
          }, 400)
        } else {
          timer = setTimeout(run, 60)
        }
      } else {
        text = fullPrompt.substring(0, charIndex - 1)
        setTypedText(text)
        charIndex--
        setCheckPhase(0)
        if (charIndex === 0) {
          isDeleting = false
          timer = setTimeout(run, 500)
        } else {
          timer = setTimeout(run, 30)
        }
      }
    }

    run()
    return () => clearTimeout(timer)
  }, [])

  const getOrbitalStyle = (offsetAngle: number) => {
    return useAnimatedStyle(() => {
      const radius = 78
      const a = angle.value + offsetAngle
      return {
        transform: [
          { translateX: radius * Math.cos(a) },
          { translateY: radius * Math.sin(a) },
          { scale: 0.95 }
        ]
      }
    })
  }

  const composerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: '8deg' },
      { rotateY: '-6deg' },
      { translateY: floatAnim.value * 6 - 3 }
    ]
  }))

  return (
    <View style={styles.showcaseWrapper}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 350 250">
        <Circle cx="175" cy="125" r="78" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.5" strokeDasharray="5, 5" />
        <Circle cx="175" cy="125" r="50" fill="none" stroke="rgba(0, 229, 255, 0.05)" strokeWidth="1" />
      </Svg>

      <Animated.View style={[styles.aiIconBadge, { position: 'absolute', left: 175 - 16, top: 125 - 16 }, getOrbitalStyle(0)]}>
        <BlurView intensity={25} tint="dark" style={styles.aiIconBlurMini}>
          <OpenAILogo />
        </BlurView>
      </Animated.View>

      <Animated.View style={[styles.aiIconBadge, { position: 'absolute', left: 175 - 16, top: 125 - 16 }, getOrbitalStyle((2 * Math.PI) / 5)]}>
        <BlurView intensity={25} tint="dark" style={styles.aiIconBlurMini}>
          <ClaudeLogo />
        </BlurView>
      </Animated.View>

      <Animated.View style={[styles.aiIconBadge, { position: 'absolute', left: 175 - 16, top: 125 - 16 }, getOrbitalStyle((4 * Math.PI) / 5)]}>
        <BlurView intensity={25} tint="dark" style={styles.aiIconBlurMini}>
          <GeminiLogo />
        </BlurView>
      </Animated.View>

      <Animated.View style={[styles.aiIconBadge, { position: 'absolute', left: 175 - 16, top: 125 - 16 }, getOrbitalStyle((6 * Math.PI) / 5)]}>
        <BlurView intensity={25} tint="dark" style={styles.aiIconBlurMini}>
          <DeepSeekLogo />
        </BlurView>
      </Animated.View>

      <Animated.View style={[styles.aiIconBadge, { position: 'absolute', left: 175 - 16, top: 125 - 16 }, getOrbitalStyle((8 * Math.PI) / 5)]}>
        <BlurView intensity={25} tint="dark" style={styles.aiIconBlurMini}>
          <LlamaLogo />
        </BlurView>
      </Animated.View>

      <Animated.View style={[styles.aiPromptCardActive, { width: width - 150, height: 130, zIndex: 10 }, composerStyle, styles.glassCard3d]}>
        <BlurView intensity={35} tint="dark" style={styles.aiPromptBlur}>
          <View>
            <Text style={[styles.aiPromptText, { fontSize: 11, color: '#A78BFA', fontFamily: 'Inter_700Bold' }]}>AI Composer</Text>
            <Text style={[styles.aiPromptText, { fontSize: 11, marginTop: 4, fontFamily: 'Inter_500Medium' }]}>
              {typedText}<Text style={styles.cursor}>|</Text>
            </Text>
          </View>
          
          <View style={styles.checkListContainer}>
            {checkPhase >= 1 && <Text style={styles.checkListItem}>✓ UI Dashboard</Text>}
            {checkPhase >= 2 && <Text style={styles.checkListItem}>✓ Express API</Text>}
            {checkPhase >= 3 && <Text style={styles.checkListItem}>✓ PostgreSQL DB</Text>}
            {checkPhase >= 4 && <Text style={[styles.checkListItem, { color: '#00E5FF' }]}>✓ JWT Auth</Text>}
          </View>
        </BlurView>
      </Animated.View>
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 3: Terminal & Git
// -------------------------------------------------------------
export const Screen3Illustration = () => {
  const pulse1 = useSharedValue(0)
  const pulse2 = useSharedValue(0)
  const [gitStatus, setGitStatus] = useState("idle")

  useEffect(() => {
    pulse1.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    )
    pulse2.value = withDelay(
      1500,
      withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      )
    )

    const interval = setInterval(() => {
      setGitStatus((prev) => {
        if (prev === "idle") return "checkout"
        if (prev === "checkout") return "commit"
        if (prev === "commit") return "pr"
        if (prev === "pr") return "merge"
        return "idle"
      })
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  const pulseStyle1 = useAnimatedStyle(() => {
    const t = pulse1.value
    const x = interpolate(t, [0, 1], [40, 130])
    const y = 30 - 15 * Math.sin(t * Math.PI)
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: interpolate(t, [0, 0.2, 0.8, 1], [0, 1.2, 1.2, 0]) }
      ]
    }
  })

  const pulseStyle2 = useAnimatedStyle(() => {
    const t = pulse2.value
    const x = interpolate(t, [0, 1], [70, 160])
    const y = 30 + 15 * Math.sin(t * Math.PI)
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: interpolate(t, [0, 0.2, 0.8, 1], [0, 1.2, 1.2, 0]) }
      ]
    }
  })

  return (
    <View style={styles.showcaseWrapper}>
      <View style={[styles.terminalContainer, { width: width - 130, height: 90, marginBottom: 12 }, styles.glassCard3d]}>
        <BlurView intensity={25} tint="dark" style={styles.terminalBlur}>
          <View style={styles.terminalHeader}>
            <View style={[styles.windowDot, { backgroundColor: '#FF5F56' }]} />
            <View style={[styles.windowDot, { backgroundColor: '#FFBD2E' }]} />
            <View style={[styles.windowDot, { backgroundColor: '#27C93F' }]} />
            <Text style={styles.terminalTitle}>git · checkout</Text>
          </View>
          <View style={styles.terminalBody}>
            {gitStatus === "idle" && <Text style={styles.terminalLine}>$ git status{"\n"}On branch main. Clean.</Text>}
            {gitStatus === "checkout" && <Text style={styles.terminalLine}>$ git checkout -b feat/auth{"\n"}Switched to branch 'feat/auth'</Text>}
            {gitStatus === "commit" && <Text style={styles.terminalLine}>$ git commit -m "feat: jwt auth"{"\n"}1 file changed, 48 insertions(+)</Text>}
            {gitStatus === "pr" && <Text style={styles.terminalLine}>$ gh pr create --title "feat: jwt auth"{"\n"}✓ Pull Request #12 created successfully.</Text>}
            {gitStatus === "merge" && <Text style={styles.terminalLine}>$ git merge feat/auth{"\n"}Updating 7a3bf92..c1d9b3e (Fast-forward)</Text>}
          </View>
        </BlurView>
      </View>

      <View style={[styles.gitDiagramCard, styles.glassCard3d]}>
        <BlurView intensity={25} tint="dark" style={styles.gitDiagramBlur}>
          <View style={{ height: 42, justifyContent: 'center' }}>
            <Svg width="100%" height={38} viewBox="0 0 200 38">
              <Line x1="10" y1="19" x2="190" y2="19" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" />
              <Path d="M 40 19 Q 85 4 130 19" fill="none" stroke="#A78BFA" strokeWidth="2" />
              <Path d="M 70 19 Q 115 34 160 19" fill="none" stroke="#34D399" strokeWidth="2" />
              <Circle cx="20" cy="19" r="4" fill="#FFFFFF" />
              <Circle cx="40" cy="19" r="4" fill="#FFFFFF" />
              <Circle cx="130" cy="19" r="4" fill="#FFFFFF" />
              <Circle cx="180" cy="19" r="4" fill="#00E5FF" />
              <Circle cx="85" cy="8" r="4" fill="#A78BFA" />
              <Circle cx="115" cy="30" r="4" fill="#34D399" />
            </Svg>
            <Animated.View style={[styles.pulseCircle, { backgroundColor: '#A78BFA' }, pulseStyle1]} />
            <Animated.View style={[styles.pulseCircle, { backgroundColor: '#34D399' }, pulseStyle2]} />
          </View>

          <View style={styles.gitStatusBox}>
            <Svg width={10} height={10} viewBox="0 0 24 24" fill="#60A5FA" style={{ marginRight: 4 }}>
              <Path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.44 22 12.017c0-5.533-4.477-9.817-10-9.817z" />
            </Svg>
            <Text style={styles.gitStatusText}>
              {gitStatus === "idle" && "main branch synced"}
              {gitStatus === "checkout" && "working on feature/auth"}
              {gitStatus === "commit" && "feat: jwt auth committed"}
              {gitStatus === "pr" && "PR #12 Open · gh-actions success"}
              {gitStatus === "merge" && "merged PR #12 to main"}
            </Text>
          </View>
        </BlurView>
      </View>
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 4: Preview, Cloud & Security
// -------------------------------------------------------------
export const Screen4Illustration = () => {
  const floatAnim = useSharedValue(0)

  useEffect(() => {
    floatAnim.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  const browserStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: '8deg' },
      { rotateY: '-6deg' },
      { translateY: floatAnim.value * 8 - 4 }
    ]
  }))

  const infraStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -floatAnim.value * 5 + 2 },
      { scale: 0.95 }
    ]
  }))

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatAnim.value * 6 - 3 },
      { translateX: 10 }
    ]
  }))

  return (
    <View style={styles.showcaseWrapper}>
      <Animated.View style={[styles.infraContainer, infraStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 260 180">
          <Rect x="20" y="30" width="80" height="40" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <Rect x="160" y="30" width="80" height="40" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <Line x1="40" y1="40" x2="60" y2="40" stroke="#34D399" strokeWidth="2" />
          <Line x1="40" y1="50" x2="80" y2="50" stroke="#94A3B8" strokeWidth="2" />
          <Line x1="180" y1="40" x2="200" y2="40" stroke="#34D399" strokeWidth="2" />
          <Line x1="180" y1="50" x2="220" y2="50" stroke="#94A3B8" strokeWidth="2" />
          <Path d="M 60 70 C 60 120 120 120 120 120" fill="none" stroke="rgba(0, 229, 255, 0.1)" strokeWidth="1.5" strokeDasharray="4, 4" />
          <Path d="M 200 70 C 200 120 140 120 140 120" fill="none" stroke="rgba(0, 229, 255, 0.1)" strokeWidth="1.5" strokeDasharray="4, 4" />
          <Circle cx="60" cy="70" r="3" fill="#00E5FF" opacity={0.6} />
          <Circle cx="200" cy="70" r="3" fill="#00E5FF" opacity={0.6} />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.previewWindow, { width: width - 130, height: 120 }, browserStyle, styles.glassCard3d]}>
        <BlurView intensity={30} tint="dark" style={styles.previewBlur}>
          <View style={styles.previewHeader}>
            <View style={styles.previewAddressBar}>
              <Text style={styles.previewUrl}>localhost:3000/dashboard</Text>
            </View>
          </View>
          <View style={styles.browserAppContainer}>
            <View style={styles.browserSidebar}>
              <View style={[styles.sidebarItem, { width: 14 }]} />
              <View style={[styles.sidebarItem, { width: 10 }]} />
              <View style={[styles.sidebarItem, { width: 12 }]} />
            </View>
            <View style={styles.browserMainContent}>
              <Text style={{ fontSize: 7, color: '#34D399', fontFamily: 'Inter_700Bold', marginBottom: 2 }}>Analytics Live</Text>
              <Svg width="100%" height="25" viewBox="0 0 100 25">
                <Path d="M 0 20 Q 25 5 50 15 T 100 8" fill="none" stroke="#00E5FF" strokeWidth="1.5" />
                <Path d="M 0 20 Q 25 5 50 15 T 100 8 L 100 25 L 0 25 Z" fill="rgba(0, 229, 255, 0.08)" />
              </Svg>
              <View style={styles.metricRow}>
                <View style={styles.metricCard} />
                <View style={styles.metricCard} />
              </View>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      <Animated.View style={[styles.shieldContainer, { position: 'absolute', right: 20, bottom: 20, zIndex: 10 }, badgeStyle]}>
        <BlurView intensity={35} tint="dark" style={styles.shieldBlur}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Svg width={12} height={14} viewBox="0 0 24 28" fill="none" style={{ marginRight: 4 }}>
              <Path d="M12 2L2 7v8c0 5.52 4.48 10 10 10s10-4.48 10-10V7L12 2z" stroke="#34D399" strokeWidth={2} fill="rgba(52, 211, 153, 0.1)" />
            </Svg>
            <Text style={[styles.badgeText, { color: '#34D399', fontSize: 9 }]}>TLS Tunnel</Text>
          </View>
          <Text style={{ fontSize: 8, color: '#94A3B8', marginTop: 2, fontFamily: 'Inter_400Regular' }}>SOC2 Certified</Text>
        </BlurView>
      </Animated.View>
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 5: Parallax columns
// -------------------------------------------------------------
export const Screen5Illustration = () => {
  const { isDark } = useAppTheme()
  const scrollY1 = useSharedValue(0)
  const scrollY2 = useSharedValue(0)
  const bgThemeTransition = useSharedValue(0)

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
    bgThemeTransition.value = withTiming(1, { duration: 800 })
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

  const cardStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.06)', 'rgba(15, 23, 42, 0.04)']
    )
    const borderColor = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.12)', 'rgba(15, 23, 42, 0.08)']
    )
    return {
      backgroundColor: bgColor,
      borderColor: borderColor,
    }
  })

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      ['#FFFFFF', '#0F172A']
    )
    return {
      color: color,
    }
  })

  const subTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      ['#94A3B8', '#64748B']
    )
    return {
      color: color,
    }
  })

  return (
    <Animated.View style={[styles.gridOuterContainer, gridStyle]}>
      {/* Column 1 - Slides UP */}
      <Animated.View style={[styles.gridColumn, col1Style]}>
        <Animated.View style={[styles.gridItemCard, cardStyle]}>
          <Animated.Text style={[styles.gridItemHeader, subTextStyle]}>AI Composer</Animated.Text>
          <Animated.Text style={[styles.gridItemBody, textStyle]}>✓ UI dashboard{"\n"}✓ Express API</Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.gridItemCard, cardStyle]}>
          <Animated.Text style={[styles.gridItemHeader, subTextStyle]}>Terminal</Animated.Text>
          <Animated.Text style={[styles.gridItemBody, { color: '#059669' }]}>✓ build success</Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.gridItemCard, cardStyle]}>
          <Animated.Text style={[styles.gridItemHeader, subTextStyle]}>Infrastructure</Animated.Text>
          <Animated.Text style={[styles.gridItemBody, textStyle]}>Port: 3000{"\n"}Node: Active</Animated.Text>
        </Animated.View>
      </Animated.View>

      {/* Column 2 - Slides DOWN */}
      <Animated.View style={[styles.gridColumn, col2Style]}>
        <Animated.View style={[styles.gridItemCard, { height: 95 }, cardStyle]}>
          <Animated.Text style={[styles.gridItemHeader, subTextStyle]}>Workspace</Animated.Text>
          <Animated.Text style={[styles.gridItemBody, textStyle]}>React App{"\n"}TypeScript</Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.gridItemCard, cardStyle]}>
          <Animated.Text style={[styles.gridItemHeader, subTextStyle]}>Deployment</Animated.Text>
          <Animated.Text style={[styles.gridItemBody, textStyle]}>AWS US-East{"\n"}CPU: 1.4%</Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.gridItemCard, { height: 95 }, cardStyle]}>
          <Animated.Text style={[styles.gridItemHeader, subTextStyle]}>Git Status</Animated.Text>
          <Animated.Text style={[styles.gridItemBody, textStyle]}>PR #12 Merged{"\n"}main synced</Animated.Text>
        </Animated.View>
      </Animated.View>

      {/* Column 3 - Slides UP */}
      <Animated.View style={[styles.gridColumn, col3Style]}>
        <Animated.View style={[styles.gridItemCard, cardStyle]}>
          <Animated.Text style={[styles.gridItemHeader, subTextStyle]}>Security</Animated.Text>
          <Animated.Text style={[styles.gridItemBody, textStyle]}>Tunnel: Active{"\n"}SOC2 Ok</Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.gridItemCard, cardStyle]}>
          <Animated.Text style={[styles.gridItemHeader, subTextStyle]}>Live Preview</Animated.Text>
          <Animated.Text style={[styles.gridItemBody, textStyle]}>localhost:3000{"\n"}Dashboard OK</Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.gridItemCard, cardStyle]}>
          <Animated.Text style={[styles.gridItemHeader, subTextStyle]}>Database</Animated.Text>
          <Animated.Text style={[styles.gridItemBody, textStyle]}>PostgreSQL{"\n"}Active (54MB)</Animated.Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  showcaseWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  marqueeIconTile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#141824',
    borderWidth: 1,
    borderColor: '#1E2436',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  marqueeIconLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 6.5,
    fontFamily: 'Inter_500Medium',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  aiIconBadge: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  aiIconBlurMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  checkListContainer: {
    marginTop: 8,
    gap: 2,
  },
  checkListItem: {
    fontSize: 9,
    color: '#34D399',
    fontFamily: 'Inter_500Medium',
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
  windowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
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
  gitDiagramCard: {
    width: width - 130,
    height: 98,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gitDiagramBlur: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  pulseCircle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(167, 139, 250, 0.4)',
  },
  gitStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    marginTop: 2,
  },
  gitStatusText: {
    fontSize: 8,
    color: '#60A5FA',
    fontFamily: 'Inter_500Medium',
  },
  infraContainer: {
    position: 'absolute',
    width: 260,
    height: 180,
    zIndex: 1,
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
  browserAppContainer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 4,
  },
  browserSidebar: {
    width: 20,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
    gap: 6,
  },
  sidebarItem: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  browserMainContent: {
    flex: 1,
    paddingLeft: 8,
    paddingVertical: 2,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  metricCard: {
    flex: 1,
    height: 12,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  shieldContainer: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  shieldBlur: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
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
})
