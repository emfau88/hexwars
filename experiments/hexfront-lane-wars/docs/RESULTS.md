# Kampflabor — Ergebnisbericht Meilenstein 1

Stand: 14. Oktober 2026. Dies ist ein abgeschlossenes Kampflabor, noch keine vollständige Partie und keine abschließende Spielbalance.

## Umgesetzt

- Individuelle Roboter mit Position, HP, Waffenreichweite, Ziel, Aufladezeit und Feuerintervall.
- Feste 50-ms-Schritte; gemeinsame Zustandsbasis und gleichzeitige Trefferverrechnung beider Fraktionen.
- Lokales seitliches Annähern, weiche Abstände zwischen Verbündeten und keine harten Eigenblockaden. Fernkämpfer schießen durch eigene Fronten.
- Stabile Zielbindung; bei Verlust oder Verlassen der Reichweite neuer nächster gültiger Gegner derselben Lane.
- Begrenzter Mech-Flächenschaden, kein Übertragen von Einzelschuss-Übertreffern.
- Browserunabhängige Node-Simulation und Browseransicht mit genau derselben Simulation.
- Einfache 3D-Platzhalter mit Schweben, Mech-Beinschritten, Waffenrückstoß, Schüssen, Trefferblitzen, Zerstörungen und Lebensleisten.
- Vorbereitete und eigene Gefechte, Seitenwechsel, drei Startabstände, Pause, Einzelschritte, Zeitraffer, Zoom, Reichweiten und Einheiteninspektion.

## Aktueller Testsatz

| Wert | Drohne | Mech | Fernkämpfer |
|---|---:|---:|---:|
| Roboter pro Produktionsverband | 3 | 1 | 1 |
| HP | 24 | 120 | 40 |
| Haupttreffer | 6 | 10 | 45 |
| Feuerintervall | 0,6 s | 1,2 s | 2,4 s |
| Reichweite | 1,1 | 1,6 | 4,0 |
| Geschwindigkeit | 1,6/s | 0,9/s | 1,0/s |
| Erstes Anvisieren | 0,1 s | 0,2 s | 0,35 s |
| Flächentreffer | — | Je 7 Schaden, höchstens zwei zusätzliche Ziele in Radius 0,8 | — |

Gegenüber GDD v0.1 wurden Mech-HP von 140 auf 120 und Fernkampfschaden von 50 auf 45 reduziert. Es wurden keine Typenboni, Spezialfähigkeiten oder anderen Gameplay-Systeme ergänzt. Nachfolgende Schüsse halten das angegebene Intervall exakt ein; die Zielaufnahme verlängert nicht jeden einzelnen Feuerzyklus zusätzlich.

## Konkrete Standardgefechte

Startabstand 12, seitliche Staffelung 0,72. Angaben beziehen sich auf eine einmalige Begegnung, nicht auf die Matchdauer.

| Gefecht | Sieger | Dauer | Überlebende des Siegers |
|---|---|---:|---|
| 3 Drohnen gegen 1 Fernkämpfer | Drohnen | 7,45 s | 1 Drohne, 24 HP |
| 1 Mech gegen 3 Drohnen | Mech | 9,20 s | 1 Mech, 12 HP |
| 1 Fernkämpfer gegen 1 Mech | Fernkämpfer | 9,40 s | 1 Fernkämpfer, 20 HP |
| 12 Drohnen gegen 2 Mechs + 2 Fernkämpfer | Drohnen | 9,10 s | 8 Drohnen, zusammen 133 HP |
| 4 Mechs gegen 12 Drohnen | Mechs | 8,90 s | 4 Mechs, zusammen 276 HP |
| Gespiegelter Aufbau: 6 Drohnen + 1 Mech + 1 Fernkämpfer je Seite | Unentschieden | 12,85 s | Keine |

Der Schwarmkonter gegen 2 Mechs + 2 Fernkämpfer funktioniert außerdem bei Startabständen 6 und 18 mit normaler Staffelung. Gegen die besonders starke Mischung aus 3 Mechs + 1 Fernkämpfer gewinnt im Standardaufbau 1 Mech + 3 Fernkämpfer. Auch dieser Vergleich ist im Browser auswählbar.

## Breiterer Vergleich

`scripts/balance.mjs` vergleicht alle 15 Zusammensetzungen mit insgesamt vier Produktionsverbänden gegen alle 15 Gegenspieler, jeweils bei Abständen 6/12/18 und Staffelungen 0,60/0,72/0,85. Das sind 2.025 berechnete Gefechte einschließlich Spiegel- und Seitenvergleichsfällen, keine 2.025 menschlichen Spieltests.

- Keine abweichenden gespiegelten Ergebnisse: Sieger, Dauer, Anzahl und HP der Überlebenden stimmen beim Seitenwechsel überein.
- Kein ungelöster Kampf innerhalb des 90-Sekunden-Messbudgets.
- Beobachtete Gefechtsdauer: 2,25 bis 24,75 Sekunden.
- In keiner der neun Anordnungen gewinnt eine Zusammensetzung gegen alle 14 anderen.

Bei Standardabstand und Standardstaffelung erzielt 2 Mechs + 2 Fernkämpfer gegen die 14 anderen Zusammensetzungen 8 Siege, 5 Niederlagen und 1 Unentschieden. Der Aufbau ist damit klar konterbar.

**Noch auffällig stark:** 3 Mechs + 1 Fernkämpfer erzielt 12 Siege, 1 Niederlage und 1 Unentschieden. Reine Drohnenproduktion erzielt 12 Siege und 2 Niederlagen. Einheitenrollen sind nachgewiesen, eine breit ausgewogene Vielfalt der Mischungen jedoch noch nicht. Ein hoher Sieganteil in dieser gleich gewichteten Testmatrix ist kein Nachweis einer dominanten Strategie im späteren Zwei-Lane-Spiel; er ist ein konkreter Balance-Prüfpunkt. Die nächste Phase darf diese Auffälligkeit nicht als erledigt betrachten.

Die Anordnung und Ankunftszeit beeinflussen das Ergebnis. Konter sind keine garantierten Typenvorteile. Eine unveränderte Standardmischung gewinnt in diesen Tests nicht gegen alles.

## Technische Verifikation

- 22 gezielte Logiktests: Rollen, Durchgang an eigenen Fernkämpfern, freie Schussbahn, Reichweite, Zielbindung/-wechsel, Lane-Trennung, Übertreffer, Flächenlimit, simultaner Tod, Feuerintervall, seitliche Annäherung, verschiedene Frame-Zerlegungen, Geschwindigkeitsgrenzen, interne Array-Reihenfolge, Spiegelung und Konter.
- Ein bei der breiten Prüfung entdeckter Gleitkomma-Grenzfall beim Eintritt in die seitliche Annäherung wurde mit symmetrischem Grenzvergleich und eigenem Regressionstest behoben.
- Browserprüfung: Laden der 3D-Szene, Start/Pause/Neustart/Einzelschritt, Reichweiten, Einheiteninspektion, Seitenwechsel, eigener Aufbau und geänderter Startabstand. Alle vorbereiteten Browsergefechte werden mit Node hinsichtlich vollständiger Zusammenfassung verglichen.
- Browser-Screenshots und das tatsächliche Prüfprotokoll liegen unter `qa/`; Rechenergebnisse in `balance-results.json`.

## Wirtschaft und freigegebene GDD-Änderungen

Automatische HQ-Überlastung und das feste Matchende sind gestrichen. Die vier späteren Fabriken sind sichtbare 3D-Gebäude mit eigenen Ausfahrten. Die frühere maximale Einheitenzahl von 840 ist ohne festes Matchende keine gültige Obergrenze mehr; langfristiges Armeewachstum bleibt offen.

Der bisherige 120-Credit-Wirtschaftsausbau verursacht bei ansonsten sofortigem Ausbau fünf fehlende frühe Fabrikverbände. Bei Minute fünf besitzt er nur 120 Credits mehr als direkter Fabrikausbau. Ein reiner Blick auf die zweiminütige Amortisation war deshalb unzureichend.

Als **unverbindlicher Vergleichskandidat** steht 80 Credits für +1 Credit/s im GDD: zwei fehlende frühe Verbände, finanzieller Gleichstand bei Minute zwei und 180 zusätzliche Credits bei Minute fünf. Das macht ihn prüfenswert, beweist aber keine Konkurrenzfähigkeit unter gegnerischem Druck. Die Rechnung enthält keine Kämpfe, Soforttruppkäufe oder Umrüstungen. Wirtschaft ist im Labor nicht implementiert; sie wird erst in einem späteren freigegebenen Meilenstein gespielt und balanciert.

## Grenzen und nächster Entscheidungspunkt

Nicht implementiert: Fabriken, Wellen, Einkommen, Sofortnachschub als Spieleraktion, KI, HQs, vollständige Karte oder natürliches Matchende. Die sichtbaren Roboter sind Platzhalter. Das vorhandene echte Mech-GLB besitzt weiterhin kein verwendbares Rig; die Fernkampfeinheit benötigt weiterhin ein geeignetes Modell.

Die Simulation ist deterministisch und ohne Browser prüfbar. Die Vergleiche belegen weder eine Matchdauer von vier bis sieben Minuten noch eine ausreichend konkurrenzfähige Wirtschaft oder geringe Einheitenzahlen bei dauerhaftem Nachschub. Keine automatische Endregel, Produktionssperre oder weitere Mechanik wurde zur Lösung dieser offenen Fragen ergänzt.

Meilenstein 1 endet hier. Vor dem nächsten Meilenstein sollten die Gefechte angesehen und insbesondere die starken schweren Mischungen sowie die Lesbarkeit des Schwarms bewertet werden.
