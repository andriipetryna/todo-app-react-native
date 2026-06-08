import { db } from '../client';
import { createGroupsRepository } from './groups';
import { createSettingsRepository } from './settings';
import { createTodosRepository } from './todos';

/**
 * App-wide repository singletons, bound to the shared expo-sqlite connection.
 * UI / notification / widget code imports these — never raw SQL or the `db` handle.
 */
export const groupsRepository = createGroupsRepository(db);
export const todosRepository = createTodosRepository(db);
export const settingsRepository = createSettingsRepository(db);

export { createGroupsRepository, createSettingsRepository, createTodosRepository };
export type { GroupsRepository } from './groups';
export type { TodosRepository } from './todos';
export type { SettingsRepository } from './settings';
