/**
 * Date/time helpers. `dueAt` and all timestamps are epoch milliseconds (UTC); these
 * helpers format for display in the device's local timezone (see CLAUDE.md domain rules).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Format a due timestamp for display, e.g. "Mon, 9 Jun · 14:30". */
export function formatDueDateTime(ms: number): string {
  const date = new Date(ms);
  const datePart = date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timePart = formatTime(ms);
  return `${datePart} · ${timePart}`;
}

/** Format just the time portion, e.g. "14:30". */
export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format just the date portion, e.g. "9 Jun 2026". */
export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Human relative label for a due time, computed against `now`. Returns things like
 * "Today", "Tomorrow", "Overdue", "In 3 days". Useful for list grouping/badges.
 */
export function relativeDueLabel(ms: number, now: number = Date.now()): string {
  if (ms < now) return 'Overdue';
  const days = Math.round((startOfLocalDay(ms) - startOfLocalDay(now)) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  return formatDate(ms);
}

export function isOverdue(ms: number | null | undefined, now: number = Date.now()): boolean {
  return ms != null && ms < now;
}

/**
 * Combine a date and a time (both Date objects) into a single epoch-ms timestamp,
 * taking the day from `datePart` and the hours/minutes from `timePart`. Used by the
 * create/edit form, which collects date and time separately.
 */
export function combineDateAndTime(datePart: Date, timePart: Date): number {
  const combined = new Date(datePart);
  combined.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return combined.getTime();
}
