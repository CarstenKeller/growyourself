/** Tiny DOM helpers. No framework (CLAUDE.md). */
import { icon, type IconName } from './icons';

type Attrs = Record<string, string | boolean | undefined>;
type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    el.setAttribute(name, value === true ? '' : value);
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c);
  }
  return el;
}

let counter = 0;
/** Unique id for label/input pairs. */
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** Design D-01: function button as icon with tooltip; the label doubles as accessible name. */
export function iconButton(name: IconName, label: string, onClick: () => void): HTMLButtonElement {
  const b = h('button', { type: 'button', class: 'icon-btn', 'aria-label': label, 'data-tip': label });
  b.append(icon(name));
  b.addEventListener('click', onClick);
  return b;
}

/** Group of radio buttons styled as segmented choice. */
export function radioGroup<V extends string>(
  name: string,
  legend: string,
  options: { value: V; label: string }[],
  selected: V | undefined,
  onChange?: (v: V) => void,
): { el: HTMLFieldSetElement; value: () => V | undefined } {
  const el = h('fieldset', { class: 'segmented' }, h('legend', {}, legend));
  const wrap = h('div', { class: 'segments' });
  for (const o of options) {
    const id = uid(name);
    const input = h('input', { type: 'radio', name, id, value: o.value, checked: o.value === selected });
    if (onChange) input.addEventListener('change', () => onChange(o.value));
    wrap.append(h('div', { class: 'segment' }, input, h('label', { for: id }, o.label)));
  }
  el.append(wrap);
  return {
    el,
    value: () => (el.querySelector('input:checked') as HTMLInputElement | null)?.value as V | undefined,
  };
}

/** Starts a file download of generated content. */
export function download(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
