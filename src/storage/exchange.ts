/**
 * Export/import as JSON file (Plan.md 3: no sync, one main device, backup by file).
 * The file carries the schema version; older files are migrated, newer ones rejected.
 */
import { isDayKey } from '../domain/calendar';
import type { CompensationEntry, DayEntry, Habit, Reflection, SrbaiAnswer } from '../domain/types';
import { SCHEMA_VERSION, STORES, type Db, type MetaRecord } from './db';

export const EXPORT_FORMAT = 'gewohnheitsbaum-export';

export interface ExportData {
  habits: Habit[];
  days: DayEntry[];
  compensations: CompensationEntry[];
  reflections: Reflection[];
  srbai: SrbaiAnswer[];
  meta: MetaRecord[];
}

export interface ExportFile extends ExportData {
  format: typeof EXPORT_FORMAT;
  schemaVersion: number;
  exportedAt: string;
}

export async function exportData(db: Db, now: Date = new Date()): Promise<ExportFile> {
  const tx = db.transaction([...STORES], 'readonly');
  const [habits, days, compensations, reflections, srbai, meta] = await Promise.all([
    tx.objectStore('habits').getAll(),
    tx.objectStore('days').getAll(),
    tx.objectStore('compensations').getAll(),
    tx.objectStore('reflections').getAll(),
    tx.objectStore('srbai').getAll(),
    tx.objectStore('meta').getAll(),
  ]);
  await tx.done;
  return {
    format: EXPORT_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    habits,
    days,
    compensations,
    reflections,
    srbai,
    meta,
  };
}

// ------------------------------------------------------------ validation

export type ValidationResult = { ok: true; data: ExportData } | { ok: false; errors: string[] };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isOptStr = (v: unknown): boolean => v === undefined || isStr(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isAnswer = (v: unknown): boolean => v === 'yes' || v === 'partial' || v === 'no';
const OBSTACLES = ['tired', 'stress', 'boredom', 'company', 'lackOfTime', 'place', 'other'];

const checks: { [K in keyof ExportData]: (r: Obj) => boolean } = {
  habits: (r) =>
    isStr(r.id) &&
    (r.type === 'quantity' || r.type === 'ritual' || r.type === 'abstinence') &&
    isStr(r.title) &&
    isStr(r.criterion) &&
    (r.target === undefined || isNum(r.target)) &&
    isOptStr(r.unit) &&
    isStr(r.compensation) &&
    isDayKey(r.startDay) &&
    isNum(r.seed) &&
    isStr(r.createdAt) &&
    (r.ended === undefined ||
      (isObj(r.ended) &&
        isDayKey(r.ended.day) &&
        (r.ended.reason === 'grown' || r.ended.reason === 'dormant') &&
        isStr(r.ended.at))),
  days: (r) =>
    isStr(r.habitId) && isDayKey(r.day) && isAnswer(r.result) && (r.amount === undefined || isNum(r.amount)) && isStr(r.recordedAt),
  compensations: (r) => isStr(r.id) && isStr(r.habitId) && isDayKey(r.day) && isStr(r.recordedAt),
  reflections: (r) =>
    isStr(r.habitId) &&
    isDayKey(r.day) &&
    (r.intentionKept === undefined || isAnswer(r.intentionKept)) &&
    Array.isArray(r.obstacles) &&
    r.obstacles.every((o) => OBSTACLES.includes(o as string)) &&
    isOptStr(r.note) &&
    (r.nextIntention === undefined ||
      (isObj(r.nextIntention) && isStr(r.nextIntention.if) && isStr(r.nextIntention.then))) &&
    isStr(r.recordedAt),
  srbai: (r) =>
    isStr(r.id) &&
    isStr(r.habitId) &&
    isDayKey(r.day) &&
    Array.isArray(r.items) &&
    r.items.length > 0 &&
    r.items.every(isNum) &&
    isStr(r.recordedAt),
  meta: (r) => isStr(r.key),
};

const keyOf: { [K in keyof ExportData]: (r: Obj) => string } = {
  habits: (r) => String(r.id),
  days: (r) => `${String(r.habitId)}|${String(r.day)}`,
  compensations: (r) => String(r.id),
  reflections: (r) => `${String(r.habitId)}|${String(r.day)}`,
  srbai: (r) => String(r.id),
  meta: (r) => String(r.key),
};

/** Steps that convert export file content from version i to i + 1 (none yet). */
const FILE_MIGRATIONS: ((file: Obj) => Obj)[] = [];

/** Checks a parsed JSON file. Nothing is written; returns readable (German) error messages. */
export function validateExport(input: unknown): ValidationResult {
  if (!isObj(input) || input.format !== EXPORT_FORMAT) {
    return { ok: false, errors: ['Keine Exportdatei des Gewohnheitsbaums.'] };
  }
  const version = input.schemaVersion;
  if (!isNum(version) || !Number.isInteger(version) || version < 1) {
    return { ok: false, errors: ['Schemaversion fehlt oder ist ungültig.'] };
  }
  if (version > SCHEMA_VERSION) {
    return { ok: false, errors: [`Die Datei stammt aus einer neueren App-Version (Schema ${version}). Bitte die App aktualisieren.`] };
  }
  let file: Obj = input;
  for (let v = version; v < SCHEMA_VERSION; v++) file = (FILE_MIGRATIONS[v - 1] as (f: Obj) => Obj)(file);

  const errors: string[] = [];
  const data = {} as Record<keyof ExportData, unknown[]>;
  for (const store of STORES) {
    const list = file[store];
    if (!Array.isArray(list)) {
      errors.push(`Abschnitt „${store}“ fehlt.`);
      continue;
    }
    const seen = new Set<string>();
    list.forEach((r: unknown, i) => {
      if (!isObj(r) || !checks[store](r)) {
        errors.push(`${store}[${i}] ist ungültig.`);
        return;
      }
      const key = keyOf[store](r);
      if (seen.has(key)) errors.push(`${store}[${i}] ist doppelt.`);
      seen.add(key);
    });
    data[store] = list;
  }
  if (errors.length > 0) return { ok: false, errors };

  const result = data as unknown as ExportData;
  const habitIds = new Set(result.habits.map((h) => h.id));
  for (const store of ['days', 'compensations', 'reflections', 'srbai'] as const) {
    result[store].forEach((r, i) => {
      if (!habitIds.has(r.habitId)) errors.push(`${store}[${i}] gehört zu keiner Gewohnheit.`);
    });
  }
  if (result.habits.filter((h) => !h.ended).length > 1) {
    errors.push('Mehr als eine aktive Gewohnheit.');
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, data: result };
}

/**
 * Replaces all data with the content of a validated file, in a single
 * transaction: either everything is imported or nothing changes.
 */
export async function importData(db: Db, data: ExportData): Promise<void> {
  const tx = db.transaction([...STORES], 'readwrite');
  const ops: Promise<unknown>[] = STORES.map((s) => tx.objectStore(s).clear());
  for (const h of data.habits) ops.push(tx.objectStore('habits').put(h));
  for (const d of data.days) ops.push(tx.objectStore('days').put(d));
  for (const c of data.compensations) ops.push(tx.objectStore('compensations').put(c));
  for (const r of data.reflections) ops.push(tx.objectStore('reflections').put(r));
  for (const s of data.srbai) ops.push(tx.objectStore('srbai').put(s));
  for (const m of data.meta) ops.push(tx.objectStore('meta').put(m));
  await Promise.all([...ops, tx.done]);
}
