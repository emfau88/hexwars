# Wirtschaft, feste Truppenzahlen und taktische Hinweise

Stand: 12.10.2026. Isolierter Experiment-Branch `experiment/hexfront-3d-diorama`. Die frühere Fassung ist zusätzlich lokal unter `snapshot/hexfront-before-economy-a1ffaa9` gesichert (Commit `a1ffaa93993797c7b651cb0d310bc4f3faa7e89e`). Die ursprüngliche Wirtschaft bleibt im **gleichen neuen Build** spielbar.

## Zwei vergleichbare Varianten

- Standard: `hq-centralized`, ausschließlich das eigene, noch kontrollierte HQ produziert.
- Vergleich: `legacy-local`, über `?economy=legacy-local` an die Spiel-URL angehängt. Lokal: http://127.0.0.1:4174/?economy=legacy-local. Kein neuer Menümodus. Die Einstellung bleibt bei Neustart erhalten; ungültige URL-Werte fallen auf den Standard zurück.
- `ECONOMY_MODE` in `src/economy.js` ist die zentrale Entwicklungsvorgabe. `new Battle({economyMode:'legacy-local'})` hält alte Regressionstests explizit auf der bisherigen Logik.

Drohnen, Topografie, 37 Sektoren, vier legale Rampenkanten, Art, Kamerawinkel und Framing, Transportzeit **1,1 s/Hex**, Kampf, Effekte und KI-Entscheidungsfunktion sind unverändert. Keine neuen Assets oder Lizenzänderungen. Produktions-QA bleibt deaktiviert.

## Produktion und Versorgung

```js
const firstTen = Math.min(connectedFields, 10);
const additional = Math.max(0, connectedFields - 10);
const baseRate = Math.min(0.95, 0.48 + firstTen * 0.03 + additional * 0.015);
const hqRate = baseRate * (relayConnected ? 1.20 : 1);
```

`connectedFields` zählt **ohne HQ**, einschließlich eines verbundenen Relais. Eine Breitensuche folgt ausschließlich vollständig eigenen, mit `traversable` begehbaren Nachbarn. Unpassierbare Höhenkanten leiten keine Versorgung. Besitzänderungen invalidieren den Versorgungscache unmittelbar; Unterbrechungen und Rückeroberungen wirken ab dem nächsten Produktionstakt. Beide Seiten verwenden dieselbe Funktion.

| Verbundene Felder ohne HQ | Ohne Relais | Mit verbundenem Relais |
|---:|---:|---:|
| 0 | 0,48/s | – |
| 2 (Start) | 0,54/s | – |
| 10 | 0,78/s | 0,936/s |
| 12 | 0,81/s | 0,972/s |
| Ab 22 | 0,95/s | 1,14/s |

Der 20-%-Bonus wird **nach** dem 0,95er-Cap angewendet. Das verbundene Relais produziert selbst nichts. Normale Garnisonen behalten ihre Resttruppen, wachsen aber nicht. Ein isoliertes Feld bleibt bedienbar und kann kämpfen, trägt jedoch nichts zur HQ-Produktion bei.

Der bisherige Einheiten-Cap **99** bleibt. Nur Wachstum hält an; eingehende Verstärkung kann weiter über 99 konzentriert werden und wird nicht gelöscht. Nach dem Versenden setzt Wachstum wieder ein. Das HUD meldet dann `HQ +0,00/s · voll`; die HQ-Auswahl zeigt aktuelle Truppen/99 und den Produktionsstopp. Ohne Cap-Stopp zeigt das HUD die aktuelle Rate, auf zwei Stellen gerundet; intern wird ungerundet gerechnet.

Die alte Variante bleibt exakt: HQ 0,476/s, Relais 0,252/s, jedes normale Feld 0,0525/s, jeweils ×1,30 bei eigenem Relaisbesitz, auch ohne Verbindung. Einheitenlimit und Verstärkungsverhalten sind gleich.

**Wichtiger Vergleichseffekt:** Zentralisierung ändert nicht nur den Produktionsort. Schon zum Start beträgt der Gesamtnachschub 0,54/s statt 0,581/s. Bei zehn normalen Zusatzfeldern ohne Relais sind es 0,78/s statt 1,001/s. Die vorgeschlagene Formel dämpft damit auch das spätere Wachstum. Die Werte wurden bewusst nicht nach einzelnen Bot-Siegen nachjustiert.

## Reproduzierbarer Strategievergleich

`node tests/economy-comparison.mjs` erzeugt [comparison.json](economy/comparison.json). 62 Läufe: zwei Modi, fünf aktive Entscheidungsregeln mit 5/8/12-s-Rhythmus und erstem Entscheid bei 5/12 s, plus je eine Untätigkeit. Deterministische 50-ms-Schritte; gleiche Karte, Starttruppen, KI und erlaubte 50-%/Alle-minus-eins-Befehle. Abbruch bei 600 s zählt als **unentschieden/offen**, nicht als Sieg. Kein Umschreiben des Startzustands und keine kostenlosen Befehle.

| Variante | Strategie | Läufe | Siege/Niederlagen/offen | Ø Dauer s* | Ø Befehle Spieler | Ø Befehle KI |
|---|---|---:|---:|---:|---:|---:|
| Alt | Gemischt | 6 | 2/4/0 | 211.9 | 27.2 | 32.5 |
| Alt | Nur HQ | 6 | 0/6/0 | 223.1 | 25.5 | 34.5 |
| Alt | Expansion | 6 | 1/5/0 | 254.4 | 36.8 | 39.5 |
| Alt | Relais zuerst | 6 | 1/5/0 | 234.8 | 31.0 | 35.8 |
| Alt | Bis 80 ansparen | 6 | 0/6/0 | 270.9 | 2.8 | 42.0 |
| Alt | Untätig | 1 | 0/1/0 | 257.6 | 0.0 | 40.0 |
| Zentral | Gemischt | 6 | 3/3/0 | 252.8 | 32.5 | 37.3 |
| Zentral | Nur HQ | 6 | 0/6/0 | 264.7 | 35.2 | 41.0 |
| Zentral | Expansion | 6 | 1/5/0 | 249.2 | 33.8 | 38.5 |
| Zentral | Relais zuerst | 6 | 1/4/1 | 349.2 | 47.7 | 53.3 |
| Zentral | Bis 80 ansparen | 6 | 0/6/0 | 332.6 | 3.8 | 51.8 |
| Zentral | Untätig | 1 | 0/1/0 | 276.4 | 0.0 | 43.0 |

*Die Tabellenmittel enthalten bei einem offenen Lauf dessen 600-s-Beobachtungsgrenze. Die Profilregeln stehen in [economy-strategies.mjs](../tests/economy-strategies.mjs). „Gemischt“ benutzt denselben vorhandenen taktischen Planer wie die KI, übersetzt dessen Ausgabe in die zwei regulären Spieleranteile. Das ist kein menschlicher Spieler und kein Nachweis minimal notwendiger Befehle.*

Über alle **30 aktiven Läufe je Variante**: Alt 4 Siege/26 Niederlagen, zentral 5 Siege/24 Niederlagen/1 offen. Mittel der beendeten Partien: **239,0 s alt, 279,0 s zentral**. Mittel tatsächlich ausgeführter Spielerbefehle über alle aktiven Läufe: **24,7 alt, 30,6 zentral**. Die Bot-Befehlszahl sinkt also nicht. Das Ziel „weniger Eingaben“ ist durch diese Tests **nicht nachgewiesen**.

### Ein nachvollziehbarer Verlauf

Gemischte Strategie, erster Befehl nach 5 s, anschließend etwa alle 5 s:

| Zeitpunkt | Alt: Orange/Blau gesamt | Zentral: Orange/Blau gesamt | Alt: eigene Nebengarnisonen ≥5 | Zentral: eigene Nebengarnisonen ≥5 |
|---|---:|---:|---:|---:|
| 30 s | 58/54 | 55/52 | 3 | 3 |
| 60,05 s | 66/41 | 44/33 | 0 | 2 |
| 120,05 s | 97/31 | 50/24 | 5 | 2 |
| 150,05 s | 134/30 | 62/24 | 7 | 2 |

Alt gewinnt bei 167,10 s mit 33 Befehlen, zentral bei 187,10 s mit 37. Am Ende stehen acht bzw. eine eigene Nebengarnison mit mindestens fünf Einheiten. Das zeigt weniger im Hinterland angesammelte Einheiten in **diesem** Verlauf, aber noch keine insgesamt angenehmere Bedienung. Für alle anderen Verläufe enthält JSON Stärken, Gebietsbesitz, verbundenen Besitz, HQ-Rate, HQ-Bestand und Nebengarnisonen alle 15 s.

### Expansion, Relais, Engpässe und HQ-Ansammlungen

- Frühe legale Eroberung steigert zentrale Produktion sofort um 0,03/s (ab Feld 11: 0,015/s, mit Relais ×1,2). Eine bloß angrenzende Plateauzelle hinter einer Felswand zählt nicht. Verbindungsverlust reduziert auch den Wert der dahinterliegenden Felder.
- In allen 30 aktiven zentralen Läufen wurde mindestens zeitweise eigenes Gebiet abgeschnitten. Das Relais ist daher kein voraussetzungsloser Dauerbonus. Im gemischten 5-s-Sieg war es 148,15 s verbunden und eigenes Gebiet insgesamt 32,05 s teilweise abgeschnitten.
- Beide Rampen bleiben spielentscheidende Zugänge: über die Testserie nutzte auch die blaue KI **alle vier** Rampenkanten. Direkte Felswandkanten wurden nie als Bewegungsroute verwendet. Gezielte Tests prüfen beide Rampen in beide Richtungen.
- „Relais zuerst“ gewinnt zentral nur 1/6 und besitzt einen offenen 600-s-Lauf. Der Bonus ist in dieser Stichprobe kein automatischer Sieg; langsame oder festgefahrene Partien bleiben möglich.
- „Nur HQ“ verliert **6/6 in beiden Modi**; „Ansparen bis 80, dann nur HQ“ ebenfalls. Eine dominante HQ-only-Strategie wurde nicht beobachtet. Das ist kein Beweis gegen bessere menschliche HQ-Strategien.
- Zentral erreicht unter aktivem Spiel nur **1/30** Lauf den Cap, innerhalb der Expansionsgruppe insgesamt 20,60 s. Untätigkeit verbringt 160,85 s am Cap und verliert bei 276,45 s. Hohe Reserve ist somit keine automatische Sicherheit. Kein belegter Grund, den 99er-Cap zu erhöhen.

### KI-Entscheidung

Die bestehende KI bleibt unverändert: Sie sendet bereits HQ-Reserven, konzentriert Fronttruppen, bewertet Rampen/Höhen und priorisiert das Relais; das eigene HQ behält bei der Planung zehn Truppen. In zentralen aktiven Läufen erteilte Blau 9–42 HQ-Befehle und griff in allen 30 Läufen das Relais an. Sie gewinnt auch ohne lokale Produktion zuverlässig gegen Untätigkeit. Ein gezielter, gespiegelter Verbindungstest belegt die Rückeroberung der fehlenden Rampe zum bereits eigenen Relais.

**Grenze:** Der Planer bewertet den exakten wirtschaftlichen Wert eines Schnitts oder einer Rückverbindung nicht explizit. Er plant auch nicht mehrere zukünftige Gegenangriffe zur HQ-Verteidigung. Dass er eine Verbindung reparieren kann, garantiert keine optimale Versorgungsstrategie. Für diesen Vergleich wurde kein Bonus oder neuer KI-Planer ergänzt.

## Feste Zahlen-Pills und Eingabe

Alle 37 Zahlen sind jederzeit gerendert, einschließlich neutraler Felder. Ihre Anker sind exakt `(cell.x, surfaceHeight(cells, cell, cell.x, cell.z), cell.z)` in der vorhandenen Kameraprojektion. Es gibt **keine** Ausweichpositionen, Leader-Linien, Rand-Clamps oder selektiv versteckten Garnisonen mehr. Beim Zoomen aus dem Bild geschobene Felder werden nur am Kartenviewport abgeschnitten; durch Verschieben/Reset kommen ihre Zahlen wieder ins Bild.

Die sichtbare Pill ist mindestens 28 × 22 px, Schrift 13 px/650, dunkler transparenter Grund, helle Zahl, schmale orange/blaue/cremefarbene Umrandung. Die tatsächliche Zielgröße beträgt 38 × 38 px Desktop und **44 × 44 px Mobile**, auch bei einstelligen Zahlen. HQ und Relais behalten ihr kleines Typzeichen; normale Felder tragen nur die Zahl. Der temporäre Ziehhinweis sucht freie Stellen, ohne Zahlen zu versetzen, und berücksichtigt dabei die während einer Geste größer werdende Befehlsleiste. Gibt es im vergrößerten Ausschnitt keinen freien Platz, entfällt nur dieser redundante Zusatzhinweis; die Truppenstärke und der Loslassen-Befehl bleiben im Befehlsfeld. Bei überlappenden unsichtbaren Zielbereichen zählt die nächste Feldmitte; eine sichtbar getroffene Pill hat Vorrang. Dadurch entscheidet nicht die zufällige DOM-Reihenfolge.

Auf 320 × 568 ist die Übersicht naturgemäß dicht. Größere Garnisonszahlen und die flachere Dioramaansicht können sich bei Übersicht überlagern. Die Positionen werden trotzdem nicht verfälscht; vorhandenes +/−, Pinch, Navigation und Reset bleiben der vorgesehene Weg für Detailbedienung. Eine 44-px-Hitfläche ist keine Garantie für 44 px Abstand zwischen Nachbarzielen. Gemessen: Im 320er-Taktik-Standardbild keine überlappenden sichtbaren Pill-Rechtecke; in der flacheren 55°-Übersicht 37 sich schneidende Rechteckpaare, nach zwei Zoomschritten noch drei. Mit höherer Fußzeile und dreistelligem Testwert gab es auch bei 70° kleine Rechtecküberschneidungen. Das ist eine verbleibende Grenze der festen Zentrierung; Taktik plus Detailzoom bleibt für präzise Befehle vorzuziehen. Nach zwei Zoomschritten waren auch in der 320er-Angriffsszene keine Pill-Rechtecküberschneidungen mehr vorhanden: [Detailbild](economy/320-detail.png), [abschließender Bild-/Projektionslauf](economy/screens-report.json).

## Taktische Rückmeldung

`reachability` fragt dieselbe `game.path` ab wie der Befehl: direkter Nachbar = helle Innenkontur, Weg über eigene Zwischenfelder = schwächere Kontur, kein Weg = keine positive Kontur. Ein Nachbar hinter einer Felswand kann als **Fernziel** markiert sein, wenn ein tatsächlicher Umweg über eigene Felder existiert; die Weglinie zeigt dann diesen Umweg. Es gibt keine geschätzte zweite Navigation.

Ungültige Felswandbefehle senden nichts und melden kurz rot „Felswand – Aufstieg benutzen“. Das betroffene Zielfeld blinkt bei eindeutiger Ziel-ID kurz; anschließend bleibt kein rotes Warnraster stehen. Eine gültige neue Zielwahl entfernt die alte Fehlermeldung.

Angriffsprognosen rufen unverändert `forecast` mit dem **letzten Routennachbarn** auf. Sie zeigen sendbare Truppen, aufgerundete Verteidiger, bergauf +30 % Abwehr, bergab +15 % Angriff und HQ +20 % Abwehr. Nur der größere Verteidigungsbonus gilt; ein bergab angegriffenes HQ kann zusätzlich den Angriffsbonus anzeigen. „Vorteil/Unterlegen“ ist die aktuelle Berechnung mit ungerundeten Werten, keine Ankunftsgarantie. Verstärkungen während des Transports bleiben relevant.

Die Feldauswahl zeigt Typ/Höhe und Versorgung; das HQ zeigt Verbindungszahl, Relaisbonus und Bestand/Cap. Der kleine Nachschubwert steht ständig neben den vorhandenen Kameratasten. Das kompakte Match-HUD, Maus-/Touchziehen und Klick-/Tippbefehle bleiben erhalten.

## Bilder und Nachweise

Vorher und Nachher: gleiche Viewports, gleiche Taktikansicht und Aufnahme nach 5,05 s ohne Befehle. In der neuen Wirtschaft ändern sich intern die Nachkommastellen der Truppen; gerundete Startwerte bleiben hier gleich. Kamera und Framingformel sind unverändert. Die kontextabhängige Fußzeile reserviert wie bisher ihren tatsächlichen Platz.

| Ansicht | Vorher | Nachher |
|---|---|---|
| Desktop 1440 × 900, laufend | [Bild](economy/1440-before-running.png) | [Bild](economy/1440-after-running.png) |
| Desktop, HQ ausgewählt | [Bild](economy/1440-before-selection.png) | [Bild](economy/1440-after-selection.png) |
| Mobile 390 × 844, laufend | [Bild](economy/390-before-running.png) | [Bild](economy/390-after-running.png) |
| Mobile, HQ ausgewählt | [Bild](economy/390-before-selection.png) | [Bild](economy/390-after-selection.png) |
| 320 × 568, ausgewählt | [Bild](economy/320-before-selection.png) | [Bild](economy/320-after-selection.png) |

Gezielt arrangierte **Integrationstestszenen** mit echten Runtime-Koordinaten und Spielregeln: [Desktop Bergauf-Prognose](economy/1440-uphill-forecast.png), [Mobile Rampe](economy/390-ramp-selected.png), [Mobile Felswand](economy/390-ramp-blocked.png), [Mobile Prognose](economy/390-uphill-forecast.png), [kleines Display Prognose](economy/320-uphill-forecast.png). Besitz und Garnisonsgrößen wurden hier im Test gesetzt, darunter ein 120er-HQ zur Prüfung dreistelliger Werte. Diese Bilder sind **kein Nachweis einer regulär erspielten Partie**. Die separaten vollständigen Partien beginnen dagegen unverändert und senden ausschließlich native UI-Befehle.

[Baseline-Bericht](economy/before-report.json), [Eingabe-/Projektionsbericht](economy/after-report.json), [Wirtschaftssimulation](economy/comparison.json). Die vorherige Simulationsmessung [before-ai.json](economy/before-ai.json) bleibt als Kontrollpunkt erhalten; da sich kein notwendiger KI-Eingriff ergab, ist dies kein Vergleich zweier KI-Versionen.

## Prüfergebnisse

- **32 Logik-, Kamera-, Wirtschafts-, Kampf- und Bewegungstests bestanden** (`npm test`). Darunter echte Eroberung mit sofortiger Ratenänderung, Relaisverlust/Schnitt/Rückverbindung, beide Fraktionen, Wachstum nur am HQ, Cap/Verstärkung/Reset, beide Rampen, letzte Angriffskante und unveränderte 1,1-s-Transporte.
- **Drei Viewports** (1440 × 900, 390 × 844, 320 × 568): 37/37 echte native Mitteneingaben je Größe korrekt; 37 Werte in beiden Ansichten gerendert; maximale gemessene Abweichung zur mathematischen Projektionsmitte unter 0,001 px. Zoom, Verschieben, Reset, Höhen 0/1/2, ein-/zwei-/dreistellige Werte, Felswand-Rückmeldung, Bergauf-/Bergabprognosen und Legacy-URL bestehen. Keine horizontal überlaufende UI, Fußzeile unterhalb des Kartenviewports.
- **Desktop vollständig über Maus-Drag gespielt:** Sieg 187,10 s, 37 Spielerbefehle, 24 KI-Befehle, Quellen auf allen drei Höhen; untätige Niederlage 276,45 s / 43 KI-Befehle; Neustart, Pause, Kameras und Qualitätswechsel bestehen. Der erste anschließende Mobile-Lauf stoppte vor Matchbeginn, weil der Test den nun weiter unten stehenden Handbuch-Button ohne Scrollen anklicken wollte. Der Test scrollt den vorhandenen Dialog nun korrekt. [Unveränderter Erstbericht](economy/match-central/desktop-and-help-scroll-report.json).
- **Mobile 390 × 844 vollständig über native Touch-Drags gespielt:** derselbe Sieg bei 187,10 s / 37 Befehlen und dieselbe Niederlage bei 276,45 s; Neustart, Pause, alle drei Quellhöhen und Produktionsstart bestehen. [Vollständiger Touchbericht](economy/match-mobile/browser-report.json), [zusammengeführte Matchbefunde](economy/match-report.json).
- **Gestenregression Desktop/Touch bestanden:** direkter Ziehbefehl, genau ein Befehl pro Loslassen, 50-%-Auswahl, Klickalternative, freies Terrain-/Gebäudepicking, echte Felswand, außerhalb/auf Quelle abbrechen, Escape/Touchcancel, zweiter Finger, Hintergrund-Pan, vergrößerter Ziehbefehl und Pause. Für unbedeckte mobile HQ-Oberflächen nutzt der Test zwei reguläre Zoomschritte; die kompakte Übersicht wird über die 44-px-Zahlenziele bedient. [Gestenbericht](economy/gestures/input-report.json).
- **Legacy vollständig per Desktop-Klick gespielt:** Sieg 167,10 s / 33 Befehle, Niederlage 257,55 s; Neustart und Produktion bestehen. [Bericht](economy/match-legacy/browser-report.json).
- **Finaler Ziehhinweis:** überdeckt weder Zahlen noch die beim Ziehen vergrößerte Fußzeile; Desktop und Touch bestanden. [Bericht](economy/tip/input-report.json).
- **Produktions-Build:** 29 Dateien / 2.335.502 Bytes; `preview/` bytegleich zu `dist/`; Entwicklungs-QA deaktiviert und keine Testinjektionen ausgeliefert. [Manifest](economy/build-report.json).
- Die Baseline, finale Desktop-/Mobile-Ansichten, Rampen- und Prognosebilder wurden tatsächlich betrachtet. Die zusätzliche Informationsdichte ist sichtbar; die Spielfeldmitten bleiben zuordenbar. Kamera, Architektur, Felsen und Teamflächen sind erhalten.

Die Laufzeitmessung des Desktop-Matchtests lag im Software-Renderer bei 133,3 ms median / 150 ms P95 pro Frame (120 Draw Calls, 47.133 Dreiecke im erfassten Zustand). **Das ist kein 60-FPS-Nachweis**, sondern eine langsame Software-Testumgebung; sie erlaubt keine Übertragung auf echte Mobilgeräte. In der Mobile-Emulation wurden 66,7 ms median / 83,3 ms P95 gemessen, ebenfalls Software-Rendering. Neue Geometrie und Texturen wurden nicht hinzugefügt.

## Reproduktion und Grenzen

```sh
npm ci
npm run dev
# http://127.0.0.1:4174
# http://127.0.0.1:4174/?economy=legacy-local
npm test
node tests/economy-comparison.mjs
# Optional mit installiertem Playwright/Chromium:
node tests/economy-ui.mjs
node tests/browser.mjs --drag
npm run build
npm run preview
```

Die Tests sind deterministische Regressionen und Strategiestichproben, keine statistische Balance-Studie. Die bessere Spaßwirkung, geringerer menschlicher Eingabeaufwand, physische Android-/iOS-Bedienung, Safari und 60 FPS auf echten Smartphones bleiben unbewiesen. Die neue Variante ist absichtlich ein Vergleichsangebot. Für eine endgültige Entscheidung sollten Menschen beide URL-Varianten mit langsamer, gemischter und HQ-lastiger Spielweise vergleichen.
