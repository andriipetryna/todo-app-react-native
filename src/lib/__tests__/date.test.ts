import { combineDateAndTime, isOverdue, relativeDueLabel } from '../date';

describe('date helpers', () => {
  describe('combineDateAndTime', () => {
    it('takes the day from the date part and the time from the time part', () => {
      const datePart = new Date(2026, 5, 9, 8, 0, 0); // 9 Jun 2026, 08:00
      const timePart = new Date(2000, 0, 1, 14, 30, 0); // time 14:30
      const result = new Date(combineDateAndTime(datePart, timePart));
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(9);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe('isOverdue', () => {
    const now = 1_000_000;
    it('is false for null/undefined', () => {
      expect(isOverdue(null, now)).toBe(false);
      expect(isOverdue(undefined, now)).toBe(false);
    });
    it('is true for past timestamps', () => {
      expect(isOverdue(now - 1, now)).toBe(true);
    });
    it('is false for future timestamps', () => {
      expect(isOverdue(now + 1, now)).toBe(false);
    });
  });

  describe('relativeDueLabel', () => {
    it('labels past as Overdue', () => {
      const now = new Date(2026, 5, 9, 12, 0, 0).getTime();
      expect(relativeDueLabel(now - 1000, now)).toBe('Overdue');
    });
    it('labels same day as Today', () => {
      const now = new Date(2026, 5, 9, 8, 0, 0).getTime();
      const later = new Date(2026, 5, 9, 20, 0, 0).getTime();
      expect(relativeDueLabel(later, now)).toBe('Today');
    });
    it('labels next day as Tomorrow', () => {
      const now = new Date(2026, 5, 9, 8, 0, 0).getTime();
      const tomorrow = new Date(2026, 5, 10, 9, 0, 0).getTime();
      expect(relativeDueLabel(tomorrow, now)).toBe('Tomorrow');
    });
    it('labels within a week as In N days', () => {
      const now = new Date(2026, 5, 9, 8, 0, 0).getTime();
      const threeDays = new Date(2026, 5, 12, 9, 0, 0).getTime();
      expect(relativeDueLabel(threeDays, now)).toBe('In 3 days');
    });
  });
});
