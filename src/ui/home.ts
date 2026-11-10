/**
 * Start view (Phases 4–7): plan for today, weekly review, tree, check-in,
 * compensation, SRBAI and completion hints.
 */
import { intentionFor } from '../domain/checkin';
import { PARAMS } from '../domain/params';
import { weekendOpenUnits, weeklyReviewDue } from '../domain/review';
import { canRecord } from '../domain/rules';
import type { TreeState, WeekSummary } from '../domain/types';
import { addCompensation, setMeta } from '../storage/db';
import { buildTree, renderTreeSvg } from '../tree/tree';
import type { Ctx, LastSeen } from './app';
import { h } from './dom';
import type { Texts } from './texts';

function card(cls: string, ...children: (Node | string | null)[]): HTMLElement {
  return h('section', { class: `card ${cls}` }, ...children);
}

export function treeFigure(t: Texts, seed: number, state: TreeState, anim: { newLeaves?: number; newLitter?: number; windCleared?: number } = {}): HTMLElement {
  const label = t.treeLabel(state.leaves, state.buds, state.litter, t.status[state.status]);
  const model = buildTree(seed, state);
  const fig = h('figure', { class: 'tree-figure' });
  fig.innerHTML = renderTreeSvg(model, { label, ...anim });
  if (model.hiddenLeaves > 0) fig.append(h('figcaption', { class: 'hint' }, t.hiddenLeaves(model.hiddenLeaves)));
  return fig;
}

function reviewCard(ctx: Ctx, w: WeekSummary): HTMLElement {
  const { t } = ctx;
  const ok = h('button', { type: 'button', class: 'primary' }, t.reviewOk);
  ok.addEventListener('click', async () => {
    await setMeta(ctx.db, 'lastReviewedWeek', w.weekStart);
    await ctx.refresh();
  });
  const status = w.statusDuring === w.statusAfter
    ? t.reviewStatusSame(t.status[w.statusAfter])
    : t.reviewStatus(t.status[w.statusDuring], t.status[w.statusAfter]);
  return card('review',
    h('h2', {}, t.reviewTitle),
    h('p', {}, w.balanced ? t.reviewBalanced : t.reviewUnbalanced),
    h('p', {}, t.reviewStats(w.successDays, w.compensatedDays, w.missedDays)),
    w.fallen > 0 ? h('p', {}, t.reviewFallen(w.fallen)) : null,
    w.budsExpired > 0 ? h('p', {}, t.reviewBudsExpired(w.budsExpired)) : null,
    w.windDay ? h('p', {}, t.reviewWind) : null,
    h('p', {}, status),
    h('p', { class: 'lead' }, w.balanced ? t.reviewEncourageGood : t.reviewEncourageBad),
    ok);
}

export async function renderHome(root: HTMLElement, ctx: Ctx): Promise<void> {
  const { t, habit, state } = ctx;
  if (!habit || !state) return;
  const today = state.today;
  const parts: (HTMLElement | null)[] = [];

  // Morning / on opening: the plan for today, prominently (Plan.md 2.7).
  const plan = intentionFor(today, habit, ctx.reflections);
  if (plan) {
    parts.push(card('intention', h('h2', {}, t.todayIntention), h('p', { class: 'big' }, t.homeIntentionText(plan.if, plan.then))));
  }

  // Weekly review, exactly once per week (Phase 6).
  const review = weeklyReviewDue(state, ctx.lastReviewedWeek);
  if (review) parts.push(reviewCard(ctx, review));

  // Completion (Phase 7).
  if (state.completion.ready) {
    const go = h('button', { type: 'button', class: 'primary' }, t.completionCta);
    go.addEventListener('click', () => ctx.go('celebrate'));
    parts.push(card('success', h('h2', {}, t.completionTitle), h('p', {}, t.completionText), go));
  } else if (state.srbaiDue) {
    const go = h('button', { type: 'button', class: 'primary' }, t.srbaiCta);
    go.addEventListener('click', () => ctx.go('srbai'));
    parts.push(card('srbai', h('h2', {}, t.srbaiDueTitle), h('p', {}, t.srbaiDueText), go));
  }

  // Animations since the last visit (Phase 5), only for the same habit.
  const seen = ctx.lastSeen?.habitId === habit.id ? ctx.lastSeen : undefined;
  const newEvents = seen ? state.events.slice(seen.events) : [];
  const windCleared = newEvents.reduce((sum, e) => sum + (e.kind === 'wind' ? e.cleared : 0), 0);
  const anim = seen
    ? {
        newLeaves: Math.max(0, state.leaves - seen.leaves),
        newLitter: Math.max(0, state.litter - seen.litter),
        windCleared,
      }
    : {};
  if (windCleared > 0) parts.push(card('wind', h('p', { role: 'status' }, t.windText)));

  // Tree with counter and text description (screen reader: aria-label of the image).
  parts.push(
    h('div', { class: 'tree-block' },
      treeFigure(t, habit.seed, state, anim),
      h('p', { class: 'counter' }, t.homeLeaves(state.leaves),
        h('span', { class: `status status-${state.status}` }, t.status[state.status])),
      t.statusHint[state.status] ? h('p', { class: 'hint' }, t.statusHint[state.status]) : null,
      h('p', { class: 'hint' }, t.completionNeedLeaves(state.leaves, PARAMS.MIN_LEAVES))),
  );

  // Check-in for today, backfill of forgotten days (Phase 4).
  const todayStatus = state.days.at(-1)?.day === today ? state.days.at(-1)?.status : undefined;
  const doneToday = todayStatus !== undefined && todayStatus !== 'pending';
  const ci = h('button', { type: 'button', class: doneToday ? 'secondary' : 'primary' }, doneToday ? t.checkinEdit : t.checkinCta);
  ci.addEventListener('click', () => ctx.go('checkin', today));
  const backfill = state.days.filter((d) => d.status === 'pending' && d.day !== today && canRecord(d.day, ctx.now));
  const firstBackfill = backfill[0];
  const fill = firstBackfill ? h('button', { type: 'button', class: 'link' }, t.backfillCta) : null;
  fill?.addEventListener('click', () => ctx.go('checkin', firstBackfill?.day));
  parts.push(card('checkin',
    doneToday ? h('p', {}, t.checkinDone) : null,
    ci,
    backfill.length > 0 ? h('p', { class: 'hint' }, t.pendingDays(backfill.length), ' ', fill) : null));

  // Open compensation units (Plan.md 2.3.3) and weekend hint (Phase 6).
  if (state.openUnits > 0) {
    const weekend = weekendOpenUnits(state);
    const done = h('button', { type: 'button', class: 'primary' }, t.compensationDone);
    done.addEventListener('click', async () => {
      done.disabled = true;
      await addCompensation(ctx.db, { id: crypto.randomUUID(), habitId: habit.id, day: today, recordedAt: new Date().toISOString() });
      ctx.flash(t.compensationSaved);
      await ctx.refresh();
    });
    parts.push(card(weekend > 0 ? 'open weekend' : 'open',
      h('h2', {}, t.openUnits(state.openUnits)),
      weekend > 0 ? h('p', { class: 'strong' }, t.weekendHint(weekend)) : null,
      h('p', {}, t.openUnitsHint, ' ', h('strong', {}, habit.compensation)),
      done));
  }

  root.replaceChildren(h('h1', {}, habit.title), ...parts.filter((p): p is HTMLElement => p !== null));

  const lastSeen: LastSeen = { habitId: habit.id, leaves: state.leaves, litter: state.litter, events: state.events.length };
  await setMeta(ctx.db, 'lastSeen', lastSeen);
}
