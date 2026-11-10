/**
 * Creating a habit (Phase 3). Pure functions, no DOM, no storage.
 */
import { dayKeyOf } from './calendar';
import { PARAMS } from './params';
import type { Habit, HabitType } from './types';

/** What the onboarding form collects. Strings are raw user input. */
export interface HabitDraft {
  type: HabitType;
  title: string;
  /** Not used for 'quantity' (target + unit describe the criterion). */
  criterion: string;
  /** 'quantity' only; raw input, e.g. "8.000" or "8000". */
  target: string;
  unit: string;
  compensation: string;
  intentionIf: string;
  intentionThen: string;
}

export type DraftError =
  | 'titleMissing'
  | 'criterionMissing'
  | 'targetInvalid'
  | 'unitMissing'
  | 'compensationMissing'
  | 'intentionIncomplete'
  | 'tooLong';

/** Parses "8000", "8.000", "8 000", "2,5" (German decimal comma) or "2.5". */
export function parseAmount(raw: string): number | undefined {
  const s = raw.trim().replace(/\s/g, '');
  if (!/^\d+([.,]\d+)*$/.test(s)) return undefined;
  // "8.000" / "1.234.567": dots as thousands separators; otherwise a single separator is decimal.
  const normalized = /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s.replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function validateDraft(d: HabitDraft): DraftError[] {
  const errors: DraftError[] = [];
  const t = (v: string) => v.trim();
  if (!t(d.title)) errors.push('titleMissing');
  if (d.type === 'quantity') {
    if (parseAmount(d.target) === undefined) errors.push('targetInvalid');
    if (!t(d.unit)) errors.push('unitMissing');
  } else if (!t(d.criterion)) {
    errors.push('criterionMissing');
  }
  if (!t(d.compensation)) errors.push('compensationMissing');
  if (!t(d.intentionIf) !== !t(d.intentionThen)) errors.push('intentionIncomplete');
  const texts = [d.title, d.criterion, d.unit, d.compensation, d.intentionIf, d.intentionThen];
  if (texts.some((v) => t(v).length > PARAMS.TEXT_MAX_LENGTH)) errors.push('tooLong');
  return errors;
}

/** Only one active habit at a time (CLAUDE.md principle 1). */
export function canStartHabit(habits: readonly Habit[]): boolean {
  return habits.every((h) => h.ended !== undefined);
}

/** Builds the habit from a valid draft. Starts today; the start leaf comes from the rules (START_LEAVES). */
export function createHabit(d: HabitDraft, ctx: { id: string; seed: number; now: Date }): Habit {
  const t = (v: string) => v.trim();
  const habit: Habit = {
    id: ctx.id,
    type: d.type,
    title: t(d.title),
    criterion: t(d.criterion),
    compensation: t(d.compensation),
    startDay: dayKeyOf(ctx.now),
    seed: ctx.seed,
    createdAt: ctx.now.toISOString(),
  };
  if (d.type === 'quantity') {
    habit.target = parseAmount(d.target) as number;
    habit.unit = t(d.unit);
    habit.criterion = '';
  }
  if (t(d.intentionIf) && t(d.intentionThen)) {
    habit.firstIntention = { if: t(d.intentionIf), then: t(d.intentionThen) };
  }
  return habit;
}

/**
 * Show the hint on professional help? For every 'abstinence' habit; the text
 * itself is conditional ("if it is about smoking, alcohol …"). Interpretation
 * of Plan.md Phase 3 ("verzicht mit Suchtbezug"): no keyword guessing.
 */
export function showsHelpHint(type: HabitType): boolean {
  return type === 'abstinence';
}
