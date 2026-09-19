# HEXFRONT – Living Plan für den nächsten Entwicklungs-Pass

**Dokumentstatus:** Lebende Arbeitsgrundlage; Bulks 0–2 abgeschlossen, Bulk 3 in Review  
**Stand:** 19. September 2026  
**Aktueller nächster Schritt:** Bulk 3 – physischer Mobile-60-FPS-Test und visuelle Abnahme  
**Pflegeprinzip:** Dieses Dokument wird nach jedem Bulk mit Status, Evidenz, Entscheidungen und offenen Risiken aktualisiert.

## 1. Zweck und Arbeitsregeln

Dieser Plan übersetzt den Audit des aktuellen Kongregate-Stands in eine kontrollierte Umsetzungsreihenfolge. Die Reihenfolge maximiert Erkenntnisgewinn und begrenzt Rückbau: erst Baseline und Geometrie, dann Regel-Experimente, danach ein vollständiger visueller Level-1-Proof-of-Concept (PoC), erst anschließend systemischer und visueller Rollout.

Verbindliche Arbeitsregeln:

1. Kein Bulk beginnt, bevor sein Entry Gate erfüllt ist.
2. Jeder Bulk endet mit Tests, dokumentierter Evidenz und einer expliziten Go/Adjust/Stop-Entscheidung.
3. Balance-Hypothesen werden zunächst in Simulationen und isolierten Vertikalschnitten geprüft, nicht sofort über alle zehn Levels ausgerollt.
4. Map-Art bestimmt niemals Gameplay-Geometrie. Welt, Hexcenter, spielbare Zellen und Structures kommen aus Code und Leveldaten.
5. Map-Art, Grid, Structures, Units und FX verwenden denselben uniformen World Transform. Kein unabhängiges `scaleX`/`scaleY`, kein `background-size: cover` und kein `background-size: 100% 100%`.
6. Das visuelle Ziel ist ein konsistenter **Premium stylized top-down / near-top-down strategy diorama**-Winkel. Exakt 90° ist keine Pflicht; Perspektive, Volumen, Beleuchtung und Schatten müssen jedoch über Map, HQ, Guardians, Relays, Nodes, Units und FX zusammenpassen.
7. Mobile wird auf **60 FPS** ausgelegt. **30 FPS ist nur die absolute Fallback-Untergrenze**, nicht das normale Ziel.
8. Freies Basebuilding bleibt außerhalb des Default-Scopes. Feste, kartenspezifische Structures werden bevorzugt.
9. Vorbestehende uncommittete Änderungen werden nicht überschrieben oder stillschweigend in einen Bulk aufgenommen.
10. Ein Bulk darf verworfen werden, wenn Messwerte oder Playtests seine Designhypothese nicht bestätigen.

## 2. Statusmodell

| Status | Bedeutung |
| --- | --- |
| `OPEN` | Noch nicht begonnen |
| `READY` | Entry Gate erfüllt; kann als Nächstes begonnen werden |
| `IN PROGRESS` | Umsetzung oder Verifikation läuft |
| `REVIEW` | Umsetzung abgeschlossen; Gate-Evidenz wird bewertet |
| `BLOCKED` | Externe Entscheidung oder fehlende Voraussetzung verhindert Fortschritt |
| `DONE` | Exit Gate erfüllt und dokumentiert |
| `DEFERRED` | Bewusst auf später verschoben |
| `REJECTED` | Hypothese oder Ansatz nach Prüfung verworfen |

## 3. Verifizierte Audit-Baseline

Diese Angaben stammen aus dem Audit vor Beginn der Implementierung. Bulk 0 friert sie reproduzierbar ein und prüft, ob seitdem etwas verändert wurde.

### 3.1 Repository und Kongregate-Stand

- Repository: `emfau88/hexwars`
- lokal ausgecheckter Branch: `codex/improve-mobile-onboarding-copy`
- lokaler Commit: `bb0fa85e538302cebb223699090e16003a0cf464`
- zuletzt online verifizierter Remote-`main`: `ced065f8151d653f03853e3dd3f488b988c7684b`
- der Branch liegt inhaltlich fünf Commits vor seinem Merge-Base mit `main`; die zwei nachfolgenden `main`-Merge-Commits verändern gegenüber diesem Merge-Base keinen Tree-Inhalt
- Branch-Inhalte stimmen mit den sichtbaren Kongregate-Update-Notizen überein: Kongregate-Paket, Stats, überarbeitete Controls/Progression, Supply-/AI-Änderungen und Doomstack-Diagnostik
- Einschränkung: Die Kongregate-Seite veröffentlicht keinen Commit-Fingerprint. Die Zuordnung ist deshalb hoch plausibel, aber nicht kryptographisch beweisbar.

### 3.2 Vorbestehender Working Tree

Zum Zeitpunkt dieses Dokuments existieren bereits uncommittete Änderungen in:

- `index.html`
- `src/i18n/catalog.ts`
- `src/styles.css`
- `src/ui/CampaignUI.ts`

Diese Änderungen gehören nicht zu diesem Plan-Dokument und dürfen in späteren Bulks nur nach expliziter Abgrenzung berührt werden.

### 3.3 Gameplay-Befunde

- `maxStack` begrenzt eigene Verstärkung auf eigenen Feldern, nicht aber gegnerische Angreifer in der Siege-/Combat-Logik.
- Nach einer Eroberung werden verbleibende Angreifer ohne äquivalentes Stack-Limit zur Feldgarnison.
- Der vorhandene Doomstack-Test ist Diagnose, keine Schutzregel. Für Level 2 erwartet er weiterhin einen Doomstack-Sieg.
- Der aktuelle deterministische Doomstack-Lauf erreicht in Level 2–7, 9 und 10 einen Sieg; Level 8 läuft ins Zeitlimit. Der maximale Anteil am Frontstack liegt in allen ausgeführten Levels bei 100 %.
- Supply priorisiert Überschuss in Richtung eines eigenen Feldes nahe der gegnerischen Base und kann dadurch eine einzelne Route zusätzlich verstärken.
- Die AI besitzt Base-/Approach-Prioritäten, aber keine systemische Antwort auf das ökonomische Grundproblem des direkten HQ-Rushes.
- Victory wird ausgelöst, sobald die tatsächliche gegnerische Base-Koordinate den Besitzer wechselt.
- Guardian, Shield, Outpost, Upgrade Node und eine eigenständige Structure-Domain existieren derzeit nicht.

### 3.4 Geometrie- und Resize-Befund

- Alle Levels verwenden grundsätzlich eine 7×13-Welt.
- Level 1 verwendet Player-HQ `(3,9)` und Enemy-HQ `(3,3)`.
- Die technische Level-1-Guide-Vorlage verwendet eine Referenz-Stage von 1108×842 und einen Referenzradius von 40,30 px; diese Werte stimmen mit der aktuellen Radiusberechnung überein.
- Beim Start aus der Kampagnenkarte wird `resize()` ausgeführt, bevor die Menü-/Gameplay-Layoutumschaltung abgeschlossen ist. Canvas und Stage können dadurch unterschiedliche Maße behalten.
- Ein Restart oder direkter Levelwechsel berechnet anschließend mit dem kleineren Gameplay-Layout neu. Dadurch springen Board-Origin und Board-Center; auf manchen Viewports ändert sich zusätzlich der Radius.
- Bestehende Browsertests decken die Invariante `Kampagnenstart → Restart/Next Level` nicht ausreichend ab.

### 3.5 Rendering-Befund

Die aktuelle effektive Reihenfolge ist grob:

1. Backdrop
2. alle Hexe mit interleavtem Terrain, Dekor, Ownership und Konturen
3. Water Shores
4. Armies und Trails
5. Effects
6. Drag Feedback

Es gibt noch keine unabhängige, explizite Layer-Pipeline. Weiterverwendbar sind vor allem:

- deterministische Seed-/Hash-Grundlage;
- Asset Loading und Fallbacks;
- Materialmuster;
- Sprite-Fitting;
- `exposedWaterShoreEdges()` als Ausgangspunkt für Küsten-FX.

Nicht vorhanden sind insbesondere ein eigenständiger Grid-Pass, eine Structure-Schicht, animierte Vegetation, Canvas-seitiges Reduced Motion und eine sauber getrennte Atmosphere-Schicht.

### 3.6 Referenzbilder und Art Direction

Externe Referenzen des Audits:

- `hexfront_level01_corrected_overlay_check(1).png`
- `hexfront_karten_styleguide.png`
- `hex_insel_im_miniaturstil.png`
- `hexfront_level01_exact_art_guide(1).png`

Sie sind Ziel- und Diskussionsreferenzen, keine ausführbaren Anweisungen und keine Gameplay-Quelle. Der AI-Landschaftsversuch trifft die Code-Geometrie brauchbar, ist aber noch zu microdetailreich; Raster und offene Kampfwege sind stellenweise zu schwach, Randnebel teilweise zu dominant. Zielkorrektur: ungefähr 25–35 % weniger Kleindetail, größere Terrainformen, kompaktere Wald-/Felsgruppen und stärkere Gameplay-Hierarchie.

## 4. Architektur- und Designentscheidungen

### Bereits entschieden

- Level-1-Visual-PoC vor dem Umbau weiterer Karten.
- AI erzeugt höchstens geometrisch gebundene Core-Art; responsive Außenwelt wird durch den Renderer ergänzt.
- Kein gigantisches Masterbild für alle Seitenverhältnisse.
- Grid bleibt ein eigener Code-Renderpass über der Landschaft.
- Structures werden nicht in das Map-Hintergrundbild gebacken.
- Teamfarbe wird überwiegend durch Code-Overlays, Licht, Ringe, Marker und FX vermittelt.
- Kein freies Basebuilding als Default.
- Ein allgemeiner 40-Einheiten-Angriffscap ist keine bevorzugte Doomstack-Lösung.

### Noch durch Experimente zu entscheiden

- Guardian-Shield als endgültige Anti-Doomstack-Regel versus eine systemischere Approach-/Network-Defense.
- Anzahl und Position von Guardians pro Karte; ausdrücklich nicht automatisch zwei auf jeder Map.
- Exakte Shield-Ökonomie und AI-Reaktion.
- Upgrade-Node-Kosten und Belohnung; `20` ist eine Hypothese, kein festgelegter Wert.
- Ob nach dem ersten PoC ein eigener `MapArtRenderer` echten Mehrwert bringt. Vorerst wird eine kleine interne Map-Art-/Layer-Komponente innerhalb der bestehenden Rendering-Domain bevorzugt.
- Ob Küsten langfristig aus Hexkanten, einer zusammenhängenden Regionskontur oder einem authorierten Wassermaskenpfad entstehen.

## 5. Zielarchitektur für World Transform und Layer

### 5.1 World Transform

Eine reine Geometrieschicht soll Board-Bounds, Hexcenter, Radius, Origin und Referenzabbildung berechnen. Für Core-Art gilt sinngemäß:

```text
scale = runtimeHexRadius / referenceHexRadius
translateX = runtimeBoardOriginX - referenceBoardOriginX * scale
translateY = runtimeBoardOriginY - referenceBoardOriginY * scale
```

Der Transform ist uniform. Device Pixel Ratio beeinflusst nur die Canvas-Backing-Auflösung, nicht CSS-Geometrie oder Weltpositionen. Bleed-Decals werden in stabilen Weltkoordinaten gesät, damit ein Resize zusätzliche Welt sichtbar macht, statt Dekoration zufällig springen zu lassen.

### 5.2 Empfohlene Render-Reihenfolge

1. Responsive World Backdrop / Bleed
2. AI-/authorierter Map-Core und Base Terrain
3. Terrain Material Detail und Animated Water
4. Shore / Foam FX
5. Static Environment
6. wenige Animated Environment Decals
7. Background Fog außerhalb der Gameplay-Safe-Area
8. eigenständiges Hex Grid
9. Territory / Reachability / Selection
10. Guardian-Verbindungen und Structure Foundations
11. Structures
12. Units / Movement
13. Gameplay FX
14. optionaler Foreground Edge Fog, hart aus Gameplaybereichen maskiert
15. UI

Ein pauschaler Atmosphere-Pass über Grid und Structures wird verworfen, weil er Spielinformation verdecken kann.

## 6. Bulk-Übersicht

| Bulk | Status | Größe | Kern-Gate |
| ---: | --- | --- | --- |
| 0 – Baseline und Release-Identität | `DONE` | Quick Win | reproduzierbarer, eindeutig dokumentierter Ausgangspunkt |
| 1 – World Geometry und Resize-Invarianz | `DONE` | Quick Win bis mittel | kein Board-Sprung zwischen Start, Restart und Levelwechsel |
| 2 – Doomstack-/Guardian-Regellabor | `DONE` | mittel | endlicher Shield-Pool pro aktivem Guardian ausgewählt |
| 3 – vollständiger Level-1-Visual-PoC | `READY` | strukturell größer | Pipeline, Lesbarkeit, Alignment und 60-FPS-Ziel bewiesen |
| 4 – Structure-Domain und Guardian-Vertikalschnitt | `OPEN` | strukturell größer | ein vollständig integrierter Guardian-Slice |
| 5 – Guardian-Rollout und Map-Rebalance | `OPEN` | strukturell größer | mapweise belegte strategische Mehrtiefe |
| 6 – Upgrade-Node-Experiment | `OPEN` | mittel bis strukturell größer | Investitionsentscheidung erzeugt echten Trade-off |
| 7 – Structure-/Special-Tile-Art und Lesbarkeit | `OPEN` | mittel bis strukturell größer | Mechaniken ohne Kleinglyphen sofort unterscheidbar |
| 8 – Map-Pipeline-Rollout | `OPEN` | strukturell größer | weitere Maps nur über bewiesene Pipeline migriert |
| 9 – Performance-, Accessibility- und Kongregate-Hardening | `OPEN` | mittel | Release-Budget und Plattformmatrix erfüllt |

## 7. Detaillierter Umsetzungsplan

### Bulk 0 – Baseline und Release-Identität absichern

**Status:** `DONE`  
**Einstufung:** Quick Win  
**Ziel / Problem:** Einen reproduzierbaren Ausgangspunkt schaffen, ohne versehentlich vom falschen Branch, einem veralteten `main` oder einem verschmutzten Working Tree aus weiterzuarbeiten.

**Konkrete Änderungen:**

- Remote-Refs und Kongregate-Seite erneut prüfen; Branch, Commit, Tree-Beziehung und Update-Artefakt dokumentieren.
- SHA-256/Fingerprint des vorhandenen Kongregate-ZIP und des reproduzierten Pakets erfassen, falls Packaging deterministisch genug ist.
- bestehenden Working Tree inventarisieren und die vier vorbestehenden Änderungen von diesem Entwicklungs-Pass abgrenzen;
- Baseline-Kommandos und Ergebnisse festhalten: Typecheck, Unit-/Simulationstests, Browsermatrix, Production Verification, Doomstack- und Profilberichte;
- Screenshots und Geometriemessungen für mindestens Level 1 und 2 auf Desktop und Mobile ablegen;
- einen kurzen Baseline-Report unter `docs/` erzeugen und dieses Dokument aktualisieren.

**Betroffene Systeme/Dateien:**

- Git-Metadaten und Remote-Historie, ohne Branchinhalt zu verändern;
- `releases/kongregate/hexfront-update-1.zip`;
- `scripts/package-kongregate.mjs`;
- `package.json`;
- Tests und Scripts nur ausführen, noch nicht ändern;
- neue Audit-/Baseline-Dateien unter `docs/` und gegebenenfalls Screenshot-Artefakte unter einem klar benannten QA-Ordner.

**Erwarteter Effekt:** Jeder spätere Unterschied lässt sich auf eine bekannte Baseline zurückführen; Release- und Kongregate-Annahmen sind explizit statt implizit.

**Risiken / Nebenwirkungen:**

- Kongregate liefert keinen Commit-Identifier;
- Build-/ZIP-Metadaten können byteidentische Reproduktion verhindern;
- Browser-Screenshots können durch Font- oder DPR-Unterschiede variieren;
- vorbestehende UI-Änderungen können die Baseline gegenüber dem Commit verändern und müssen separat ausgewiesen werden.

**Notwendige Tests / Evidenz:**

- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm run verify:production`
- `npm run test:browser`
- `npm run balance:doomstack`
- `npm run balance:profiles`
- Git-Status vor und nach Bulk 0
- dokumentierte Branch-/Commit-/Tree-Beziehung

**Abhängigkeit:** keine  
**Exit Gate:** Baseline-Report vorhanden; alle Abweichungen und vorbestehenden Änderungen benannt; korrekter Arbeitsstand mit Evidenz bestätigt; keine unbeabsichtigte Produktänderung.

**Abschluss:** Erfüllt am 19. September 2026. Evidenz: [`docs/bulk-0-baseline-report.md`](bulk-0-baseline-report.md). Die Browser-Suite besitzt bereits bekannte rote Baseline-Assertions; sie sind vollständig dokumentiert und werden vor beziehungsweise mit Bulk 1 bereinigt.

### Bulk 1 – World Geometry und Resize-Invarianz

**Status:** `DONE`  
**Einstufung:** Quick Win bis mittel  
**Ziel / Problem:** Board-Sprung und inkonsistente Canvasgröße bei Kampagnenstart, Restart und Levelwechsel beseitigen; eine gemeinsame Geometriequelle für spätere Map-Art schaffen.

**Konkrete Änderungen:**

- pure `WorldGeometry`-/`WorldTransform`-Berechnung extrahieren;
- Canvas-Backing-Store, CSS-Stage und Weltkoordinaten explizit trennen;
- Resize erst nach dem abgeschlossenen UI-Layout ausführen und Stageänderungen per `ResizeObserver` erfassen;
- alle Level auf denselben Transformvertrag verpflichten;
- Debug-Snapshot für Radius, Origin, Center, Board-Bounds, Canvasgröße und DPR bereitstellen;
- geometrische Regressionstests für Start, Restart, Next Level, Fullscreen und Orientation Change ergänzen.

**Betroffene Systeme/Dateien:**

- `src/app/HexfrontApp.ts`
- `src/rendering/BoardRenderer.ts`
- `src/core/hex.ts`
- gegebenenfalls neue reine Geometrie-/Transform-Datei unter `src/rendering/` oder `src/core/`
- `src/styles.css`
- `tests/browser/campaign.spec.ts`
- neue Geometrie-Unit-Tests

**Erwarteter Effekt:** Gleicher Viewport bedeutet über alle Missionen und Lifecycle-Pfade identischen Radius, Board-Origin, Center, Bounds und Canvasposition. Diese stabile Grundlage verhindert späteres Map-Art-Driften.

**Risiken / Nebenwirkungen:**

- Sidepanel-/Mobile-Dock-Layouts können ungewollt weniger oder mehr Bühnenfläche erhalten;
- ResizeObserver kann bei unklarer Ownership Schleifen auslösen;
- DPR-Rundung kann Pixelkanten leicht unscharf machen.

**Notwendige Tests:**

- Unit-Tests der Transformmathematik;
- Browsertests bei 1366×768, 1920×1080, 390×844 und Tablet-Portrait;
- Start aus Atlas → Restart → Next Level mit identischen Geometriemesswerten;
- DPR 1 und 2;
- Fullscreen und Rotation;
- Toleranz: Hexcenter und Board-Origin maximal 0,5 CSS-px Abweichung nach stabilem Layout; Radius numerisch identisch innerhalb definierter Floating-Point-Toleranz.

**Abhängigkeit:** Bulk 0  
**Exit Gate:** Keine sichtbare oder gemessene Board-Verschiebung mehr; Regressionstest schlägt beim alten Fehler zuverlässig fehl und mit der Korrektur zuverlässig an.

**Abschluss:** Erfüllt am 19. September 2026. Die Simulation verwendet nun eine kanonische Referenzwelt von 1108×842 bei Radius 40,30; ein einziger uniformer Transform bildet sie auf die aktuelle Stage ab. Start, Restart, direkter Levelwechsel, alle zehn Levels sowie ein Portrait-/Landscape-/Portrait-Zyklus sind browserseitig invariant geprüft. Mobile Browsertests laufen mit DPR 2. Evidenz: [`docs/bulk-1-world-geometry-report.md`](bulk-1-world-geometry-report.md).

### Bulk 2 – Doomstack-/Guardian-Regellabor

**Status:** `DONE`  
**Einstufung:** mittel  
**Ziel / Problem:** Vor Produktionscode klären, welche Regel den direkten HQ-Rush ökonomisch unattraktiv macht, ohne Hard-Cap, künstliche Unverwundbarkeit oder unnötige Systemaufblähung.

**Konkrete Änderungen:**

- Balance-Harness um Strategieprofile und vergleichbare Routen erweitern: direkter Rush, ein Guardian, zwei Guardians, Guardian-Umgehung, geteilte Front, Supply an/aus;
- mindestens drei Hypothesen vergleichen:
  1. Shield-Pool pro aktivem Guardian;
  2. reiner Defense-Multiplikator;
  3. Approach-/Network-Defense aus kontrollierten Zugangssektoren;
- Metriken vor Tuning festlegen: Zeit bis Sieg, investierte/verlorene Einheiten, Spitzenkonzentration, kontrollierte strategische Felder, Pfaddiversität, AI-Reaktion;
- kleine Parameter-Sweeps statt handverlesener Einzelwerte;
- Ergebnis als Design Decision Record dokumentieren.

**Betroffene Systeme/Dateien:**

- `scripts/doomstack.ts`
- `scripts/balance-doomstack.ts`
- `scripts/profile-balance.ts`
- `tests/doomstack.test.ts`
- reine Simulations-Prototypen, noch keine Produktions-UI oder finalen Assets
- `src/systems/CombatSystem.ts`, `SupplySystem.ts`, `VictorySystem.ts` zunächst als Modellreferenz

**Erwarteter Effekt:** Der gewählte Schutz zwingt zu mehreren wirtschaftlich relevanten Angriffspunkten, während das HQ theoretisch weiterhin direkt angreifbar bleibt.

**Risiken / Nebenwirkungen:**

- ein Defense-Multiplikator kann lediglich einen noch größeren Doomstack verlangen;
- vollständige Unverwundbarkeit wirkt binär und spielerisch künstlich;
- zu starke Guardians können Matches verlängern oder eine vorgeschriebene Route erzeugen;
- Botprofile sind kein Ersatz für Human-Playtests.

**Notwendige Tests:**

- deterministische Parameter-Sweeps über repräsentative frühe, mittlere und späte Karten;
- Baseline-vs-Hypothese mit identischen Seeds;
- direkte Route muss möglich, aber gegenüber Guardian-Abbau im Erwartungswert klar ineffizient sein;
- keine unauflösbaren Matches und keine massive Dauerexplosion;
- gezielte Szenariotests für Supply, simultane Angriffe, Guardian-Verlust und HQ-Capture.

**Abhängigkeit:** Bulk 0; kann konzeptionell parallel zu Bulk 1 vorbereitet werden, Produktionsintegration wartet auf dessen Abschluss.  
**Exit Gate:** Eine Regelhypothese mit dokumentierten Parametern und Gründen ausgewählt oder Guardian-Modell ausdrücklich verworfen.

**Abschluss:** Erfüllt am 19. September 2026. Ausgewählt wurde ein endlicher separater HQ-Shield-Pool pro aktivem Guardian. Reiner Defense-Multiplikator und Network Defense werden als Default verworfen. Der direkte Rush bleibt möglich; bei 96 Laborpunkten pro Guardian ist die Zwei-Guardian-Route auf vier Referenzkarten 11–35 % schneller. Dieser Wert ist eine Laborgrenze, kein Produktionstuning. Evidenz: [`docs/bulk-2-guardian-rule-lab.md`](bulk-2-guardian-rule-lab.md).

### Bulk 3 – Vollständiger Level-1-Visual-PoC

**Status:** `REVIEW`  
**Einstufung:** strukturell größer  
**Ziel / Problem:** Die gesamte neue Map-Pipeline auf genau einer Karte beweisen, bevor Assets oder Renderer für alle zehn Levels umgebaut werden.

**Konkrete Änderungen:**

- mathematisch exakten Art-Guide aus der echten Levelgeometrie exportierbar machen;
- Level-1-Core-Art mit Referenzradius, Referenz-Origin, Terrain-/Structure-Safe-Areas und Masken integrieren;
- responsive Bleed-Welt aus ruhiger Ground-Fortsetzung, Seed-Decals, Wasserfortsetzung und Randnebel aufbauen;
- LandscapeRenderer in explizite Draw-Phasen teilen, ohne vorschnell einen eigenständigen öffentlichen `MapArtRenderer` einzuführen;
- eigenständigen, klar sichtbaren Grid-Pass implementieren;
- Ownership, Selection und Reachability getrennt darüber zeichnen;
- Wasserbewegung, exponierte Shore-/Foam-Loops, subtilen Randnebel und optional zwei bis fünf animierte Vegetationsgruppen ergänzen;
- Platzhalter oder erste finale HQ-/Structure-Footprints exakt an Code-Hexcentern testen;
- statische Layer cachen und Canvas-Animation an Visibility, Reduced Motion und Performanceprofil koppeln.

**Betroffene Systeme/Dateien:**

- `src/rendering/BoardRenderer.ts`
- `src/rendering/LandscapeRenderer.ts`
- `src/rendering/EffectsRenderer.ts`
- `src/rendering/palette.ts`
- Level-1-Daten und neue Map-Art-Manifeste
- `public/assets/` für PoC-Core, Masken und wenige Decals
- Export-/Screenshot-Scripts unter `scripts/`
- `tests/landscape.test.ts`
- `tests/browser/campaign.spec.ts` und neue visuelle/geometrische Regressionen

**Erwarteter Effekt:** Hochwertige zusammenhängende Landschaft, weiterhin dominantes lesbares Hex-Gameplay, pixelstabile Ausrichtung und eine wiederholbare Pipeline statt eines einmaligen Wallpaper-Tricks.

**Risiken / Nebenwirkungen:**

- AI-Core-Art kann semantisch vom Code-Terrain abweichen;
- doppelte Küsten aus Artwork und Code-Foam;
- zu schwaches Raster oder zu starke Ownership-Tints;
- Full-canvas Alpha-, Blur- oder Filtereffekte gefährden Mobile-60-FPS;
- Map-Core kann bei extremen Seitenverhältnissen sichtbar enden, wenn Bleed/Masking nicht sauber ist.

**Notwendige Tests:**

- Background↔Grid-Alignment auf 1366×768, 1920×1080, 390×844 und Tablet;
- DPR 1 und 2, Orientation Change, Fullscreen, Restart und Levelwechsel;
- Structure-Center und maximale Footprints;
- Raster-, Ownership-, Selection- und Terrainlesbarkeit per Screenshotreview;
- Reduced Motion friert Umweltphasen ein oder ersetzt sie statisch;
- Mobile-Ziel: stabile 60 FPS auf definierter repräsentativer Hardware nach Warm-up; 30 FPS nur dokumentierte absolute Fallback-Untergrenze;
- keine per-frame `ImageData`-Bearbeitung, kein Full-canvas-Blur, keine dutzenden individuellen Vegetationsanimationen;
- Performanceprofil mit CPU-Zeit, Frame-Pacing, Speicher und DPR dokumentieren.

**Abhängigkeit:** Bulk 1; Art-/Structure-Safe-Areas berücksichtigen das Ergebnis aus Bulk 2, ohne Bulk 4 vorwegzunehmen.  
**Exit Gate:** Der PoC beweist Alignment, Structure-Platzierung, deutliches Grid, Ownership, Wasser, Shore, Fog, optional animierte Vegetation, Viewportstabilität und Mobile-60-FPS-Ziel. Erst dann Go für weitere Karten.

**Zwischenstand 19. September 2026:** Die Level-1-Pipeline ist implementiert: exportierbarer Guide, uniform gebundenes Core-Art, getrennte statische/Umwelt-/Gameplay-Canvas, Code-Grid, Ownership, HQ-Footprints, Wasser, Shore, ausgeschnittener Randnebel, Reduced Motion und Desktop-/Mobile-Geometrietests. Der anschließende Lesbarkeits-Pass nutzt ein ruhiges Vollraster plus stärkere Playable-Kontur, neutralen Playable-Wash, moderat sattere Teamflächen, terrainunabhängige Zahlenplaketten, eine vom HQ getrennte Garrison-Zahl und eine eigene Reachability-Kontur. Der DPR-2-Render-CPU-Smoke liegt danach mit etwa 0,30 ms im Mittel und 0,50 ms p95 klar im 16,67-ms-Budget. Das harte 60-FPS-Gate auf repräsentativer physischer Mobilhardware bleibt offen; deshalb noch kein Rollout auf weitere Maps. Evidenz: [`docs/bulk-3-level1-visual-poc-report.md`](bulk-3-level1-visual-poc-report.md).

### Bulk 4 – Structure-Domain und Guardian-Vertikalschnitt

**Status:** `OPEN`  
**Einstufung:** strukturell größer  
**Ziel / Problem:** Terrain und strategische Structures sauber trennen und die in Bulk 2 ausgewählte Anti-Doomstack-Regel in einem vollständigen Gameplay-Slice beweisen.

**Konkrete Änderungen:**

- eigenständiges Structure-Modell mit Typ, Owner, Zustand, Footprint und optionaler Verbindung einführen;
- HQ und Relay schrittweise aus Terrain-Sonderfällen lösen; Hill bleibt Terrain;
- einen Guardian-Slice mit `active/captured/disabled`, verknüpftem HQ-Shield und klarer Zustandsanzeige umsetzen;
- Combat-, Supply-, AI-, Victory-, Rendering-, UI- und Save-Verträge ergänzen;
- HQ bleibt Victory-Ziel; Guardians verändern Verteidigungsökonomie, nicht die Win Condition;
- Guardian-Produktion standardmäßig null oder sehr niedrig halten und Supply-Regeln explizit definieren.

**Betroffene Systeme/Dateien:**

- `src/core/types.ts`
- `src/core/GameState.ts`
- `src/levels/buildLevel.ts` und ausgewählte Leveldaten
- `src/systems/CombatSystem.ts`
- `src/systems/SupplySystem.ts`
- `src/systems/AISystem.ts`
- `src/systems/VictorySystem.ts`
- Rendering-, Input-, UI-, Localization- und Persistence-Schichten
- neue Structure-/Guardian-Tests

**Erwarteter Effekt:** Mehrere notwendige Angriffspunkte entstehen aus einer verständlichen HQ-Verteidigungsbeziehung statt aus optionalen Objectives.

**Risiken / Nebenwirkungen:**

- Structure-Migration kann bestehende Base-/Relay-Regeln regressieren;
- AI kann Guardians über- oder unterpriorisieren;
- Shield-Kommunikation kann visuell überladen werden;
- Save-Kompatibilität und Debug-Tools müssen mitziehen.

**Notwendige Tests:**

- Structure-State-Machine und Levelserialisierung;
- Shield-Aufbau/-Abbau bei null, einem und mehreren Guardians;
- simultane Guardian-/HQ-Angriffe;
- Supply-Ausschluss oder definierte Versorgung;
- AI-Angriffs- und Verteidigungsentscheidungen;
- Victory bleibt ausschließlich an HQ-Capture gebunden;
- Doomstack-Suite aus Bulk 2 als Produktionsregression.

**Abhängigkeit:** Bulks 1–3  
**Exit Gate:** Ein Level spielt vollständig mit Guardian-System, verständlicher visueller Rückmeldung, AI und stabiler Balance; kein Rollout vor Human-Playtest.

### Bulk 5 – Guardian-Rollout und Map-Rebalance

**Status:** `OPEN`  
**Einstufung:** strukturell größer  
**Ziel / Problem:** Guardian-System nur dort einsetzen, wo es Kartenentscheidungen verbessert, und die Kampagne nicht in zehn Varianten derselben Pflichtsequenz verwandeln.

**Konkrete Änderungen:**

- Levelrollen, Routen, Supply, HQ-Abstände und Lernziele pro Karte neu bewerten;
- Level 1 voraussichtlich guardianfrei halten;
- Level 2 besonders vorsichtig behandeln, weil es den 100-%-Send lehrt;
- je Map null, einen oder zwei Guardians authorieren; keine pauschale Anzahl;
- AI-Werte, neutrale Garnisonen und Shield-Parameter mapweise abstimmen;
- Guardian-Verbindungen und Safe Areas in Map-Manifeste aufnehmen;
- Human-Playtests gegen Simulationsergebnisse führen.

**Betroffene Systeme/Dateien:**

- `src/levels/level01.ts` bis `level10.ts`
- `src/levels/levelFactory.ts`
- AI-/Supply-Konfigurationen
- Balance-Scripts und Leveltests
- Map-Manifeste und Structure-Platzierung

**Erwarteter Effekt:** Karten erhalten unterschiedliche Angriffsgeometrien und strategische Rollen; der direkte HQ-Rush ist nicht mehr universell dominant.

**Risiken / Nebenwirkungen:**

- Guardian-Inflation macht die Kampagne repetitiv;
- zusätzliche Ziele verlängern Matches;
- bestehende Tutorials und Texte können inkonsistent werden;
- Art-Core muss bei Layoutänderungen neu authoriert werden. Deshalb Gameplaylayouts vor Bulk 8 einfrieren.

**Notwendige Tests:**

- alle Balanceprofile und Doomstack-Szenarien pro geänderter Karte;
- Topologie, Erreichbarkeit, Spiegelung und Seedstabilität;
- Browserstart für alle zehn Levels;
- Human-Playtests zu Entscheidungsvielfalt, Dauer und Verständlichkeit;
- Screenshotreview der Guardian-/HQ-Beziehung.

**Abhängigkeit:** Bulk 4  
**Exit Gate:** Jede Guardian-Platzierung besitzt einen dokumentierten spielerischen Grund; Kampagnendauer und Kartenrollen bleiben kontrolliert.

### Bulk 6 – Upgrade-Node-Experiment

**Status:** `OPEN`  
**Einstufung:** mittel bis strukturell größer  
**Ziel / Problem:** Prüfen, ob gebundene reale Einheiten als Investition einen interessanten Front-vs-Zukunft-Trade-off schaffen, ohne eine zweite Währung oder RTS-Tech-Tree einzuführen.

**Konkrete Änderungen:**

- zunächst genau einen Node in einem Mid-Campaign-Testlevel prototypisieren;
- Zustände `inactive → charging → ready/active → optional exhausted` definieren;
- Units beim Investieren tatsächlich binden/entfernen; kein normaler Besitzwechsel, keine reguläre Garnison, keine versehentlichen weiteren Sends nach Aktivierung;
- Kosten als Sweep testen, nicht `20` blind übernehmen;
- zuerst eine klar rückgekoppelte Belohnung testen, bevorzugt Emergency Reserve/Redeploy oder bankbare Reserve;
- zweiten, aktiven Rally-/Supply-Pulse nur ergänzen, wenn der erste Node einen echten, verständlichen Trade-off erzeugt;
- dritten Node auf später verschieben.

**Betroffene Systeme/Dateien:**

- Structure-Domain aus Bulk 4
- Input und Movement Arrival
- Combat-/Supply-Ausschlüsse
- AI-Entscheidungsmodell
- UI, Localization, FX und Leveldaten
- Simulations- und Browsertests

**Erwarteter Effekt:** Der Spieler tauscht aktuelle militärische Stärke gegen späteren taktischen Nutzen, ohne Build-Menü oder neue Ressource.

**Risiken / Nebenwirkungen:**

- Node kann zur automatischen Pflichtinvestition werden;
- Reserve kann Doomstacking verstärken statt mindern;
- Prozentboni sind schwer lesbar und spielerisch flach;
- gegnerische Area-Disruption erhöht Regel- und FX-Komplexität stark;
- AI-Symmetrie ist wesentlich aufwendiger als die reine Spielerfunktion.

**Notwendige Tests:**

- Zustandsmaschine, Partial Funding, Aktivierung und Send-Sperre;
- Supply-/Capture-Ausschluss;
- AI investiert nur unter nachvollziehbaren Bedingungen;
- Balancevergleich Investieren vs. Frontnutzung;
- Interaktion mit Guardian-Shield, Reserve und 100-%-Send;
- Tutorial-/Lesbarkeitstest ohne lange Erklärung.

**Abhängigkeit:** Bulk 4; sinnvoll erst nach erster Guardian-/Map-Balance aus Bulk 5.  
**Exit Gate:** Ein Node erzeugt messbar unterschiedliche, gleichwertige Timing-Entscheidungen. Andernfalls System vereinfachen oder verwerfen; kein zweiter/dritter Node ohne Nachweis.

### Bulk 7 – Structure-/Special-Tile-Art und Lesbarkeit

**Status:** `OPEN`  
**Einstufung:** mittel bis strukturell größer  
**Ziel / Problem:** HQ, Guardian, Relay, Hill und Node durch Silhouette und Zustand sofort unterscheidbar machen; kleine Code-Glyphen nicht länger als Hauptkommunikation verwenden.

**Konkrete Änderungen:**

- kompakte, hex-bündige, transparente Assets mit festen Footprint-Masken erstellen;
- einen konsistenten Premium-near-top-down/Top-down-Diorama-Winkel über alle Assetklassen definieren;
- neutrale Hauptkörper mit Orange/Blau über Code-Licht, Ring, Marker oder Banner;
- HQ als kompakte Kommandoanlage statt übergroßer Festung;
- Guardian als befestigte Shield-/Outpost-Anlage, Relay als eindeutige Signalstruktur, Hill als sichtbare Geländeformation, Node mit klaren Ladezuständen;
- Shield, Capture, Damage, Selection, Charging und Guardian-Link als separate FX;
- bestehende inkonsistente 3/4-/Seitenansicht-Assets priorisiert ersetzen, insbesondere stark sichtbare Bäume/Conifers und monumentale Dekorvarianten.

**Betroffene Systeme/Dateien:**

- `public/assets/`
- Art-Quellen und Review-Sheets unter `art/`
- `src/rendering/LandscapeRenderer.ts`
- `src/rendering/BoardRenderer.ts`
- `src/rendering/EffectsRenderer.ts`
- Map-/Structure-Manifeste

**Erwarteter Effekt:** Strategische Bedeutung ist direkt auf dem Board lesbar; Assets wirken wie Teile derselben Welt und bleiben für beide Teams wiederverwendbar.

**Risiken / Nebenwirkungen:**

- zu große Assets verdecken Nachbarhexes oder Units;
- Teamlicht kann bei hellem Terrain an Kontrast verlieren;
- AI-generierte Varianten können Perspektive und Maßstab inkonsistent interpretieren;
- zu viel Structure-Detail konkurriert mit Unit- und Grid-Lesbarkeit.

**Notwendige Tests:**

- Footprint-/Center-Overlaytests;
- Erkennungstest ohne Labels bei Desktop- und Mobile-Spielgröße;
- Orange/Blau-, Graustufen- und Color-Vision-Review;
- Zustandsmatrix aller Structures;
- Occlusion-Checks mit Units, Grid, Fog und FX;
- 60-FPS-Performance mit finalen Assetgrößen.

**Abhängigkeit:** Bulk 3 als visueller Standard; Bulk 4/6 für finale Zustände.  
**Exit Gate:** Alle strategischen Typen und Zustände sind in realer Spielgröße lesbar, perspektivisch konsistent und performancekonform.

### Bulk 8 – Map-Pipeline-Rollout

**Status:** `OPEN`  
**Einstufung:** strukturell größer  
**Ziel / Problem:** Die bewiesene Level-1-Pipeline kontrolliert auf weitere Karten übertragen, ohne Layout und Art gleichzeitig unkontrolliert zu verändern.

**Konkrete Änderungen:**

- Gameplaylayouts nach Bulk 5/6 einfrieren;
- pro Map exakten Guide, Terrainregionen, Safe Areas, Referenztransform und Masken exportieren;
- Core-Art mapweise generieren/authorieren und manuell gegen Code-Terrain abnehmen;
- responsive Bleed und Seed-Decals aus kleinem hochwertigen Baukasten variieren;
- erst nach mindestens zwei unterschiedlichen Maps entscheiden, ob ein dedizierter `MapArtRenderer` nötig ist;
- Küstenstrategie pro Biome vereinheitlichen und doppelte Shore-Information vermeiden;
- Migration in kleinen Gruppen mit Review-Gate, nicht alle zehn Karten auf einmal.

**Betroffene Systeme/Dateien:**

- alle Leveldaten und Map-Manifeste
- `public/assets/` und `art/`
- Guide-/Screenshot-Scripts
- Landscape-/Board-Rendering
- visuelle Regressionen

**Erwarteter Effekt:** Jede Map besitzt hochwertige, zusammenhängende Landschaft und behält dennoch exakte, flexible Hexmechanik und gemeinsame visuelle Identität.

**Risiken / Nebenwirkungen:**

- hoher manueller Reviewaufwand;
- Layoutänderungen nach Artproduktion verursachen Rework;
- Assetgewicht und Ladezeit wachsen;
- unterschiedliche AI-Art-Sessions können Stil drift erzeugen.

**Notwendige Tests:**

- per Map: Guide-vs-Core-Overlay und Structure-Safe-Areas;
- alle Zielviewports, DPR und Levelwechsel;
- Terrainsemantik, Grid und Ownership;
- Ladezeit, Speicher und 60-FPS-Profil;
- Kontaktbogen aller Maps zur Stil-/Perspektivkonsistenz;
- Paketgröße und Kongregate-Uploadgrenzen.

**Abhängigkeit:** bestandenes Bulk-3-Gate; stabile Gameplaylayouts aus Bulks 5/6; Assetstandard aus Bulk 7.  
**Exit Gate:** Jede migrierte Map erfüllt dieselben Geometrie-, Lesbarkeits-, Stil- und Performancebudgets; nicht bestandene Maps bleiben auf der alten Pipeline statt den Release zu destabilisieren.

### Bulk 9 – Performance-, Accessibility- und Kongregate-Hardening

**Status:** `OPEN`  
**Einstufung:** mittel  
**Ziel / Problem:** Neue Systeme und visuelle Layer unter realen Geräte-, Accessibility- und Plattformbedingungen releasefähig machen.

**Konkrete Änderungen:**

- per-Layer Performance messen und statische Caches/Dirty Rendering dort einsetzen, wo nötig;
- Animation bei verborgenem Tab pausieren und Reduced Motion vollständig unterstützen;
- adaptive Qualitätsstufen nur für nicht-gameplayrelevante Effekte definieren, ohne Grid/Ownership/Structure-Lesbarkeit zu reduzieren;
- Assetkompression, Preload, Fehlerfallbacks und Speicherfreigabe prüfen;
- Keyboard-, Zoom-, Focus-, non-color- und Screenreader-Baseline erneut testen;
- Kongregate-Stats, Package-Verifikation und Portal-Smokes absichern;
- finale Regressionmatrix und Release-Checkliste dokumentieren.

**Betroffene Systeme/Dateien:**

- Render Loop und alle visuellen Renderer
- Input/UI/CSS/Accessibility
- Assetpipeline
- Kongregate-Integration und Packaging
- Unit-, Browser-, Screenshot- und Performance-Suite

**Erwarteter Effekt:** Stabile Veröffentlichung mit 60-FPS-Mobile-Ziel, kontrollierter Fallbackqualität und ohne Verlust kritischer Spielinformation.

**Risiken / Nebenwirkungen:**

- aggressive Quality Reduction kann Stil oder Zustandsfeedback beschädigen;
- DPR und Browser-GPU-Verhalten unterscheiden sich stark;
- Screenshots allein erkennen Frame-Pacing-Probleme nicht.

**Notwendige Tests:**

- definierte Desktop-/Mobile-Gerätematrix mit Warm-up und reproduzierbarer Szene;
- 60 FPS als Ziel, Frame-Pacing und lange Frames separat auswerten;
- 30 FPS nur als absolute Untergrenze auf ausdrücklich dokumentierter Fallbackklasse;
- Reduced Motion, Background Tab, Orientation, Fullscreen, 200-%-Zoom und Keyboard;
- vollständige Unit-/Browser-/Balance-Suite;
- Production Build, Kongregate-Package und Stats-Smoke.

**Abhängigkeit:** alle für den Release vorgesehenen vorherigen Bulks  
**Exit Gate:** Release-Checkliste erfüllt; Abweichungen sind explizit akzeptiert oder blockieren den Release.

## 8. Level-1-PoC: verbindliche Go/No-Go-Matrix

Der PoC gilt nur als bestanden, wenn alle Pflichtpunkte erfüllt sind.

| Kriterium | Pflicht | Nachweis |
| --- | --- | --- |
| Core-Art ↔ Code-Grid pixelstabil | ja | Geometriewerte + Overlay-Screenshots über Viewports/DPR |
| Structure-Platzierung und Footprints korrekt | ja | Center-/Safe-Area-Overlay |
| normales Grid deutlich, aber nicht aggressiv | ja | Desktop-/Mobile-Review; Richtwert bei 40 px Radius ca. 1,5–2 px, final rendererabhängig |
| Ownership, Selection und Reachability klar | ja | Zustands-Screenshotmatrix |
| Wasserbewegung subtil | ja | Performanceprofil + visuelle Abnahme |
| Shore-/Foam-Animation nur an exponierten Kanten | ja | deterministischer Edge-Test + Review |
| Fog verdeckt keine Gameplayinformation | ja | Masken-/Kontrasttest |
| zwei bis fünf animierte Vegetationsgruppen | optional | nur übernehmen, wenn 60-FPS-Budget und Lesbarkeit bestehen |
| kein Board-Sprung bei Lifecycle-Wechseln | ja | automatisierte Geometrie-Regression |
| Mobile 60 FPS Ziel | ja | Messprotokoll auf definierter repräsentativer Hardware |
| Reduced Motion | ja | automatisierter/visueller Zustandstest |
| sinnvolle Bleed-Darstellung bei ungewöhnlichen Ratios | ja | ultrawide, Desktop, Tablet, Phone |

No-Go-Gründe sind insbesondere: Drift zwischen Art und Grid, notwendiges non-uniform scaling, unlesbares Grid/Ownership, dauerhaft unter 60 FPS auf der Zielklasse, Fog über Spielfeldern oder ein Core-Art-Verfahren, das jede kleine Leveländerung unverhältnismäßig teuer macht.

## 9. Test- und Evidenzstrategie

Jeder Bulk aktualisiert mindestens:

- ausgeführte Kommandos und Ergebniszusammenfassung;
- neue/geänderte Tests;
- relevante Geometrie-, Balance- oder Performancekennzahlen;
- Screenshots nur dort, wo visuelle Evidenz nötig ist;
- bekannte Abweichungen und bewusste Nicht-Ziele;
- Git-Status und Abgrenzung vorbestehender Änderungen.

Geplante Evidenzarten:

- **Unit:** Transform, Structure-State, Combat, Supply, Victory, Node-Funding;
- **Simulation:** Doomstack, Strategy Profiles, Mapbalance, Dauer und Konzentration;
- **Browser:** Lifecycle, Viewports, DPR, Fullscreen, Orientation, Input und UI;
- **Visual:** Guide-Overlay, Grid/Ownership, Structures, Kontaktbögen;
- **Performance:** FPS, Frame-Pacing, CPU-Zeit, Speicher, Assetgewicht;
- **Human:** Verständlichkeit, sichtbare strategische Wahl, wahrgenommene Lesbarkeit.

## 10. Offene Produktfragen

Diese Fragen werden nicht vorzeitig durch Implementierung beantwortet:

1. Ist der Guardian-Shield nach Simulation und Human-Test wirklich eleganter als Approach-/Network-Defense?
2. Welche Karten benötigen überhaupt Guardians?
3. Ist ein Upgrade Node ein echtes Timing-Dilemma oder nur eine optimale Pflichtinvestition?
4. Reicht ein kleiner Landscape-Layer-Split langfristig aus, oder rechtfertigen mehrere Art-Cores einen eigenen `MapArtRenderer`?
5. Welche konkrete Mobile-Hardware definiert Zielklasse und Fallbackklasse für die 60-/30-FPS-Gates?
6. Welche AI-Art-Schritte sind reproduzierbar genug für neun weitere Karten und welche benötigen einen modularen Decal-Baukasten?

## 11. Fortschrittsprotokoll

| Datum | Bulk | Statusänderung | Evidenz / Entscheidung |
| --- | ---: | --- | --- |
| 2026-09-19 | Planung | – → `DONE` | Living Plan aus Audit erstellt; noch keine Gameplay-/Rendering-Implementierung gestartet. |
| 2026-09-19 | 0 | `READY` → `DONE` | Kongregate-/Branch-Stand bestätigt; saubere Commit- und Working-Tree-Baselines erfasst; Packaging-, Browser-, Doomstack- und Geometrieabweichungen in `docs/bulk-0-baseline-report.md` dokumentiert. |
| 2026-09-19 | 1 | `READY` → `DONE` | Kanonische Referenzwelt und uniformer World Transform eingeführt; Lifecycle-, Level-, Orientation- und DPR-2-Regressionen grün. Bulk-2-Regellabor ist `READY`. |
| 2026-09-19 | 2 | `READY` → `DONE` | Endlicher Guardian-Shield-Pool ausgewählt; Multiplikator und Network Defense als Standard verworfen; Supply-/AI-Abhängigkeiten dokumentiert. Bulk 3 ist `READY`. |
| 2026-09-19 | 3 | `READY` → `REVIEW` | Level-1-Core-Art, Drei-Canvas-Layering, Grid/Ownership, Wasser/Shore/Fog, Art-Guide-Export und Viewport-/Reduced-Motion-/Renderbudgettests implementiert. Physischer Mobile-60-FPS-Test bleibt offen. |
| 2026-09-19 | 3 | `REVIEW` | Lesbarkeits-Pass aus visueller Abnahme umgesetzt: zweistufiges Vollraster, Playable-Wash, stärkere Team-Tints, Zahlenplaketten, separates HQ-Label und Reachability-Ring; Desktop/Mobile visuell geprüft und Regressionen grün. |

## 12. Decision Log

| ID | Datum | Entscheidung | Begründung |
| --- | --- | --- | --- |
| D-001 | 2026-09-19 | Mobile-Ziel 60 FPS; 30 FPS nur absolute Fallback-Untergrenze | Umweltanimation und Layering sollen von Beginn an für echte mobile Flüssigkeit budgetiert werden. |
| D-002 | 2026-09-19 | Konsistenter Premium-near-top-down/Top-down-Winkel statt dogmatischer 90°-Regel | Volumen ist erwünscht; entscheidend sind gemeinsame Perspektive und Gameplay-Lesbarkeit. |
| D-003 | 2026-09-19 | Vollständiger Level-1-PoC vor Multi-Map-Rollout | Höchster Erkenntnisgewinn bei begrenztem Rework. |
| D-004 | 2026-09-19 | AI-Core-Art plus rendererseitiger Bleed statt gigantischem Masterbild | Innere Geometrie bleibt unverändert; ungewöhnliche Aspect Ratios werden robust ergänzt. |
| D-005 | 2026-09-19 | Guardian zuerst als messbare Hypothese, nicht sofort als Feature | Ein schlechter Shield kann Doomstacking nur verteuern oder Matches verlängern. |
| D-006 | 2026-09-19 | Upgrade Nodes nach Guardian-/Structure-Grundlage | Nodes lösen das HQ-Rush-Problem nicht und benötigen dieselben Structure-Verträge. |
| D-007 | 2026-09-19 | `bb0fa85` bleibt Arbeitsbaseline für den Kongregate-Pass | Live-Update-Datum und Update-Notizen stimmen mit den fünf Branch-Commits überein; `main` enthält keinen neueren Tree-Inhalt. |
| D-008 | 2026-09-19 | Bulk 1 darf trotz roter Browser-Baseline beginnen | Die Abweichungen sind reproduziert und getrennt: veraltete UI-Assertions plus ein kontextsensitiver Decor-Test; Logic, Typecheck und Production-Build sind grün. |
| D-009 | 2026-09-19 | Gameplaypositionen leben in einer kanonischen 1108×842-Referenzwelt bei Radius 40,30 | Movement und Simulation bleiben viewportunabhängig; Renderer und Input teilen exakt denselben vorwärts-/inversen Transform. |
| D-010 | 2026-09-19 | Resize verändert nur Runtime-Geometrie und Canvas-Backing-Store, nie den GameState | Verhindert Board-Sprünge, laufende Army-Drifts und viewportabhängige Bewegungsgeschwindigkeit. |
| D-011 | 2026-09-19 | Guardian-Schutz wird als endlicher separater HQ-Shield-Pool pro aktivem Guardian weitergeführt | Er macht die direkte Abkürzung messbar irrational, bleibt aber endlich, verständlich und visuell darstellbar. |
| D-012 | 2026-09-19 | Reiner Defense-Multiplikator und Network Defense sind kein Kampagnenstandard | Multiplikator ist opak und skaliert schlecht; Network Defense ist topologieabhängig und entkoppelt Guardian-Zustand vom Nutzen. |
| D-013 | 2026-09-19 | Guardians lösen den direkten HQ-Rush, nicht Konzentration als allgemeines Phänomen | Der Frontstack-Anteil bleibt im Labor bis 100 %; ein globales Anti-Stack-System würde den kompakten Kernloop unverhältnismäßig erweitern. |
| D-014 | 2026-09-19 | Level-1-Art wird über drei Canvas-Schichten integriert | Statisches Core-Art wird nur bei Load/Resize gezeichnet; langsame Umweltanimation und 60-Hz-Gameplay konkurrieren nicht im selben Full-Canvas-Redraw. |
| D-015 | 2026-09-19 | Umweltanimation läuft mit höchstens 15 Hz, Gameplay bleibt im 60-FPS-Loop | Wasser, Shore und Randnebel sollen lebendig, aber unaufdringlich und mobil günstig sein. |
| D-016 | 2026-09-19 | Kein Multi-Map-Rollout vor physischem Mobile-Test und zweiter Generalisierungskarte | Der Headless-CPU-Smoke ist stark, ersetzt aber weder reales Frame-Pacing noch den Beweis, dass das Manifest für weitere Karten trägt. |
| D-017 | 2026-09-19 | Zweistufiges Vollraster und terrainunabhängige Zahlenplaketten sind der Level-1-Lesbarkeitsstandard | Das ruhige Vollraster erhält die Board-Identität; Playable-Kontur und Wash zeigen den Regelraum. Dunkle Plaketten sichern Zahlenkontrast unabhängig von Art und Structure. |

### Vorgemerktes Visual Polish nach Bulk 3

- Desktop: seitlichen Bleed/Fog weniger ausgewaschen abstimmen und die momentan erkennbare lineare Fade-Ansatzkante durch weichere, überlappende beziehungsweise organisch maskierte Übergänge ersetzen.
- Dabei weder Core-Art noch World Transform verändern; es handelt sich um Atmosphere-/Bleed-Compositing, nicht um Map-Alignment.
