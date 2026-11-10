/**
 * IndexedDB (via idb). Only raw records are stored; TreeState is always derived.
 * Schema changes: raise SCHEMA_VERSION and append a step to MIGRATIONS (never edit old steps).
 */
import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction, type StoreNames } from 'idb';
import type { CompensationEntry, DayEntry, Habit, HabitRecords, Reflection, SrbaiAnswer } from '../domain/types';

export const DB_NAME = 'gewohnheitsbaum';
export const SCHEMA_VERSION = 1;

/** Small key/value records for app state that is not rule data (e.g. last shown weekly review, theme). */
export interface MetaRecord {
  key: string;
  value: unknown;
}

export interface TreeDb extends DBSchema {
  habits: { key: string; value: Habit };
  days: { key: [string, string]; value: DayEntry; indexes: { byHabit: string } };
  compensations: { key: string; value: CompensationEntry; indexes: { byHabit: string } };
  reflections: { key: [string, string]; value: Reflection; indexes: { byHabit: string } };
  srbai: { key: string; value: SrbaiAnswer; indexes: { byHabit: string } };
  meta: { key: string; value: MetaRecord };
}

export type Db = IDBPDatabase<TreeDb>;
export const STORES = ['habits', 'days', 'compensations', 'reflections', 'srbai', 'meta'] as const;
type UpgradeTx = IDBPTransaction<TreeDb, StoreNames<TreeDb>[], 'versionchange'>;

/** MIGRATIONS[i] upgrades the database from version i to i + 1. */
const MIGRATIONS: ((db: Db, tx: UpgradeTx) => void)[] = [
  (db) => {
    db.createObjectStore('habits', { keyPath: 'id' });
    db.createObjectStore('days', { keyPath: ['habitId', 'day'] }).createIndex('byHabit', 'habitId');
    db.createObjectStore('compensations', { keyPath: 'id' }).createIndex('byHabit', 'habitId');
    db.createObjectStore('reflections', { keyPath: ['habitId', 'day'] }).createIndex('byHabit', 'habitId');
    db.createObjectStore('srbai', { keyPath: 'id' }).createIndex('byHabit', 'habitId');
    db.createObjectStore('meta', { keyPath: 'key' });
  },
];

export function openTreeDb(name: string = DB_NAME): Promise<Db> {
  return openDB<TreeDb>(name, SCHEMA_VERSION, {
    upgrade(db, oldVersion, _newVersion, tx) {
      for (let v = oldVersion; v < SCHEMA_VERSION; v++) MIGRATIONS[v]?.(db, tx);
    },
  });
}

// ------------------------------------------------------------ repository

export async function putHabit(db: Db, habit: Habit): Promise<void> {
  await db.put('habits', habit);
}

export function listHabits(db: Db): Promise<Habit[]> {
  return db.getAll('habits');
}

/**
 * Stores a new habit only if no other habit is active (CLAUDE.md principle 1).
 * Check and write happen in one transaction. Returns false if blocked.
 */
export async function startHabit(db: Db, habit: Habit): Promise<boolean> {
  const tx = db.transaction('habits', 'readwrite');
  const all = await tx.store.getAll();
  if (all.some((h) => !h.ended)) {
    await tx.done;
    return false;
  }
  await tx.store.add(habit);
  await tx.done;
  return true;
}

/** The one active habit (not ended), if any (CLAUDE.md principle 1). */
export async function getActiveHabit(db: Db): Promise<Habit | undefined> {
  return (await listHabits(db)).find((h) => !h.ended);
}

/** Stores a check-in; a second one for the same day replaces the first. */
export async function putDayEntry(db: Db, entry: DayEntry): Promise<void> {
  await db.put('days', entry);
}

export async function addCompensation(db: Db, entry: CompensationEntry): Promise<void> {
  await db.put('compensations', entry);
}

export async function putReflection(db: Db, reflection: Reflection): Promise<void> {
  await db.put('reflections', reflection);
}

export async function addSrbai(db: Db, answer: SrbaiAnswer): Promise<void> {
  await db.put('srbai', answer);
}

export async function getMeta(db: Db, key: string): Promise<unknown> {
  return (await db.get('meta', key))?.value;
}

export async function setMeta(db: Db, key: string, value: unknown): Promise<void> {
  await db.put('meta', { key, value });
}

/** All records the rule engine needs for one habit. */
export async function loadRecords(db: Db, habitId: string): Promise<HabitRecords> {
  const [days, compensations, srbai] = await Promise.all([
    db.getAllFromIndex('days', 'byHabit', habitId),
    db.getAllFromIndex('compensations', 'byHabit', habitId),
    db.getAllFromIndex('srbai', 'byHabit', habitId),
  ]);
  return { days, compensations, srbai };
}

export function listReflections(db: Db, habitId: string): Promise<Reflection[]> {
  return db.getAllFromIndex('reflections', 'byHabit', habitId);
}

/** Deletes all data (all stores) in one transaction. */
export async function clearAll(db: Db): Promise<void> {
  const tx = db.transaction([...STORES], 'readwrite');
  await Promise.all([...STORES.map((s) => tx.objectStore(s).clear()), tx.done]);
}
