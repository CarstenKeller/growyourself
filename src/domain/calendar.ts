/**
 * Day boundary, ISO weeks, time zones.
 *
 * A DayKey is a plain local calendar date (YYYY-MM-DD). Arithmetic on DayKeys
 * is done in UTC so that daylight-saving changes can never shift a day.
 * Conversion from a point in time uses the device's local time zone.
 */
import { PARAMS } from './params';
import type { DayKey } from './types';

const MS_PER_DAY = 86_400_000;

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

function toUtcMs(day: DayKey): number {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): DayKey {
  const date = new Date(ms);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** True if the string is a valid YYYY-MM-DD calendar date. */
export function isDayKey(value: unknown): value is DayKey {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return fromUtcMs(toUtcMs(value)) === value;
}

/**
 * Local day for a point in time. Before the cutoff (default 03:00 local time)
 * it is still the previous day. Uses local wall-clock time, so the cutoff
 * stays at 03:00 across daylight-saving changes.
 */
export function dayKeyOf(
  instant: Date,
  cutoffHour: number = PARAMS.DAY_CUTOFF_HOUR,
  cutoffMinute: number = PARAMS.DAY_CUTOFF_MINUTE,
): DayKey {
  const localDay = `${pad(instant.getFullYear(), 4)}-${pad(instant.getMonth() + 1)}-${pad(instant.getDate())}`;
  const minutes = instant.getHours() * 60 + instant.getMinutes();
  return minutes < cutoffHour * 60 + cutoffMinute ? addDays(localDay, -1) : localDay;
}

export function addDays(day: DayKey, n: number): DayKey {
  return fromUtcMs(toUtcMs(day) + n * MS_PER_DAY);
}

/** Number of days from a to b (positive if b is later). */
export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / MS_PER_DAY);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(day: DayKey): number {
  const wd = new Date(toUtcMs(day)).getUTCDay();
  return wd === 0 ? 7 : wd;
}

/** Monday of the ISO week containing the day. */
export function weekStart(day: DayKey): DayKey {
  return addDays(day, 1 - isoWeekday(day));
}

/** Sunday of the ISO week containing the day. */
export function weekEnd(day: DayKey): DayKey {
  return addDays(weekStart(day), 6);
}

/** ISO week number and ISO week-numbering year, e.g. 2026-W01 starts on 2025-12-29. */
export function isoWeek(day: DayKey): { year: number; week: number } {
  // Thursday of the same week decides the year (ISO 8601).
  const thursday = addDays(weekStart(day), 3);
  const year = Number(thursday.slice(0, 4));
  const week = Math.floor(daysBetween(`${year}-01-01`, thursday) / 7) + 1;
  return { year, week };
}

/** Inclusive list of days from a to b (empty if b is before a). */
export function dayRange(a: DayKey, b: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let d = a; d <= b; d = addDays(d, 1)) out.push(d);
  return out;
}
