import { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { useProjectsStore } from '@/store/projects'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Terminal, Atom, ChevronLeft, Check, Box, Github, Link2, Folder } from 'lucide-react-native'

type CreationMode = 'template' | 'clone'
type NodeType = 'node' | 'react' | 'empty'

const TEMPLATES: { id: NodeType, label: string, icon: any, desc: string, group: string }[] = [
  { id: 'empty', label: 'Blank Project', icon: Box, desc: 'Empty workspace with core binary', group: 'PROJECT' },
  { id: 'node', label: 'Node.js', icon: Terminal, desc: 'Node + Express pre-configured', group: 'TEMPLATE' },
  { id: 'react', label: 'React + Vite', icon: Atom, desc: 'Frontend stack with hot-reload', group: 'TEMPLATE' },
]

export default function NewProjectScreen() {
  const router = useRouter()
  const { colors } = useAppTheme()
  const { addProject } = useProjectsStore()
  
  const [mode, setMode] = useState<CreationMode>('template')
  const [name, setName] = useState('')
  const [type, setType] = useState<NodeType>('empty')
  const [githubUrl, setGithubUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUrlChange = (url: string) => {
    setGithubUrl(url)
    if (!name) {
      const parts = url.replace(/\.git$/, '').split('/')
      const lastPart = parts[parts.length - 1] || ''
      if (lastPart) setName(lastPart.charAt(0).toUpperCase() + lastPart.slice(1))
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Error', 'Designate a name for this node.')
      return
    }

    setLoading(true)
    try {
      let project
      if (mode === 'clone') {
        if (!githubUrl.includes('github.com')) throw new Error('Invalid GitHub repository URL.')
        project = await api.projects.import(name.trim(), githubUrl.trim())
      } else {
        project = await api.projects.create(name.trim(), type)
      }
      
      addProject(project)
      router.replace(`/project/${project.id}`)
    } catch (err) {
      Alert.alert('Failed', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const renderOption = (t: typeof TEMPLATES[0]) => (
    <TouchableOpacity
      key={t.id}
      style={[
        styles.template,
        { backgroundColor: colors.card, borderColor: type === t.id ? colors.text : colors.border }
      ]}
      onPress={() => setType(t.id)}
      activeOpacity={0.7}
    >
      <View style={styles.templateLeft}>
        <t.icon size={18} color={type === t.id ? colors.text : colors.textSecondary} strokeWidth={2} />
        <View>
          <Text style={[styles.templateLabel, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{t.label}</Text>
          <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>{t.desc}</Text>
        </View>
      </View>
      {type === t.id && <Check size={16} color={colors.text} strokeWidth={3} />}
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={20} color={colors.text} strokeWidth={2} />
              <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hero}>
            <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>Provision Node</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Initialize from local templates or remote sources.</Text>
          </View>

          {/* Unified Tab Toggle */}
          <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.tabItem, mode === 'template' && { backgroundColor: colors.text }]}
              onPress={() => setMode('template')}
            >
              <Text style={[styles.tabLabel, { color: mode === 'template' ? colors.background : colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                New Node
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabItem, mode === 'clone' && { backgroundColor: colors.text }]}
              onPress={() => setMode('clone')}
            >
              <Text style={[styles.tabLabel, { color: mode === 'clone' ? colors.background : colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                Clone Repo
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'template' ? (
            <View>
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>IDENTIFIER</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. cloud-node-01"
                  placeholderTextColor={colors.textSecondary + '60'}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>BLANK PROJECT</Text>
                {TEMPLATES.filter(t => t.group === 'PROJECT').map(renderOption)}
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>PRE-INSTALLED TEMPLATES</Text>
                {TEMPLATES.filter(t => t.group === 'TEMPLATE').map(renderOption)}
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>REPOSITORY URL</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                   <Link2 size={16} color={colors.textSecondary} />
                   <TextInput
                     style={[styles.inputField, { color: colors.text }]}
                     placeholder="github.com/user/project"
                     placeholderTextColor={colors.textSecondary + '60'}
                     value={githubUrl}
                     onChangeText={handleUrlChange}
                     autoCapitalize="none"
                     keyboardType="url"
                   />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>NODE NAME</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                   <Folder size={16} color={colors.textSecondary} />
                   <TextInput
                     style={[styles.inputField, { color: colors.text }]}
                     placeholder="My Node"
                     placeholderTextColor={colors.textSecondary + '60'}
                     value={name}
                     onChangeText={setName}
                     autoCorrect={false}
                   />
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.text, opacity: loading ? 0.7 : 1 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                {mode === 'clone' && <Github size={18} color={colors.background} style={{ marginRight: 8 }} />}
                <Text style={[styles.createBtnText, { color: colors.background, fontFamily: 'Inter_500Medium' }]}>
                  {mode === 'clone' ? 'Clone Repository' : 'Provision Node'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 64 },
  header: { marginBottom: 32 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -4 },
  backText: { fontSize: 15 },
  hero: { marginBottom: 32 },
  title: { fontSize: 24, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, opacity: 0.6, marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { fontSize: 13 },
  section: { marginBottom: 24 },
  label: { fontSize: 10, letterSpacing: 1.5, marginBottom: 12, opacity: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  inputField: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  template: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  templateLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  templateLabel: { fontSize: 15 },
  templateDesc: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  createBtn: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 40,
  },
  createBtnText: { fontSize: 16 },
})
