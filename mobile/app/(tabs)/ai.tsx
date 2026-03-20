import React from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Sparkles, Send, Brain, Code, Terminal, MessageSquare } from 'lucide-react-native'

export default function AIScreen() {
  const { colors } = useAppTheme()

  const suggestions = [
    { label: 'Optimize my current project', icon: Brain },
    { label: 'Write a React component', icon: Code },
    { label: 'Exposing internal ports...', icon: Terminal },
    { label: 'Explain my code logic', icon: MessageSquare },
  ]

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.aiBadge, { backgroundColor: colors.text + '10' }]}>
            <Sparkles size={16} color={colors.text} />
            <Text style={[styles.aiBadgeText, { color: colors.text }]}>CloudCode AI</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>How can I help you today?</Text>
        </View>

        <View style={styles.suggestions}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={i} style={[styles.suggestion, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <s.icon size={18} color={colors.textSecondary} />
              <Text style={[styles.suggestionText, { color: colors.text }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.chatArea}>
          <View style={[styles.emptyBotIcon, { backgroundColor: colors.text + '05' }]}>
            <Sparkles size={40} color={colors.textSecondary} opacity={0.3} />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            placeholder="Ask anything..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text }]}
            multiline
          />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.text }]}>
            <Send size={18} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 64, paddingBottom: 120 },
  header: { alignItems: 'center', marginBottom: 40 },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  aiBadgeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center', maxWidth: 220 },
  suggestions: { gap: 12 },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  suggestionText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  chatArea: { marginTop: 60, alignItems: 'center' },
  emptyBotIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', display: 'flex' },
  inputContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 12,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
