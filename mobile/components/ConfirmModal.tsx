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
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { useAppTheme } from '@/hooks/useAppTheme'
import { AlertTriangle, Info, Trash2, LogOut } from 'lucide-react-native'

export interface ConfirmModalProps {
  visible: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'logout'
  isLoading?: boolean
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
}: ConfirmModalProps) {
  const { colors, isDark } = useAppTheme()
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.9)
  const translateY = useSharedValue(20)
  const [renderModal, setRenderModal] = React.useState(visible)

  useEffect(() => {
    if (visible) {
      setRenderModal(true)
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) })
      scale.value = withSpring(1, { damping: 20, stiffness: 200 })
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 })
    } else {
      opacity.value = withTiming(0, { duration: 150 }, (finished) => {
        if (finished) {
          runOnJS(setRenderModal)(false)
        }
      })
      scale.value = withTiming(0.95, { duration: 150 })
      translateY.value = withTiming(10, { duration: 150 })
    }
  }, [visible])

  const config = TYPE_CONFIG[type]
  const Icon = config.icon

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

  return (
    <Modal transparent visible={renderModal} animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[styles.overlay, backdropStyle]}>
        <BlurView
          intensity={isDark ? 20 : 15}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onCancel}
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
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isDark ? config.bgDark : config.bgLight },
              ]}
            >
              <Icon size={24} color={config.color} strokeWidth={2} />
            </View>

            <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              {title}
            </Text>
            <Text
              style={[
                styles.message,
                { color: colors.textSecondary, fontFamily: 'Inter_400Regular' },
              ]}
            >
              {message}
            </Text>
          </View>

          <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: colors.text, fontFamily: 'Inter_500Medium' },
                ]}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: config.color, fontFamily: 'Inter_600SemiBold' },
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: 54,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    // optional styling
  },
  confirmButton: {
    // optional styling
  },
  buttonText: {
    fontSize: 15,
  },
  separator: {
    width: 1,
    height: '100%',
  },
})
