import { asc, eq } from 'drizzle-orm';

import { groups, type Group } from '../schema';
import type { DrizzleDb } from '../types';

export interface CreateGroupInput {
  name: string;
  color?: string;
  sortOrder?: number;
}

export type UpdateGroupInput = Partial<Pick<Group, 'name' | 'color' | 'sortOrder'>>;

export interface GroupsRepository {
  list(): Group[];
  get(id: number): Group | undefined;
  create(input: CreateGroupInput): Group;
  update(id: number, patch: UpdateGroupInput): Group;
  remove(id: number): void;
}

/**
 * Group (list) data access. Deleting a group does NOT delete its todos — the FK is
 * `ON DELETE SET NULL`, so those todos become ungrouped (see CLAUDE.md / Phase 2).
 */
export function createGroupsRepository(db: DrizzleDb): GroupsRepository {
  return {
    list() {
      return db.select().from(groups).orderBy(asc(groups.sortOrder), asc(groups.name)).all();
    },

    get(id) {
      return db.select().from(groups).where(eq(groups.id, id)).get();
    },

    create(input) {
      const row = db
        .insert(groups)
        .values({
          name: input.name,
          color: input.color,
          sortOrder: input.sortOrder ?? 0,
        })
        .returning()
        .get();
      if (!row) throw new Error('Failed to create group');
      return row;
    },

    update(id, patch) {
      const row = db.update(groups).set(patch).where(eq(groups.id, id)).returning().get();
      if (!row) throw new Error(`Group ${id} not found`);
      return row;
    },

    remove(id) {
      db.delete(groups).where(eq(groups.id, id)).run();
    },
  };
}
