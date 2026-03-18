import { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { useProjectsStore } from '@/store/projects'

const TEMPLATES = [
  { id: 'node', label: 'Node.js', icon: '🟢', desc: 'Simple HTTP server, ready to run' },
  { id: 'react', label: 'React + Vite', icon: '⚛️', desc: 'Modern React app with Vite' },
  { id: 'empty', label: 'Empty', icon: '📄', desc: 'Blank workspace, start from scratch' },
] as const

export default function NewProjectScreen() {
  const router = useRouter()
  const { addProject } = useProjectsStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<'node' | 'react' | 'empty'>('node')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a project name')
      return
    }
    setLoading(true)
    try {
      const project = await api.projects.create(name.trim(), type)
      addProject(project)
      router.replace(`/project/${project.id}`)
    } catch (err) {
      Alert.alert('Failed to create project', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Project</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Name input */}
        <View style={styles.section}>
          <Text style={styles.label}>PROJECT NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="my-awesome-app"
            placeholderTextColor="#3a3a5a"
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Template picker */}
        <View style={styles.section}>
          <Text style={styles.label}>TEMPLATE</Text>
          {TEMPLATES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.templateCard, type === t.id && styles.templateCardActive]}
              onPress={() => setType(t.id)}
              activeOpacity={0.8}
            >
              <View style={styles.templateLeft}>
                <Text style={styles.templateIcon}>{t.icon}</Text>
                <View>
                  <Text style={[styles.templateLabel, type === t.id && styles.templateLabelActive]}>
                    {t.label}
                  </Text>
                  <Text style={styles.templateDesc}>{t.desc}</Text>
                </View>
              </View>
              {type === t.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Create button */}
        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Create Project</Text>
          )}
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingHint}>
            ⚙️ Setting up your container... this may take a moment
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 20, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#1e1e30',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#8a8a9a', fontSize: 16, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  section: { marginBottom: 28 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4a4a6a',
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#0e0e1a',
    borderWidth: 1,
    borderColor: '#ffffff15',
    borderRadius: 14,
    padding: 16,
    fontSize: 17,
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  templateCard: {
    backgroundColor: '#0e0e1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffffff0d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateCardActive: {
    borderColor: '#7c6bff',
    backgroundColor: '#7c6bff15',
  },
  templateLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  templateIcon: { fontSize: 28 },
  templateLabel: { fontSize: 16, fontWeight: '700', color: '#8a8a9a', marginBottom: 2 },
  templateLabelActive: { color: '#ffffff' },
  templateDesc: { fontSize: 13, color: '#4a4a6a' },
  checkmark: { fontSize: 18, color: '#7c6bff', fontWeight: '800' },
  createBtn: {
    backgroundColor: '#7c6bff',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#7c6bff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  loadingHint: {
    color: '#5a5a7a',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
})
