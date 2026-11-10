/** Simple evaluation (Plan.md 2.8): descriptive numbers only, no interpretation. */
import { computeInsights } from '../domain/insights';
import { PARAMS } from '../domain/params';
import type { Ctx } from './app';
import { h } from './dom';

export function renderInsights(root: HTMLElement, ctx: Ctx): void {
  const { t, habit } = ctx;
  if (!habit) return;
  const ins = computeInsights(habit, ctx.records.days, ctx.reflections);
  if (!ins.ready) {
    root.replaceChildren(h('h1', {}, t.insTitle), h('p', { class: 'lead' }, t.insNotYet(ins.checkIns, PARAMS.INSIGHTS_MIN_CHECKINS)));
    return;
  }
  const obstacles = ins.obstacles.length > 0
    ? h('ol', { class: 'plain' }, ...ins.obstacles.map((o) => h('li', {}, `${t.obstacle[o.obstacle]}: ${o.count}`)))
    : h('p', { class: 'hint' }, t.insNoObstacles);
  const table = h('table', { class: 'data' },
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, ''), h('th', { scope: 'col' }, t.insSuccess), h('th', { scope: 'col' }, t.insMissed))),
    h('tbody', {}, ...ins.weekdays.map((w, i) => h('tr', {},
      h('th', { scope: 'row' }, t.insWeekdayNames[i] ?? ''), h('td', {}, String(w.success)), h('td', {}, String(w.missed))))));
  root.replaceChildren(
    h('h1', {}, t.insTitle),
    h('p', { class: 'hint' }, t.insNote),
    h('section', { class: 'card' }, h('h2', {}, t.insObstacles), obstacles),
    h('section', { class: 'card' }, h('h2', {}, t.insWeekdays), table),
    h('section', { class: 'card' }, h('h2', {}, t.insIntentions),
      h('p', {}, t.insIntentionsLine(ins.intentions.yes, ins.intentions.partial, ins.intentions.no))),
  );
}
