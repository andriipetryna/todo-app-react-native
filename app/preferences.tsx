import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/lib/theme';
import { useDataStore } from '@/store/dataStore';

const PRESETS = [5, 10, 15, 30, 60, 120];

export default function PreferencesScreen(): React.JSX.Element {
  const theme = useTheme();
  const settings = useDataStore((s) => s.settings);
  const setDefaultLeadMinutes = useDataStore((s) => s.setDefaultLeadMinutes);

  const current = settings?.defaultLeadMinutes ?? 30;
  const [text, setText] = useState(String(current));

  function commit(value: number): void {
    if (Number.isFinite(value) && value >= 0) {
      setDefaultLeadMinutes(value);
      setText(String(value));
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: theme.text }]}>Default reminder lead time</Text>
      <Text style={{ color: theme.textMuted }}>
        How long before a todo’s due time its reminder fires, unless overridden per todo.
      </Text>

      <View style={styles.presets}>
        {PRESETS.map((m) => {
          const active = m === current;
          return (
            <Pressable
              key={m}
              onPress={() => commit(m)}
              style={[
                styles.preset,
                { borderColor: theme.border, backgroundColor: active ? theme.primary : theme.card },
              ]}
            >
              <Text style={{ color: active ? theme.primaryText : theme.text }}>{m} min</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: theme.textMuted }]}>Custom (minutes)</Text>
      <View style={styles.customRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          keyboardType="number-pad"
          style={[
            styles.input,
            { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
          ]}
          accessibilityLabel="Custom default lead time in minutes"
        />
        <Pressable
          onPress={() => commit(Number.parseInt(text, 10))}
          style={[styles.saveBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={{ color: theme.primaryText, fontWeight: '700' }}>Save</Text>
        </Pressable>
      </View>

      <Text style={[styles.current, { color: theme.textMuted }]}>
        Current default: {current} minutes before due time.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  preset: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 13, fontWeight: '600', marginTop: 16 },
  customRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  current: { fontSize: 13, marginTop: 16 },
});
