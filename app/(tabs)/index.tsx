import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TodoListItem } from '@/components/TodoListItem';
import type { Group, Todo } from '@/db/schema';
import { PRIORITIES, PRIORITY_COLORS, PRIORITY_SECTION_TITLES } from '@/lib/priority';
import { useTheme } from '@/lib/theme';
import { useDataStore } from '@/store/dataStore';
import { useUiStore, type GroupFilter } from '@/store/uiStore';

interface PrioritySection {
  key: string;
  title: string;
  color: string;
  data: Todo[];
}

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const todos = useDataStore((s) => s.todos);
  const groups = useDataStore((s) => s.groups);
  const toggleTodo = useDataStore((s) => s.toggleTodo);

  const groupFilter = useUiStore((s) => s.groupFilter);
  const showCompleted = useUiStore((s) => s.showCompleted);
  const setGroupFilter = useUiStore((s) => s.setGroupFilter);
  const toggleShowCompleted = useUiStore((s) => s.toggleShowCompleted);

  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

  const sections = useMemo<PrioritySection[]>(() => {
    const filtered = todos
      .filter((t) => (showCompleted ? true : !t.isDone))
      .filter((t) => {
        if (groupFilter === 'all') return true;
        if (groupFilter === null) return t.groupId == null;
        return t.groupId === groupFilter;
      });

    return PRIORITIES.map((p) => ({
      key: p,
      title: PRIORITY_SECTION_TITLES[p],
      color: PRIORITY_COLORS[p],
      data: filtered.filter((t) => t.priority === p).sort(sortTodos),
    })).filter((s) => s.data.length > 0);
  }, [todos, groupFilter, showCompleted]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FilterBar
        groups={groups}
        groupFilter={groupFilter}
        showCompleted={showCompleted}
        onSelect={setGroupFilter}
        onToggleCompleted={toggleShowCompleted}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TodoListItem
            todo={item}
            group={item.groupId != null ? groupById.get(item.groupId) : undefined}
            onToggle={(t) => void toggleTodo(t.id, !t.isDone)}
            onPress={(t) => router.push(`/todo/${t.id}`)}
          />
        )}
        ListEmptyComponent={<EmptyState />}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={() => router.push('/groups')}
          style={[styles.secondaryBtn, { borderColor: theme.border }]}
        >
          <Text style={{ color: theme.text }}>Groups</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/settings')}
          style={[styles.secondaryBtn, { borderColor: theme.border }]}
        >
          <Text style={{ color: theme.text }}>Settings</Text>
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

function FilterBar({
  groups,
  groupFilter,
  showCompleted,
  onSelect,
  onToggleCompleted,
}: {
  groups: Group[];
  groupFilter: GroupFilter;
  showCompleted: boolean;
  onSelect: (f: GroupFilter) => void;
  onToggleCompleted: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const chips: { key: string; label: string; value: GroupFilter; color?: string }[] = [
    { key: 'all', label: 'All', value: 'all' },
    { key: 'none', label: 'Ungrouped', value: null },
    ...groups.map((g) => ({ key: `g${g.id}`, label: g.name, value: g.id, color: g.color })),
  ];

  return (
    <View style={{ borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {chips.map((chip) => {
          const active = chip.value === groupFilter;
          return (
            <Pressable
              key={chip.key}
              onPress={() => onSelect(chip.value)}
              style={[
                styles.chip,
                { borderColor: theme.border, backgroundColor: active ? theme.primary : theme.card },
              ]}
            >
              {chip.color ? (
                <View style={[styles.chipDot, { backgroundColor: chip.color }]} />
              ) : null}
              <Text style={{ color: active ? theme.primaryText : theme.text, fontSize: 13 }}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable onPress={onToggleCompleted} style={styles.completedToggle} hitSlop={8}>
        <Text style={{ color: theme.primary, fontSize: 13 }}>
          {showCompleted ? '✓ Showing completed' : 'Show completed'}
        </Text>
      </Pressable>
    </View>
  );
}

function EmptyState(): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing here yet</Text>
      <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
        {'Tap "＋ New" to add your first todo.'}
      </Text>
    </View>
  );
}

/** Done last; within a priority group, due items first (soonest first), then by creation. */
function sortTodos(a: Todo, b: Todo): number {
  if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
  if (a.dueAt != null && b.dueAt != null) return a.dueAt - b.dueAt;
  if (a.dueAt != null) return -1;
  if (b.dueAt != null) return 1;
  return b.createdAt - a.createdAt;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chips: { gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
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
  completedToggle: { paddingHorizontal: 14, paddingBottom: 10 },
  list: { padding: 12, flexGrow: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    marginTop: 4,
  },
  sectionDot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  secondaryBtn: {
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
