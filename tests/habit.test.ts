/** Phase 3: creating a habit (domain) and the one-active-habit lock (storage). */
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { canStartHabit, createHabit, parseAmount, showsHelpHint, validateDraft, type HabitDraft } from '../src/domain/habit';
import { PARAMS } from '../src/domain/params';
import { computeTreeState } from '../src/domain/rules';
import { getActiveHabit, openTreeDb, startHabit } from '../src/storage/db';
import { validateExport } from '../src/storage/exchange';
import { at, habit } from './helpers';

const draft = (over: Partial<HabitDraft> = {}): HabitDraft => ({
  type: 'ritual', title: 'Tagesplanung', criterion: '5 Minuten Planung für morgen', target: '', unit: '',
  compensation: '15 Minuten lesen', intentionIf: '', intentionThen: '', ...over,
});

describe('parseAmount', () => {
  it.each([
    ['8000', 8000], ['8.000', 8000], ['8 000', 8000], ['1.234.567', 1234567], ['2,5', 2.5], ['2.5', 2.5], [' 12 ', 12],
  ])('%s -> %d', (raw, n) => expect(parseAmount(raw)).toBe(n));
  it.each(['', 'abc', '0', '-5', '1.5.3', '8k'])('rejects %j', (raw) => expect(parseAmount(raw)).toBeUndefined());
});

describe('validateDraft', () => {
  it('accepts a complete ritual and a complete quantity habit', () => {
    expect(validateDraft(draft())).toEqual([]);
    expect(validateDraft(draft({ type: 'quantity', criterion: '', target: '8.000', unit: 'Schritte' }))).toEqual([]);
  });

  it('reports missing fields', () => {
    expect(validateDraft(draft({ title: ' ', criterion: '', compensation: '' }))).toEqual([
      'titleMissing', 'criterionMissing', 'compensationMissing',
    ]);
    expect(validateDraft(draft({ type: 'quantity', target: 'viel', unit: '' }))).toEqual(['targetInvalid', 'unitMissing']);
  });

  it('the if-then plan is optional, but needs both parts', () => {
    expect(validateDraft(draft({ intentionIf: 'Wenn ich heimkomme' }))).toEqual(['intentionIncomplete']);
    expect(validateDraft(draft({ intentionThen: 'plane ich' }))).toEqual(['intentionIncomplete']);
    expect(validateDraft(draft({ intentionIf: 'Wenn', intentionThen: 'dann' }))).toEqual([]);
  });

  it('limits text length', () => {
    expect(validateDraft(draft({ title: 'x'.repeat(PARAMS.TEXT_MAX_LENGTH + 1) }))).toEqual(['tooLong']);
  });
});

describe('createHabit', () => {
  const ctx = { id: 'h1', seed: 7, now: at('2026-01-05', 21) };

  it('starts today with the start leaf', () => {
    const h = createHabit(draft({ title: ' Tagesplanung ' }), ctx);
    expect(h).toEqual({
      id: 'h1', type: 'ritual', title: 'Tagesplanung', criterion: '5 Minuten Planung für morgen',
      compensation: '15 Minuten lesen', startDay: '2026-01-05', seed: 7, createdAt: ctx.now.toISOString(),
    });
    expect(computeTreeState(h, { days: [], compensations: [], srbai: [] }, ctx.now).leaves).toBe(PARAMS.START_LEAVES);
  });

  it('after midnight but before the day cutoff it starts on the previous day', () => {
    expect(createHabit(draft(), { ...ctx, now: at('2026-01-06', 1) }).startDay).toBe('2026-01-05');
  });

  it('quantity: stores target and unit, no free criterion', () => {
    const h = createHabit(draft({ type: 'quantity', criterion: 'egal', target: '8.000', unit: 'Schritte' }), ctx);
    expect(h).toMatchObject({ target: 8000, unit: 'Schritte', criterion: '' });
  });

  it('keeps a complete if-then plan', () => {
    const h = createHabit(draft({ intentionIf: ' Wenn ich den Laptop zuklappe ', intentionThen: 'plane ich 5 Minuten' }), ctx);
    expect(h.firstIntention).toEqual({ if: 'Wenn ich den Laptop zuklappe', then: 'plane ich 5 Minuten' });
    const json = { format: 'gewohnheitsbaum-export', schemaVersion: 1, habits: [h], days: [], compensations: [], reflections: [], srbai: [], meta: [] };
    expect(validateExport(json).ok).toBe(true);
    expect(validateExport({ ...json, habits: [{ ...h, firstIntention: { if: 'x' } }] }).ok).toBe(false);
  });

  it('help hint for every abstinence habit', () => {
    expect(showsHelpHint('abstinence')).toBe(true);
    expect(showsHelpHint('ritual')).toBe(false);
    expect(showsHelpHint('quantity')).toBe(false);
  });
});

describe('only one active habit', () => {
  it('canStartHabit', () => {
    expect(canStartHabit([])).toBe(true);
    expect(canStartHabit([habit({ ended: { day: '2026-01-05', reason: 'grown', at: '' } })])).toBe(true);
    expect(canStartHabit([habit()])).toBe(false);
  });

  it('startHabit refuses a second active habit', async () => {
    const db = await openTreeDb('habit-lock');
    expect(await startHabit(db, habit({ id: 'a' }))).toBe(true);
    expect(await startHabit(db, habit({ id: 'b' }))).toBe(false);
    expect((await getActiveHabit(db))?.id).toBe('a');
    await db.put('habits', habit({ id: 'a', ended: { day: '2026-01-05', reason: 'dormant', at: '' } }));
    expect(await startHabit(db, habit({ id: 'b' }))).toBe(true);
    db.close();
  });
});
