# HEXFRONT ruin-replacement candidates V1

Status: **integrated as the `decor-v2` replacement for the former ruin visuals**

This package contains the broad, low natural ground motifs that replace the former ruin family. Existing level assignments and decoration frequency remain unchanged; only those cells that previously displayed ruins use this family. The candidates intentionally occupy roughly 80% of the usable hex width, while the hex border, ownership color and troop number remain visually dominant.

## Candidates

| Candidate | Intended role | First game-scale verdict |
|---|---|---|
| Mushroom and moss colony | Occasional character accent | Strong and friendly, but too distinctive for frequent repetition. Use sparsely if selected. |
| Natural bedrock | Quiet neutral ground cover | Broad and legible, but still risks reading as paving. Needs a more continuous, less segmented follow-up before approval. |
| Fern and moss floor | Lush organic variation | Attractive and readable, but visually stronger and greener than the other candidates. Best as a secondary motif. |
| Dry grass and field stones | General-purpose lowland dressing | Best current default: broad, grounded, non-fantasy and quiet enough behind troop numbers. |

## Coverage recommendation

Do not cover the complete hex or touch its border. A broad asset width of about 80-85% of the pointy-top hex width is the useful upper range. The remaining inset preserves neighbour separation, ownership tint and the perception that the decoration is non-interactive.

Use the family with controlled frequency rather than on every eligible cell. The repeated-density sheet is deliberately a stress test, not a recommended level layout.

## Review images

- `previews/hex-coverage-comparison.jpg` shows all four candidates at the proposed 85% interior width with a troop number rendered above them.
- `previews/mobile-map-density-test.jpg` shows exact 31 px radius hexes under intentionally excessive repetition.

## Contents

- `source/`: flat-magenta ImageGen output
- `sprites/`: locally chroma-keyed transparent PNG candidates
- `previews/`: game-scale comparison sheets
- `build_previews.py`: deterministic preview compositor and WebP runtime exporter
