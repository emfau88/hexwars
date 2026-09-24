# Bulk 8G – Level-9-Static-Map

**Stand:** 24. September 2026  
**Status:** `DONE`  
**Scope:** Statisches Core-Artwork und präzise Landschafts-Overlays für Level 9. Keine Änderung an Raster, Wegfindung oder Kampfregeln.

## Ergebnis

Level 9 (`THREE PASSES`) nutzt ein eigenes alpines Spätfrühlings-Artwork im gemeinsamen `MapArtRenderer`. Vier kompakte, transparente Bergmassive liegen geometrisch exakt auf den nicht spielbaren Zellen `(0,6)`, `(2,6)`, `(4,6)` und `(6,6)`. Die drei dazwischenliegenden Spielkorridore mit Hill, Relay und Hill bleiben deutlich lesbar und vollständig interaktiv.

Die Freiflächen für die HQs `(3,1)` und `(3,11)` sowie die drei strategischen Passfelder `(1,6)`, `(3,6)` und `(5,6)` sind im Artwork reserviert. Raster, Ownership, Structures, Einheiten und Effekte bleiben codegesteuert. Level 9 ist nun in der Kampagne veröffentlicht; Level 10 bleibt als nächster, noch nicht verfügbarer Eintrag sichtbar.

## Assets und QA

- Core: `public/assets/maps/level09-core-v1.webp`
- Wiederverwendbares Bergmassiv: `public/assets/maps/level09-mountain-block-v1.webp`
- Kampagnen-Previews: `public/assets/map-previews/level09-preview-v1.webp` und `level09-mountain-block-preview-v1.webp`
- Kombiniertes Runtime-Budget: unter `1,6 MB`
- Exakter Geometrie-Guide, ImageGen-Quellen und Runtime-Captures: `docs/qa/bulk-8g-level09-visual-poc/`

Built-in Image Generation lieferte den spielfreien alpinen Core und ein transparentes, map-spezifisches Bergmassiv. Der Code-Guide blieb dabei die Geometrieautorität; das Bergmassiv wird viermal über feste World-Rects platziert. Desktop und Mobile wurden visuell geprüft. Die Kampagnen-, Landschafts- und Regressions-Suites sichern Veröffentlichung, Asset-Budget, Passgeometrie sowie den Übergang von Level 9 zur Level-10-Vorschau ab.
