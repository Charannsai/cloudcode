import { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { useProjectsStore } from '@/store/projects'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Github, ChevronLeft, Loader2, Link2, Folder } from 'lucide-react-native'

export default function ImportScreen() {
  const router = useRouter()
  const { colors } = useAppTheme()
  const { addProject } = useProjectsStore()
  const [name, setName] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [loading, setLoading] = useState(false)

  function extractName(url: string) {
    const parts = url.replace(/\.git$/, '').split('/')
    const lastPart = parts[parts.length - 1] || ''
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Import Workspace</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.form}>
            <View style={styles.heroIconContainer}>
              <View style={[styles.ghostCircle, { backgroundColor: colors.card, borderColor: colors.border }]} />
              <Github size={48} color={colors.text} strokeWidth={1.5} />
            </View>

            <Text style={[styles.instruction, { color: colors.textSecondary }]}>
              Enter a GitHub repository URL to clone it into a secure container.
            </Text>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Link2 size={12} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.label, { color: colors.textSecondary }]}>REPOSITORY URL</Text>
              </View>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card, 
                  borderColor: colors.border, 
                  color: colors.text,
                }]}
                placeholder="https://github.com/user/repo"
                placeholderTextColor={colors.textSecondary + '80'}
                value={githubUrl}
                onChangeText={handleUrlChange}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Folder size={12} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.label, { color: colors.textSecondary }]}>WORKSPACE NAME</Text>
              </View>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card, 
                  borderColor: colors.border, 
                  color: colors.text,
                }]}
                placeholder="My Project"
                placeholderTextColor={colors.textSecondary + '80'}
                value={name}
                onChangeText={setName}
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.text, opacity: loading ? 0.7 : 1 }]}
              onPress={handleImport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <>
                  <Text style={[styles.submitBtnText, { color: colors.card }]}>Clone Repository</Text>
                </>
              )}
            </TouchableOpacity>

            {loading && (
              <View style={styles.loadingInfo}>
                <Loader2 size={16} color={colors.textSecondary} style={styles.spinIcon} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Spinning up container and cloning files...
                </Text>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, paddingTop: 60 },
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
  heroIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    height: 100,
  },
  ghostCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    opacity: 0.5,
  },
  form: { flex: 1 },
  instruction: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  inputGroup: { marginBottom: 24 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  submitBtn: {
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  loadingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginLeft: 8,
  },
  spinIcon: {
    // Add animation if possible via Reanimated, but keep it simple for now
  }
})
