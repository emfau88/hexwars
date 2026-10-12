# Charming Sci-Fi Frontier — integrierter Art-Pass

**Historischer Nachweis des ersten integrierten Charming-Art-Passes (`55d7047`).** Die anschließende ausschließlich auf die Drohne begrenzte Überarbeitung und ihre aktuellen Bilder stehen in [DRONE.md](DRONE.md).

Eine Modellfamilie für die bestehende Karte: **PIP**, die kleine Schwebedrohne; **Haven**, ihr kompaktes HQ mit Andocköffnung; **Seed**, das aufgehängte Relais. Helle Keramik, gedämpftes Jadegrün, dunkle Gelenke, gebürstete Legierung und kleine orange/blaue Akzente verbinden die drei Modelle. Die ruhigeren Spielflächen bleiben der Hintergrund für Gebäude, Einheiten und Truppenwerte.

Vergleichsbasis ist Commit `4867c595a6d18e3f20340d7a7b283574adb7645c`, lokal zusätzlich als `snapshot/hexfront-before-charming-art` gesichert. Er enthält bereits den vollständigen Wirtschafts-/Readability-Pass. Seine [öffentliche Wirtschaftsversion](https://rawcdn.githack.com/emfau88/hexwars/df722a6a8cf04c8c904f97c880115ce2ec0c4ee7/experiments/hexfront-3d/preview/index.html) bleibt unverändert verfügbar.

## Modelle und Herstellung

Die drei Kernmodelle sind **neu in Blender 5.2 modelliert und als echtes GLB exportiert**. Keine Umfärbung der alten Three.js-Lofts und keine Bildflächen als Ersatz für Geometrie. [Reproduzierbares Blender-Skript](../scripts/model-frontier.py), [editierbare Blender-Datei](../scripts/frontier-source.blend), [GLB](../public/assets/frontier/frontier.glb), [Mesh-Manifest](../public/assets/frontier/model-manifest.json).

| Modell | Gestaltung | Dreiecke im gelieferten Mesh |
|---|---|---:|
| PIP | Geteilte gewölbte Schalen, eingelassene Rückenlinie, schwenkbarer optischer Sensor mit Blende, zwei modellierte Gondeln mit versenkten Turbinen, Stabilisatoren und flexible Antenne | 5.512 |
| Haven | Eigenes mehrstufiges Gehäuse, separate Dachschalen, tief liegende Andocköffnung, seitliche Lüftungskanäle, Energiebrunnen und bewegliche Kommunikationsschale | 7.149 |
| Seed | Drei gebogene Keramikträger, innenliegende Metallstreben, aufgehängter Kern und beweglicher Haltering | 4.802 |

Das gesamte GLB benötigt **634.036 Bytes**. Bevels, geglättete beziehungsweise gewichtete Normalen, separate Gelenk-Pivots und eine abschließende Mesh-Reduktion werden in Blender angewendet. UVs verwenden eine gemeinsame Oberflächenskalierung; feine Lack-/Keramikunregelmäßigkeiten werden über eine kleine geteilte Textur ergänzt. Es gibt keine großen neuen Texturpakete. Orange und Blau verwenden dieselben Meshes mit getrennten Akzentmaterialien.

PIP wird in Material-/Gelenkgruppen instanziert. Die beiden kleinen Drohnen am Dock sind rein kosmetische Stellvertreter der Garnison; sie erhöhen weder Truppenzahl noch Produktion. Bewegliche Gebäudeteile bleiben beweglich, während die unbewegliche Architektur mit dem vorhandenen statischen Batching zusammengefasst wird. Die Gebäude behalten ihre logischen Picking-IDs.

### Geprüfte Alternativen und Referenzen

- Blender ist installiert und wurde tatsächlich ausgeführt. Gegenüber einer Bild-zu-3D-Rekonstruktion erlaubt es hier kontrollierte Silhouetten, definierte Gelenke und die engen vorhandenen Gebäude-Fußabdrücke.
- Das vorhandene **to3D**-Plugin bietet Bild-URL-/Upload-Konvertierung; es wurde als Alternative geprüft, aber kein Modell darüber generiert. Es lag keine passende eigene Referenzbild-URL vor, und präzise bewegliche Einzelteile waren für diesen Auftrag wichtiger.
- [Quaternius Ultimate Space Kit](https://quaternius.com/packs/ultimatespacekit.html) und [Kenney Space Kit](https://kenney.nl/assets/space-kit) wurden samt Vorschaubildern geprüft. Beide sind CC0. Ihre vorhandenen Raumfahrzeug-/Modulformen treffen die gewünschte kleine Drohnenfamilie nur teilweise; keine neuen Dateien daraus wurden importiert.
- Die vorhandenen Poly-Haven-Felsoberflächen und vier Quaternius-Farne bleiben erhalten. [Quellen, Transformationen und Lizenzen](../ASSET_LICENSES.md).
- Visuell betrachtete Gameplay-Referenzen: [Tacticus bei Multiplayer.it](https://multiplayer.it/recensioni/warhammer-40000-tacticus-recensione-strategico-ios-android.html) und [Mushroom Wars 2 auf Steam](https://store.steampowered.com/app/457730/). Bei Tacticus sind klare obere Spielflächen, starke Randformen und konzentrierte Details entscheidend; bei Mushroom Wars die freundlichen Gebäudesilhouetten und die Trennung zwischen Wegen und Vegetationsrändern. Nur diese Gestaltungsprinzipien werden verwendet. Referenzbilder, Logos und fremde Spielmodelle liegen **nicht** im Repository oder Build.

## Landschaft, Licht und Lesbarkeit

Die bestehende Geländegeometrie samt Formationen bleibt erhalten. Der bestehende Weltatlas mischt nun warme Erde, frisches gedämpftes Gras und helleren Kalkstein. Fotografische Materialdetails, Normal-/Roughness-Maps und Kontaktwirkung bleiben erhalten. Der Kontrast innerhalb begehbarer Flächen ist bewusst gering. Pflanzen behalten ihre Standorte; geglättete Vertexfarben beseitigen die zuvor fleckigen Dreiecke der Laubgruppen.

Das Hauptlicht ist warm, die Umgebungsaufhellung neutraler und der Schattenfilter weicher. Es gibt weder Bloom noch einen globalen Sättigungsfilter. Ein einzelner zusammengefasster dunkler Unterrand gibt den bestehenden hellen Hexkonturen auf dem helleren Stein mehr Kontrast. Teamflächen, Zahlen-Pills, Auswahl, Wege und rote Fehlerrückmeldung behalten ihre Funktion und Position.

Nach der ersten Runtime-Prüfung wurden die zu tief im HQ-Gehäuse sitzenden Dachschalen angehoben, die darüberliegenden Akzente der echten Dachkrümmung angepasst, die Bodenhelligkeit reduziert und die Pflanzenfarben geglättet. Die reine Landschaftsaufnahme blendet auch HUD, Zahlen, Hexkonturen, Befehlslinien und Wasserzeichen aus.

## Bewegung und Persönlichkeit

Sensor und Stabilisatoren bewegen sich leicht; die Dockdrohnen schweben ruhig. Beim Transport ergänzt eine kleine Neigung die bestehende, unveränderte Flugbahn. Eine tatsächlich erfolgreiche Eroberung löst einen kurzen Hopser aus, ein verlorener Angriff ein kurzes Taumeln. Der neutrale Relaiskern ruht; Besitzerwechsel aktiviert ihn kurz, danach bewegt er sich zurückhaltend. HQ-Schalenantennen schwenken langsam.

Diese Bewegungen hängen ausschließlich an vorhandenen Simulationszuständen und Ereignissen. Höchstens 64 instanzierte Drohnenrepräsentationen und 24 temporäre Effekte werden dargestellt; LQ begrenzt Effekte auf acht und entfernt Partikel-/Schubdetails. Reduzierte Bewegung deaktiviert die charakteristischen Ausschläge. Wiederholte Effektbelastung erzeugt keine zusätzlichen Geometrien oder Texturen.

## Runtime-Bilder

| Ansicht | Vorher | Nachher |
|---|---|---|
| Desktop, 1440 × 900, Startzustand, 70° | [Bild](frontier/desktop-before-start.png) | [Bild](frontier/desktop-after-start.png) |
| Mobile, 390 × 844, Startzustand, 70° | [Bild](frontier/mobile-before-start.png) | [Bild](frontier/mobile-after-start.png) |

[HQ-Nahaufnahme](frontier/hq-detail.png) · [PIP im echten Transport](frontier/drone-detail.png) · [Relais-Nahaufnahme](frontier/relay-detail.png) · [Landschaft ohne Gameplay-Overlay](frontier/landscape.png) · [Mobile Transport](frontier/mobile-after-transport.png) · [Eroberung](frontier/desktop-capture.png) · [Verlorener Angriff](frontier/combat-effect.png) · [Relais aktiviert](frontier/relay-active.png).

Nahaufnahmen verwenden im Test stärkeres Framing beziehungsweise eine Inspektionskamera am tatsächlich fliegenden Modell. Diese Kamera wird **nicht** im Spiel ausgeliefert. Die normale Ansicht bleibt 70°, die optionale Dioramaansicht 55°. Die normalen Übersichtsbilder verwenden das bestehende automatische Framing. Für den zusätzlichen direkten Vergleich werden der alte Git-Stand und der neue Stand zur Laufzeit mit exakt derselben gespeicherten Kameramatrix und demselben Startzustand gerendert: [Desktop vorher](frontier/compare-desktop-before.png), [Desktop nachher](frontier/compare-desktop-after.png), [Mobile vorher](frontier/compare-mobile-before.png), [Mobile nachher](frontier/compare-mobile-after.png). [Vergleichsbericht](frontier/comparison-report.json).

Video-Clips entfallen auf Wunsch. Die ausgewählten Einzelbilder der Reaktionen stammen aus echten Aufträgen auf dem unveränderten Startzustand. Der Test treibt lediglich den vorhandenen Simulationsschritt von 50 ms an, um reproduzierbare Einzelbilder zu speichern. Besitzverhältnisse und Truppenstärken werden dabei nicht umgeschrieben. Synthetisch erzeugte Ereignisse werden ausschließlich im getrennten Pool-Belastungstest verwendet.

## Prüfstand

- 32 vorhandene Logik-, Wirtschafts-, Kampf-, Kamera- und Transporttests bestanden. Der Art-Pass ändert `game.js`, `economy.js`, `tactics.js`, `map.js`, `transport.js`, `camera.js`, `main.js` und die UI-Styles nicht.
- Desktop-/Mobile-Aufnahmen und tatsächliche Ziehbefehle, erfolgreiche Eroberung sowie erfolgloser Angriff bestanden. Effektpool maximal 24, anschließend null; LQ acht und keine Partikel/Schubspuren. Wiederholung: 182 Geometrien / 12 Texturen unverändert, Simulations-Snapshot unverändert. [Art-/Effektbericht](frontier/after-report.json).
- Beide Fraktionen im laufenden Spiel, beide Rampenrichtungen, Mehrfeld-Verstärkung und echte Relais-Eroberung bestanden. 2.778.048 geprüfte Drohnen-Vertexpositionen an Rampen mit mindestens 0,282 Welteinheiten Bodenabstand; 432.376 relevante Vertexpositionen über den konservativen Ruinenobergrenzen mit mindestens 0,358 Abstand. Das sind gezielte Proben, kein allgemeiner physikalischer Kollisionssolver. [Missionsbericht](frontier/mission-report.json).
- Startansicht: 151 Draw Calls / 69.421 Dreiecke; erfasste laufende Mission: 221 / 75.591. Das sind Runtime-Zähler der konkreten Testzustände, keine Obergrenze oder FPS-Garantie.

- **Vollständige Desktop- und Touch-Partien bestanden:** jeweils Sieg bei 187,10 s mit 37 Spieler-/24 KI-Befehlen, echte Befehle auf Höhen 0/1/2; untätige Niederlage bei 276,45 s / 43 KI-Befehlen; Neustart, Pause, Zoom, Fit und HQ/LQ bestehen. Keine Gameplay-/Browserfehler. [Matchbericht](frontier/matches/browser-report.json). Eine abschließende kosmetische Korrektur setzt die Dock-Stellvertreter mittig in ihre Andockbereiche; Gameplay- und Kameracode bleiben unverändert, aktuelle Art-/Eingabeaufnahmen prüfen diese Positionen.
- **Produktionsstart bestanden:** Entwicklungs-QA ist entfernt; die normale Uhr läuft. In den vollständigen Software-Renderer-Läufen lagen die Framezeiten bei 166,7 ms Median / 183,4 ms P95 (Desktop) sowie 100 / 116,7 ms (Mobile-Viewport). Diese Werte belegen ausdrücklich **keine 60 FPS** und keine echte Smartphone-Leistung.

- Abschließende Maus-/Touch-Gesten bestanden: direkter Drag, genau ein Auftrag, halbe Stärke, geometrisches Picking, Klickalternative, Felswand-/ungültige Ziele, Loslassen außerhalb/auf der Quelle, native Abbrüche, zweiter Finger, Hintergrund-Pan, Zoom und Pause. [Gestenbericht](frontier/gestures/input-report.json).
- Lesbarkeitsprüfung bei 1440 × 900, 390 × 844 und 320 × 568 bestanden: Projektion aller 37 Zahlenzentren, Kamerawechsel, Zoom/Fit, Höhenprognose und beide Wirtschaftsmodi. In der 70°-Startansicht überlappen die Zahlenrechtecke bei allen drei Größen nicht. Die flachere 55°-Übersicht hat 3/5/37 Rechtecküberlappungen (Desktop/390/320); dreistellige Testwerte auf 320 px haben 31, mit dem vorhandenen Detailzoom null. Dieser abschließende Durchlauf prüft nicht erneut 111 native Einzeltaps; die tatsächlichen Eingaben sind durch Gesten- und Matchtests belegt. [Bericht](frontier/readability/screens-report.json).
- [Interaktiver Bildvergleich](frontier/compare.html): identische Kameramatrizen und vollständiger Startzustand programmatisch geprüft.

Die öffentlichen Nachweise und der feste Produktionslink stehen im [Veröffentlichungsbericht](PUBLISH.md).

## Kritische Bewertung

| Kriterium | Ergebnis und Grenze |
|---|---|
| Freundlichere Wirkung | Ja: warme Wege, lebendigeres Grün, helle technische Schalen und offene Andockbereiche statt der bisherigen Festungstechnik. |
| Harmonischere Farben | Ja: eine gemeinsame Keramik-/Jadefamilie mit kleinen Teamakzenten; die Landschaft ist heller, ohne die Teams zu überdecken. |
| Persönlichkeit der Drohnen | Ja: ein einzelner Sensor, zwei Schwebegondeln, kleine Korrekturbewegungen und kurze Reaktionen. Feine Mimik ist in der mobilen Übersicht naturgemäß nur begrenzt sichtbar. |
| Charakteristischere Gebäude | Ja: HQ-Dachspalt und Docköffnung, Relais mit drei gebogenen Trägern und aufgehängtem Kern. Die Detailtiefe bleibt unter aufwendig von Hand gestalteten kommerziellen Hauptassets. |
| Materialqualität der Landschaft | Erhalten: echte Felsgeometrie und CC0-Oberflächen; auf den Spielflächen absichtlich weniger Kontrast. Kein neues Gelände oder gemalter Hintergrund. |
| Taktische Übersicht | Beibehalten: 37 feste Zahlen, vorhandene Farbkodierung und Höhen; kontrastierende Konturen. Auf 320 px und in der flacheren Ansicht bleiben die bestehenden Zoom-Kompromisse relevant. |
| Eigenständigkeit | Eine zusammenhängende neue Modellfamilie, keine übernommenen Figuren oder Architektur aus den Referenzspielen. |
| Normale Spielperspektive | HQs, Relais und bewegte PIPs sind erkennbar; die Nahaufnahmen zeigen zusätzliche Details, die nicht alle in der Übersicht sichtbar sein können. |

Die neue Identität ist vollständig integriert und deutlich freundlicher. **Tacticus-Produktionsqualität wird damit nicht behauptet.** Besonders individuell bemalte Gebrauchsspuren, gebackene Detail-Normalen und auf echten Geräten abgestimmte Material-/Schattenbudgets wären weitere Qualitätsstufen. Kein physisches Android-/iOS-Gerät oder Safari wurde getestet; 60 FPS auf realen Smartphones sind nicht nachgewiesen. Dies ist eine bewusst begrenzte Art-Überarbeitung der vorhandenen Einzelkarte.

## Starten und reproduzieren

```sh
git switch experiment/hexfront-3d-diorama
cd experiments/hexfront-3d
npm ci
npm run dev
# http://127.0.0.1:4174/
# Vergleich: http://127.0.0.1:4174/?economy=legacy-local
npm test
npm run build
npm run preview
```

Modelle neu erzeugen: `blender --background --python scripts/model-frontier.py`. Blender ist nur zum Bearbeiten nötig; der Browser lädt die fertig exportierte GLB-Datei. Optionale Browsernachweise mit Playwright/Chromium: `npm run test:frontier`, `node tests/frontier-takeoff.mjs`, `node tests/browser.mjs --drag`. Die gebaute Variante enthält keine QA-API.
