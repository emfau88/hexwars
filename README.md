# HEXFRONT

HEXFRONT is a real-time browser strategy game about territory control on a hex grid. Players send forces from their own fields, capture territory and ultimately take the opposing base across a ten-level campaign.

The product entry point is the root [`index.html`](./index.html). The former turn-based prototype is preserved under [`legacy/tactics`](./legacy/tactics) and is deliberately excluded from the product build and runtime.

## Local development

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal to play HEXFRONT. `npm test`, `npm run typecheck`, and `npm run build` verify the product without serving it.

## Current structure

- `index.html` – standalone HEXFRONT document shell
- `src/` – Vite TypeScript app and Canvas runtime
- `public/assets/` – campaign-owned runtime art
- `tests/` – current HEXFRONT regression suite
- `legacy/tactics/` – preserved historical tactics prototype; no product dependency

The game is being migrated to a Vite + TypeScript + Canvas 2D codebase in small verified phases. The migration baseline and invariants live in [`docs/campaign-migration-baseline.md`](./docs/campaign-migration-baseline.md).
