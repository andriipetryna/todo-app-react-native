import { and, asc, desc, eq, gte, isNotNull, isNull, type SQL } from 'drizzle-orm';

import { todos, type Priority, type Todo } from '../schema';
import type { DrizzleDb } from '../types';

export interface CreateTodoInput {
  title: string;
  notes?: string | null;
  groupId?: number | null;
  dueAt?: number | null;
  notificationLeadMinutes?: number | null;
  priority?: Priority;
  sortOrder?: number;
}

export type UpdateTodoInput = Partial<
  Pick<
    Todo,
    'title' | 'notes' | 'groupId' | 'dueAt' | 'notificationLeadMinutes' | 'priority' | 'sortOrder'
  >
>;

export interface ListTodosOptions {
  includeDone?: boolean;
}

export interface UpcomingOptions {
  /** Reference time (epoch ms). Defaults to Date.now(). */
  now?: number;
  limit?: number;
}

export interface TodosRepository {
  list(options?: ListTodosOptions): Todo[];
  listByGroup(groupId: number | null, options?: ListTodosOptions): Todo[];
  listUpcoming(options?: UpcomingOptions): Todo[];
  get(id: number): Todo | undefined;
  create(input: CreateTodoInput): Todo;
  update(id: number, patch: UpdateTodoInput): Todo;
  setDone(id: number, isDone: boolean): Todo;
  setNotificationId(id: number, notificationId: string | null): Todo;
  remove(id: number): void;
}

/**
 * Todo data access. The notification *scheduling* side effects live in the service
 * layer (src/notifications), not here — repositories only touch the DB.
 */
export function createTodosRepository(db: DrizzleDb): TodosRepository {
  function requireRow(row: Todo | undefined, id: number): Todo {
    if (!row) throw new Error(`Todo ${id} not found`);
    return row;
  }

  return {
    list(options) {
      const where = options?.includeDone ? undefined : eq(todos.isDone, false);
      return db
        .select()
        .from(todos)
        .where(where)
        .orderBy(asc(todos.isDone), asc(todos.sortOrder), desc(todos.createdAt))
        .all();
    },

    listByGroup(groupId, options) {
      const filters: SQL[] = [
        groupId === null ? isNull(todos.groupId) : eq(todos.groupId, groupId),
      ];
      if (!options?.includeDone) filters.push(eq(todos.isDone, false));
      return db
        .select()
        .from(todos)
        .where(and(...filters))
        .orderBy(asc(todos.sortOrder), desc(todos.createdAt))
        .all();
    },

    listUpcoming(options) {
      const now = options?.now ?? Date.now();
      const query = db
        .select()
        .from(todos)
        .where(and(eq(todos.isDone, false), isNotNull(todos.dueAt), gte(todos.dueAt, now)))
        .orderBy(asc(todos.dueAt));
      const rows = options?.limit ? query.limit(options.limit).all() : query.all();
      return rows;
    },

    get(id) {
      return db.select().from(todos).where(eq(todos.id, id)).get();
    },

    create(input) {
      const row = db
        .insert(todos)
        .values({
          title: input.title,
          notes: input.notes ?? null,
          groupId: input.groupId ?? null,
          dueAt: input.dueAt ?? null,
          notificationLeadMinutes: input.notificationLeadMinutes ?? null,
          priority: input.priority ?? 'moderate',
          sortOrder: input.sortOrder ?? 0,
        })
        .returning()
        .get();
      if (!row) throw new Error('Failed to create todo');
      return row;
    },

    update(id, patch) {
      const row = db
        .update(todos)
        .set({ ...patch, updatedAt: Date.now() })
        .where(eq(todos.id, id))
        .returning()
        .get();
      return requireRow(row, id);
    },

    setDone(id, isDone) {
      const row = db
        .update(todos)
        .set({
          isDone,
          completedAt: isDone ? Date.now() : null,
          updatedAt: Date.now(),
        })
        .where(eq(todos.id, id))
        .returning()
        .get();
      return requireRow(row, id);
    },

    setNotificationId(id, notificationId) {
      const row = db
        .update(todos)
        .set({ notificationId, updatedAt: Date.now() })
        .where(eq(todos.id, id))
        .returning()
        .get();
      return requireRow(row, id);
    },

    remove(id) {
      db.delete(todos).where(eq(todos.id, id)).run();
    },
  };
}
