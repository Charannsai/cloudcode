import { Tabs } from 'expo-router'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Database, Monitor } from 'lucide-react-native'

export default function TabsLayout() {
  const { colors } = useAppTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 28,
          paddingTop: 12,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_500Medium',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Nodes',
          tabBarIcon: ({ color }) => (
            <Database size={18} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'System',
          tabBarIcon: ({ color }) => (
            <Monitor size={18} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  )
}

