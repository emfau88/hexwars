# Decor P2 – Level 3/4 comparison

Status: reversible visual experiment, not production.

## Scope

- `visual=decor-p1` is the unchanged before state.
- `visual=decor-p2` inherits P1 and changes only the decoration rendering of Levels 3 and 4.
- No level data, routes, balance, collision, interaction, or save data is changed.

## Level 3 – stone terraces

- Randomly scattered ruin marks are visually replaced by meadow.
- The six authored ruin cells remain and form two three-cell terraces beside the central play area.
- Warmer stone cells and larger paving/collapsed-wall assets make the biome readable at a glance.
- The hex borders remain fully visible; the terraces support the grid instead of becoming a separate overlay.

Verdict: clearly stronger than P1. The ruins now read as one map-level composition instead of repeated, ambiguous debris. Suitable as the direction for a later production pass.

## Level 4 – highland accents

- Randomly repeated mountains are visually replaced by meadow.
- Only the six authored mountain cells remain.
- Outcrop, low ridge, and scree variants are deliberately assigned to those cells.

Verdict: clearly calmer and more legible than P1. The mountains frame the route without producing a repetitive border. Suitable as the direction for a later production pass.

## Desktop and mobile QA

- Desktop comparison: `before-after-desktop.jpg`
- Mobile portrait comparison: `before-after-mobile.jpg`
- Matching viewport, level, language, and camera framing were used for each pair.
- No sprite clipping, page overflow, missing assets, browser warnings, or browser errors were observed.

## Reversal

- Remove `visual=decor-p2` to return to production.
- Use `visual=decor-p1` to return to the exact previous experiment.
- The P2 implementation can be removed without modifying campaign level definitions.
