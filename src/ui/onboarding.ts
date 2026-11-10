/**
 * Phase 3: plant a habit. One short form instead of several steps, so that the
 * run-through stays well under 2 minutes (Plan.md Phase 3).
 */
import type { DraftError, HabitDraft } from '../domain/habit';
import { showsHelpHint, validateDraft } from '../domain/habit';
import { PARAMS } from '../domain/params';
import type { HabitType } from '../domain/types';
import { h, uid } from './dom';
import type { Texts } from './texts';

type FieldName = 'title' | 'criterion' | 'target' | 'unit' | 'compensation' | 'intentionIf' | 'intentionThen';

const FIELD_OF_ERROR: Record<DraftError, FieldName[]> = {
  titleMissing: ['title'],
  criterionMissing: ['criterion'],
  targetInvalid: ['target'],
  unitMissing: ['unit'],
  compensationMissing: ['compensation'],
  intentionIncomplete: ['intentionIf', 'intentionThen'],
  tooLong: [],
};

export function renderOnboarding(
  root: HTMLElement,
  t: Texts,
  onSubmit: (draft: HabitDraft) => Promise<void>,
): void {
  const max = String(PARAMS.TEXT_MAX_LENGTH);
  const inputs = {} as Record<FieldName, HTMLInputElement>;
  const errorSlots = {} as Record<FieldName, HTMLElement>;

  const field = (name: FieldName, label: string, opts: { hint?: string; inputmode?: string } = {}) => {
    const id = uid(name);
    const errId = `${id}-err`;
    const hintId = opts.hint ? `${id}-hint` : undefined;
    const input = h('input', {
      id, name, type: 'text', maxlength: max, autocomplete: 'off', inputmode: opts.inputmode,
      'aria-describedby': [hintId, errId].filter(Boolean).join(' '),
    });
    inputs[name] = input;
    errorSlots[name] = h('p', { class: 'field-error', id: errId, 'aria-live': 'polite' });
    return h('div', { class: 'field' },
      h('label', { for: id }, label),
      opts.hint ? h('p', { class: 'hint', id: hintId }, opts.hint) : null,
      input, errorSlots[name]);
  };

  const typeOption = (type: HabitType, title: string, hint: string, checked: boolean) => {
    const id = uid('type');
    return h('div', { class: 'choice' },
      h('input', { type: 'radio', name: 'type', id, value: type, checked }),
      h('label', { for: id }, h('strong', {}, title), h('span', {}, hint)));
  };

  const criterionField = field('criterion', t.fieldCriterion);
  const targetField = field('target', t.fieldTarget, { inputmode: 'decimal' });
  const unitField = field('unit', t.fieldUnit);
  const quantityRow = h('div', { class: 'row' }, targetField, unitField);
  inputs.target.placeholder = t.fieldTargetPlaceholder;
  inputs.unit.placeholder = t.fieldUnitPlaceholder;

  const helpHint = h('aside', { class: 'notice', role: 'note' },
    h('strong', {}, t.helpHintTitle), ' ', t.helpHint);
  const summary = h('p', { class: 'form-error', role: 'alert' });
  const submit = h('button', { type: 'submit', class: 'primary' }, t.submit);

  const form = h('form', { novalidate: true },
    h('fieldset', { class: 'choices' },
      h('legend', {}, t.obTypeLegend),
      typeOption('quantity', t.typeQuantity, t.typeQuantityHint, false),
      typeOption('ritual', t.typeRitual, t.typeRitualHint, true),
      typeOption('abstinence', t.typeAbstinence, t.typeAbstinenceHint, false)),
    helpHint,
    field('title', t.fieldTitle),
    criterionField,
    quantityRow,
    field('compensation', t.fieldCompensation, { hint: t.fieldCompensationHint }),
    h('fieldset', { class: 'group' },
      h('legend', {}, t.intentionLegend),
      h('p', { class: 'hint' }, t.intentionHint),
      field('intentionIf', t.fieldIf),
      field('intentionThen', t.fieldThen)),
    summary,
    submit,
    h('p', { class: 'hint center' }, t.privacyNote));
  inputs.intentionIf.placeholder = t.fieldIfPlaceholder;
  inputs.intentionThen.placeholder = t.fieldThenPlaceholder;

  const currentType = (): HabitType =>
    ((form.querySelector('input[name="type"]:checked') as HTMLInputElement | null)?.value ?? 'ritual') as HabitType;

  const sync = () => {
    const type = currentType();
    const quantity = type === 'quantity';
    criterionField.hidden = quantity;
    quantityRow.hidden = !quantity;
    helpHint.hidden = !showsHelpHint(type);
    inputs.title.placeholder = t.fieldTitlePlaceholder[type];
    inputs.criterion.placeholder = t.fieldCriterionPlaceholder[type];
    inputs.compensation.placeholder = t.fieldCompensationPlaceholder[type];
  };
  form.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).name === 'type') sync();
  });
  sync();

  const draft = (): HabitDraft => ({
    type: currentType(),
    title: inputs.title.value,
    criterion: inputs.criterion.value,
    target: inputs.target.value,
    unit: inputs.unit.value,
    compensation: inputs.compensation.value,
    intentionIf: inputs.intentionIf.value,
    intentionThen: inputs.intentionThen.value,
  });

  const showErrors = (errors: DraftError[]) => {
    for (const name of Object.keys(inputs) as FieldName[]) {
      inputs[name].removeAttribute('aria-invalid');
      errorSlots[name].textContent = '';
    }
    let first: HTMLInputElement | undefined;
    for (const err of errors) {
      for (const name of FIELD_OF_ERROR[err]) {
        inputs[name].setAttribute('aria-invalid', 'true');
        errorSlots[name].textContent = t.errors[err];
        first ??= inputs[name];
      }
    }
    summary.textContent = errors.length === 0 ? '' : errors.includes('tooLong')
      ? t.errors.tooLong.replace('{max}', max)
      : t.errorSummary;
    first?.focus();
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = draft();
    const errors = validateDraft(d);
    showErrors(errors);
    if (errors.length > 0) return;
    submit.disabled = true;
    onSubmit(d).finally(() => {
      submit.disabled = false;
    });
  });

  root.replaceChildren(
    h('header', {}, h('h1', {}, t.obTitle), h('p', { class: 'lead' }, t.obIntro)),
    form,
  );
}
