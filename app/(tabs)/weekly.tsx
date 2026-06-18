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
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekStart(base: Date): Date {
  const d = new Date(base);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayMidnight(): number {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t.getTime();
}

function computeWeekStart(offset: number): Date {
  const base = new Date();
  base.setDate(base.getDate() + offset * 7);
  return getWeekStart(base);
}

function snapToWeek(weekStartMs: number): number {
  const today = todayMidnight();
  return today >= weekStartMs && today < weekStartMs + 7 * DAY_MS ? today : weekStartMs;
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

function formatSelectedDayHeader(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

interface DayCell {
  dayMs: number;
  dayNum: number;
  name: string;
  todos: Todo[];
}

export default function WeeklyScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const todos = useDataStore((s) => s.todos);
  const groups = useDataStore((s) => s.groups);
  const toggleTodo = useDataStore((s) => s.toggleTodo);
  const groupById = useMemo(() => new Map(groups.map((g: Group) => [g.id, g])), [groups]);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayMs, setSelectedDayMs] = useState<number>(todayMidnight);

  const weekStart = useMemo(() => computeWeekStart(weekOffset), [weekOffset]);

  function navigateWeek(delta: number): void {
    const newOffset = weekOffset + delta;
    setWeekOffset(newOffset);
    setSelectedDayMs(snapToWeek(computeWeekStart(newOffset).getTime()));
  }

  function goToday(): void {
    setWeekOffset(0);
    setSelectedDayMs(todayMidnight());
  }

  const dayCells = useMemo<DayCell[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      const dayMs = d.getTime();
      const dayEnd = dayMs + DAY_MS;
      return {
        dayMs,
        dayNum: new Date(dayMs).getDate(),
        name: DAY_NAMES[i] ?? '',
        todos: todos
          .filter((t: Todo) => t.dueAt != null && t.dueAt >= dayMs && t.dueAt < dayEnd)
          .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0)),
      };
    });
  }, [weekStart, todos]);

  const selectedTodos = useMemo(
    () => dayCells.find((c) => c.dayMs === selectedDayMs)?.todos ?? [],
    [dayCells, selectedDayMs],
  );

  const today = todayMidnight();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Week navigation */}
      <View style={[styles.navRow, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => navigateWeek(-1)}
          style={styles.navBtn}
          hitSlop={10}
          accessibilityLabel="Previous week"
        >
          <Text style={[styles.navArrow, { color: theme.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>{formatWeekRange(weekStart)}</Text>
        <Pressable
          onPress={() => navigateWeek(1)}
          style={styles.navBtn}
          hitSlop={10}
          accessibilityLabel="Next week"
        >
          <Text style={[styles.navArrow, { color: theme.primary }]}>›</Text>
        </Pressable>
      </View>

      {/* 7-day strip */}
      <View
        style={[styles.strip, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
      >
        {dayCells.map((cell) => {
          const isToday = cell.dayMs === today;
          const isSelected = cell.dayMs === selectedDayMs;
          return (
            <Pressable
              key={cell.dayMs}
              style={[
                styles.dayCell,
                isSelected && { backgroundColor: theme.primary + '18', borderRadius: 12 },
              ]}
              onPress={() => setSelectedDayMs(cell.dayMs)}
              accessibilityRole="button"
              accessibilityLabel={`${cell.name} ${cell.dayNum}`}
            >
              <Text
                style={[styles.dayName, { color: isSelected ? theme.primary : theme.textMuted }]}
              >
                {cell.name}
              </Text>
              <View
                style={[
                  styles.dayNumCircle,
                  isSelected && {
                    backgroundColor: theme.primary,
                    borderRadius: 17,
                  },
                  isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    {
                      color: isSelected ? theme.primaryText : isToday ? theme.primary : theme.text,
                      zIndex: 50,
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
      <View style={[styles.dayLabelRow, { borderBottomColor: theme.border }]}>
        <Text style={[styles.dayLabel, { color: theme.text }]}>
          {formatSelectedDayHeader(selectedDayMs)}
        </Text>
      </View>

      {/* Todos for selected day — fills all remaining space */}
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
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No tasks</Text>
            <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
              No todos due on this day.
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
  strip: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dayName: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  dayNumCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { fontSize: 15, fontWeight: '600' },
  dayLabelRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayLabel: { fontSize: 14, fontWeight: '600' },
  list: { padding: 12, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
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
