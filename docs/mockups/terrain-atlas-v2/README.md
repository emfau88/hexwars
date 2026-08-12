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

## Shore material experiment

The optional shore-assets variant keeps all coastline geometry deterministic and
derived from exposed water-cell edges. Generated bitmap assets contribute only
surface character, so they cannot alter the grid, reverse a shoreline, place
vegetation in water or distort at different aspect ratios.

- [Water material](../../../public/assets/level1-water.webp)
- [Shore material](../../../public/assets/level1-shore.webp)
- [Desktop test render](./terrain-atlas-v2-shore-assets-desktop.png)
- [Mobile portrait test render](./terrain-atlas-v2-shore-assets-mobile.png)

This experiment deliberately uses a narrow three-layer coast: a soft contact
shadow, textured sand/earth and a restrained light edge. Level 1 uses the same
two production assets as a contained visual pilot.

This page remains a reviewable layout reference, not a second game runtime or a
parallel design branch. Runtime assets under `public/assets/` are the single
source of truth.
