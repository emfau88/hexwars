# Generation prompts - decor V2 style anchors

Mode: built-in ImageGen, image-conditioned generation. Each P1 sprite served only as a subject and perspective reference. All outputs were generated on a flat chroma-key magenta background and converted to transparent PNGs afterward.

## Mountain - highland ridge V2

The first prompt below produced a centered terraced form that resembled a constructed platform. That output was rejected after the game-scale check and preserved under `rejected/`.

Create a new standalone raster sprite for a polished mobile-first tactical hex strategy game. Use the attached image only as a subject and perspective reference; redesign it more simply.

Asset: a low, broad highland ridge made from one coherent rock formation, seen from a consistent top-down three-quarter/isometric game view. The silhouette should read instantly at 40-70 px wide. Build it from only three broad stepped height levels and four to six large, clean rock planes. Restrained warm gray-beige stone with one muted olive accent at most.

Style: premium restrained semi-flat painterly board-game illustration, grounded and non-fantasy, clean readable shapes, two to four broad tonal masses, subtly hand-painted, no hard black outline. About 30% less detail than the reference.

Composition: subject centered, horizontal footprint, 25-30% empty padding on every side, entire object visible and never cropped. No hex tile, hex border, terrain background, text, icon frame or cast shadow outside the object. Perfectly flat, uniform solid chroma-key magenta `#FF00FF` background without gradient, texture, vignette or glow.

Avoid dramatic mountain peaks, fantasy scenery, tiny pebbles, moss seams, grass blades, cracks, microtexture, repeated ledges, photorealism and blur.

### Accepted corrective prompt

Create a new standalone raster sprite for a polished mobile-first tactical hex strategy game. Use the attached image only as a subject, palette and perspective reference. Redesign it for maximum readability at 40-70 pixels while keeping it unmistakably natural.

Asset: one low, broad, asymmetrical highland ridge seen from a consistent top-down three-quarter/isometric view. The ridge runs mostly left-to-right and is made from three overlapping natural rock masses of unequal width and height. Put one blunt rise off-center, a lower shoulder on the other side and one broken front slope. Use only five to seven large clean rock planes and a single restrained muted-olive seam. The outer silhouette must be irregular and laterally flowing, not centered or radial.

Style: premium restrained semi-flat painterly tactical board-game illustration, grounded, contemporary and non-fantasy. Two to four broad tonal masses, subtle hand-painted finish, no hard black outline, roughly 35% less internal detail than the reference.

Composition: centered horizontal footprint, entire object visible, 25-30% empty padding on every side. No hex tile, hex border, terrain background, text, icon frame or cast shadow outside the object. Perfectly flat uniform solid chroma-key magenta `#FF00FF` everywhere outside the subject, without gradient, texture, vignette or glow.

Strictly avoid concentric terraces, stacked centered tiers, pyramids, ziggurats, stairs, constructed platforms, symmetric hills, dramatic peaks, fantasy scenery, tiny loose pebbles, moss bands, grass blades, cracks, microtexture, repeated ledges, photorealism and blur.

## Ruins - cracked paving V2

Create a new standalone raster sprite for a polished mobile-first tactical hex strategy game. Use the attached image only as a subject and perspective reference; redesign it more simply and much more readable.

Asset: an irregular remnant of old cracked paving or a ruined stone terrace, seen from a consistent top-down three-quarter/isometric game view. It must read as old paving or ruin at 40-70 px wide, not as a square icon. Use only four to six large connected stone slabs, one strong broad diagonal break and one small displaced fragment. Keep an open, asymmetrical organic silhouette.

Style: premium restrained semi-flat painterly board-game illustration, grounded and non-fantasy, clean readable shapes, two to four broad tonal masses, subtle edge wear, no hard black outline. About 35% less detail than the reference.

Composition: subject centered, low flat footprint, 25-30% empty padding on every side, entire object visible and never cropped. No hex tile, hex border, terrain background, text, icon frame or cast shadow outside the object. Perfectly flat, uniform solid chroma-key magenta `#FF00FF` background without gradient, texture, vignette or glow.

Avoid closed squares or rectangles, checkerboard or grid appearance, paths, roads, walls, buildings, many little stones, many cracks, moss speckles, fantasy ruins and photorealism.

## Marsh - reeds and stones V2

Create a new standalone raster sprite for a polished mobile-first tactical hex strategy game. Use the attached image only as a subject and perspective reference; redesign it more simply.

Asset: a compact marsh marker consisting of three broad grouped reed or leaf clumps and exactly two smooth rounded stones, seen from a consistent top-down three-quarter/isometric game view. It must read instantly at 40-70 px wide. Use broad leaf masses rather than many individual thin strands. Muted olive, sage and straw green with neutral gray-brown stones.

Style: premium restrained semi-flat painterly board-game illustration, grounded and non-fantasy, clean readable silhouette, two to four broad tonal masses, subtly hand-painted, no hard black outline. About 40% less detail than the reference.

Composition: centered compact asymmetric cluster, 25-30% empty padding on every side, entire object visible and never cropped. No hex tile, hex border, terrain background, pool, water patch, text, icon frame or cast shadow outside the object. Perfectly flat, uniform solid chroma-key magenta `#FF00FF` background without gradient, texture, vignette or glow.

Avoid dozens of thin blades, spiky silhouettes, cattails, flowers, tiny gravel, high saturation, water reflections, fantasy plants and photorealism.

## Snow - rock cluster V2

The initial V2 generation produced only two dominant rocks and was rejected. The accepted revision prompt was:

Revise this game sprite while preserving its restrained semi-flat painterly style, exact color family, top-down three-quarter/isometric view, flat uniform `#FF00FF` chroma background and clean unshadowed cutout presentation.

Make the subject a low, broad, coherent cluster of exactly three clearly visible rocks: one medium rear rock, one medium front-left rock and one smaller front-right rock. All three rock bodies must be visibly distinguishable, overlap naturally into one silhouette and fit completely in frame with 30% empty padding. Use one simple, broad snow mass visually tying the group together, with only two or three large snow-edge curves total. Keep the stones warm muted gray-beige and use only a small blue-gray underside on the snow.

This is a tiny mobile tactical hex-game decoration and must read at 40-70 pixels wide. Simplify the current two oversized boulders and reduce their height. No separate fourth rock, pebbles, mushroom shapes, repeating identical snow caps, microtexture, hex tile, border, background scenery, cast shadow or text.

## Expansion prompt set for the complete 16-asset runtime package

The twelve remaining assets used the following common final prompt scaffold with two input images: Image 1 was the matching P1 subject/perspective reference; Image 2 was the accepted V2 family anchor for abstraction, palette and rendering style.

> Use case: stylized-concept. Asset type: transparent decoration sprite for a mobile-first tactical hex strategy game. Recreate the specified subject for immediate readability at 40-70 px. Match the V2 anchor's restrained semi-flat painterly tactical-board-game look: grounded, non-fantasy, large tonal masses and no hard black outline. Center the complete subject with 25-30% padding on a perfectly flat uniform `#FF00FF` chroma-key background. No hex tile, border, baked terrain, frame, text, cast shadow, gradient or background texture. Avoid microtexture, photorealism and repeated tiny details.

The final per-asset subject directives were:

| Asset | Final subject directive and avoid list |
|---|---|
| `mountains-rock-outcrop-v2` | One blunt off-center upright mass, one lower shoulder and one low front rock; only 5-7 broad planes. Avoid centered tiers, pyramids, cairns, many blocks and loose pebbles. |
| `mountains-snow-peaks-v2` | Three unequal overlapping blunt rises forming a low lateral winter ridge, with two simple connected snow bands. Avoid pointed Alps, a centered peak, snow streaks and fantasy scenery. |
| `mountains-scree-cluster-v2` | Exactly six overlapping large stones in a low asymmetric fan with one shared internal base shadow. Avoid gravel fields, cairns and repeated identical stones. |
| `ruins-collapsed-corner-v2` | Two short unequal L-shaped wall stubs using five large blocks total and one open gap. Avoid intact buildings, towers, gates, objectives, columns and many bricks. |
| `ruins-parallel-rubble-v2` | Two unequal non-parallel broken masonry remnants at different angles plus one displaced block. Avoid roads, rails, arrows, symmetry and rows of bricks. |
| `ruins-broken-foundation-v2` | Three unequal low connected slabs forming a loose open arc with one wide break and one fragment. Avoid closed squares, rings, shrines, arenas and building walls. |
| `marsh-cattails-v2` | Exactly three broad cattail heads at unequal heights over two grouped leaf fans. Avoid four or more heads, dozens of blades, flowers and water reflections. |
| `marsh-sedge-v2` | One low asymmetric fan of seven broad leaf masses and one subtle seed stem. Avoid dense grass balls, radial symmetry and multiple seed heads. |
| `marsh-lily-leaves-v2` | Exactly five overlapping notched lily pads in three sizes with one broad highlight each. Avoid vein networks, flowers, baked water and lime saturation. |
| `snow-snow-bush-v2` | Three low asymmetric foliage lobes with two connected snow masses and visible sage leaves below. Avoid domes, repeated snow blobs and Christmas decoration. |
| `snow-snowdrift-v2` | Three connected wind-shaped mounds with a continuous blue-gray lower edge and one two-blade grass tuft. Avoid low-contrast white blobs, footprints and many snow pillows. |
| `snow-snow-conifer-v2` | Final corrective pass: three unequal offset foliage shelves, broken outer cone, two side projections, small trunk and three differently shaped snow patches. Avoid perfect triangles, centered tiers, identical snow bands and Christmas-tree icon symmetry. |

The first snow-conifer output was rejected for excessive symmetry and is preserved under `rejected/`. The accepted corrective generation additionally used the existing Level 1 conifer only as a natural-silhouette reference while retaining the V2 snow treatment and palette.
