# Gelieferte GLB-Assets · 13. Oktober 2026

Die drei Spielmodelle sind integriert: neues freistehendes HQ, Hover-Bot und Relais. Der Mech bleibt ausschließlich eine drehbare Modellstudie. Wirtschaft, KI, Kampfsystem, Karten, Kamera und HUD wurden nicht geändert. Der bisherige Stand bleibt im Git-Verlauf bei `9c4ffe9` erhalten. `?assets=classic` lädt weiterhin die bisherigen Modelle als Vergleich und Fallback.

## Start und Vorschau

```sh
cd experiments/hexfront-3d
npm run dev
```

- Spiel: http://127.0.0.1:4174/
- Alle vier Modelle drehen: http://127.0.0.1:4174/public/models.html
- Direkter Vergleich: http://127.0.0.1:4174/docs/imported-assets/comparison.html (Entwicklungsserver)
- Produktion: `npm run preview:prepare`, danach `npm run preview`.

Im Modellatelier: Ziehen dreht, Mausrad zoomt, Reset und 70°-Ansicht setzen die Ansicht zurück. Orange/Blau/Neutral wechseln gezielt die Materialakzente. Die Kamera des eigentlichen Spiels bleibt unverändert.

## Quelle und Bearbeitung

Blender 5.2 verarbeitet die gelieferten GLBs; die vorhandenen Meshes und UVs wurden erhalten. Keine Neumodellierung aus primitiven Ersatzkörpern. Die drei Modelle Hover-Bot, Relais und Mech stammen aus `HEXFRONT_4_GLB_Quellen.zip` mit den jeweiligen `HEXFRONT_*_source.glb`-Dateien.

Das erste HQ aus diesem ZIP wurde nach visueller Prüfung verworfen: mitgeneriertes Gelände ließ sich an der Gebäudeunterkante nicht ausreichend sauber entfernen. Stattdessen wurde die neue freistehende HQ-Vorlage verwendet. Die vom Nutzer danach gelieferte Datei `task_20d92a94-d624-4887-96eb-008eb26802ac_model.glb` ist die neue HQ-Quelle (`HQ-clean-source.glb` im lokalen Quellenarchiv). Die Bildvorlage allein ist kein 3D-Modell; integriert ist dieses tatsächlich gelieferte GLB.

Die Bildvorlage [hq-clean-source.png](imported-assets/hq-clean-source.png) entstand zuvor mit ImageGen anhand der vom Nutzer bereitgestellten Architekturreferenz. Prompt-Ziel: dasselbe kompakte Gebäude mit erhöhtem Kommandokörper, seitlichem Radar und Hangarrampe, freigestellt ohne Gelände, Pflanzen, Kisten oder Fahnen, mit sauberem Bodenabschluss und vollständig sichtbarer Silhouette. Die 3D-Konvertierung erfolgte anschließend über den vom Nutzer bedienten to3D-Workflow; hier wurde kein unbeobachteter Generierungsjob behauptet.

Bearbeitung:

- UV-erhaltende Polygonreduktion; nur identische Meshpositionen verschweißt.
- Originale 1024²-Farbtexturen vollständig erhalten; zurückhaltende Roughness-/Metalness- und Leuchtmasken daraus abgeleitet. Keine entfernten Oberflächendetails durch globale Einfärbung ersetzt.
- Orangefarbene Texturbereiche werden im Three.js-Material selektiv auf die Teamfarbe abgebildet. Weiße Keramik und dunkle Technik bleiben bestehen. Einzelne original blaue Statusanzeigen dürfen blau bleiben.
- HQ: Unterkante nach der Reduktion exakt plan geschnitten und mit echten nach unten gerichteten Flächen geschlossen. Unterseitenprüfung: 1.130 Bodenflächen, **0 offene Bodenrandkanten**, keine nach oben gerichteten Bodenflächen. Keine kaschierende Landschaftsplatte. Gesamthöhe 1,32 Welteinheiten; HQ passt auf das vorhandene Hexfeld.
- Radar am vorhandenen dunklen Gelenk getrennt; `Radar_Pivot` und `Dish_Tilt` bewegen die ursprüngliche Schüssel. Kein automatisches Zerlegen des gesamten Meshs.
- Hover-Bot: einzige ergänzte Geometrie ist eine kleine konvexe Sensorlinse im vorhandenen Gehäuse. Zwei Instancing-Batches statt bisher 17; weiterhin ein Modell pro Truppenverband, maximal 64 visuelle Vertreter.
- Relais: vorhandener Kern und zwei Schüsseln räumlich gezielt separiert. Die Basis bleibt erhalten; keine mitgenerierte Landschaft muss darunter versteckt werden.

| Asset | Quelle: Dreiecke | Optimiert | Reduktion | GLB |
|---|---:|---:|---:|---:|
| HQ | 93,278 | 44,540 | 52.3 % | 3.14 MiB |
| HoverBot | 56,428 | 14,070 | 75.1 % | 2.45 MiB |
| Relay | 48,344 | 23,204 | 52.0 % | 3.10 MiB |
| Mech | 55,958 | 23,502 | 58.0 % | 2.91 MiB |

Zahlen aus Blender nach Triangulierung; zusätzliche Bodenverschlüsse und die Sensorlinse sind enthalten. [Maschinenlesbare Daten und Quellen-SHA256](imported-assets/optimization.json).

Dateien: [HQ](../public/assets/supplied/hq.glb), [Hover-Bot](../public/assets/supplied/hoverbot.glb), [Relais](../public/assets/supplied/relay.glb), [Mech](../public/assets/supplied/mech.glb). Bearbeitbare Quellen mit gepackten Texturen liegen unter `scripts/supplied-*.blend`.

Reproduktion: `blender --background --python scripts/prepare-supplied-assets.py -- /pfad/zum/quellenordner`; für das neue HQ allein zusätzlich `--hq-only`. Das Quellenverzeichnis enthält die drei genannten ZIP-GLBs und die neue Datei unter `HQ-clean-source.glb`. Originale sind lokal unverändert archiviert und nicht als doppelte große Assetpakete im Repository abgelegt.

## Animationen und Grenzen

HQ: 16-Sekunden-Radarsuche mit Pausen, leichte Neigung, Produktionspuls, sofortige Lichtreaktion auf `send`, Trefferreaktion und Fraktionswechsel auf `capture`. Die offene, zusammengefasste Hangargeometrie wird nicht als falsche Schiebetür auseinandergezogen: Beim Start reagiert die Beleuchtung; eine separate bewegliche Hangarblende ist in diesem GLB **nicht** vorhanden. Die existierende Ergebnisverzögerung für den Übernahmeeffekt bleibt bestehen.

Hover-Bot: vorhandenes Schweben, Richtung, Startneigung, Antrieb und kurze Eroberungs-/Verlustreaktionen. Keine zusätzlichen unabhängigen Gondel-/Sensoranimationen behauptet; der Ausgangskörper ist zusammengefasst. Relais: neutral inaktiv, Fraktionsfarbe und kurzer Aktivierungsimpuls, langsame Kernbewegung und Schüsselsuche. Alle Effekte sind kosmetisch, gepoolt/begrenzt und respektieren reduzierte Bewegung sowie die vorhandenen HQ/LQ-Einstellungen.

Mech: gut erkennbare schwere Silhouette auch bei 70°, Materialien und Maßstab vorbereitet. Arme, Beine und Waffen sind Bestandteil eines zusammenhängenden generierten Meshs. Ein sauberer Laufzyklus erfordert gezielte Schnitte, geschlossene Gelenkflächen und ein Rig; automatische Trennung würde sichtbare Schäden riskieren. Eine Schussreaktion lässt sich danach mit einer getrennten Waffenachse ergänzen. Aktuell **keine Lauf-/Schussanimation und keine Spieleinheit**.

## Tatsächliche Prüfung

- 46 bestehende Logiktests bestanden.
- Kampagnentest mit den endgültigen Assets: drei Siege, Niederlagen, Neustart/Wiederholung, Freischaltung, Maus und Touch, Zoom/Fit; die Matchläufe benutzen echte Spielbefehle mit manueller Testuhr.
- Desktop 1440×900 und Mobile 390×844 im Chromium: alle 37 projizierten Feldzentren treffen ihre korrekten logischen Hex-IDs; HUD und Zahlen bleiben sichtbar. Weitere Kampagnenansichten inklusive 320 px und LQ vorhanden.
- Ereignistest: echte HQ-Truppenabgabe ohne Verzögerung; Lichtpuls und Radar an beiden Varianten; ergänzende fokussierte Capture-/Stress-Fixtures, neutrale Relaisabschaltung, begrenzte/auslaufende Kampfreaktionen, unveränderte Simulation, Reduced Motion und LQ. Keine Browserfehler.
- Alle vier Modelle im separaten Viewer geladen; Teamwechsel, 70°-Ansicht und Dragrotation geprüft.
- Produktionsbuild mit deaktivierter QA-API; realer Produktionsstart und Missionsnavigation separat geprüft.

Renderstatistik im reproduzierten Startzustand mit einem Transport: 1440 px: 113 Draw Calls, 193,825 gerenderte Dreiecke; 390 px: 113 Draw Calls, 193,825 gerenderte Dreiecke. Das ist **keine FPS-Messung**. Keine echte Smartphone-Hardwaremessung; der Viewporttest ersetzt sie nicht. Das Spiel lädt den Mech nicht; dieser wird nur beim Anwählen im Modellatelier geladen.

## Bilder und ehrliche Bewertung

[Direkter Vorher/Nachher-Vergleich](imported-assets/comparison.html) · [Desktop](imported-assets/after-desktop.png) · [Mobile](imported-assets/after-mobile.png) · [HQ nah](imported-assets/after-hq-close.png) · [Drohne nah](imported-assets/after-drone-close.png) · [Relais nah](imported-assets/after-relay-close.png)

[HQ-Radar: links](imported-assets/hq-radar-0.png) · [rechts](imported-assets/hq-radar-6.png) · [zurück](imported-assets/hq-radar-14.png). [HQ-Startlicht: Anfang](imported-assets/hq-start-0.png), [Impuls](imported-assets/hq-start-0.5.png), [Ende](imported-assets/hq-start-1.1.png). Aufnahmen aus der laufenden Engine; Ereigniszeiten werden zur vergleichbaren Aufnahme kontrolliert gesetzt. Kein WebM erforderlich.

Das neue HQ ist der Referenz in seiner Gesamtarchitektur deutlich näher: erhöhtes Kommandomodul, asymmetrischer Radaraufbau, gestaffelter Unterbau und echter Hangar. Sein Bodenabschluss ist jetzt technisch geschlossen und optisch sauber. Hover-Bot und Relais zeigen mehr charakteristische Oberflächendetails und passen zur selben Materialfamilie. Bei normalem Zoom bleiben die Silhouetten und Teams lesbar. Im extremen Nahzoom erkennt man weiterhin weiche, teilweise ungleichmäßige generierte Kanten und in die Farbtextur eingebackene Schattierung. Diese Assets sind keine manuell retopologisierten High-End-Hard-Surface-Modelle; das wurde nicht durch weitere Dekoration kaschiert.

Die alte HQ-Datei bleibt als Fallback erhalten. Herkunft/Lizenzabgrenzung: [ASSET_LICENSES.md](../ASSET_LICENSES.md).
