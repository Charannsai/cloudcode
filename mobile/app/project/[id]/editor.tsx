import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '@/lib/api'

export default function EditorScreen() {
  const { id, path } = useLocalSearchParams<{ id: string; path: string }>()
  const router = useRouter()
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
      Alert.alert('Saved ✓', 'File saved successfully')
    } catch (err) {
      Alert.alert('Save failed', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const fileName = (path as string)?.split('/').pop() || 'File'

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
        <TouchableOpacity
          style={[styles.saveBtn, hasChanges && styles.saveBtnActive]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.saveBtnText, hasChanges && styles.saveBtnTextActive]}>
              {hasChanges ? 'Save' : 'Saved'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* File path */}
      <View style={styles.pathBar}>
        <Text style={styles.pathText} numberOfLines={1}>📄 {path}</Text>
        {hasChanges && <View style={styles.unsavedDot} />}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#7c6bff" />
          <Text style={styles.loadingText}>Loading file...</Text>
        </View>
      ) : (
        <ScrollView style={styles.editorScroll} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.editor}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            scrollEnabled={false}
          />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff0a',
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36,
    backgroundColor: '#1e1e30',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#8a8a9a', fontSize: 20, fontWeight: '700' },
  fileName: { flex: 1, color: '#ffffff', fontSize: 16, fontWeight: '700', fontFamily: 'monospace' },
  saveBtn: {
    backgroundColor: '#1e1e30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  saveBtnActive: { backgroundColor: '#7c6bff' },
  saveBtnText: { color: '#4a4a6a', fontWeight: '700', fontSize: 14 },
  saveBtnTextActive: { color: '#ffffff' },
  pathBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff06',
    gap: 8,
  },
  pathText: { flex: 1, color: '#3a3a5a', fontSize: 12, fontFamily: 'monospace' },
  unsavedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#4a4a6a', fontSize: 14 },
  editorScroll: { flex: 1 },
  editor: {
    color: '#c8d3e0',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 22,
    padding: 16,
    minHeight: 600,
    letterSpacing: 0.2,
  },
})
