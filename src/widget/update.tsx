import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { buildWidgetSnapshot, writeWidgetSnapshot } from './snapshot';
import { TodoWidget } from './TodoWidget';

/**
 * Rebuild the snapshot from the DB, persist it, and ask Android to re-render the widget.
 * Called after every todo/group change (via the sync service). No-op off Android.
 */
export async function refreshWidget(now: number = Date.now()): Promise<void> {
  const snapshot = buildWidgetSnapshot(now);
  await writeWidgetSnapshot(snapshot);

  if (Platform.OS !== 'android') return;

  await requestWidgetUpdate({
    widgetName: 'Todo',
    renderWidget: () => <TodoWidget snapshot={snapshot} sizeClass="medium" />,
    widgetNotFound: () => {
      // No widget instance on the home screen yet — nothing to update.
    },
  });
}
