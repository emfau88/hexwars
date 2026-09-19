# Bulk 8C – Level-4-Static-Map

**Stand:** 19. September 2026  
**Status:** `DONE`  
**Scope:** Statisches Core-Artwork für Level 4. Keine Animation und keine Gameplay- oder Geometrieänderung.

## Ergebnis

Level 4 (`HIGHLANDS`) nutzt ein eigenes statisches Hochland-Artwork im gemeinsamen `MapArtRenderer`. Der Code bleibt Autorität für Raster, spielbare Zellen, Hill-Terrain, Ownership, Structures und Einheiten.

Das Zentrum bei `(3,6)` besitzt eine kompakte flache Felssilhouette. Eine erste, übergroße Ringfassung wurde nach dem Guide-Overlay verworfen und gezielt verkleinert, damit benachbarte spielbare Hexe nicht wie blockierte Felder wirken. Die HQ-Safe-Areas `(3,1)` und `(3,11)` bleiben frei.

## Asset und QA

- Core: `public/assets/maps/level04-core-v1.webp`
- Abmessung: `1438 × 1093`
- Dateigröße: rund `644 KB`
- Keine zusätzlichen Animationsassets
- Guide und Overlay: `docs/qa/bulk-8c-level04-visual-poc/`
- Runtime-Desktop/Mobile: `runtime-final/`

Built-in Image Generation mit einer Grundgeneration und einer gezielten Korrektur des zentralen Hills. Referenzen waren der exakte Code-Guide, Level 3 als Stilreferenz und der Karten-Styleguide.

