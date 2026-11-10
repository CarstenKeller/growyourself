import './ui/style.css';
import { createHabit, type HabitDraft } from './domain/habit';
import { openTreeDb, startHabit, type Db } from './storage/db';
import { loadCtx, parseRoute, renderHeader, type Ctx, type Route, type Screen } from './ui/app';
import { renderCheckin } from './ui/checkin';
import { h } from './ui/dom';
import { renderCelebrate, renderGarden } from './ui/garden';
import { renderHome } from './ui/home';
import { renderInsights } from './ui/insights';
import { renderOnboarding } from './ui/onboarding';
import { renderSettings } from './ui/settings';
import { renderSrbai } from './ui/srbai';
import { TEXTS, pickLang } from './ui/texts';
import { applyTheme, loadTheme } from './ui/theme';

// Design A-03: installable, but no automatic install hint from the browser.
window.addEventListener('beforeinstallprompt', (e) => e.preventDefault());

applyTheme(loadTheme());
const lang = pickLang(navigator.languages);
const t = TEXTS[lang];
document.documentElement.lang = lang;
document.title = t.appName;

const app = document.querySelector<HTMLElement>('#app') as HTMLElement;
const header = h('header', { class: 'topbar' });
const toast = h('p', { class: 'toast', role: 'status', 'aria-live': 'polite' });
const screen = h('div', { class: 'screen' });
app.replaceChildren(header, toast, screen);

const SCREENS: Record<Route, Screen> = {
  home: renderHome,
  checkin: renderCheckin,
  srbai: renderSrbai,
  celebrate: renderCelebrate,
  garden: renderGarden,
  insights: renderInsights,
  settings: renderSettings,
};

let db: Db;
let toastTimer: number | undefined;

function onboarding(ctx: Ctx): void {
  renderOnboarding(screen, t, async (draft: HabitDraft) => {
    const created = createHabit(draft, { id: crypto.randomUUID(), seed: crypto.getRandomValues(new Uint32Array(1))[0] as number, now: new Date() });
    if (!(await startHabit(db, created))) ctx.flash(t.alreadyActive);
    await render();
  });
}

async function render(): Promise<void> {
  const { route, param } = parseRoute(location.hash);
  const ctx = await loadCtx(db, {
    t, lang,
    go: (r, p) => {
      const target = r === 'home' ? '#' : `#${r}${p ? `/${p}` : ''}`;
      if (location.hash === target || (target === '#' && location.hash === '')) void render();
      else location.hash = target;
    },
    refresh: render,
    flash: (message) => {
      toast.textContent = message;
      toast.classList.add('show');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3500);
    },
  }, param);
  renderHeader(header, ctx, route);
  const needsHabit = route !== 'garden' && route !== 'settings';
  if (!ctx.habit && needsHabit) onboarding(ctx);
  else await SCREENS[route](screen, ctx);
  if (document.activeElement === document.body) screen.querySelector('h1')?.setAttribute('tabindex', '-1');
}

window.addEventListener('hashchange', () => {
  void render().then(() => {
    window.scrollTo(0, 0);
    screen.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  });
});

async function boot(): Promise<void> {
  screen.replaceChildren(h('p', { class: 'hint' }, t.loading));
  try {
    db = await openTreeDb();
  } catch (err) {
    console.error(err);
    screen.replaceChildren(h('p', { class: 'form-error', role: 'alert' }, t.storageError));
    return;
  }
  await render();
}

void boot();
