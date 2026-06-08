import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Local SQLite schema (Drizzle). Single-user, on-device only — no accounts, no sync.
 *
 * Timestamps are stored as epoch milliseconds (UTC) in INTEGER columns and formatted
 * in the device's local timezone at display time (see src/lib/date.ts).
 */

export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  /** Hex color string, e.g. "#1f6feb". */
  color: text('color').notNull().default('#1f6feb'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** Nullable FK -> groups.id. A todo has zero or one group. */
  groupId: integer('group_id').references(() => groups.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  notes: text('notes'),
  /** Full due timestamp (date + time) as epoch ms (UTC). Null = no due date. */
  dueAt: integer('due_at'),
  /** Per-todo lead time in minutes. Null = fall back to settings.defaultLeadMinutes. */
  notificationLeadMinutes: integer('notification_lead_minutes'),
  /** OS notification identifier so we can cancel / reschedule precisely. */
  notificationId: text('notification_id'),
  isDone: integer('is_done', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/**
 * Single-row settings table. We enforce a single row by always using id = 1.
 */
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  defaultLeadMinutes: integer('default_lead_minutes').notNull().default(30),
});

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type Settings = typeof settings.$inferSelect;
