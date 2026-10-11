# HEXFRONT prototype asset sources

Verified on 2026-10-11.

All third-party art in this subset was created by **Quaternius** and released under **CC0 1.0 Universal (Public Domain Dedication)**. Commercial use, modification, and redistribution are permitted. Attribution is not required; these notices are retained for provenance.

License: https://creativecommons.org/publicdomain/zero/1.0/

## Stylized Nature MegaKit — Standard (July 2024)

Official source and license statement:
https://quaternius.com/packs/stylizednaturemegakit.html

The official page explicitly identifies CC0 and commercial use. The original Standard license notice is preserved as `public/assets/nature/LICENSE-Quaternius.txt`.

Selected files:

| Model | Triangles | Supporting texture |
| --- | ---: | --- |
| Rock_Medium_1.gltf + .bin | 342 | Rocks_Diffuse.jpg |
| Rock_Medium_2.gltf + .bin | 244 | Rocks_Diffuse.jpg |
| Bush_Common.gltf + .bin | 900 | Leaves_TwistedTree_C.png |
| Fern_1.gltf + .bin | 288 | Leaves.png |

Delivery mirror:
https://github.com/anandin/the-wild-between/tree/main/assets/quaternius-nature

The mirror includes the same Quaternius Standard CC0 notice and native mesh buffers. Only the selected art files are used; no game code is copied.

Changes for HEXFRONT: all three textures reduced to 512 x 512 for a small mobile footprint; JPEG MIME declaration corrected; mesh geometry unchanged. Rock color and moss are supplied by the source texture. Foliage preserves alpha-masked leaves. The bush's red-channel color mask is translated to an olive palette in the material shader; source wind-control vertex colors are not used as visible colors.

## Modular Sci-Fi MegaKit — Standard (September 2024)

Official source and license statement:
https://quaternius.com/packs/modularscifimegakit.html

The official page explicitly identifies CC0 and commercial use. The original Standard license notice is preserved as `public/assets/scifi/LICENSE-Quaternius.txt`.

Selected files:

| Model | Triangles | Purpose |
| --- | ---: | --- |
| Prop_AccessPoint.gltf + .bin | 738 | Command-console prop |
| WallAstra_Straight_Broken.gltf + .bin | 5,176 | Damaged fortress wall with exposed cables |

Delivery mirror:
https://github.com/agentkaerf/FreeModels/tree/main/Modular%20SciFi%20MegaKit%5BStandard%5D

Changes for HEXFRONT: native geometry is preserved. The mirror omitted referenced source textures; unresolved references and unused material extensions were removed. Material slots now use a restrained steel/olive/rust palette with distinct roughness and metalness. No absent textures or source shading are claimed to have been imported. Further weathering/detail maps can be supplied by the prototype renderer.

## Provenance and integration

`public/assets/asset-provenance.json` records each fetched file's repository, source path, and source Git blob SHA. Source hashes describe downloaded originals before the changes listed above.

Only six models and their required buffers/textures were retained. No complete asset pack, paid-only model, Warhammer material, or Tacticus content is included.

All glTF buffer byte lengths and image/buffer references were checked locally. Textures were opened and their dimensions checked. The integrated models, foliage masks and materials were inspected in actual desktop and portrait browser screenshots.

Models have arbitrary original origins, especially the sci-fi wall and access console. Normalize with a Three.js Box3, center horizontally, place `min.y` on the ground, and then scale by the desired footprint. Preserve foliage alphaTest and DoubleSide. Clone materials before tinting an instance.

The nature material/geometry is suitable for a consistent stylized diorama. The sci-fi meshes provide useful authored forms and separate material surfaces; the missing original maps mean their final quality depends on the prototype lighting and additional material treatment. These six meshes alone do not establish Tacticus-level visual quality.

## Original work and runtime

Terrain, ramp geometry, HQs, relay, tracked rovers, surface weathering/noise maps, UI and effects were authored in this experiment. They contain no generated background image or third-party Warhammer/Tacticus content. No paid asset pack was purchased. The alternative CC0 sources Poly Haven and Kenney, plus Quaternius' Sci-Fi Essentials kit, were considered but are not bundled.

`vendor/three.module.min.js`, `vendor/loaders/GLTFLoader.js` and `vendor/utils/BufferGeometryUtils.js` come from [Three.js r169](https://github.com/mrdoob/three.js/tree/r169), distributed under the **MIT license**. The complete notice is retained in `vendor/THREE-LICENSE.txt`. The browser-test dependency Playwright is optional and is not bundled with the playable build.
