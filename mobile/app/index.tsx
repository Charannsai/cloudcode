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
import AsyncStorage from '@react-native-async-storage/async-storage'

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
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"
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

const DeepSeekLogo = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"
      fill="#2D60FF"
    />
  </Svg>
)

const LlamaLogo = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      d="M6.897 4c1.915 0 3.516.932 5.43 3.376l.282-.373c.19-.246.383-.484.58-.71l.313-.35C14.588 4.788 15.792 4 17.225 4c1.273 0 2.469.557 3.491 1.516l.218.213c1.73 1.765 2.917 4.71 3.053 8.026l.011.392.002.25c0 1.501-.28 2.759-.818 3.7l-.14.23-.108.153c-.301.42-.664.758-1.086 1.009l-.265.142-.087.04a3.493 3.493 0 0 1-.302.118 4.117 4.117 0 0 1-1.33.208c-.524 0-.996-.067-1.438-.215-.614-.204-1.163-.56-1.726-1.116l-.227-.235c-.753-.812-1.534-1.976-2.493-3.586l-1.43-2.41-.544-.895-1.766 3.13-.343.592C7.597 19.156 6.227 20 4.356 20c-1.21 0-2.205-.42-2.936-1.182l-.168-.184c-.484-.573-.837-1.311-1.043-2.189l-.067-.32a8.69 8.69 0 0 1-.136-1.288L0 14.468c.002-.745.06-1.49.174-2.23l.1-.573c.298-1.53.828-2.958 1.536-4.157l.209-.34c1.177-1.83 2.789-3.053 4.615-3.16L6.897 4zm-.033 2.615l-.201.01c-.83.083-1.606.673-2.252 1.577l-.138.199-.01.018c-.67 1.017-1.185 2.378-1.456 3.845l-.004.022a12.591 12.591 0 00-.207 2.254l.002.188c.004.18.017.36.04.54l.043.291c.092.503.257.908.486 1.208l.117.137c.303.323.698.492 1.17.492 1.1 0 1.796-.676 3.696-3.641l2.175-3.4.454-.701-.139-.198C9.11 7.3 8.084 6.616 6.864 6.616zm10.196-.552l-.176.007c-.635.048-1.223.359-1.82.933l-.196.198c-.439.462-.887 1.064-1.367 1.807l.266.398c.18.274.362.56.55.858l.293.475 1.396 2.335.695 1.114c.583.926 1.03 1.6 1.408 2.082l.213.262c.282.326.529.54.777.673l.102.05c.227.1.457.138.718.138.176.002.35-.023.518-.073.338-.104.61-.32.813-.637l.095-.163.077-.162c.194-.459.29-1.06.29-1.785l-.006-.449c-.08-2.871-.938-5.372-2.2-6.798l-.176-.189c-.67-.683-1.444-1.074-2.27-1.074z"
      fill="#0081FB"
    />
  </Svg>
)

const PythonLogo = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      d="M11.9 1a5.6 5.6 0 00-5.5 5.5v1.2h5.7V9h-5.7V7.8C4.5 7.8 3 9.3 3 11v1.1c0 1.7 1.5 3.1 3.4 3.1h1.2v-1.1c0-1.7 1.5-3.1 3.4-3.1h4.5a3.4 3.4 0 003.4-3.1V8C18.9 4.6 15.3 1 11.9 1zm4.3 10.9v1.2H10.5V15h5.7v-1.1c1.9 0 3.4-1.5 3.4-3.1V9.7c0-1.7-1.5-3.1-3.4-3.1h-1.2v1.1c0 1.7-1.5 3.1-3.4 3.1H7.1a3.4 3.4 0 00-3.4 3.1v1.1c0 3.4 3.6 7 7 7a5.6 5.6 0 005.5-5.5v-1.2h-4.3z"
      fill="#3776AB"
    />
  </Svg>
)

const FlutterLogo = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path d="M14.3 2.3L5 11.6l4.7 4.7 9.3-9.3z" fill="#02569B" />
    <Path d="M14.3 11.6L9.6 16.3l4.7 4.7 9.3-9.3z" fill="#0175C2" />
    <Path d="M19 11.6l-4.7 4.7 4.7 4.7 4.7-4.7z" fill="#13B9FD" />
  </Svg>
)

// -------------------------------------------------------------
// Onboarding Illustration Component 0: Glowing CC Logo
// -------------------------------------------------------------
const Screen0Illustration = () => {
  return null
}

// -------------------------------------------------------------
// Onboarding Illustration Component 1: Dual Vertical Marquee Columns
// -------------------------------------------------------------

// Icon tile with solid background for vertical marquee columns
const MarqueeIconTile = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <View style={{
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#1A1F2E',
    borderWidth: 1,
    borderColor: '#2A3040',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  }}>
    {children}
    <Text style={{
      color: 'rgba(255, 255, 255, 0.55)',
      fontSize: 7,
      fontFamily: 'Inter_500Medium',
      marginTop: 4,
      letterSpacing: 0.3,
    }}>{label}</Text>
  </View>
)

// Left column icons
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

// Right column icons
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

const ICON_TILE_HEIGHT = 76 // 64 + 12 margin
const MARQUEE_COL_HEIGHT = COL_LEFT_ICONS.length * ICON_TILE_HEIGHT

const Screen1Illustration = () => {
  const leftColAnim = useSharedValue(0)
  const rightColAnim = useSharedValue(0)
  const glowAnim = useSharedValue(0)

  useEffect(() => {
    // Left column scrolls upward
    leftColAnim.value = withRepeat(
      withTiming(-MARQUEE_COL_HEIGHT, { duration: 16000, easing: Easing.linear }),
      -1,
      false
    )
    // Right column scrolls downward
    rightColAnim.value = withRepeat(
      withTiming(MARQUEE_COL_HEIGHT, { duration: 16000, easing: Easing.linear }),
      -1,
      false
    )
    // Center logo glow pulse
    glowAnim.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  const leftColStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: leftColAnim.value }],
  }))

  const rightColStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: rightColAnim.value - MARQUEE_COL_HEIGHT }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.35, 0.85]),
    transform: [{ scale: interpolate(glowAnim.value, [0, 1], [0.92, 1.08]) }],
  }))

  const renderColumn = (icons: typeof COL_LEFT_ICONS) => (
    <>
      {icons.map((item) => (
        <MarqueeIconTile key={item.key} label={item.label}>
          {item.icon}
        </MarqueeIconTile>
      ))}
      {/* Duplicate for seamless loop */}
      {icons.map((item) => (
        <MarqueeIconTile key={`${item.key}-dup`} label={item.label}>
          {item.icon}
        </MarqueeIconTile>
      ))}
    </>
  )

  return (
    <View style={[styles.showcaseWrapper, { flexDirection: 'row' }]}>
      {/* Left column - scrolls up */}
      <View style={{ height: '100%', overflow: 'hidden', width: 64, marginRight: 12 }}>
        <Animated.View style={[{ alignItems: 'center' }, leftColStyle]}>
          {renderColumn(COL_LEFT_ICONS)}
        </Animated.View>
      </View>

      {/* Center CloudCode Logo with glow */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <Animated.View style={[{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: 'rgba(0, 229, 255, 0.1)',
        }, glowStyle]} />
        <View style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          backgroundColor: '#1A1F2E',
          borderWidth: 1.5,
          borderColor: 'rgba(0, 229, 255, 0.35)',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#00E5FF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 10,
        }}>
          <Svg width={40} height={40} viewBox="0 0 874 552">
            <Path
              d={CLOUD_PATH}
              fill="none"
              stroke="#00E5FF"
              strokeWidth={18}
            />
          </Svg>
        </View>
      </View>

      {/* Right column - scrolls down */}
      <View style={{ height: '100%', overflow: 'hidden', width: 64, marginLeft: 12 }}>
        <Animated.View style={[{ alignItems: 'center' }, rightColStyle]}>
          {renderColumn(COL_RIGHT_ICONS)}
        </Animated.View>
      </View>

      {/* Top edge fade overlay */}
      <View style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 70, zIndex: 20, pointerEvents: 'none' }}>
        <Svg width="100%" height={70}>
          <Defs>
            <LinearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0A0E1A" stopOpacity="1" />
              <Stop offset="1" stopColor="#0A0E1A" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="70" fill="url(#topFade)" />
        </Svg>
      </View>

      {/* Bottom edge fade overlay */}
      <View style={{ position: 'absolute', left: 0, bottom: 0, right: 0, height: 70, zIndex: 20, pointerEvents: 'none' }}>
        <Svg width="100%" height={70}>
          <Defs>
            <LinearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0A0E1A" stopOpacity="0" />
              <Stop offset="1" stopColor="#0A0E1A" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="70" fill="url(#bottomFade)" />
        </Svg>
      </View>
    </View>
  )
}

// -------------------------------------------------------------
// Onboarding Illustration Component 2: Build with AI
// -------------------------------------------------------------
const Screen2Illustration = () => {
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
const Screen3Illustration = () => {
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
const Screen4Illustration = () => {
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
const Screen5Illustration = () => {
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
      const redirectTimer = setTimeout(async () => {
        try {
          const completed = await AsyncStorage.getItem('onboarding_completed')
          if (completed === 'true') {
            router.replace('/(tabs)/dashboard')
          } else {
            router.replace('/onboarding-wizard')
          }
        } catch {
          router.replace('/(tabs)/dashboard')
        }
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

  async function handleLoginSuccess(token: string) {
    setToken(token)
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed')
      if (completed === 'true') {
        router.replace('/(tabs)/dashboard')
      } else {
        router.replace('/onboarding-wizard')
      }
    } catch {
      router.replace('/(tabs)/dashboard')
    }
  }

  // GitHub Auth Flow
  async function signInWithGitHub() {
    setSigningIn(true)
    try {
      const redirectUri = Linking.createURL('/auth')
      const authUrl = `${API_URL}/cc-api/auth/github?redirect_uri=${encodeURIComponent(redirectUri)}`
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      )

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url)
        const token = url.searchParams.get('token')
        if (token) {
          await handleLoginSuccess(token)
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
    // Hide watermark on screen 1 (vertical marquee screen)
    const screenHide = currentScreen === 1 ? 0 : 1
    return {
      opacity: interpolate(welcomeTransition.value, [0, 1], [0, finalOpacity]) * screenHide,
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
                Create Development{"\n"}Environments Instantly
              </Text>
              <Text style={[styles.showcaseDescription, { color: currentScreen === 5 ? '#475569' : '#8B929A', fontFamily: 'Inter_400Regular' }]}>
                Instantly spin up isolated cloud containers from your repositories. Run full desktop workspaces right from your phone.
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
                Describe It.{"\n"}Let AI Build It.
              </Text>
              <Text style={[styles.showcaseDescription, { color: currentScreen === 5 ? '#475569' : '#8B929A', fontFamily: 'Inter_400Regular' }]}>
                Collaborative AI developer agents work in sync to turn your descriptions into functional components, APIs, and databases.
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
                Professional Development{"\n"}Workflows Anywhere
              </Text>
              <Text style={[styles.showcaseDescription, { color: currentScreen === 5 ? '#475569' : '#8B929A', fontFamily: 'Inter_400Regular' }]}>
                Access a multi-shell remote terminal alongside a visual branching manager. Commit, merge, and pull requests effortlessly.
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
                Run, Preview,{"\n"}and Deploy Securely
              </Text>
              <Text style={[styles.showcaseDescription, { color: currentScreen === 5 ? '#475569' : '#8B929A', fontFamily: 'Inter_400Regular' }]}>
                Interact with live browser previews connected via encrypted TLS tunnels to compliant, isolated cloud infrastructure.
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
                Everything You Need.{"\n"}Anywhere.
              </Text>
              <Text style={[styles.showcaseDescription, { color: '#475569', fontFamily: 'Inter_400Regular' }]}>
                Log in with your GitHub account to access your repositories and spin up remote dev boxes on the go.
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

          {/* Primary Action CTA Buttons */}
          {currentScreen === 5 ? (
            <View style={{ gap: 10, width: '100%' }}>
              {/* Continue with GitHub */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={signInWithGitHub}
                disabled={signingIn}
              >
                <Animated.View style={[styles.ctaButton, ctaButtonStyle]}>
                  {signingIn ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.ctaButtonContent}>
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} style={{ marginRight: 8 }}>
                        <Path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                      </Svg>
                      <Text style={[styles.ctaText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>
                        Continue with GitHub
                      </Text>
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>

            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleContinue}
              disabled={signingIn}
            >
              <Animated.View style={[styles.ctaButton, ctaButtonStyle]}>
                <Animated.Text style={[
                  styles.ctaText, 
                  ctaButtonTextStyle,
                  { fontFamily: 'Inter_600SemiBold' }
                ]}>
                  Continue
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>
          )}
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
  checkListContainer: {
    marginTop: 8,
    gap: 2,
  },
  checkListItem: {
    fontSize: 9,
    color: '#34D399',
    fontFamily: 'Inter_500Medium',
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
  aiIconBlurMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
