import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TodoListItem } from '@/components/TodoListItem';
import type { Group, Priority, Todo } from '@/db/schema';
import { PRIORITY_COLORS } from '@/lib/priority';
import { useTheme } from '@/lib/theme';
import { useDataStore } from '@/store/dataStore';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CalendarCell {
  day: number | null;
  dayMs: number | null;
  todos: Todo[];
}

function buildCells(year: number, month: number, todos: Todo[]): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  // Monday-first: JS getDay() 0=Sun → remap to 0=Mon…6=Sun
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({ day: null, dayMs: null, todos: [] });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    const dayMs = date.getTime();
    const dayEndMs = dayMs + DAY_MS;
    const dayTodos = todos
      .filter((t) => t.dueAt != null && t.dueAt >= dayMs && t.dueAt < dayEndMs)
      .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
    cells.push({ day: d, dayMs, todos: dayTodos });
  }

  const trailing = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < trailing; i++) {
    cells.push({ day: null, dayMs: null, todos: [] });
  }

  return cells;
}

function todayMidnight(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatSelectedDayLabel(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function MonthlyScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDayMs, setSelectedDayMs] = useState<number | null>(todayMidnight);

  const todos = useDataStore((s) => s.todos);
  const groups = useDataStore((s) => s.groups);
  const toggleTodo = useDataStore((s) => s.toggleTodo);

  const groupById = useMemo(() => new Map(groups.map((g: Group) => [g.id, g])), [groups]);

  function prevMonth(): void {
    setSelectedDayMs(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth(): void {
    setSelectedDayMs(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToday(): void {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDayMs(todayMidnight());
  }

  const monthLabel = useMemo(
    () =>
      new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [year, month],
  );

  const cells = useMemo(() => buildCells(year, month, todos), [year, month, todos]);

  const todayMs = todayMidnight();

  const selectedTodos = useMemo(
    () =>
      selectedDayMs != null ? (cells.find((c) => c.dayMs === selectedDayMs)?.todos ?? []) : [],
    [cells, selectedDayMs],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Month navigation */}
      <View style={[styles.navRow, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={prevMonth}
          style={styles.navBtn}
          hitSlop={10}
          accessibilityLabel="Previous month"
        >
          <Text style={[styles.navArrow, { color: theme.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>{monthLabel}</Text>
        <Pressable
          onPress={nextMonth}
          style={styles.navBtn}
          hitSlop={10}
          accessibilityLabel="Next month"
        >
          <Text style={[styles.navArrow, { color: theme.primary }]}>›</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 70 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekday column headers */}
        <View style={styles.weekRow}>
          {WEEK_DAYS.map((wd) => (
            <Text key={wd} style={[styles.weekDayLabel, { color: theme.textMuted }]}>
              {wd}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={[styles.grid, { borderColor: theme.border }]}>
          {cells.map((cell, i) => {
            const isToday = cell.dayMs === todayMs;
            const isSelected = cell.dayMs != null && cell.dayMs === selectedDayMs;
            const dots = cell.todos.slice(0, 3);
            const overflow = cell.todos.length - 3;

            return (
              <Pressable
                key={i}
                disabled={cell.day == null}
                onPress={() => setSelectedDayMs(cell.dayMs)}
                style={[
                  styles.cell,
                  { borderColor: theme.border },
                  isSelected && { backgroundColor: theme.primary + '22' },
                ]}
                accessibilityLabel={cell.day != null ? `${cell.day} ${monthLabel}` : undefined}
              >
                {cell.day != null ? (
                  <>
                    <View
                      style={[
                        styles.dayNumberWrap,
                        isToday && { backgroundColor: theme.primary },
                        isSelected && !isToday && { borderColor: theme.primary, borderWidth: 1.5 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          { color: isToday ? theme.primaryText : theme.text },
                        ]}
                      >
                        {cell.day}
                      </Text>
                    </View>

                    {dots.length > 0 ? (
                      <View style={styles.dots}>
                        {dots.map((t, di) => (
                          <View
                            key={di}
                            style={[
                              styles.dot,
                              {
                                backgroundColor:
                                  PRIORITY_COLORS[t.priority as Priority] ??
                                  PRIORITY_COLORS.moderate,
                              },
                            ]}
                          />
                        ))}
                        {overflow > 0 ? (
                          <Text style={[styles.overflow, { color: theme.textMuted }]}>
                            +{overflow}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Selected day todos */}
        {selectedDayMs != null ? (
          <View style={styles.dayDetail}>
            <Text style={[styles.dayDetailTitle, { color: theme.text }]}>
              {formatSelectedDayLabel(selectedDayMs)}
            </Text>
            {selectedTodos.length === 0 ? (
              <Text style={[styles.dayDetailEmpty, { color: theme.textMuted }]}>
                No tasks scheduled
              </Text>
            ) : (
              selectedTodos.map((todo) => (
                <TodoListItem
                  key={todo.id}
                  todo={todo}
                  group={todo.groupId != null ? groupById.get(todo.groupId) : undefined}
                  onToggle={(t) => void toggleTodo(t.id, !t.isDone)}
                  onPress={(t) => router.push(`/todo/${t.id}`)}
                />
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 12,
            backgroundColor: theme.background,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Pressable onPress={goToday} style={[styles.todayBtn, { borderColor: theme.border }]}>
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
  scroll: { paddingTop: 8 },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  weekDayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 2,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
  dayNumberWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: { fontSize: 13, fontWeight: '500' },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  overflow: { fontSize: 8, fontWeight: '700' },
  dayDetail: { padding: 12, paddingTop: 16 },
  dayDetailTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  dayDetailEmpty: { fontSize: 14, paddingVertical: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
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
