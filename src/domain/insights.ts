/** Simple descriptive evaluation (Plan.md 2.8). Describes, never interprets. */
import { PARAMS } from './params';
import { isoWeekday } from './calendar';
import { isSuccess } from './rules';
import type { DayEntry, Habit, Obstacle, Reflection } from './types';

export interface Insights {
  checkIns: number;
  ready: boolean;
  /** Most frequent first; only obstacles that occurred. */
  obstacles: { obstacle: Obstacle; count: number }[];
  /** Index 0 = Monday … 6 = Sunday. */
  weekdays: { success: number; missed: number }[];
  intentions: { yes: number; partial: number; no: number };
}

export function computeInsights(habit: Habit, days: readonly DayEntry[], reflections: readonly Reflection[]): Insights {
  const own = days.filter((d) => d.habitId === habit.id);
  const ownRefl = reflections.filter((r) => r.habitId === habit.id);
  const counts = new Map<Obstacle, number>();
  for (const r of ownRefl) for (const o of r.obstacles) counts.set(o, (counts.get(o) ?? 0) + 1);
  const weekdays = Array.from({ length: 7 }, () => ({ success: 0, missed: 0 }));
  for (const d of own) {
    const slot = weekdays[isoWeekday(d.day) - 1] as { success: number; missed: number };
    if (isSuccess(habit, d)) slot.success++;
    else slot.missed++;
  }
  const intentions = { yes: 0, partial: 0, no: 0 };
  for (const r of ownRefl) if (r.intentionKept) intentions[r.intentionKept]++;
  return {
    checkIns: own.length,
    ready: own.length >= PARAMS.INSIGHTS_MIN_CHECKINS,
    obstacles: [...counts].map(([obstacle, count]) => ({ obstacle, count })).sort((a, b) => b.count - a.count),
    weekdays,
    intentions,
  };
}
