# Gewohnheitsbaum (Arbeitstitel)

PWA, die hilft, **genau eine** Gewohnheit zur Zeit zu etablieren oder abzulegen.
Jeder erfolgreiche Tag lässt ein Blatt wachsen; Rückfälle lassen Blätter welken –
verzeihend, nie vernichtend. Alle Daten bleiben im Browser (IndexedDB).

- Fachkonzept, Regelwerk, Phasen: [Plan.md](Plan.md)
- Arbeitsregeln für Claude: [CLAUDE.md](CLAUDE.md)

```bash
npm install
npm run dev            # Entwicklungsserver
npm run test           # Vitest
npm run test:coverage  # mit Abdeckung (rules.ts: 100 % Pflicht)
npm run build          # Produktions-Build
npm run lint           # ESLint + Typprüfung
```

## Deployment

GitHub Actions (`.github/workflows/ci.yml`) prüft jeden Branch und veröffentlicht
den Standard-Branch auf GitHub Pages. Einmalig nötig: im Repo unter
*Settings → Pages → Build and deployment → Source* „GitHub Actions“ wählen.
