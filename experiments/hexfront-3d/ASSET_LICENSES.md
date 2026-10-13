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

Retained: `Fern_1.gltf`, `Fern_1.bin`, `Leaves.png`; the fern has 288 triangles and the leaf texture is 512². Four restrained fern instances are placed beside rock groups. Materials are harmonized to the current green palette and source wind-control vertex colours are disabled. Geometry remains unchanged. The prior prototype's texture resizing is retained.

Delivery mirror: [anandin/the-wild-between, quaternius-nature](https://github.com/anandin/the-wild-between/tree/main/assets/quaternius-nature). `public/assets/asset-provenance.json` records the original repository paths and Git blob SHAs for retained files.

The earlier two boulders, bush, sci-fi wall and access console have been replaced and are no longer shipped. Their original files and notices remain recoverable from commit `8cfb89c448029f0e81a7c70fc20b17cd1cc4fdae` and the previous prototype archive. No complete pack is included.

## Authored geometry and surface treatment

`src/art.js` implements the integrated cliff profiles, seven angular rock footprints, attached fracture shoulders, damaged concrete barriers, curved-leaf scrub and grass clusters. These are genuine meshes with material slots, bevels, normals and UVs, authored for this experiment. Terrain collision/picking tops use the unmodified heights and coordinates from `src/map.js`.

Concrete/metal weathering, the world-space soil/grass/path/rock atlas, contact shadows, building stencils and UI are original experiment work. No external font or hidden CDN is required. The soil atlas incorporates the two CC0 photographic sources listed above; it is not a pre-rendered battlefield.

## Charming Frontier — original Blender assets

`public/assets/frontier/frontier.glb` contains the original PIP drone, Haven HQ and Seed relay. Authored and actually exported in Blender 5.2; reproducible source is `scripts/model-frontier.py`, editable project `scripts/frontier-source.blend`. There is no downloaded or image-reconstructed mesh in these models. Original experiment work under the repository's terms, with no additional third-party model license.

The file is 634,036 bytes. PIP: 5,512 triangles; Haven: 7,149; Seed: 4,802. The GLB retains material slots, UVs and separate motion pivots. Runtime coating texture, motion, team materials and event reactions are original work in `src/frontier.js` / `src/technology.js`. The soil/cliff materials still use the CC0 sources above. No new external texture has been added.

[Authoring, research, runtime evidence and limits](docs/FRONTIER.md). The prior authored Three.js technology family is preserved in comparison commit `4867c595a6d18e3f20340d7a7b283574adb7645c` and replaced in the current build.

Official sources and their preview images rechecked on 2026-10-12:

- [Quaternius Ultimate Space Kit](https://quaternius.com/packs/ultimatespacekit.html): CC0, commercial use allowed; researched, no new files imported.
- [Kenney Space Kit](https://kenney.nl/assets/space-kit): CC0; researched, no files imported.
- [Poly Haven license](https://polyhaven.com/license): existing material subset remains CC0.

The available to3D image-conversion tools were evaluated but not used. Blender supplied more controllable surfaces and articulated parts for the required footprints. No claim of external 3D generation is made.

## Research and reference only

- [Kenney Nature Kit](https://kenney.nl/assets/nature-kit), CC0: researched but too simplified for this direction; not included.
- [Quaternius Modular Sci-Fi MegaKit](https://quaternius.com/packs/modularscifimegakit.html), CC0: researched, formerly used, replaced by architecture shaped to the existing tactical footprint.
- Tacticus gameplay screenshots from [Multiplayer.it](https://multiplayer.it/recensioni/warhammer-40000-tacticus-recensione-strategico-ios-android.html) were visually inspected as design references only. They belong to their respective rights holders and are not included in the repository, playable build or delivery images.

## Runtime

Three.js r169 and its local loader/utilities retain their MIT notice in `vendor/THREE-LICENSE.txt`. Playwright and Pillow are optional authoring/test tools, not playable-build dependencies.

### PIP-Referenzüberarbeitung

Die PIP-Drohne wurde anschließend anhand der vier vom Nutzer bereitgestellten Konzepttafeln neu modelliert. Die Tafeln dienten gemeinsam als Form-/Materialreferenz und sind nicht Bestandteil von Repository oder Build. Keine Bildflächen ersetzen 3D-Geometrie. Eigenständig in Blender modellierte Schalen, optischer Sensor und profilierte Schwebegondeln; keine zusätzlichen externen Meshes oder Texturen. HQ/Relais entsprechen weiter dem Stand `55d7047`. Herstellung und genaue Referenznamen: [DRONE.md](docs/DRONE.md).

### Command HQ – isolierter HQ-Art-Pass

`public/assets/command-hq/command-hq.glb` ist ein neues, eigenständig in Blender 5.2 modelliertes HQ, im isolierten Experiment integriert. Grundlage ist die vom Nutzer bereitgestellte Architekturvorlage `79cab1a4-d284-4014-9621-049f9b353af9.png`; das Bild wird nicht mitverteilt. Meshes und kleine Roughness-Texturen sind eigens erstellt, keine zusätzlichen externen Assets. Bearbeitbare Quelle: `scripts/command-hq-source.blend`; Herstellung, Bilder und aktueller Integrationsstatus: [HQ_COMMAND.md](docs/HQ_COMMAND.md). Die bisherige gemeinsame HQ-/Drohnen-/Relais-Datei bleibt bytegleich; das neue HQ wird separat geladen.

## Campaign maps and river — 13 October 2026

Morgenwacht retains its existing geometry, props and material data. Windpass and Auenstrom are authored layouts using the same licensed subset above. The river ribbon mesh, 256² procedural normal map, sparse ripple strokes and narrow shoreline geometry are original repository code (`src/river.js`, `src/art.js`), created for this experiment. No additional downloaded models, textures, remote services or dependencies. Original repository mission layouts supplied design inspiration only; no third-party game artwork was introduced.

The three JPEG mission illustrations in `public/assets/campaign/` are captures of this project's real Three.js maps, made by `scripts/capture-campaign-art.mjs`. They reuse only the assets already attributed above; no external concept artwork or generated background replaces the playable terrain.


## Vom Nutzer gelieferte generierte GLBs · 13. Oktober 2026

`public/assets/supplied/hoverbot.glb`, `relay.glb` und `mech.glb` gehen auf die Dateien aus `HEXFRONT_4_GLB_Quellen.zip` zurück. `hq.glb` verwendet stattdessen das anschließend gelieferte `task_20d92a94-d624-4887-96eb-008eb26802ac_model.glb` aus der neuen freistehenden HQ-Vorlage. Der Nutzer hat ihre Bearbeitung und Integration beauftragt. Der ZIP-Quelle lag keine separate Lizenzdatei bei; sie werden ausdrücklich **nicht als CC0** oder als unabhängig lizenzgeprüfte Drittanbieterassets ausgewiesen. Anbieter-/Kontobedingungen der Generierung bleiben maßgeblich.

Originale Farbtexturen bleiben in den GLBs erhalten. Optimierung, gezielte Trennung, Bodenverschluss, PBR-Masken und die ergänzte Hover-Bot-Sensorlinse wurden im Projekt erstellt. Die neue HQ-Bildvorlage in `docs/imported-assets/hq-clean-source.png` ist eine mit ImageGen bearbeitete Nutzerreferenz; sie ist kein Bestandteil der gerenderten Spielwelt. Der Nutzer lieferte danach das daraus erzeugte 3D-Modell. Keine zusätzlichen Warhammer-/Tacticus-Assets oder heruntergeladenen Fremdtexturen wurden verwendet. Einzelheiten, Hashes und bearbeitbare Blenderquellen: [SUPPLIED_ASSETS.md](docs/SUPPLIED_ASSETS.md).
