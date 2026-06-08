import { create } from 'zustand';

import { groupsRepository, settingsRepository, todosRepository } from '@/db/repositories';
import type { Group, Settings, Todo } from '@/db/schema';
import type { CreateGroupInput, UpdateGroupInput } from '@/db/repositories/groups';
import type { CreateTodoInput, UpdateTodoInput } from '@/db/repositories/todos';
import { onDataChanged } from '@/services/sync';

/**
 * Cached derived views of the on-device data plus the mutation actions the UI calls.
 * Reads go through the repositories; after every mutation we re-read so the cache
 * stays in sync, then fire `onDataChanged` for notification + widget side effects.
 */
interface DataState {
  groups: Group[];
  todos: Todo[];
  settings: Settings | null;
  loaded: boolean;

  /** Initial load — call once after the DB is initialized. */
  load: () => void;
  refresh: () => void;

  addTodo: (input: CreateTodoInput) => Promise<Todo>;
  editTodo: (id: number, patch: UpdateTodoInput) => Promise<Todo>;
  toggleTodo: (id: number, isDone: boolean) => Promise<Todo>;
  removeTodo: (id: number) => Promise<void>;

  addGroup: (input: CreateGroupInput) => Group;
  editGroup: (id: number, patch: UpdateGroupInput) => Group;
  removeGroup: (id: number) => void;

  setDefaultLeadMinutes: (minutes: number) => void;
}

function readAll(): Pick<DataState, 'groups' | 'todos' | 'settings'> {
  return {
    groups: groupsRepository.list(),
    todos: todosRepository.list({ includeDone: true }),
    settings: settingsRepository.get(),
  };
}

export const useDataStore = create<DataState>((set, get) => ({
  groups: [],
  todos: [],
  settings: null,
  loaded: false,

  load: () => set({ ...readAll(), loaded: true }),
  refresh: () => set(readAll()),

  addTodo: async (input) => {
    const todo = todosRepository.create(input);
    get().refresh();
    await onDataChanged({ kind: 'todo-upserted', todoId: todo.id });
    get().refresh();
    return get().todos.find((t) => t.id === todo.id) ?? todo;
  },

  editTodo: async (id, patch) => {
    const todo = todosRepository.update(id, patch);
    get().refresh();
    await onDataChanged({ kind: 'todo-upserted', todoId: todo.id });
    get().refresh();
    return get().todos.find((t) => t.id === id) ?? todo;
  },

  toggleTodo: async (id, isDone) => {
    const todo = todosRepository.setDone(id, isDone);
    get().refresh();
    await onDataChanged({ kind: 'todo-upserted', todoId: todo.id });
    get().refresh();
    return get().todos.find((t) => t.id === id) ?? todo;
  },

  removeTodo: async (id) => {
    const existing = todosRepository.get(id);
    todosRepository.remove(id);
    get().refresh();
    await onDataChanged({ kind: 'todo-removed', notificationId: existing?.notificationId ?? null });
    get().refresh();
  },

  addGroup: (input) => {
    const group = groupsRepository.create(input);
    get().refresh();
    void onDataChanged({ kind: 'groups-changed' });
    return group;
  },

  editGroup: (id, patch) => {
    const group = groupsRepository.update(id, patch);
    get().refresh();
    void onDataChanged({ kind: 'groups-changed' });
    return group;
  },

  removeGroup: (id) => {
    groupsRepository.remove(id);
    get().refresh();
    void onDataChanged({ kind: 'groups-changed' });
  },

  setDefaultLeadMinutes: (minutes) => {
    settingsRepository.update({ defaultLeadMinutes: minutes });
    get().refresh();
  },
}));
