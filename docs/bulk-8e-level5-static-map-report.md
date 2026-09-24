# Bulk 8E – Level-5-Static-Map

**Stand:** 19. September 2026  
**Status:** `DONE`  
**Scope:** Statisches Core-Artwork für Level 5. Keine Animation und keine Gameplay- oder Geometrieänderung.

## Ergebnis

Level 5 (`TWO PASSES`) nutzt ein eigenes statisches Hochland-Artwork im gemeinsamen `MapArtRenderer`. Zwei breite Spielkorridore bleiben im Core-Art durchgehend frei. Ein einziges transparentes, zusammenhängendes Zentralmassiv wird anschließend geometrisch exakt über die sieben nicht spielbaren Mittelzellen `(3,4)`, `(3,5)`, `(2,6)`, `(3,6)`, `(4,6)`, `(3,7)` und `(3,8)` gelegt. Raster, spielbare Zellen, Guardian-Logik, Ownership, Structures und Einheiten bleiben vollständig codegesteuert.

Freiflächen sind für die HQs `(3,1)` und `(3,11)` sowie für die beiden Guardians `(1,4)` und `(5,4)` reserviert. Ergänzt wurde nur der eine statische Landschafts-Layer; es gibt keine neue Animation oder Gameplay-Logik.

## Asset und QA

- Core: `public/assets/maps/level05-core-v1.webp`
- Zentralmassiv: `public/assets/maps/level05-central-massif-v1.webp`
- Abmessung: `1438 × 1093`
- Zielbudget: unter `1,6 MB`
- Guide und Overlay: `docs/qa/bulk-8e-level05-visual-poc/`
- Runtime-Desktop/Mobile: `runtime-final/`

Built-in Image Generation für den bergfreien Core und ein einzelnes transparentes, map-spezifisches Zentralmassiv. Level 1 ist die verbindliche Stilreferenz; der exakte Code-Guide ist Geometrieautorität. Das Massiv wird nicht frei in das Core-Art eingebrannt, sondern reproduzierbar über einen festen World-Rect platziert. An Level 4 erfolgen bis zum späteren Polish-Pass keine weiteren Änderungen.
