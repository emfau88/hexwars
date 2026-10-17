# Railgun – separates Modell zur Freigabe

Der vorhandene vierbeinige Kanonen-Platzhalter ist die Designgrundlage. Dieses echte GLB führt seine niedrige Silhouette und die zwei offenen Beschleunigerschienen weiter: geformte Keramikpanzerung, dunkle Gelenkmechanik, Fraktionsflächen, optischer Sensor, Kühlrippen und Wartungsdetails. Es ist ein neu modellierter Entwurf, keine vorgerenderte Illustration.

## Umfang

- Separate drehbare Vorschau: `railgun-preview.html`, Orange/Blau, Vergleich mit tatsächlichem HQ und Mech, Gelenkachsen, Pause, Zeitlupe und Zeitleiste.
- GLB: `public/models/railgun-preview/railgun.glb`.
- Bearbeitbare Blender-Datei: `art/railgun-v1/railgun-source.blend`; reproduzierbarer Aufbau: `build_railgun.py` im selben Ordner. Blender 5.2, ohne externe Erweiterungen.
- Im Spiel wird weiterhin der bisherige Fernkämpfer geladen. Keine Änderungen an Fabriken, Animationen anderer Einheiten, Simulation oder Balance.

## Mechanischer Aufbau

Vier verbundene Beinketten mit jeweils Hüft-, Knie- und Fußgelenk. Geometrie hängt tatsächlich an den Gelenken; alle Teile bleiben starr. Drehkranz, Waffenhöhe und Rückstoßschlitten sind unabhängig beweglich. Muzzle und Charge_Socket markieren spätere Effektpositionen. GLB: Y nach oben, Front −Z. Keine Hautgewichte oder verformte Panzerung erforderlich.

Die vier eingebetteten Prüfclips demonstrieren Idle, Drehung/Höhenrichtung, diagonale Beinbewegung und Rückstoß. **Joint_Check ist ausdrücklich keine fertige, bodenkontaktgeregelte Laufanimation.** Finale Lauf-, Lade-, Treffer- und Todesanimationen sowie die Anbindung an reale Schüsse folgen erst nach Modellfreigabe. In Blender erklärt der Textblock PLAY_CLIP.py die Wiedergabe der NLA-Spuren.

## Maße und Aufwand

Grundstellung: 1,59 breit × 1,29 hoch × 1,809 tief. Mech-Referenz: 1,45 hoch; HQ auf die im Spiel verwendete Breite 4,30 normiert. Die Standbreite liegt unter der Fabriktorbreite 1,86. Der vollständige Bewegungsraum am Tor muss bei späterer Integration geprüft werden.

57.412 Dreiecke, 16 starre Baugruppen, 32 Materialprimitiven, zwei Materialien. Eingebettete PBR-Palette für Keramik, Metall, Gummi, Sensor und Beschriftung; separat färbbares Team-Material. Die erste Fassung hatte 79.036 Dreiecke und 70 Primitiven. Gemeinsame Palette und reduzierte Rundungssegmente senken den Aufwand, ohne Gelenke zusammenzuführen.

Die saubereren Oberflächen sind eine bewusste erste Ausarbeitung; die stärkeren Gebrauchsspuren der vorhandenen HQ-/Mech-Texturen werden noch nicht vollständig nachgebildet. Bitte besonders Silhouette, Doppelrail und Detailgrad im Größenvergleich beurteilen.

**Keine Aussage zur Gefechts-Framerate:** Das Modell ist noch nicht im Spiel. 32 Einzelaufrufe je Roboter wären für große Armeen zu teuer. Nach Freigabe sollen die starren Bauteile wie beim Mech gemeinsam instanziert und aus Entfernung vereinfacht werden; dafür sind Hierarchie und Materialzahl vorbereitet. Ein gemessener Vergleich im laufenden Gefecht gehört zur späteren Integration.

## Prüfung

`node tests/railgun-preview.mjs` lädt das tatsächliche GLB und prüft bewegte Geometrie, vier durchgehende Beinketten, Rückkehr zur Grundstellung, Pause, Teamfarben, Downloads und Hochformat. `validation.json` enthält die Ergebnisse. Screenshots in diesem Ordner stammen aus dem Echtzeitviewer; sie ersetzen ihn nicht.

Reproduktion: Blender im Hintergrund mit `--python art/railgun-v1/build_railgun.py`, danach `node art/railgun-v1/capture.mjs`. Der lokale Server muss auf Port 4181 laufen. `npm run build` nimmt die separate Vorschau und Quelldatei in den statischen Build auf.

Geprüft am 17.10.2026: 19/19 Browserprüfungen lokal und über den öffentlichen, auf c260fa8 festgelegten Vorschau-Link bestanden. Statischer Build erfolgreich. Keine Browser-Ausnahmen. Kein erneuter Balance-Audit nötig, da kein Spielcode geändert wurde.
