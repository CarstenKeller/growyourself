/** Settings: calendar reminders (Phase 8), data export/import, ending the habit, privacy (Phase 9). */
import { buildIcs, isTime } from '../domain/ics';
import { PARAMS } from '../domain/params';
import { putHabit } from '../storage/db';
import { exportData, importData, validateExport } from '../storage/exchange';
import type { Ctx } from './app';
import { download, h, uid } from './dom';

function timeField(label: string, value: string): { el: HTMLElement; input: HTMLInputElement } {
  const id = uid('time');
  const input = h('input', { id, type: 'time', value, required: true });
  return { el: h('div', { class: 'field' }, h('label', { for: id }, label), input), input };
}

export function renderSettings(root: HTMLElement, ctx: Ctx): void {
  const { t, habit, state } = ctx;
  const sections: HTMLElement[] = [];

  if (habit && state) {
    const checkin = timeField(t.setCheckinTime, PARAMS.ICS_DEFAULT_CHECKIN);
    const morning = timeField(t.setMorningTime, PARAMS.ICS_DEFAULT_MORNING);
    const ics = h('button', { type: 'button', class: 'primary' }, t.setIcsCta);
    ics.addEventListener('click', () => {
      const ci = isTime(checkin.input.value) ? checkin.input.value : PARAMS.ICS_DEFAULT_CHECKIN;
      const mo = isTime(morning.input.value) ? morning.input.value : PARAMS.ICS_DEFAULT_MORNING;
      const content = buildIcs([
        { uid: `checkin-${habit.id}@gewohnheitsbaum`, time: ci, summary: t.icsCheckinTitle(habit.title), description: t.icsCheckinText },
        { uid: `morning-${habit.id}@gewohnheitsbaum`, time: mo, summary: t.icsMorningTitle(habit.title), description: t.icsMorningText },
      ], state.today, new Date());
      download('gewohnheitsbaum.ics', content, 'text/calendar;charset=utf-8');
    });
    sections.push(h('section', { class: 'card' },
      h('h2', {}, t.setReminders), h('p', { class: 'hint' }, t.setRemindersHint),
      h('div', { class: 'row' }, checkin.el, morning.el), ics));
  }

  // Export / import (Plan.md 3: one main device, backup by file).
  const exp = h('button', { type: 'button', class: 'secondary' }, t.setExport);
  exp.addEventListener('click', async () => {
    const file = await exportData(ctx.db);
    download(`gewohnheitsbaum-${file.exportedAt.slice(0, 10)}.json`, JSON.stringify(file, null, 2), 'application/json');
  });
  const fileId = uid('import');
  const fileInput = h('input', { id: fileId, type: 'file', accept: 'application/json,.json', class: 'visually-hidden' });
  const imp = h('label', { for: fileId, class: 'button secondary' }, t.setImport);
  const msg = h('p', { role: 'status', class: 'hint' });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    fileInput.value = '';
    if (!f) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await f.text());
    } catch {
      parsed = null;
    }
    const result = validateExport(parsed);
    if (!result.ok) {
      msg.textContent = `${t.setImportError} ${result.errors.slice(0, 5).join(' ')}`;
      return;
    }
    if (!confirm(t.setImportConfirm)) return;
    await importData(ctx.db, result.data);
    ctx.flash(t.setImportDone);
    ctx.go('home');
  });
  sections.push(h('section', { class: 'card' },
    h('h2', {}, t.setData), h('p', { class: 'hint' }, t.setDataHint),
    h('div', { class: 'buttons' }, exp, imp, fileInput), msg));

  // Deliberate stop (Plan.md 2.6): archived as dormant, never deleted.
  if (habit && state) {
    const start = h('button', { type: 'button', class: 'danger' }, t.setEndCta);
    const confirmBox = h('div', { class: 'confirm', hidden: true },
      h('p', { class: 'strong' }, t.setEndConfirm));
    const yes = h('button', { type: 'button', class: 'danger' }, t.setEndYes);
    const no = h('button', { type: 'button', class: 'secondary' }, t.setEndNo);
    confirmBox.append(h('div', { class: 'buttons' }, yes, no));
    start.addEventListener('click', () => {
      confirmBox.hidden = false;
      start.hidden = true;
      no.focus();
    });
    no.addEventListener('click', () => {
      confirmBox.hidden = true;
      start.hidden = false;
      start.focus();
    });
    yes.addEventListener('click', async () => {
      yes.disabled = true;
      await putHabit(ctx.db, { ...habit, ended: { day: state.today, reason: 'dormant', at: new Date().toISOString() } });
      ctx.go('garden');
    });
    sections.push(h('section', { class: 'card' },
      h('h2', {}, t.setEnd), h('p', { class: 'hint' }, t.setEndHint), start, confirmBox));
  }

  sections.push(
    h('section', { class: 'card' }, h('h2', {}, t.setPrivacy), h('p', {}, t.setPrivacyText)),
    h('section', { class: 'card' }, h('h2', {}, t.setHelp), h('p', {}, t.setHelpText)),
  );
  root.replaceChildren(h('h1', {}, t.setTitle), ...sections);
}
