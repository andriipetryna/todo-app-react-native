import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingButton } from '@/components/FloatingButton';
import { TodoListItem } from '@/components/TodoListItem';
import type { Group, Todo } from '@/db/schema';
import { useTheme } from '@/lib/theme';
import { useDataStore } from '@/store/dataStore';
import { CalendarDayTodoDots } from '@/components/CalendarDayTodoDots';

const DAY_MS = 24 * 60 * 60 * 1000;
const COL_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function todayMidnight(): number {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t.getTime();
}

/** JS getDay() is 0=Sun; convert to 0=Mon…6=Sun. */
function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function formatSelectedDayHeader(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

interface GridCell {
  dayMs: number | null;
  dayNum: number;
  todos: Todo[];
}

export default function MonthlyScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDayMs, setSelectedDayMs] = useState<number | null>(() => todayMidnight());

  const todos = useDataStore((s) => s.todos);
  const groups = useDataStore((s) => s.groups);
  const toggleTodo = useDataStore((s) => s.toggleTodo);
  const groupById = useMemo(() => new Map(groups.map((g: Group) => [g.id, g])), [groups]);

  function prevMonth(): void {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDayMs(null);
  }

  function nextMonth(): void {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDayMs(null);
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

  const grid = useMemo<GridCell[]>(() => {
    const firstDay = new Date(year, month, 1);
    const leadingEmpties = isoWeekday(firstDay);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: GridCell[] = [];

    for (let i = 0; i < leadingEmpties; i++) {
      cells.push({ dayMs: null, dayNum: 0, todos: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayMs = new Date(year, month, d, 0, 0, 0, 0).getTime();
      const dayEnd = dayMs + DAY_MS;
      cells.push({
        dayMs,
        dayNum: d,
        todos: todos
          .filter((t: Todo) => t.dueAt != null && t.dueAt >= dayMs && t.dueAt < dayEnd)
          .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0)),
      });
    }

    const remainder = cells.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push({ dayMs: null, dayNum: 0, todos: [] });
      }
    }

    return cells;
  }, [year, month, todos]);

  const selectedTodos = useMemo(() => {
    if (selectedDayMs == null) return [];
    return grid.find((c) => c.dayMs === selectedDayMs)?.todos ?? [];
  }, [grid, selectedDayMs]);

  const today = todayMidnight();

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

      {/* Day-of-week column headers */}
      <View
        style={[
          styles.colHeaders,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        {COL_NAMES.map((name) => (
          <Text key={name} style={[styles.colName, { color: theme.textMuted }]}>
            {name}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={[styles.grid, { borderBottomColor: theme.border }]}>
        {grid.map((cell, idx) => {
          if (cell.dayMs == null) {
            return <View key={`pad-${idx}`} style={styles.cell} />;
          }
          const isToday = cell.dayMs === today;
          const isSelected = cell.dayMs === selectedDayMs;
          return (
            <Pressable
              key={cell.dayMs}
              style={styles.cell}
              onPress={() => setSelectedDayMs(cell.dayMs)}
              accessibilityRole="button"
              accessibilityLabel={`Day ${cell.dayNum}`}
            >
              <View
                style={[
                  styles.dayNumCircle,
                  isSelected && { backgroundColor: theme.primary, borderRadius: 17 },
                  isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    {
                      color: isSelected ? theme.primaryText : isToday ? theme.primary : theme.text,
                    },
                  ]}
                >
                  {cell.dayNum}
                </Text>
              </View>
              <CalendarDayTodoDots todos={cell.todos} />
            </Pressable>
          );
        })}
      </View>

      {/* Selected day label */}
      {selectedDayMs != null ? (
        <View style={[styles.dayLabelRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.dayLabel, { color: theme.text }]}>
            {formatSelectedDayHeader(selectedDayMs)}
          </Text>
        </View>
      ) : null}

      {/* Todos for selected day — fills remaining space */}
      <FlatList
        data={selectedTodos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 8 }]}
        renderItem={({ item }) => (
          <TodoListItem
            todo={item}
            group={item.groupId != null ? groupById.get(item.groupId) : undefined}
            onToggle={(t) => void toggleTodo(t.id, !t.isDone)}
            onPress={(t) => router.push(`/todo/${t.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
              {selectedDayMs == null ? 'Tap a day to see tasks.' : 'No todos due on this day.'}
            </Text>
          </View>
        }
      />

      <View
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          alignItems: 'center',
          gap: 10,
        }}
      >
        <FloatingButton
          onPress={goToday}
          style={[styles.goTodayBtn, { borderColor: theme.primary }]}
          accessibilityLabel="Go to today"
        >
          <Text style={{ color: theme.primary, fontSize: 15, fontWeight: '700' }}>
            {new Date().getDate()}
          </Text>
        </FloatingButton>
        <FloatingButton
          onPress={() => router.push('/todo/new')}
          style={{ position: 'relative', bottom: 0, right: 0 }}
          accessibilityLabel="Add todo"
        >
          <Text style={{ color: theme.primaryText, fontSize: 28, fontWeight: '700' }}>＋</Text>
        </FloatingButton>
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
  colHeaders: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
  },
  cell: {
    width: '14.2857%',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  dayNumCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { fontSize: 14, fontWeight: '500' },
  dayLabelRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayLabel: { fontSize: 14, fontWeight: '600' },
  list: { padding: 12, flexGrow: 1 },
  empty: { paddingTop: 40, alignItems: 'center' },
  goTodayBtn: {
    position: 'relative',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
});
