import { initializeDatabase } from '@/db/client';
import { configureNotificationHandler, setupNotificationChannel } from '@/notifications/channel';
import { reconcileNotifications } from '@/notifications/reconcile';
import { useDataStore } from '@/store/dataStore';
import { refreshWidget } from '@/widget/update';

/**
 * One-time app startup sequence. Order matters:
 *  1. migrate + seed the DB,
 *  2. load cached data into the store,
 *  3. set up notifications and reconcile the OS schedule against the DB,
 *  4. refresh the widget snapshot.
 *
 * Notification permission is NOT requested here — we ask lazily the first time a todo
 * actually needs scheduling (see scheduler/channel), so launching never nags the user.
 */
export async function bootstrap(): Promise<void> {
  await initializeDatabase();
  useDataStore.getState().load();

  configureNotificationHandler();
  await setupNotificationChannel();

  // Reconcile can schedule, which lazily requests permission; that's acceptable on
  // launch only when there is already pending work to (re)arm.
  await reconcileNotifications();
  await refreshWidget();
}
