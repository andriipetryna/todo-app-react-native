import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateTimeField } from '@/components/DateTimeField';
import { useTheme } from '@/lib/theme';
import { useDataStore } from '@/store/dataStore';

export default function TodoEditScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isNew = id === 'new';
  const todoId = isNew ? null : Number(id);

  const groups = useDataStore((s) => s.groups);
  const settings = useDataStore((s) => s.settings);
  const existing = useDataStore((s) =>
    todoId != null ? s.todos.find((t) => t.id === todoId) : undefined,
  );

  const addTodo = useDataStore((s) => s.addTodo);
  const editTodo = useDataStore((s) => s.editTodo);
  const removeTodo = useDataStore((s) => s.removeTodo);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [groupId, setGroupId] = useState<number | null>(existing?.groupId ?? null);
  const [dueAt, setDueAt] = useState<number | null>(existing?.dueAt ?? null);
  const [leadText, setLeadText] = useState<string>(
    existing?.notificationLeadMinutes != null ? String(existing.notificationLeadMinutes) : '',
  );
  const [saving, setSaving] = useState(false);

  const defaultLead = settings?.defaultLeadMinutes ?? 30;
  const leadMinutes = useMemo(() => parseLead(leadText), [leadText]);
  const titleValid = title.trim().length > 0;

  async function handleSave(): Promise<void> {
    if (!titleValid || saving) return;
    setSaving(true);
    const payload = {
      title: title.trim(),
      notes: notes.trim() ? notes.trim() : null,
      groupId,
      dueAt,
      notificationLeadMinutes: leadMinutes,
    };
    try {
      if (todoId != null) {
        await editTodo(todoId, payload);
      } else {
        await addTodo(payload);
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(): void {
    if (todoId == null) return;
    Alert.alert('Delete todo', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void removeTodo(todoId).then(() => router.back());
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Label text="Title" />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What needs doing?"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, inputStyle(theme)]}
          autoFocus={isNew}
          accessibilityLabel="Todo title"
        />

        <Label text="Notes" />
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional details"
          placeholderTextColor={theme.textMuted}
          multiline
          style={[styles.input, styles.notes, inputStyle(theme)]}
          accessibilityLabel="Notes"
        />

        <Label text="Group" />
        <View style={styles.groupRow}>
          <GroupChip label="None" active={groupId === null} onPress={() => setGroupId(null)} />
          {groups.map((g) => (
            <GroupChip
              key={g.id}
              label={g.name}
              color={g.color}
              active={groupId === g.id}
              onPress={() => setGroupId(g.id)}
            />
          ))}
        </View>

        <Label text="Due date & time" />
        <DateTimeField value={dueAt} onChange={setDueAt} />

        <Label text="Reminder lead time (minutes before)" />
        <TextInput
          value={leadText}
          onChangeText={setLeadText}
          keyboardType="number-pad"
          placeholder={`Default (${defaultLead} min)`}
          placeholderTextColor={theme.textMuted}
          style={[styles.input, inputStyle(theme)]}
          accessibilityLabel="Reminder lead time in minutes"
        />
        <Text style={[styles.hint, { color: theme.textMuted }]}>
          {dueAt == null
            ? 'Set a due date to enable a reminder.'
            : leadMinutes == null
              ? `Using the global default of ${defaultLead} minutes before.`
              : `Reminder ${leadMinutes} minutes before the due time.`}
        </Text>

        <Pressable
          onPress={handleSave}
          disabled={!titleValid || saving}
          style={[styles.saveBtn, { backgroundColor: titleValid ? theme.primary : theme.border }]}
          accessibilityRole="button"
        >
          <Text style={[styles.saveText, { color: theme.primaryText }]}>
            {todoId != null ? 'Save changes' : 'Add todo'}
          </Text>
        </Pressable>

        {todoId != null ? (
          <Pressable onPress={handleDelete} style={styles.deleteBtn} accessibilityRole="button">
            <Text style={{ color: theme.danger, fontWeight: '600' }}>Delete todo</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function parseLead(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function Label({ text }: { text: string }): React.JSX.Element {
  const theme = useTheme();
  return <Text style={[styles.label, { color: theme.textMuted }]}>{text}</Text>;
}

function GroupChip({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color?: string;
  active: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: theme.border, backgroundColor: active ? theme.primary : theme.card },
      ]}
    >
      {color ? <View style={[styles.chipDot, { backgroundColor: color }]} /> : null}
      <Text style={{ color: active ? theme.primaryText : theme.text, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

function inputStyle(theme: ReturnType<typeof useTheme>) {
  return { backgroundColor: theme.card, borderColor: theme.border, color: theme.text };
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 6, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 12 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  notes: { minHeight: 80, textAlignVertical: 'top' },
  groupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  hint: { fontSize: 12, marginTop: 4 },
  saveBtn: { marginTop: 24, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveText: { fontSize: 16, fontWeight: '700' },
  deleteBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
});
