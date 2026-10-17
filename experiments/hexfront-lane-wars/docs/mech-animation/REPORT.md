# Mech-Animation: Technik, Prüfung und Grenzen

Stand: 17. Oktober 2026 · Branch `codex/lane-wars`.

[Interaktiver GLB-Viewer](../../mech-viewer.html) · [Spiel](../../index.html) · [Animiertes GLB](../../public/models/mech-animated/mech-rigged.glb) · [Blender-Quelle](../../art/mech-animation/mech-rig.blend)

## Ausgangsmodell und gezielte Überarbeitung

Das ursprüngliche `public/models/mech.glb` enthält ein einziges zusammenhängendes, texturiertes Mesh: 23.502 Dreiecke, 19.803 Exportvertices einschließlich UV-Nähten, keine Bones, Gruppen oder Animationen. Auch die vorhandene Blender-Quelle enthält kein vorbereitetes Rig. Ein bloß hinzugefügtes Skelett hätte keine sinnvoll getrennten mechanischen Teile bewegt. [Quellprüfung](source-audit.json).

Die vorhandene Oberfläche wurde deshalb entlang mechanischer Übergänge aufgeteilt. Die ursprünglichen UVs, Außenformen, Proportionen und Farben bleiben erhalten. Schnittflächen wurden geschlossen, innenliegende dunkle Lager ergänzt und kleine übergreifende Flächen dem passenden Bauteil zugeordnet. Insbesondere bewegt sich der gesamte Rucksack mit dem Oberkörper. Keine Ersetzung durch primitive Robotermodelle und keine elastische Verformung der Panzerplatten.

Das neue GLB enthält 13 mechanische Baugruppen mit jeweils zwei Materialprimitiven, 32.430 Dreiecke (+38 % gegenüber dem ursprünglichen Mesh) und fünf Animationsclips. Größe: 3.439.748 Bytes. Der ursprüngliche Mech bleibt unverändert; SHA-256 `a67900fb60175475efe7eff2ca26fff5d3edbc940a02615020ab780d3b35d1a2`. Sicherung des vorherigen Branchstands: lokaler Tag `codex/lane-wars-pre-mech-animation-2026-10-16` auf `4b2478a`.

## Animation und Anbindung

- **Walk:** echte Hüft-, Knie- und Sprunggelenkrotationen, abwechselnde Beine, 62 % Standphase, sichtbarer Fußhub. Der in Blender berechnete Zweigelenk-Laufzyklus wird als GLB-Clip exportiert. Im Spiel bestimmt die tatsächlich zurückgelegte Strecke die Phase; die Schrittlänge beträgt rund 0,452 Welteinheiten. Auf gerader Strecke bleibt der belastete Fuß stehen. Kurven und Übergänge verwenden weiches Blending; es gibt keine Geländefuß-IK oder mathematische Fußverankerung bei engen Drehungen.
- **Idle:** dezente Servobewegungen an Oberkörper und Arm.
- **Attack:** separater Waffenlaufrückstoß, Unterarm- und Oberkörperreaktion. Start ausschließlich beim vorhandenen `shot`-Ereignis. Mündungslicht/Projektil starten am GLB-Mündungsmarker. Der Oberkörper gleicht die Drehung der Beine aus; der Waffenarm richtet die seitlich montierte Waffe auf das tatsächliche Ziel aus.
- **Hit:** kurzer additiver Impuls beim vorhandenen Trefferereignis, zusammen mit den bisherigen Funken.
- **Death:** Einknicken und Absinken über 1,2 Sekunden, anschließend der bestehende Trümmereffekt. Der Roboter ist sofort aus der Kampfsimulation entfernt; nur seine visuelle Hülle bleibt kurz erhalten. Auch nach Matchende darf dieser Effekt auslaufen.

Idle/Walk werden weich überblendet. Attack und Hit liegen additiv darüber. Death übernimmt mit kurzer Überblendung. Jeder Mech hat eine eigene Animationsphase und eigene Ereigniszeiten. Die Beine bleiben starre mechanische Baugruppen, keine skinnende Ganzkörperverformung. Beide Fraktionen verwenden dasselbe Rig und die bestehende Teamfarben-Schattierung.

**Rendering:** pro Fraktion 26 `InstancedMesh`-Primitiven statt eines zusammengeführten starren Mechs. Geometrien, Texturen, Materialien und Clipdaten werden gemeinsam genutzt; pro Roboter werden nur die Gelenkhierarchie und ihr Mixerzustand gehalten. Diese Hierarchien werden nicht einzeln gerendert. Die resultierenden Bauteilmatrizen gehen in die Instanzpuffer. Dadurch wächst die Zahl der Zeichenaufrufe nicht mit der Zahl der Mechs. Drohnen und der bisherige Fernkämpfer behalten ihre Darstellung. Es wurde kein zusätzlicher LOD mit einem minderwertigen Ersatzmodell eingeführt.

## Performance

Messung mit Chromium 151, hardwarebeschleunigtem ANGLE/D3D11 auf **AMD Radeon(TM) Graphics**. Gleiche Diorama-Szene mit HQs und Schatten; Vergleich mit dem ursprünglichen starren GLB. Je Fall 15 Aufwärmbilder, 90 RAF-Messbilder und 150 aufgewärmte Messungen nur für Modell-/Instanzupdates. Keine FPS-Garantie für andere Rechner. [Messmethode und Rohwerte](performance.json).

| Desktop 1440 × 900 | Starr: Median Bildintervall | Animiert: Median Bildintervall | Animiert: P95 | CPU-Modellupdate starr → animiert |
| --- | ---: | ---: | ---: | ---: |
| 16 Mechs | 5,5 ms | 6,5 ms | 9,5 ms | 0,1 → 0,2 ms |
| 64 Mechs | 8,4 ms | 9,0 ms | 11,1 ms | 0,3 → 1,7 ms |
| 128 Mechs | 13,6 ms | 14,2 ms | 14,8 ms | 0,7 → 3,8 ms |

Die Szene benötigt 44 Zeichenaufrufe in der starren und 94 in der animierten Darstellung, unabhängig davon, ob 16 oder 128 Mechs vorhanden sind. Diese Renderer-Zähler sind keine vollständige GPU-Profilierung aller Schattenpässe. Die reine JavaScript-Zeit einschließlich Render-Aufruf steigt bei 128 Mechs von 1,7 auf 7,0 ms; sie ist getrennt von GPU-Laufzeit und Bildintervall zu betrachten.

Im Hochformat 390 × 844 mit angefordertem DPR 2 (Spiel begrenzt auf 1,6) betrugen die Bildintervalle bei 16/64/128 Mechs 5,9/8,4/11,4 ms für die animierte Version und 4,9/7,7/11,8 ms für die starre Version. Kleine umgekehrte Differenzen sind Messstreuung, keine behauptete Beschleunigung. **Diese Werte stammen von derselben Desktop-GPU, nicht von einem echten Smartphone.** Ein physischer Mobile-Leistungstest steht noch aus. Die zusätzliche Geometrie und CPU-Arbeit können auf schwächeren Telefonen relevant sein. Eine reduzierte Gelenk-Abtastrate wäre ein möglicher nächster Schritt, falls reale Gerätetests sie nötig machen.

## Tests und vollständige Partien

- 88 bestehende Node-Regeltests bestanden. Keine Änderungen an Einheitenwerten, Simulation, Wirtschaft, Produktion, KI oder Missionen.
- Tatsächliche GLB-Clips geprüft: alternierende Gelenke, Fußhub, Standfußverschiebung unter 0,0001 Welteinheiten, unabhängiger Rückstoß, stabiler Oberkörper, Zusammenbruch. 32 unabhängig laufende Mechs beider Teams. [Animationsregression](animation-tests.json).
- Reales Mech-Gefecht: Bewegung stoppt, echter Schuss löst Attack aus, Tote verlassen sofort die Simulation, Zusammenbruch und anschließende Trümmer sichtbar. Viewer: Clipwahl, Zeitlupe, Pause, Zeitleiste, Farbauswahl, Vergleich, Drehung und Zoom.
- 30 Fabrik-/HQ-Ausgangskampf-Fälle und zwölf Ausfahrtskonfigurationen bestanden; Mechs behalten sichtbaren Schussabstand. M1.5-Vergleiche stimmen mit der unveränderten kopflosen Simulation überein. Kampflabor: 14 Browserprüfungen bestanden.
- Exportierter Build: tatsächliche HUD-Bedienung bis zum Sieg, Speichern und Laden mitten in der Partie, Niederlage und Hochformat-Touch geprüft. Fabrik-GLB, Torsegmente, Module, transparente Bauvorschauen und alle drei Missionen bestanden. [Fabrikregression](factories/browser.json).

| Vollständiger Browserlauf | Ergebnis | Simulierte Dauer |
| --- | --- | ---: |
| Spielerbefehle durch tatsächliche HUD-Buttons | Orange gewinnt durch HQ-Zerstörung | 10:40,45 |
| Automatisierte Belagerungsstrategie gegen Vorhut | Orange gewinnt | 7:15,80 |
| Spiegelung Belagerung | Nach zwölf Minuten offen | 12:00 |
| Belagerung gegen Wirtschaftsstrategie | Nach zwölf Minuten offen | 12:00 |
| Keine Spielerbestellungen | Blau gewinnt durch HQ-Zerstörung | 2:48,80 |

Die automatisierten Referenzpartien stimmen exakt mit Node-Ergebnissen überein. Der HUD-Lauf ist zeitlich von den echten Browserbedienungen abhängig und kein deterministischer Balancebenchmark. [Vollständige Ergebnisse](central/results.json). Bestehende Pattsituationen und lange Partien sind weiterhin eine spielerische Schwäche; dieser reine Animationsauftrag verändert sie nicht.

## Öffentliche Prüfung

Der festgelegte Build `1e8467e` wurde auf rawcdn.githack.com geprüft: Viewer mit allen fünf Clips, beide Teamfarben, tatsächlich animierte Mechs im Spiel und erhaltene GLB-Fabriken. Die öffentlich heruntergeladenen GLB- und Blender-Dateien stimmen per SHA-256 mit den lokal geprüften Dateien überein. Eine öffentliche Partie mit automatisierten Spielerbefehlen endete nach **7:15,80 durch HQ-Zerstörung**. Keine Spiel- oder Modellladefehler; lediglich eine blockierte Werbung des Vorschauhosts wurde separat als Host-Warnung erfasst. [Öffentliches Prüfprotokoll](public.json).

## Bearbeitung und Reproduktion

`art/mech-animation/mech-rig.blend` enthält die getrennten Geometrien, mechanischen Pivot-Objekte, Materialien und NLA-Clips. Im Texteditor liegt **PLAY_ANIMATION.py**: dort `clip` auswählen und ausführen, um denselben NLA-Clip auf allen Gelenken einzuschalten. Alternativ lassen sich die entsprechend benannten NLA-Tracks manuell aktivieren. Die Datei öffnet sich ohne übereinander abgespielte Clips.

`build_rig.py` erzeugt die Teilung, Gelenke und Clips reproduzierbar aus dem unveränderten Original. Blender-Koordinaten: Z oben / +Y vorwärts; glTF: Y oben / −Z vorwärts. Export mit Blender 5.2, `NLA_TRACKS`, 60 Hz Sampling. Das GLB enthält alle Animationen und benötigt keine Blender-Datei zur Laufzeit.

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --factory-startup --python-exit-code 1 --python art/mech-animation/build_rig.py
npm test
node scripts/check-browser.mjs mech-browser deployment-browser exits-browser visual-browser
npm run audit:mech-performance
npm run build
```

## Fernkämpfer

Im Repository ist weiterhin **kein finales Robotermodell für den vierbeinigen Railgun-Fernkämpfer** vorhanden. Die Einheit in `model-library.js` ist der geometrische Platzhalter. `factory-preview/module-rail.glb` ist nur das Fabrik-Dachmodul, `relay.glb` ein anderes Gebäude. Diese Dateien eignen sich nicht als fertiger Roboter. Der Platzhalter wurde nicht aufwendig geriggt oder ersetzt.

Für das finale Asset benötigt werden: freigegebene Front-/Seiten-/Dreiviertelansichten und Maße; getrennte Körper-, Hüft-, Knie- und Fußbaugruppen für vier Beine; ein dreh- und kippbarer Railgun-Aufbau mit separatem Rückstoßschlitten; Mündungs- und Ladeeffektmarker; saubere verdeckte Gelenkflächen; UVs/PBR-Materialien mit separierbarer Teamfarbe; GLB plus Blender-Quelle. Vorläufiges Leistungsbudget: möglichst etwa 25–35k Dreiecke, wenige gemeinsame Materialien, keine zusätzlichen individuellen Texturen je Roboter. Erst das tatsächliche neue Modell sollte separat freigegeben werden. Die hier verwendete Pipeline kann dessen mechanische Gelenke, Clips und Instanzen übernehmen; ein fertiges Fernkämpfermodell wird damit nicht vorgetäuscht.
