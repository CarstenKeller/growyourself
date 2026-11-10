/** Weekly review and weekend hint (Plan.md Phase 6). Pure functions. */
import { isoWeekday } from './calendar';
import type { DayKey, TreeState, WeekSummary } from './types';

/** The latest settled week, if it has not been shown yet. Shown exactly once per week. */
export function weeklyReviewDue(state: TreeState, lastReviewedWeek: DayKey | undefined): WeekSummary | undefined {
  const last = state.weeks.filter((w) => w.settled).at(-1);
  if (!last || (lastReviewedWeek !== undefined && last.weekStart <= lastReviewedWeek)) return undefined;
  return last;
}

/** Open compensation units to remind of on Saturday and Sunday; 0 otherwise. */
export function weekendOpenUnits(state: TreeState): number {
  return isoWeekday(state.today) >= 6 ? state.openUnits : 0;
}
