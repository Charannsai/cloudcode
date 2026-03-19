import { Tabs } from 'expo-router'
import { useAppTheme } from '@/hooks/useAppTheme'
import { LayoutGrid, Settings } from 'lucide-react-native'

export default function TabsLayout() {
  const { colors } = useAppTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 28,
          paddingTop: 12,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_700Bold',
          marginTop: 4,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Workspaces',
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid size={size - 2} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size - 2} color={color} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
  )
}

