/** Daily check-in helpers (Plan.md 2.7). Pure functions. */
import { addDays } from './calendar';
import type { Answer, DayKey, Habit, Reflection } from './types';

/** For 'quantity': reached the target = yes, something = partial, nothing = no. */
export function quantityResult(amount: number, target: number): Answer {
  if (amount >= target) return 'yes';
  return amount > 0 ? 'partial' : 'no';
}

/**
 * The if-then plan that applies to `day`: the plan set in the check-in of the
 * day before. Until the first check-in, the plan from the onboarding applies.
 */
export function intentionFor(
  day: DayKey,
  habit: Habit,
  reflections: readonly Reflection[],
): { if: string; then: string } | undefined {
  const own = reflections.filter((r) => r.habitId === habit.id);
  const previous = own.find((r) => r.day === addDays(day, -1));
  if (previous) return previous.nextIntention;
  return own.some((r) => r.day < day) ? undefined : habit.firstIntention;
}
