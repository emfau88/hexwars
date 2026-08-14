# HEXFRONT simplified decorative assets - V2

Status: **complete, exported and integrated as the default playable decoration set**

This package replaces fine-grained P1 decoration with larger shapes that remain readable on desktop and portrait mobile. It contains all sixteen mountain, ruin, marsh and snow sprites used by the campaign. Water and shore rendering are explicitly outside this pass and remain unchanged.

## Runtime behavior and rollback

- Default game URL: loads `decor-v2`.
- `?visual=decor-v2`: explicit V2 selection.
- `?visual=production`: former procedural decoration without generated candidate sprites.
- `?visual=decor-p1`: earlier detailed generated set.
- `?visual=decor-p2`: earlier authored P1 placement experiment.

The renderer loads assets lazily from `public/assets/decor-v2/`. Terrain assignment and V2 motif selection use separate deterministic hashes so all variants can occur without changing gameplay, level geometry or balance.

## Complete asset set

| Family | Runtime motifs |
|---|---|
| Mountains | rock outcrop, highland ridge, snow ridge, scree cluster |
| Ruins | collapsed corner, cracked paving, offset rubble, broken foundation |
| Marsh | cattails, sedge, lily leaves, reeds and stones |
| Snow | asymmetric conifer, low bush, rock cluster, snowdrift |

## Visual constraints

- isolated transparent sprites without baked hexes, terrain, frames or cast shadows
- one clear silhouette and a few large tonal masses per asset
- neutral, grounded tactical-board-game tone without fantasy peaks or military iconography
- mobile-first readability at a 31 px hex radius
- conservative placement boxes that retain visible hex outlines and troop-number priority
- compact tall-tree fitting so the lower hex edge is never clipped

## Review images

- `previews/full-candidate-grid.png` - all sixteen V2 assets enlarged on family-specific hex colors
- `previews/desktop-game-scale-grid.png` - complete set at a 48 px hex radius
- `previews/mobile-game-scale-grid.png` - complete set at a 31 px hex radius
- `previews/candidate-grid.png` - original P1 versus V2 style anchors
- `previews/game-scale-comparison.png` - P1/V2 anchors at both target sizes

## Verification completed

- all 16 runtime WebP files generated and each remains below 100 KB
- transparent source corners and chroma-spill validation performed during processing
- every V2 asset observed through real browser resource inventories across the ten campaign levels
- all ten levels exercised at desktop and 390 x 844 portrait-mobile viewports
- representative ruin, highland, marsh and snow maps visually reviewed at both sizes
- no browser-console errors, missing assets or placeholder shapes
- no water or shore asset changes

Ruins intentionally remain the quietest family. The collapsed corner provides the strongest semantic cue, while paving and foundation fragments prevent every ruin cell from reading as an identical building or objective.

## Reproduction

The built-in ImageGen tool generated one flat-magenta source per asset. Each P1 sprite was used only as a subject/perspective reference; the accepted V2 anchor supplied abstraction and palette direction. The standard ImageGen chroma-removal helper produced transparent PNGs.

Run:

```bash
python art/candidates/decor-v2/process_candidates.py
```

This trims and validates the sprites, regenerates all review sheets and exports the sixteen optimized runtime WebP files to `public/assets/decor-v2/`.
