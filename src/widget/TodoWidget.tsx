import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { formatDueDateTime } from '@/lib/date';

import type { WidgetSnapshot, WidgetTodoItem } from './snapshot';

/**
 * JSX widget UI (react-native-android-widget). Renders purely from the snapshot — no DB
 * access here (CLAUDE.md gotcha). Taps deep-link into the app via expo-router routes
 * encoded as `todoapp://` URIs handled in the widget task handler.
 */

const DEEP_LINK_SCHEME = 'todoapp://';

function itemUri(id: number): string {
  return `${DEEP_LINK_SCHEME}todo/${id}`;
}

const ADD_URI = `${DEEP_LINK_SCHEME}todo/new`;
const OPEN_APP_URI = `${DEEP_LINK_SCHEME}`;

function Row({ item }: { item: WidgetTodoItem }): React.JSX.Element {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: itemUri(item.id) }}
      style={{
        flexDirection: 'column',
        width: 'match_parent',
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 4,
        borderRadius: 8,
        backgroundColor: '#ffffff',
      }}
    >
      <TextWidget
        text={item.title}
        maxLines={1}
        style={{ fontSize: 14, fontWeight: '600', color: '#0b1117' }}
      />
      <TextWidget
        text={
          (item.dueAt != null ? formatDueDateTime(item.dueAt) : 'No due date') +
          (item.groupName ? ` · ${item.groupName}` : '')
        }
        maxLines={1}
        style={{ fontSize: 11, color: '#57606a' }}
      />
    </FlexWidget>
  );
}

export function TodoWidget({ snapshot }: { snapshot: WidgetSnapshot }): React.JSX.Element {
  const { items } = snapshot;
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: OPEN_APP_URI }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#e6f4fe',
        borderRadius: 16,
        padding: 10,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <TextWidget text="Upcoming" style={{ fontSize: 13, fontWeight: '700', color: '#0b1117' }} />
        <TextWidget
          text="+ Add"
          clickAction="OPEN_URI"
          clickActionData={{ uri: ADD_URI }}
          style={{ fontSize: 13, fontWeight: '700', color: '#1f6feb' }}
        />
      </FlexWidget>

      {items.length === 0 ? (
        <TextWidget
          text="No upcoming todos"
          style={{ fontSize: 12, color: '#57606a', paddingVertical: 8 }}
        />
      ) : (
        items.map((item) => <Row key={item.id} item={item} />)
      )}
    </FlexWidget>
  );
}
