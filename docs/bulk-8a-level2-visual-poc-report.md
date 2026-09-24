# Bulk 8A – Pipeline-Generalisation und Level-2-Visual-PoC

**Stand:** 19. September 2026  
**Status:** `REVIEW`  
**Scope:** Wiederverwendbare Map-Art-Pipeline, Level 2 als zweite Beweiskarte und assetbasierte Wasserbewegung. Keine Änderung an Gameplaylayout, Balance oder Victory Logic.

## Ergebnis

Level 2 nutzt nun dieselbe kanonische 1108×842-Welt und denselben uniformen World Transform wie Level 1, erhält aber ein eigenes Map-Manifest, ein eigenes Core-Artwork und zwei transparente Wasserphasen. Das Code-Raster, Ownership, Zahlen, HQs, Units und FX bleiben separate Gameplay-Layer.

Der erste Runtime-Review zeigte zwei reale Guide-Verstöße der AI-Art: Der Fluss ragte in die spielbaren Routen und lief bis unter die HQs. Die Levelgeometrie wurde ausdrücklich **nicht** an das Bild angepasst. Stattdessen wurde das Artwork gegen den exakten Guide korrigiert. Die finale Fassung besitzt:

- eine trockene linke Route in Spalte 2 und eine gleich lange rechte Route, deren Mittelteil den Wasserbecken über Spalte 5 ausweicht;
- trockene, freie HQ-Safe-Areas bei `(3,1)` und `(3,11)`;
- vier kleine Wasserflächen nur in den Deko-Zellen `(3,4)`, `(3,5)`, `(3,7)` und `(3,8)`;
- trockene Waldtrenner in den zentralen Reihen 3, 6 und 9;
- den bestehenden linken Küsten-/Wasserbereich als visuelles Landmark;
- keine eingebrannten Hexlinien, Zahlen, Structures oder Teamfarben.

Damit bestätigt der PoC zugleich eine wichtige Pipeline-Regel: Image Generation kann den Guide gut genug als Art-Grundlage verwenden, ist aber nicht zuverlässig genug für automatische Abnahme. Guide-vs-Core-Overlay und echter Runtime-Screenshot bleiben verpflichtende Gates.

## Technische Änderungen

- `MapArtManifest` ist jetzt eine Registry pro Level statt eines Level-1-Sonderfalls.
- Ein Manifest definiert Core-Asset, Quellmaß, World-Rect, Safe Areas, Backdrop/Fog sowie optionale Wasserframes und Zyklusdauer.
- `MapArtRenderer` lädt Assets lazy pro Level, wechselt beim Levelwechsel sauber und zeichnet Level-2-Wasser ausschließlich aus transparenten Assets.
- Level 1 behält vorerst seinen vorhandenen Shore-Fallback; nicht migrierte Levels behalten vollständig den bisherigen `LandscapeRenderer`.
- Der generische Guide-Exporter liest Leveldaten, Terrain, spielbare Zellen, HQs und Structures direkt aus dem Code.
- Der Runtime-Capture erzeugt Desktop-/Mobile-Screenshots sowie getrennte Environment-Phasen für visuelle Regressionen.

Es wurde kein zusätzlicher `MapArtRenderer` neben dem bestehenden eingeführt. Die vorhandene Klasse ist nach der Generalisierung der passende Besitzer für Core, Wasser und Atmosphere; ein zweiter Renderer würde World-Transform und Ladezustände unnötig duplizieren.

## Asset-Stack

| Asset | Zweck | Größe |
| --- | --- | ---: |
| `public/assets/maps/level02-core-v5.png` | statisches, opakes Core-Art | 2.729.689 Bytes |
| `public/assets/maps/level02-water-low-v3.png` | transparente Wasserphase A | 660.811 Bytes |
| `public/assets/maps/level02-water-high-v3.png` | transparente Wasserphase B | 644.772 Bytes |
| **Gesamt** | Level-2-Visual-Stack | **4.035.272 Bytes** |

Die Wasserphasen werden in einem sieben Sekunden langen Crossfade auf dem 15-Hz-Environment-Layer abgespielt. Gameplay bleibt im 60-FPS-Loop. Bei `prefers-reduced-motion` friert der Phasewert ein; das Asset bleibt als statische Veredelung sichtbar.

## QA-Evidenz

- Exakter Guide: `docs/qa/bulk-8a-level02-visual-poc/level02-exact-art-guide.svg` und `.png`
- Finale Guide-Überlagerung: `level02-core-v5-guide-overlay.png`
- Finale Desktop-/Mobile-Runtime: `runtime-final/`
- Getrennte Wasser-/Atmosphere-Phasen: `runtime-final/*-environment-a.png` und `*-environment-b.png`

Automatisierte Checks:

- TypeScript-Typecheck: grün;
- Produktions-Build: grün;
- 85 Unit-/Integrations-Tests: grün;
- Desktop-Browser-Test: Core und zwei Wasserphasen vollständig geladen, World Transform korrekt;
- Mobile-DPR-2-Smoke: durchschnittliche und p95-Renderkosten innerhalb des 16,67-ms-Ziels;
- Assetbudget: Core unter 3,2 MB, Wasserframes jeweils unter 850 KB, Gesamtstack unter 4,3 MB.
- Rechtsroute: zehn Bewegungen wie zuvor; jede Kante ist direkte Hexnachbarschaft und beide Wasserpaare werden ohne Anschlusslücke umgangen.

## Image-Generation-Provenienz

- `level02-core-v5.png` ist eine **Edit-Fassung** des vorherigen Level-2-Cores mit dem exakten Code-Guide als zweite Referenz. Kernprompt: zwei getrennte kurze Wassersegmente ausschließlich in `(3,4/5)` und `(3,7/8)`, trockene HQ-Safe-Areas und freie spielbare Routen, keine eingebrannten Gameplay-Layer.
- `level02-water-low-v3.png` wurde aus dem finalen Core als **neues transparentes Overlay** erzeugt. Kernprompt: nur vorhandenes Wasser, dezente Glints und Foam, vollständige Transparenz außerhalb der Küste und vier Teiche.
- `level02-water-high-v3.png` ist eine **Edit-Fassung** der ersten Wasserphase. Kernprompt: identische Geometrie und Transparenz, lediglich versetzte Glints/Ripples und leicht vorgerückte Foam-Fragmente für einen ruhigen Crossfade.

## Offene Reviewpunkte

- Wahrnehmbarkeit und gewünschte Stärke der Wasserbewegung im Human-Playtest;
- echtes Frame-Pacing auf repräsentativer physischer Mobilhardware; Headless-CPU-Werte ersetzen diesen Test nicht;
- seitlicher Fog/Bleed bleibt der bereits vorgemerkte spätere Polishpunkt;
- bevor mehrere weitere Maps folgen, die Level-2-Erfahrung einmal bei normalem Spieltempo abnehmen.

## Entscheidung

**GO für Review, noch kein pauschaler Neun-Map-Rollout.** Die technische Pipeline trägt eine zweite Karte und assetbasierte Bewegung, doch die iterative Korrektur zeigt, dass jede weitere AI-Core-Art weiterhin mapweise geführt und abgenommen werden muss. Nach Human-Abnahme von Level 2 können weitere Maps in kleinen Gruppen migriert werden.
