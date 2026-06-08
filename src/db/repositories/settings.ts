import { eq } from 'drizzle-orm';

import { settings, type Settings } from '../schema';
import type { DrizzleDb } from '../types';

const SETTINGS_ID = 1;

export type UpdateSettingsInput = Partial<Pick<Settings, 'defaultLeadMinutes'>>;

export interface SettingsRepository {
  get(): Settings;
  update(patch: UpdateSettingsInput): Settings;
}

/**
 * Single-row settings access. The row (id = 1) is seeded in initializeDatabase();
 * `get()` falls back to seeding defensively in case it is called on a fresh DB.
 */
export function createSettingsRepository(db: DrizzleDb): SettingsRepository {
  function read(): Settings | undefined {
    return db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).get();
  }

  return {
    get() {
      const existing = read();
      if (existing) return existing;
      const row = db
        .insert(settings)
        .values({ id: SETTINGS_ID, defaultLeadMinutes: 30 })
        .onConflictDoNothing()
        .returning()
        .get();
      return row ?? read() ?? { id: SETTINGS_ID, defaultLeadMinutes: 30 };
    },

    update(patch) {
      const row = db
        .update(settings)
        .set(patch)
        .where(eq(settings.id, SETTINGS_ID))
        .returning()
        .get();
      if (!row) throw new Error('Settings row missing');
      return row;
    },
  };
}
