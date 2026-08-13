# HEXFRONT decorative asset candidates — P1

Status: **review package only — not integrated into the game**

This package explores the four missing high-priority environment families: mountain/rock, low ruins, marsh vegetation and snow. It deliberately lives outside `public/` and `src/`; the production renderer does not import or load any file in this folder.

## Review previews

- `previews/candidate-grid.png` — enlarged comparison on representative hexes
- `previews/game-scale-grid.png` — readability check at a 48 px hex radius

## Candidate verdicts

| ID | File | Initial verdict | Reason |
|---|---|---|---|
| 1.1 | `mountains-rock-outcrop.png` | Good candidate | Readable compact silhouette; useful as the stronger mountain accent. Test at slightly smaller scale than shown. |
| 1.2 | `mountains-highland-ridge.png` | Best candidate | Low, calm and clearly noninteractive; fits Levels 4 and 5 particularly well. |
| 1.3 | `mountains-snow-peaks.png` | Caution | Clear at small size, but the pointed silhouette is closest to the rejected fantasy direction. Test only in Level 9. |
| 1.4 | `mountains-scree-cluster.png` | Good candidate | Quiet supporting variation; unlikely to hide grid information. |
| 2.1 | `ruins-collapsed-corner.png` | Good candidate | Reads as old masonry without becoming a gate, building or objective. |
| 2.2 | `ruins-cracked-paving.png` | Best candidate | Very low visual weight and no gameplay implication; strongest generic ruin detail. |
| 2.3 | `ruins-parallel-rubble.png` | Caution | Neutral at small scale, but repeated parallel lines could imply a route when used in sequence. |
| 2.4 | `ruins-broken-foundation.png` | Caution | Visually safe as a single prop, but multiple neighboring copies could imply a building footprint. |
| 3.1 | `marsh-cattails.png` | Good candidate | Strong wetland identity and readable silhouette; use sparingly because it is tall and detailed. |
| 3.2 | `marsh-sedge.png` | Best candidate | Quiet, flexible filler with minimal semantic risk. |
| 3.3 | `marsh-lily-leaves.png` | Conditional | High quality, but should appear only on or directly beside visible water/marsh regions. |
| 3.4 | `marsh-reeds-stones.png` | Good candidate | Adds controlled variation and bridges vegetation with rocky shore details. |
| 4.1 | `snow-snow-conifer.png` | Good candidate | Strong winter read and consistent with the existing conifer family. Keep below the lower hex edge. |
| 4.2 | `snow-snow-bush.png` | Best candidate | Clear, low and well suited for repetition with rotation/scale limits. |
| 4.3 | `snow-snow-rocks.png` | Good candidate | Useful secondary landmark with enough contrast against pale snow. |
| 4.4 | `snow-snowdrift.png` | Revise before use | Correctly quiet, but currently loses too much contrast on a pale tile at game scale. |

## Rejected exploration

`rejected/ruins-v1/` preserves the first ruin generation for traceability. The upright slab resembled an objective marker, the stone ring suggested a special or ritual field, and the fallen column pulled the visual language toward classical fantasy. None is recommended for integration.

## Water and shore decision

No new water or shore material was generated. The existing `public/assets/level1-water.webp` and `public/assets/level1-shore.webp` are already the correct quality direction. The remaining work is renderer generalization and map-specific color tuning, not replacement art. That work should happen only in a separate Level-by-Level integration test.

## Technical QA

- 16 active transparent PNG candidates
- all four corners fully transparent
- no detected opaque magenta spill after chroma-key removal
- isolated silhouettes with padding retained
- enlarged and 48 px-radius previews generated
- no production imports, asset registrations or level-data changes

## Recommended next test order

1. Level 4 with `highland-ridge`, `rock-outcrop` and `scree-cluster` only.
2. Level 3 with `cracked-paving` and `collapsed-corner` only.
3. Level 6 with `sedge`, `cattails` and `reeds-stones`; add lily leaves only beside water.
4. Level 9 with snow bush, conifer and rocks; compare the snow peaks against a lower mountain alternative.
5. Revise the snowdrift contrast before testing it in a map.

Each step should remain behind an isolated visual test flag until desktop and portrait-mobile screenshots have been reviewed.

## Reproduction

The built-in image-generation tool created the chroma-key source sheets. The installed ImageGen chroma-removal helper produced the alpha sheets. `process_candidates.py` splits, trims, validates and previews them. Re-running it does not touch production files.

