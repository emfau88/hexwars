# HEXFRONT – Bulk-1-Abschlussbericht: World Geometry

**Stand:** 19. September 2026  
**Ergebnis:** `GO` für Bulk 2 – Doomstack-/Guardian-Regellabor

## Ergebnis

Bulk 1 beseitigt die Kopplung von Spielzustand und aktueller Canvasgröße. HEXFRONT simuliert Hexe und Army-Bewegungen nun in einer kanonischen Referenzwelt; der Renderer bildet diese Welt mit genau einem uniformen Transform auf die aktuelle Stage ab. Dadurch bleiben Board-Geometrie und Bewegungsdauer stabil, während Desktop, Tablet und Phone weiterhin ihre verfügbare Fläche nutzen.

Die Referenz entspricht der verifizierten Level-1-Art-Guide-Geometrie:

- Stage: 1108×842;
- Welt: 7×13;
- Hexradius: 40,30;
- Board-Center: (554, 421);
- Player-HQ Level 1: (3,9);
- Enemy-HQ Level 1: (3,3).

## Architektur

- `WorldGeometry` berechnet Radius, Origin, Center, Bounds und Hexcenter rein und ohne DOM-Abhängigkeit.
- `WorldTransform` enthält ausschließlich einen uniformen Scale und Translation. Es gibt kein unabhängiges `scaleX`/`scaleY`.
- `GameState` erhält beim Levelstart ausschließlich Referenzwelt-Koordinaten. Ein Resize schreibt nicht mehr in Hex- oder Army-Positionen und verändert damit weder Pfadlänge noch Bewegungsgeschwindigkeit.
- `BoardRenderer` zeichnet zuerst den viewportgebundenen Backdrop und danach Board, Einheiten und FX innerhalb desselben World Transforms.
- `InputController` verwendet den inversen Transform, sodass Pointer- und Touch-Eingaben weiterhin die kanonische Welt treffen.
- Canvas-CSS-Größe und Backing-Store sind getrennt. Device Pixel Ratio skaliert nur den Backing-Store und ist auf 2 begrenzt.
- `HexfrontApp` schaltet zuerst das UI-Layout um und misst danach die Stage. Window Resize, Orientation, Fullscreen und `ResizeObserver` laufen über einen gemeinsamen, per Animation Frame entprellten Pfad.
- Die Debug-API liefert Runtime-/Referenzgeometrie und transformiert Boardpunkte für Browsertests zurück in Screenkoordinaten.

## Geänderte Produktbereiche

- `src/rendering/WorldGeometry.ts` – neue reine Geometrie- und Transformquelle;
- `src/rendering/BoardRenderer.ts` – uniformer Rendertransform und DPR-sicherer Resize;
- `src/input/InputController.ts` – inverse Pointerabbildung;
- `src/app/HexfrontApp.ts` – korrekte Layoutreihenfolge, ResizeObserver und Lifecycle-Resize;
- `src/debug/DebugApi.ts` – Geometriesnapshot für Regressionstests;
- `src/core/GameState.ts` – alten viewportgebundenen Repositionierungspfad entfernt.

Die bereits vor Bulk 1 vorhandenen Änderungen an `index.html`, `src/i18n/catalog.ts`, `src/styles.css` und `src/ui/CampaignUI.ts` wurden nicht überschrieben oder inhaltlich erweitert.

## Tests und Evidenz

Automatisierte Abschlussmatrix:

- `npm test`: 62/62 bestanden;
- `npm run typecheck`: bestanden;
- `npm run test:browser`: 30 bestanden, 4 erwartete Desktop-only-Skips auf Mobile;
- Mobile-Browserprojekt: 390×844 bei DPR 2;
- `npm run verify:production`: bestanden, keine Debug-Einstiegspunkte im Produktionsbundle;
- `npm run balance:doomstack`: bestanden;
- `npm run balance:profiles`: bestanden.

Neue Regressionen prüfen:

- Referenzwerte 1108×842 / Radius 40,30;
- exakte Vorwärts-/Rücktransformation mehrerer Hexcenter auf 1366×768, 1920×1080, 390×844 und 768×1024;
- zentrierte Bounds ohne non-uniform scaling;
- identische Geometrie über alle zehn Levels;
- Kampagnenstart → Restart → direkter Levelwechsel;
- Portrait → Landscape → Portrait mit exakt wiederhergestellter Geometrie;
- reale Pointer-Interaktion in Desktop und DPR-2-Mobile.

Visuelle Screenshots:

- [`1366×768`](qa/bulk-1-world-geometry-2026-09-19/level-1-1366x768.png)
- [`1920×1080`](qa/bulk-1-world-geometry-2026-09-19/level-1-1920x1080.png)
- [`390×844`](qa/bulk-1-world-geometry-2026-09-19/level-1-390x844.png)
- [`768×1024`](qa/bulk-1-world-geometry-2026-09-19/level-1-768x1024.png)

Die manuelle Abnahme zeigte kein horizontales Überlaufen, ein zentriertes vollständiges Raster und stabile Structure-/HQ-Positionen auf allen vier Zielgrößen.

## Bewusste Nicht-Ziele und offene Punkte

- Bulk 1 verändert weder Doomstack-Regeln noch Balance. Der Kontrolllauf bestätigt weiterhin den bekannten Befund: Level 2 gewinnt die 100-%-Doomstack-Route in 28,8 Sekunden bei 100 % Frontstack-Anteil.
- Es wurde noch kein Map-Core, Bleed, Fog, Wasser- oder Vegetationslayer implementiert. Diese Arbeit bleibt hinter dem Bulk-2-Regellabor und dem Bulk-3-PoC-Gate.
- 60 FPS bleibt das verbindliche Mobile-Ziel für den vollständigen Visual-PoC. Eine belastbare Performance-Abnahme beginnt erst mit dessen neuen Layern und Animationen; 30 FPS ist ausschließlich die absolute Fallback-Untergrenze.
- Echtes OS-Fullscreen ist in der Headless-Matrix nicht zuverlässig testbar. Der gemeinsame Fullscreen-/Resize-Pfad ist verdrahtet; die vollständige Fullscreen-Abnahme bleibt Teil des Visual-PoC- und Release-Gates.

## Gate-Entscheidung

`GO`. Die Weltkoordinaten sind stabil genug, um das Doomstack-/Guardian-Regellabor und anschließend einen geometrisch gebundenen Level-1-Visual-PoC darauf aufzubauen. Bulk 2 darf als nächstes beginnen; Guardian-Produktionscode bleibt bis zur Auswahl einer belegten Regelhypothese gesperrt.
