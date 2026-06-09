import type { Priority } from '@/db/schema';

export const PRIORITIES: Priority[] = ['top', 'high', 'moderate', 'low'];

export const PRIORITY_LABELS: Record<Priority, string> = {
  top: 'Top',
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
};

export const PRIORITY_SECTION_TITLES: Record<Priority, string> = {
  top: 'Top Priority',
  high: 'High Priority',
  moderate: 'Moderate Priority',
  low: 'Low Priority',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  top: '#e53e3e',
  high: '#ed8936',
  moderate: '#3182ce',
  low: '#718096',
};
