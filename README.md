# HEXFRONT

[![Verify and deploy](https://github.com/emfau88/hexwars/actions/workflows/pages.yml/badge.svg)](https://github.com/emfau88/hexwars/actions/workflows/pages.yml)

HEXFRONT is a compact real-time tactics game for desktop browsers and mobile portrait screens. Expand across a hex grid, distribute growing forces and capture the opposing base.

## Play

[Play the current GitHub Pages build](https://emfau88.github.io/hexwars/)

- Drag from an orange field to a reachable target.
- `50%` sends half of the available force and keeps a reserve.
- Later levels unlock full sends, grouped sends and manual reinforcement.
- Capture the blue base to win the mission.

## Current state

The project is a playable internal vertical slice, not yet a commercial release.

- Ten deterministic campaign levels
- Production campaign menu built as one coherent terrain-atlas hex grid
- Desktop and mobile-portrait layouts
- English by default with a persistent in-game `EN | DE` switch
- Persistent local campaign progress
- Real-time AI, combat, supply and endgame systems
- Automated unit, simulation, balance and browser tests
- Level 1 as the visual-quality test bed for terrain, vegetation, water and shores

`HEXFRONT` is the retained product name. A professional commercial name clearance, accessibility onboarding and human playtest balancing are still required before release.

## Local development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm test
npm run test:browser
npm run balance
npm run build
```

## Documentation

- [Product and game-design audit](./docs/campaign-audit.md)
- [Prioritized roadmap](./docs/campaign-roadmap.md)
- [Campaign balance report](./docs/campaign-balance-report.md)
- [Localization guide for future EN/DE content](./docs/localization-guide.md)
- [Completed restructuring brief](./docs/auftrag-hexfront-neustrukturierung.md)
- [Visual design references](./docs/mockups/)

The former turn-based prototype is preserved under [`legacy/tactics`](./legacy/tactics) and is not part of the current runtime.
