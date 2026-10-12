# Command HQ – integrierter Art-Pass, 12. Oktober 2026

Neues HQ mit zwei Fraktionsfarben, lokal integriert. Veröffentlichung ausschließlich auf `experiment/hexfront-3d-diorama`. Vergleichsbasis: `f65213b06d7e0158482a47ae2dcb03c1226158dc`. Drohne, Relais, Landschaft, Kamera, Wirtschaft und KI bleiben unverändert.

## Modell

Originalmodell in Blender 5.2.0 LTS, anhand der vom Nutzer bereitgestellten Architekturvorlage `79cab1a4-d284-4014-9621-049f9b353af9.png`. Die Referenzdatei wird nicht mitverteilt. Keine fremden Modelle, Bildflächen als Ersatz für Geometrie oder kostenpflichtigen Werkzeuge.

- [Bearbeitbare Blender-Datei](../scripts/command-hq-source.blend): einzelne Bauteile, Materialien und Gelenkhierarchie.
- [GLB](../public/assets/command-hq/command-hq.glb): 48.344 Dreiecke, 22 Meshobjekte, 1.782.716 Bytes. Ein Modell für beide Teamvarianten.
- [Reproduzierbarer Modellierungsquelltext](../scripts/model-command-hq.py).
- Gesonderte Drehpunkte `Radar_Pivot`, `Dish_Tilt`, `Hangar_Door`; separate Core-Materialien.
- Echter ausgeschnittener Hangar, gesonderte Keramikplatten mit Fugen, Radiatorvertiefungen, gerundete Kommandozentrale, versetztes Radar auf Gelenksockel, geschlossene Parabolschüssel mit Wandstärke und Rückstreben.
- Eigene kleine Roughness-Texturen im GLB. Keine externe Materiallizenz erforderlich; die bestehenden Projektrechte gelten.

## Ansichten

- [Orange, isolierter GLB-Studiotest](hq-command/hq-orange.png)
- [Blau, isolierter GLB-Studiotest](hq-command/hq-blue.png)
- [70°-Modellansicht](hq-command/hq-tactical.png)
- [Engine-Nahaufnahme](hq-command/detail-after.png)
- [Desktop-Testeinbau](hq-command/desktop-after.png) / [Mobile-Testeinbau](hq-command/mobile-after.png)
- [Vorher](hq-command/detail-before.png) / [Nachher](hq-command/detail-after.png): gleiche Spielkamera und gleicher Zustand.

Die drei freigestellten Bilder sind **Blender/Cycles-Renders des exportierten GLB**, keine Gameplay-Screenshots. Studiobeleuchtung und Leuchtintensität dienen der Modellinspektion. Die übrigen Bilder entstanden beim lokalen Testeinbau in der tatsächlichen Three.js-Spielengine. Alle Bilder wurden visuell geprüft. Desktop und Mobile verwenden dieselben Spielzustände, Kamera- und Projektionsmatrizen wie die Vorher-Bilder (`before-visual.json`, `after-visual.json`).

Beim Prüfen korrigiert: überschnittene Druckhülle/Keramik, Radiatorüberschneidungen, falsche Reflektornormalen und ein durch die Schüssel ragender Gelenkbolzen. Die GLB-Datei von Drohne und Relais ist bytegleich zum veröffentlichten Stand (SHA256 `578f449aaa42bd0438ec760d8b597295a2a44809cc02ca339899133873e91474`).

## Integration und Prüfstand

Separates HQ-GLB, getrennte Radar-/Neigungs-/Hangargelenke, 16-Sekunden-Radarsuche mit Haltephasen, fünfsekündiger Produktionspuls, direkte kosmetische Anbindung an send/combat/capture. Der Ergebnisdialog erscheint nach maximal rund 1,05 Sekunden; Siegbedingungen und Truppenbewegung bleiben unverändert. Reduced Motion unterdrückt Bewegungen. Keine neuen Partikelsysteme.

35 Logiktests einschließlich vollständiger simulierter Siege/Niederlagen und Reset bestanden. Desktop- und Mobile-Aufnahmen aus der Engine vorhanden; identische Kamera, Projektion und Ausgangszustände bestätigt. Ein vollständiger Browser-Matchlauf wurde auf Nutzerwunsch vorzeitig beendet (mindestens 15 echte Spielerbefehle). Keine Behauptung eines neu abgeschlossenen vollständigen UI-Matches.

[Hangarsequenz](hq-command/animation/hangar-0.png) bis hangar-5.png und [Radarsequenz](hq-command/animation/radar-0.jpg) bis radar-8.jpg stammen aus einem laufenden Spiel mit echtem HQ-Sendebefehl. Der zusätzliche Animationstest erreichte die Speicherassertion: Texturen sanken von 17 auf 16, während der Test exakte Gleichheit verlangte. Dies ist kein bestandener Gesamt-Test; der Bericht bleibt erhalten. Weitere Tests, zusätzliche Screenshotprüfung und ein öffentlicher Spieltest wurden danach auf ausdrücklichen Nutzerwunsch unterlassen. Kein physischer Smartphone- oder 60-FPS-Nachweis.

## Reproduktion

Im Experimentordner:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python-exit-code 1 --python scripts/model-command-hq.py
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python-exit-code 1 --python scripts/render-command-hq.py
node --test tests/hq-motion.test.mjs
```

Der Blender-Export mit eingebetteten Texturen benötigt ein beschreibbares temporäres Verzeichnis. Der erste Versuch unter der Windows-Sandbox scheiterte dort; der erneute Export mit erweitertem lokalen Dateizugriff war erfolgreich.

## Ehrliche Einordnung

Gestaffelte Architektur, Eingang und Radar sind klarer und näher an der Referenz als beim alten kuppelförmigen HQ. Die Darstellung bleibt bewusst vereinfacht für ein einzelnes Hexfeld. Materialalterung und Ausarbeitung der kleinen technischen Flächen sind weiterhin deutlich schlichter als im Referenzbild. Kein Anspruch auf dessen Render- oder Detailniveau. Auf Mobile sind Silhouette und Teamfarbe erkennbar, kleine Dachdetails naturgemäß nur beim Heranzoomen.
