/** Completion celebration and "Mein Garten" (Plan.md 2.6, Phase 7). */
import { daysBetween } from '../domain/calendar';
import { computeTreeState } from '../domain/rules';
import type { Habit } from '../domain/types';
import { loadRecords, putHabit } from '../storage/db';
import type { Ctx } from './app';
import { h } from './dom';
import { treeFigure } from './home';

/** Days from start to end, both included. */
export function durationDays(h0: Habit, endDay: string): number {
  return daysBetween(h0.startDay, endDay) + 1;
}

export function renderCelebrate(root: HTMLElement, ctx: Ctx): void {
  const { t, habit, state } = ctx;
  if (!habit || !state || !state.completion.ready) {
    ctx.go('home');
    return;
  }
  const go = h('button', { type: 'button', class: 'primary' }, t.celebrateCta);
  go.addEventListener('click', async () => {
    go.disabled = true;
    await putHabit(ctx.db, { ...habit, ended: { day: state.today, reason: 'grown', at: new Date().toISOString() } });
    ctx.go('garden');
  });
  root.replaceChildren(
    h('div', { class: 'celebrate' },
      h('h1', {}, t.celebrateTitle),
      treeFigure(t, habit.seed, state),
      h('p', { class: 'big' }, t.celebrateText(habit.title, durationDays(habit, state.today), state.leaves)),
      h('p', { class: 'lead' }, t.celebrateNext),
      go),
  );
}

export async function renderGarden(root: HTMLElement, ctx: Ctx): Promise<void> {
  const { t } = ctx;
  const trees = [...ctx.habits].sort((a, b) => (a.startDay < b.startDay ? 1 : -1));
  const items: HTMLElement[] = [];
  for (const habit of trees) {
    const state = computeTreeState(habit, await loadRecords(ctx.db, habit.id), ctx.now);
    const kind = habit.ended ? (habit.ended.reason === 'grown' ? t.gardenGrown : t.gardenDormant) : t.gardenActive;
    items.push(h('li', { class: 'garden-item' },
      treeFigure(t, habit.seed, state),
      h('div', {},
        h('h2', {}, habit.title),
        h('p', { class: `tag ${habit.ended?.reason ?? 'active'}` }, kind),
        h('p', { class: 'hint' }, t.gardenDetail(durationDays(habit, state.today), state.leaves)))));
  }
  root.replaceChildren(
    h('h1', {}, t.gardenTitle),
    items.length > 0 ? h('ul', { class: 'garden' }, ...items) : h('p', { class: 'lead' }, t.gardenEmpty),
  );
}
