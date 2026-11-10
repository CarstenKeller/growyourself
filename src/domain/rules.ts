/**
 * Rule engine (Plan.md section 2). Pure function: the complete TreeState is
 * recomputed from raw records on every call — nothing derived is stored.
 *
 * Interpretations where Plan.md leaves room are marked "Assumption A-n" and
 * listed in Plan.md, section 5 "Offene Fragen".
 */
import { addDays, dayKeyOf, dayRange, daysBetween, weekEnd, weekStart } from './calendar';
import { PARAMS } from './params';
import type {
  CompletionCheck,
  DayEntry,
  DayInfo,
  DayKey,
  DayStatus,
  Habit,
  HabitRecords,
  TreeEvent,
  TreeState,
  TreeStatus,
  WeekSummary,
} from './types';

export const STATUSES: readonly TreeStatus[] = ['healthy', 'slowed', 'stagnating', 'wilting'];
const MAX_LEVEL = STATUSES.length - 1;
/** From this level on, successful days only produce buds (Plan.md 2.4, stage 3). */
const BUD_LEVEL = 2;

/** Criterion met? For 'quantity' an entered amount decides, otherwise the answer. 'partial' counts as missed (Plan.md 5, question 4). */
export function isSuccess(habit: Habit, entry: DayEntry): boolean {
  if (habit.type === 'quantity' && entry.amount !== undefined && habit.target !== undefined) {
    return entry.amount >= habit.target;
  }
  return entry.result === 'yes';
}

/**
 * May a check-in (or compensation) for `day` still be entered on `today`?
 * Plan.md 2.3.4: up to CHECKIN_BACKFILL_DAYS back, only within weeks not yet
 * settled — that is the current week, because a week is settled as soon as it
 * has ended. Future days are not allowed.
 */
export function canRecord(day: DayKey, today: DayKey): boolean {
  const diff = daysBetween(day, today);
  return diff >= 0 && diff <= PARAMS.CHECKIN_BACKFILL_DAYS && weekStart(day) === weekStart(today);
}

function statusOf(level: number): TreeStatus {
  return STATUSES[level] as TreeStatus;
}

export function computeTreeState(habit: Habit, records: HabitRecords, now: Date): TreeState {
  const nowDay = dayKeyOf(now);
  // An archived tree is frozen on the day it ended.
  const today = habit.ended && habit.ended.day < nowDay ? habit.ended.day : nowDay;
  const inRange = (r: { habitId: string; day: DayKey }): boolean =>
    r.habitId === habit.id && r.day >= habit.startDay && r.day <= today;

  const entries = new Map<DayKey, DayEntry>();
  for (const e of records.days.filter(inRange)) entries.set(e.day, e); // latest in array wins
  const compensationDays = records.compensations
    .filter(inRange)
    .map((c) => c.day)
    .sort();

  let level = 0;
  let leaves = 0;
  let buds = 0;
  let litter = 0;
  let grownTotal = 0;
  let streak = 0;
  let openUnits = 0;
  const days: DayInfo[] = [];
  const weeks: WeekSummary[] = [];
  const events: TreeEvent[] = [];

  const lastWeek = weekStart(today);
  for (let ws = weekStart(habit.startDay); ws <= lastWeek && habit.startDay <= today; ws = addDays(ws, 7)) {
    const we = weekEnd(ws);
    const weekDays = dayRange(ws < habit.startDay ? habit.startDay : ws, we < today ? we : today);

    // 1. Classify each day of the week.
    const status = new Map<DayKey, DayStatus>();
    const missed: DayKey[] = [];
    for (const day of weekDays) {
      const entry = entries.get(day);
      if (entry) {
        const s: DayStatus = isSuccess(habit, entry) ? 'success' : 'missed';
        status.set(day, s);
        if (s === 'missed') missed.push(day);
      } else {
        // Assumption A-1: a check-in that can no longer be backfilled is neutral
        // (no leaf, no compensation unit) — forgetting is not failing (CLAUDE.md 4).
        status.set(day, canRecord(day, today) ? 'pending' : 'unrecorded');
      }
    }

    // 2. Compensation units make good missed days of the same week (Plan.md 2.3.3).
    // Assumption A-2: a unit covers only missed days up to the day it was done,
    // earliest first; surplus units carry no credit.
    let covered = 0;
    for (const cDay of compensationDays) {
      if (weekStart(cDay) !== ws) continue;
      const next = missed[covered];
      if (next !== undefined && next <= cDay) {
        status.set(next, 'compensated');
        covered++;
      }
    }

    // 3. Walk the days in order: streak and wind (Plan.md 2.5).
    let windDay: DayKey | undefined;
    let successDays = 0;
    for (const day of weekDays) {
      const s = status.get(day) as DayStatus;
      days.push({ day, status: s });
      if (s === 'pending' && day === today) continue; // today is not over yet
      if (s === 'success' || s === 'compensated') {
        if (s === 'success') successDays++;
        streak++;
        if (streak >= PARAMS.WIND_STREAK && litter > 0) {
          events.push({ kind: 'wind', day, cleared: litter });
          litter = 0;
          windDay = day;
        }
      } else {
        streak = 0;
      }
    }

    const grown = successDays + covered;
    const open = missed.length - covered;
    grownTotal += grown;
    const statusDuring = statusOf(level);
    const settled = we < today;
    let fallen = 0;

    if (settled) {
      if (open === 0) {
        leaves += grown; // buds of a stagnating week open now
        level = Math.max(0, level - PARAMS.RECOVERY_STEP);
      } else {
        // Plan.md 2.4: all leaves of this week fall; open units expire.
        // Assumption A-3: buds of an unbalanced week fall as litter, too.
        fallen = grown;
        litter += grown;
        level = Math.min(MAX_LEVEL, level + 1);
        if (fallen > 0) events.push({ kind: 'fall', day: we, count: fallen });
      }
      if (statusOf(level) !== statusDuring) {
        events.push({ kind: 'status', day: we, from: statusDuring, to: statusOf(level) });
      }
    } else {
      openUnits = open;
      if (level >= BUD_LEVEL) buds = grown;
      else leaves += grown;
    }

    weeks.push({
      weekStart: ws,
      settled,
      balanced: settled && open === 0,
      statusDuring,
      statusAfter: statusOf(level),
      successDays,
      compensatedDays: covered,
      missedDays: open,
      grown,
      fallen,
      ...(windDay ? { windDay } : {}),
    });
  }

  // SRBAI (Plan.md 2.6): latest answer counts; asked weekly from SRBAI_START_LEAVES on.
  const answers = records.srbai
    .filter(inRange)
    .sort((a, b) => (a.day + a.recordedAt).localeCompare(b.day + b.recordedAt));
  const latest = answers[answers.length - 1];
  const latestSrbaiScore = latest
    ? latest.items.reduce((sum, v) => sum + v, 0) / latest.items.length
    : undefined;
  const srbaiDue =
    leaves >= PARAMS.SRBAI_START_LEAVES && !answers.some((a) => weekStart(a.day) === weekStart(today));

  const completion: CompletionCheck = {
    enoughLeaves: leaves >= PARAMS.MIN_LEAVES,
    automaticEnough: latestSrbaiScore !== undefined && latestSrbaiScore >= PARAMS.SRBAI_THRESHOLD,
    groundClear: litter === 0,
    healthy: level === 0,
    ready: false,
  };
  completion.ready =
    completion.enoughLeaves && completion.automaticEnough && completion.groundClear && completion.healthy;

  return {
    today,
    status: statusOf(level),
    statusLevel: level,
    leaves,
    buds,
    litter,
    grownTotal,
    vitality: PARAMS.VITALITY_BY_LEVEL[level] as number,
    streak,
    openUnits,
    days,
    weeks,
    events,
    srbaiDue,
    ...(latestSrbaiScore !== undefined ? { latestSrbaiScore } : {}),
    completion,
  };
}
