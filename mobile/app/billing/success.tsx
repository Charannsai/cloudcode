import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAppTheme } from '@/hooks/useAppTheme'
import { CheckCircle, ArrowRight, ShieldCheck, Mail, CreditCard, Sparkles } from '@/components/HugeIconsShim'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { api } from '@/lib/api'

export default function BillingSuccessScreen() {
  const router = useRouter()
  const { colors, isDark } = useAppTheme()
  const params = useLocalSearchParams()

  const subscriptionId = (params.subscription_id as string) || 'N/A'
  const email = (params.email as string) || 'N/A'
  const status = (params.status as string) || 'active'

  const [billingInfo, setBillingInfo] = useState<any>(null)

  useEffect(() => {
    async function syncBilling() {
      try {
        const data = await api.billing.status()
        setBillingInfo(data)
      } catch (err) {
        console.warn('Failed to sync billing status:', err)
      }
    }
    syncBilling()
  }, [])

  const currentTierDisplayName = billingInfo?.tier?.displayName || 'Pro Plan'

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Icon Card */}
      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.iconContainer}>
        <View style={[styles.glowBg, { backgroundColor: colors.success + '20' }]} />
        <CheckCircle size={64} color={colors.success} strokeWidth={1.8} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
          Upgrade Complete!
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Your account has been successfully upgraded to the premium subscription tier.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.cardContainer}>
        {/* Plan badge */}
        <View style={[styles.card, { backgroundColor: isDark ? '#0B0C10' : '#FFFFFF', borderColor: colors.border, gap: 14 }]}>
          <View style={styles.row}>
            <View style={[styles.iconBg, { backgroundColor: colors.success + '10' }]}>
              <Sparkles size={18} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 }}>ACTIVE PLAN</Text>
              <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Inter_700Bold' }}>
                {currentTierDisplayName}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
              <Text style={{ color: colors.success, fontSize: 10, fontFamily: 'Inter_700Bold' }}>
                {status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          {/* Details */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Mail size={13} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Email Address</Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.text, fontFamily: 'JetBrainsMono_400Regular' }]} numberOfLines={1}>
              {email}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <CreditCard size={13} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Subscription ID</Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]} numberOfLines={1}>
              {subscriptionId}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <ShieldCheck size={13} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Secure Provisioning</Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.success, fontFamily: 'Inter_600SemiBold' }]}>
              Instant
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Button Action */}
      <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)/settings')}
          style={[styles.btn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.btnText, { color: isDark ? '#000' : '#fff', fontFamily: 'Inter_700Bold' }]}>
            Go to Settings
          </Text>
          <ArrowRight size={16} color={isDark ? '#000' : '#fff'} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 60,
  },
  iconContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  glowBg: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: '100%',
    marginBottom: 40,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    gap: 16,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 12,
    maxWidth: '55%',
  },
  loadingText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
  },
  btn: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    fontSize: 15,
  },
})
