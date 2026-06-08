import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Expo app configuration.
 *
 * NOTE: This is a local-only, single-user app — no network, no accounts (see CLAUDE.md).
 * Config plugins below wire up the native pieces we need: notifications, the date/time
 * picker, and the Android home-screen widget.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TODO',
  slug: 'todo-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'todoapp',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.todoapp.local',
  },
  android: {
    package: 'com.todoapp.local',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#E6F4FE',
    },
    // Android 13+ runtime notification permission is requested at runtime in
    // src/notifications/channel.ts; declaring it here ensures it is in the manifest.
    permissions: ['POST_NOTIFICATIONS', 'SCHEDULE_EXACT_ALARM', 'USE_EXACT_ALARM'],
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    [
      'expo-notifications',
      {
        // Use the default app icon for the notification small icon for now.
        color: '#1f6feb',
      },
    ],
    [
      'react-native-android-widget',
      {
        widgets: [
          {
            name: 'Todo',
            label: 'Upcoming TODOs',
            minWidth: '180dp',
            minHeight: '110dp',
            // 4x2 cells -> resizable
            targetCellWidth: 4,
            targetCellHeight: 2,
            description: 'Shows your upcoming todos',
            previewImage: './assets/icon.png',
            updatePeriodMillis: 1800000,
          },
        ],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
