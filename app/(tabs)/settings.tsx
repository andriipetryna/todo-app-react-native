import { Link } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

export default function SettingsScreen(): React.JSX.Element {
  const theme = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ padding: 16, gap: 8 }}>
        <Link href="/groups" asChild>
          <Pressable
            style={{
              backgroundColor: theme.card,
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16, color: theme.text }}>Groups</Text>
            <Text style={{ fontSize: 16, color: theme.textMuted }}>›</Text>
          </Pressable>
        </Link>

        <Link href="/preferences" asChild>
          <Pressable
            style={{
              backgroundColor: theme.card,
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16, color: theme.text }}>Preferences</Text>
            <Text style={{ fontSize: 16, color: theme.textMuted }}>›</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
