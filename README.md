# HEXFRONT

HEXFRONT is a real-time browser strategy game about territory control on a hex grid. Players send forces from their own fields, capture territory and ultimately take the opposing base across a ten-level campaign.

The product entry point is the root [`index.html`](./index.html). The former turn-based prototype is preserved under [`legacy/tactics`](./legacy/tactics) and is deliberately excluded from the product build and runtime.

## Local development

```bash
npm test
npm run build
python -m http.server 8765
```

Open `http://127.0.0.1:8765/` to play HEXFRONT.

## Current structure

- `index.html` â€“ current standalone HEXFRONT entry point during the module migration
- `assets/` â€“ campaign-owned runtime art
- `tests/` â€“ current HEXFRONT regression suite
- `legacy/tactics/` â€“ preserved historical tactics prototype; no product dependency

The game is being migrated to a Vite + TypeScript + Canvas 2D codebase in small verified phases. The migration baseline and invariants live in [`docs/campaign-migration-baseline.md`](./docs/campaign-migration-baseline.md).
