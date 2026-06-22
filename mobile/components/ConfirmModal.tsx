import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { useAppTheme } from '@/hooks/useAppTheme'
import { AlertTriangle, Info, Trash2, LogOut, Check, AlertCircle } from 'lucide-react-native'

export interface ConfirmModalProps {
  visible: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'logout' | 'success' | 'error'
  isLoading?: boolean
  singleButton?: boolean
}

const TYPE_CONFIG = {
  danger: {
    icon: Trash2,
    color: '#F85149',
    bgLight: '#FFEBE9',
    bgDark: '#4A1C1B',
  },
  warning: {
    icon: AlertTriangle,
    color: '#D29922',
    bgLight: '#FFF8C5',
    bgDark: '#4D3C10',
  },
  info: {
    icon: Info,
    color: '#58A6FF',
    bgLight: '#DDEDFF',
    bgDark: '#1E3A5F',
  },
  logout: {
    icon: LogOut,
    color: '#F85149',
    bgLight: '#FFEBE9',
    bgDark: '#4A1C1B',
  },
  success: {
    icon: Check,
    color: '#3FB950',
    bgLight: 'rgba(63, 185, 80, 0.15)',
    bgDark: 'rgba(63, 185, 80, 0.08)',
  },
  error: {
    icon: AlertCircle,
    color: '#F85149',
    bgLight: 'rgba(248, 81, 73, 0.15)',
    bgDark: 'rgba(248, 81, 73, 0.08)',
  },
}

export function ConfirmModal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
  singleButton = false,
}: ConfirmModalProps) {
  const { colors, isDark } = useAppTheme()
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.98)
  const translateY = useSharedValue(8)
  const [renderModal, setRenderModal] = React.useState(visible)

  useEffect(() => {
    if (visible) {
      setRenderModal(true)
      opacity.value = withTiming(1, { duration: 75, easing: Easing.bezier(0.16, 1, 0.3, 1) })
      scale.value = withTiming(1, { duration: 75, easing: Easing.bezier(0.16, 1, 0.3, 1) })
      translateY.value = withTiming(0, { duration: 75, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    } else {
      opacity.value = withTiming(0, { duration: 60, easing: Easing.linear }, (finished) => {
        if (finished) {
          runOnJS(setRenderModal)(false)
        }
      })
      scale.value = withTiming(0.98, { duration: 60, easing: Easing.linear })
      translateY.value = withTiming(4, { duration: 60, easing: Easing.linear })
    }
  }, [visible])

  const config = TYPE_CONFIG[type]
  const Icon = config.icon
  const showCancel = !singleButton && !!onCancel

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const modalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }))

  if (!renderModal) return null

  const handleDismiss = onCancel || onConfirm

  return (
    <Modal transparent visible={renderModal} statusBarTranslucent={true} animationType="none" onRequestClose={handleDismiss}>
      <Animated.View style={[styles.overlay, backdropStyle]}>
        <BlurView
          intensity={isDark ? 15 : 10}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={handleDismiss}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#1C2128' : '#FFFFFF',
              borderColor: colors.border,
            },
            modalStyle,
          ]}
        >
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Icon size={16} color={config.color} strokeWidth={2.5} />
              <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                {title}
              </Text>
            </View>
            <Text
              style={[
                styles.message,
                { color: colors.textSecondary, fontFamily: 'Inter_400Regular' },
              ]}
            >
              {message}
            </Text>
          </View>

          <View style={styles.actionRow}>
            {showCancel && (
              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.cancelBtn,
                  { 
                    borderColor: colors.border,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
                  }
                ]}
                onPress={onCancel}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.btnText,
                    { color: colors.textSecondary, fontFamily: 'Inter_500Medium' },
                  ]}
                >
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.btn,
                styles.confirmBtn,
                { 
                  backgroundColor: type === 'danger' || type === 'logout' ? '#F85149' : config.color,
                }
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.btnText,
                  { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
                ]}
              >
                {isLoading ? 'Processing...' : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 310,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
    paddingLeft: 24,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {
    // background dynamically set
  },
  btnText: {
    fontSize: 12,
  },
})
