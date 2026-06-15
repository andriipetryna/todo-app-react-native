import AsyncStorage from '@react-native-async-storage/async-storage';

export type WidgetSizeClass = 'small' | 'medium' | 'large';

export interface WidgetDimensions {
  widthDp: number;
  heightDp: number;
}

// Thresholds based on typical Android launcher grid cell ≈ 73dp.
// Small:  fits in ≤3 cols OR ≤2 rows  → compact single-line rows, no header
// Large:  ≥5.5 cols AND ≥3 rows       → expanded view with up to 10 items
// Medium: everything in between
const SMALL_WIDTH_DP = 250;
const SMALL_HEIGHT_DP = 150;
const LARGE_WIDTH_DP = 400;
const LARGE_HEIGHT_DP = 220;

export function classifySize(dims: WidgetDimensions): WidgetSizeClass {
  if (dims.widthDp < SMALL_WIDTH_DP || dims.heightDp < SMALL_HEIGHT_DP) return 'small';
  if (dims.widthDp >= LARGE_WIDTH_DP && dims.heightDp >= LARGE_HEIGHT_DP) return 'large';
  return 'medium';
}

export function maxItemsForSizeClass(sizeClass: WidgetSizeClass): number {
  switch (sizeClass) {
    case 'small':
      return 2;
    case 'medium':
      return 5;
    case 'large':
      return 10;
  }
}

function sizeKey(widgetId: number): string {
  return `widget:size:${widgetId}`;
}

export async function writeWidgetSize(widgetId: number, dims: WidgetDimensions): Promise<void> {
  await AsyncStorage.setItem(sizeKey(widgetId), JSON.stringify(dims));
}

export async function readWidgetSize(widgetId: number): Promise<WidgetDimensions | null> {
  const raw = await AsyncStorage.getItem(sizeKey(widgetId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WidgetDimensions;
  } catch {
    return null;
  }
}

export async function deleteWidgetSize(widgetId: number): Promise<void> {
  await AsyncStorage.removeItem(sizeKey(widgetId));
}
