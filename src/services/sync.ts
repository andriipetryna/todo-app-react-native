import { cancelScheduledNotification, syncTodoNotification } from '@/notifications/scheduler';
import { refreshWidget } from '@/widget/update';

/**
 * Side-effect orchestrator. After any data mutation the data store calls this to keep
 * the OS notification schedule and the home-screen widget snapshot in sync with the DB.
 * Centralizing it here keeps the repositories pure (DB only) per CLAUDE.md.
 */
export type DataChangeEvent =
  | { kind: 'todo-upserted'; todoId: number }
  | { kind: 'todo-removed'; notificationId: string | null }
  | { kind: 'groups-changed' };

export async function onDataChanged(event: DataChangeEvent): Promise<void> {
  switch (event.kind) {
    case 'todo-upserted':
      await syncTodoNotification(event.todoId);
      break;
    case 'todo-removed':
      if (event.notificationId) await cancelScheduledNotification(event.notificationId);
      break;
    case 'groups-changed':
      // Group color/name changes affect the widget rendering only.
      break;
  }

  // Every change can affect the upcoming list shown in the widget.
  await refreshWidget();
}
