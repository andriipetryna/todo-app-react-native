import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatTime } from '@/lib/date';
import { useTheme } from '@/lib/theme';

interface Props {
  /** Current value as epoch ms, or null when no due date is set. */
  value: number | null;
  onChange: (value: number | null) => void;
}

/**
 * Combined date + time picker that yields a single epoch-ms timestamp. On Android the
 * native pickers open as sequential dialogs (date, then time); we keep the chosen
 * day/time and combine them. Clearing sets the value to null (no due date).
 */
export function DateTimeField({ value, onChange }: Props): React.JSX.Element {
  const theme = useTheme();
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const [draft, setDraft] = useState<Date | null>(null);

  const current = value != null ? new Date(value) : null;

  function openDatePicker(): void {
    setDraft(current ?? defaultDue());
    setMode('date');
  }

  function handleChange(event: DateTimePickerEvent, selected?: Date): void {
    if (event.type === 'dismissed' || !selected) {
      setMode(null);
      setDraft(null);
      return;
    }

    if (mode === 'date') {
      // Keep the date, then ask for the time.
      const base = draft ?? defaultDue();
      const next = new Date(base);
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setDraft(next);
      setMode('time');
      return;
    }

    // mode === 'time' — combine and commit.
    const base = draft ?? defaultDue();
    const next = new Date(base);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setMode(null);
    setDraft(null);
    onChange(next.getTime());
  }

  return (
    <View>
      <Pressable
        onPress={openDatePicker}
        style={[styles.field, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
        accessibilityRole="button"
        accessibilityLabel="Set due date and time"
      >
        <Text style={{ color: current ? theme.text : theme.textMuted, fontSize: 16 }}>
          {current
            ? `${formatDate(current.getTime())} · ${formatTime(current.getTime())}`
            : 'No due date'}
        </Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable onPress={openDatePicker} hitSlop={8}>
          <Text style={[styles.action, { color: theme.primary }]}>
            {current ? 'Change' : 'Set due date'}
          </Text>
        </Pressable>
        {current ? (
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <Text style={[styles.action, { color: theme.danger }]}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {mode ? (
        <DateTimePicker
          value={draft ?? current ?? defaultDue()}
          mode={mode}
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

/** Default suggestion: next hour, on the hour. */
function defaultDue(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

const styles = StyleSheet.create({
  field: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  action: { fontSize: 14, fontWeight: '600' },
});
