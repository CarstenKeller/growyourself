/** Domain helpers of Phases 4–8: check-in, weekly review, evaluation, calendar export. */
import { describe, expect, it } from 'vitest';
import { addDays } from '../src/domain/calendar';
import { intentionFor, quantityResult } from '../src/domain/checkin';
import { buildIcs, foldLine, isTime } from '../src/domain/ics';
import { computeInsights } from '../src/domain/insights';
import { PARAMS } from '../src/domain/params';
import { weekendOpenUnits, weeklyReviewDue } from '../src/domain/review';
import { computeTreeState } from '../src/domain/rules';
import type { Reflection } from '../src/domain/types';
import { MON, Records, at, habit, week } from './helpers';

const refl = (day: string, over: Partial<Reflection> = {}): Reflection => ({
  habitId: 'h1', day, obstacles: [], recordedAt: `${day}T20:00:00Z`, ...over,
});

describe('check-in (Phase 4)', () => {
  it('quantity: target reached = yes, something = partial, nothing = no', () => {
    expect(quantityResult(8000, 8000)).toBe('yes');
    expect(quantityResult(5000, 8000)).toBe('partial');
    expect(quantityResult(0, 8000)).toBe('no');
  });

  it('the plan of the previous evening applies; until the first check-in the onboarding plan', () => {
    const plan = { if: 'Wenn A', then: 'dann B' };
    const h = habit({ firstIntention: { if: 'Start', then: 'los' } });
    expect(intentionFor(MON, h, [])).toEqual({ if: 'Start', then: 'los' });
    expect(intentionFor(addDays(MON, 1), h, [])).toEqual({ if: 'Start', then: 'los' });
    expect(intentionFor(addDays(MON, 1), h, [refl(MON, { nextIntention: plan })])).toEqual(plan);
    expect(intentionFor(addDays(MON, 1), h, [refl(MON)])).toBeUndefined();
    expect(intentionFor(addDays(MON, 3), h, [refl(MON, { nextIntention: plan })])).toBeUndefined();
    expect(intentionFor(addDays(MON, 1), h, [refl(MON, { habitId: 'other', nextIntention: plan })])).toEqual(h.firstIntention);
  });
});

describe('weekly review (Phase 6)', () => {
  const r = new Records().days_(MON, 7).day(addDays(MON, 2), 'no');
  it('appears once for the latest settled week', () => {
    expect(weeklyReviewDue(computeTreeState(habit(), r, at(addDays(MON, 6), 22)), undefined)).toBeUndefined();
    const s = computeTreeState(habit(), r, at(week(1), 8));
    expect(weeklyReviewDue(s, undefined)?.weekStart).toBe(MON);
    expect(weeklyReviewDue(s, MON)).toBeUndefined();
    const later = computeTreeState(habit(), r, at(week(2), 8));
    expect(weeklyReviewDue(later, MON)?.weekStart).toBe(week(1));
  });

  it('weekend hint only on Saturday and Sunday with open units', () => {
    const rec = new Records().day(MON, 'no');
    expect(weekendOpenUnits(computeTreeState(habit(), rec, at(addDays(MON, 4), 12)))).toBe(0);
    expect(weekendOpenUnits(computeTreeState(habit(), rec.days_(addDays(MON, 1), 4), at(addDays(MON, 5), 12)))).toBe(1);
    expect(weekendOpenUnits(computeTreeState(habit(), new Records().days_(MON, 7), at(addDays(MON, 6), 12)))).toBe(0);
  });
});

describe('evaluation (Plan.md 2.8)', () => {
  it('only from 14 check-ins; counts obstacles, weekdays and kept plans', () => {
    const r = new Records().days_(MON, 12).day(addDays(MON, 12), 'no'); // 13 check-ins, Saturday missed
    const reflections = [
      refl(MON, { intentionKept: 'yes' }),
      refl(addDays(MON, 1), { intentionKept: 'no', obstacles: ['tired', 'stress'] }),
      refl(addDays(MON, 2), { intentionKept: 'partial', obstacles: ['tired'] }),
      refl(addDays(MON, 3), { habitId: 'other', obstacles: ['place'] }),
    ];
    const early = computeInsights(habit(), r.days, reflections);
    expect(early).toMatchObject({ checkIns: 13, ready: false });
    r.day(addDays(MON, 13), 'yes');
    const i = computeInsights(habit(), r.days, reflections);
    expect(i.ready).toBe(PARAMS.INSIGHTS_MIN_CHECKINS <= 14);
    expect(i.obstacles).toEqual([{ obstacle: 'tired', count: 2 }, { obstacle: 'stress', count: 1 }]);
    expect(i.weekdays[0]).toEqual({ success: 2, missed: 0 }); // Mondays
    expect(i.weekdays[5]).toEqual({ success: 1, missed: 1 }); // Saturdays
    expect(i.weekdays[6]).toEqual({ success: 2, missed: 0 }); // Sundays
    expect(i.intentions).toEqual({ yes: 1, partial: 1, no: 1 });
  });
});

describe('calendar export (Phase 8)', () => {
  const events = [
    { uid: 'checkin-h1@gewohnheitsbaum', time: '21:00', summary: 'Check-in: Tagesplanung', description: 'Kurz eintragen, wie der Tag war; danach Plan für morgen.' },
    { uid: 'morning-h1@gewohnheitsbaum', time: '07:30', summary: 'Dein Vorhaben', description: 'Wenn …, dann …' },
  ];
  const ics = buildIcs(events, '2026-11-11', new Date('2026-11-10T19:00:00Z'));

  it('builds a valid daily recurring calendar', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART:20261111T210000\r\n');
    expect(ics).toContain('DTSTART:20261111T073000\r\n');
    expect(ics).toContain('DTSTAMP:20261110T190000Z\r\n');
    expect(ics.match(/RRULE:FREQ=DAILY/g)).toHaveLength(2);
    expect(ics).toContain('SUMMARY:Check-in: Tagesplanung');
    expect(ics).toContain('Kurz eintragen\\, wie der Tag war\\; danach');
    expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('folds long lines without splitting characters', () => {
    const line = 'DESCRIPTION:' + 'ä'.repeat(80);
    const folded = foldLine(line);
    expect(folded.split('\r\n ').join('')).toBe(line);
    expect(folded.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(foldLine('short')).toBe('short');
  });

  it('validates times', () => {
    expect(isTime('07:30')).toBe(true);
    expect(isTime('24:00')).toBe(false);
    expect(isTime('7:30')).toBe(false);
  });
});
