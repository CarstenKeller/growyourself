# CLAUDE.md – Gewohnheitsbaum (Arbeitstitel)

## Worum es geht
Web-App (PWA), die hilft, **genau eine** Gewohnheit zur Zeit zu etablieren oder abzulegen.
Fortschritt wird als wachsender Baum dargestellt: Jeder erfolgreiche Tag = ein Blatt.
Rückfälle lassen Blätter welken und fallen; Konsequenz folgt verzeihend, nie vernichtend.
Fachkonzept, Regelwerk und Umsetzungsphasen stehen in **Plan.md** – vor jeder Aufgabe lesen.

## Leitprinzipien (nicht verhandelbar ohne Rückfrage)
1. **Eine aktive Gewohnheit.** Nächste wird erst nach Abschluss oder bewusstem Abbruch frei.
2. **Verzeihen statt Bestrafen.** Kein Totalverlust, kein Streak-Reset auf null. Jede Verschlechterung ist durch eigenes Verhalten umkehrbar.
3. **Konsequenz stärkt das Zielverhalten.** Ausgleich für verpasste Tage ist eine zur Gewohnheit passende Handlung (z. B. 1 km extra gehen).
4. **Vergesslichkeit ≠ Fehlverhalten.** Ein verpasster Check-in darf nachgetragen werden und kostet kein Blatt.
5. **Lokal und privat.** Alle Daten nur im Browser (IndexedDB). Kein Server, kein Tracking, keine Analytics, keine externen Requests zur Laufzeit.
6. **Abschluss nach Automatik, nicht nach Kalender.** Mindestlaufzeit + Selbsteinschätzung (SRBAI), siehe Plan.md.
7. **Keine Therapie-Versprechen.** Bei Suchtverhalten (z. B. Rauchen) Hinweis auf professionelle Hilfe.

## Tech-Stack
- Vite + TypeScript (strict), **kein UI-Framework** (wenige Screens; bei Bedarf Rückfrage vor Einführung)
- IndexedDB über `idb`
- PWA über `vite-plugin-pwa` (installierbar, offlinefähig)
- Baum als generatives **SVG** (deterministisch aus Seed + Zustand)
- Tests: Vitest; Regel-Engine muss vollständig testabgedeckt sein
- Deployment: statisch, GitHub Pages via GitHub Actions

## Befehle
```bash
npm install
npm run dev        # Entwicklungsserver
npm run test       # Vitest
npm run build      # Produktions-Build
npm run lint       # ESLint + tsc --noEmit
```

## Architektur
```
src/
  domain/       # reine Funktionen, KEIN DOM, KEIN IndexedDB-Zugriff
    types.ts    # Habit, DayEntry, Compensation, Reflection, ...
    rules.ts    # Regel-Engine: berechnet TreeState aus Einträgen
    calendar.ts # Tagesgrenze, ISO-Wochen, Zeitzone
    params.ts   # alle Schwellenwerte zentral (siehe Plan.md)
  storage/      # IndexedDB, Schema-Versionierung, Export/Import
  tree/         # SVG-Rendering aus TreeState
  ui/           # Screens und Komponenten (Vanilla TS)
  main.ts
tests/          # Szenario-Tests der Regel-Engine
```

### Kernidee: Zustand wird abgeleitet, nicht gespeichert
- Gespeichert werden nur **Rohdaten** (Tageseinträge, Ausgleichshandlungen, Reflexionen, SRBAI-Antworten).
- `TreeState` (Blätter, Laub am Boden, Knospen, Vitalität, Status) wird bei jedem Öffnen von `rules.ts` **vollständig neu berechnet**.
- Dadurch: Nachträge sind trivial, Regeländerungen wirken rückwirkend konsistent, Bugs sind reproduzierbar.
- Wochenabrechnung passiert beim Öffnen der App (kein Hintergrundprozess vorhanden).

## Konventionen
- UI-Texte auf **Deutsch**, Code und Bezeichner auf Englisch.
- Alle Zahlenwerte (42 Blätter, 7 Tage Wind, Tagesgrenze 03:00 …) ausschließlich in `params.ts`.
- Jede Regeländerung braucht zuerst einen fehlschlagenden Szenario-Test.
- Datenschema versioniert; jede Änderung mit Migration.
- Barrierearm: Tastaturbedienung, ausreichende Kontraste, Baumzustand auch als Text (Screenreader).
- Mobile first, muss aber am Desktop (Arbeits-PC in der Pause) gut aussehen.

## Was du NICHT tun sollst
- Keine Server-Komponente, kein Login, keine Cloud-Synchronisation (später ggf. OneAppAhead – nicht vorgreifen).
- Keine Abhängigkeiten ohne Begründung hinzufügen.
- Keine Regeln eigenmächtig „verbessern“; bei Widersprüchen oder Lücken im Regelwerk nachfragen und in Plan.md unter „Offene Fragen“ notieren.
- Keine medizinischen oder psychologischen Wirksamkeitsversprechen in UI-Texten.

## Arbeitsweise
- Phasen aus Plan.md der Reihe nach umsetzen; Phase erst abschließen, wenn ihre Abnahmekriterien erfüllt sind.
- Nach jeder Phase: Tests grün, Build läuft, Häkchen in Plan.md setzen, kurze Notiz unter „Fortschritt“.
