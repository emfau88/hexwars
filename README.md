# HEXFRONT

HEXFRONT is a real-time browser strategy game about territory control on a hex grid. Players send forces from their own fields, capture territory and ultimately take the opposing base across a ten-level campaign.

The product entry point is the root [`index.html`](./index.html). The former turn-based prototype is preserved under [`legacy/tactics`](./legacy/tactics) and is deliberately excluded from the product build and runtime.

## Local development

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal to play HEXFRONT.

```bash
npm run typecheck
npm test
npm run test:browser
npm run balance
npm run build
```

The browser suite covers desktop and mobile portrait. The balance runner is deterministic and reports all ten levels; it is a regression instrument, not a replacement for human playtests.

## Current structure

- `index.html` – standalone HEXFRONT document shell
- `src/` – typed game state, levels, systems, input, Canvas rendering, UI, audio, persistence and debug boundary
- `public/assets/` – campaign-owned runtime art
- `tests/` – unit, simulation, Supply A–G and Playwright regression suites
- `docs/auftrag-hexfront-neustrukturierung.md` – completed phase record and verification log
- `docs/campaign-balance-report.md` – reproducible supply-aware campaign matrix
- `legacy/tactics/` – preserved historical tactics prototype; no product dependency

HEXFRONT uses Vite, strict TypeScript, ES modules and Canvas 2D. The migration baseline and invariants live in [`docs/campaign-migration-baseline.md`](./docs/campaign-migration-baseline.md).
