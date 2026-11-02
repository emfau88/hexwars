# HEXFRONT – Umsetzungsnachweis vom 2. November 2026

Arbeitsgrundlage: [Verbesserungsplan](hexfront-verbesserungsplan-2026-11-02.md).

## Bulk 0 – Abgeschlossen

- Ausgangscommit: `5f5f350`, Branch `codex/improve-mobile-onboarding-copy`.
- Bestehende Änderungen in README, Y8-Paketierung, BoardRenderer, CampaignAtlas, CampaignUI, Y8-Einstieg und Vite-Y8-Konfiguration wurden vor der Umsetzung gesichert. Neue Y8-Dateien und dieser Verbesserungsplan sind in der Quellsicherung enthalten. Die separaten Experimente und Anhänge werden nicht bearbeitet.
- Lokale Sicherung: `C:/Users/madde/.codex/visualizations/2026/11/02/01a19d14-df07-7753-bb22-2bff1ebecd3e/hexfront-implementation/baseline/`.
- Die Sicherung enthält 495 Quelldateien mit SHA-256-Inventar, den vorhandenen Git-Diff und das letzte vorhandene Kongregate-Komplettpaket.
- 27 Auditansichten und 20 zusätzliche Desktop-/Mobile-Aufnahmen fortgeschrittener Partien aller zehn Karten gesichert. Die Zustände der fortgeschrittenen Partien liegen als JSON daneben.
- Baseline erneut bestätigt: 124/124 Tests bestanden. Reproduktionsfälle und Größenmatrix stehen im Plan.
- Lokale Vergleichsbilder sind Entwicklungsevidenz; physische Geräte und der veröffentlichte Portalstand sind damit nicht geprüft.

## Bulk 1 – Abgeschlossen

- Auto-Nachschub zieht keine Truppen aus Feldern mit laufendem feindlichen Kampf oder einem konkret ankommenden feindlichen Angriff ab.
- Die Regel gilt identisch für Spieler und Gegner, einschließlich HQs. Nach Wegfall des Angriffs wird der normale Versand wieder möglich.
- Sichere Fronten versenden weiterhin Überschuss. Manuelles Senden unter Angriff bleibt möglich.
- Fünf neue Regressionstests: vier reproduzierten vor der Korrektur den Fehler, danach bestanden alle fünf. Beide Eigentümer, Verteidigungsausgang, ankommender Angriff, Wiederaufnahme und manuelle Entscheidung sind abgedeckt.
- Prüfung: Typprüfung bestanden; gesamte Suite 129/129 bestanden. Die vorhandenen Balance-/Guardian-Regressionen bleiben grün.
- Checkpoint: `hexfront-implementation/bulk-1/` neben der Baseline-Sicherung. Neue Tests sind separat gesichert; der bestehende fremde Git-Diff wird beim Rückbau nicht pauschal verworfen.

## Bulk 2 – Abgeschlossen

- Zielauslastung berücksichtigt alle eingehenden eigenen Truppen und bereits im selben Takt versandte Verstärkungen.
- Bei späterer Überfüllung wird nur der verfügbare Platz belegt. Der Rest kehrt als sichtbarer Transport über eigene Felder zurück; bei vollständig gefülltem Gebiet wartet er bis wieder Platz entsteht.
- Ein vollständig abgeschnittener Transport kämpft am verlorenen Wegpunkt, statt ohne Kampf zu verschwinden. Rückführungen erhalten einen Pfeil, wartende Transporte ein Pausenzeichen. Die Befehlsvorschau warnt vor erwartetem Überlauf in EN/DE.
- Acht zusätzliche Transporttests: sechs scheiterten am alten Verhalten, alle bestehen nach der Korrektur. Gleichzeitige Quellen, alle Versandarten, Rückweg, volle Gebiete und unterbrochene Wege sind abgedeckt.
- Typprüfung und Gesamtsuite: 137/137 bestanden. Lokaler Browsercheck: 128 eigene Einheiten vor Versand, nach Teilankunft und nach Rückkehr; Ziel maximal 68, kein Browserfehler. Screenshot `hexfront-implementation/bulk-2-return.png`.
- Die neue Verlustfreiheit ist eine bewusste Regelkorrektur und wird in Bulk 9 erneut auf Kampagnenbalance geprüft.

## Bulks 3–6 und vorgezogener Bulk 8 – In Arbeit

- Vorwärtsregel während BFS statt nachträglichem Verwerfen; Routenfälle auf Level 4–10, Verlust/Rückeroberung, Zielbedarf und Halten-Regel gezielt bestanden.
- Wegsuche: 120 Versorgungsschritte auf weitgehend eigener Level-8-Karte; Median 3,76 ms, p95 6,95 ms auf diesem Rechner.
- Der Level-6-Profilbericht erfasst nun auch Niederlagen vor Erreichen beider oberen Flanken. Bestehende strategische Vergleiche bleiben grün: westlicher Wächter weiterhin besser als östliche Variante und mindestens so viele Siege wie ohne Wächter.
- Nutzerhinweis zur Balance: Die bisherigen Profile sind nur Heuristiken. Der vorhandene separate Doomstack-Bot verwendet einen kürzesten Weg nach Feldanzahl und sendet schon ab zwei Einheiten. Er prüft kein gezieltes Ansparen und keine kostengünstigste Eroberungsroute. Bulk 9 wurde entsprechend erweitert; keine automatische Abschwächung aufgrund einer Bot-Niederlage.
- Gemeinsame Bedienleiste außerhalb der Karte: Nachschubschalter, Zeit/Phase und Halten für ausgewählte Felder. Einstellung bleibt bei Neustart, Missionswechsel und Reload erhalten.
- Tap/Tap-Befehle und Tastatursteuerung ergänzt. Echte Pause mit Fortsetzen, Sprache/Ton, explizitem Neustart/Verlassen; Fokusverlust pausiert. Erste Versorgung erhält einen konkreten Hinweis.
- Kommandopanel in die Seitenleiste verschoben; Kompaktlayout bis 1150 Pixel. Hinweise und Befehlsvorschau außerhalb der Karte. Feldzahlen werden nach Gebäuden, Verbindungen und Effekten gezeichnet; Mindestschrift 14 Bildschirmpixel. Kleine HQ-Schildwerte erhalten eine kompakte lesbare Anzeige.
- Speicherzugriff einschließlich werfendem localStorage-Getter geschützt; Sprachwechsel, Fortschritt, Audio und Bedienpräferenzen mit Sitzungsfallback und sichtbarem Speicherhinweis.
- 21 gezielte Logik-/Profil-/Speichertests bestanden. Erster Gesamtcheck: 150/151 bestanden; verbleibend war eine Quelltextprüfung auf die inzwischen entfallene Panel-Ausweichposition. Sie prüft nun die tatsächliche Unterbringung im Seitenpanel. Typprüfung bestanden.
- Browser: Halten, persistenter Nachschub, Pause/Fortsetzen, Sprachwechsel und Tap/Tap erfolgreich; keine Laufzeitfehler. Gesperrter Speicher auf 320×568 ebenfalls ohne Start-/Sprachfehler.
- Sieben Bildschirmgrößen geprüft; Kartenbegrenzungen bleiben innerhalb des Canvas. Bilder unter `hexfront-implementation/layout/`. Die Vollsuite und zusätzliche Gebäudezustände bleiben bis zum Abschluss offen.


## Zwischenstand vor der abschließenden Kartenprüfung

- 153/153 Logiktests vor Umstellung der Simulationsgeometrie bestanden. Danach ein veralteter Level-6-Vergleich eingegrenzt und an die reale Messung angepasst; erneuter Gesamtcheck steht aus.
- Browser-Vollsuite: 69 bestanden, 6 projektbedingt übersprungen, fünf Auffälligkeiten. Alle fünf gezielt nachgeprüft und bestanden. Darunter echter Tastaturfehler (Pfeilnavigation übersprang Nachbarfeld), korrigiert; übrige Erwartungen betrafen die absichtlich geänderte Panelposition, Kartengröße und Erklärungstexte.
- Vergrößerung 170 % auf 320×568 sowie Rückkehr zur Gesamtansicht geprüft; native Touch-Verschiebung aktiviert.
- Balance und Finale: siehe `improvement-balance-2026-11-02.md`. Nutzerhinweis zum Sammeln und kostengünstigen Erobern ausdrücklich in Tests umgesetzt.
- Nutzerkorrektur: Finale ist eine Eislandschaft. Der warme Entwurf wird nicht ausgeliefert. Eisbild v2 besitzt einen gezielt schmaleren See; finaler Geometriecheck läuft.

## Zwischenstand vor den Nutzerkorrekturen und der letzten lokalen Abnahme

- Gesamtsuite erneut ausgeführt: 153/153 Logiktests bestanden (`unit-release.txt`).
- Neuester vollständiger Browserlauf: 74 bestanden, sechs projektbedingt übersprungen, zwei veraltete Erwartungen zur ergänzten Zeichenebene `field-strength`. Nach Anpassung beide gezielt bestanden. Kein neuer vollständig grüner Gesamtlauf behauptet.
- Alle zehn Karten bei 320 und 1440 Pixeln in beiden Sprachen sowie acht Schildzustände geprüft. Ein Abstandskonflikt benachbarter Gebäudezahlen bei 320 Pixeln wurde korrigiert und visuell nachgeprüft.
- Eis-v2 ist integriert. Ein alter Neun-Level-Spielstand schaltet Level 10 frei; der Browser prüft den Übergang, den Abschluss 10/10 und das anschließende Neuladen. Die Sieg-Auslösung im UI-Test belegt den Abschlussablauf, nicht die Kampf-Balance.
- Zusätzlich eine frische automatisierte Kampagne mit echten Kämpfen über alle zehn Level gewonnen; Speichern, Neuladen und Freischaltung nach jedem Sieg geprüft (`fresh-campaign.json`). Ein vollständiger menschlicher Durchlauf bleibt offen.
- Kongregate-, Y8- und GameMonetize-Pakete wurden für lokale Produktionsprüfungen erzeugt. ZIP-Inhalte und Debug-Entfernung geprüft. Keine Veröffentlichung. Der Produktions-Browsertest hat Standard und Y8 erreicht, aber keinen abgeschlossenen Bericht für alle Varianten geliefert; GameMonetize und Einbettung gelten deshalb weiterhin als offen.
- Nutzer hat zu Recht auf die noch offenen Planpunkte bei bereits vorhandenen Paketen hingewiesen. Die ZIPs sind Testkandidaten, kein fertiger Release. Entwicklungs-Testlink: `http://127.0.0.1:5173/`. Der aktuelle Plan kennzeichnet interne Restprüfungen, physische Geräte, neue menschliche Spieler und tatsächlichen Portalbetrieb ausdrücklich.

## Nutzerfund: Holprige Truppenbewegung – korrigiert

- Ursache war eine in diesem Verbesserungspass ergänzte Darstellungsregel: Innerhalb eines festen Abstands zur Feldzahl wurde das Truppensymbol um `0,65 × Feldradius` nach oben versetzt. Beim Verlassen sprang es zurück. Die Simulation selbst bewegte sich dabei kontinuierlich.
- Vergleich mit der gesicherten Ausgangsdatei bestätigt: Vorher wurde der Transport direkt an `cx/cy` auf dem Weg zwischen Feldmitten gezeichnet. Dieses Verhalten ist wiederhergestellt. Normale Richtungswechsel entlang einer mehrteiligen Route bleiben erhalten; es gibt keine zusätzlichen visuellen Ausweichsprünge.
- Feldzahlen bleiben durch ihre zuletzt gezeichnete Ebene lesbar. Wartende Rücktransporte zeigen zusätzlich ihre Menge neben dem Wartesymbol, damit sie auch auf vollen Feldern erkennbar bleiben.
- Browservergleich mit gezielt wiederhergestellter Fehlerdarstellung: 31 Strecken auf zehn Karten, jeweils 390/1440 Pixel, 1.085 Positionsmessungen pro Durchlauf. Fehler vorher: maximal 26,195 Weltpixel Abweichung vom echten Weg und 27,989 Weltpixel Sprung pro 10-ms-Schritt. Nachher: null Abweichung, maximal die regulären 2,05 Weltpixel pro Schritt. Alle Transporte kamen genau einmal an, keine Browserfehler.
- Typprüfung und 16 gezielte Kapazitäts-/Routentests bestanden. Vergleichsskript und Messergebnisse: `hexfront-implementation/check-movement.mjs` sowie `movement-smooth/results.json`.
- Diese Korrektur ist im laufenden Entwicklungsserver verfügbar. Die zuvor erzeugten ZIPs enthalten sie noch nicht und werden erst nach Abschluss der verbleibenden lokalen Arbeiten erneut erstellt.

## Neuester Stand: lokale Abnahme und Kongregate-Diagnose

- Typprüfung und 162/162 Logiktests grün. Browser-Gesamtlauf 76 bestanden, sechs projektbedingt übersprungen; keine Fehler. Die anschließende Begrenzung externer Kongregate-Einbindungen auf tatsächliche Iframes wurde zusätzlich gezielt geprüft.
- 140 Matrixfälle: alle zehn Karten bei sieben Fenstergrößen in EN/DE, keine verdeckten Feldmitten oder horizontaler Seitenüberlauf. Evidenz `matrix-final/results.json`.
- Vorschau 100 % / 50 % / Gruppe, tatsächlicher erster Nachschubhinweis, Phasenwechsel 180/240 Sekunden, reduzierte Bewegung, Touchflächen, Touch-Abbruch, verlorenes Pointer-Capture und anschließendes Tap/Tap bei 320/1440 Pixeln in EN/DE geprüft. Evidenz `controls-final/results.json`.
- Drei zusätzliche Level-10-Logistiktests auf realer Geometrie: erst nach Landverbindung versorgter Relais-Brückenkopf, Umleitung um verlorenes Uferfeld und verlustfreie Überlauf-Rückführung.
- Aktuelle Produktions-Builds aller drei Varianten in separaten Prüfverzeichnissen erstellt. Start von Level 10, Pause/Fortsetzen, Nachschub, Sprache und Debugfreiheit bei 390/1440 Pixeln bestanden. Iframe mit normalem und gesperrtem Speicher bestanden. Evidenz `production-final/results.json`.
- Der frühere GameMonetize-Prüfaufbau verwies auf ein von der Paketierung entferntes Staging-Verzeichnis; die aktuellen Prüfungen verwenden vorhandene getrennte Build-Verzeichnisse. Ein künstlich abgefangener Iframe-Testhost wurde von Chromium als unbekannte Netzwerkzone blockiert; ein tatsächlich ausgelieferter lokaler Testhost funktioniert. Das sind korrigierte Prüfaufbauten, keine verschwiegenen Spielfehler.
- Kongregates öffentlich ausgelieferte HTML-/JS-Dateien geprüft: SDK dort vorhanden, aber Hostprüfung akzeptiert die echte `game324999.konggames.com`-Adresse nicht. Lokal fehlen außerdem SDK-Lader und Login-Neuübertragung. Korrigiert und durch acht gezielte Tests plus Browserablauf mit SDK-Ersatz abgesichert. Report: `kongregate-statistics-audit-2026-11-02.md`.
- Keine neuen Upload-ZIPs erstellt. Vorhandene ZIPs enthalten die Nutzerkorrekturen noch nicht; kein Upload/keine Veröffentlichung. Menschliche Spieltests, physische Geräte und tatsächliche Portal-Annahme bleiben offen.
- Aktuelle Ansichten unter `qa/improvement-level10/current-ice-*-de.png`; Änderungsübersicht in `improvement-release-notes-2026-11-02.md`. Der Verbesserungsplan wurde entsprechend nachgeführt.

## Branch-Sicherung und öffentliche Handy-Testvorschau

- Spieländerungen, Tests, Assets, Verbesserungsplan und manuelle Testcheckliste sind als `b46c11e` auf `codex/improve-mobile-onboarding-copy` gesichert und gepusht. Bestehende separate Experimente und Chat-Anhänge wurden nicht aufgenommen.
- Auf Nutzerwunsch wurde eine unabhängig auf dem Handy erreichbare Browser-Vorschau erstellt. Die 106 Laufzeitdateien entsprechen bytegenau dem zuvor geprüften Standard-Produktions-Build; Debugfunktionen fehlen. Statischer Build unter `previews/hexfront-improvements-2026-11-02`, Vorschau-Commit `789a38c`.
- Der Playlink nutzt dieselbe githack-Vorschau wie andere Spielvarianten im Repository und ist auf diesen Commit festgelegt. Er steht oben in der Branch-README; die manuelle Testcheckliste ist unmittelbar daneben verlinkt.
- Den echten öffentlichen URL in Chromium bei 390/1440 Pixeln geöffnet, die reguläre Host-Zwischenseite bestätigt und Touch-Spielstart, Pause/Fortsetzen, Sprachwechsel, den alten 9/10-Spielstand und das Eis-Finale geprüft: keine Laufzeitfehler, keine fehlenden Assets. Die tatsächliche Hardwareprüfung bleibt beim Nutzer. Evidenz: `public-preview/results.json`.
- Kein Merge nach `main`, keine Änderung der GitHub-Pages-Auslieferung und kein Kongregate-/Y8-/GameMonetize-Upload. Die Vorschau dient der ausstehenden manuellen Abnahme; lokale beziehungsweise Portal-Spielstände werden nicht automatisch auf den Vorschauhost übertragen.

## Handy-Rückmeldung: Hinweisflackern und alle Karten

- Das Flackern wurde auf Level 4 reproduziert: Die undurchsichtige Befehlsvorschau lag exakt über der Hinweisfläche. Sie nutzt jetzt die vorhandene Statuszeile darüber; die Kartenhöhe bleibt während einer Aktion unverändert. Statusansagen werden nur bei geändertem Vorschautext aktualisiert.
- Typprüfung und zehn gezielte Browserchecks bestehen. Der neue Regressionstest prüft mehrere abgebrochene Ziehbewegungen und einen tatsächlichen Befehl auf Desktop und Mobil, einschließlich gleichzeitig lesbarer Anleitung und unveränderter Canvas-Geometrie.
- Alle zehn Karten in sieben Größen und DE/EN erneut geladen, vermessen und mit echter Ziehbewegung geprüft: 140 Fälle, keine Hinweisüberdeckung, keine überlaufende Befehlsvorschau, kein horizontaler Seitenüberlauf, keine Canvas-Verschiebung. Größen: 320×568, 360×800, 390×664, 390×844, 430×932, 768×1024, 1440×900. Externe Kongregate-SDK-Anfrage im lokalen Layoutcheck ersetzt.
- Frühere Durchläufe des Prüfskripts brachen bei neuen Browserkontexten durch vorübergehende Netzwerkfehler ab; sie gelten nicht als bestanden. Der abgeschlossene Durchlauf verwendet ein Browserfenster mit Größenwechseln und verzeichnet keine Laufzeitfehler.
- Ergebnisse und Empfehlungen pro Karte: `mobile-kartenpruefung-2026-11-02.md`; Rohwerte und Screenshot unter `qa/mobile-layout-2026-11-02/`. Level 1 bietet deutlich mehr Vergrößerungsreserve als die langen Missionen; Wächterkarten brauchen zusätzliche Schildränder.
- Kartenzoom, Spielgeometrie, Nachschub- und Kampfregeln bleiben für diesen Nachtrag unverändert. Größere Ausschnitte und kompaktere Bedienung sind dokumentierte Vorschläge, keine umgesetzten Features. Die erneute Abnahme am tatsächlichen Handy bleibt offen.
