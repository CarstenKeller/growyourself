import './ui/style.css';
import { texts } from './ui/texts';

// Phase 0: empty, installable shell. Screens follow in Phase 3+.
const app = document.querySelector<HTMLElement>('#app');
if (app) {
  const title = document.createElement('h1');
  title.textContent = texts.appName;
  const note = document.createElement('p');
  note.textContent = texts.shellNote;
  app.replaceChildren(title, note);
}
