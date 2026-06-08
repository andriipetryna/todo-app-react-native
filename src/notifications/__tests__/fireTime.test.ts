import { computeFireTime, computeFireTimeForTodo } from '../fireTime';

const MIN = 60_000;

describe('computeFireTime', () => {
  const now = 1_000_000_000;

  it('subtracts the lead time from dueAt', () => {
    const result = computeFireTime({
      dueAt: now + 60 * MIN,
      leadMinutes: 30,
      defaultLeadMinutes: 10,
      now,
    });
    expect(result.shouldSchedule).toBe(true);
    expect(result.effectiveLeadMinutes).toBe(30);
    expect(result.fireAt).toBe(now + 60 * MIN - 30 * MIN);
  });

  it('falls back to the default lead time when per-todo lead is null', () => {
    const result = computeFireTime({
      dueAt: now + 60 * MIN,
      leadMinutes: null,
      defaultLeadMinutes: 15,
      now,
    });
    expect(result.effectiveLeadMinutes).toBe(15);
    expect(result.fireAt).toBe(now + 60 * MIN - 15 * MIN);
  });

  it('treats lead of 0 as fire exactly at due time', () => {
    const result = computeFireTime({
      dueAt: now + 10 * MIN,
      leadMinutes: 0,
      defaultLeadMinutes: 30,
      now,
    });
    expect(result.effectiveLeadMinutes).toBe(0);
    expect(result.fireAt).toBe(now + 10 * MIN);
  });

  it('does not schedule when there is no due date', () => {
    const result = computeFireTime({ dueAt: null, leadMinutes: 30, defaultLeadMinutes: 30, now });
    expect(result.shouldSchedule).toBe(false);
    expect(result.fireAt).toBeNull();
  });

  it('does not schedule when the fire time is in the past', () => {
    const result = computeFireTime({
      dueAt: now + 5 * MIN, // due soon, but lead pushes fire time before now
      leadMinutes: 30,
      defaultLeadMinutes: 30,
      now,
    });
    expect(result.shouldSchedule).toBe(false);
    expect(result.fireAt).toBeNull();
  });

  it('does not schedule when the due time itself is already past', () => {
    const result = computeFireTime({
      dueAt: now - MIN,
      leadMinutes: 0,
      defaultLeadMinutes: 30,
      now,
    });
    expect(result.shouldSchedule).toBe(false);
  });

  it('works from a Todo row via computeFireTimeForTodo', () => {
    const result = computeFireTimeForTodo(
      { dueAt: now + 120 * MIN, notificationLeadMinutes: null },
      45,
      now,
    );
    expect(result.fireAt).toBe(now + 120 * MIN - 45 * MIN);
  });
});
