# HEXFRONT – Technologie und Aktionen

Stand: 12.10.2026. Ausgangspunkt war der lokale Commit `d591777b43957d7fcd4e28dcddefeb984c60caed` auf `experiment/hexfront-3d-diorama`. Der Drag-and-drop-Commit `47f5d8b` ist dessen Vorfahr. Der entfernte Branch wurde vor Beginn geprüft: `3a54ba2`, ebenfalls mit diesem Fix. Es wurde kein älterer Entwicklungsstand übernommen.

**[Veröffentlichte Fassung spielen](https://rawcdn.githack.com/emfau88/hexwars/6605d24b344ac985de9543e56dd85ed34d6c646d/experiments/hexfront-3d/preview/index.html)** · [Öffentliche Desktop-/Touch-Prüfung](technology/live/production-report.json) · [Auslieferung und Isolation](PUBLISH.md). Produktions-Commit `6605d24`.

## Gestaltung und Umfang

**Ruhiges Schlachtfeld, markante Technologie, kurze Aktionen.** Die vorhandene Felsfestung, alle 37 Sektoren, drei Höhen, Rampen, Terrainmaterialien, 70°/55°-Kameras, Zahlenplaketten und das Mobile-HUD bleiben erhalten. Neu sind eine gemeinsame Drohnenfamilie, zwei Kommandozentralen und ein Relais. Es stehen keine dekorativen Fahrzeuge mehr auf jeder Garnison. Pro aktivem Transport repräsentiert eine Drohne die gesamte Truppenstärke.

Die Drohne hat einen gegabelten gepanzerten Rumpf, eine helle Mittelspange, dunkle Serviceflächen, Frontoptik und zwei kleine Heckantriebe. Die HQs greifen diese geteilte Dacharchitektur auf: drei massive Stützen, Technikhohlräume, zwei abgeschrägte Schildhälften und ein schmaler Fraktionskern. Das Relais besitzt einen aufgehängten sechsseitigen Kern; neutral bleibt es ruhig und unbeleuchtet, unter Besitz dreht sich der Kern langsam und übernimmt die Fraktionsfarbe.

Die Geometrie in `src/technology.js` besteht aus eigens entworfenen Profilen mit mehreren Querschnitten, Materialflächen, Fasen, UVs und Normalen. Die Gebäude werden statisch zusammengefasst, Drohnen nach Material instanziert. Dunkles Metall und gedämpfte Panzerplatten nutzen die bestehende Verwitterungstextur. Es sind keine Bildkulissen und keine neuen fremden Modellpakete hinzugekommen.

Geprüfte Alternativen: [Kenney Space Kit](https://kenney.nl/assets/space-kit), [Quaternius Sci-Fi Essentials](https://quaternius.itch.io/sci-fi-essentials-kit) und [Modular Sci-Fi MegaKit](https://quaternius.com/packs/modularscifimegakit.html), jeweils CC0. Eine kleine selbst modellierte Familie ließ sich besser an die vorhandenen Hexflächen, Silhouetten und Materialien anpassen. Herkunft und Lizenzgrenzen stehen in [ASSET_LICENSES.md](../ASSET_LICENSES.md). Echte Tacticus-Spielbilder wurden erneut als Kompositionsreferenz betrachtet; es wird kein fremder Spielinhalt verteilt.

## Bewegung und Tempo

`TRANSPORT_SECONDS_PER_HEX` in `src/game.js` steht auf **1,1 Sekunden** statt vorher 2 Sekunden. Der Logiktakt bleibt 50 ms. Eine kleine Gleitkommatoleranz sorgt dafür, dass eine Kante tatsächlich nach 22 Schritten endet und nicht zufällig erst nach 23.

Nur Abflug und Endankunft beschleunigen beziehungsweise bremsen weich; eigene Zwischenfelder behalten die Fahrtgeschwindigkeit. Die Richtung blendet an Wegknicken über, ohne den legalen Weg abzuschneiden. Die Höhenausrichtung folgt der vorhandenen Rampenoberfläche, eine dezente Schwebebewegung und kurze Antriebsfahnen unterstützen sie. Zwischen Simulationsschritten wird der visuelle Fortschritt geglättet. Über HQs und Relais hebt sich der Transport weich über die Architektur. Die Spiellogik erhält weiterhin ausschließlich Hexkoordinaten und die geprüfte Route.

Der Vergleich verwendet dieselbe Karte, unveränderte KI, Produktionsraten und Höhenboni. Folgende Ergebnisse stammen aus reproduzierbaren Strategien, nicht aus menschlichen Gewinnquoten:

| Sekunden/Hex | Strategie: Befehl etwa alle 5 s | Strategie: etwa alle 6,3 s | Keine Befehle |
|---|---|---|---|
| 2,0 vorher | Sieg 265,0 s | Sieg 240,9 s | Niederlage 239,6 s |
| 1,2 | Sieg 172,2 s | Sieg 272,8 s | Niederlage 245,1 s |
| **1,1** | **Sieg 167,1 s** | **Sieg 265,2 s** | **Niederlage 257,6 s** |
| 1,0 | Sieg 133,0 s | Sieg 228,3 s | Niederlage 226,0 s |

[Vollständiger Vergleich inklusive langsamerer Strategie](technology/speed-comparison.json). Die Varianten werden zusätzlich mit derselben echten Ziehaktion im Browser gerendert: [Runtime-Vergleich](technology/speeds/comparison.jpg), [Einzelbilder und Bewegungsdaten](technology/speeds/report.json). Bei 1,0 s verkürzt sich insbesondere der erkennbare Übergang von Fahrt zu Einschlag. 1,2 s bleibt klar, wirkt aber beim wiederholten Versetzen träger. 1,1 s ist der gewählte Zwischenwert; die kurzen Effekte passen zwischen Befehle, ohne die Simulation zu verzögern.

**Offene Balancing-Grenze:** Das Zahlenkampfsystem reagiert empfindlich auf das Befehlstiming. Die bisherige Browserstrategie mit starren 5,05-s-Abständen verlor bei 281,95 s. Die Logikstrategie entscheidet nach einer strikt überschrittenen 5-s-Frist; wegen des 50-ms-Takts sind ihre tatsächlichen Intervalle teilweise 5,0 und teilweise 5,05 s. Der Browsernachweis verwendet jetzt exakt dieselben Fristen. Auch die 7,5-s-Vergleichsstrategie verliert bei allen schnelleren Varianten. Es wurden deshalb weder Sieg garantiert noch KI und Produktion heimlich erleichtert. Menschliches Playtesting bleibt nötig. Die schnelle gewinnbare Strategie liegt mit 2:47 knapp unter dem ursprünglichen 3–6-Minuten-Ziel; die langsamere erfolgreiche Variante liegt bei 4:25.

## Kampf und Eroberung

Das Ergebnis wird weiterhin sofort beim Eintreffen berechnet. `combat` und `capture` liefern zusätzliche visuelle Herkunfts- und Teamdaten; `reinforce` zeigt eine harmlose Rückmeldung bei eigener Verstärkung. Kein Effekt sendet einen Befehl oder verändert Truppenzahlen.

| Anlass | Inszenierung | Dauer |
|---|---|---|
| Abgewehrter Angriff | Kurzer Impuls, Einschlag, Verteidigerkontur; Drohne zieht sich optisch zusammen | 360 ms |
| Eroberung | Einschlag, neue Teamkontur und kleiner sich ausbreitender Impuls | 650 ms |
| HQ-Eroberung | Größerer örtlich begrenzter Impuls und neue Anlagenfarbe | 780 ms |
| Verstärkung | Kleiner Ankunftsimpuls | 240 ms |

Der bestehende Ergebnisdialog erscheint unverändert sofort; dadurch liegt ein Teil des HQ-Effekts hinter ihm. Die Konturen passen sich auch auf Rampen an die wirkliche Oberfläche an. Ein verlorener Angriff färbt das Feld nicht um. Maximal 24 Effektplätze und 64 Transportmodelle teilen Geometrien; kurz auslaufende Drohnen nutzen denselben Pool. Bei mehr Ereignissen wird der älteste Effekt ersetzt. Reduzierte Qualität begrenzt auf acht Plätze ohne Partikel und Antriebsfahnen. `prefers-reduced-motion` entfernt zusätzlich Schwebe-/Kippbewegung, Kerndrehung und auslaufende Drohnen. Neustart räumt alle Effekte auf.

## Bilder und Bewegung

Baseline und Endstand verwenden dieselben Anfangstruppen, dieselbe 70°-Ansicht und dieselben Viewports. Transportbilder vergleichen jeweils die Mitte der ersten Kante: vorher 1,0 s, jetzt 0,55 s. Nahaufnahmen nutzen ausdrücklich die bereits vorhandene Zoom-/Dioramaansicht.

| Ansicht | Vorher | Nachher |
|---|---|---|
| Desktop 1440 × 900, Start | [Bild](technology/desktop-before-start.png) | [Bild](technology/desktop-after-start.png) |
| Desktop, Transport | [Bild](technology/desktop-before-transport.png) | [Bild](technology/desktop-after-transport.png) |
| Mobile 390 × 844, Start | [Bild](technology/mobile-before-start.png) | [Bild](technology/mobile-after-start.png) |
| Mobile, Transport | [Bild](technology/mobile-before-transport.png) | [Bild](technology/mobile-after-transport.png) |

- [Reine Landschaft ohne Spielinformationen](technology/landscape.png)

- [HQ](technology/hq-detail.png), [Relais](technology/relay-detail.png), [aktiviertes Relais](technology/relay-active.png), [Drohne](technology/drone-detail.png)

- [Eroberung Desktop](technology/desktop-capture.png), [Eroberung Mobile](technology/mobile-capture.png), [Abwehr](technology/combat-effect.png)

- [Untere Rampe](technology/ramp-lower.png), [obere Rampe](technology/ramp-upper.png)

- **[Aktionsclip als WebM](technology/action.webm)** und [übersichtliche Bildsequenz](technology/action-sequence.jpg): echte Befehle, Aufnahme alle 0,1 Simulationssekunden, Wiedergabe mit 10 Bildern/s. Dies ist eine kontrollierte Bewegungsaufnahme, kein Echtzeit-FPS-Nachweis. Alle 29 Originalframes liegen in `technology/sequence/`.

## Prüfnachweise und Reproduktion

```sh
npm ci
npm test
npm run build
npm run dev
```

Dev-URL: http://127.0.0.1:4174. Für den fertigen Build den Devserver beenden und `npm run preview` starten. Veröffentlichung und der aktuelle öffentliche Testlink: [PUBLISH.md](PUBLISH.md).

Optionale Browsertests benötigen Playwright/Chromium wie in der [README](../README.md) beschrieben. Test-Hooks existieren nur im Devserver und werden im Produktions-Build entfernt. Kein Test muss Einheiten oder Besitzstände umschreiben, um die vollständigen Partien zu gewinnen oder zu verlieren.

- `npm test`: 20 Prüfungen; Karte, Wege, Höhenboni, Sieg/Niederlage, genaue Transportdauer, Endpunkte, kontinuierliche Richtung und Höhenanpassung.

- `node tests/technology.mjs`: Desktop/Mobile, echte Ziehbefehle, Baseline-Vergleich, reale erste Eroberung und Abwehr, synthetischer reiner Effekt-Stresstest, reduzierte Qualität und reduzierte Bewegung. [Bericht](technology/after-report.json).

- `node tests/technology-mission.mjs`: echte Befehle durch beide westlichen Höhenübergänge, Mehrfeld-Verstärkung, Relais-Einnahme und gleichzeitig aktive KI. Anschließend Geometrieprüfung auf allen vier Rampenkanten in beiden Richtungen: 518.112 Vertex-/Oberflächenvergleiche, kleinster Abstand 0,202 Welt-Einheiten. Zusätzlich 82.249 Vergleiche an konservativen Ruinenoberkanten, kleinster Abstand 0,380. [Bericht](technology/mission-report.json).

- Vollständige Maus-/Touchpartien bestanden auf beiden Geräten: Sieg 167,1 s / 33 Befehle / 25 KI-Befehle, Niederlage 257,55 s / 40 KI-Befehle, Neustart und Produktionsuhr. [Bericht](technology/match/browser-report.json). Gestentrennung und alternative Tippbefehle: [Bericht](technology/input/input-report.json). Kamerapicking/Zoom/Reset auf fünf Viewports: [Bericht](technology/camera/input-report.json).

- `npm run test:speeds`: deterministischer Geschwindigkeitsvergleich plus Runtime-Bildvergleich.

Der finale lokale Produktionslauf mit echter Uhr, Ziehbefehlen, Pause und ohne QA-API bestand auf Desktop und Mobile: [Bericht](technology/production/production-report.json). Ein erster Lauf meldete einen abgebrochenen Fern-Binärrequest trotz erfolgreich geladenem Spiel; der Wiederholungslauf bestand ohne Request- oder Spielfehler. Dies ist keine öffentliche URL-Prüfung.

Beim Effekt-Stresstest blieben nach identischer Aufwärmung **164 Geometrien / 11 Texturen** konstant. Alle 24 aktiven Slots liefen wieder auf null zurück; wiederholte Ereignisse veränderten den Simulationszustand nicht. Niedrige Qualität verwendete maximal acht Slots, null Partikel und null Antriebsfahnen. Initial wurden 120 Draw Calls / 47.133 Dreiecke statt vorher 111 / 55.907 gemessen; die bewusst aktive Rampenmission lag bei 189 / 47.757. Diese Einzelbilder sind keine Worst-Case-Garantie.

## Ehrliche Bewertung

Die neuen Silhouetten und die gemeinsamen Metall-/Panzerflächen unterscheiden die Technologie sichtbarer von klassischem Militär. Die Bodenkonturen bleiben gut erkennbar; die Karte wirkt durch entfernte Standfahrzeuge ruhiger. Kurze Impulse zeigen Ankunft und Übernahme, ohne Nachbarfelder zu überstrahlen. Mobile bleiben Details kleiner, profitieren aber von wenigen klaren Hauptformen.

Die Modelle sind weiterhin prozedural gestaltete Prototyp-Assets. Vor allem Materialmikrodetails, die Feinabstimmung der Effekte und die abwechslungsreiche Oberflächenbehandlung erreichen noch nicht die Produktionsqualität von Tacticus. Die unveränderten Plateauoberflächen behalten ihre erkennbare Hexstruktur. Die 60-FPS-Zielmarke auf echter Mobilhardware ist **nicht belegt**: Tests fanden in Chromium mit Software-Rendering und Touch-Emulation statt; Android, iOS/Safari und ein menschlicher Balance-Test stehen aus.
