# PIP — Drohnenüberarbeitung anhand der vier Bildreferenzen

Die neue Drohne ersetzt die erste PIP-Fassung des Charming-Frontier-Art-Passes (`55d7047`). Das ist ein eigener, begrenzter Folgeschritt: **HQs, Relais, Terrain, Materialien der Umgebung, Beleuchtung, UI und Kamera wurden dafür nicht neu gestaltet.** Der vorangegangene [vollständige Art-Pass](FRONTIER.md) bleibt im Git-Verlauf und in seinen Bildnachweisen erhalten.

## Gemeinsame Umsetzung der Referenzen

Alle vier vom Nutzer bereitgestellten Tafeln wurden gemeinsam visuell ausgewertet. Verwendet wurden ausschließlich Form-/Materialprinzipien, nicht Text, Layout oder Hintergründe. Die Referenzbilder selbst werden nicht ins öffentliche Repository kopiert.

| Referenzdatei | Beitrag zur neuen Drohne |
|---|---|
| `Hexfront_ Sci-Fi-Drohnen und Basen (4).png` | Zentraler eingefasster Sensor, kompakter technischer Charakter, dunkle Gelenke und kleine Fraktionsakzente. |
| `Sci‑Fi-Drohnen und Basenvarianten (1).png` | Zwei abgesetzte, nach oben offene Hovergondeln und ruhige helle Keramikflächen. |
| `Hexfront_ Drohnen, HQs und Relais (2).png` | Aufrechter kompakter Körper statt flacher Flügelkontur; kleine Stabilisatoren. |
| `HEXFRONT_ Drohnen-Designs im Vergleich (3).png` | Sensor/Körper/Gondeln als drei große, lesbare Formen; helle Schalen über dunkler Technik. |

In Blender wurde der alte Drohnenkörper vollständig ersetzt: separat gewölbte Helm-, Wangen- und Kinnschalen mit echten Fugen, ein tiefer optischer Sitz mit segmentierter Keramikeinfassung, zwei individuell profilierte Gondelschalen mit vertieften Turbinenmulden, darunterliegende Gelenkverbindungen und eine kurze obere Antenne. Sensor und kleine Steuerpaddel behalten ihre Beweglichkeit. Die Hoveröffnungen und visuellen Schubspuren wurden aufeinander ausgerichtet. Orange und Blau teilen sich die Geometrie; die optischen Flächen bekommen getrennte Instanzfarben, ohne weiß ausgewaschene Emission.

Der zweite Runtime-Durchlauf korrigierte sichtbare Verbindungen innerhalb der Gondelmulden, die offene Stirnlücke und den zu blassen Sensor. Die endgültigen Aufnahmen zeigen einen tatsächlich erteilten zweiten Transportauftrag über freies Gelände. Die Spielzustände sowie Kameramatrizen sind vor und nach dem Austausch identisch; nur Drohnenmodell/-material und die dazugehörige Schubposition ändern sich.

## Dateien und Umfang

- [Blender-Skript](../scripts/model-frontier.py) und [editierbare Quelle](../scripts/frontier-source.blend).
- [GLB-Bibliothek](../public/assets/frontier/frontier.glb): **928.256 Bytes**, enthält PIP sowie die bestehenden Haven-/Seed-Modelle.
- PIP: **16.092 Dreiecke**, **17 instanzierte Material-/Gelenkgruppen**. Erste Modellfassung: 22.964 Dreiecke; nach Sichtprüfung auf 16.092 reduziert. Alte PIP-Fassung: 5.512 Dreiecke.
- Keine zusätzlichen Bildtexturen, keine neuen externen Modelle, keine Bild-zu-3D-Behauptung. [Quellen und Lizenzen](../ASSET_LICENSES.md).
- Beim erneuten Export kann Blender die Vertexreihenfolge ändern. [Geometrienachweis](drone-reference/scope-report.json): Für HQ/Relais sind die sortierten Dreiecksattribute, Materialdaten und Transformationen gegenüber `55d7047` gleich (Attribute auf fünf Nachkommastellen verglichen).

## Tatsächliche Spielbilder

[Interaktiver Vorher/Nachher-Vergleich](drone-reference/compare.html) mit Desktop, Mobile und Nahaufnahme.

| Ansicht | Vorher | Neue Drohne |
|---|---|---|
| Desktop, 1440 × 900, normale 70°-Ansicht | [Bild](drone-reference/desktop-before.png) | [Bild](drone-reference/desktop-after.png) |
| Mobile, 390 × 844, normale 70°-Ansicht | [Bild](drone-reference/mobile-before.png) | [Bild](drone-reference/mobile-after.png) |
| Nahaufnahme im selben Transportzustand | [Bild](drone-reference/detail-before.png) | [Bild](drone-reference/detail-after.png) |

Die Nahaufnahme benutzt nur im Test eine nähere Inspektionskamera. Die normalen Desktop-/Mobile-Ansichten benutzen das unveränderte Framing. In der mobilen Gesamtübersicht sind Körper und zwei seitliche Gondeln als kompakte Dreierform erkennbar; Fugen und die Unterteilung des Sensors sind dort naturgemäß nicht einzeln sichtbar. Das Spielmodell erreicht nicht die malerische Oberflächenfülle oder das Studiolicht der Konzepttafeln. Die verbesserte Silhouette ist der tatsächliche Gewinn; keine Behauptung, die Referenzbilder exakt nachgebildet zu haben.

**Keine Clips erstellt.** Die bereits vorhandenen kurzen kosmetischen Reaktionen bleiben im Spiel aktiv.

## Tests

- 32 Logik-/Wirtschafts-/Bewegungstests bestanden; Produktions-Build bestanden, QA-API entfernt.
- [Direkter Runtime-Vergleich](drone-reference/report.json): native Maus-/Touchbefehle, identischer Spielzustand und identische Kamera, alle vier normalen Spielbilder und beide Nahaufnahmen erfolgreich, keine Browserfehler.
- Die vollständigen Desktop-/Touch-Partien mit Sieg, Niederlage und Neustart wurden im unmittelbar vorangegangenen Art-Pass gespielt: [Matchbericht](frontier/matches/browser-report.json). Seitdem wurden keine Simulation, Wirtschaft, KI, Eingabe oder Kamera geändert.
- [Aktuelle Integration](drone-reference/integration/after-report.json): erfolgreiche Eroberung, verlorener Angriff, Effektpool maximal 24 und danach null; nach wiederholter Belastung unverändert 180 Geometrien / 12 Texturen. LQ: acht Effekte, keine Partikel/Schubspuren; reduzierte Bewegung ohne Reaktionsdrohnen. Simulationszustand durch synthetischen Effekt-Stresstest unverändert.
- [Aktuelle Rampen-/Missionsprüfung](drone-reference/integration/mission-report.json): echte Befehle auf beiden Rampenstufen, Mehrfeld-Verstärkung, beide Teams und Relais-Eroberung. 8.110.368 Mesh-Vertexproben entlang der Rampen: mindestens 0,0448 Welteinheiten Abstand. 1.145.162 relevante Proben über konservativen Ruinenobergrenzen: mindestens 0,3155. Das sind Proben der Transport-Grundpose, kein lückenloser physikalischer Kollisionsbeweis für jede Gelenkstellung.
- Startzustand: 149 Draw Calls / 90.581 Dreiecke; erfasste Mission: 219 / 107.331. Gegenüber der ersten PIP-Fassung zwei Draw Calls weniger, aber wegen der aufwendigeren Drohne mehr Dreiecke.
- [Auslieferungsprüfung](drone-reference/delivery-report.json): acht geschützte Gameplay-/Kamera-/UI-Quelldateien unverändert gegenüber der Wirtschaftsbasis; 33 Produktionsdateien bytegleich mit `preview/`; QA deaktiviert; alter Wirtschaftsmodus startet und läuft; beide Bildvergleichsseiten auf Desktop/Mobile inklusive Slider und Tabs geprüft.
- Öffentliche Desktop-/Touch-Drag-Prüfung bestanden, einschließlich alter Wirtschaftsvariante. Alle 33 Dateien stimmen mit den Git-Blobs überein. [Veröffentlichungsbericht](PUBLISH.md), [Browserbericht](drone-reference/live/production-report.json), [Dateinachweis](drone-reference/live/assets-report.json).

Die Ergebnisse stammen aus Chromium mit Software-Rendering und Touch-Emulation. Es gibt keine neue 60-FPS-Aussage und keinen physischen Smartphone-Test. Das größere Mesh erhöht das Dreiecksbudget, die Anzahl der Instanzgruppen bleibt begrenzt; beide Qualitätsstufen bleiben verfügbar.

## Start

```sh
git switch experiment/hexfront-3d-diorama
cd experiments/hexfront-3d
npm ci
npm run dev
```

Öffnen: `http://127.0.0.1:4174/`. Vergleichswirtschaft: `?economy=legacy-local`. Produktionsbau: `npm run build`, anschließend `npm run preview`. Modell erneut erstellen: `blender --background --python scripts/model-frontier.py`. Der Browser benötigt Blender nicht.
