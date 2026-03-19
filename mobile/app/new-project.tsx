import { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { useProjectsStore } from '@/store/projects'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Terminal, Atom, FileCode, ChevronLeft, Loader2, Check } from 'lucide-react-native'

const TEMPLATES = [
  { id: 'node', label: 'Node.js', icon: Terminal, desc: 'Ready-to-run HTTP server environment' },
  { id: 'react', label: 'React + Vite', icon: Atom, desc: 'Bootstrap a modern React application' },
  { id: 'empty', label: 'Empty', icon: FileCode, desc: 'Start with a blank workspace' },
] as const

export default function NewProjectScreen() {
  const router = useRouter()
  const { colors } = useAppTheme()
  const { addProject } = useProjectsStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<'node' | 'react' | 'empty'>('node')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a workspace name')
      return
    }
    setLoading(true)
    try {
      const project = await api.projects.create(name.trim(), type)
      addProject(project)
      router.replace(`/project/${project.id}`)
    } catch (err) {
      Alert.alert('Failed to create workspace', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>New Workspace</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>WORKSPACE NAME</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card, 
                borderColor: colors.border, 
                color: colors.text,
              }]}
              placeholder="my-cool-project"
              placeholderTextColor={colors.textSecondary + '80'}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>SELECT TEMPLATE</Text>
            {TEMPLATES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.templateCard, 
                  { backgroundColor: colors.card, borderColor: type === t.id ? colors.text : colors.border }
                ]}
                onPress={() => setType(t.id)}
                activeOpacity={0.7}
              >
                <View style={styles.templateLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: type === t.id ? colors.text : colors.background }]}>
                    <t.icon size={22} color={type === t.id ? colors.card : colors.textSecondary} strokeWidth={2.5} />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={[styles.templateLabel, { color: colors.text }]}>
                      {t.label}
                    </Text>
                    <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>{t.desc}</Text>
                  </View>
                </View>
                {type === t.id && (
                  <View style={[styles.checkCircle, { backgroundColor: colors.text }]}>
                    <Check size={14} color={colors.card} strokeWidth={4} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.text, opacity: loading ? 0.7 : 1 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <Text style={[styles.createBtnText, { color: colors.card }]}>Create Workspace</Text>
            )}
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingInfo}>
              <Loader2 size={16} color={colors.textSecondary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Provisioning your workspace...
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  section: { marginBottom: 32 },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    fontSize: 15,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  templateCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: { flex: 1 },
  templateLabel: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  templateDesc: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  createBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  loadingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
})
