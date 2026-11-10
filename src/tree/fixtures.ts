/**
 * Scenarios of Phase 1 as fixtures for the tree test page (Plan.md Phase 5
 * acceptance) and for the automated check that the drawing matches the state.
 */
import { addDays } from '../domain/calendar';
import type { Answer, DayKey, Habit, HabitRecords } from '../domain/types';

const MON = '2026-01-05';
const week = (n: number): DayKey => addDays(MON, 7 * n);

export interface Fixture {
  name: { de: string; en: string };
  habit: Habit;
  records: HabitRecords;
  now: Date;
}

function at(day: DayKey, hour: number): Date {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, hour);
}

class R implements HabitRecords {
  days: HabitRecords['days'] = [];
  compensations: HabitRecords['compensations'] = [];
  srbai: HabitRecords['srbai'] = [];
  run(from: DayKey, n: number, result: Answer = 'yes'): this {
    for (let i = 0; i < n; i++) this.day(addDays(from, i), result);
    return this;
  }
  day(day: DayKey, result: Answer): this {
    this.days = this.days.filter((d) => d.day !== day);
    this.days.push({ habitId: 'f', day, result, recordedAt: `${day}T20:00:00Z` });
    return this;
  }
  comp(day: DayKey): this {
    this.compensations.push({ id: `c${this.compensations.length}`, habitId: 'f', day, recordedAt: `${day}T21:00:00Z` });
    return this;
  }
  unbalanced(n: number): this {
    return this.run(week(n), 7).day(addDays(week(n), 2), 'no');
  }
}

const habit: Habit = {
  id: 'f', type: 'ritual', title: 'Fixture', criterion: '-', compensation: '-',
  startDay: MON, seed: 20261110, createdAt: `${MON}T08:00:00Z`,
};

export const FIXTURES: Fixture[] = [
  { name: { de: 'Frisch gepflanzt (Startblatt)', en: 'Just planted (start leaf)' }, habit, records: new R(), now: at(MON, 21) },
  { name: { de: 'Perfekte Woche', en: 'Perfect week' }, habit, records: new R().run(MON, 7), now: at(week(1), 10) },
  { name: { de: '1 verpasster Tag mit Ausgleich', en: '1 missed day, made up' }, habit, records: new R().run(MON, 7).day(addDays(MON, 2), 'no').comp(addDays(MON, 3)), now: at(week(1), 10) },
  { name: { de: 'Offener Ausgleich in der laufenden Woche', en: 'Open make-up in the running week' }, habit, records: new R().run(MON, 3).day(addDays(MON, 3), 'no'), now: at(addDays(MON, 3), 22) },
  { name: { de: 'Unausgeglichene Woche (gebremst)', en: 'Unbalanced week (slowed)' }, habit, records: new R().unbalanced(0), now: at(week(1), 10) },
  { name: { de: '2 Wochen in Folge: Knospen (stagnierend)', en: '2 weeks in a row: buds (stagnating)' }, habit, records: new R().unbalanced(0).unbalanced(1).run(week(2), 2), now: at(addDays(week(2), 1), 22) },
  { name: { de: '3 Wochen in Folge (welkend)', en: '3 weeks in a row (wilting)' }, habit, records: new R().unbalanced(0).unbalanced(1).unbalanced(2), now: at(week(3), 10) },
  { name: { de: 'Erholung um eine Stufe', en: 'Recovery by one level' }, habit, records: new R().unbalanced(0).unbalanced(1).unbalanced(2).run(week(3), 7), now: at(week(4), 10) },
  { name: { de: 'Wind nach 7 Tagen', en: 'Wind after 7 days' }, habit, records: new R().unbalanced(0).run(week(1), 3), now: at(addDays(week(1), 2), 22) },
  { name: { de: 'Vergessener Check-in, noch nachtragbar', en: 'Forgotten check-in, can still be filled in' }, habit, records: new R().day(MON, 'yes'), now: at(addDays(MON, 2), 9) },
  { name: { de: 'Montag 00:30: Woche abgerechnet', en: 'Monday 00:30: week settled' }, habit, records: new R().run(MON, 6), now: new Date(2026, 0, 12, 0, 30) },
  { name: { de: 'Lange Gewohnheit (120 Tage)', en: 'Long habit (120 days)' }, habit, records: new R().run(MON, 119), now: at(addDays(MON, 119), 9) },
];
