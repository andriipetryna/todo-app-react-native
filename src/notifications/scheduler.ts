import * as Notifications from 'expo-notifications';

import { settingsRepository, todosRepository } from '@/db/repositories';
import type { Todo } from '@/db/schema';
import { formatTime } from '@/lib/date';

import { ANDROID_CHANNEL_ID, ensureNotificationSetup } from './channel';
import { computeFireTimeForTodo } from './fireTime';

/**
 * Scheduling for a single todo. The fire-time math lives in fireTime.ts (pure, tested);
 * this module performs the OS side effects and persists the returned identifier so the
 * notification can be cancelled/rescheduled precisely (CLAUDE.md domain rules).
 */

function buildBody(todo: Todo): string {
  if (todo.dueAt == null) return 'Reminder';
  return `Due at ${formatTime(todo.dueAt)}`;
}

/** Cancel an OS-scheduled notification by identifier. Safe if it no longer exists. */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already gone (e.g. fired or cleared) — nothing to do.
  }
}

/**
 * Reconcile a todo's notification with its current state: cancel any existing one, then
 * (re)schedule if it is still pending, in the future, and permission is granted.
 * Returns the new OS identifier, or null if nothing was scheduled.
 */
export async function syncTodoNotification(todoId: number): Promise<string | null> {
  const todo = todosRepository.get(todoId);
  if (!todo) return null;

  // Always clear the previous schedule first so edits don't leave duplicates.
  if (todo.notificationId) {
    await cancelScheduledNotification(todo.notificationId);
    todosRepository.setNotificationId(todoId, null);
  }

  if (todo.isDone) return null;

  const { defaultLeadMinutes } = settingsRepository.get();
  const { fireAt, shouldSchedule } = computeFireTimeForTodo(todo, defaultLeadMinutes);
  if (!shouldSchedule || fireAt == null) return null;

  const granted = await ensureNotificationSetup();
  if (!granted) return null;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: todo.title,
      body: buildBody(todo),
      data: { todoId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: ANDROID_CHANNEL_ID,
    },
  });

  todosRepository.setNotificationId(todoId, identifier);
  return identifier;
}
