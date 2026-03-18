import { Tabs } from 'expo-router'
import { Text } from 'react-native'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0e0e1a',
          borderTopColor: '#ffffff12',
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 24,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#7c6bff',
        tabBarInactiveTintColor: '#4a4a6a',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📁</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>⚙️</Text>,
        }}
      />
    </Tabs>
  )
}
