import AsyncStorage from '@react-native-async-storage/async-storage';

import { groupsRepository, todosRepository } from '@/db/repositories';

/**
 * Widget data snapshot. The widget renders in a headless task that cannot conveniently
 * share the app's live SQLite connection (CLAUDE.md gotcha), so we persist a compact
 * JSON snapshot on every todo/group change and the handler renders from it — it never
 * queries the DB directly.
 */

export const WIDGET_SNAPSHOT_KEY = 'widget:snapshot:v1';
export const SNAPSHOT_MAX_ITEMS = 10;

export interface WidgetTodoItem {
  id: number;
  title: string;
  dueAt: number | null;
  groupName: string | null;
  groupColor: string | null;
}

export interface WidgetSnapshot {
  updatedAt: number;
  items: WidgetTodoItem[];
}

/** Build the snapshot from current DB state (does not persist it). */
export function buildWidgetSnapshot(now: number = Date.now()): WidgetSnapshot {
  const groups = groupsRepository.list();
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const upcoming = todosRepository.listUpcoming({ now, limit: SNAPSHOT_MAX_ITEMS });

  return {
    updatedAt: now,
    items: upcoming.map((todo) => {
      const group = todo.groupId != null ? groupById.get(todo.groupId) : undefined;
      return {
        id: todo.id,
        title: todo.title,
        dueAt: todo.dueAt,
        groupName: group?.name ?? null,
        groupColor: group?.color ?? null,
      };
    }),
  };
}

/** Persist the snapshot so the widget handler can read it. */
export async function writeWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  await AsyncStorage.setItem(WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

/** Read the snapshot; returns an empty snapshot if none has been written yet. */
export async function readWidgetSnapshot(): Promise<WidgetSnapshot> {
  const raw = await AsyncStorage.getItem(WIDGET_SNAPSHOT_KEY);
  if (!raw) return { updatedAt: 0, items: [] };
  try {
    return JSON.parse(raw) as WidgetSnapshot;
  } catch {
    return { updatedAt: 0, items: [] };
  }
}
