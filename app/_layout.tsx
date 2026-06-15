import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { bootstrap } from '@/services/bootstrap';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout(): React.JSX.Element | null {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    bootstrap()
      .catch((err) => console.error('Bootstrap failed', err))
      .finally(() => {
        if (!cancelled) setReady(true);
        void SplashScreen.hideAsync();
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Tapping a notification deep-links to the relevant todo.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const todoId = response.notification.request.content.data?.todoId;
      if (typeof todoId === 'number') {
        router.push(`/todo/${todoId}`);
      }
    });
    return () => sub.remove();
  }, [router]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: true }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="todo/[id]" options={{ title: 'Edit', presentation: 'modal' }} />
          <Stack.Screen name="groups" options={{ title: 'Groups', presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
