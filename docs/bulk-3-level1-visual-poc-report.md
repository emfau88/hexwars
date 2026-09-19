# Bulk 3 – Level-1-Visual-PoC

Stand: 19. September 2026  
Branch: `codex/improve-mobile-onboarding-copy`

## Ergebnis

Der Level-1-PoC beweist die technische Kernpipeline: mathematisch autoritative Spielgeometrie, uniform transformiertes Core-Art, getrenntes Code-Raster, transparente Ownership, codeplatzierte Structures, responsive Bleed-/Fog-Flächen und günstige Umweltanimationen. Die Pipeline ist damit für genau eine Karte implementiert, aber noch nicht für die übrigen neun Karten freigegeben.

Der offene Exit-Gate-Punkt ist ein 60-FPS-Nachweis auf repräsentativer physischer Mobilhardware. Der DPR-2-Browser-Smoke hält das Render-CPU-Budget deutlich ein; die lokale Headless-Umgebung taktet `requestAnimationFrame` jedoch unabhängig vom Renderaufwand nur mit etwa 30 Hz und eignet sich deshalb nicht als Endgeräte-Nachweis. 30 FPS werden nicht als Erfolg gewertet.

## Architektur

### Autoritative Welt

- Referenzwelt: `1108 × 842`, `7 × 13`, Referenzradius `40.3 px`.
- Level-1-HQs bleiben codeautoritative Zellen `(3,3)` und `(3,9)`.
- `currentScale = runtimeRadius / referenceRadius`; dieselbe uniforme Matrix positioniert Core-Art, Raster, Structures und Spielobjekte.
- Das AI-Artwork wird mit einem zentrierten Quell-Crop auf das exakte Referenzseitenverhältnis gebracht. Es gibt kein unabhängiges `scaleX`/`scaleY`, kein CSS-`cover` und kein Stretching des Core-Bereichs.

### Reale Layer

Die Implementierung nutzt drei Canvas-Ebenen:

1. statischer Map-Canvas: Backdrop/Bleed und Level-1-Core-Art, nur bei Load/Resize neu gerendert;
2. transparenter Environment-Canvas: Wasser, Shore/Foam und Randatmosphäre mit maximal 15 Hz;
3. transparenter Gameplay-Canvas: Grid, Ownership/Selection, Structures, Units/Movement und Gameplay-FX im 60-FPS-Loop.

Effektive Reihenfolge:

`Backdrop → Core → Water → Shore → Atmosphere → Grid → Territory/Selection → Structures → Units/Movement → Gameplay FX → DOM UI`

Atmosphäre liegt absichtlich unter sämtlicher Gameplayinformation. Fog wird zusätzlich aus dem Runtime-Boardbereich ausgeschnitten und kann deshalb weder Raster, Structures noch Einheiten verdecken.

### Renderer-Entscheidung

`LandscapeRenderer` bleibt erhalten. Er zeichnet weiterhin alle neun Legacy-Karten und stellt die vorhandene, aus `exposedWaterShoreEdges()` abgeleitete Shore-Geometrie bereit. Ein Rewrite wäre riskant und ohne Erkenntnisgewinn.

Der neue `MapArtRenderer` ist ein kleiner interner Level-1-Adapter für Asset-Lifecycle, Core-Crop, Bleed, Wasser und Fog. Er ist noch keine öffentliche universelle Map-API. Erst wenn mindestens eine zweite Karte dieselben Verträge bestätigt, sollte daraus ein allgemeines Map-Art-System werden.

## Art-Workflow

Die technische Schablone ist mit folgendem Befehl reproduzierbar:

```text
npm run artguide:level1
```

Ausgabe: `docs/qa/bulk-3-level1-visual-poc/level01-exact-art-guide.svg`.

Das Core-Art wurde mit dem eingebauten ImageGen-Modus aus drei Referenzen erzeugt:

- Overlay-Check als primäres Edit-Ziel;
- exakte 7×13-Code-Schablone als Geometriereferenz;
- Karten-Styleguide als Stilreferenz.

Verwendete Prompt-Zusammenfassung: technische Overlays, Texte, HQ-Ringe und eingebranntes Raster entfernen; Küstenlinie, Framing und große Terrainregionen erhalten; Premium-near-top-down/Top-down-Diorama mit 25–35 % weniger Mikrodetail, ruhigen Kampfwegen und zusammenhängenden Wald-/Felsmassen; keine Structures, Units, Teamfarben oder Fog im Core-Art.

Originaler ImageGen-Output:

`C:/Users/madde/.codex/generated_images/01a0b8ea-0b4b-7b92-905b-9e452fb9201e/exec-7125dc1f-01eb-4515-b1a0-1ab0478cc203.png`

Repository-Kopie:

`public/assets/maps/level01-core-v1.png` (`1438 × 1093`, `2,992,040 Bytes`).

## Visuelle Bewertung

### Bestanden

- Das getrennte Raster bleibt auf Land und Wasser deutlich sichtbar. Ein ruhiges Vollraster erhält den Diorama-/Board-Zusammenhang; eine zweite hellere Kontur markiert ausschließlich bespielbare Hexe.
- Orange/Blau bleiben gegenüber der Landschaft dominant. Der Ownership-Tint wurde moderat auf 30–38 % Deckkraft angehoben, ohne die Landschaft zu verdecken.
- Ein neutraler Wash trennt bespielbare neutrale Hexe von reiner Dekorlandschaft.
- Einheitenzahlen sitzen auf terrainunabhängigen dunklen Plaketten mit Teamakzent. Die HQ-Zahl steht separat unterhalb der Structure-Silhouette und konkurriert nicht mehr mit ihr.
- Erreichbare Ziele erhalten zusätzlich eine warme innere Kontur; Selection, Reachability und Ownership bleiben voneinander unterscheidbar.
- Beide HQ-Platzhalter sitzen exakt auf den Code-Hexzentren und bleiben innerhalb eines Hexes.
- Küste, Wasserblock, offene Mittelroute und große Waldmassen stimmen hinreichend mit der technischen Level-1-Struktur überein.
- Mobile Portrait, 1366×768 und 1920×1080 zeigen denselben Board-Origin, Radius und dieselben Structure-Zentren für ihren jeweiligen Viewport.
- Core-Enden werden durch Renderer-Bleed und ausgeschnittenen Randnebel kaschiert, ohne Gameplay zu überlagern.

### Bewusst nicht Teil dieses PoC

- keine animierte Vegetation: sie war optional und bringt vor dem On-Device-Profiling wenig zusätzlichen Erkenntnisgewinn;
- keine finalen HQ-/Guardian-/Relay-/Node-Assets: der Code-HQ ist ein Footprint-/Layer-Platzhalter, finale Art folgt erst nach dem Structure-Domain-Slice;
- keine Migration weiterer Karten;
- kein Guardian-Gameplay und keine Änderung an Victory, AI oder Supply.

### Beobachtete Risiken

- Auf breiten Desktop-Viewports ist der seitliche Bleed/Fog derzeit zu hell und der Beginn des Fade-Outs als vertikale Übergangskante lesbar. Das ist kein Alignmentfehler; für den Polish-Pass sollen weichere, überlappende Masken beziehungsweise ein organischer asymmetrischer Rand statt eines einzelnen linearen Gradienten geprüft werden.
- Das große Desktop-Command-Dock überdeckt bei kleineren Desktopbreiten einen Teil der linken Landschaft. Das ist kein Transformfehler, aber ein UI-Lesbarkeitsrisiko für einen späteren separaten Pass.
- 1024×1366 fällt aktuell in das Desktoplayout: schmaler Stage, großes Sidepanel und Command-Dock erzeugen viel Fog-/Bleed-Fläche und UI-Überlagerung. Die Map bleibt geometrisch korrekt, die Responsive-Breakpoints sind dort aber nicht optimal.
- AI-Core-Art ist ein gebundener Landschafts-Layer, keine semantische Terrainquelle. Jede weitere Karte braucht weiterhin automatisierte Code-vs-Art-Prüfung und visuellen Review.
- 2.99 MB sind für einen einzelnen PoC vertretbar, aber nicht als zehnfaches ungeprüftes Kampagnenbudget. Vor Rollout sind WebP/AVIF-Vergleich und Gesamtpaketbudget nötig.

## Performance

- Ziel bleibt 60 FPS auf Mobile; 30 FPS ist nur absolute Fallback-Untergrenze.
- Statisches 3-MB-Core-Art wird nicht pro Frame neu gezeichnet.
- Umweltlayer laufen maximal mit 15 Hz und frieren bei `prefers-reduced-motion` oder unsichtbarem Dokument ein.
- DPR ist weiterhin auf 2 begrenzt.
- DPR-2-Mobile-Browser-Smoke nach dem Lesbarkeits-Pass und Warm-up: etwa `0.30 ms` durchschnittliche Render-CPU-Zeit, `0.50 ms` p95 bei 90 Samples (lokaler Headless-/Desktophost; kein Ersatz für physische Mobilhardware).
- Keine `ImageData`-Bearbeitung, keine Full-Canvas-Blur-Filter und keine individuellen Baumanimationen.

## Verifikation

- TypeScript: bestanden.
- Unit-/Regressionstests: `69/69` bestanden.
- Browser: `35` bestanden, `5` erwartete projektspezifische Skips.
- Produktion-Build: bestanden.
- Core-Art-Dekodierung und Maße: Browsertest bestanden.
- Uniformer Core-Transform, DPR-Backing-Store und Layer-Reihenfolge: Desktop und Mobile bestanden.
- Reduced Motion: Umweltphasen werden eingefroren.
- Restart, Levelwechsel und Orientation Cycle: Geometrie bleibt stabil.
- `git diff --check`: keine Whitespacefehler; nur bestehende Windows-Line-Ending-Hinweise.

Screenshots liegen unter `docs/qa/bulk-3-level1-visual-poc/`, insbesondere:

- `mobile-390x844-layered.png`
- `desktop-1366x768-layered.png`
- `desktop-1920x1080-layered.png`
- `tablet-1024x1366-layered.png`
- `readability-desktop-1366x768.png`
- `readability-mobile-390x844.png`

## Gate-Entscheidung

Technisch ist der Level-1-PoC tragfähig. Kein Rollout auf alle Karten, bevor folgende Punkte erledigt sind:

1. physischer Mobile-Test mit Frame-Pacing, CPU/GPU, Speicher und Wärmeentwicklung;
2. visueller Abnahmetest für Rasterstärke, Ownership und HQ-Silhouette;
3. seitlichen Desktop-Bleed/Fog ohne sichtbare lineare Ansatzkante polieren;
4. Entscheidung, ob der 1024-Portrait-Breakpoint in einen eigenen UI-Bulk aufgenommen wird;
5. zweite Karte als Generalisierungstest, bevor `MapArtRenderer` zu einer universellen Pipeline ausgebaut wird.
