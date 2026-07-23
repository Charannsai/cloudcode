import { Easing } from 'react-native-reanimated'

/**
 * CloudCode Design & Motion Tokens
 * Centralized source of truth for spacing, radiuses, elevations, blur intensities,
 * and unified spring/timing animation parameters.
 */

// Spacing Tokens (4px Grid Scale)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const

// Corner Radius Tokens
export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

// Spring Dynamics Tokens
export const SPRINGS = {
  /** Touch response for buttons, cards, list items */
  touch: {
    stiffness: 380,
    damping: 24,
    mass: 0.5,
  },
  /** Snappy bouncy response for checkmarks, active indicators */
  bounce: {
    stiffness: 450,
    damping: 18,
    mass: 0.4,
  },
  /** Smooth physics for bottom sheets, modal dialogs */
  sheet: {
    stiffness: 260,
    damping: 26,
    mass: 0.8,
  },
  /** Morphing geometry for shared element screen transitions */
  spatial: {
    stiffness: 220,
    damping: 28,
    mass: 0.9,
  },
} as const

// Duration Tokens (ms)
export const DURATIONS = {
  instant: 50,
  fast: 140,
  normal: 220,
  complex: 320,
} as const

// Easing Curves
export const EASINGS = {
  outQuad: Easing.out(Easing.quad),
  outCubic: Easing.out(Easing.cubic),
  inOutSmooth: Easing.bezier(0.4, 0.0, 0.2, 1),
  genieWarp: Easing.bezier(0.16, 1, 0.3, 1),
} as const

// Glassmorphism Blur Tokens
export const BLUR = {
  tabbarLight: 80,
  tabbarDark: 40,
  modalLight: 15,
  modalDark: 25,
} as const
