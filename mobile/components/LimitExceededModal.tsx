import React, { useState } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useUIStore } from '../store/ui'
import { useAppTheme } from '../hooks/useAppTheme'
import { Shield, Zap, Server, Lock, ArrowUpRight, X } from 'lucide-react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { api } from '../lib/api'
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated'
import { useRouter } from 'expo-router'

export default function LimitExceededModal() {
  const { colors, isDark } = useAppTheme()
  const { limitModalVisible, limitModalType, hideLimitModal, setSettingsSubScreen } = useUIStore()
  const router = useRouter()
  const [loadingUpgrade, setLoadingUpgrade] = useState(false)

  if (!limitModalVisible) return null

  const title = limitModalType === 'workspace' 
    ? 'Workspace Limit Reached' 
    : limitModalType === 'ai' 
      ? 'AI Token Limit Reached' 
      : 'Tier Limit Exceeded'

  const description = limitModalType === 'workspace'
    ? 'You have reached the maximum number of workspaces allowed on your current tier. Upgrade to unlock more workspaces and premium compute.'
    : limitModalType === 'ai'
      ? 'You have consumed all your monthly AI tokens. Upgrade to one of our paid tiers to continue using premium models with unlimited or higher quotas.'
      : 'You have reached a resource boundary on your current plan. Upgrade to unlock the full power of CloudCode.'

  const handleUpgrade = async () => {
    setLoadingUpgrade(true)
    try {
      const returnUrl = Linking.createURL('/billing/success')
      // Initiate Stripe Checkout for Pro monthly
      const { checkoutUrl } = await api.billing.checkout('pro_monthly', returnUrl)
      if (checkoutUrl) {
        await WebBrowser.openBrowserAsync(checkoutUrl)
        hideLimitModal()
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      console.warn('Failed to start checkout:', err)
      // Fallback: redirect to settings billing subscreen
      hideLimitModal()
      setSettingsSubScreen('billing')
      router.push('/(tabs)/settings')
    } finally {
      setLoadingUpgrade(false)
    }
  }

  const handleExplorePlans = () => {
    hideLimitModal()
    setSettingsSubScreen('billing')
    router.push('/(tabs)/settings')
  }

  return (
    <Modal
      visible={limitModalVisible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={hideLimitModal}
    >
      <View style={styles.backdrop}>
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(150)} 
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]}
        />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={hideLimitModal} disabled={loadingUpgrade} />

        <Animated.View 
          entering={FadeInDown.springify().damping(18)} 
          style={[styles.card, { backgroundColor: isDark ? '#0F141C' : '#FFFFFF', borderColor: colors.border }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: limitModalType === 'ai' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
              {limitModalType === 'ai' ? (
                <Zap size={22} color="#10B981" />
              ) : (
                <Server size={22} color="#EF4444" />
              )}
            </View>
            <TouchableOpacity onPress={hideLimitModal} style={styles.closeBtn} disabled={loadingUpgrade}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
          </View>

          {/* Features Preview */}
          <View style={[styles.featuresList, { backgroundColor: isDark ? '#161B22' : '#F9FAFB', borderColor: colors.border }]}>
            <Text style={[styles.featuresTitle, { color: colors.textSecondary }]}>PRO PLAN INCLUDES:</Text>
            <View style={styles.featureRow}>
              <Zap size={14} color="#10B981" />
              <Text style={[styles.featureText, { color: colors.text }]}>5 Million Monthly AI Tokens</Text>
            </View>
            <View style={styles.featureRow}>
              <Server size={14} color="#3B82F6" strokeWidth={2} />
              <Text style={[styles.featureText, { color: colors.text }]}>20 Workspaces & Always-On Slot</Text>
            </View>
            <View style={styles.featureRow}>
              <Lock size={14} color="#8B5CF6" />
              <Text style={[styles.featureText, { color: colors.text }]}>Access Premium GPT-4o & Claude</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={handleExplorePlans} 
              style={[styles.cancelBtn, { borderColor: colors.border }]} 
              activeOpacity={0.7}
              disabled={loadingUpgrade}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Explore Plans</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleUpgrade} 
              style={[styles.upgradeBtn, { backgroundColor: colors.primary }]} 
              activeOpacity={0.8}
              disabled={loadingUpgrade}
            >
              {loadingUpgrade ? (
                <ActivityIndicator size="small" color={isDark ? '#000' : '#fff'} />
              ) : (
                <>
                  <Text style={[styles.upgradeBtnText, { color: isDark ? '#000' : '#fff' }]}>Upgrade to Pro</Text>
                  <ArrowUpRight size={15} color={isDark ? '#000' : '#fff'} style={{ marginLeft: 4 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  description: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  featuresList: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  featuresTitle: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  upgradeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  upgradeBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
})
