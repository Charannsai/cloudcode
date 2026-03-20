import React from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  Dimensions
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { 
  Sparkles, 
  Plus, 
  ArrowUp, 
  MoreVertical, 
  Globe, 
  Smartphone, 
  Palette, 
  Code2, 
  BrainCircuit,
  Layout,
  Play,
  Database
} from 'lucide-react-native'
import { useAuthStore } from '@/store/auth'
import { useScrollVisibility } from '@/hooks/useScrollVisibility'
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated'

const { width } = Dimensions.get('window')

export default function AIScreen() {
  const { colors, isDark } = useAppTheme()
  const { user } = useAuthStore()
  const { handleScroll } = useScrollVisibility()

  const categories = [
    { label: 'Frontend', icon: Globe },
    { label: 'Backend', icon: Code2 },
    { label: 'Mobile', icon: Smartphone },
    { label: 'Database', icon: Database },
    { label: 'Logic', icon: BrainCircuit },
  ]

  const username = user?.login || 'guest'

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: isDark ? '#050505' : '#FCFCFC' }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#111' : '#EEE' }]}>
        <View style={styles.workspaceInfo}>
          {user?.avatar_url ? (
            <Image 
              source={{ uri: user.avatar_url }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#222' : '#EEE' }]}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                {username.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={[styles.workspaceText, { color: colors.textSecondary }]}>
            {username}'s workspace
          </Text>
        </View>
        <TouchableOpacity>
          <MoreVertical size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View 
          entering={FadeInDown.delay(100).springify()}
          style={styles.heroContainer}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Hi {username},
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            what do you want to make?
          </Text>
        </Animated.View>

        {/* Categories */}
        <Animated.View 
          entering={FadeInDown.delay(200).springify()}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((cat, i) => (
              <TouchableOpacity 
                key={i} 
                style={[
                  styles.categoryBtn, 
                  { 
                    backgroundColor: isDark ? '#111' : '#FFF',
                    borderColor: isDark ? '#1A1A1A' : '#E0E0E0',
                    shadowColor: '#000',
                    shadowOpacity: isDark ? 0 : 0.05,
                    shadowOffset: { width: 0, height: 2 },
                  }
                ]}
              >
                <cat.icon size={18} color={isDark ? '#FFF' : '#333'} />
                <Text style={[styles.categoryLabel, { color: isDark ? '#EEE' : '#333' }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Main Input Box */}
        <Animated.View 
          entering={FadeInDown.delay(300).springify()}
          style={[
            styles.inputBox, 
            { 
              backgroundColor: isDark ? '#111' : '#F9F9F9',
              borderColor: isDark ? '#1A1A1A' : '#EAEAEA'
            }
          ]}
        >
          <TextInput
            placeholder="Describe your idea, Agent will bring it to life..."
            placeholderTextColor={isDark ? '#555' : '#999'}
            multiline
            style={[styles.input, { color: colors.text }]}
          />
          
          <View style={styles.inputFooter}>
            <TouchableOpacity style={styles.addBtn}>
              <Plus size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.inputActions}>
              <TouchableOpacity 
                style={[
                  styles.planToggle, 
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F0F0F0',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E8E8E8'
                  }
                ]}
              >
                <View style={[styles.planIndicator, { backgroundColor: isDark ? '#333' : '#CCC' }]} />
                <Text style={[styles.planText, { color: colors.text }]}>Plan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.text }]}>
                <ArrowUp size={20} color={isDark ? '#000' : '#FFF'} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Footer Links */}
        <Animated.View 
          entering={FadeIn.delay(500)}
          style={styles.footerLinks}
        >
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Start creating for free
          </Text>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: colors.textSecondary }]}>
              Join CloudCode Core to unlock more usage
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
  },
  workspaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(120, 120, 120, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  content: {
    paddingBottom: 120,
  },
  heroContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 28,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 30,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  inputBox: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    minHeight: 160,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  addBtn: {
    padding: 8,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planIndicator: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  planText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinks: {
    marginTop: 40,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textDecorationLine: 'underline',
  },
})
