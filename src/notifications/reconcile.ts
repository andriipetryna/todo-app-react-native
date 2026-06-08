import * as Notifications from 'expo-notifications';

import { settingsRepository, todosRepository } from '@/db/repositories';

import { cancelScheduledNotification, syncTodoNotification } from './scheduler';
import { computeFireTimeForTodo } from './fireTime';

/**
 * On launch, re-sync the OS notification schedule with the DB. OS-scheduled
 * notifications can be lost on reboot or shifted by timezone changes (CLAUDE.md gotcha),
 * so we treat the DB as the source of truth and re-arm/cancel to match.
 */
export async function reconcileNotifications(now: number = Date.now()): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledIds = new Set(scheduled.map((n) => n.identifier));

  const todos = todosRepository.list({ includeDone: true });
  const { defaultLeadMinutes } = settingsRepository.get();

  // Cancel any OS notifications that no longer correspond to a pending, future todo.
  const validIds = new Set(
    todos
      .filter((t) => !t.isDone && t.notificationId)
      .filter((t) => computeFireTimeForTodo(t, defaultLeadMinutes, now).shouldSchedule)
      .map((t) => t.notificationId as string),
  );
  for (const id of scheduledIds) {
    if (!validIds.has(id)) await cancelScheduledNotification(id);
  }

  // Re-arm any pending future todo whose notification is missing or stale.
  for (const todo of todos) {
    if (todo.isDone) continue;
    const { shouldSchedule } = computeFireTimeForTodo(todo, defaultLeadMinutes, now);
    const isArmed = todo.notificationId != null && scheduledIds.has(todo.notificationId);
    if (shouldSchedule && !isArmed) {
      await syncTodoNotification(todo.id);
    } else if (!shouldSchedule && todo.notificationId) {
      // Past-due or otherwise unscheduleable — clear the stale identifier.
      await syncTodoNotification(todo.id);
    }
  }
}
