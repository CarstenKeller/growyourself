/** Tiny DOM helper: h('p', { class: 'x' }, 'text', child). No framework (CLAUDE.md). */
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
