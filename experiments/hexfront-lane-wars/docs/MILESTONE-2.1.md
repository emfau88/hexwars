# Meilenstein 2.1 – Kampagne und direkte Bedienung

Stand: 14. Oktober 2026. Entwicklung ausschließlich in `codex/lane-wars`.
Sicherung vor den Änderungen: Commit `1a40373`, Tag `codex/lane-wars-pre-m2.1`. Der Sicherungsstand enthält bereits die korrigierten Fabrikausfahrten.

**Mobile Nachbesserung:** Nach dem persönlichen Hochformat-Test wurden Fabrikverwaltung und Hinweise eingeklappt, die Frontanzeigen verkürzt und der Kameraausschnitt angepasst. [Neue Ansichten und Prüfungen](MOBILE-HUD.md).

## Spielen

**[Öffentliche M2.1-Kampagne](https://rawcdn.githack.com/emfau88/hexwars/60aaf1f6b893b3a607040571363c3fd50bb1a6e2/experiments/hexfront-lane-wars/index.html)** · [Öffentliche Bilder und Nachschubdemo](https://rawcdn.githack.com/emfau88/hexwars/60aaf1f6b893b3a607040571363c3fd50bb1a6e2/experiments/hexfront-lane-wars/m21-review.html). Laufzeitstand `60aaf1f`, ohne lokalen Server. Beim ersten Besuch gegebenenfalls **Open the page** bestätigen.

**[Lokale Kampagne](http://127.0.0.1:4181/)** · **[Bilder und Nachschubdemonstration](http://127.0.0.1:4181/m21-review.html)** · [Kampflabor](http://127.0.0.1:4181/lab.html)

Der Entwicklungsserver muss laufen. Im Hauptmenü beginnt **Kampagne starten** direkt mit Erste Front. Ein Sieg schaltet Wiesenkrieg frei. Pro Mission bleibt ein eigener lokaler Spielstand erhalten. Wiederholen ist über **Level auswählen → Neu** möglich; das Ersetzen eines vorhandenen Spielstands muss ausdrücklich bestätigt werden.

## Was umgesetzt wurde

- **Erste Front:** tatsächliche Ein-Lane-Simulation, zwei Bauplätze pro Seite, eine Drohnenfabrik. Kompakte Landschaft aus den vorhandenen Materialien, Modellen und Landschaftselementen. Kurze kontextabhängige Hinweise. Keine Richtungsauswahl.
- **Wiesenkrieg:** erhaltene Zwei-Lane-Landschaft und sämtliche M2-Mechaniken. Die beiden Startfabriken stehen auf den inneren Plätzen links und rechts des HQs. Jede der vier Fabriken behält ihre eigene Lane-Zuweisung.
- **Direkte Richtungswechsel:** 44 Pixel hohe Buttons am Gebäude und in der Karte. Kostenlos, nächste Welle; aktive Roboter bleiben unverändert. Bei vorgemerktem Wechsel zeigen Gebäude und Karte die zukünftige Richtung sowie die noch aktive Einstellung.
- **Nachschub:** Typensymbole im unteren HUD; auf die Straße ziehen oder Typ und Frontanzeige/Straße nacheinander antippen. Preis, Guthabenbedarf, Abklingzeit und Zielmarkierung sind sichtbar. In Erste Front genügt der Typ. Alle Einheiten starten tatsächlich am HQ.
- **Auftragsvorschau:** sofortiges transparentes Gebäude bei Neubau. Typ, Richtung und Aktivierungszeit stehen am Bauplatz und in der Karte. Bearbeiten/Stornieren erstattet den reservierten Betrag. Umrüstung lässt das bestehende Gebäude sichtbar und markiert den geplanten Typ. Aktivierung erfolgt an derselben gemeinsamen Wellengrenze.
- **Frontanzeigen:** beobachtete Kontaktposition, Bewegung über mehrere Sekunden, tatsächliche Gegner in HQ-Nähe, eigene anrückende Roboter und nächste Produktion. Keine Siegesprognose aus einer bloßen Einheitenmehrheit.
- **Menü und Fortsetzen:** Kampagne, Levelwahl, Kamera, Modellbewegung, Hinweise, Resume. Separater Schlüssel `hexfront-lane-wars-campaign-v1`. Simulation einschließlich Restzeit, Einheiten-IDs, Zielbindung, bezahlter Aufträge und KI-Wahrnehmung wird fortgesetzt. Keine Offline-Produktion. Menü und Tabwechsel pausieren.
- Die frühere Strategieauswahl war eine **KI-Profilwahl**. Sie ist aus dem normalen Einstieg entfernt. Missionsdefinitionen legen das Verhalten intern fest.

## Regeln und Balanceänderungen

Die Dateien `rules.js`, `simulation.js` und `scenarios.js` behalten ihre M1-Prüfsummen. Schaden, Lebenspunkte, Reichweite, Bewegung, Zielwahl und Flächenschaden der drei Robotertypen wurden **nicht verändert**.

| Wert | Erste Front | Wiesenkrieg |
|---|---:|---:|
| Lanes / Fabrikplätze je Seite | 1 / 2 | 2 / 4 |
| Bezahlte Startfabriken / Startcredits | 1 Drohne / 100 | Mech + Fernkämpfer / 200 |
| Verbleibende Credits nach Start | 0 | 0 |
| HQ-Lebenspunkte | 480 | 1.200 |
| HQ-Schaden / Intervall / Reichweite | 4 / 0,8 s / 4 | 8 / 0,8 s / 4 |
| Grundeinkommen / einmaliger Ausbau | 2/s; 80 für +1/s | identisch |
| Fabrik / Umrüstung / Nachschub | 100 / 30 / 60 | identisch |
| Produktionswelle / Nachschub-Abklingzeit | 15 s / 15 s | identisch |
| Standardisierte Ausfahrtsstrecke in Simulationswerten | 4 | 8 |
| KI-Entscheidungs-/Wahrnehmungsintervall | 7,5 s | 3,5 s |
| Reguläre KI-Umrüstung frühestens alle | 60 s | 35 s |

Erste Front besitzt weniger Produktion. Ihr schwächeres HQ ermöglicht deshalb ein kürzeres natürliches Ende. Ein zuvor gemessener Kandidat mit 6 HQ-Schaden hielt einen Testfall auch nach zwölf Minuten offen; mit 4 Schaden enden alle acht Missionsproben. Beide Fraktionen verwenden stets dieselben HQ- und Wirtschaftsregeln. Die Einstiegs-KI wartet mit der zweiten Fabrik bis mindestens Sekunde 65; das ist eine Entscheidungspause, kein Ressourcenbonus.

Die Ausfahrtszeit beträgt nun `Missionsstrecke / Robotergeschwindigkeit`. Sie ist für denselben Typ auf **jedem Bauplatz, jeder Lane, jeder Formationsposition und beiden Seiten exakt gleich**. Die Darstellung passt das Tempo auf den unterschiedlich langen Verbindungsbögen an diese gemeinsame Ankunftszeit an. Kein schnellerer strategischer Spawn für näher liegende Fabriken. Fabrik- und HQ-Einheiten münden bei Lane-Fortschritt 4 bzw. gespiegelt 26; sie können dadurch auch Angreifer am eigenen HQ erreichen. Die Ausgangsbögen bleiben ohne Umkehr und die Modelle folgen ihrer tatsächlichen Bewegungsrichtung. Dies ersetzt die bauplatzabhängigen Laufzeiten des M2-Sicherungsstands.

Die Wiesenkrieg-KI entscheidet mit 3,5 statt 2,5 Sekunden Abstand und rüstet regulär nach 35 statt 30 Sekunden um. Dadurch läuft sie weniger synchron zu identischen Gegenstrategien. Die ausgeprägte Drohnenantwort auf ungeschützte Fernkampfproduktion darf weiterhin alle 15 Sekunden erfolgen. Keine freien Einheiten, geheimen Credits oder Einsicht in gegnerische Aufträge.

## Vollständige Partien

Quellen: [Missions-/Mischungs-/Wirtschaftsaudit](m21-qa/match-audit.json), [kontrollierte späte Reaktionen](m21-qa/late-response.json).
Insgesamt wurden 55 Strategieproben ausgeführt: 49 enden durch HQ-Zerstörung, sechs bleiben innerhalb der Messgrenze ungelöst. Die höchste gemessene gleichzeitige Belegung einschließlich Ausfahrten beträgt 38 Roboter.

Die Messgrenze von 720 Sekunden beendet ausschließlich den Test, niemals die Partie. `unresolved` bleibt ein offenes Gefecht.

| Mission | Proben mit HQ-Ende | Im Zielbereich | Kürzeste / längste Partie |
|---|---:|---:|---:|
| Erste Front | 8 von 8 | 7 von 8 (2–4 min) | 3:02 / 5:54 |
| Wiesenkrieg | 8 von 8 | 7 von 8 (4–7 min) | 5:08 / 11:27 |

Diese acht Proben je Mission enthalten zwei absichtliche Profilkontrollen mit identischem reaktivem Verhalten. Es sind **sechs unterschiedliche Entscheidungsabläufe je Mission**; davon liegen fünf im Zielbereich. Das sind deterministische Strategietests, keine repräsentativen menschlichen Siegquoten.

Beispiele aus Wiesenkrieg:

| Eigene Entscheidungen | Ergebnis | Dauer | HQ Orange : Blau |
|---|---|---:|---:|
| Statische Druckproduktion, Fabriken zuerst | Niederlage | 6:12 | 0 : 1.086 |
| Statische ausgewogene Produktion, Wirtschaft zuerst | Niederlage | 5:27 | 0 : 885 |
| Reaktiv, Fabriken zuerst | Niederlage | 6:36 | 0 : 852 |
| Reaktiv, Wirtschaft zuerst | Sieg | 5:51 | 900 : 0 |

Der Wirtschaftsausbau ist nach der Laufzeitvereinheitlichung konkurrenzfähig: In diesem kontrollierten reaktiven Vergleich gewinnt der frühe Ausbau, während die Fabrikeröffnung verliert. Das beweist keine allgemeine Überlegenheit der Wirtschaft. Bei starren Produktionsplänen verlieren beide Eröffnungen weiterhin gegen die adaptive Missions-KI.

**Entscheidungen nach Minute drei:** In gepaarten Tests ist der Zustand bis 3:20 identisch. Der Gegner rüstet bei 3:00 um, sichtbar ab der Welle bei 3:15.

| Sichtbarer gegnerischer Wechsel | Ohne Antwort | Mit bezahlter Antwort bei 3:20 |
|---|---|---|
| Drohnen → Mechs | Niederlage 9:08 | Fernkämpfer: Sieg 5:51, eigenes HQ 1.200 |
| Mechs → Fernkämpfer | Niederlage 5:48 | Drohnen auf eine Lane konzentriert: Sieg 4:14, eigenes HQ 930 |
| Fernkämpfer → Drohnen | Nach 12 min ungelöst | Mechs: Sieg 8:26, eigenes HQ 1.104 |

Eine auf beide Lanes verteilte Drohnenantwort auf Fernkämpfer bleibt nach zwölf Minuten ungelöst. Damit ist **die Lane-Entscheidung zusätzlich zur Typenwahl relevant**. Aufmerksames Reagieren hat einen erkennbaren Vorteil; ob es sich für Menschen dauerhaft spannend anfühlt, braucht weitere persönliche Partien.

## Kritische Balancebefunde

- Von 20 vollständigen Vergleichen fester Produktionsmischungen enden 16 innerhalb der Messgrenze. Vier bleiben offen. Keine getestete Mischung schlägt alle anderen.
- Mechs schlagen reine Drohnenproduktion, brauchen im festen Zwei-Fronten-Vergleich aber etwa zehn Minuten. Fernkämpfer schlagen reine Mechs nach 2:51. Drohnen schlagen reine Fernkämpfer nach 7:55. Der Rollenzyklus bleibt sichtbar, seine Dauer ist stark vom Wellenzustand abhängig.
- Mech + Fernkämpfer ist konterbar: reine Fernkämpfer gewinnen den getesteten Vergleich nach 4:54. Eine starre Drohnenmischung erzwingt dagegen nur ein langes offenes Gefecht. Der aus Duellen bekannte Drohnenkonter ist also kein allgemeines Rezept für laufende Partien.
- Überlebende sammeln sich weiter zwischen Wellen. Es gibt weder Bevölkerungssperre noch automatisches Löschen. Die Protokolle enthalten Spitzenbelegung und Minutenstände; lang laufende Patts bleiben ein Leistungs- und Balanceprüfpunkt.
- HQ-Verteidigung verlängert manche Partien deutlich. Im kontrollierten Wirtschaftsszenario ohne Nachschub steigt die Dauer von 4:18 bei 6 HQ-Schaden über 5:33 bei 8 auf 7:03 bei 12. Wiesenkrieg bleibt bei 8.
- Nachschub hilft nur gezielt. In einer Fabrikeröffnung verlängert er das Überleben von 3:15 auf 3:33. In einem anderen starren Wirtschaftsplan verkürzt blindes Nachbestellen die Partie von 5:33 auf 3:21, weil es spätere Anpassungen verdrängt. Es gibt deshalb keine automatische Nachschubwiederholung.
- Die KI bleibt eine Heuristik. Ihre Gegenproduktion kann überreagieren; sie plant keine längerfristigen Täuschungen. Level 1 ist zugänglicher, aber nicht geschenkt.
- Einzelne lange Partien und stationäre Fronten bestehen fort. Es wurde bewusst kein künstlicher Siegermechanismus eingebaut.
- Die kompakte Smartphone-Gesamtansicht zeigt Roboter kleiner als Desktop. Zoom, Verschieben und Typbeschriftungen helfen. Der Fernkämpfer ist weiterhin das vorhandene Platzhaltermodell, der Mech besitzt kein vollständiges Lauf-Rig.

## Technische Prüfung

- **59 browserunabhängige Tests bestanden:** M1-Kampfregeln, bestehende M2-Wirtschaft/Wellen, Ein-/Zwei-Lane-Topologie, gleiche Ausfahrtszeiten, Richtung und Übergang, Speichern/Fortsetzen einschließlich KI, Fraktionssymmetrie, Auftragskorrektur, Freischaltung und späte Reaktion.
- **Browser-Abnahme bestanden:** Maus-Drag auf die tatsächliche Straße, Tap über Frontanzeige und Straße, echte Touch-Drag-Ereignisse, Bauvorschau/Storno/Umrüstung, kostenlose Richtung, exakte Speicherwiederaufnahme, Freischaltung und vier vollständige Browser-/Headless-identische Partien (je Mission Sieg und Niederlage). [Browserbericht](m21-qa/browser-results.json).
- **14 Laborprüfungen, 12 M1.5-Grafikprüfungen und 12 Ausfahrtskonfigurationen mit 612 Ausrichtungsproben bestanden**, ohne Browserfehler: [Labor](m21-qa/regression-lab.json), [M1.5](m21-qa/regression-m15.json), [Ausfahrten](m21-qa/regression-exits.json).
- **Eigenständiger Build bestanden:** derselbe vollständige Desktop-/Touch-Ablauf gegen `/dist/`, einschließlich 1440×960, 1100×750 und 390×844 sowie vier vollständiger Partien. [Buildbericht](m21-qa/production/browser-results.json).
- Die Nachschubaufnahme prüft zusätzlich den echten Animations-/Spielzeitablauf und Pause. Die alten gelegentlichen Modell-Request-Abbrüche traten nach vollständigem Einlesen und Wiederverwenden der GLB- und Farn-Quelldaten in den erfolgreichen Abnahmeläufen nicht mehr auf.
- Prüfungen verwenden Chromium mit Desktop-Viewport und emulierter Touch-Eingabe. Sie sind keine Tests auf einem physischen Smartphone und keine FPS-Zusage.
- M1-Kampflabor und M1.5-Grafikdemo bleiben eigenständig erreichbar. Keine zusätzlichen Laufzeitabhängigkeiten, keine Änderungen an anderen Spielvarianten, kein Merge nach main.

Die öffentliche Vorschau wurde nach dem Push ebenfalls im Browser geprüft: vollständiger Sieg in Erste Front, Freischaltung und Start von Wiesenkrieg, kostenloser Gebäuderichtungswechsel und bezahlter Nachschub. Keine Browserfehler. [Öffentliches Prüfprotokoll](m21-qa/public-preview.json).

## Reproduzieren

```powershell
npm test
npm run audit:campaign
npm run audit:campaign-late
npm run test:match
npm run test:browser
npm run test:visual
npm run test:exits
npm run build
```

Die ersten drei Befehle laufen ohne Browser. Browserprüfungen benötigen den Server auf Port 4181 sowie die bereits bestehende Playwright-Entwicklungsabhängigkeit. `MATCH_URL` kann auf `http://127.0.0.1:4181/dist/` zeigen. Die ursprünglichen M2-Auditdateien bleiben historische Belege und werden nicht als aktuelle Kampagnenwerte ausgegeben.
