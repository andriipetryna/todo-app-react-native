import React from 'react';
import { Linking } from 'react-native';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { readWidgetSnapshot } from './snapshot';
import { classifySize, deleteWidgetSize, maxItemsForSizeClass, writeWidgetSize } from './sizeCache';
import { TodoWidget } from './TodoWidget';

/**
 * Widget task handler — runs in a headless JS task. It renders the widget from the
 * persisted snapshot (never the DB) and routes taps to expo-router deep links.
 *
 * Registered in app.config-level entry via registerWidgetTaskHandler (see index/widget
 * registration in app/_layout or a dedicated entry).
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const { widgetId, width, height } = props.widgetInfo;
      const dims = { widthDp: width, heightDp: height };
      await writeWidgetSize(widgetId, dims);

      const sizeClass = classifySize(dims);
      const snapshot = await readWidgetSnapshot();
      const items = snapshot.items.slice(0, maxItemsForSizeClass(sizeClass));

      props.renderWidget(<TodoWidget snapshot={{ ...snapshot, items }} sizeClass={sizeClass} />);
      break;
    }
    case 'WIDGET_DELETED': {
      await deleteWidgetSize(props.widgetInfo.widgetId);
      break;
    }
    case 'WIDGET_CLICK': {
      const uri = props.clickActionData?.uri;
      if (props.clickAction === 'OPEN_URI' && typeof uri === 'string') {
        await Linking.openURL(uri);
      }
      break;
    }
    default:
      break;
  }
}
