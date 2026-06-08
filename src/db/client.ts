import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite';

import migrations from './migrations/migrations';
import * as schema from './schema';
import type { DrizzleDb } from './types';

export const DATABASE_NAME = 'todo.db';

// Single shared connection for the whole app. `enableChangeListener` lets us react to
// data changes (used by the live query hooks in the UI layer).
const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

// Enforce FK constraints (off by default in SQLite) so `ON DELETE SET NULL` works.
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db: DrizzleDb = drizzle(expoDb, { schema });

/** Expose the raw expo-sqlite handle for the reactive-query hook. */
export const sqliteDb = expoDb;

let migrationsApplied = false;

/**
 * Run pending migrations and seed the single settings row. Idempotent — safe to call
 * on every launch. Call this once during app startup before any repository access.
 */
export async function initializeDatabase(): Promise<void> {
  if (migrationsApplied) return;
  await migrate(db, migrations);
  await seedSettings();
  migrationsApplied = true;
}

async function seedSettings(): Promise<void> {
  // Ensure the single settings row (id = 1) exists; ignore if already present.
  await db.insert(schema.settings).values({ id: 1, defaultLeadMinutes: 30 }).onConflictDoNothing();
}
