import type { Todo } from '@/db/schema';

/**
 * Pure fire-time calculation, isolated from expo-notifications so it can be unit
 * tested without native modules. The scheduler consumes this.
 *
 * Rules (CLAUDE.md domain rules):
 *  - effective lead = todo.notificationLeadMinutes ?? settings default
 *  - fire time = dueAt - leadMinutes
 *  - do not schedule if there is no dueAt, or the fire time is already in the past
 */

export interface FireTimeResult {
  /** Epoch ms at which the notification should fire, or null if it should not. */
  fireAt: number | null;
  shouldSchedule: boolean;
  /** The lead time actually used (after applying the default fallback). */
  effectiveLeadMinutes: number;
}

export interface FireTimeInput {
  dueAt: number | null | undefined;
  leadMinutes: number | null | undefined;
  defaultLeadMinutes: number;
  now?: number;
}

export function computeFireTime({
  dueAt,
  leadMinutes,
  defaultLeadMinutes,
  now = Date.now(),
}: FireTimeInput): FireTimeResult {
  const effectiveLeadMinutes = leadMinutes ?? defaultLeadMinutes;

  if (dueAt == null) {
    return { fireAt: null, shouldSchedule: false, effectiveLeadMinutes };
  }

  const fireAt = dueAt - effectiveLeadMinutes * 60_000;
  const shouldSchedule = fireAt > now;

  return { fireAt: shouldSchedule ? fireAt : null, shouldSchedule, effectiveLeadMinutes };
}

/** Convenience wrapper for a Todo row. */
export function computeFireTimeForTodo(
  todo: Pick<Todo, 'dueAt' | 'notificationLeadMinutes'>,
  defaultLeadMinutes: number,
  now: number = Date.now(),
): FireTimeResult {
  return computeFireTime({
    dueAt: todo.dueAt,
    leadMinutes: todo.notificationLeadMinutes,
    defaultLeadMinutes,
    now,
  });
}
