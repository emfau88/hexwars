# HEXFRONT 3D – asset sources and licenses

Verified 2026-10-12 for the material/art overhaul. Only the following third-party art is used by the current playable build. No Tacticus/Warhammer model, texture, logo or screenshot is redistributed.

## Poly Haven – CC0 material subset

[Official asset license](https://polyhaven.com/license): all downloadable assets are CC0; commercial use, modification and redistribution are allowed. [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

| Resource | Original authors | Files retained | Role |
|---|---|---|---|
| [Rock Boulder Dry](https://polyhaven.com/a/rock_boulder_dry) | Dimitrios Savva (photography), Rico Cilliers (processing) | Diffuse 1024² WebP, OpenGL normal 512² WebP, roughness 512² WebP | Felsfamilie und Felswände; ruhige Felsanteile des Bodenatlas |
| [Rock Wall 02](https://polyhaven.com/a/rock_wall_02) | Rob Tuytel | Diffuse 1024² WebP, roughness 512² WebP | Detailquelle für den Bodenatlas; raue Cliff-Oberfläche |

Only five selected texture files, **1,124,878 bytes in total**, are retained. Original 1K JPEG sources were inspected, then re-encoded; normal/roughness maps were reduced to 512² and encoded losslessly. Albedo uses WebP quality 82. No generated image stands in for 3D geometry. Runtime color treatment, atlas blending and conservative normal intensity unify the two sources with the authored scene.

`public/assets/materials/material-provenance.json` contains exact download URLs, authors, original and delivered SHA-256 hashes, dimensions, transformations and byte sizes. `scripts/prepare-materials.py SOURCE_DIRECTORY` reproduces the optimized maps using Pillow. The original JPGs remain only in the local staging archive outside Git. A notice is retained in `public/assets/materials/LICENSE-PolyHaven.txt`.

## Quaternius – CC0 fern

[Stylized Nature MegaKit — Standard](https://quaternius.com/packs/stylizednaturemegakit.html), Quaternius, July 2024. The official page identifies CC0 and commercial use. The original notice is retained in `public/assets/nature/LICENSE-Quaternius.txt`.

Retained: `Fern_1.gltf`, `Fern_1.bin`, `Leaves.png`; the fern has 288 triangles and the leaf texture is 512². Four restrained fern instances are placed beside rock groups. Materials are muted and source wind-control vertex colours are disabled. Geometry remains unchanged. The prior prototype's texture resizing is retained.

Delivery mirror: [anandin/the-wild-between, quaternius-nature](https://github.com/anandin/the-wild-between/tree/main/assets/quaternius-nature). `public/assets/asset-provenance.json` records the original repository paths and Git blob SHAs for retained files.

The earlier two boulders, bush, sci-fi wall and access console have been replaced and are no longer shipped. Their original files and notices remain recoverable from commit `8cfb89c448029f0e81a7c70fc20b17cd1cc4fdae` and the previous prototype archive. No complete pack is included.

## Authored geometry and surface treatment

`src/art.js` implements the integrated cliff profiles, seven angular rock footprints, attached fracture shoulders, damaged concrete barriers, curved-leaf scrub and grass clusters. These are genuine meshes with material slots, bevels, normals and UVs, authored for this experiment. Terrain collision/picking tops use the unmodified heights and coordinates from `src/map.js`.

Concrete/metal weathering, the world-space soil/grass/path/rock atlas, contact shadows, building stencils and UI are original experiment work. No external font or hidden CDN is required. The soil atlas incorporates the two CC0 photographic sources listed above; it is not a pre-rendered battlefield.

## Futuristic technology pass — authored assets

`src/technology.js` replaces the former tracked rovers and architecture with one shared hover-drone model, a paired command-station family, and a suspended-core relay. Profile lofts have authored outlines, bevel sections, normals and UVs. Dark metal, armor and small team accents reuse the existing original weathering texture. No downloaded model is hidden behind these assets, no additional external art file was added, and no generated image substitutes for geometry.

Motion and bounded combat/capture effects are authored in `src/transport.js` and `src/technology.js`. These are original experiment work under the repository's existing terms, not falsely attributed to a third-party asset pack.

Official sources checked on 2026-10-12 before choosing the authored family:

- [Kenney Space Kit](https://kenney.nl/assets/space-kit), CC0, 150 models: useful modular vocabulary, but authored silhouettes fit the existing hex footprint and shared material system better.
- [Quaternius Sci-Fi Essentials Kit](https://quaternius.itch.io/sci-fi-essentials-kit), CC0, free Standard set: robots/props researched, no files imported.
- [Quaternius Modular Sci-Fi MegaKit](https://quaternius.com/packs/modularscifimegakit.html), CC0: architecture researched, no new pack imports.

## Research and reference only

- [Kenney Nature Kit](https://kenney.nl/assets/nature-kit), CC0: researched but too simplified for this direction; not included.
- [Quaternius Modular Sci-Fi MegaKit](https://quaternius.com/packs/modularscifimegakit.html), CC0: researched, formerly used, replaced by architecture shaped to the existing tactical footprint.
- Tacticus gameplay screenshots from [Multiplayer.it](https://multiplayer.it/recensioni/warhammer-40000-tacticus-recensione-strategico-ios-android.html) were visually inspected as design references only. They belong to their respective rights holders and are not included in the repository, playable build or delivery images.

## Runtime

Three.js r169 and its local loader/utilities retain their MIT notice in `vendor/THREE-LICENSE.txt`. Playwright and Pillow are optional authoring/test tools, not playable-build dependencies.
