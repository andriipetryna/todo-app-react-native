import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Android notification channel + runtime permission setup.
 *
 * Gotchas (CLAUDE.md): the channel must exist or Android silently drops notifications,
 * and Android 13+ requires the POST_NOTIFICATIONS runtime permission before scheduling.
 */

export const ANDROID_CHANNEL_ID = 'todo-reminders';

let channelReady = false;

/** Configure how notifications are presented while the app is foregrounded. */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Create the Android channel. Idempotent; safe to call on every launch. */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Todo reminders',
      importance: Notifications.AndroidImportance.HIGH,

      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  channelReady = true;
}

/** Request notification permission, returning whether it is granted. */
export async function requestNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Ensure the channel exists and permission is granted before scheduling. Returns false
 * if the user has not granted permission (callers must skip scheduling in that case).
 */
export async function ensureNotificationSetup(): Promise<boolean> {
  if (!channelReady) await setupNotificationChannel();
  return requestNotificationPermissions();
}
