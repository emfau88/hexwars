# HEXFRONT simplified decorative asset candidates - V2

Status: **review package only - not integrated into the renderer**

This package starts the simplified replacement pass for four representative P1 assets. The goal is not lower technical quality; it is stronger game-scale readability through fewer, larger shapes and quieter texture. Water and shore assets are explicitly outside this pass.

## Included style anchors

| Family | V2 candidate | Intended improvement |
|---|---|---|
| Mountain | `mountains-highland-ridge-v2.png` | Three broad, asymmetrical rock masses and a single stable silhouette instead of many small ledges and loose stones. |
| Ruins | `ruins-cracked-paving-v2.png` | Four dominant slabs and one fragment instead of a busy field of similarly weighted paving pieces. |
| Marsh | `marsh-reeds-stones-v2.png` | Three grouped foliage masses and two stones instead of dense fine reed detail. |
| Snow | `snow-snow-rocks-v2.png` | Three clearly visible overlapping rocks and a calmer snow contour instead of five repeated snow-cap forms. |

## Review images

- `previews/candidate-grid.png` compares P1 and V2 enlarged on identical representative hexes.
- `previews/game-scale-comparison.png` compares P1 and V2 at 48 px desktop and 31 px portrait-mobile hex radii.

## Deliberate constraints

- isolated transparent sprites; no baked hex, terrain, shadow or frame
- one clear silhouette per candidate
- large tonal masses rather than microtexture
- neutral, non-fantasy tactical-board-game tone
- enough internal contrast for pale terrain without competing with troop numbers
- no runtime exports, asset registrations, renderer changes or level-data changes
- no work on water or shore visuals

## Current review status

These four images are **style anchors, not final production approval**. They should first be judged in the supplied game-scale comparison.

| Candidate | Working verdict | Main reservation before integration |
|---|---|---|
| Highland ridge V2 | Promising | Very calm and natural at mobile scale; needs an in-map contrast check against both light and dark ground. |
| Cracked paving V2 | Conditional | Cleaner than P1, but at 31 px it can still read as four ordinary paving stones rather than a broader ruin region. Do not propagate this motif until that semantic choice is accepted. |
| Reeds and stones V2 | Promising | Stronger grouping and calmer color; should be tested beside other vegetation to ensure it remains marsh-specific. |
| Snow rocks V2 | Promising | Clearer mass at 31 px; requires a pale-snow terrain check because white-on-white contrast cannot be judged on the green review tile. |

The first generated V2 mountain used concentric centered terraces and resembled a constructed platform. It was rejected after the game-scale review and is preserved under `rejected/` for traceability. If the accepted abstraction level is approved, the remaining mountain, ruin, marsh and snow variants can be recreated in the same direction. Only after that should a reversible renderer test be prepared.

## Reproduction

The built-in ImageGen tool generated one flat-magenta source per asset using the P1 sprite only as a subject and perspective reference. The standard ImageGen chroma-removal helper produced the transparent sprites. Run `python process_candidates.py` to trim the sprites, regenerate both previews and print alpha/spill validation.
