# Railgun – GLB und Animationen im Spiel

Stand: 17.10.2026. Das freigegebene vierbeinige Railgun-Modell ersetzt den geometrischen Fernkämpfer in Zentrale Front, Erste Front, Wiesenkrieg und der M1.5-Demo. Das Kampflabor bleibt separat erhalten. Die ursprüngliche Freigabevorschau bleibt unter `railgun-preview.html` verfügbar; `railgun-viewer.html` zeigt die sechs tatsächlich verwendeten Animationsclips.

## Modell und Bewegung

Die Vertexattribute des vollständigen animierten GLB stimmen mit dem freigegebenen Modell überein (automatischer Vergleich in `asset-validation.json`). Bestehende Formen, Materialien und Fraktionsflächen bleiben erhalten. 16 starre Baugruppen mit 32 Materialprimitiven; keine deformierte Panzerung.

- **Walk:** Vier zweigliedrige Beinketten mit separat nivellierten Füßen, diagonaler Schrittfolge und 64 % Standphase. Analytische Gelenkwinkel halten die Standfüße im geraden Gang am Boden; die Schwungfüße heben um 7 cm ab. Der Körper senkt sich während des Laufens um etwa 7,5 cm. Die Phase folgt der tatsächlich gerenderten Wegstrecke, nicht einer fest eingestellten Laufgeschwindigkeit. Gemessener Standphasenschlupf im GLB: etwa 0,02 mm. Beim Anlaufen und Anhalten blendet die Darstellung zwischen Gang und Stand. Für Kurven folgt der Körper weiterhin der bestehenden Fahrtrichtung; es gibt keinen Eingriff in die Wegfindung.
- **Idle:** Kleine Servobewegungen an Turm und Waffenhöhe.
- **Charge:** Waffenbracing und vorfahrender Schlitten; im Spiel zusätzlich ein wachsender Lichtpunkt zwischen den Rails. Verwendet ausschließlich die vorhandenen `aimTime`-/`cooldown`-Werte vor dem Schuss; unterbrochene Zielerfassung bricht die sichtbare Ladung ab.
- **Attack:** Etwa 9 cm Rückstoß und kurze Waffenreaktion. Ausschließlich durch das tatsächliche `shot`-Ereignis ausgelöst. Strahl und Mündungsblitz beginnen an der transformierten GLB-Mündungsposition. Die Darstellung verschiebt keinen Trefferzeitpunkt.
- **Hit:** Kurze mechanische Erschütterung durch das vorhandene Trefferereignis.
- **Death:** Beine knicken ein, Körper senkt sich, Waffenaufbau kippt nach vorn. Nach 1,2 Sekunden folgt der vorhandene Trümmereffekt. Die Einheit verschwindet zum ursprünglichen Zeitpunkt aus der Kampfsimulation; der verbleibende Körper ist nur Darstellung.

Drehkranz und Waffenhöhe richten sich zusätzlich auf das reale Ziel. Additive Lade-, Treffer- und Schussbewegungen überlagern die Grundpose. Beide Fraktionen verwenden dieselbe Animationsklasse. Auf nachträglichen ausdrücklichen Wunsch steigt ausschließlich die Railgun-Reichweite im Hauptmodus Zentrale Front von 4,0 auf 4,8 (+20 %). Andere Einheitenwerte, Wirtschaft, KI, Produktionszeiten, Karten und Fabrikmechaniken bleiben unverändert. Historische Missionen und Kampflabor behalten Reichweite 4,0. Zentrale Spielstände mit dem bisherigen Standardwert 4,0 werden beim Laden auf 4,8 umgestellt; individuelle abweichende Reichweiten bleiben erhalten.

## Dateien und Reproduktion

- `public/models/railgun-animated/railgun.glb`: vollständiges Modell mit Idle, Walk, Charge, Attack, Hit und Death.
- `public/models/railgun-animated/railgun-lod.glb`: abgeleitete Übersichtsgeometrie mit identischer Gelenkhierarchie.
- `art/railgun-animation/railgun-animated.blend`: bearbeitbare Quelldatei mit NLA-Clips; der Textblock PLAY_CLIP.py aktiviert einen Clip.
- `art/railgun-animation/animate.py`: lädt die freigegebene Blender-Datei unverändert, erzeugt Animationen und exportiert beide GLBs. Aus dem Experimentverzeichnis mit Blender 5.2 ausführen.
- `railgun-viewer.html`: drehen, zoomen, Orange/Blau, HQ-/Mech-Vergleich, sechs Animationen, Pause/Zeitlupe, Vorwärtsbewegung und Übergangssequenz.

Die neue Runtime verwendet individuelle Animationszustände und gemeinsam instanzierte starre Bauteile. Die Zahl der Zeichenaufrufe wächst dadurch nicht mit jedem Roboter. Unter 1,8-fachem Zoom verwendet sie 20.654 statt 57.412 Dreiecke pro Einheit; Gelenke und Animation bleiben gleich. Der Viewer zeigt immer das vollständige freigegebene Modell.

## Animationsprüfung vor der anschließenden Reichweitenänderung

- **88/88 bestehende Logiktests** bestanden.
- Railgun-Browserprüfung: sechs echte GLB-Clips, alle vier Fußbahnen, unabhängige Phasen und Fraktionen, Ladung aus Simulationswerten, Schuss/Mündung, Treffer und beidseitige Zerstörung, Viewer und Hochformat.
- Bestehende Mech-Browserprüfung vollständig bestanden; Fabrik- und Mech-Quelldateien unverändert.
- Vollständige zusätzliche Partie: Sieg nach **374,55 s**, gegnerisches HQ 0 LP; Speichern und Neuladen mit exakt gleichem Simulationszustand.
- Bestehende zentrale Browserregression: Partie mit tatsächlichen HUD-Bestellungen endet nach **439,70 s**; Vergleichslauf gegen Vorhut nach **435,80 s**. Ohne Spielerbefehle echte Niederlage nach **168,80 s**. Alle drei Gegnerläufe stimmen exakt mit der Simulation ohne Browser überein.
- Zwei damalige Vergleichsläufe gegen andere KI-Strategien blieben nach 720 s offen. Die nachfolgende ausdrücklich gewünschte Reichweitenänderung verändert diese Ergebnisse; siehe den aktuellen Reichweiten-Audit unten.
- Erste Front, Wiesenkrieg und M1.5 laden und kämpfen mit dem neuen Renderer; das Kampflabor bleibt erreichbar. Hochformat-Touchbedienung wurde geprüft.

Rohdaten: `animation-tests.json`, `modes.json`, `central/results.json`, `asset-validation.json`. Reproduzierbare Befehle: `npm test`, `npm run test:rail`, `npm run test:rail-modes`, `npm run test:mech`, `npm run audit:rail-performance`.

## Performance

Messwerte und Methode: `performance.json`; unoptimierter Vergleich mit voller Geometrie: `performance-full-detail.json`. Gleiche Landschaft, HQs, Schatten und Einheitenzahlen; bisheriger Platzhalter gegen das neue animierte Modell. Nach Aufwärmphase 90 Browserframes und 150 reine Transformationsmessungen. Headless Chromium mit echter AMD-Radeon-GPU, keine Software-Rendering-Messung.

Die Smartphone-Ansicht ist eine Auflösungs-/DPR-Emulation auf derselben Desktop-GPU, **keine Messung auf einem physischen Smartphone**. Die isolierte Darstellungsmessung ist keine garantierte Framerate einer vollständigen Partie. Größere Armeen kosten zusätzliche CPU-Zeit für die individuellen Gelenke. Die Übersicht reduziert vor allem die GPU-Geometriekosten; der Nahblick ist bewusst detailreicher.

Median der gemessenen Frame-Abstände in Millisekunden (kleiner ist besser):

| Ansicht | Railguns | Bisheriger Platzhalter | Animiertes GLB, Übersicht |
|---|---:|---:|---:|
| Desktop | 16 | 7.2 | 8.0 |
| Desktop | 64 | 8.0 | 9.0 |
| Desktop | 128 | 8.4 | 15.0 |
| Mobile viewport | 16 | 5.0 | 6.4 |
| Mobile viewport | 64 | 5.6 | 8.4 |
| Mobile viewport | 128 | 6.0 | 11.3 |

## Aktueller Reichweiten-Audit: 4,8 in Zentrale Front

Die drei KI-Vergleiche ergeben jetzt: Vorhut gegen Eisenkeil verliert nach 371,70 s; Vorhut gegen Aufbaukommando verliert nach 638,20 s; Eisenkeil gegen Aufbaukommando verliert nach 695,15 s. In den letzten beiden Paarungen ändern sich damit die bisherigen Ergebnisse. Der kontrollierte Wechsel gegen Railguns nach 3:20 verhindert weiterhin eine Niederlage, gewinnt aber auch mit dem früher entscheidenden Sofortnachschub nicht mehr innerhalb von 12 Minuten. Umgekehrt gewinnt die Reaktion Mechs gegen einen Drohnenangriff nach 312,80 s. Rohdaten: `range-audit.json`.

Diese Auswirkungen wurden nicht durch weitere Balanceänderungen ausgeglichen. Die betroffenen Ergebnistests wurden auf die bewusst geänderte Reichweite aktualisiert, ohne Symmetrie-, Wirtschafts- oder Regellogikprüfungen zu entfernen. Zusätzliche Tests prüfen die Grenze 4,8 / 4,8001 für beide Fraktionen und die gezielte Spielstandmigration.

Schussdarstellung: Kurze sichtbare Ladung während der vorhandenen Zielerfassung, sehr kurzer Rail-Strahl und Mündungsblitz beim tatsächlichen `shot`, synchroner Rückstoß, vorhandener Einschlagfunken-Effekt am getroffenen Ziel. Keine zusätzliche Wartezeit, keine von der Animation berechneten Treffer.


Nach der Reichweitenänderung: **90/90 Regeltests bestanden**, Railgun-Animations- und Missionsprüfungen erneut bestanden. Die zusätzliche vollständige Browserpartie endet nun nach **218,45 s** statt 374,55 s. Reichweite 4,8 erlaubt außerdem Beschuss außerhalb der unveränderten zentralen HQ-Verteidigungsreichweite 4,0. Diese stärkere Belagerungswirkung ist eine direkte Folge der gewünschten Reichweite.

Finaler statischer Build mit 4,8 Reichweite: vollständige HUD-Partie gewonnen nach 218,10 s; drei Gegnervergleiche stimmen exakt mit Node überein (Sieg 371,70 s, Spiegelung nach 720 s offen, Niederlage 695,15 s). Ohne Spielerbefehle Niederlage nach 153,50 s. Hochformat-Touchprüfung bestanden. Rohdaten: central-range/results.json.

Auswahlregression behoben: Instanz-Grenzkugeln werden beim Anklicken neu berechnet, weil Animation, Bewegung und Detailwechsel sie verändern. Reale Railgun-Auswahl und Reichweitenanzeige sind bei Übersicht und Nahansicht geprüft. Keine zusätzliche Arbeit pro Animationsframe.

Öffentlich geprüft: Laufzeitstand a2d2809. Sechs echte GLB-Clips im Viewer, GLB/LOD/Blender-Downloads bytegleich, animierte Fabrikausfahrt und Modellklick mit Anzeige 4,8. Die vollständige Online-Partie endet nach 235,95 s durch HQ-Zerstörung und zeigt den Siegschirm. Keine Browser-Ausnahmen. Details: public.json.
