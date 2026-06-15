import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { useTheme } from '@/lib/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }): React.JSX.Element {
  const theme = useTheme();
  return (
    <Text style={{ fontSize: 18, color: focused ? theme.primary : theme.textMuted }}>{label}</Text>
  );
}

export default function TabsLayout(): React.JSX.Element {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ focused }) => <TabIcon label="☑" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="weekly"
        options={{
          title: 'Weekly',
          tabBarLabel: 'Weekly',
          tabBarIcon: ({ focused }) => <TabIcon label="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="monthly"
        options={{
          title: 'Monthly',
          tabBarLabel: 'Monthly',
          tabBarIcon: ({ focused }) => <TabIcon label="🗓" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
