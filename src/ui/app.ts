/**
 * App shell: loads raw data, derives the state (never stored), routes by hash
 * so the browser's back button works, and renders header + screen.
 */
import { computeTreeState } from '../domain/rules';
import type { Habit, HabitRecords, Reflection, TreeState } from '../domain/types';
import { getActiveHabit, getMeta, listHabits, listReflections, loadRecords, type Db } from '../storage/db';
import { h, iconButton, radioGroup } from './dom';
import { loadTheme, saveTheme, type Theme } from './theme';
import type { Lang, Texts } from './texts';

export type Route = 'home' | 'checkin' | 'srbai' | 'celebrate' | 'garden' | 'insights' | 'settings';
const ROUTES: Route[] = ['home', 'checkin', 'srbai', 'celebrate', 'garden', 'insights', 'settings'];

/** What the app knows about the remembered tree view, to animate changes since the last visit. */
export interface LastSeen {
  habitId: string;
  leaves: number;
  litter: number;
  events: number;
}

export interface Ctx {
  db: Db;
  t: Texts;
  lang: Lang;
  now: Date;
  habits: Habit[];
  habit: Habit | undefined;
  records: HabitRecords;
  reflections: Reflection[];
  state: TreeState | undefined;
  lastReviewedWeek: string | undefined;
  lastSeen: LastSeen | undefined;
  /** Query part of the route, e.g. the day for a backfilled check-in (#checkin/2026-11-09). */
  param: string | undefined;
  go: (route: Route, param?: string) => void;
  refresh: () => Promise<void>;
  flash: (message: string) => void;
}

export type Screen = (root: HTMLElement, ctx: Ctx) => void | Promise<void>;

export function parseRoute(hash: string): { route: Route; param: string | undefined } {
  const [name, param] = hash.replace(/^#\/?/, '').split('/');
  const route = ROUTES.includes(name as Route) ? (name as Route) : 'home';
  return { route, param: param || undefined };
}

export async function loadCtx(db: Db, base: Pick<Ctx, 't' | 'lang' | 'go' | 'refresh' | 'flash'>, param: string | undefined): Promise<Ctx> {
  const now = new Date();
  const [habits, habit] = await Promise.all([listHabits(db), getActiveHabit(db)]);
  const records = habit ? await loadRecords(db, habit.id) : { days: [], compensations: [], srbai: [] };
  const reflections = habit ? await listReflections(db, habit.id) : [];
  const state = habit ? computeTreeState(habit, records, now) : undefined;
  return {
    ...base,
    db,
    now,
    habits,
    habit,
    records,
    reflections,
    state,
    lastReviewedWeek: (await getMeta(db, 'lastReviewedWeek')) as string | undefined,
    lastSeen: (await getMeta(db, 'lastSeen')) as LastSeen | undefined,
    param,
  };
}

function themeDialog(t: Texts): HTMLDialogElement {
  const labels: Record<Theme, string> = { light: t.themeLight, dark: t.themeDark, system: t.themeSystem };
  const group = radioGroup<Theme>(
    'theme',
    t.themeTitle,
    (['light', 'dark', 'system'] as Theme[]).map((v) => ({ value: v, label: labels[v] })),
    loadTheme(),
    (v) => saveTheme(v),
  );
  const dialog = h('dialog', { class: 'dialog', 'aria-label': t.themeTitle });
  const close = h('button', { type: 'button', class: 'secondary' }, t.close);
  close.addEventListener('click', () => dialog.close());
  dialog.append(group.el, close);
  dialog.addEventListener('close', () => dialog.remove());
  return dialog;
}

export function renderHeader(header: HTMLElement, ctx: Ctx, route: Route): void {
  const { t } = ctx;
  const left = route === 'home'
    ? h('span', { class: 'brand' }, t.appName)
    : iconButton('back', t.navBack, () => (history.length > 1 ? history.back() : ctx.go('home')));
  const nav = h('nav', { class: 'actions', 'aria-label': t.appName },
    iconButton('garden', t.navGarden, () => ctx.go('garden')),
    ctx.habit ? iconButton('insights', t.navInsights, () => ctx.go('insights')) : null,
    iconButton('theme', t.navTheme, () => {
      const d = themeDialog(t);
      document.body.append(d);
      d.showModal();
    }),
    iconButton('settings', t.navSettings, () => ctx.go('settings')));
  header.replaceChildren(left, nav);
}
