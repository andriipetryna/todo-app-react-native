import { createTestDb } from '../../testing/createTestDb';
import type { DrizzleDb } from '../../types';
import { createGroupsRepository, type GroupsRepository } from '../groups';
import { createSettingsRepository, type SettingsRepository } from '../settings';
import { createTodosRepository, type TodosRepository } from '../todos';

describe('repositories', () => {
  let db: DrizzleDb;
  let close: () => void;
  let groupsRepo: GroupsRepository;
  let todosRepo: TodosRepository;
  let settingsRepo: SettingsRepository;

  beforeEach(() => {
    ({ db, close } = createTestDb());
    groupsRepo = createGroupsRepository(db);
    todosRepo = createTodosRepository(db);
    settingsRepo = createSettingsRepository(db);
  });

  afterEach(() => close());

  describe('groups', () => {
    it('creates, lists, updates, and reads back a group', () => {
      const created = groupsRepo.create({ name: 'Work', color: '#ff0000' });
      expect(created.id).toBeGreaterThan(0);
      expect(created.name).toBe('Work');

      const updated = groupsRepo.update(created.id, { name: 'Office' });
      expect(updated.name).toBe('Office');

      expect(groupsRepo.list()).toHaveLength(1);
      expect(groupsRepo.get(created.id)?.name).toBe('Office');
    });

    it('orders groups by sortOrder then name', () => {
      groupsRepo.create({ name: 'B', sortOrder: 1 });
      groupsRepo.create({ name: 'A', sortOrder: 0 });
      expect(groupsRepo.list().map((g) => g.name)).toEqual(['A', 'B']);
    });
  });

  describe('todos', () => {
    it('creates a todo with defaults', () => {
      const todo = todosRepo.create({ title: 'Buy milk' });
      expect(todo.title).toBe('Buy milk');
      expect(todo.isDone).toBe(false);
      expect(todo.groupId).toBeNull();
      expect(todo.dueAt).toBeNull();
    });

    it('filters out done todos unless includeDone is set', () => {
      const a = todosRepo.create({ title: 'A' });
      todosRepo.create({ title: 'B' });
      todosRepo.setDone(a.id, true);

      expect(todosRepo.list().map((t) => t.title)).toEqual(['B']);
      expect(todosRepo.list({ includeDone: true })).toHaveLength(2);
    });

    it('toggles done and stamps completedAt', () => {
      const todo = todosRepo.create({ title: 'A' });
      const done = todosRepo.setDone(todo.id, true);
      expect(done.isDone).toBe(true);
      expect(done.completedAt).not.toBeNull();

      const undone = todosRepo.setDone(todo.id, false);
      expect(undone.isDone).toBe(false);
      expect(undone.completedAt).toBeNull();
    });

    it('lists todos by group and by ungrouped (null)', () => {
      const group = groupsRepo.create({ name: 'Work' });
      todosRepo.create({ title: 'In group', groupId: group.id });
      todosRepo.create({ title: 'Ungrouped' });

      expect(todosRepo.listByGroup(group.id).map((t) => t.title)).toEqual(['In group']);
      expect(todosRepo.listByGroup(null).map((t) => t.title)).toEqual(['Ungrouped']);
    });

    it('lists upcoming todos sorted by dueAt, excluding past and done', () => {
      const now = 1_000_000;
      todosRepo.create({ title: 'past', dueAt: now - 5000 });
      todosRepo.create({ title: 'soon', dueAt: now + 1000 });
      todosRepo.create({ title: 'later', dueAt: now + 5000 });
      const noDue = todosRepo.create({ title: 'no-due' });
      todosRepo.setDone(noDue.id, true);

      const upcoming = todosRepo.listUpcoming({ now });
      expect(upcoming.map((t) => t.title)).toEqual(['soon', 'later']);
    });

    it('honors the upcoming limit', () => {
      const now = 0;
      for (let i = 1; i <= 5; i++) todosRepo.create({ title: `t${i}`, dueAt: now + i * 1000 });
      expect(todosRepo.listUpcoming({ now, limit: 2 })).toHaveLength(2);
    });

    it('stores the OS notification id', () => {
      const todo = todosRepo.create({ title: 'A', dueAt: Date.now() + 100000 });
      const updated = todosRepo.setNotificationId(todo.id, 'os-id-123');
      expect(updated.notificationId).toBe('os-id-123');
      expect(todosRepo.setNotificationId(todo.id, null).notificationId).toBeNull();
    });

    it('deletes a todo', () => {
      const todo = todosRepo.create({ title: 'A' });
      todosRepo.remove(todo.id);
      expect(todosRepo.get(todo.id)).toBeUndefined();
    });

    it('sets group to null when its group is deleted (FK ON DELETE SET NULL)', () => {
      const group = groupsRepo.create({ name: 'Work' });
      const todo = todosRepo.create({ title: 'A', groupId: group.id });
      groupsRepo.remove(group.id);
      expect(todosRepo.get(todo.id)?.groupId).toBeNull();
    });
  });

  describe('settings', () => {
    it('returns a default settings row and updates it', () => {
      const initial = settingsRepo.get();
      expect(initial.defaultLeadMinutes).toBe(30);

      const updated = settingsRepo.update({ defaultLeadMinutes: 60 });
      expect(updated.defaultLeadMinutes).toBe(60);
      expect(settingsRepo.get().defaultLeadMinutes).toBe(60);
    });
  });
});
