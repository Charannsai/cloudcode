import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { useAppTheme } from '@/hooks/useAppTheme'
import { ArrowLeft, Save, Check } from 'lucide-react-native'

export default function EditorScreen() {
  const { id, path } = useLocalSearchParams<{ id: string; path: string }>()
  const router = useRouter()
  const { colors } = useAppTheme()
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const hasChanges = content !== originalContent

  useEffect(() => {
    if (id && path) fetchFile()
  }, [id, path])

  async function fetchFile() {
    setLoading(true)
    try {
      const data = await api.files.read(id as string, path as string)
      setContent(data.content)
      setOriginalContent(data.content)
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
      router.back()
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.files.write(id as string, path as string, content)
      setOriginalContent(content)
      // Subtle feedback instead of Alert if possible, but keeping it for now
    } catch (err) {
      Alert.alert('Save failed', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const fileName = (path as string)?.split('/').pop() || 'File'

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backBtn, { backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={[styles.fileName, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={[styles.pathText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]} numberOfLines={1}>
            {path}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.saveBtn, 
            { backgroundColor: hasChanges ? colors.primary : colors.card }
          ]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={hasChanges ? colors.background : colors.textSecondary} size="small" />
          ) : (
            hasChanges ? (
              <Save size={18} color={colors.background} />
            ) : (
              <Check size={18} color={colors.textSecondary} />
            )
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.text} size="small" />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Opening file...</Text>
        </View>
      ) : (
        <ScrollView style={styles.editorScroll} keyboardShouldPersistTaps="handled">
          <TextInput
            style={[
              styles.editor, 
              { 
                color: colors.text, 
                backgroundColor: colors.background,
                fontFamily: 'JetBrainsMono_400Regular' 
              }
            ]}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            scrollEnabled={false}
            selectionColor={colors.accent}
          />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  fileName: { 
    fontSize: 15,
  },
  pathText: { 
    fontSize: 10,
    opacity: 0.6,
  },
  saveBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 13 },
  editorScroll: { flex: 1 },
  editor: {
    fontSize: 14,
    lineHeight: 22,
    padding: 20,
    minHeight: '100%',
    letterSpacing: -0.2,
  },
})
