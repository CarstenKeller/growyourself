/** Fixture page (Plan.md Phase 5): every Phase 1 scenario with state, drawing and text. */
import './ui/style.css';
import { computeTreeState } from './domain/rules';
import { FIXTURES } from './tree/fixtures';
import { h } from './ui/dom';
import { treeFigure } from './ui/home';
import { TEXTS, pickLang } from './ui/texts';
import { applyTheme, loadTheme } from './ui/theme';

applyTheme(loadTheme());
const lang = pickLang(navigator.languages);
const t = TEXTS[lang];
const root = document.querySelector<HTMLElement>('#fixtures') as HTMLElement;
root.append(h('h1', {}, 'Baum-Testseite / Tree fixtures'));
const grid = h('div', { class: 'fixture-grid' });
for (const f of FIXTURES) {
  const s = computeTreeState(f.habit, f.records, f.now);
  grid.append(h('section', { class: 'card' },
    h('h2', {}, f.name[lang]),
    treeFigure(t, f.habit.seed, s),
    h('p', {}, t.treeLabel(s.leaves, s.buds, s.litter, t.status[s.status])),
    h('p', { class: 'hint' }, `leaves=${s.leaves} buds=${s.buds} litter=${s.litter} grownTotal=${s.grownTotal} status=${s.status} vitality=${s.vitality} openUnits=${s.openUnits} streak=${s.streak}`)));
}
root.append(grid);
