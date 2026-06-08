import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from '../schema';
import type { DrizzleDb } from '../types';

/**
 * Build an in-memory SQLite DB for tests by executing the generated Drizzle migration
 * SQL. This exercises the same schema the app ships, against a real (node) SQLite
 * engine via better-sqlite3 — no native expo-sqlite needed.
 *
 * Test-only utility. Never imported by app code.
 */
export function createTestDb(): { db: DrizzleDb; close: () => void } {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');

  const migrationPath = join(__dirname, '..', 'migrations', '0000_init.sql');
  const migrationSql = readFileSync(migrationPath, 'utf8');
  for (const statement of migrationSql.split('--> statement-breakpoint')) {
    const trimmed = statement.trim();
    if (trimmed.length > 0) sqlite.exec(trimmed);
  }

  // better-sqlite3 and expo-sqlite are both synchronous drivers, so the resulting
  // database satisfies the shared DrizzleDb type used by repositories.
  const db = drizzle(sqlite, { schema }) as unknown as DrizzleDb;
  return { db, close: () => sqlite.close() };
}
