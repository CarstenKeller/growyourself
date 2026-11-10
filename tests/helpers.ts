import { addDays } from '../src/domain/calendar';
import type { Answer, DayKey, Habit, HabitRecords } from '../src/domain/types';

/** Monday, 2026-01-05 (ISO week 2026-W02). */
export const MON = '2026-01-05';

export function habit(over: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    type: 'ritual',
    title: 'Tagesplanung',
    criterion: '5 Minuten Planung für morgen',
    compensation: '15 Minuten lesen',
    startDay: MON,
    seed: 42,
    createdAt: '2026-01-05T08:00:00.000Z',
    ...over,
  };
}

/** Local time on a day, e.g. at('2026-01-12', 10). */
export function at(day: DayKey, hour = 12, minute = 0): Date {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, hour, minute);
}

/** Builder for raw records. */
export class Records implements HabitRecords {
  days: HabitRecords['days'] = [];
  compensations: HabitRecords['compensations'] = [];
  srbai: HabitRecords['srbai'] = [];

  day(day: DayKey, result: Answer, amount?: number, habitId = 'h1'): this {
    this.days.push({ habitId, day, result, recordedAt: `${day}T20:00:00.000Z`, ...(amount !== undefined ? { amount } : {}) });
    return this;
  }

  /** Same answer for `count` consecutive days starting at `from`. */
  days_(from: DayKey, count: number, result: Answer = 'yes'): this {
    for (let i = 0; i < count; i++) this.day(addDays(from, i), result);
    return this;
  }

  comp(day: DayKey, habitId = 'h1'): this {
    this.compensations.push({ id: `c${this.compensations.length}`, habitId, day, recordedAt: `${day}T21:00:00.000Z` });
    return this;
  }

  srbaiAnswer(day: DayKey, items: number[], recordedAt = `${day}T20:00:00.000Z`, habitId = 'h1'): this {
    this.srbai.push({ id: `s${this.srbai.length}`, habitId, day, items, recordedAt });
    return this;
  }
}

export const week = (n: number): DayKey => addDays(MON, 7 * n);
