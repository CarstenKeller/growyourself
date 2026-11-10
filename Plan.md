# Plan.md – Gewohnheitsbaum (Arbeitstitel)

## 1. Ziel und Abgrenzung

**Ziel:** Eine Gewohnheit zur Zeit so lange begleiten, bis sie sich automatisch anfühlt.
**MVP:** Ein Baum, eine aktive Gewohnheit, lokale Daten, Abend-Check-in mit Reflexion.
**Später (nicht im MVP):** Garten als Visualisierung abgeschlossener Bäume, virtuelles Lebewesen als alternative Metapher, Synchronisation über OneAppAhead, Web-Push.

### Fachlicher Hintergrund (Begründung der Parameter)
- Gewohnheitsbildung dauert stark unterschiedlich lange: Lally et al. (2010): Median 66 Tage, Spanne 18–254; Systematisches Review Singh et al. (2024): Mediane 59–66 Tage, Einzelwerte 4–335. → **Kein fixes Enddatum**, sondern Mindestlaufzeit + Automatik-Selbsteinschätzung.
- Einzelne ausgelassene Tage beeinträchtigten die Gewohnheitsbildung bei Lally et al. nicht nennenswert. → **Verzeihende Mechanik**, kein Streak-Reset.
- Wenn-dann-Pläne (Implementation Intentions, Gollwitzer) sind gut untersucht. → Vorhaben für morgen als Wenn-dann-Satz.
- Die 42 Blätter als Mindestwert sind eine **gesetzte Annahme**, kein Forschungswert. Gleiches gilt für Wind nach 7 Tagen.

## 2. Regelwerk

### 2.1 Begriffe
| Begriff | Bedeutung |
|---|---|
| Gewohnheit | Genau eine aktive. Typ: `menge`, `ritual` oder `verzicht` |
| Tageskriterium | Was ein erfolgreicher Tag ist (z. B. ≥ 8.000 Schritte; 5 Min. Tagesplanung; kein Doom-Scrolling nach 21 Uhr) |
| Ausgleichshandlung | Pro Gewohnheit festgelegt, stärkt das Zielverhalten (z. B. 1 km extra gehen; 15 Min. lesen) |
| Tag | Kalendertag mit Tagesgrenze `DAY_CUTOFF` (Standard 03:00 lokale Zeit) |
| Woche | ISO-Woche, Montag–Sonntag. Die alte Woche ist ab Montag 00:00 (`WEEK_CUTOFF`) vorbei – unabhängig von der Tagesgrenze 03:00 (entschieden 2026-11-10) |

### 2.2 Gewohnheitstypen
- **menge:** Tageskriterium ist ein Zahlenwert. Ausgleich = festgelegte Extra-Menge.
- **ritual:** Tägliche Handlung (z. B. Planung für morgen). Nicht nachholbar; Ausgleich = Ersatzhandlung.
- **verzicht:** Abgewöhnen. Nicht nachholbar; Ausgleich = Ersatzverhalten.
Für alle Typen gilt dieselbe Mechanik: Jeder verpasste Tag erzeugt **eine offene Ausgleichseinheit**.

### 2.3 Tagesebene
0. Anlegen der Gewohnheit → **erstes Blatt** (`START_LEAVES` = 1) für den ersten wichtigen Schritt, mit der App aktiv zu werden. Es zählt zum Blattzähler und fällt nie (entschieden 2026-11-10; Details siehe Offene Fragen 16).
1. Tag erfolgreich → **+1 Blatt**.
2. Tag verpasst → kein Blatt, 1 offene Ausgleichseinheit.
3. Ausgleichseinheit erledigt (bis Sonntag derselben Woche) → verpasster Tag wird nachträglich zum Blatt. Sie gilt nur für verpasste Tage am selben Tag oder davor – **Vorarbeiten zählt nicht** (2026-11-10); überzählige Einheiten verfallen.
4. Check-in vergessen → Nachtrag bis `CHECKIN_BACKFILL_DAYS` (Standard 2) Tage zurück möglich, nur innerhalb noch nicht abgerechneter Wochen. Vergessen kostet kein Blatt.
5. Check-in nicht rechtzeitig nachgetragen → zählt **wie ein verpasster Tag** (offene Ausgleichseinheit, ausgleichbar bis Sonntag). „Urlaub gibt es nicht“: Auch eine Woche ganz ohne Einträge ist unausgeglichen (2026-11-10).

### 2.4 Wochenebene (Abrechnung beim ersten App-Öffnen nach Sonntag)
- **Ausgeglichene Woche:** Keine offenen Ausgleichseinheiten.
- **Unausgeglichene Woche:** Die Blätter **dieser Woche** welken und fallen als Laub zu Boden (fehlen im Blattzähler). Offene Einheiten verfallen – keine Schuld in die Folgewoche.
- **Status-Stufen** (pro unausgeglichener Woche in Folge eine Stufe abwärts):
  1. `gesund` – normales Wachstum
  2. `gebremst` – nach 1 unausgeglichenen Woche (Blätter fallen wie oben)
  3. `stagnierend` – nach 2 in Folge: erfolgreiche Tage erzeugen nur **Knospen**; sie öffnen sich zu Blättern, wenn die Woche ausgeglichen endet. Endet sie unausgeglichen, fallen die Knospen **nicht** als Laub – nur verwelkte Blätter fallen zu Boden; die Knospen vergehen (2026-11-10)
  4. `welkend` – nach 3 in Folge: zusätzlich sinkt die sichtbare Vitalität (Farbe, Haltung)
- **Erholung:** Jede ausgeglichene Woche hebt den Status um `RECOVERY_STEP` Stufen (Standard 1).
- Welken kostet **keine** Wachstumsstufen der Baumstruktur, nur Vitalität und die Blätter der betroffenen Wochen.

### 2.5 Wind
Nach `WIND_STREAK` (Standard 7) erfolgreichen Tagen in Folge weht der Wind das Laub vom Boden. Nachgeholte Tage zählen als erfolgreich. Wind hat eine kurze Animation und einen positiven Text („Du bist wieder im Reinen“).

### 2.6 Abschluss
Alle Bedingungen gleichzeitig:
- Blätter am Baum ≥ `MIN_LEAVES` (Standard 42)
- SRBAI-Selbsteinschätzung ≥ `SRBAI_THRESHOLD`
- Kein Laub am Boden, Status `gesund`

SRBAI (Self-Report Behavioural Automaticity Index, Gardner et al. 2012): vier Aussagen zur Automatik. Wird ab `SRBAI_START_LEAVES` (Standard 35) wöchentlich abgefragt. **Originalwortlaut, Skala und deutsche Übersetzung vor Umsetzung aus der Quelle prüfen** – nicht aus dem Gedächtnis übernehmen.

Nach Abschluss: Baum wird als „ausgewachsen“ archiviert (MVP: Liste „Mein Garten“), nächste Gewohnheit wird frei.
Bewusster Abbruch ist jederzeit möglich (mit Bestätigung); der Baum wird als „ruhend“ archiviert, nicht gelöscht.

### 2.7 Täglicher Check-in mit Reflexion (Ziel: ≤ 60 Sekunden)
1. Tageskriterium erreicht? (ja / teilweise / nein; bei `menge` Zahl eingeben) – **nur das entscheidet über das Blatt**
2. Vorhaben von gestern umgesetzt? (Anzeige des eigenen Satzes; ja / teilweise / nein)
3. Was hat ehrlich gehindert? Mehrfachauswahl: Müdigkeit, Stress, Langeweile, Gesellschaft, Zeitmangel, Ort/Situation, Sonstiges + optional Freitext. Nur bei „teilweise/nein“.
4. Vorhaben für morgen: Wenn-dann-Vorlage („Wenn …, dann …“), optional.
- **Morgens / beim Öffnen:** Vorhaben vom Vorabend prominent anzeigen.
- Reflexion ist optional und beeinflusst nie den Baum.

### 2.8 Auswertung (einfach)
Nach ≥ 14 Check-ins: häufigste Hinderungsgründe, Verteilung nach Wochentag, Quote umgesetzter Vorhaben. Nur beschreibend, keine Interpretation durch die App.

## 3. Technische Eckpunkte
- Statische PWA, Daten in IndexedDB, keine Netzwerkzugriffe zur Laufzeit.
- **Erinnerungen ohne Server:** Echter Web-Push braucht einen Server und entfällt im MVP. Stattdessen:
  - `.ics`-Export wiederkehrender Kalendertermine (Check-in abends, Vorhaben morgens) → zuverlässig auf Handy und PC.
  - Lokale Benachrichtigung nur, solange die App geöffnet ist.
- **Mehrere Geräte:** Kein Sync. Ein Hauptgerät; Export/Import als JSON-Datei. In der UI klar kommunizieren.
- Event-Daten: `DayEntry`, `CompensationEntry`, `Reflection`, `SrbaiAnswer`, `Habit`. `TreeState` wird immer abgeleitet.

## 4. Umsetzungsphasen

### Phase 0 – Projektgerüst
- [x] Vite + TS strict, ESLint, Vitest, vite-plugin-pwa
- [x] GitHub-Actions-Workflow für Tests + Deployment auf GitHub Pages (Deploy-Schritt wartet auf Aktivierung von Pages im Repo, siehe Fortschritt)
- **Abnahme:** `npm run build` und `npm run test` grün; leere PWA installierbar.

### Phase 1 – Domänenmodell und Regel-Engine
- [x] `types.ts`, `params.ts`, `calendar.ts` (Tagesgrenze, ISO-Woche, Zeitzonen-/Sommerzeit-Fälle)
- [x] `rules.ts`: `computeTreeState(habit, entries, now) → TreeState`
- [x] Szenario-Tests mindestens: perfekte Woche; 1 verpasster Tag mit Ausgleich; unausgeglichene Woche; 2 und 3 Wochen in Folge; Erholung; Wind nach 7 Tagen; Nachtrag eines vergessenen Check-ins; Wochenwechsel an Sonntag 02:30 (vor Tagesgrenze); Abschlussbedingungen
- **Abnahme:** 100 % Zweigabdeckung in `rules.ts`.

### Phase 2 – Persistenz
- [x] IndexedDB-Schema v1 mit `idb`, Migrationsgerüst
- [x] Export/Import als JSON inkl. Schemaversion und Validierung
- **Abnahme:** Export → Löschen → Import ergibt identischen `TreeState`.

### Phase 3 – Gewohnheit anlegen (Onboarding)
- [x] Typ wählen, Tageskriterium, Ausgleichshandlung, optional erster Wenn-dann-Plan
- [x] Bei `verzicht` mit Suchtbezug (Rauchen, Alkohol …): Hinweis auf professionelle Hilfe (z. B. BZgA-Rauchfrei-Telefon – Nummer vor Release prüfen) – vorerst **ohne** Telefonnummer, siehe Offene Fragen 17
- [x] Sperre: nur eine aktive Gewohnheit
- **Abnahme:** Durchlauf in < 2 Minuten.

### Phase 4 – Check-in, Reflexion, Morgenansicht
- [ ] Check-in-Dialog gemäß 2.7, Nachtragsfunktion
- [ ] Ausgleichshandlung erfassen
- [ ] Startansicht mit Vorhaben des Tages
- **Abnahme:** Check-in in ≤ 60 Sekunden auf dem Handy bedienbar.

### Phase 5 – Baum (SVG)
- [ ] Deterministischer Baum aus Seed; Äste wachsen mit Blattzahl
- [ ] Blätter, Knospen, Laub am Boden, Vitalitätsstufen
- [ ] Blattzähler sichtbar; Textbeschreibung für Screenreader
- [ ] Animationen: neues Blatt, fallendes Blatt, Wind (respektiert `prefers-reduced-motion`)
- **Abnahme:** Visueller Zustand stimmt für alle Szenarien aus Phase 1 (Testseite mit Fixtures).

### Phase 6 – Wochenabrechnung in der UI
- [ ] Wochenrückblick beim ersten Öffnen nach Sonntag (was ist passiert, neuer Status, Ermutigung)
- [ ] Hinweis am Wochenende auf offene Ausgleichseinheiten
- **Abnahme:** Rückblick erscheint genau einmal pro Woche.

### Phase 7 – Abschluss und Garten (Liste)
- [ ] SRBAI-Abfrage ab Schwelle, Abschlussprüfung, Abschlussfeier
- [ ] „Mein Garten“: Liste archivierter Bäume (ausgewachsen / ruhend) mit Dauer und Blattzahl
- [ ] Bewusster Abbruch
- **Abnahme:** Nach Abschluss lässt sich eine neue Gewohnheit anlegen.

### Phase 8 – Erinnerungen und Auswertung
- [ ] `.ics`-Export (Check-in-Zeit und Morgenzeit wählbar)
- [ ] Auswertung gemäß 2.8
- **Abnahme:** `.ics` lässt sich in Google- und Apple-Kalender importieren.

### Phase 9 – Feinschliff und Release
- [ ] Datenschutzhinweis (alles lokal, Export als Sicherung empfehlen)
- [ ] Barrierefreiheit prüfen, Desktop-Layout, Dark Mode
- [ ] Selbsttest: 2 Wochen Eigennutzung, danach Parameter überprüfen

## 5. Offene Fragen (vor bzw. während der Umsetzung klären)
**Stand 2026-11-10:** Antworten des Nutzers sind bei den Punkten vermerkt. ~~Durchgestrichen~~ = erledigt.

1. Sollen bei einer unausgeglichenen Woche wirklich **alle** Blätter dieser Woche fallen, oder nur so viele, wie Tage unausgeglichen blieben? (Aktuell: alle – strenger; Alternative milder.)
2. Erholung um 1 Stufe pro ausgeglichener Woche (aktuell) oder direkt zurück auf `gebremst`?
3. SRBAI passt gut zu Aufbau-Gewohnheiten. Für `verzicht` misst es Automatik eines *Nicht-Tuns* nur bedingt – Formulierung anpassen oder anderes Kriterium (z. B. Drang-Stärke 1–10)?
4. „Teilweise“ beim Tageskriterium: zählt als verpasst (aktuell) oder halbes Blatt?
5. ~~GitHub Pages aus privatem Repo …~~ → Repo `growyourself` ist öffentlich (Stand 2026-11-10), GitHub Pages ist damit ohne Bezahl-Plan möglich.
6. Name der App. (Repo heißt `growyourself`; UI zeigt vorerst „Gewohnheitsbaum“.)

**Lücken im Regelwerk aus Phase 1** (Antworten 2026-11-10, jeweils per Szenario-Test abgesichert):

7. ~~Nie nachgetragener Check-in neutral?~~ → **Nein:** zählt wie verpasst (abgeleitet aus „Urlaub gibt es nicht“, siehe 11; Regel 2.3.5). bestätigt 2026-11-10.
8. ~~Sonntag nachtragen?~~ → „Mit Montag 00:01 Uhr ist die alte Woche um.“ Umgesetzt als `WEEK_CUTOFF` Montag 00:00: Ab dann ist weder Nachtrag noch Ausgleich für die alte Woche möglich, obwohl der *Tag* bis 03:00 noch Sonntag ist. Folge zusammen mit 7: Ein vergessener Sonntags-Check-in macht die Woche unausgeglichen. (00:00 statt 00:01, Sonntag 23:59 gehört noch zur alten Woche – bestätigt 2026-11-10.)
9. ~~Vorarbeiten?~~ → „Verarbeiten zählt nicht“, gelesen als **Vorarbeiten zählt nicht** (Regel 2.3.3).
10. ~~Knospen bei unausgeglichener Woche?~~ → „Nicht Knospen, sondern verwelktes Laub fällt zu Boden.“ Knospen fallen nicht als Laub; sie öffnen sich auch nicht, sondern vergehen – bestätigt 2026-11-10.
11. ~~Woche ohne Eintrag?~~ → „Urlaub gibt es nicht.“ Eine solche Woche ist unausgeglichen.
12. **Wind:** Ausgelöst am 7. grünen Tag in Folge (erfolgreich oder ausgeglichen), weht alles Laub weg, das bis dahin liegt. Ein Tag ohne Eintrag (vor heute) unterbricht die Serie; der heutige, noch offene Tag nicht.
13. **„Wochenwechsel an Sonntag 02:30“** (Phase-1-Test) verstanden als Nacht von Sonntag auf Montag: Montag 02:30 gehört noch zum Sonntag, die Woche ist noch offen. Zusätzlich getestet: Sonntag 02:30 gehört zum Samstag.
14. **SRBAI:** Skala (1–7) und Schwelle (5) in `params.ts` sind **Platzhalter**, nicht aus der Quelle geprüft. Gewertet wird die jüngste Antwort (Mittelwert der Items). Vor Phase 7 klären.
15. ~~Sprache?~~ → **Deutsch und Englisch** (D-06). Grundsatz: Designvorgaben aus dem Repo `context-plus-skills` gehen den Vorgaben dieser Dateien vor (2026-11-10).
16. ~~Startblatt~~ → („Checkin startet mit dem ersten Blatt für den ersten wichtigen Schritt mit der Nutzung der App aktiv zu werden“): umgesetzt als 1 Blatt beim Anlegen der Gewohnheit, das zum Mindestwert 42 zählt und nie fällt (auch nicht, wenn die erste Woche unausgeglichen endet). Bestätigt 2026-11-10.
17. **Hilfe-Hinweis bei `verzicht`:** Wird bei *jeder* Verzicht-Gewohnheit gezeigt, mit bedingter Formulierung („Wenn es um Rauchen, Alkohol oder andere Suchtmittel geht …“) – keine Erkennung über Stichwörter (*Interpretation* von „mit Suchtbezug“). Er nennt Hausarztpraxis und Suchtberatungsstellen, aber noch **keine Telefonnummer**: Nummer und Träger (BZgA bzw. Nachfolgeeinrichtung) vor Release aus offizieller Quelle prüfen, dazu eine englische Entsprechung festlegen.
18. **Darstellung Hell/Dunkel/System (D-07):** Laut Register Pflicht für jede App; derzeit folgt die App nur dem System. Auswahl kommt spätestens in Phase 9 (Dark Mode) – oder früher, wenn gewünscht.

## 6. Fortschritt
_(Claude Code trägt hier nach jeder Phase eine kurze Notiz ein.)_

- **2026-11-10 – Phase 0 abgeschlossen:** Build, Lint und Tests in CI grün. Leere PWA lokal in Chromium geprüft: Service Worker aktiv, Manifest ohne Installierbarkeits-Fehler, keine externen Requests. **Offen:** GitHub Pages ist im Repo nicht aktiviert (Deploy-Job: 404 „Ensure GitHub Pages has been enabled“) – einmalig *Settings → Pages → Source: GitHub Actions*. Deployt wird nur der Standard-Branch. Icon ist ein Platzhalter. `npm audit`: 3 mittlere Meldungen in Build-Werkzeugen (workbox-build → glob/minimatch/deepmerge), nicht im ausgelieferten Code; Fix nur per Downgrade von vite-plugin-pwa, daher bewusst belassen.
- **2026-11-10 – Phase 1 abgeschlossen:** Regel-Engine `computeTreeState(habit, records, now)` als reine Funktion; Kalender mit Tagesgrenze, ISO-Wochen, Sommerzeit-Tests (Europe/Berlin). 50 Tests, `rules.ts` 100 % Zweig-/Zeilenabdeckung (in `vitest.config.ts` als Schwelle erzwungen). Lücken im Regelwerk als Annahmen A-1–A-3 u. a. unter „Offene Fragen“ 7–15.
- **2026-11-10 – Phase 2 abgeschlossen:** IndexedDB-Schema v1 (`habits`, `days`, `compensations`, `reflections`, `srbai`, `meta`) mit Migrationsliste; Export/Import als JSON mit Format-Kennung, Schemaversion, Validierung (Typen, Datumsformat, Dubletten, Verweise, max. eine aktive Gewohnheit) und Import in einer einzigen Transaktion. Abnahmetest „Export → Löschen → Import ergibt identischen TreeState“ grün (mit `fake-indexeddb`, Dev-Abhängigkeit nur für Tests). Im echten Browser noch nicht geprüft – das folgt mit der UI.
- **2026-11-10 – Regeländerungen nach Antworten** (Offene Fragen 7–11, 15, 16): Startblatt, Wochenende Montag 00:00, nicht nachgetragene Tage zählen als verpasst, Knospen fallen nicht. Zuerst Tests angepasst (26 rot), dann Regeln; 65 Regel-/Kalendertests grün, `rules.ts` 100 % Zweigabdeckung. UI-Texte zweisprachig (`src/ui/texts.ts`, Sprache aus Browser-Einstellung, Standard Deutsch).
- **2026-11-10 – GitHub Pages aktiv:** https://carstenkeller.github.io/growyourself/ – Deploy grün, von außen geprüft (Service Worker, Manifest ohne Installierbarkeits-Fehler, keine externen Requests). Automatischer Installations-Hinweis des Browsers unterdrückt (Design A-03).
- **2026-11-10 – Phase 3 umgesetzt:** Ein Formular (Typ, Name, Tageskriterium bzw. Zielmenge + Einheit, Ausgleich, optionaler Wenn-dann-Plan), Fehlermeldungen je Feld, Hilfe-Hinweis bei Verzicht, Sperre „nur eine aktive Gewohnheit“ atomar in IndexedDB (`startHabit`). `Habit.firstIntention` neu (optional, Schema v1 bleibt, da noch keine Nutzerdaten existierten). Geprüft per Playwright: Handy (Pixel 7, iPhone 13) und Desktop, hell/dunkel, Deutsch/Englisch, nur Tastatur, Neuladen. **Abnahme „< 2 Minuten“ nicht gemessen:** Ein automatisierter Durchlauf sagt über Menschen nichts aus; Pflicht sind 1 Auswahl + 3 kurze Texte. Bitte auf dem Handy selbst testen.
