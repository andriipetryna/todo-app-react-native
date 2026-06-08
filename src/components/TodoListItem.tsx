import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Group, Todo } from '@/db/schema';
import { formatDueDateTime, isOverdue, relativeDueLabel } from '@/lib/date';
import { useTheme } from '@/lib/theme';

interface Props {
  todo: Todo;
  group: Group | undefined;
  onToggle: (todo: Todo) => void;
  onPress: (todo: Todo) => void;
}

/** A single todo row: completion checkbox, title, due info, and group dot. */
export function TodoListItem({ todo, group, onToggle, onPress }: Props): React.JSX.Element {
  const theme = useTheme();
  const overdue = !todo.isDone && isOverdue(todo.dueAt);

  return (
    <Pressable
      onPress={() => onPress(todo)}
      style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
      accessibilityRole="button"
      accessibilityLabel={`Edit todo ${todo.title}`}
    >
      <Pressable
        hitSlop={10}
        onPress={() => onToggle(todo)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: todo.isDone }}
        accessibilityLabel={todo.isDone ? 'Mark as not done' : 'Mark as done'}
        style={[
          styles.checkbox,
          {
            borderColor: todo.isDone ? theme.primary : theme.border,
            backgroundColor: todo.isDone ? theme.primary : 'transparent',
          },
        ]}
      >
        {todo.isDone ? <Text style={styles.check}>✓</Text> : null}
      </Pressable>

      <View style={styles.body}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            { color: todo.isDone ? theme.done : theme.text },
            todo.isDone && styles.titleDone,
          ]}
        >
          {todo.title}
        </Text>

        {todo.dueAt != null ? (
          <Text
            numberOfLines={1}
            style={[styles.due, { color: overdue ? theme.overdue : theme.textMuted }]}
          >
            {overdue ? 'Overdue · ' : `${relativeDueLabel(todo.dueAt)} · `}
            {formatDueDateTime(todo.dueAt)}
          </Text>
        ) : null}
      </View>

      {group ? (
        <View style={styles.groupTag}>
          <View style={[styles.dot, { backgroundColor: group.color }]} />
          <Text numberOfLines={1} style={[styles.groupName, { color: theme.textMuted }]}>
            {group.name}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '500' },
  titleDone: { textDecorationLine: 'line-through' },
  due: { fontSize: 12, marginTop: 2 },
  groupTag: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 90 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  groupName: { fontSize: 12 },
});
