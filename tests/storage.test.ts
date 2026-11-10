/**
 * Phase 2: IndexedDB (fake-indexeddb in Node) and export/import.
 * Acceptance: export -> delete -> import yields an identical TreeState.
 */
import 'fake-indexeddb/auto';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';
import { addDays } from '../src/domain/calendar';
import { computeTreeState } from '../src/domain/rules';
import {
  addCompensation, addSrbai, clearAll, getActiveHabit, getMeta, listHabits, listReflections, loadRecords,
  openTreeDb, putDayEntry, putHabit, putReflection, setMeta, SCHEMA_VERSION, type Db,
} from '../src/storage/db';
import { EXPORT_FORMAT, exportData, importData, validateExport } from '../src/storage/exchange';
import { MON, Records, at, habit, week } from './helpers';

let n = 0;
const open: Db[] = [];
async function freshDb(): Promise<{ db: Db; name: string }> {
  const name = `test-${n++}`;
  const db = await openTreeDb(name);
  open.push(db);
  return { db, name };
}
afterEach(() => {
  open.splice(0).forEach((db) => db.close());
});

/** Three weeks with a balanced, an unbalanced and a running week, plus reflection and SRBAI. */
async function fill(db: Db): Promise<void> {
  const r = new Records().days_(MON, 7).days_(week(1), 7).day(addDays(week(1), 3), 'no').days_(week(2), 2);
  r.day(addDays(MON, 2), 'no').comp(addDays(MON, 3)).srbaiAnswer(addDays(MON, 6), [3, 4, 5, 4]);
  await putHabit(db, habit());
  await putHabit(db, habit({ id: 'old', ended: { day: '2025-12-01', reason: 'dormant', at: '2025-12-01T10:00:00Z' } }));
  for (const d of r.days) await putDayEntry(db, d);
  for (const c of r.compensations) await addCompensation(db, c);
  for (const s of r.srbai) await addSrbai(db, s);
  await putReflection(db, {
    habitId: 'h1', day: MON, intentionKept: 'partial', obstacles: ['tired', 'stress'], note: 'spät',
    nextIntention: { if: 'Wenn ich den Laptop zuklappe', then: 'plane ich 5 Minuten' }, recordedAt: `${MON}T20:00:00Z`,
  });
  await setMeta(db, 'lastReviewedWeek', week(1));
}

describe('IndexedDB repository', () => {
  it('creates schema v1 and stores records', async () => {
    const { db } = await freshDb();
    expect(db.version).toBe(SCHEMA_VERSION);
    expect([...db.objectStoreNames].sort()).toEqual(['compensations', 'days', 'habits', 'meta', 'reflections', 'srbai']);
    await fill(db);
    expect(await listHabits(db)).toHaveLength(2);
    expect((await getActiveHabit(db))?.id).toBe('h1');
    expect(await getMeta(db, 'lastReviewedWeek')).toBe(week(1));
    expect(await getMeta(db, 'missing')).toBeUndefined();
    expect(await listReflections(db, 'h1')).toHaveLength(1);
  });

  it('one check-in per day: a second one replaces the first', async () => {
    const { db } = await freshDb();
    await putDayEntry(db, { habitId: 'h1', day: MON, result: 'no', recordedAt: '1' });
    await putDayEntry(db, { habitId: 'h1', day: MON, result: 'yes', recordedAt: '2' });
    expect((await loadRecords(db, 'h1')).days).toEqual([{ habitId: 'h1', day: MON, result: 'yes', recordedAt: '2' }]);
  });

  it('clearAll empties every store', async () => {
    const { db } = await freshDb();
    await fill(db);
    await clearAll(db);
    const file = await exportData(db);
    expect([file.habits, file.days, file.compensations, file.reflections, file.srbai, file.meta].every((l) => l.length === 0)).toBe(true);
  });
});

describe('export / import (Phase 2 acceptance)', () => {
  it('export -> delete -> import yields an identical TreeState', async () => {
    const now = at(addDays(week(2), 1), 21);
    const first = await freshDb();
    await fill(first.db);
    const before = computeTreeState(habit(), await loadRecords(first.db, 'h1'), now);
    expect(before.leaves).toBeGreaterThan(0);
    expect(before.litter).toBeGreaterThan(0);

    const json = JSON.stringify(await exportData(first.db, now));
    first.db.close();
    await deleteDB(first.name);

    const second = await openTreeDb(first.name);
    open.push(second);
    expect(await listHabits(second)).toEqual([]);
    const parsed = validateExport(JSON.parse(json));
    if (!parsed.ok) throw new Error(parsed.errors.join('\n'));
    await importData(second, parsed.data);

    const after = computeTreeState(habit(), await loadRecords(second, 'h1'), now);
    expect(after).toEqual(before);
    expect(await exportData(second, now)).toEqual(JSON.parse(json));
  });

  it('import replaces existing data completely', async () => {
    const { db } = await freshDb();
    await fill(db);
    await importData(db, { habits: [habit({ id: 'x' })], days: [], compensations: [], reflections: [], srbai: [], meta: [] });
    expect((await listHabits(db)).map((h) => h.id)).toEqual(['x']);
    expect((await loadRecords(db, 'h1')).days).toEqual([]);
  });

  it('the export file carries format and schema version', async () => {
    const { db } = await freshDb();
    const file = await exportData(db, new Date('2026-01-05T10:00:00Z'));
    expect(file).toMatchObject({ format: EXPORT_FORMAT, schemaVersion: 1, exportedAt: '2026-01-05T10:00:00.000Z' });
  });
});

describe('validateExport', () => {
  const valid = async () => {
    const { db } = await freshDb();
    await fill(db);
    return JSON.parse(JSON.stringify(await exportData(db))) as Record<string, unknown[]>;
  };
  const errorsOf = (input: unknown): string[] => {
    const r = validateExport(input);
    return r.ok ? [] : r.errors;
  };

  it('accepts a valid file', async () => {
    expect(validateExport(await valid()).ok).toBe(true);
  });

  it('rejects other files and bad versions', async () => {
    expect(errorsOf(null)).toEqual(['Keine Exportdatei des Gewohnheitsbaums.']);
    expect(errorsOf({ format: 'x' })).toEqual(['Keine Exportdatei des Gewohnheitsbaums.']);
    const f = await valid();
    expect(errorsOf({ ...f, schemaVersion: 0 })[0]).toMatch(/Schemaversion/);
    expect(errorsOf({ ...f, schemaVersion: 1.5 })[0]).toMatch(/Schemaversion/);
    expect(errorsOf({ ...f, schemaVersion: SCHEMA_VERSION + 1 })[0]).toMatch(/neueren App-Version/);
  });

  it('reports missing sections, invalid and duplicate records', async () => {
    const f = await valid();
    delete f.meta;
    const days = f.days ?? [];
    f.days = [...days, { ...(days[0] as object) }, { habitId: 'h1', day: '2026-02-30', result: 'yes', recordedAt: 'x' }];
    f.habits = [...(f.habits ?? []), 'nope'];
    const errors = errorsOf(f);
    expect(errors).toContain('Abschnitt „meta“ fehlt.');
    expect(errors.some((e) => /^days\[\d+\] ist doppelt\.$/.test(e))).toBe(true);
    expect(errors.some((e) => /^days\[\d+\] ist ungültig\.$/.test(e))).toBe(true);
    expect(errors).toContain('habits[2] ist ungültig.');
  });

  it('checks every record type', async () => {
    const bad: Record<string, unknown> = {
      habits: { ...habit(), type: 'other' },
      compensations: { id: 'c', habitId: 'h1', day: 'gestern', recordedAt: '' },
      reflections: { habitId: 'h1', day: MON, obstacles: ['laziness'], recordedAt: '' },
      srbai: { id: 's', habitId: 'h1', day: MON, items: [], recordedAt: '' },
      meta: { value: 1 },
    };
    for (const [store, record] of Object.entries(bad)) {
      const f = await valid();
      f[store] = [record];
      expect(errorsOf(f)).toContain(`${store}[0] ist ungültig.`);
    }
  });

  it('accepts optional fields in their valid forms', async () => {
    const f = await valid();
    f.habits = [habit({ type: 'quantity', target: 8000, unit: 'Schritte', ended: { day: MON, reason: 'grown', at: 'x' } })];
    f.reflections = [{ habitId: 'h1', day: MON, obstacles: [], recordedAt: 'x' }];
    f.days = [{ habitId: 'h1', day: MON, result: 'partial', amount: 5000, recordedAt: 'x' }];
    expect(validateExport(f).ok).toBe(true);
  });

  it('rejects records of unknown habits and more than one active habit', async () => {
    const f = await valid();
    f.habits = [habit(), habit({ id: 'h2' })];
    f.srbai = [{ id: 's', habitId: 'ghost', day: MON, items: [1], recordedAt: '' }];
    expect(errorsOf(f)).toEqual(['srbai[0] gehört zu keiner Gewohnheit.', 'Mehr als eine aktive Gewohnheit.']);
  });
});
