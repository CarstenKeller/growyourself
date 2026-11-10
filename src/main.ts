import './ui/style.css';
import { TEXTS, pickLang } from './ui/texts';

const lang = pickLang(navigator.languages);
const texts = TEXTS[lang];
document.documentElement.lang = lang;
document.title = texts.appName;

// Phase 0: empty, installable shell. Screens follow in Phase 3+.
const app = document.querySelector<HTMLElement>('#app');
if (app) {
  const title = document.createElement('h1');
  title.textContent = texts.appName;
  const note = document.createElement('p');
  note.textContent = texts.shellNote;
  app.replaceChildren(title, note);
}
