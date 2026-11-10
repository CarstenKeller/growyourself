/**
 * Daily check-in with reflection (Plan.md 2.7, target ≤ 60 s). Only question 1
 * decides about the leaf; everything else is optional and never touches the tree.
 */
import { addDays } from '../domain/calendar';
import { intentionFor, quantityResult } from '../domain/checkin';
import { parseAmount } from '../domain/habit';
import { PARAMS } from '../domain/params';
import { canRecord } from '../domain/rules';
import type { Answer, DayKey, Obstacle, Reflection } from '../domain/types';
import { putDayEntry, putReflection } from '../storage/db';
import type { Ctx } from './app';
import { h, radioGroup, uid } from './dom';

const OBSTACLES: Obstacle[] = ['tired', 'stress', 'boredom', 'company', 'lackOfTime', 'place', 'other'];

/** "0" is a valid amount here (nothing done), unlike the target in the onboarding. */
function parseCount(raw: string): number | undefined {
  return raw.trim() === '0' ? 0 : parseAmount(raw);
}

export function renderCheckin(root: HTMLElement, ctx: Ctx): void {
  const { t, habit, state } = ctx;
  if (!habit || !state) return;
  const today = state.today;
  const candidates: { day: DayKey; label: string }[] = [
    { day: today, label: t.ciToday },
    { day: addDays(today, -1), label: t.ciYesterday },
    { day: addDays(today, -2), label: t.ciDayBefore },
  ].filter((c) => c.day >= habit.startDay && canRecord(c.day, ctx.now));
  const day = ctx.param ?? today;
  if (!candidates.some((c) => c.day === day)) {
    root.replaceChildren(h('h1', {}, t.ciTitle), h('p', { class: 'form-error' }, t.ciNotAllowed));
    return;
  }

  const entry = ctx.records.days.find((d) => d.day === day);
  const reflection = ctx.reflections.find((r) => r.day === day);
  const entered = new Set(ctx.records.days.map((d) => d.day));
  const plan = intentionFor(day, habit, ctx.reflections);
  const answers = (): { value: Answer; label: string }[] => [
    { value: 'yes', label: t.ciYes },
    { value: 'partial', label: t.ciPartial },
    { value: 'no', label: t.ciNo },
  ];

  const dayGroup = candidates.length > 1
    ? radioGroup('day', t.ciDay,
      candidates.map((c) => ({ value: c.day, label: entered.has(c.day) ? `${c.label} ✓` : c.label })),
      day, (v) => ctx.go('checkin', v))
    : null;

  // 1. Criterion — the only answer that counts for the tree.
  let amountInput: HTMLInputElement | undefined;
  let criterion: ReturnType<typeof radioGroup<Answer>> | undefined;
  let q1: HTMLElement;
  const q1Error = h('p', { class: 'field-error', 'aria-live': 'polite' });
  if (habit.type === 'quantity' && habit.target !== undefined) {
    const id = uid('amount');
    amountInput = h('input', {
      id, type: 'text', inputmode: 'decimal', autocomplete: 'off',
      value: entry?.amount !== undefined ? String(entry.amount) : '',
    });
    q1 = h('div', { class: 'field' }, h('label', { for: id }, t.ciAmount(habit.unit ?? '')), amountInput, q1Error);
  } else {
    criterion = radioGroup('criterion', t.ciCriterion, answers(), entry?.result, () => syncObstacles());
    q1 = h('div', {}, criterion.el, q1Error);
  }

  // 2. Yesterday's plan.
  const intentionGroup = plan ? radioGroup('intention', t.ciIntention, answers(), reflection?.intentionKept, () => syncObstacles()) : undefined;

  // 3. Obstacles, only after "partial"/"no".
  const chosen = new Set(reflection?.obstacles ?? []);
  const boxes = OBSTACLES.map((o) => {
    const id = uid('obs');
    const box = h('input', { type: 'checkbox', id, value: o, checked: chosen.has(o) });
    return { o, box, el: h('div', { class: 'check' }, box, h('label', { for: id }, t.obstacle[o])) };
  });
  const noteId = uid('note');
  const note = h('input', { id: noteId, type: 'text', maxlength: String(PARAMS.TEXT_MAX_LENGTH), value: reflection?.note ?? '' });
  const obstacles = h('fieldset', { class: 'group' },
    h('legend', {}, t.ciObstacles),
    h('div', { class: 'checks' }, ...boxes.map((b) => b.el)),
    h('div', { class: 'field' }, h('label', { for: noteId }, t.ciNote), note));

  const currentResult = (): Answer | undefined => {
    if (amountInput && habit.target !== undefined) {
      const n = parseCount(amountInput.value);
      return n === undefined ? undefined : quantityResult(n, habit.target);
    }
    return criterion?.value();
  };
  function syncObstacles(): void {
    const r = currentResult();
    const i = intentionGroup?.value();
    obstacles.hidden = !(r === 'partial' || r === 'no' || i === 'partial' || i === 'no');
  }
  amountInput?.addEventListener('input', syncObstacles);

  // 4. Plan for tomorrow, prefilled with the current plan so it can simply be kept.
  const next = reflection?.nextIntention ?? plan;
  const ifId = uid('if');
  const thenId = uid('then');
  const ifInput = h('input', { id: ifId, type: 'text', maxlength: String(PARAMS.TEXT_MAX_LENGTH), placeholder: t.fieldIfPlaceholder, value: next?.if ?? '' });
  const thenInput = h('input', { id: thenId, type: 'text', maxlength: String(PARAMS.TEXT_MAX_LENGTH), placeholder: t.fieldThenPlaceholder, value: next?.then ?? '' });
  const planError = h('p', { class: 'field-error', 'aria-live': 'polite' });

  const save = h('button', { type: 'submit', class: 'primary' }, t.ciSave);
  const form = h('form', { novalidate: true },
    dayGroup?.el ?? null,
    q1,
    plan && intentionGroup
      ? h('div', { class: 'plan-question' }, h('p', { class: 'quote' }, t.homeIntentionText(plan.if, plan.then)), intentionGroup.el)
      : null,
    obstacles,
    h('fieldset', { class: 'group' },
      h('legend', {}, t.ciNext),
      h('div', { class: 'field' }, h('label', { for: ifId }, t.fieldIf), ifInput),
      h('div', { class: 'field' }, h('label', { for: thenId }, t.fieldThen), thenInput),
      planError),
    h('p', { class: 'hint' }, t.ciReflectionNote),
    save);
  syncObstacles();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    q1Error.textContent = '';
    planError.textContent = '';
    const result = currentResult();
    if (!result) {
      q1Error.textContent = amountInput ? t.ciNeedAmount : t.ciNeedAnswer;
      (amountInput ?? form.querySelector<HTMLInputElement>('input[name="criterion"]'))?.focus();
      return;
    }
    const ifText = ifInput.value.trim();
    const thenText = thenInput.value.trim();
    if (!ifText !== !thenText) {
      planError.textContent = t.errors.intentionIncomplete;
      (ifText ? thenInput : ifInput).focus();
      return;
    }
    save.disabled = true;
    const recordedAt = new Date().toISOString();
    const amount = amountInput ? parseCount(amountInput.value) : undefined;
    await putDayEntry(ctx.db, { habitId: habit.id, day, result, ...(amount !== undefined ? { amount } : {}), recordedAt });
    const showObstacles = !obstacles.hidden;
    const kept = intentionGroup?.value();
    const noteText = note.value.trim();
    const refl: Reflection = {
      habitId: habit.id,
      day,
      obstacles: showObstacles ? boxes.filter((b) => b.box.checked).map((b) => b.o) : [],
      recordedAt,
      ...(kept ? { intentionKept: kept } : {}),
      ...(showObstacles && noteText ? { note: noteText } : {}),
      ...(ifText && thenText ? { nextIntention: { if: ifText, then: thenText } } : {}),
    };
    await putReflection(ctx.db, refl);
    ctx.go('home');
  });

  root.replaceChildren(h('h1', {}, t.ciTitle), h('p', { class: 'lead' }, habit.title), form);
}
