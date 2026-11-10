# growyourself – App-spezifische Designentscheidungen

Gilt **nur für diese App** und wird **nicht** ins allgemeine Register
übernommen. Ergänzt per Kommando `/da`. Allgemeine Entscheidungen stehen
in `design-decisions.md` (Kopie, Stand siehe `../SYNC.md`); bei
Widerspruch gilt in dieser App der Eintrag hier.

## Leitidee

Ruhig und verzeihend: "Konsequenz folgt verzeihend, nie vernichtend" (CLAUDE.md). Der wachsende Baum
ist das zentrale Bild; Texte ermutigen, ohne Wirksamkeit zu versprechen.

## Einträge

<!-- Format:
### A-xx: <Kurztitel>
- **Entscheidung:**
- **Begründung:**
- **Abweichung von:** <D-xx | – >
- **Quelle:** <wörtliche Vorgabe (/da) | abgeleitet aus …>, <Datum>
- **Status:** <bestätigt (Datum) | abgeleitet | ersetzt durch A-yy>
-->

### A-01: Web-App (PWA) statt Android/Compose
- **Entscheidung:** Vite + TypeScript ohne UI-Framework, Baum als generatives SVG, mobile first, am Desktop gut nutzbar.
- **Begründung:** Vorgabe in CLAUDE.md der App.
- **Abweichung von:** Umsetzungshinweise in D-01–D-05 und D-07 sind für Compose formuliert; ihr Inhalt gilt sinngemäß fürs Web (Icon + Tooltip/`aria-label`, Safe-Area-Insets, Darstellung Hell/Dunkel/System in `localStorage`/IndexedDB). D-03 (dynamische Android-Farben) entfällt.
- **Quelle:** abgeleitet aus CLAUDE.md, 2026-11-10
- **Status:** abgeleitet

### A-02: UI-Sprache
- **Entscheidung:** UI-Texte auf Deutsch, zentral in `src/ui/texts.ts`.
- **Abweichung von:** D-06 (Deutsch + Englisch) – **Widerspruch offen**, siehe Plan.md Abschnitt 5. Bis zur Klärung nur Deutsch, Texte aber so gebündelt, dass Englisch nachrüstbar ist.
- **Quelle:** CLAUDE.md ("UI-Texte auf Deutsch"), 2026-11-10
- **Status:** abgeleitet – Rückfrage offen

## Offene Designfragen dieser App

- [ ] Englisch zusätzlich (D-06) oder nur Deutsch (A-02)?
- [ ] App-Icon: derzeit Platzhalter; mit dem Baum aus Phase 5 ersetzen?
