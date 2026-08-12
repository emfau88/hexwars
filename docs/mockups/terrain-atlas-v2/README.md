# Terrain Atlas V2

Refined campaign-menu direction based on the product-owner review of the first mockup round.

## Fixed constraints

- One mathematically consistent flat-top hex grid is created first.
- Terrain, water, vegetation and Level 01–10 stations fill real cells of that grid.
- Stations never overlap a second background hex and never scale beyond their own cell.
- No campaign paths or connector lines are shown.
- Shorelines are drawn only on exposed water edges adjacent to land or the map boundary.
- Vegetation is assigned only to non-water, non-station land cells and clipped inside its cell.
- Mobile uses a dedicated compact reflow of the same system instead of shrinking the desktop atlas.
- Contrast comes from a dark forest product shell, sage atlas and warm-cream dossier—not additional saturated colors.

## Verified output sizes

- Desktop: `1440 × 900`
- Mobile portrait: `390 × 844`

## Deliverables

- [Desktop mockup](./terrain-atlas-v2-desktop.png)
- [Mobile portrait mockup](./terrain-atlas-v2-mobile.png)
- [Deterministic responsive source](./index.html)

The source exists only as a reviewable mockup. It is not connected to the production game.
