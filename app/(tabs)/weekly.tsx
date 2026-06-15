import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TodoListItem } from '@/components/TodoListItem';
import type { Group, Todo } from '@/db/schema';
import { useTheme } from '@/lib/theme';
import { useDataStore } from '@/store/dataStore';

const DAY_MS = 24 * 60 * 60 * 1000;

function getWeekStart(base: Date): Date {
  const d = new Date(base);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(start: Date): string {
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (start.getFullYear() !== end.getFullYear()) {
    return `${start.toLocaleDateString(undefined, { ...opts, year: 'numeric' })} – ${end.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`;
  }
  return `${start.getDate()} – ${end.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`;
}

function formatDayHeader(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

interface DaySection {
  dayMs: number;
  label: string;
  todos: Todo[];
}

export default function WeeklyScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [weekOffset, setWeekOffset] = useState(0);

  const todos = useDataStore((s) => s.todos);
  const groups = useDataStore((s) => s.groups);
  const toggleTodo = useDataStore((s) => s.toggleTodo);

  const groupById = useMemo(() => new Map(groups.map((g: Group) => [g.id, g])), [groups]);

  const weekStart = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekStart(base);
  }, [weekOffset]);

  const weekEnd = useMemo(() => new Date(weekStart.getTime() + 7 * DAY_MS), [weekStart]);

  const sections = useMemo<DaySection[]>(() => {
    const weekStartMs = weekStart.getTime();
    const weekEndMs = weekEnd.getTime();

    const inWeek = todos.filter(
      (t: Todo) => t.dueAt != null && t.dueAt >= weekStartMs && t.dueAt < weekEndMs,
    );

    const byDay = new Map<number, Todo[]>();
    for (const t of inWeek) {
      const d = new Date(t.dueAt!);
      d.setHours(0, 0, 0, 0);
      const dayMs = d.getTime();
      const existing = byDay.get(dayMs);
      if (existing) {
        existing.push(t);
      } else {
        byDay.set(dayMs, [t]);
      }
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a - b)
      .map(([dayMs, dayTodos]) => ({
        dayMs,
        label: formatDayHeader(dayMs),
        todos: dayTodos.slice().sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0)),
      }));
  }, [todos, weekStart, weekEnd]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.navRow, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => setWeekOffset((o) => o - 1)}
          style={styles.navBtn}
          hitSlop={10}
          accessibilityLabel="Previous week"
        >
          <Text style={[styles.navArrow, { color: theme.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>{formatWeekRange(weekStart)}</Text>
        <Pressable
          onPress={() => setWeekOffset((o) => o + 1)}
          style={styles.navBtn}
          hitSlop={10}
          accessibilityLabel="Next week"
        >
          <Text style={[styles.navArrow, { color: theme.primary }]}>›</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 12 }]}>
        {sections.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No tasks this week</Text>
            <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
              Todos with a due date in this week will appear here.
            </Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.dayMs}>
              <Text style={[styles.dayHeader, { color: theme.textMuted }]}>{section.label}</Text>
              {section.todos.map((todo) => (
                <TodoListItem
                  key={todo.id}
                  todo={todo}
                  group={todo.groupId != null ? groupById.get(todo.groupId) : undefined}
                  onToggle={(t) => void toggleTodo(t.id, !t.isDone)}
                  onPress={(t) => router.push(`/todo/${t.id}`)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={() => setWeekOffset(0)}
          style={[styles.todayBtn, { borderColor: theme.border }]}
        >
          <Text style={{ color: theme.text }}>Today</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/todo/new')}
          style={[styles.fab, { backgroundColor: theme.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Add todo"
        >
          <Text style={[styles.fabText, { color: theme.primaryText }]}>＋ New</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: { paddingHorizontal: 8 },
  navArrow: { fontSize: 28, fontWeight: '300' },
  navTitle: { fontSize: 15, fontWeight: '600' },
  list: { padding: 12, flexGrow: 1 },
  dayHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  todayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fab: {
    marginLeft: 'auto',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  fabText: { fontSize: 16, fontWeight: '700' },
});
