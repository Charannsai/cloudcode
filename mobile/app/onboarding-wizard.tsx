import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, SafeAreaView, Platform
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Terminal, Shield, Check, Cpu, ChevronDown, ChevronUp } from 'lucide-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BlurView } from 'expo-blur'

export default function OnboardingWizardScreen() {
  const { colors, isDark } = useAppTheme()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [expandList, setExpandList] = useState(false)

  // Selection states for manual custom selections
  const [runtimes, setRuntimes] = useState({
    node: true,
    git: true,
    gcc: true,
    python: true,
  })

  const toggleRuntime = (key: keyof typeof runtimes) => {
    setRuntimes(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleConfirm = async (auto = true) => {
    setLoading(true)
    try {
      // If auto-install is selected, we choose all tools
      const selection = auto ? { node: true, git: true, gcc: true, python: true } : runtimes
      
      // Save choices to AsyncStorage for the project container setup scripts to read
      await AsyncStorage.setItem('onboarding_completed', 'true')
      await AsyncStorage.setItem('onboarding_runtimes_node', selection.node ? 'true' : 'false')
      await AsyncStorage.setItem('onboarding_runtimes_git', selection.git ? 'true' : 'false')
      await AsyncStorage.setItem('onboarding_runtimes_gcc', selection.gcc ? 'true' : 'false')
      await AsyncStorage.setItem('onboarding_runtimes_python', selection.python ? 'true' : 'false')

      // Short delay for high-fidelity loading effect
      setTimeout(() => {
        setLoading(false)
        router.replace('/(tabs)/dashboard')
      }, 1000)
    } catch (err) {
      console.error('Failed to save onboarding configs:', err)
      setLoading(false)
    }
  }

  const blurIntensity = isDark ? 40 : 70

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Background glow styling matching our design system */}
        <View style={[styles.glowRing, { borderColor: isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(167, 139, 250, 0.08)' }]} />
        
        <View style={styles.cardWrapper}>
          <BlurView
            intensity={blurIntensity}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.card,
              { 
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                backgroundColor: isDark ? 'rgba(21, 25, 34, 0.75)' : 'rgba(255, 255, 255, 0.8)' 
              }
            ]}
          >
            <View style={styles.header}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(167, 139, 250, 0.08)' }]}>
                <Cpu size={24} color={isDark ? '#C084FC' : '#9333EA'} />
              </View>
              <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Initialize Environment</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                CloudCode runs workspace files inside isolated Docker containers. Let's pre-configure your runtime engines.
              </Text>
            </View>

            <View style={styles.promptBox}>
              <Text style={[styles.promptText, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>
                We are installing essential development runtimes (Node.js, Git, GCC, Python) as a pre-requisite. Would you like to proceed?
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={isDark ? '#C084FC' : '#9333EA'} size="small" />
                <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                  Setting up environment variables...
                </Text>
              </View>
            ) : (
              <View style={styles.actions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.primaryBtn, { backgroundColor: isDark ? '#FFFFFF' : '#0E1116' }]}
                  onPress={() => handleConfirm(true)}
                >
                  <Text style={[styles.primaryBtnText, { color: isDark ? '#0E1116' : '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>
                    Confirm Auto-Install (Recommended)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.secondaryBtn, { borderColor: colors.border }]}
                  onPress={() => setExpandList(!expandList)}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>
                    Customize Manually
                  </Text>
                  {expandList ? <ChevronUp size={16} color={colors.text} /> : <ChevronDown size={16} color={colors.text} />}
                </TouchableOpacity>
              </View>
            )}

            {/* Expandable Manual Customization Panel */}
            {expandList && !loading && (
              <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.checkboxList}>
                  {[
                    { id: 'node', label: 'Node.js Runtime', desc: 'JavaScript, npm package manager, Next.js templates' },
                    { id: 'git', label: 'Git Version Control', desc: 'Sync branches, pull remote commits, stage changes' },
                    { id: 'gcc', label: 'GCC Compiler', desc: 'C, C++ compilation and run commands' },
                    { id: 'python', label: 'Python 3 Runtime', desc: 'Python scripting, Flask/FastAPI backend servers' },
                  ].map((item) => {
                    const isSelected = runtimes[item.id as keyof typeof runtimes]
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        style={[styles.checkRow, { borderBottomColor: colors.border }]}
                        onPress={() => toggleRuntime(item.id as keyof typeof runtimes)}
                      >
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={[styles.checkLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{item.label}</Text>
                          <Text style={[styles.checkDesc, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{item.desc}</Text>
                        </View>
                        <View style={[
                          styles.checkbox,
                          {
                            borderColor: isSelected ? (isDark ? '#C084FC' : '#9333EA') : colors.border,
                            backgroundColor: isSelected ? (isDark ? '#C084FC' : '#9333EA') : 'transparent'
                          }
                        ]}>
                          {isSelected && <Check size={12} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={3} />}
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.primaryBtn, { backgroundColor: isDark ? '#FFFFFF' : '#0E1116', marginTop: 16 }]}
                  onPress={() => handleConfirm(false)}
                >
                  <Text style={[styles.primaryBtnText, { color: isDark ? '#0E1116' : '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>
                    Install Selected Components
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </BlurView>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  glowRing: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1.5,
    opacity: 0.8,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.7,
  },
  promptBox: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.02)',
    marginBottom: 20,
  },
  promptText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    opacity: 0.9,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 13,
  },
  actions: {
    gap: 10,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
  },
  listScroll: {
    maxHeight: 220,
    marginTop: 20,
  },
  checkboxList: {
    gap: 2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  checkLabel: {
    fontSize: 13,
  },
  checkDesc: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
