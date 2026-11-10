import './ui/style.css';
import { createHabit, type HabitDraft } from './domain/habit';
import { computeTreeState } from './domain/rules';
import { getActiveHabit, loadRecords, openTreeDb, startHabit, type Db } from './storage/db';
import { h } from './ui/dom';
import { renderHome } from './ui/home';
import { renderOnboarding } from './ui/onboarding';
import { TEXTS, pickLang } from './ui/texts';

// Design A-03: installable, but no automatic install hint from the browser.
window.addEventListener('beforeinstallprompt', (e) => e.preventDefault());

const lang = pickLang(navigator.languages);
const t = TEXTS[lang];
document.documentElement.lang = lang;
document.title = t.appName;

const root = document.querySelector<HTMLElement>('#app') as HTMLElement;

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] as number;
}

async function show(db: Db): Promise<void> {
  const habit = await getActiveHabit(db);
  if (habit) {
    const state = computeTreeState(habit, await loadRecords(db, habit.id), new Date());
    renderHome(root, t, lang, habit, state);
    return;
  }
  renderOnboarding(root, t, async (draft: HabitDraft) => {
    const created = createHabit(draft, { id: crypto.randomUUID(), seed: randomSeed(), now: new Date() });
    if (!(await startHabit(db, created))) {
      root.prepend(h('p', { class: 'form-error', role: 'alert' }, t.alreadyActive));
    }
    await show(db);
    window.scrollTo(0, 0);
  });
}

async function boot(): Promise<void> {
  root.replaceChildren(h('p', { class: 'hint' }, t.loading));
  try {
    await show(await openTreeDb());
  } catch (err) {
    console.error(err);
    root.replaceChildren(h('p', { class: 'form-error', role: 'alert' }, t.storageError));
  }
}

void boot();
