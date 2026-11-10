/** SRBAI self-assessment (Plan.md 2.6), asked weekly from SRBAI_START_LEAVES on. */
import { PARAMS } from '../domain/params';
import { addSrbai } from '../storage/db';
import type { Ctx } from './app';
import { h, uid } from './dom';

export function renderSrbai(root: HTMLElement, ctx: Ctx): void {
  const { t, habit, state } = ctx;
  if (!habit || !state) return;
  const values: number[] = [];
  for (let v = PARAMS.SRBAI_SCALE_MIN; v <= PARAMS.SRBAI_SCALE_MAX; v++) values.push(v);

  const items = t.srbaiItems.slice(0, PARAMS.SRBAI_ITEM_COUNT).map((text, i) => {
    const name = `srbai-${i}`;
    const scale = h('div', { class: 'scale' });
    for (const v of values) {
      const id = uid(name);
      scale.append(h('div', { class: 'scale-point' },
        h('input', { type: 'radio', name, id, value: String(v) }),
        h('label', { for: id }, String(v))));
    }
    return h('fieldset', { class: 'group srbai-item' },
      h('legend', {}, text),
      scale);
  });
  const error = h('p', { class: 'form-error', role: 'alert' });
  const save = h('button', { type: 'submit', class: 'primary' }, t.srbaiSave);
  const form = h('form', { novalidate: true },
    h('p', { class: 'lead' }, t.srbaiIntro(habit.title)),
    h('p', { class: 'hint' }, `${PARAMS.SRBAI_SCALE_MIN} = ${t.srbaiLow}, ${PARAMS.SRBAI_SCALE_MAX} = ${t.srbaiHigh}`),
    ...items, error, save,
    h('p', { class: 'hint' }, t.srbaiSource));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const answers = items.map((_, i) => form.querySelector<HTMLInputElement>(`input[name="srbai-${i}"]:checked`)?.value);
    if (answers.some((a) => a === undefined)) {
      error.textContent = t.srbaiNeedAll;
      return;
    }
    save.disabled = true;
    await addSrbai(ctx.db, {
      id: crypto.randomUUID(), habitId: habit.id, day: state.today,
      items: answers.map(Number), recordedAt: new Date().toISOString(),
    });
    ctx.go('home');
  });
  root.replaceChildren(h('h1', {}, t.srbaiTitle), form);
}
