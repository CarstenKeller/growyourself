/**
 * Scenario tests of the rule engine (Plan.md 2 and Phase 1).
 * Habit starts Monday 2026-01-05; week(n) is the Monday n weeks later.
 */
import { describe, expect, it } from 'vitest';
import { addDays } from '../src/domain/calendar';
import { PARAMS } from '../src/domain/params';
import { canRecord, computeTreeState, isSuccess } from '../src/domain/rules';
import { MON, Records, at, habit, week } from './helpers';

const state = (r: Records, now: Date, h = habit()) => computeTreeState(h, r, now);

describe('day level (Plan.md 2.3)', () => {
  it('perfect week: 7 leaves, healthy, balanced', () => {
    const s = state(new Records().days_(MON, 7), at(week(1), 10));
    expect(s.leaves).toBe(7);
    expect(s.status).toBe('healthy');
    expect(s.litter).toBe(0);
    expect(s.weeks[0]).toMatchObject({ settled: true, balanced: true, grown: 7, fallen: 0 });
    expect(s.events).toEqual([]);
  });

  it('leaves of the running week are on the tree before settlement', () => {
    const s = state(new Records().days_(MON, 3), at(addDays(MON, 2), 22));
    expect(s.leaves).toBe(3);
    expect(s.weeks[0]).toMatchObject({ settled: false, balanced: false });
    expect(s.streak).toBe(3);
  });

  it('missed day opens one compensation unit', () => {
    const s = state(new Records().days_(MON, 2).day(addDays(MON, 2), 'no'), at(addDays(MON, 2), 22));
    expect(s.leaves).toBe(2);
    expect(s.openUnits).toBe(1);
    expect(s.days[2]).toEqual({ day: addDays(MON, 2), status: 'missed' });
    expect(s.streak).toBe(0);
  });

  it('1 missed day with compensation in the same week becomes a leaf', () => {
    const r = new Records().days_(MON, 7).day(addDays(MON, 2), 'no').comp(addDays(MON, 4));
    const s = state(r, at(week(1), 10));
    expect(s.leaves).toBe(7);
    expect(s.openUnits).toBe(0);
    expect(s.days[2]?.status).toBe('compensated');
    expect(s.weeks[0]).toMatchObject({ balanced: true, successDays: 6, compensatedDays: 1, missedDays: 0 });
  });

  it('compensation on the same day as the missed day counts', () => {
    const r = new Records().day(MON, 'no').comp(MON);
    expect(state(r, at(MON, 22)).leaves).toBe(1);
  });

  it('assumption A-2: compensation done before the missed day does not count; surplus has no credit', () => {
    const r = new Records().comp(MON).comp(MON).day(MON, 'yes').day(addDays(MON, 1), 'no');
    const s = state(r, at(addDays(MON, 1), 22));
    expect(s.openUnits).toBe(1);
    expect(s.leaves).toBe(1);
  });

  it('compensation in the following week does not cover the old week', () => {
    const r = new Records().days_(MON, 6).day(addDays(MON, 6), 'no').comp(week(1));
    const s = state(r, at(week(1), 22));
    expect(s.weeks[0]?.balanced).toBe(false);
  });

  it('partial counts as missed (Plan.md 5, question 4)', () => {
    const s = state(new Records().day(MON, 'partial'), at(MON, 22));
    expect(s.leaves).toBe(0);
    expect(s.openUnits).toBe(1);
  });

  it('quantity: the entered amount decides', () => {
    const h = habit({ type: 'quantity', target: 8000, unit: 'Schritte' });
    const r = new Records().day(MON, 'no', 8000).day(addDays(MON, 1), 'yes', 7999).day(addDays(MON, 2), 'yes');
    const s = state(r, at(addDays(MON, 2), 22), h);
    expect(s.days.map((d) => d.status)).toEqual(['success', 'missed', 'success']);
  });

  it('quantity without target falls back to the answer', () => {
    const h = habit({ type: 'quantity' });
    expect(isSuccess(h, { habitId: 'h1', day: MON, result: 'yes', amount: 1, recordedAt: '' })).toBe(true);
  });

  it('the latest entry for a day wins', () => {
    const s = state(new Records().day(MON, 'no').day(MON, 'yes'), at(MON, 22));
    expect(s.leaves).toBe(1);
    expect(s.openUnits).toBe(0);
  });
});

describe('forgotten check-ins (Plan.md 2.3.4)', () => {
  it('a forgotten day is pending, backfilling turns it into a leaf', () => {
    const r = new Records().day(MON, 'yes');
    const before = state(r, at(addDays(MON, 2), 9));
    expect(before.days.map((d) => d.status)).toEqual(['success', 'pending', 'pending']);
    expect(before.leaves).toBe(1);
    r.day(addDays(MON, 1), 'yes');
    expect(state(r, at(addDays(MON, 2), 9)).leaves).toBe(2);
  });

  it('today without check-in does not break the streak', () => {
    const s = state(new Records().days_(MON, 2), at(addDays(MON, 2), 9));
    expect(s.streak).toBe(2);
  });

  it('a pending day before today breaks the streak until it is backfilled', () => {
    const s = state(new Records().day(MON, 'yes').day(addDays(MON, 2), 'yes'), at(addDays(MON, 2), 22));
    expect(s.streak).toBe(1);
  });

  it('assumption A-1: a check-in never entered is neutral — no leaf lost, no unit, no falling leaves', () => {
    const r = new Records().days_(MON, 3).days_(addDays(MON, 4), 3); // Thursday forgotten
    const s = state(r, at(week(1), 10));
    expect(s.days[3]?.status).toBe('unrecorded');
    expect(s.leaves).toBe(6);
    expect(s.litter).toBe(0);
    expect(s.weeks[0]?.balanced).toBe(true);
    expect(s.status).toBe('healthy');
  });

  it('canRecord: up to 2 days back, current week only, never in the future', () => {
    const wed = addDays(MON, 2);
    expect(canRecord(wed, wed)).toBe(true);
    expect(canRecord(MON, wed)).toBe(true);
    expect(canRecord(addDays(MON, 3), wed)).toBe(false);
    expect(canRecord(MON, addDays(MON, 3))).toBe(false);
    // Sunday cannot be backfilled on Monday: the week is settled.
    expect(canRecord(addDays(MON, 6), week(1))).toBe(false);
  });

  it('records outside the habit window or of another habit are ignored', () => {
    const r = new Records()
      .day(addDays(MON, -1), 'yes')
      .day(addDays(MON, 1), 'yes') // future
      .day(MON, 'yes', undefined, 'other')
      .comp(MON, 'other')
      .srbaiAnswer(MON, [7, 7, 7, 7], undefined, 'other');
    const s = state(r, at(MON, 22));
    expect(s.leaves).toBe(0);
    expect(s.latestSrbaiScore).toBeUndefined();
  });
});

describe('week boundary and day cutoff', () => {
  const r = () => new Records().days_(MON, 6).day(addDays(MON, 6), 'no');

  it('Monday 02:30 is still Sunday: week not settled, compensation still possible', () => {
    const s = state(r(), at(week(1), 2, 30));
    expect(s.today).toBe(addDays(MON, 6));
    expect(s.weeks[0]?.settled).toBe(false);
    expect(s.openUnits).toBe(1);
    expect(s.leaves).toBe(6);
  });

  it('compensation entered Monday 02:30 counts for the Sunday', () => {
    const rec = r().comp(addDays(MON, 6));
    const s = state(rec, at(week(1), 3, 0));
    expect(s.weeks[0]?.balanced).toBe(true);
    expect(s.leaves).toBe(6 + 1);
  });

  it('Monday 03:00 settles the week', () => {
    const s = state(r(), at(week(1), 3, 0));
    expect(s.weeks[0]).toMatchObject({ settled: true, balanced: false, fallen: 6 });
    expect(s.leaves).toBe(0);
    expect(s.litter).toBe(6);
  });

  it('Sunday 02:30 still belongs to Saturday', () => {
    const s = state(new Records(), at(addDays(MON, 6), 2, 30));
    expect(s.today).toBe(addDays(MON, 5));
  });

  it('a habit starting mid-week has a short first week', () => {
    const h = habit({ startDay: addDays(MON, 3) });
    const s = state(new Records().days_(addDays(MON, 3), 4), at(week(1), 10), h);
    expect(s.days).toHaveLength(5);
    expect(s.weeks[0]).toMatchObject({ weekStart: MON, balanced: true, grown: 4 });
  });
});

describe('week level (Plan.md 2.4)', () => {
  /** Week n with one uncompensated missed day (Wednesday). */
  const unbalanced = (r: Records, n: number) => r.days_(week(n), 7).day(addDays(week(n), 2), 'no');
  const balanced = (r: Records, n: number) => r.days_(week(n), 7);

  it('unbalanced week: all leaves of this week fall, open units expire, status slowed', () => {
    const r = balanced(new Records(), 0);
    unbalanced(r, 1);
    const s = state(r, at(week(2), 10));
    expect(s.leaves).toBe(7);
    expect(s.litter).toBe(6);
    expect(s.status).toBe('slowed');
    expect(s.openUnits).toBe(0);
    expect(s.events).toEqual([
      { kind: 'fall', day: addDays(week(1), 6), count: 6 },
      { kind: 'status', day: addDays(week(1), 6), from: 'healthy', to: 'slowed' },
    ]);
    expect(s.grownTotal).toBe(13); // structure keeps fallen growth
  });

  it('unbalanced week without any leaves: no fall event', () => {
    const s = state(new Records().days_(MON, 7, 'no'), at(week(1), 10));
    expect(s.status).toBe('slowed');
    expect(s.events.map((e) => e.kind)).toEqual(['status']);
    expect(s.litter).toBe(0);
  });

  it('2 unbalanced weeks in a row: stagnating, successful days only grow buds', () => {
    const r = new Records();
    unbalanced(r, 0);
    unbalanced(r, 1);
    r.days_(week(2), 3);
    const s = state(r, at(addDays(week(2), 2), 22));
    expect(s.status).toBe('stagnating');
    expect(s.leaves).toBe(0);
    expect(s.buds).toBe(3);
    expect(s.vitality).toBe(1);
  });

  it('stagnating: buds open into leaves when the week ends balanced; status recovers one level', () => {
    const r = new Records();
    unbalanced(r, 0);
    unbalanced(r, 1);
    balanced(r, 2);
    const s = state(r, at(week(3), 10));
    expect(s.leaves).toBe(7);
    expect(s.buds).toBe(0);
    expect(s.status).toBe('slowed');
  });

  it('assumption A-3: buds of an unbalanced stagnating week fall as litter', () => {
    const r = new Records();
    unbalanced(r, 0);
    unbalanced(r, 1);
    unbalanced(r, 2);
    const s = state(r, at(week(3), 10));
    expect(s.litter).toBe(18);
    expect(s.leaves).toBe(0);
  });

  it('3 unbalanced weeks in a row: wilting with lower vitality; it does not go further down', () => {
    const r = new Records();
    for (let n = 0; n < 4; n++) unbalanced(r, n);
    const s3 = state(r, at(week(3), 10));
    expect(s3.status).toBe('wilting');
    expect(s3.vitality).toBe(PARAMS.VITALITY_BY_LEVEL[3]);
    const s4 = state(r, at(week(4), 10));
    expect(s4.status).toBe('wilting');
    expect(s4.statusLevel).toBe(3);
    expect(s4.events.filter((e) => e.kind === 'status')).toHaveLength(3);
  });

  it('recovery: each balanced week raises the status by one level', () => {
    const r = new Records();
    for (let n = 0; n < 3; n++) unbalanced(r, n);
    for (let n = 3; n < 6; n++) balanced(r, n);
    const levels = [3, 4, 5, 6].map((n) => state(r, at(week(n), 10)).status);
    expect(levels).toEqual(['wilting', 'stagnating', 'slowed', 'healthy']);
  });

  it('a balanced week while healthy keeps healthy (no status event)', () => {
    const r = balanced(new Records(), 0);
    balanced(r, 1);
    expect(state(r, at(week(2), 10)).events).toEqual([]);
  });

  it('assumption: a week without any check-in counts as balanced', () => {
    const r = new Records();
    unbalanced(r, 0);
    const s = state(r, at(week(2), 10));
    expect(s.weeks[1]?.balanced).toBe(true);
    expect(s.status).toBe('healthy');
  });
});

describe('wind (Plan.md 2.5)', () => {
  it('7 successful days in a row blow the litter away', () => {
    const r = new Records().days_(MON, 7).day(addDays(MON, 2), 'no'); // Wed missed -> 6 fall
    r.days_(week(1), 3); // Thu..Sun of week 0 (4) + Mon..Wed (3) = 7
    const s = state(r, at(addDays(week(1), 2), 22));
    expect(s.litter).toBe(0);
    expect(s.events).toContainEqual({ kind: 'wind', day: addDays(week(1), 2), cleared: 6 });
    expect(s.weeks[1]?.windDay).toBe(addDays(week(1), 2));
  });

  it('6 days are not enough', () => {
    const r = new Records().days_(MON, 7).day(addDays(MON, 2), 'no');
    r.days_(week(1), 2);
    expect(state(r, at(addDays(week(1), 1), 22)).litter).toBe(6);
  });

  it('compensated days count as successful for the wind', () => {
    const r = new Records().days_(MON, 7).day(addDays(MON, 2), 'no'); // 6 fall
    r.days_(week(1), 7).day(addDays(week(1), 1), 'no').comp(addDays(week(1), 2));
    // streak: Thu..Sun (4) + Mon (1) + Tue compensated (1) + Wed (1) = 7 on Wednesday
    const s = state(r, at(addDays(week(1), 2), 22));
    expect(s.litter).toBe(0);
    expect(s.streak).toBe(7);
  });

  it('a long streak without litter causes no wind', () => {
    const s = state(new Records().days_(MON, 14), at(week(2), 10));
    expect(s.events).toEqual([]);
    expect(s.streak).toBe(14);
  });
});

describe('completion (Plan.md 2.6)', () => {
  const sixWeeks = () => new Records().days_(MON, 42);

  it('all conditions met: ready', () => {
    const r = sixWeeks().srbaiAnswer(addDays(MON, 41), [5, 6, 5, 6]);
    const s = state(r, at(week(6), 10));
    expect(s.leaves).toBe(PARAMS.MIN_LEAVES);
    expect(s.latestSrbaiScore).toBe(5.5);
    expect(s.completion).toEqual({ ready: true, enoughLeaves: true, automaticEnough: true, groundClear: true, healthy: true });
  });

  it('without SRBAI not ready', () => {
    const s = state(sixWeeks(), at(week(6), 10));
    expect(s.completion).toMatchObject({ ready: false, enoughLeaves: true, automaticEnough: false });
  });

  it('SRBAI below threshold: not ready; the latest answer counts', () => {
    const r = sixWeeks()
      .srbaiAnswer(addDays(MON, 41), [2, 2, 2, 2], `${addDays(MON, 41)}T21:00:00.000Z`)
      .srbaiAnswer(addDays(MON, 41), [7, 7, 7, 7], `${addDays(MON, 41)}T20:00:00.000Z`)
      .srbaiAnswer(addDays(MON, 35), [7, 7, 7, 7]);
    const s = state(r, at(week(6), 10));
    expect(s.latestSrbaiScore).toBe(2);
    expect(s.completion.ready).toBe(false);
  });

  it('too few leaves, litter on the ground or not healthy: not ready', () => {
    const r = new Records().days_(MON, 49).day(addDays(MON, 44), 'no').srbaiAnswer(addDays(MON, 48), [7, 7, 7, 7]);
    const s = state(r, at(week(7), 10)); // week 6 unbalanced
    expect(s.completion).toMatchObject({ ready: false, enoughLeaves: true, groundClear: false, healthy: false });
    const few = state(new Records().days_(MON, 7).srbaiAnswer(MON, [7, 7, 7, 7]), at(week(1), 10));
    expect(few.completion).toMatchObject({ ready: false, enoughLeaves: false, automaticEnough: true });
  });

  it('SRBAI is due weekly from 35 leaves on', () => {
    const r = new Records().days_(MON, 35);
    expect(state(r, at(addDays(MON, 33), 22)).srbaiDue).toBe(false);
    expect(state(r, at(addDays(MON, 34), 22)).srbaiDue).toBe(true);
    r.srbaiAnswer(addDays(MON, 34), [4, 4, 4, 4]);
    expect(state(r, at(addDays(MON, 34), 22)).srbaiDue).toBe(false);
    r.days_(week(5), 1);
    expect(state(r, at(week(5), 22)).srbaiDue).toBe(true); // new week
  });
});

describe('lifecycle', () => {
  it('a habit starting in the future has an empty state', () => {
    const s = state(new Records(), at(MON, 10), habit({ startDay: addDays(MON, 1) }));
    expect(s).toMatchObject({ leaves: 0, weeks: [], days: [], status: 'healthy' });
  });

  it('an archived tree is frozen on its end day', () => {
    const h = habit({ ended: { day: addDays(MON, 2), reason: 'dormant', at: '' } });
    const s = state(new Records().days_(MON, 7), at(week(5), 10), h);
    expect(s.today).toBe(addDays(MON, 2));
    expect(s.leaves).toBe(3);
  });

  it('an end day in the future does not shift today', () => {
    const h = habit({ ended: { day: week(1), reason: 'grown', at: '' } });
    expect(state(new Records(), at(MON, 10), h).today).toBe(MON);
  });
});
