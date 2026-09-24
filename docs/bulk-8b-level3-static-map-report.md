# Bulk 8B – Level-3-Static-Map

**Stand:** 19. September 2026  
**Status:** `DONE`  
**Scope:** Statisches Core-Artwork für Level 3. Keine Animation, keine Gameplay-, Balance- oder Geometrieänderung.

## Ergebnis

Level 3 (`THE CENTER`) nutzt nun den gemeinsamen `MapArtRenderer` und ein eigenes statisches Landschaftsbild. Das echte Code-Raster, Ownership, Einheiten, Zahlen und HQ-Assets bleiben separate Gameplay-Layer.

Das Artwork bildet ein ruhiges, überwuchertes Ruinenfeld mit offenem Zentrum ab. Die sechs Ruinenbereiche liegen an den äußeren Flanken; die HQ-Safe-Areas bei `(3,1)` und `(3,11)` sowie das starke neutrale Zentrum bei `(3,6)` bleiben frei und lesbar.

## Asset und Pipeline

- Core: `public/assets/maps/level03-core-v1.webp`
- Abmessung: `1438 × 1093`
- Dateigröße: `691.022 Bytes`
- Keine Wasser-, Shore- oder Animationsassets
- Exakter Guide: `docs/qa/bulk-8b-level03-visual-poc/level03-exact-art-guide.svg` und `.png`
- Guide-Overlay: `level03-core-v1-guide-overlay.png`
- Desktop-/Mobile-Runtime: `runtime-final/`

Der neue generische Konverter `scripts/convert-map-art-webp.ts` überführt opake Map-Cores verlustarm in WebP. Damit sinkt Level 3 von rund 3,22 MB PNG auf rund 691 KB WebP.

## Image-Generation-Provenienz

Built-in Image Generation, eine einzige Generationsrunde. Referenzen: exakter Level-3-Code-Guide als Geometrieautorität, Level-1-Core als Renderingreferenz und der Karten-Styleguide als Art Direction.

Kernprompt: statisches Premium-near-top-down-Ruinenland mit großen ruhigen Kampfflächen, sechs flankierenden Ruinenbereichen, freien HQ- und Zentrum-Safe-Areas, ohne Grid, Text, Structures, Teamfarben, Wasser oder Animation.

## Verifikation

- Guide-Overlay: keine relevante Kollision mit HQs oder Zentrum
- Desktop `1440 × 900`: bestanden
- Mobile `390 × 844`, DPR 2: bestanden
- Produktions-Build: bestanden
- Unit-/Integrationstests: bestanden
- Assetbudget `< 1,6 MB`: bestanden
- Human Review: freigegeben

