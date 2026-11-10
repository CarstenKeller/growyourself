/**
 * Start view. Placeholder until the check-in (Phase 4) and the tree (Phase 5)
 * exist: shows the leaf count and the habit as text (screen reader friendly).
 */
import type { Habit, TreeState } from '../domain/types';
import { h } from './dom';
import type { Lang, Texts } from './texts';

export function renderHome(root: HTMLElement, t: Texts, lang: Lang, habit: Habit, state: TreeState): void {
  const fmt = new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-GB');
  const criterion =
    habit.type === 'quantity' && habit.target !== undefined
      ? t.homeQuantityCriterion(fmt.format(habit.target), habit.unit ?? '')
      : habit.criterion;
  const intention = habit.firstIntention;

  root.replaceChildren(
    h('header', {}, h('h1', {}, habit.title), h('p', { class: 'counter' }, t.homeLeaves(state.leaves))),
    h('p', { class: 'lead' }, t.homePlanted),
    h('dl', { class: 'facts' },
      h('dt', {}, t.homeCriterion), h('dd', {}, criterion),
      h('dt', {}, t.homeCompensation), h('dd', {}, habit.compensation),
      intention ? h('dt', {}, t.homeIntention) : null,
      intention ? h('dd', {}, t.homeIntentionText(intention.if, intention.then)) : null),
    h('p', { class: 'hint' }, t.homeNext),
  );
}
