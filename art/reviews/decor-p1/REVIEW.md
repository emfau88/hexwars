# DECOR P1 — campaign-wide first integration review

Status: **experimental URL-gated test, not approved for production**  
Flag: `?visual=decor-p1`  
Captured: desktop and portrait mobile, Levels 1–10

## Executive verdict

The asset direction is compatible with HEXFRONT and substantially better than the former procedural mountain, ruin, marsh and snow symbols. It is not ready for wholesale production integration. The main remaining issue is not raw image quality but art direction at map scale: frequency, hierarchy, biome-specific distribution and controlled repetition.

The production mode remains unchanged when the query flag is absent.

## Campaign-level findings

| Level | Verdict | Finding | Next experiment |
|---:|---|---|---|
| 1 | Keep baseline | Existing meadow, mixed trees and connected water remain the most coherent benchmark. | No asset change. Use as density and clarity reference. |
| 2 | Improved, needs authorship | Connected water/shore reads better, but alternating central forest/water still feels mechanically patterned. | Author fewer deliberate vegetation accents along the river. |
| 3 | Direction good, scale weak | Flat ruins avoid objective-marker confusion, but become too faint at mobile size and repeat too evenly. | Increase ruin size/contrast about 15–20%; use two authored clusters rather than broad random scatter. |
| 4 | Assets good, density high | Ridge/outcrop/scree family fits the style; too many mountain cells create a repetitive border texture. | Reduce mountain frequency and group 2–3 coherent highland areas. |
| 5 | Strongest new biome, still busy | Multiple rock silhouettes clarify the pass theme, but the near-checkerboard distribution competes with the playable routes. | Preserve the central chain; quiet the outer border and prefer low ridges near playable edges. |
| 6 | Clear biome, props undersized | Continuous water works; marsh tufts are readable but too small and evenly dispersed. | Increase sedge/reed scale modestly and form 2–3 wetland clusters; lilies only beside water. |
| 7 | Water quality improved | The island composition benefits from connected shores. Vegetation is still generic rather than island-specific. | Add only restrained shore stones/reeds after water geometry is approved. |
| 8 | Not yet a “garden” | Safe ruins work, but ruins + generic bushes do not communicate Signal Gardens. | Separate later garden package: low hedge, flower bed, small orchard group. |
| 9 | Strong identity, too patterned | Snow vegetation and rocks create a credible winter biome. Repeated sharp snow peaks around the border feel more fantasy-like and tiled. | Prefer snow rocks/bushes; reduce sharp peaks drastically or replace with a lower winter ridge. |
| 10 | Coherent but generic | Mixed P1 assets and connected lake work technically, yet the finale lacks one unique landmark. | Add a single noninteractive finale landmark only after base biome system is approved. |

## Cross-platform findings

### Desktop

- Asset silhouettes are clean but the active board occupies a relatively small part of the wide stage, so decorative repetition becomes more obvious than detail quality.
- The low ruins need more contrast; mountain families are readable at current scale.
- The shared painterly style matches the existing trees and water.

### Mobile portrait

- Hex boundaries and unit numbers remain clearly dominant, which is correct.
- Mountains and snow props remain readable.
- Ruins and most marsh props are too quiet at the current render scale.
- Tall snow conifers fit within their cells and are not cut off at the lower hex edge.

## Asset decisions after real-map testing

### Advance to the next iteration

- highland ridge
- rock outcrop
- scree cluster
- collapsed ruin corner
- cracked paving
- sedge
- cattails
- reeds with stones
- snow bush
- snow conifer
- snow rocks

### Conditional

- lily leaves: only next to water or marsh
- broken foundation: only as a rare single cluster
- snow peaks: winter only and at much lower frequency

### Hold/revise

- snowdrift: insufficient contrast
- broad randomized ruin distribution
- broad randomized mountain distribution

## Recommended second integration step

Do not tune all ten maps at once. Create four isolated authored trials in this order:

1. Level 4 — reduce and cluster highland assets.
2. Level 3 — enlarge/darken two ruin clusters.
3. Level 6 — cluster wetland props and enforce water adjacency for lilies.
4. Level 9 — replace most sharp peaks with low winter rocks/ridges.

Review desktop and portrait screenshots after each level before carrying the rule into other maps.
