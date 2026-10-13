# Übernommene Komponenten und Herkunft

Stand: 14.10.2026. Lokale Integration, keine neuen Downloads, keine neue Rendering-Engine. Referenzstand: `experiment/mixed-squads` / Worktree `codex/lane-wars`, Commit `f187bc3`. Ausgewertete Original-Screenshots liegen in `reference/`; sie wurden tatsächlich angesehen, nicht aus Quellcode erschlossen.

| Bestandteil | Bestehende Quelle | Verwendung in Lane Wars |
|---|---|---|
| Three.js r169, GLTFLoader, BufferGeometryUtils | HEXFRONT 3D `vendor/` | Lokale Kopie mit MIT-Notice, keine CDN-Verbindung |
| 70°/55°-Kamera, projizierte Grenzen, Pan-Begrenzung | HEXFRONT 3D `src/camera.js` | Übernommen; Ausrichtung, HUD-Freiraum und Zoom für zwei längere Wege angepasst |
| Felsprofile, UVs, natürliche Farbvariation, Gras/Laub | Mixed Squads `src/art.js` | Gezielter Funktionsauszug `art-helpers.js`; Instancing statt pro Pflanze eigener Draw Call |
| Durchgehende Geländedecke und Wiesen-/Erde-Mischung | Mixed Squads `art.js`, `landscape.js` | Neu angepasste kontinuierliche Höhenfläche und Wegatlas; kein Hexraster und kein Hexbesitz |
| Licht/Schatten, ACES-Farbabbildung | Mixed Squads `src/scene.js` | Warme Sonne, Himmels-/Bodenlicht, kühles Aufhelllicht, weiche 2048²-Schatten |
| Texturmaske für Fraktionsfarben | Mixed Squads `src/supplied-assets.js` | `team-material.js`; nur warme Akzentflächen färben sich, Keramik/Metall/Details bleiben erhalten |
| Modell-Batching und Instancing | Mixed Squads `src/frontier.js` | Geometrie pro Material gebündelt, Instanzen je Typ/Fraktion; jeder Roboter bleibt eine individuelle Simulationseinheit |
| Keramik-Palette, Radien, Schatten, Typografie | Mixed Squads `src/cozy.css` | Kompaktes HUD und vier inaktive Fabrikkarten in `battle.css` |
| SVG-Symbole und Drohnen-/Mech-Illustrationen | Mixed Squads `src/ui-icons.js` | Lokale unveränderte Kopie; Segoe UI/System-Fallback ohne Font-Download |
| HQ, Hover-Bot, Mech | Vorbereitete Lane-Wars-GLBs, identisch zur gelieferten HEXFRONT-3D-Familie | Originalmodelle, UVs und eingebettete Texturen; Abmessungen an die neue Bühne angepasst |
| Relais | HEXFRONT 3D `public/assets/supplied/relay.glb` | Geprüft, bewusst nicht eingebaut: im vereinbarten Lane-Wars-Spielumfang kein Relais |
| Fernkämpfer | Kein Rail-/Ranged-GLB in den geprüften Referenzbranches | Kleiner eigener geometrischer Platzhalter: helle Hülle, Fraktionsakzent, niedriger vierbeiniger Stand, lange parallele Läufe. Keine finale Modellierung behauptet |

## Lizenzen und Nachweise

- Three.js und lokale Loader/Utilities: MIT, `vendor/THREE-LICENSE.txt`.
- Poly Haven: Rock Boulder Dry / Rock Wall 02, vorhandene optimierte CC0-Texturen. `public/materials/LICENSE-PolyHaven.txt` und `material-provenance.json` erhalten Autoren, Originalquellen und Hashes.
- Quaternius-Farn: CC0, vorhandene Dateien `Fern_1.gltf`, `.bin`, `Leaves.png`. Originalnotice in `public/nature/LICENSE-Quaternius.txt`.
- Gelieferte generierte Roboter-/HQ-GLBs: vom Nutzer zur Integration bereitgestellt. Keine mitgelieferte separate Lizenz, ausdrücklich keine CC0-Einstufung. Ursprungsbedingungen bleiben maßgeblich. Historische Dokumentation in `reference/SUPPLIED_ASSETS.md`, ursprüngliche Optimierungsdaten in `public/models/source-optimization.json`.
- Eigenes bestehendes HEXFRONT-Geometrie-/UI-Material bleibt Projektarbeit. Die originalen Herkunftstexte werden in `reference/asset-history.md` archiviert; dortige alte Laufzeitpfade beschreiben die Ursprungsprojekte.
- Die Mixed-Squads-Screenshots dienen ausschließlich dem dokumentierten Vergleich. Sie werden nicht als Landschaftstexturen verwendet.

`asset-manifest.json` dokumentiert die übernommenen Dateien einschließlich SHA-256. Alle Runtime-Imports und Requests bleiben innerhalb dieses Experiments. Weder Mixed Squads noch HEXFRONT 3D muss daneben installiert oder gestartet sein.

## Animation: vorhandene Substanz und offene Arbeit

Die tatsächlich geladenen GLBs enthalten: Hover-Bot 14.070 Dreiecke / 2 Meshes, Mech 23.502 / 1 Mesh, HQ 44.540 / 2 Meshes. Alle drei enthalten **0 Skins und 0 Animationsclips**. Diese Werte werden im Browsertest am geladenen Asset geprüft.

Die Mech-Vorschau bewegt den gesamten starren Körper leicht, richtet ihn auf sein tatsächliches Ziel aus und zeigt Rückstoß. Beine und Arme sind nicht unabhängig animiert. Für eine vollständige Laufanimation müssen in der vorhandenen Blender-Quelle Gelenkbereiche sauber separiert beziehungsweise retopologisiert, verdeckte Gelenkflächen ergänzt, ein Skelett mit sauberen Ursprüngen angelegt und Gewichte geprüft werden. Danach folgen Idle/Walk/Turn/Fire/Hit/Death-Clips, Fußkontakt und Richtungs-Blending; erst nach Export können AnimationMixer beziehungsweise Skinning das jetzige starre Instancing ersetzen oder ergänzen. Keine automatische Rig-Konvertierung ist durchgeführt worden.

Weitere offene Assets: finales Fernkampf-GLB mit Materialdetails und korrekt platzierten Waffen-/Gelenkpivots; echte 3D-Fabriken mit Ausfahrten für einen späteren Meilenstein. HQ-Radar, Hangar/Ausfahrt, getrennte Mech-Waffenbewegung, aufwendigere Treffer-/Zerstörungsanimationen und Audio sind noch nicht ausgearbeitet. Die gelieferten HQ-Pivots bleiben im Quell-GLB erhalten; der aktuelle gerenderte HQ-Batch ist statisch.
