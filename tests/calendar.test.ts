import { describe, expect, it } from 'vitest';
import {
  addDays, dayKeyOf, dayRange, daysBetween, isDayKey, isoWeek, isoWeekday, weekEnd, weekStart,
} from '../src/domain/calendar';

describe('calendar', () => {
  it('runs in Europe/Berlin for reproducible DST cases', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Europe/Berlin');
  });

  it('applies the 03:00 day cutoff', () => {
    expect(dayKeyOf(new Date(2026, 0, 12, 2, 59))).toBe('2026-01-11');
    expect(dayKeyOf(new Date(2026, 0, 12, 3, 0))).toBe('2026-01-12');
    expect(dayKeyOf(new Date(2026, 0, 1, 0, 30))).toBe('2025-12-31');
  });

  it('accepts a custom cutoff', () => {
    expect(dayKeyOf(new Date(2026, 0, 12, 4, 0), 4, 30)).toBe('2026-01-11');
    expect(dayKeyOf(new Date(2026, 0, 12, 4, 30), 4, 30)).toBe('2026-01-12');
  });

  it('keeps the cutoff at 03:00 local time across DST changes', () => {
    // 2026-03-29: clocks jump 02:00 -> 03:00 (CET -> CEST)
    expect(dayKeyOf(new Date('2026-03-29T00:30:00Z'))).toBe('2026-03-28'); // 01:30 CET
    expect(dayKeyOf(new Date('2026-03-29T01:00:00Z'))).toBe('2026-03-29'); // 03:00 CEST
    // 2026-10-25: clocks fall back 03:00 -> 02:00 (CEST -> CET); 02:30 occurs twice
    expect(dayKeyOf(new Date('2026-10-25T00:30:00Z'))).toBe('2026-10-24'); // 02:30 CEST
    expect(dayKeyOf(new Date('2026-10-25T01:30:00Z'))).toBe('2026-10-24'); // 02:30 CET
    expect(dayKeyOf(new Date('2026-10-25T02:00:00Z'))).toBe('2026-10-25'); // 03:00 CET
  });

  it('does day arithmetic independent of DST', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-10-25', -1)).toBe('2026-10-24');
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31);
    expect(daysBetween('2026-04-01', '2026-03-01')).toBe(-31);
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('computes ISO weeks', () => {
    expect(isoWeekday('2026-01-05')).toBe(1);
    expect(isoWeekday('2026-01-11')).toBe(7);
    expect(weekStart('2026-01-11')).toBe('2026-01-05');
    expect(weekEnd('2026-01-05')).toBe('2026-01-11');
    expect(weekStart('2026-01-01')).toBe('2025-12-29');
    expect(isoWeek('2026-01-01')).toEqual({ year: 2026, week: 1 });
    expect(isoWeek('2025-12-29')).toEqual({ year: 2026, week: 1 });
    expect(isoWeek('2027-01-01')).toEqual({ year: 2026, week: 53 });
    expect(isoWeek('2027-01-04')).toEqual({ year: 2027, week: 1 });
    expect(isoWeek('2026-11-10')).toEqual({ year: 2026, week: 46 });
  });

  it('validates day keys and builds ranges', () => {
    expect(isDayKey('2026-02-28')).toBe(true);
    expect(isDayKey('2026-02-30')).toBe(false);
    expect(isDayKey('2026-2-3')).toBe(false);
    expect(isDayKey(20260101)).toBe(false);
    expect(dayRange('2026-01-30', '2026-02-02')).toEqual(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02']);
    expect(dayRange('2026-01-02', '2026-01-01')).toEqual([]);
  });
});
