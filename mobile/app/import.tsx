import { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { useProjectsStore } from '@/store/projects'

export default function ImportScreen() {
  const router = useRouter()
  const { addProject } = useProjectsStore()
  const [name, setName] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [loading, setLoading] = useState(false)

  function extractName(url: string) {
    const parts = url.replace(/\.git$/, '').split('/')
    return parts[parts.length - 1] || ''
  }

  function handleUrlChange(url: string) {
    setGithubUrl(url)
    if (!name) setName(extractName(url))
  }

  async function handleImport() {
    if (!githubUrl.includes('github.com')) {
      Alert.alert('Error', 'Please enter a valid GitHub URL')
      return
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a project name')
      return
    }
    setLoading(true)
    try {
      const project = await api.projects.import(name.trim(), githubUrl.trim())
      addProject(project)
      router.replace(`/project/${project.id}`)
    } catch (err) {
      Alert.alert('Import failed', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Import from GitHub</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.iconContainer}>
          <Text style={styles.bigIcon}>🐙</Text>
        </View>

        <Text style={styles.instruction}>
          Paste a GitHub repo URL and CloudCode will clone it into a new container.
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>GITHUB URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://github.com/user/repo"
            placeholderTextColor="#3a3a5a"
            value={githubUrl}
            onChangeText={handleUrlChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>PROJECT NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="my-repo"
            placeholderTextColor="#3a3a5a"
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.importBtn, loading && styles.importBtnDisabled]}
          onPress={handleImport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.importBtnText}>🐙 Import Repository</Text>
          )}
        </TouchableOpacity>

        {loading && (
          <Text style={styles.hint}>
            📦 Cloning repository and setting up container...{'\n'}
            This may take 30–60 seconds.
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { flex: 1, padding: 20, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backBtn: {
    width: 36, height: 36,
    backgroundColor: '#1e1e30',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#8a8a9a', fontSize: 16, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  bigIcon: { fontSize: 64 },
  instruction: {
    color: '#6a6a8a',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  section: { marginBottom: 20 },
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
    fontSize: 15,
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  importBtn: {
    backgroundColor: '#1c1c2e',
    borderWidth: 1,
    borderColor: '#7c6bff60',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  importBtnDisabled: { opacity: 0.6 },
  importBtnText: { fontSize: 17, fontWeight: '700', color: '#7c6bff' },
  hint: {
    color: '#4a4a6a',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
})
