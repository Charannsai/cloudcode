import { useState, useEffect } from 'react'
import { Dimensions, ScaledSize } from 'react-native'

const TABLET_BREAKPOINT = 768

function getDeviceType(width: number, height: number) {
  const maxDim = Math.max(width, height)
  const minDim = Math.min(width, height)
  // Use the shorter dimension to determine if this is a tablet
  // This ensures landscape phones don't get classified as tablets
  const isTablet = minDim >= TABLET_BREAKPOINT
  const isLandscape = width > height

  return {
    isTablet,
    isPhone: !isTablet,
    isLandscape,
    screenWidth: width,
    screenHeight: height,
  }
}

/**
 * Reactive hook that detects phone vs. tablet based on screen dimensions.
 * Re-renders on orientation change and iPadOS multitasking resize.
 * Tablet threshold: shortest dimension >= 768px.
 */
export function useDeviceType() {
  const { width, height } = Dimensions.get('window')
  const [device, setDevice] = useState(() => getDeviceType(width, height))

  useEffect(() => {
    function handleChange({ window }: { window: ScaledSize }) {
      setDevice(getDeviceType(window.width, window.height))
    }

    const sub = Dimensions.addEventListener('change', handleChange)
    return () => sub.remove()
  }, [])

  return device
}
