# HEXFRONT – Vollständiger Verbesserungsplan

**Stand:** 2. November 2026

**Status:** Verbesserungen nach main zusammengeführt; Kongregate-/Y8-Pakete r2 lokal als fertige ZIPs geprüft; menschliche/physische/Live-Portal-Abnahme und Portal-Upload weiterhin offen
**Grundlage:** Audit des aktuellen lokalen Repository-Stands vom 2. November 2026

**Ziel:** Ein zuverlässig spielbares, verständlicheres und besser lesbares HEXFRONT mit sinnvoller automatischer Versorgung und einer abgeschlossenen Zehn-Level-Kampagne.

**Nachtrag aus dem Handy-Test:** Das bei Ziehbewegungen gemeldete Hinweisflackern wurde reproduziert und behoben. Alle zehn Karten sind erneut in sieben Fenstergrößen und beiden Sprachen einschließlich Ziehbewegung geprüft (140 Fälle). Details und Vorschläge je Karte stehen in der [mobilen Kartenprüfung](mobile-kartenpruefung-2026-11-02.md). Der Nutzer ist mit der getesteten Kartenansicht zufrieden; eine zusätzliche automatische Vergrößerung bleibt für dieses Update zurückgestellt. Die vollständige physische Abnahme bleibt offen.

**Prüfumfang ab diesem Nachtrag:** Auf Nutzerwunsch künftig gängige Handygrößen (360×800, 390×844, 430×932), Tablet (768×1024) und Desktop (1440×900) verwenden. Zusätzliche Sondergrößen sind keine erforderliche Abnahme.

- [x] Befehlsvorschau von der Hinweiszeile trennen, ohne Kartenhöhe während Aktionen zu verändern.
- [x] Zehn Karten einzeln auf mobile Größenreserve und besondere Randbereiche prüfen.
- [ ] Korrigierte Hinweiszeile auf dem tatsächlichen Handy erneut testen.
- [x] Entscheidung zum Kartenausschnitt: Der Nutzer bewertet die getestete Ansicht als gut; sie bleibt für dieses Update erhalten. Zusätzliche automatische Vergrößerung und kompaktere Hochkant-Bedienung sind zurückgestellte Optionen, nicht umgesetzt.

**Merge und Pakete:** Der beauftragte Merge nach `main` ist lokal als `d053f9b` abgeschlossen. Neue Kongregate-/Y8-Pakete r2 wurden daraus erstellt, entpackt und geprüft. [Paketbericht und Prüfsummen](releases/hexfront-2026-11-02-r2.md). GitHub Pages wird über den bestehenden Main-Workflow aktualisiert; Portal-Upload und echte Portalprüfung bleiben gesondert.

**Zusätzlicher Nutzerfund beim Levelwechsel:** Die nächste Karte wurde erst nach dem Klick geladen; nur der unsichtbare Startbutton im Kampagnenmenü zeigte einen Ladezustand. Der sichtbare Weiter-Button blieb unverändert. Das ist auf Mobil reproduziert, kein ausschließlich am Nutzergerät beobachteter Effekt.

- [x] Weiter-/Wiederholen-Buttons zeigen ausstehendes Laden sofort und sperren doppelte Starts; die Kampagnenkarte bleibt als Abbruch erreichbar.
- [x] Nach einem Sieg nur die nächste Karte vorladen und decodieren; bereits geladene Bilder beim Wechsel wiederverwenden.
- [x] Abbruch, fertiges Vorladen sowie fehlgeschlagene Bildanfragen prüfen; Fehlermeldung gegebenenfalls direkt im Ergebnisdialog anzeigen.
- [x] Zehn neue Browserfälle plus zehn bestehende Bedienungsfälle bestehen. Bei künstlich 1,5 Sekunden verzögerten Bildanfragen: vorher 1.639 ms ab Klick ohne Rückmeldung; nach abgeschlossenem Vorladen 168 ms. Frühes Klicken braucht weiterhin die restliche Ladezeit, zeigt jetzt aber unmittelbar den Ladezustand. Keine Behauptung einer Hardwaremessung.

Dieser Plan enthält die im Chat ausgearbeiteten 13 Bulks mit offenen Checkboxen. Er ist die Arbeitsgrundlage für diesen neuen Verbesserungspass. Die älteren Dokumente `next-development-pass-plan.md` und `campaign-roadmap.md` bleiben historische Referenzen; deren Bulk-Nummern und Abschlussstände gelten nicht für diesen Plan.

Der Nutzer hat am 2. November 2026 die Umsetzung mit gezielten Prüfungen beauftragt. Laufende Ergebnisse stehen in `improvement-pass-2026-11-02.md`. Veröffentlichungen erfolgen als gesonderter Auslieferungsschritt.

**Übergabe zur manuellen Abnahme:** Der Nutzer möchte den aktuellen Stand committen und pushen und die offenen manuellen Prüfungen in der nächsten Sitzung selbst durchführen. Die konkrete [Testcheckliste](manuelle-testcheckliste-2026-11-02.md) enthält Schritte und erwartete Ergebnisse. Diese Prüfungen bleiben bis dahin offen; Commit und Push sind keine Release-Freigabe.

**Spielstand:** [Aktuellen Main-Stand öffnen](https://emfau88.github.io/hexwars/); der Main-Workflow veröffentlicht ihn nach bestandenen Prüfungen. Der frühere festgelegte Testlink `d2201fb` bleibt als Vergleichsstand erhalten und enthält die jüngste Lade-Korrektur noch nicht.

**Arbeitskopien:** Der Main-Merge wurde in `.worktrees/hexfront-main-release` vorbereitet, damit lokale unversionierte Experimente im ursprünglichen Arbeitsordner erhalten bleiben. Ein dort noch laufender Entwicklungsserver auf Port 5173 kann weiterhin den alten Feature-Branch zeigen; für den aktuellen Stand den Main-Spiel-Link verwenden.

**Paketstand nach Nutzerfeedback:** Kongregate-/Y8-Pakete r2 enthalten Bewegungs-, Statistik-, Hinweis- und Levelwechsel-Korrekturen sowie Eis-Level 10. Genau diese ZIPs sind lokal geprüft. Frühere r1-/generische ZIPs bleiben ältere Teststände; GameMonetize wurde diesmal nicht neu paketiert.

**Neuester belegter Prüfstand:** 162/162 Logiktests bestanden. Vollständiger Browserlauf: 76 bestanden, sechs projektbedingt übersprungen, kein Fehler. Die anschließende Begrenzung externer Kongregate-Einbindungen auf tatsächliche Iframes wurde gezielt nachgeprüft. Zusätzlich 140 Karten-/Sprach-/Größenfälle ohne verdeckte Feldmitte oder horizontalen Seitenüberlauf, Bewegungsvergleich, Schildzustände, Gruppenvorschau und Browser-Touchereignisse geprüft. Eine automatisierte Kampagne mit echten Kämpfen und Speichern/Neuladen gewinnt alle zehn Level. Alte Spielstände und Level 9 → 10 sind separat im Browser geprüft. Menschliche Durchläufe, physische Geräte und veröffentlichte Portale bleiben offen. Kongregate-Ursache, Korrektur und Statistikvorschläge: `kongregate-statistics-audit-2026-11-02.md`.

## Leitplanken für eine sichere Umsetzung

Eine vollständige Garantie gegen Folgefehler ist bei Änderungen an einem Spiel nicht möglich. Das Risiko wird durch kleine, getrennt überprüfbare Änderungen, gesicherte Ausgangsstände und gezielte Prüfungen begrenzt. Maßstab für den Abschluss ist das optimierte Gesamtspiel.

1. **Bestehenden Arbeitsstand schützen:** Vor Umsetzung vorhandene lokale Änderungen einschließlich unversionierter benötigter Dateien inventarisieren und sichern. Keine fremden Änderungen überschreiben oder ungeprüft einem Bulk zuordnen. Ein Rollback darf nur die Änderungen des jeweiligen Bulks zurücknehmen.
2. **Einen Bulk nach dem anderen abschließen:** Fehlerkorrekturen, neue Bedienfunktionen, Balance und Artwork getrennt behandeln. Jeder abgeschlossene Bulk erhält einen nachvollziehbaren Versionsstand und eine kurze Ergebnisnotiz.
3. **Fehler zuerst reproduzieren:** Für die bestätigten Nachschub- und Speicherfehler gezielte Regressionstests aus dem beobachteten Verhalten ableiten. Die Tests müssen das gewünschte Spielergebnis prüfen.
4. **Prüfungen passend zur Änderung ausführen:** Logikänderungen benötigen relevante Simulationen und Tests; UI-Änderungen benötigen echte Browserinteraktionen und visuelle Kontrolle. Nach Änderungen an gemeinsam verwendeten Systemen auch die betroffenen Portalversionen prüfen.
5. **Bei Regressionen den aktuellen Bulk korrigieren:** Neue Fehler beheben oder die betreffende Änderung zurücknehmen, bevor darauf aufgebaut wird. Unvollständige oder verworfene Ansätze offen dokumentieren.
6. **Spielidentität und Regeln bewusst behandeln:** Hex-Geometrie, Missionsziele, Spielstände, Steuerungspräferenzen und Portalverhalten sind geschützte Verträge. Beabsichtigte Regeländerungen ausdrücklich dokumentieren und anschließend auf Balance und Verständlichkeit prüfen.
7. **Komfortfunktionen am Nutzen messen:** „Hier halten“, ein zusätzlicher Nachschub-Fokus, Kampfvorschauen und die Wächtervariante für Level 10 sind Designentscheidungen mit überprüfbaren Zielen. Ihre Ausgestaltung darf vereinfacht oder verworfen werden, wenn sie unnötige Komplexität oder neue Probleme erzeugt. Die Entscheidung im zugehörigen Bulk festhalten.
8. **Spielstände und Pakete getrennt absichern:** Vorhandene Fortschritte müssen weiter funktionieren. Die letzte funktionierende Auslieferung bleibt als Rückkehrpunkt verfügbar. Standard-, Kongregate- und weitere Portalpakete anhand ihrer eigenen Startpunkte überprüfen.
9. **Automatische Checks durch Spielabläufe ergänzen:** Ein grüner Testlauf allein genügt nicht. Die Gesamtabnahme umfasst eine neue Kampagne, bestehende Spielstände, echte Eingaben, mehrere Bildschirmgrößen und den tatsächlichen Portalbetrieb.
10. **Evidenz ehrlich kennzeichnen:** Lokale Browserprüfung, Simulation, physisches Gerät und Prüfung im veröffentlichten Portal getrennt ausweisen. Fehlende Geräte- oder Portalprüfungen bleiben sichtbar offen.

## Ausgangslage aus dem Audit

- Das Repository enthält die Kongregate-Paketierung und vorhandene Upload-Pakete. Der geprüfte lokale Stand muss nicht mit dem derzeit veröffentlichten Portalstand identisch sein.
- Die Typprüfung und alle 124 vorhandenen Tests bestanden im Audit. Das deckt die zusätzlich reproduzierten Grenzfälle nicht vollständig ab.
- Alle zehn Karten ließen sich lokal laden. Neun sind in der Kampagne veröffentlicht; Level 10 besitzt eine spielbare Definition und die ältere Darstellung.
- Bestätigte Probleme betreffen bedrohte Nachschubquellen, nicht berücksichtigte manuelle Verstärkungen, übersehene gültige Routen, mobile Nachschubsteuerung, überdeckte Kartenbereiche und Speicherfehler.
- Eine dauerhaft vom eigenen Relais verdeckte Feldzahl wurde in den geprüften Startansichten von Level 7–9 nicht bestätigt. Verbindungslinien, Hinweise und das Desktop-Panel verursachten dagegen nachweisbare Überdeckungen.
- Im einzelnen deterministischen Balance-Smoke-Test endeten alle zehn Partien innerhalb von fünf Minuten. Das Spielermodell verlor Level 5 und 7–10; Level 6 dauerte 239 Sekunden. Diese Ergebnisse sind Prüfindikatoren und kein Nachweis unfairer Balance.

## Bulk 0 – Ausgangsstand und Prüfkriterien sichern

**Zweck:** Spätere Verbesserungen eindeutig vom heutigen Verhalten unterscheiden.

**Voraussetzung:** Nutzerauftrag vom 2. November 2026 liegt vor.

**Status:** Abgeschlossen

- [x] Aktuellen Quellstand, vorhandene lokale Änderungen und Kongregate-Paketstand dokumentieren.
- [x] Festhalten, welche Änderungen nur Y8 betreffen und welche alle Spielversionen beeinflussen.
- [x] Reproduktionsfälle aus dem Audit als Ausgangsbasis festhalten: bedrohte Quelle, Überfüllung, übersehener Versorgungsweg, verdeckte Felder, fehlender mobiler Schalter und Speicherfehler.
- [x] Vergleichsansichten für alle Karten sichern: Start, fortgeschrittene Partie und relevante Gebäudezustände.
- [x] Eine feste Größenmatrix festlegen: 320 × 568, 390 × 844, Tablet-Hochformat, 1000 × 700, 1024 × 768, 1100 × 700 und 1440 × 900.
- [x] Für jeden folgenden Bulk dokumentieren: Änderungen, Prüfungen, verbleibende Einschränkungen.

**Abschlussbedingung:** Jeder bekannte Fehler besitzt eine nachvollziehbare Ausgangssituation und ein erwartetes korrektes Verhalten.

## Bulk 1 – Auto-Nachschub gegen taktische Selbstschädigung absichern

**Zweck:** Verhindern, dass die Automatik gewinnbare Verteidigungen auflöst.

**Voraussetzung:** Bulk 0 abgeschlossen.

**Status:** Abgeschlossen

- [x] Quellen mit laufendem Kampf vom automatischen Truppenabzug ausnehmen.
- [x] Konkret eintreffende feindliche Truppen bei der Reserve berücksichtigen.
- [x] Eigene Basen und bedrohte Engstellen angemessen absichern.
- [x] Manuelle Befehle weiterhin ausdrücklich ermöglichen; ein bewusstes Räumen eines Feldes bleibt eine Spielerentscheidung.
- [x] Dieselben Sicherheitsregeln für Spieler und Gegner anwenden.
- [x] Den Fall „40 Verteidiger gegen 30 Angreifer“ prüfen: Die Automatik darf die Verteidigung nicht durch einen Abzug auf 15 zerstören.
- [x] Prüfen, dass die Schutzregeln den regulären Nachschub an stabilen Fronten nicht dauerhaft blockieren.

**Abschlussbedingung:** Automatische Versorgung erzeugt keine vermeidbaren Feldverluste durch das Entleeren bereits angegriffener Quellen.

## Bulk 2 – Truppenmengen und Zielkapazitäten zuverlässig behandeln

**Zweck:** Die reproduzierten Verluste durch überfüllte Ziele verhindern.

**Voraussetzung:** Bulk 1 abgeschlossen; Auswirkungen auf Versand und Ankunft gemeinsam prüfen.

**Status:** Abgeschlossen

- [x] Bei der Zielauslastung sämtliche eigenen ankommenden Truppen berücksichtigen: manuelle Befehle, Verstärkungen und Auto-Nachschub.
- [x] Bereits zugesagte Transportmengen innerhalb desselben Versorgungsschritts sofort reservieren.
- [x] Mehrere gleichzeitige Quellen dürfen gemeinsam die verfügbare Zielkapazität nicht überschätzen.
- [x] Wachstum während der Transportzeit und nachträgliche manuelle Verstärkungen als Sonderfälle berücksichtigen.
- [x] Für unvermeidbaren Überlauf eine sichtbare Rückführungs- oder Umleitungsregel festlegen, statt Einheiten still zu löschen.
- [x] Die Regel für manuelle Überfüllung verständlich anzeigen, beispielsweise in der Befehlsvorschau.
- [x] Den Fall „5 am Ziel + 60 manuell unterwegs“ prüfen: Die Automatik darf nicht zusätzlich 34 Einheiten schicken.
- [x] Unterbrochene Wege, verlorene Ziele und gleichzeitig eintreffende Transporte auf Truppenerhaltung prüfen.

**Abschlussbedingung:** Jede versandte Einheit lässt sich bis zur Ankunft, Rückführung oder einem tatsächlichen Kampfverlust nachvollziehen.

## Bulk 3 – Wegsuche und Nachschubverteilung verbessern

**Zweck:** Zunächst den bestätigten Routenfehler beheben, anschließend die strategische Verteilung verfeinern.

**Voraussetzung:** Bulks 1 und 2 abgeschlossen.

**Status:** Abgeschlossen

- [x] Die Vorwärtsregel direkt während der Wegsuche anwenden.
- [x] Alternative gültige Wege finden, wenn der zuerst gefundene kürzeste Weg ungeeignet ist.
- [x] Den reproduzierten Level-8-Fall und entsprechende Konstellationen auf weiteren Karten absichern.
- [x] Neuberechnung nach Gebietsverlust und Rückeroberung prüfen.
- [x] Schleifen und dauerhaftes Hin-und-her-Schicken ausschließen.
- [x] Zielprioritäten um tatsächliche Bedrohung, vorhandene Verstärkung und Bedarf ergänzen.
- [x] Prüfen, ob wichtige Seitenfronten durch die bisherige Ausrichtung auf die gegnerische Basis verhungern.
- [x] Eine einfache „Truppen hier halten“-Funktion entwerfen: Das Feld versendet keinen automatischen Nachschub, bleibt aber manuell nutzbar.
- [x] Einen zusätzlichen Nachschub-Fokus nur ergänzen, wenn die verbesserte Standardverteilung und „Halten“ im Playtest nicht ausreichen.
- [x] Aufwand der Wegsuche auf großen kontrollierten Gebieten messen.

**Abnahme:** Halten, manuelle Befehle und persistente Nachschubbedienung bestehen im Desktop-/Mobile-Browser. 153 Logiktests bestanden vor der Umstellung der Balance-Simulationen auf echte Distanzen; die fünf anfänglich auffälligen Browserfälle sind nach gezielter Korrektur grün. Zusätzlichen Nachschub-Fokus vorerst verworfen: kein belegter Bedarf über Halten, manuelle Verstärkung und globalen Schalter hinaus. Seitliche, durch Relaissprung isolierte Brückenköpfe brauchen weiterhin eine eigene angrenzende Versorgungskette.

**Zwischenprüfung:** Routenfälle auf Level 4–10 bestehen. 120 Versorgungsschritte auf weitgehend eigener Level-8-Karte: Median 3,76 ms, p95 6,95 ms auf diesem Rechner. Level-6-Profilvergleich untersucht: Ein vorsichtiges Profil verliert vor Erreichen der oberen Flanken; die Auswertung erhält dafür die Kategorie „nicht erreicht“. Das ist keine automatische Begründung für eine Balanceänderung.

**Abschlussbedingung:** Erreichbare sinnvolle Ziele werden zuverlässig versorgt, und der Spieler kann einen Sammelpunkt schützen.

## Bulk 4 – Auto-Nachschub auf allen Geräten verständlich steuerbar machen

**Zweck:** Die korrigierten Regeln nachvollziehbar und erreichbar bedienen.

**Voraussetzung:** Bulks 1–3 abgeschlossen.

**Status:** Abgeschlossen

- [x] Einen jederzeit erreichbaren Nachschubschalter für Mobile ergänzen.
- [x] Den aktuellen Zustand klar anzeigen: aktiv oder ausgeschaltet.
- [x] Die gewählte Einstellung über Neustarts, Missionswechsel und erneutes Laden erhalten.
- [x] Erklären, dass Ausschalten neue automatische Transporte verhindert; bereits unterwegs befindliche Truppen beenden ihre Bewegung.
- [x] Auto-Nachschub beim ersten relevanten Einsatz kurz und praktisch erklären.
- [x] Die Wechselwirkung mit 50-%-Sendungen erläutern: Zurückgehaltene Truppen können später automatisch weiterziehen.
- [x] Reserven verständlich beschreiben; Prozentwerte müssen als Anteil der Feldkapazität erkennbar sein.
- [x] Desktop und Mobile auf denselben Funktionsumfang prüfen.

**Abschlussbedingung:** Ein neuer Spieler kann erkennen, warum sich Truppen bewegen, die Automatik abschalten und gezielt Einheiten sammeln.

## Bulk 5 – Spielfeld, Gebäude und Zahlen durchgehend lesbar machen

**Zweck:** Die bestätigten Überdeckungen beheben.

**Voraussetzung:** Bulk 0 abgeschlossen; neue Bedienelemente aus Bulk 4 bei der Endprüfung berücksichtigen.

**Status:** Abgeschlossen für die lokale Browsermatrix; reale Geräte bleiben Teil von Bulk 12

- [x] Das Desktop-Bedienpanel so platzieren oder verkleinern, dass es bei unterstützten Fenstergrößen keine spielbaren Felder verdeckt.
- [x] Den Wechsel zwischen Desktop-, Kompakt- und Mobile-Layout anhand des tatsächlich verfügbaren Platzes bestimmen.
- [x] Wächter-Verbindungslinien unter Zahlen und wichtige Statusanzeigen legen.
- [x] Eine klare Zeichenreihenfolge für Gelände, Gebäude, Schilde, Verbindungen, Truppen und Feldzahlen festlegen.
- [x] Hinweise, Tutorialkarten und Tooltips außerhalb wichtiger Spielfeldbereiche platzieren.
- [x] Relais, Wächter und HQs in neutralen, eigenen, gegnerischen und umkämpften Zuständen überprüfen.
- [x] Schildanzeigen bei voller, teilweiser und erschöpfter Ladung prüfen.
- [x] Eine Mindestgröße für Feldzahlen im normalen Build und den Portalversionen festlegen.
- [x] Zweistellige Werte, volle Stapel und bewegte Truppen auf kleinen Displays prüfen.
- [x] Die Layouts mit deutschen und englischen Texten kontrollieren.

**Nachweis:** Sieben Layoutgrößen sowie alle zehn Karten in EN/DE bei 320 und 1440 Pixeln geprüft. Zusätzlich acht Schildansichten und 100 gleichzeitige Transporte. Die Zahlen werden zuletzt gezeichnet; der Gebäudeversatz wurde nach einem gefundenen Abstandskonflikt bei 320 Pixeln begrenzt und erneut visuell geprüft. Lokale Evidenz: `hexfront-implementation/layout/` und `final-visual/`.

- [x] Nutzerfund im lokalen Test beheben: Bewegte Truppen sprangen durch die neue Zahlen-Ausweichregel abrupt nach oben und zurück. Diese Regel wurde entfernt. Die Truppensymbole liegen wieder durchgehend auf dem tatsächlichen Bewegungsweg; die Feldzahlen bleiben darüber gezeichnet. Wartende Rücktransporte zeigen ihre Menge am Wartesymbol, ohne beim Weiterfahren versetzt zu werden.

**Nachprüfung der Bewegung:** 31 Strecken über alle zehn Karten, jeweils bei 390 und 1440 Pixeln; 1.085 Positionsmessungen pro Durchlauf. Die fehlerhafte Variante reproduzierte bis zu 26,195 Weltpixel Abstand vom echten Weg; nach der Korrektur beträgt der Abstand durchgehend null. Wegpunkte, Reisegeschwindigkeit und Kampf-/Ankunftslogik wurden bei dieser Korrektur nicht geändert. Typprüfung und 16 Transport-/Routentests bestanden. Evidenz: `hexfront-implementation/movement-smooth/results.json`.

**Abschlussbedingung:** Keine spielbare Zelle wird von festem UI verdeckt; Feldstärke und Gebäudezustand sind auf allen Zielgrößen eindeutig lesbar.

## Bulk 6 – Bedienung, Pause und Zugänglichkeit vervollständigen

**Zweck:** Fehlbedienungen reduzieren und längere entspannte Spielsitzungen ermöglichen.

**Voraussetzung:** Bulk 5 abgeschlossen; Nachschubsteuerung aus Bulk 4 integrieren.

**Status:** Lokal abgeschlossen; physische Touchgeräte bleiben in Bulk 12 offen

- [x] Zusätzlich zum Ziehen eine Bedienung durch „Quelle antippen, Ziel antippen“ anbieten.
- [x] Auswahl, gültige Ziele und Abbrechen klar darstellen.
- [x] Versehentliche Berührungen und abgebrochene Gesten zuverlässig behandeln.
- [x] Eine echte Pause mit Fortsetzen, Neustart, Einstellungen und Rückkehr zur Kampagne ergänzen.
- [x] Den laufenden Missionszustand beim Öffnen des Pausenmenüs erhalten.
- [x] Neustart und Verlassen einer laufenden Partie als eindeutige Aktionen gestalten.
- [x] Eine vollständige Tastaturbedienung für Feldauswahl und Befehle vorsehen.
- [x] Sichtbare Fokusmarkierungen und verständliche Beschriftungen ergänzen.
- [x] Besitz und Auswahl zusätzlich zur Farbe erkennbar machen.
- [x] Zoom, reduzierte Bewegung und ausreichend große Touchflächen überprüfen.
- [x] Das Verhalten bei Tabwechsel und Fokusverlust eindeutig festlegen und testen.

**Nachweis:** Touch-Abbruch und verlorenes Pointer-Capture erzeugen keinen Befehl; anschließendes Tap/Tap erzeugt genau einen Befehl. Bei 320/1440 Pixeln in EN/DE geprüft. Reduzierte Bewegung deaktiviert die Umgebungsanimation, neue Hauptschalter sind mindestens 44 Pixel hoch. Zoom 170 %, Schwenken und Rückkehr zur Gesamtansicht geprüft. Evidenz: `controls-final/results.json`. Reale Touchhardware ist damit nicht abgenommen.

**Abschlussbedingung:** Eine Partie kann mit Maus, Touch oder Tastatur begonnen, gesteuert, pausiert und fortgesetzt werden.

## Bulk 7 – Neue Mechaniken und Kampfentscheidungen besser vermitteln

**Zweck:** Erklärungen jeweils dort anbieten, wo sie gebraucht werden.

**Voraussetzung:** Bulks 1–6 abgeschlossen, damit Tutorials die endgültigen Regeln und Eingaben erklären.

**Status:** Lokal abgeschlossen mit bewusst vereinfachter Kampfvorschau; menschliche Verständlichkeitsprüfung bleibt Bulk 9

- [x] Level 1 auf den ersten gültigen Befehl und das Verständnis von Feldzahlen konzentrieren.
- [x] Auto-Nachschub anhand einer tatsächlich stattfindenden Bewegung erklären.
- [x] In Level 2 den Unterschied zwischen 100 % und 50 % mit einer konkreten Vorschau verdeutlichen.
- [x] Bei Gruppensendungen alle beteiligten Quellen hervorheben.
- [x] Vor dem Loslassen Einzelmengen und Gesamtmenge einer Gruppensendung zeigen.
- [x] Hügelverteidigung und HQ-Schildwirkung verständlich voneinander unterscheiden.
- [x] Relaisreichweite und die abweichenden Regeln gewöhnlicher Felder sichtbar erklären.
- [x] Kampfvorschau bewusst vereinfachen: exakte Versandmengen und erwarteten Überlauf anzeigen; Zielstärke und Schildzustand am Feld sowie Verteidigungsregeln in der Hilfe erklären. Eine zusätzliche Sieg-/Verlustprognose wird wegen gleichzeitiger Verstärkungen, Wachstum und laufender Kämpfe nicht ergänzt.
- [x] Zeit und Wachstumsphase auch auf Mobile dauerhaft erreichbar anzeigen.
- [x] Den Beginn des Produktionsrückgangs und das vollständige Wachstumsende deutlich ankündigen.
- [x] Hilfen erneut aufrufbar machen und ihre Platzierung mit Bulk 5 abstimmen.

**Abschlussbedingung:** Neue Spieler können erklären, warum ein Befehl möglich ist, welche Felder senden und warum Einheitenzahlen steigen oder fallen.

**Nachweis:** Einstiegshilfe erklärt Tap/Tap und „Zahlen zeigen Truppen“. Vorschauen `20 → 10`, `20 → 20` und `10 + 20 + 15 → 45` in EN/DE bei 320/1440 Pixeln geprüft; Gruppenmarkierungen visuell kontrolliert. Tatsächlich erzeugte Nachschubtransporte lösen den ersten Hinweis aus. Zeit-/Phasenwechsel und Meldungen bei 180/240 Sekunden geprüft. Browserfälle prüfen Relaisbriefings und beide Relaissprünge. Die Kampfergebnis-Prognose wurde ausdrücklich verworfen; die Hilfe erklärt stattdessen die tatsächlichen Regeln.

## Bulk 8 – Speicherfehler und Portalbetrieb robust behandeln

**Zweck:** Spielstart und Einstellungen bei nicht verfügbarem Speicher funktionsfähig halten.

**Voraussetzung:** Bulk 0 abgeschlossen. Dieser Bulk ist unabhängig von den meisten Spielmechanik-Bulks und kann bei der Umsetzung früh vorgezogen werden.

**Status:** Lokale Speicher- und Einbettungsprüfungen abgeschlossen; tatsächlicher Portalbetrieb bleibt Bulk 12

- [x] Bereits den Zugriff auf den Browserspeicher gegen Fehler absichern.
- [x] Fehler beim Lesen und Schreiben in Spracheinstellungen, Fortschritt und Bedienpräferenzen einheitlich behandeln.
- [x] Bei gesperrtem Speicher mit Einstellungen im Arbeitsspeicher starten.
- [x] Sprachwechsel auch bei fehlgeschlagenem Speichern vollständig durchführen.
- [x] Einen unaufdringlichen Hinweis vorsehen, wenn Fortschritt nicht dauerhaft gespeichert werden kann.
- [x] Beschädigte oder unvollständige Spielstände sinnvoll auffangen.
- [x] Vorhandene Spielstände bei neuen Einstellungen und Level-10-Freigabe kompatibel halten.
- [x] Gesperrten Speicher, ausgeschöpftes Kontingent und fehlschlagende Schreibzugriffe gezielt prüfen.
- [x] Lokale Iframe-Einbettung und gewöhnlichen Direktaufruf getrennt überprüfen, jeweils auch bei blockiertem Speicher. Tatsächliche Portal-Einbettung bleibt Bulk 12.

**Abschlussbedingung:** Das Spiel bleibt bei Speicherproblemen bedienbar; eine nicht gespeicherte Einstellung verursacht keinen halb ausgeführten UI-Wechsel.

**Zusätzlicher Nutzerfund:** Kongregates tatsächliche Spieldomain wurde nicht erkannt. Korrektur, acht Adaptertests und Browserablauf mit nachgebildetem SDK sind in `kongregate-statistics-audit-2026-11-02.md` dokumentiert. Echte Serverannahme bleibt offen.

## Bulk 9 – Kampagnenbalance nach den Korrekturen neu bewerten

**Zweck:** Die Kampagne auf Grundlage der korrigierten Nachschublogik bewerten.

**Voraussetzung:** Bulks 1–3 vor den Simulationen; Bulks 4–8 vor den vollständigen Erstspieler-Tests abgeschlossen.

**Status:** Simulation und Auswertung abgeschlossen; menschliche Erstspieler-Tests offen

- [x] Neue reproduzierbare Ausgangswerte für alle verfügbaren Karten erheben.
- [x] Prüfen, ob Simulationsgeometrie und Bewegungszeiten das tatsächliche Spiel ausreichend abbilden.
- [x] Mehrere Spielweisen vergleichen: vorsichtiges Ausbreiten, konzentrierter Angriff, mehrere Fronten und manueller Nachschub.
- [x] Nutzerhinweis ausdrücklich abbilden: gezieltes Doomstacken mit geschütztem Sammelfeld, anschließend konzentrierter Durchbruch zum HQ.
- [x] Einen auf Eroberungskosten ausgerichteten Weg zum HQ testen: unnötige Felder und starke neutrale Verteidiger umgehen; z. B. 5 statt 12 Truppen Widerstand wählen, sofern der gesamte Weg sinnvoll bleibt.
- [x] Dieselben gezielten Strategien mit Auto-Nachschub an/aus und „Hier halten“ vergleichen; hinderliche automatische Umverteilung getrennt von der Spielstärke des Bots bewerten.
- [x] Besonders Level 5, Level 6 und den Übergang zu Level 7 untersuchen.
- [x] Prüfen, wie stark die Nachschubkorrekturen Spieler und KI jeweils beeinflussen.
- [x] Festgefahrene Partien, einseitige Routenwahl und nutzlose Truppenansammlungen erfassen.
- [x] Produktionsrückgang und Wachstumsende auf verständliche, gewinnbare Endspiele überprüfen.
- [ ] Mit fünf bis acht neuen Spielern kurze Erstspieler-Tests durchführen.
- [ ] Dabei ersten gültigen Zug, Fehlgesten, Verständnis neuer Mechaniken, Abbrüche und wahrgenommene Fairness protokollieren.
- [ ] Schwierigkeiten anhand dieser Beobachtungen anpassen; Bot-Niederlagen allein lösen keine Abschwächung aus.
- [x] Den aktuellen Balancebericht mit Methode und Einschränkungen aktualisieren.

**Abschlussbedingung:** Jede Karte hat eine nachvollziehbare Lernaufgabe und Schwierigkeit; auffällige Ergebnisse sind untersucht und begründet. Menschliche Playtests werden nur als durchgeführt markiert, wenn entsprechende Beobachtungen vorliegen.

**Nachweis:** `improvement-balance-2026-11-02.md` dokumentiert 250 Kampagnenläufe sowie 96 finale Variantenläufe. Keine Levelstärken auf Basis von Bot-Niederlagen verändert. Human-Playtests bleiben ausdrücklich ausstehend.

## Bulk 10 – Level 10 spielerisch als Finale ausarbeiten

**Zweck:** Ein eigenständiges Finale gestalten; die Illustration folgt nach stabiler Geometrie.

**Voraussetzung:** Bulk 9 liefert eine belastbare Balancebasis und Erkenntnisse zu den eingeführten Mechaniken.

**Status:** Spieldefinition, Variantenvergleich und lokale Logistikprüfung abgeschlossen; manueller Gesamtdurchlauf bleibt Bulk 12

- [x] Eine klare taktische Leitidee formulieren: Was verlangt „Der Ring“, das vorherige Karten vorbereitet haben?
- [x] Den langen See, beide Relais und die seitlichen Routen auf echte unterschiedliche Entscheidungen prüfen.
- [x] Einen Entwurf mit und einen ohne zusätzliche Wächter vergleichen.
- [x] Wächter nur übernehmen, wenn sie die finale Entscheidung verbessern und die Karte verständlich bleibt.
- [x] Stärke und Zeitpunkte der zwei KI-Aktionen pro Denkzyklus prüfen.
- [x] Startwerte, neutrale Widerstände, Hügel und mögliche Angriffswege gezielt festlegen.
- [x] Nachschub- und Umleitungsfälle auf dieser Geometrie überprüfen: getrennte Relais-Brückenköpfe, eroberte Landverbindung, abgeschnittener Uferweg und Überlauf-Rückführung.
- [x] Eine Dramaturgie aus Eröffnung, Schwerpunktentscheidung und Abschlussangriff schaffen.
- [x] Finalen Missionsnamen, Zieltext und Regeltext in Deutsch und Englisch verfassen.
- [x] Den Entwurf vor finaler Illustration anhand der einfachen Spieldefinition automatisiert spielen und Varianten vergleichen. Kein menschlicher Playtest behauptet.

**Abschlussbedingung:** Level 10 funktioniert als eigenständiges Finale und benötigt keine wesentlichen Geometrieänderungen mehr.

**Nachweis:** 96 Variantenläufe mit/ohne Wächter und mit einer/zwei KI-Aktionen. Entscheidung für ursprüngliche Geometrie ohne zusätzlichen Wächter. Drei zusätzliche Tests auf Level-10-Geometrie mit realen Weltkoordinaten bestehen (`level10-logistics.test.ts`). Der automatisierte Kampagnendurchlauf gewinnt auch Level 10.

## Bulk 11 – Level 10 illustrieren und die Kampagne abschließen

**Zweck:** Die bestehende Art-Pipeline auf das fertige Finale anwenden.

**Voraussetzung:** Bulk 10 abgeschlossen.

**Status:** Eis-Artwork und Kampagnenabschluss integriert; Level 10 nach Level 9 lokal spielbar; endgültige Release-Abnahme offen

- [x] Eine exakte Code-Schablone aus der endgültigen Leveldefinition erzeugen.
- [x] Freiflächen für HQs, Relais, Hügel und gegebenenfalls Wächter ausdrücklich markieren.
- [x] Stilreferenzen der vorhandenen Karten und die gewünschte finale Stimmung festlegen. **Nutzervorgabe: Level 10 als Eislandschaft mit Schnee und kalter Beleuchtung. Der zwischenzeitliche warme Entwurf wird nicht verwendet.**
- [x] Das Landschaftsbild mit ImageGen auf Basis dieser Schablone erstellen.
- [x] Wege, Küsten und Freiflächen gegen die tatsächliche Spielgeometrie prüfen und korrigieren.
- [x] Erforderliche Landschafts- oder Wasser-Overlays bewerten: Für den gefrorenen See bewusst keine Wasseranimation ergänzen.
- [x] Optimierte Laufzeitdateien und eine kleine Menüvorschau erstellen.
- [x] Die Karte im Manifest registrieren und auf allen Zielgrößen kontrollieren.
- [x] Einen eigenen Kampagnenabschluss mit Ergebnisübersicht und Wiederholungsmöglichkeiten gestalten.
- [x] Übergangsabschluss nach Level 9 bewerten: Im neuen Zehn-Level-Teststand entfällt dieser Zwischenzustand; nach Level 9 geht es zu Level 10, der Kampagnenabschluss folgt danach.
- [ ] Level 10 erst nach bestandener Spiel-, Darstellungs- und Speicherprüfung endgültig ausliefern. Lokal ist es für diese Abnahme bereits freigeschaltet. Simulation, Darstellung und Spielstandmigration sind geprüft; Gesamtabnahme bleibt offen.

**Nachweis:** Art-Pipeline und finaler Prompt in `qa/improvement-level10/README.md`; Browserprüfung bestätigt Freischaltung nach Level 9, Übernahme alter Spielstände und gespeicherten Abschluss 10/10. Ein UI-Test löst den Sieg gezielt aus und belegt deshalb nur den Abschluss-/Speicherablauf; tatsächliche Kämpfe sind separat simuliert.

**Abschlussbedingung:** Die zehnte Mission besitzt fertige Darstellung, verständliches Briefing und einen passenden Kampagnenabschluss.

## Bulk 12 – Gesamtabnahme, Dokumentation und Veröffentlichung vorbereiten

**Zweck:** Alle Änderungen zu einem überprüfbaren Release zusammenführen.

**Voraussetzung:** Alle vorgesehenen Änderungen aus Bulks 0–11 abgeschlossen und geprüft; bewusst verworfene oder zurückgestellte Designoptionen dokumentiert.

**Status:** Main-Merge und aktuelle Kongregate-/Y8-Pakete lokal geprüft; tatsächliche Portal-Abnahme und Upload offen

- [ ] Einen vollständigen Kampagnendurchlauf mit frischem Spielstand durchführen.
- [x] Fortsetzen mit bestehenden Spielständen und bereits abgeschlossenen Missionen prüfen.
- [x] Alle bestätigten Auditfehler erneut anhand ihrer Reproduktionsfälle kontrollieren.
- [x] Desktop-, Mobile- und Tablet-Matrix mit beiden Sprachen abschließen.
- [ ] Reale Touchgeräte auf Lesbarkeit, Gesten, Audio und Bildlauf prüfen.
- [x] Leistung besonders bei vielen Transporten, mehreren Fronten und Gebäude-Effekten messen.
- [x] Aktuelle Standard-/Kongregate-, Y8- und GameMonetize-Produktions-Builds lokal auf Start, Eis-Level 10, Pause, Nachschub, Sprache und Debugfreiheit prüfen. Externe SDKs im Produktions-Browsertest ersetzt; echte Portaldienste bleiben offen.
- [x] Produktions-Build auf unbeabsichtigte Debugfunktionen und falsche Assetpfade kontrollieren.
- [x] Installationsfreie Portalpakete als lokale Testkandidaten erstellen und deren Inhalt überprüfen. Kein Nachweis einer abgeschlossenen Gesamtabnahme.
- [ ] Tatsächlichen Portalbetrieb einschließlich Einbettung und Speicherverhalten prüfen.
- [x] README, Bedienhinweise, Balancebericht und Screenshots auf den neuen Stand bringen.
- [x] Abschließende Liste mit behobenen Fehlern, neuen Funktionen und bekannten Einschränkungen erstellen.

**Abschlussbedingung:** Es gibt ein klar identifizierbares, geprüftes Paket und keine offenen Fehler, die Spielfelder verdecken, unbeabsichtigt Truppen verlieren lassen oder den Spielstart verhindern. Ausstehende Prüfungen dürfen nicht als bestanden gelten.

**Zwischenstand:** Frische Kampagne automatisiert mit echten Kämpfen, Speichern/Neuladen und Freischaltung nach jedem Sieg geprüft (`fresh-campaign.json`). Ein vollständiger menschlicher Durchlauf bleibt offen. Bei 100 Transporten: Zeichenzeit lokal im Headless-Browser Median 0,8 ms, p95 1,3 ms, keine physische Mobilmessung. Aktuelle Produktions-Builds aller drei Varianten bestehen lokale Browserchecks bei 390/1440 Pixeln; zusätzlich Iframe mit normalem/blockiertem Speicher (`production-final/results.json`). Der zuvor unvollständige GameMonetize-Test verwies auf das durch die Paketierung entfernte Staging-Verzeichnis; der neue Test nutzt separate Build-Verzeichnisse. Alle zehn Karten sind bei sieben Fenstergrößen in beiden Sprachen geprüft (`matrix-final/results.json`: 140 Fälle). Aktuelle Ansichten und Änderungsübersicht sind verlinkt; frühere ZIPs bleiben veraltet. Die anschließend ausdrücklich beauftragten r2-Pakete sind separat im Paketbericht nachgewiesen.

### Noch ausstehende Freigabe

- [ ] Echten Kongregate-Statistikeintrag aus der Portal-Vorschau nachweisen; SDK-Bereitschaft allein genügt nicht.
- [ ] `missions_completed` im Portal als sichtbare Rangliste aktivieren; Namen und Typen passen bereits.
- [x] Neue Kongregate-/Y8-Upload-ZIPs r2 aus `d053f9b` erstellen und genau diese Artefakte entpackt verifizieren: Integrität, Build-Abgleich, Entwicklungsfreiheit, Start, Touch, Speicher, Eis-Finale und Iframe-Prüfung bestanden. Portal-SDKs im lokalen Browser ersetzt; Live-Portal-Abnahme bleibt offen.
- [ ] Offene menschliche/physische Prüfungen durchführen oder deren Zurückstellung ausdrücklich entscheiden; bis dahin bleiben sie offen.

## Reihenfolge und Abschlussführung

Die wesentlichen Abhängigkeiten sind:

`Bulk 0 → Bulks 1–3 → Bulk 9 → Bulk 10 → Bulk 11 → Bulk 12`

Die Bedienungs- und Darstellungsarbeiten aus Bulks 4–7 sowie die Speicherabsicherung aus Bulk 8 müssen ebenfalls vor der Gesamtabnahme abgeschlossen sein. Bulk 8 kann direkt nach Bulk 0 vorgezogen werden. Für die Erstspieler-Tests in Bulk 9 muss die vollständige Bedienung bereits vorliegen.

Zusätzliche Spielmodi, neue Kampagnen oder umfangreiche Fortschrittssysteme gehören in einen späteren Verbesserungspass.

Für jeden Bulk beim Abschluss ergänzen:

- Umgesetzte Punkte und zugehöriger Versionsstand.
- Konkrete Prüfergebnisse einschließlich verwendeter Geräte und Bildschirmgrößen.
- Auswirkungen auf andere Missionen, bestehende Spielstände und Portalversionen.
- Bewusste Designentscheidungen, verworfene Optionen und verbleibende Einschränkungen.
- Ergebnis: abgeschlossen, weitere Korrektur erforderlich oder bewusst zurückgestellt.

Checkboxen werden erst bei nachgewiesener Erledigung abgehakt. Eine bewusst verworfene Option erhält eine Begründung; sie wird nicht als umgesetzt ausgegeben.
