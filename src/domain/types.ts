/**
 * Raw data (stored) and derived state (never stored), see CLAUDE.md "Kernidee".
 */

/** Local calendar day after applying the day cutoff, format YYYY-MM-DD. */
export type DayKey = string;

/** Plan.md 2.2: menge = quantity, ritual = ritual, verzicht = abstinence. */
export type HabitType = 'quantity' | 'ritual' | 'abstinence';

export type Answer = 'yes' | 'partial' | 'no';

export interface Habit {
  id: string;
  type: HabitType;
  /** Short name, e.g. "Mehr gehen". */
  title: string;
  /** Daily criterion in the user's words, e.g. "mindestens 8.000 Schritte". */
  criterion: string;
  /** Only for type 'quantity': value that makes a day successful (>=). */
  target?: number;
  /** Only for type 'quantity': unit shown with the number, e.g. "Schritte". */
  unit?: string;
  /** Compensation action in the user's words, e.g. "1 km extra gehen". */
  compensation: string;
  /** First day of the habit. */
  startDay: DayKey;
  /** Seed for the deterministic tree drawing. */
  seed: number;
  /** ISO timestamp. */
  createdAt: string;
  /** Set when the habit is archived: 'grown' after completion, 'dormant' after a deliberate stop. */
  ended?: { day: DayKey; reason: 'grown' | 'dormant'; at: string };
}

/** One check-in per habit and day (the latest one wins). Plan.md 2.7 step 1. */
export interface DayEntry {
  habitId: string;
  day: DayKey;
  result: Answer;
  /** Only for type 'quantity': entered amount. Decides success if present. */
  amount?: number;
  recordedAt: string;
}

/** One completed compensation unit (Plan.md 2.3). */
export interface CompensationEntry {
  id: string;
  habitId: string;
  /** Day on which the compensation was done. */
  day: DayKey;
  recordedAt: string;
}

export type Obstacle =
  | 'tired'
  | 'stress'
  | 'boredom'
  | 'company'
  | 'lackOfTime'
  | 'place'
  | 'other';

/** Reflection of the daily check-in (Plan.md 2.7 steps 2–4). Never influences the tree. */
export interface Reflection {
  habitId: string;
  day: DayKey;
  /** Was yesterday's intention carried out? */
  intentionKept?: Answer;
  obstacles: Obstacle[];
  note?: string;
  /** If-then plan for tomorrow. */
  nextIntention?: { if: string; then: string };
  recordedAt: string;
}

/** One SRBAI questionnaire (Plan.md 2.6). */
export interface SrbaiAnswer {
  id: string;
  habitId: string;
  day: DayKey;
  /** One value per item, within PARAMS.SRBAI_SCALE_MIN..MAX. */
  items: number[];
  recordedAt: string;
}

export interface HabitRecords {
  days: DayEntry[];
  compensations: CompensationEntry[];
  srbai: SrbaiAnswer[];
}

// ---------------------------------------------------------------- derived

/** Plan.md 2.4: gesund, gebremst, stagnierend, welkend. */
export type TreeStatus = 'healthy' | 'slowed' | 'stagnating' | 'wilting';

/**
 * success: criterion met. compensated: missed, but made good within the week.
 * missed: criterion not met, not (yet) compensated. pending: no check-in yet,
 * can still be entered. unrecorded: no check-in and too late to backfill (neutral).
 */
export type DayStatus = 'success' | 'compensated' | 'missed' | 'pending' | 'unrecorded';

export interface DayInfo {
  day: DayKey;
  status: DayStatus;
}

export interface WeekSummary {
  /** Monday of the ISO week. */
  weekStart: DayKey;
  /** false only for the current week. */
  settled: boolean;
  /** Settled weeks only: no open compensation units at the end. */
  balanced: boolean;
  /** Status during this week (from the previous settlement). */
  statusDuring: TreeStatus;
  /** Status after this week was settled (equals statusDuring for the current week). */
  statusAfter: TreeStatus;
  successDays: number;
  compensatedDays: number;
  missedDays: number;
  /** Leaves (or buds) the week produced. */
  grown: number;
  /** Leaves that fell to the ground at the end of the week. */
  fallen: number;
  /** Day on which the wind cleared the ground in this week, if any. */
  windDay?: DayKey;
}

export type TreeEvent =
  | { kind: 'fall'; day: DayKey; count: number }
  | { kind: 'wind'; day: DayKey; cleared: number }
  | { kind: 'status'; day: DayKey; from: TreeStatus; to: TreeStatus };

export interface CompletionCheck {
  ready: boolean;
  enoughLeaves: boolean;
  automaticEnough: boolean;
  groundClear: boolean;
  healthy: boolean;
}

export interface TreeState {
  /** Day the state was computed for (local, after cutoff). */
  today: DayKey;
  status: TreeStatus;
  /** 0 = healthy … 3 = wilting. */
  statusLevel: number;
  /** Leaves currently on the tree. */
  leaves: number;
  /** Buds of the current week (only when stagnating or wilting). */
  buds: number;
  /** Fallen leaves on the ground. */
  litter: number;
  /** All leaves and buds ever grown: drives the branch structure, never shrinks. */
  grownTotal: number;
  /** 0..1, visible vitality. */
  vitality: number;
  /** Consecutive successful/compensated days up to today (today counts once checked in). */
  streak: number;
  /** Open compensation units in the current week. */
  openUnits: number;
  days: DayInfo[];
  weeks: WeekSummary[];
  events: TreeEvent[];
  srbaiDue: boolean;
  latestSrbaiScore?: number;
  completion: CompletionCheck;
}
