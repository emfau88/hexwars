# HEXFRONT Lane Wars — GDD v0.3.1

Stand: 16. Oktober 2026. **Zentrale Front ist der freigegebene Hauptmodus.** Der neue verbindliche Umfang und seine eigenen Balancewerte stehen in der Ergänzung „Zentrale Front“ am Dokumentende. Die bisherigen Zwei-Lane-Regeln und früheren Meilensteine bleiben für die erhaltenen Varianten gültig; ihre Beschreibungen sind historisch.

## Bisherige Zwei-Lane-Grundlage (weiterhin für Wiesenkrieg)

- Mensch gegen KI, PC-first, eine spätere vollständige 1v1-Partie.
- Zwei Lanes, vier feste Fabrikplätze pro Fraktion, drei Robotertypen: Drohne, Mech, Fernkämpfer.
- Fabriken produzieren automatisch. Beide Seiten erhalten gemeinsame Verstärkungswellen alle 15 Sekunden, einschließlich einer ersten Welle bei Spielbeginn.
- Jeder sichtbare Roboter ist eine eigene Simulationseinheit mit Position, Lebenspunkten, Waffenreichweite, Ziel und Angriffsintervall. Überlebende bleiben mit ihren Restlebenspunkten bestehen.
- Keine direkte Einheitensteuerung. Bestehende Roboter wechseln ihre Lane nicht.
- Begrenzter bezahlter Sofortnachschub erscheint am eigenen Stützpunkt und läuft regulär zur Front. Keine Teleportation, keine kostenlosen Truppen.
- Umrüstung kostet Credits, gilt ab der nächsten Welle und verursacht keine zusätzliche ausgesetzte Welle. Vorhandene Roboter bleiben bestehen und blockieren die neue Produktion nicht.
- Fabriken werden später echte sichtbare 3D-Gebäude auf den vier Bauplätzen. Jede Fabrikwelle fährt sichtbar aus ihrer Ursprungsfabrik aus. Ausgangswege zur gewählten Lane dürfen keine gegenseitigen Staus erzeugen; ihre Laufzeit zählt zur tatsächlichen Ankunftszeit.
- Das HQ wird ausschließlich durch erfolgreiche Angriffe zerstört. Keine automatische HQ-Zerstörung, Überlastung, zeitabhängigen Schadensboni oder künstlichen Siegerentscheidungen.
- Vier bis sieben Minuten sind ein Matchdauer-Ziel, kein Zeitlimit.
- Keine eigenmächtigen zusätzlichen Gameplay-Systeme. Vorerst keine weiteren Einheiten, Forschung, Kontrollpunkte, frei platzierbaren Gebäude, Spezialfähigkeiten oder Multiplayer.

## Partie und Spieleraktionen (späterer Meilenstein)

In der ruhenden Aufbauansicht werden zwei Startfabriken einschließlich Typ und Lane konfiguriert. Mit Spielbeginn starten die erste Welle und das laufende Einkommen. Der Spieler kann die zwei übrigen Fabrikplätze bebauen, bestehende Fabriken umrüsten, die Lane zukünftiger Wellen ändern, einen Wirtschaftsausbau kaufen oder Sofortnachschub einsetzen. Einheiten kämpfen automatisch. Die Zerstörung eines HQs entscheidet die Partie; gleichzeitige Zerstörung ist ein Unentschieden.

Kostenpflichtige Fabrikaufträge werden beim Vormerken bezahlt und können bis zur Ausführung korrigiert oder vollständig erstattet werden. An der nächsten Wellengrenze werden die vorgemerkten Einstellungen gemeinsam übernommen, danach wird produziert. Befehle nach dieser Grenze betreffen die folgende Welle. Lane-Wechsel sind kostenlos. Die nächste eigene Welle wird je Lane sichtbar zusammengefasst. Vorgemerkte gegnerische Befehle bleiben verborgen.

## Wirtschaft: ausdrücklich noch nicht festgelegt

| Größe | Referenz / Testkandidat |
|---|---:|
| Startkapital; zwei Startfabriken | 200 Credits; je 100 |
| Zusätzliche Fabrik | 100 Credits |
| Grundeinkommen | 2 Credits/s |
| Umrüstung | 30 Credits |
| Lane-Wechsel | kostenlos |
| Sofortnachschub | 60 Credits |
| Wirtschaftsausbau v0.1, kritisch zu prüfen | 120 Credits, +1 Credit/s |
| Einfacher Vergleichskandidat v0.2 | 80 Credits, +1 Credit/s |

Keine Abschussbelohnungen, Gebietseinnahmen, Unterhaltskosten, weiteren Ressourcen oder laufenden Produktionskosten. Einkommen und Fabriken gehen bei verlorenen Gefechten nicht verloren. Der Ausbau ist einmalig. Alle Kosten und Einkommen in dieser Tabelle bleiben offen bis zum späteren Wirtschaftstest.

Die reine Amortisationszeit unterschätzt den Nachteil eines Wirtschaftsausbaus: Zusätzlich fehlen frühe Fabrikwellen. Unter idealisiertem sofortigem Kauf bei ausreichendem Guthaben, ohne Sofortnachschub oder Umrüstung und mit zwei Startfabriken ergibt sich:

| Aufbaufolge | Wirtschaft gekauft | Dritte Fabrik produziert erstmals | Vierte Fabrik produziert erstmals | Fehlende Fabrikverbände gegenüber direktem Ausbau | Finanzieller Gleichstand gegenüber direktem Ausbau |
|---|---:|---:|---:|---:|---:|
| Fabriken zuerst | — | 1:00 | 1:45 | 0 | — |
| Wirtschaft für 120, +1/s | 1:00 | 1:45 | 2:15 | 5 | 3:00 |
| Wirtschaft für 80, +1/s | 0:40 | 1:15 | 2:00 | 2 | 2:00 |

Bei Minute fünf beträgt der zusätzliche Kreditbestand gegenüber direktem Ausbau beim alten Entwurf 120, beim neuen Kandidaten 180 Credits. Das entspricht nominal zwei beziehungsweise drei Soforttrupps, ersetzt aber weder deren andere Ankunftszeit noch bereits verlorene Fronten. Der 120er-Ausbau ist deshalb als Startempfehlung zu schwach begründet. 80/+1 ist ein zu prüfender Kandidat, kein bewiesenes Gleichgewicht.

Der spätere Wirtschaftstest muss direkte Expansion und frühe Wirtschaft gegen Druck, defensiven Aufbau und adaptive Gegner vergleichen. Erfasst werden nicht nur Guthaben, sondern ausgefallene Produktionswellen, HQ-Schaden, Siege, Matchdauer und Comebacks. Der Fabrikausbau darf nicht stets die beste Eröffnung sein; Wirtschaft darf ebenso wenig ein Pflichtkauf sein. Im Kampflabor wird keine Wirtschaft implementiert.

## Fabriken und Sofortnachschub (später)

Eine Drohnenfabrik erzeugt drei Drohnen, eine Mechfabrik einen Mech und eine Fernkampffabrik einen Fernkämpfer je Welle. Alle Typen stehen von Anfang an zur Verfügung. Vier Plätze begrenzen dauerhafte Produktion, nicht die Lebensdauer existierender Roboter.

Sofortnachschub liefert für 60 Credits einen dieser drei Verbände auf die gewählte Lane. Eine eigene Abklingzeit von 15 Sekunden ab Einsatz verhindert Doppelkäufe am Wellenwechsel und erlaubt höchstens einen Einsatz innerhalb eines Wellenintervalls. Es gibt keine angesparten Ladungen oder automatische Wiederholung. Alle drei Typen sind unabhängig vom Fabrikbestand verfügbar. Der spätere Sofortnachschub verwendet einen klar sichtbaren HQ-Ausgang; reguläre Fabrikwellen kommen aus ihren jeweiligen Gebäuden.

## Kampfregeln: Umfang von Meilenstein 1

Die drei Rollen entstehen aus Anzahl, Haltbarkeit, Geschwindigkeit, Reichweite, Feuerintervall und begrenztem Flächenschaden. Keine Typenschadensboni, Rüstung, kritischen Treffer, Heilung, Ausweichwürfe oder versteckten Kampfboni.

- Drohnen: schneller Schwarm gegen ungeschützte Fernkämpfer, empfindlich gegen Mech-Flächenschaden.
- Mech: robuste Front gegen Drohnen, langsam und gegen konzentrierten Fernkampf verwundbar.
- Fernkämpfer: hoher Einzelschaden gegen schwere Ziele, lange Feuerpause und schwache eigene Haltbarkeit.
- Mech plus Fernkampf darf stark sein, muss aber bei vergleichbarer Produktionsinvestition konterbar bleiben. Eine einzelne gewinnende Demonstration beweist noch keine allgemeine Balance.

Die aktuelle ausführbare Wertetabelle steht in `../src/rules.js`; reproduzierbare Vergleiche stehen nach Abschluss in `RESULTS.md`. Änderungen bleiben innerhalb der genannten Eigenschaften und werden dokumentiert.

Einheiten behalten ein lebendes Ziel derselben Lane in Reichweite. Andernfalls wählen sie den nächsten gültigen Gegner in Waffenreichweite. Ohne erreichbaren Gegner rücken sie vor. Gleichstände werden über eine fraktionsunabhängige Formationsreihenfolge aufgelöst. Eigene Einheiten blockieren Schüsse nicht. Einzelschüsse verschwenden Übertreffer; nur der Mech trifft höchstens zwei zusätzliche nahe Ziele. Treffer beider Seiten werden aus demselben Zustand gesammelt und gemeinsam verrechnet.

Die Bewegung verwendet eine feste Längsrichtung je Lane und seitlichen Raum. Verbündete erzeugen keine harten Blockaden. Kurze Waffen können an anhaltenden Fernkämpfern vorbeiziehen. Sanfte Abstandskorrekturen begrenzen Überlagerungen und verwenden dieselben Regeln für beide Fraktionen. Keine Physikengine und keine allgemeine Wegfindung. Gegner werden nicht auf dem Weg durch ihre Front hindurch ignoriert.

Die spätere HQ-Zielwahl muss erreichbare Roboter priorisieren, aber bei deren Abwesenheit ein erreichbares HQ angreifen, auch wenn weit entfernt noch andere Gegner existieren. Das aktuelle Labor enthält noch keinen HQ-Kampf.

## Karte, HQ und KI (später, nicht Bestandteil des Labors)

Eine einzige übersichtliche Karte mit zwei zunächst gleichwertigen Routen, ungefähr 30 Längeneinheiten und 3 Einheiten nutzbarer Breite. Kein Lane-übergreifendes Schießen oder Wechseln. Die gesamte Karte ist sichtbar. Tatsächliche Laufzeiten ab den Fabrikausgängen müssen vor dem Kartenbau geprüft werden; künstliche Ausfahrtschlangen sind zu vermeiden.

HQ-Startwerte bleiben 1.200 HP, keine Heilung, eine gemeinsame Verteidigungswaffe für beide Zufahrten mit 12 Schaden, 0,8 Sekunden Intervall und 5 Reichweite. Noch nicht implementieren. Reichweite, Schaden und Haltbarkeit müssen ein natürliches Ende durch Angriffe ermöglichen; bei Patts zuerst diese Werte, Laufwege und Kampfwerte untersuchen.

Die spätere KI verwendet dieselben Ressourcen, Befehle und Informationen wie der Mensch. Drei einfache Profile (Druck, ausgeglichen, Wirtschaft), verzögerte Wahrnehmung und begrenzte Umrüstfrequenz reichen zunächst. Keine Kenntnis geheimer Aufträge und keine Ressourcenboni.

## Überlebende, Leistung und Patt-Situationen

Vorerst keine Fabrik- oder globale Bevölkerungssperre, die bezahlte Konterproduktion blockiert. Kein automatisches Entfernen alter Roboter. Da das harte Matchende gestrichen wurde, gilt die frühere rechnerische Obergrenze von 840 Robotern ausdrücklich nicht mehr. Für die vollständige Partie müssen Wachstum und Langzeitverhalten gemessen werden. Ein endlos laufendes Produktionsexperiment kann ohne Verluste unbegrenzt wachsen; dies ist ein offener Prüfpunkt, keine heimlich einzuführende Begrenzung.

Das Kampflabor erzeugt nur die einmalig gewählten Verbände. Ein Testzeitbudget beendet lediglich die Messung und meldet einen ungelösten Kampf, niemals einen künstlichen Spielsieg. Browser-Pause und Zeitraffer sind Laborwerkzeuge und keine neuen Spielmechaniken.

## Entwicklungsgrenze und Abnahme von Meilenstein 1 (abgeschlossen)

Jetzt erlaubt: browserunabhängige deterministische Simulation, drei Rollen, Bewegung, Zielauswahl, Reichweite, simultane Treffer, einfache Platzhalter, kleine Browseransicht, reproduzierbare Tests und Ergebnisbericht.

Jetzt nicht vorgesehen: Produktionswellen, Fabrik- oder Wirtschaftslogik, vollständige Karte, Gegner-KI, HQ-Endspiel, aufwendige Menüs, Asset-Konvertierung und umfangreiche grafische Ausarbeitung.

Abnahme: gleiche Regeln und gespiegelte Ergebnisse für beide Fraktionen; keine Verbündeten-Blockade; Fernkämpfer schießen hinter Frontkämpfern; Reichweiten werden eingehalten; Übertreffer und Flächenschadengrenze sind nachvollziehbar; drei Rollen haben nachweisbare Vor- und Nachteile; mindestens ein gleichwertiger Konter gegen Mech plus Fernkampf; Ergebnisse können im Browser mit derselben Simulation betrachtet werden.

Nach dem Kampflabor erfolgt eine Ergebniszusammenfassung. Der nächste Meilenstein benötigt einen neuen Auftrag.

## Freigegebene Ergänzung: Meilenstein 1.5 – Visuelle Integration

Der Folgeauftrag erlaubt die Übertragung der bestehenden M1-Simulation in eine hochwertige, eigenständig startbare Lane-Wars-Darstellung. Wichtigste Stilreferenz ist Mixed Squads; HEXFRONT 3D liefert Originalmodelle und weitere Grafikgrundlagen. Die älteren Varianten und das ursprüngliche main-Spiel bleiben unverändert.

Zwei klar lesbare, organische Wege durch eine durchgehende Wiesenlandschaft verbinden die beiden Basisbereiche. Orange liegt unten, Blau oben. Auf Nutzerwunsch dürfen die Wege länger werden: Die aktuelle Darstellung verwendet zwei gespiegelte Bögen mit jeweils 29,928 Welteinheiten Mittellinienlänge. Die Simulation behält ihre 30 Längeneinheiten. Die Querkoordinate wird zur Lesbarkeit doppelt so breit gezeichnet; Weltabstände sind deshalb keine neue Grundlage der Kampfberechnung. Felsiger Westen, offener Osten und Höhenunterschiede bewirken keine Kampfboni.

Die Spielansicht und die separat erreichbare Laboransicht importieren dieselben Dateien für Kampfregeln und Simulation. `rules.js`, `simulation.js` und die ursprünglichen Laborszenarien sind gegenüber M1 bytegleich. Drei zusätzliche Demonstrationsaufstellungen verwenden auf jeder Lane eine unveränderte Combat-Instanz. Nur ihre Anfangsformation ist großzügiger gestaffelt. Die Demonstration erzeugt einmalig Roboter; es gibt keine automatische Wiederholung oder Produktion.

Original-HQ, Hover-Bot und Mech werden einschließlich Texturen übernommen. Beide Fraktionen verwenden selektive Fraktionsfarben. Der Fernkämpfer bleibt mangels GLB ein ausdrücklich vorläufiger Silhouetten-Platzhalter. Mech-Bewegung ist vorläufige Ganzkörperbewegung, kein vollständiges Lauf-Rig. HQs und leere Bauflächen sind Darstellung ohne Lebenspunkte oder Kampflogik.

Kompaktes HUD in der bestehenden Keramikgestaltung: HQ-Status, Credits/Einkommen/Wellenfeld sowie vier Fabrikkarten als gekennzeichnete, deaktivierte Vorschau. Unimplementierte Werte erscheinen als Striche. Keine Fantasie-Credits, kein laufender Wellen-Countdown. Eigene sichtbare 3D-Fabriken und Roboter-Ausfahrten bleiben ein späterer Auftrag.

Nicht freigegeben: Wirtschaft, Produktionswellen, Fabriksteuerung, Sofortnachschub, Forschung, neue Einheitentypen, zusätzliche funktionale Gebäude, vollständiges HQ-Endspiel, Kampagnen oder Multiplayer. Ruinen und technische Requisiten sind ausschließlich Dekoration.

Abnahmebelege: echte Laufzeit-Screenshots für Übersicht, Kampf, Modelle, HUD und Mixed-Squads-Vergleich; kritische Sichtprüfung; weiter bestehende M1-Tests; identische Browser-/Headless-Ergebnisse. Bericht: `VISUAL-INTEGRATION.md`, Bildübersicht: `../review.html`.

## Freigegebene Ergänzung: Meilenstein 2 – vollständige Partie

Der neue Entwicklungsauftrag erweitert die abgeschlossene M1.5-Darstellung zur vollständig spielbaren Partie Mensch gegen KI. Die vorherigen Abschnitte zum Umfang von M1 und M1.5 dokumentieren deren damalige Grenzen; ihre Verbote von Wirtschaft und HQ-Kampf gelten nicht für den ausdrücklich freigegebenen M2-Auftrag. Das Kampflabor bleibt separat.

Implementiert werden die oben festgelegten vier Fabrikplätze, zwei konfigurierbaren Startfabriken, kontinuierliches Einkommen, einmaliger Wirtschaftsausbau, Fabrikbau und Umrüstung, kostenlose Lane-Zuweisung, gemeinsame 15-Sekunden-Wellen und bezahlter Sofortnachschub mit eigener 15-Sekunden-Abklingzeit. Alle drei bestehenden Robotertypen und ihr M1-Kampfkern bleiben unverändert. Erst echte HQ-Zerstörung beendet die Partie.

Für M2 gelten vorläufig die Tabellenwerte 200 Startcredits, 100 je Fabrik, 2 Credits/s, 30 für Umrüstung, 60 für Nachschub und der v0.2-Kandidat 80/+1 für den einmaligen Wirtschaftsausbau. Die gemeinsame HQ-Waffe wird als dokumentierte Balanceanpassung mit **8 Schaden und Reichweite 4** statt 12/5 implementiert; 1.200 HP und 0,8 Sekunden Intervall bleiben erhalten. Auswertung und offene Schwächen: [MILESTONE-2.md](MILESTONE-2.md).

Fabriken sind nun sichtbare 3D-Gebäude auf den bestehenden Basisplätzen. Produzierte Roboter verlassen ihre jeweilige Fabrik; ihre tatsächliche Ausfahrtszeit hängt von Typ, Bauplatz und gewählter Lane ab und zählt zur Ankunftszeit. Beide Fraktionen verwenden dieselben gespiegelten Wege. Der Vorplatz liegt außerhalb des Lane-Kampfes; ab dem Lane-Eingang verwendet jeder Roboter die unveränderten M1-Regeln. Sofortnachschub läuft vom sichtbaren HQ-Ausgang los. Keine Warteketten, automatische Zusatzbestellungen oder Bevölkerungssperren.

Die drei KI-Profile verwenden dieselben bezahlten Befehle und öffentliche Sicht mit 2,5 Sekunden Verzögerung. Gegnerische Credits und vorgemerkte Aufträge bleiben unbekannt. Reguläre Umrüstung erfolgt höchstens alle 30 Sekunden, eine konzentrierte Drohnenantwort auf starke ungeschützte Fernkampfproduktion höchstens alle 15 Sekunden. Das verändert nur die Entscheidungsheuristik, keine Regeln oder Ressourcen.

HUD, Fabrikkarten, HQ-Werte und Countdown zeigen echte Simulationsdaten. Die bestehende Diorama-Landschaft, Originalmodelle und Keramikgestaltung werden erhalten. Sieg, Niederlage, Unentschieden, Pause und Neustart gehören zum vollständigen Ablauf. Es gibt weiterhin keinen künstlichen Endtimer. Das Matchdauerziel bleibt 4–7 Minuten; ungelöste Messläufe gelten als offene Balancepunkte.

M2 führt keine weiteren Robotertypen, Forschung, Verteidigungsgebäude, Kontrollpunkte, Karten oder Multiplayer ein. Der Stand wird ausschließlich im Lane-Wars-Entwicklungsbranch geführt, ohne Merge nach main.

## Ausfahrtskorrektur nach dem M2-Spieltest

Die sichtbaren Fabrikwege münden nun ohne Umkehr an der vorhandenen Lane außerhalb der äußeren Gebäude, bei Fortschritt 4 beziehungsweise gespiegelt 26. Jede Einheit erreicht dort ihre korrekte Formationsposition; ihre individuelle Weglänge bestimmt die Ausfahrtszeit. Frontausrichtung und Position folgen demselben gekrümmten Weg. Die M1-Kampfregeln, Roboterwerte, Kosten und KI bleiben unverändert.

Damit ändern sich Ankunftszeiten und Begegnungen gegenüber der ursprünglichen M2-Abnahme. Deren Match- und Wirtschaftsbewertung ist historisch; die erneut gemessenen Ergebnisse und offenen Balancefragen stehen in [FACTORY-EXITS.md](FACTORY-EXITS.md).

## Freigegebene Ergänzung: Meilenstein 2.1 – Kampagneneinstieg und direkte Steuerung

Der Folgeauftrag erlaubt vor dem bestehenden Zwei-Lane-Spiel eine neue kompakte Ein-Lane-Mission. Die historischen Beschränkungen früherer Meilensteine auf genau zwei Lanes beziehungsweise keine Kampagne gelten damit nicht für M2.1.

**Level 1 – Erste Front:** eine tatsächlich simulierte Lane, zwei feste Bauplätze je Fraktion, eine vorhandene Drohnenfabrik. Alle drei Typen bleiben verfügbar. **Level 2 – Wiesenkrieg:** die bestehende Zwei-Lane-Karte mit vier Plätzen und zwei Startfabriken, nun symmetrisch links und rechts des HQs. Beide Missionen verwenden dieselbe Match-, Wirtschafts-, Wellen- und Kampfengine.

Fabrikrichtungen werden direkt am Gebäude und an der Karte kostenlos für die nächste Welle umgestellt. Keine automatische 50:50-Verteilung. Neubau zeigt sofort eine transparente 3D-Vorschau; Umrüstung markiert den geplanten Wechsel am bestehenden Gebäude. Kostenreservierung, Korrektur und Erstattung bleiben erhalten. Nachschub verwendet Drag-and-drop oder Typ-zu-Lane-Taps und läuft ausschließlich vom eigenen HQ los; 60 Credits und 15 Sekunden Abklingzeit bleiben bestehen.

Die Ausfahrtszeiten werden missionsweise standardisiert: 4 / Robotergeschwindigkeit in Erste Front, 8 / Robotergeschwindigkeit in Wiesenkrieg. Sie hängen nicht mehr von Bauplatz, Lane, Formationsposition oder Fraktion ab. Die visuellen Bögen führen ohne Umkehr an dieselben Lane-Eintritte bei Fortschritt 4/26; ihr Darstellungstempo passt sich an die einheitliche Ankunftszeit an. Das ersetzt ausdrücklich die unterschiedlichen M2-Ausfahrtszeiten.

Erste Front nutzt für beide Fraktionen 480 HQ-LP und 4 HQ-Schaden, Wiesenkrieg weiterhin 1.200/8. HQ-Intervall 0,8 s, Reichweite 4 und sämtliche M1-Roboterwerte bleiben unverändert. Die Startcredits bezahlen genau die vorhandenen Fabriken (100 bzw. 200). Alle weiteren Wirtschaftswerte entsprechen M2. Ziele: Erste Front ungefähr 2–4 Minuten, Wiesenkrieg ungefähr 4–7 Minuten; ausschließlich echte HQ-Zerstörung beendet die Partie.

KI-Profile werden intern durch die Mission festgelegt. Erste Front reagiert mit 7,5 Sekunden Wahrnehmungs-/Entscheidungsabstand, baut frühestens bei Sekunde 65 die zweite Fabrik und rüstet regulär höchstens alle 60 Sekunden um. Wiesenkrieg verwendet 3,5 Sekunden und 35 Sekunden. Die bisherige konzentrierte Drohnenantwort darf weiterhin alle 15 Sekunden erfolgen. Kosten, Produktion und Kampfregeln sind identisch zum Menschen.

Frontanzeigen beruhen auf Kontaktposition und deren Veränderung, wirklicher HQ-Nähe gegnerischer Einheiten sowie eigenen anrückenden Verstärkungen. Sie sind keine Gewinngarantie. Ein minimalistisches Menü enthält Start/Fortsetzen, Levelwahl und Einstellungen. Ein Sieg in Erste Front schaltet Wiesenkrieg frei. Getrennte lokale Missionsspielstände und explizite Neustartbestätigung verhindern versehentliches Überschreiben. Der neue Speicherschlüssel ist ausschließlich `hexfront-lane-wars-campaign-v1`.

Keine neuen Robotertypen, Forschung, Gebäudearten, Kontrollpunkte oder Multiplayer. Kampflabor und M1.5-Demo bleiben separat. Ergebnisse, Veränderungen und bekannte Grenzen: [MILESTONE-2.1.md](MILESTONE-2.1.md).


## Freigegebene Ergänzung: Zentrale Front (16. Oktober 2026)
Eine vollständige 1v1-Partie Mensch gegen KI auf einer zentralen Front wird Hauptmodus. Vier feste Fabrikplätze, zwei konfigurierbare bezahlte Startfabriken, drei bestehende Robotertypen, automatische gemeinsame Wellen, einmalige Wirtschaft, bezahlte Umrüstung und begrenzter Sofortnachschub bleiben der Kern. Erste Front, Wiesenkrieg, Kampflabor und ältere Varianten bleiben erhalten. Keine neuen Typen, Gebäudearten, Forschung, Kontrollpunkte oder Multiplayer.

Für den Hauptmodus gelten: 280 Startcredits vor Fabrikbezahlung, 120 pro Fabrik, 30 pro Umrüstung, 2 Credits/s, einmalig 80 Credits für +1,2/s; 20-Sekunden-Wellen einschließlich Welle bei Start; Nachschub 80 Credits mit 35 Sekunden Abklingzeit. HQs haben nach der Fabrikkampf-Korrektur 800 LP, Reichweite 4 und eine gemeinsame Waffe mit 2 Schaden pro Sekunde. Ausschließlich echte HQ-Zerstörung beendet die Partie, angestrebt sind ungefähr 5–8 Minuten.

Drohnen behalten M1-Werte. Der Mech verwendet 110 LP, 9 Sekundärschaden und 2,8 Reichweite, der Fernkämpfer 55 Schaden und 2,8 Sekunden Intervall; übrige Werte bleiben bestehen. Diese Profile gelten nur in Zentrale Front. Der Kampfalgorithmus ist jetzt mit Einheitenprofilen parametrisierbar; seine alte Standardausführung ist gegen die eingefrorene M1-Version pro Simulationsschritt geprüft. Die historische Aussage „simulation.js bytegleich“ gilt damit nicht mehr für die aktuelle Engine, wohl aber deren alter Kampfablauf.

Fabriken nutzen die vorhandene Architektur. Verbände treten mit symmetrisch versetzten Querpositionen in dieselbe Lane ein. Ausfahrtsdauer: 6 / Robotergeschwindigkeit, unabhängig von Platz und Fraktion. Darstellung, HUD, Spielstände und Nachschub berücksichtigen die tatsächlichen Profilwerte.

Drei erkennbare KI-Eröffnungen (Vorhut, Eisenkeil, Aufbaukommando) verwenden dieselben Ressourcen und Befehle wie der Spieler. Beobachtung alle sechs Sekunden, Gegnerwissen aus der vorherigen Beobachtung, spätere Gegenproduktion bei zwei flexibel verwendbaren Fabriken. Weder versteckte Gegneraufträge noch Bonusressourcen.

Begründungen, vollständige Partien, späte Reaktionen, technische Prüfungen und bekannte offene Balanceprobleme: [CENTRAL-FRONT.md](CENTRAL-FRONT.md). Messbudgets sind keine Endbedingungen. Die Automatiktests ersetzen keine menschliche Spielspaß-Abnahme.

## Freigegebene Korrektur: Kampf am Fabriktor und Mech-Schussabstand

Nur in **Zentrale Front** gehören produzierte Einheiten ab ihrem ersten sichtbaren Punkt vor dem Tor zur regulären Kampfsimulation. Dasselbe gilt am HQ-Ausgang für bezahlten Sofortnachschub. In Reichweite eines Gegners stoppen sie, richten sich aus und schießen nach ihrer normalen kurzen Zielerfassung. Sie können gleichzeitig beschossen, durch Flächenschaden getroffen und zerstört werden. Nach dem Gefecht setzen sie den unterbrochenen Weg fort. Der Lane-Eingang ist keine Eintrittsbedingung für Kampf mehr; Position, ID, LP, Ziel und Abklingzeit bleiben beim Übergang erhalten.

Der bestehende Basisvorplatz erhält in der Bewegung die seitliche Breite seiner Fabriktore. Die Grenze verengt sich zur Lane hin stetig. So können Angreifer auch seitliche Verteidiger erreichen. Beide Fraktionen verwenden dieselbe gespiegelte Logik. Das Kampflabor und die erhaltenen alten Missionen behalten ihre bisherigen Abläufe.

Mech-Reichweite 1,6 → **2,8**; Fernkämpfer weiterhin 4,0, Drohnen 1,1. Kein Rückwärtslaufen oder automatisches Abstandhalten: Ein Mech kann weiterhin von einem Schwarm bedrängt werden. Seine übrigen Werte bleiben unverändert. Die deutlich früher wirksamen Produktionsverteidiger erfordern als Balanceausgleich HQ-LP 1.200 → **800** und HQ-Schaden/s 6 → **2**. Diese spürbare Abschwächung gilt für neue zentrale Partien; alte gespeicherte Partien behalten ihre HQ-Werte. Wirtschaft, Produktionsrhythmus, Kosten und Nachschub bleiben unverändert.

Spielstände werden auf Version 2 gespeichert. Alte zentrale Ausfahrten werden an ihrer aktuellen sichtbaren Position in die Kampfsimulation übernommen. Der Browser weist beim Laden eines alten Stands darauf hin, für die aktuelle HQ-Balance eine neue Partie zu beginnen.

Tests, Gegenproben und die weiterhin offenen Balanceprobleme: [DEPLOYMENT-COMBAT.md](DEPLOYMENT-COMBAT.md).
