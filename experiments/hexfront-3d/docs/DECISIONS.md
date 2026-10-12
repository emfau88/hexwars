# Technische Entscheidungen

**Kamera-Nachtrag:** Die frühere Perspektive wurde durch 70° Taktik / 55° Diorama ersetzt. Kamera-Fit, Pan-Grenzen und Input-Korrekturen sowie der dokumentierte 60°/70°/80°-Vergleich stehen in [CAMERA.md](CAMERA.md). Spielregeln, KI, Leveldaten und Assets dieses Nachtrags bleiben identisch zum vorherigen Stand `622b485`.

## Ausgangspunkt

Geprüfter Repository-Stand: `29ff12d6897db9b994b97be980efb0037e54d476` (`main`, 24.09.2026).

Untersucht wurden insbesondere `src/core/GameState.ts`, `src/systems/{MovementSystem,CombatSystem,AISystem}.ts`, `src/rendering/{BoardRenderer,LandscapeRenderer,WorldGeometry}.ts`, Root-Package, README und `.github/workflows/pages.yml`.

Das Hauptspiel verwendet TypeScript, Vite und Canvas-2D. `BoardRenderer` arbeitet mit mehreren Canvas-Ebenen; `WorldGeometry` berechnet eine zweidimensionale Hex-Projektion. Das Echtzeitspiel besitzt bereits Bewegung, kontinuierlichen Kampf, Wachstum, Versorgungs- und Guardian/HQ-Systeme. `canSend` erlaubt grundsätzlich benachbarte spielbare Felder und unter bestimmten Bedingungen längere eigene Routen/Relaisbewegungen. Räumliche Höhenkanten sind nicht Bestandteil dieser Navigation. Der vorhandene `defenseMultiplier` behandelt Hügel mit 0,65 und Basen mit 0,82 als Schadensfaktoren. Eine direkte Übernahme plus zusätzlicher Höhenbonus würde falsche Bonuskombinationen riskieren.

Die ältere rundenbasierte Variante bleibt in `legacy/tactics`. Für diesen Versuch wäre ein erneuter Wechsel zu Runden mit Aktionen pro Einheit, Zuganzeigen und zusätzlichen Balanceregeln verbunden. **Gewählt wurde Echtzeit-Territoriumskontrolle**, damit sich der visuelle und topografische Mehrwert direkt mit dem bestehenden Spiel vergleichen lässt. Zwei Befehlsmengen und eine Bestätigung reichen für eine vollständige Partie.

## Eigenständiger kleiner Regelkern

Kein Umbau des Hauptspiels und keine neue gemeinsame Abstraktionsschicht. `map.js` definiert genau eine Karte und den Graphen, `game.js` die Simulation, `scene.js` das Diorama und `main.js` UI/Loop. Die Mechanik wird bewusst neu und kleiner implementiert; die Grundidee bleibt erhalten. Es gibt keine alten Guardian-Schilde, Supply-Boni, Relais-Teleports oder Kampagnenfunktionen im neuen Kern.

Simulation in 50-ms-Schritten; ein einzelner Update-Aufruf ist auf 100 ms begrenzt. Langsame Frames werden nicht durch große Bewegungssprünge übersprungen. Die Tab-Pause verhindert unbemerkte Niederlagen im Hintergrund. Nach einem Ergebnis läuft keine Simulation weiter. Ein vollständiger Neustart erzeugt den ursprünglichen Zustand neu.

KI und Mensch benutzen `route`, `traversable`, `send`, `forecast` und dieselbe Produktion. Die KI sieht den offenen Spielzustand, konzentriert Truppen, bewertet die legalen Wege zu HQ und Relais, berücksichtigt Höhenkosten und behält im eigenen HQ eine Reserve. Sie erzeugt keine Extraeinheiten. Orange erhält einen kleinen Startvorteil (HQ 40 gegenüber 36). Schwächere, aber ausreichende Angriffe sind erlaubt, damit eine gut verteidigte Basis durch mehrere Wellen fallen kann.

## Topografie

37 Axial-Hexe in Radius 3. Der mittlere Ring bildet eine zusammenhängende obere Festung auf Höhe 2. West- und Ostterrasse liegen auf Höhe 1; das Vorland auf Höhe 0. Je Aufstieg führen zwei geneigte Übergänge über die Zwischenterrasse. Ihre gemeinsamen Eckpunkte treffen sich auf derselben halben Stufenhöhe. Die tatsächliche Oberflächenhöhe wird baryzentrisch auf den sichtbaren Dreiecken ermittelt. Dieselbe Funktion platziert Fahrzeuge, Markierungen und Weglinien.

Zusätzlich gibt es einen **nicht spielbaren Umgebungsrand** aus Gelände und wenigen Fels-/Vegetationsgruppen. Er ist keine zweite Karte und erzeugt keine Einheiten. Zusammengehörige Geländeoberseiten berühren sich lückenlos; sichtbare Wände existieren nur dort, wo eine Fläche tatsächlich höher liegt als ihr Nachbar. Die verbleibende Regelmäßigkeit der Hex-Klippen ist eine bekannte visuelle Grenze.

## Grafik und Eingabe

Three.js wurde gewählt, weil der bestehende Browser-/JavaScript-Ansatz erhalten bleiben kann und reale Geometrie, orthografische Projektion, PBR-Materialien, glTF, Schatten und Raycasting ohne Engine-Export nutzbar sind. Die geprüfte r169-Version ist lokal versioniert. Ein einfacher statischer Kopier-Build genügt; es entsteht keine neue Abhängigkeit von der Root-Vite-Version oder einem CDN.

Art Direction: matte, verwitterte Militärarchitektur, graugrüner Stein, trockenes Erdreich, Olivgrün und sparsame Orange-/Blau-Erkennungsfarben. Warmes gerichtetes Licht mit kühler Füllung, kein Bloom. Eigene Boden-, Stein- und Metalltexturen werden deterministisch im Canvas erzeugt und als echte Materialmaps verwendet. HQs und Fahrzeuge bestehen aus zusammengesetzten, abgeschrägten Bauteilen mit Dachlamellen, Laufwerk, Antennen und Dienstanschlüssen.

Quaternius' Blattfarbmaske wird im Materialshader in eine Olivpalette übersetzt; Rot in dieser Maske war kein beabsichtigtes Laub. Modell-Vertexfarben für Windsteuerung werden nicht als sichtbare Färbung verwendet. Das fehlende Quellmaterial der Sci-Fi-Modelle wird ausdrücklich durch eigene Materialmaps ersetzt. Quellen und Änderungen stehen in `ASSET_LICENSES.md`.

Interaktion: Raycast gegen die echten geneigten Hex-Oberflächen, keine flache Bildschirm-zu-Hex-Näherung. Eine sichtbare Truppenzahl ist zusätzlich ein echtes HTML-Button mit fester Zell-ID. So kann die Gebäudehöhe die Auswahl nicht auf eine darunterliegende Zelle verschieben. Neutrale Zahlen erscheinen bei Hover oder als erreichbares Ziel; eigene/gegnerische Garnisonen bleiben sichtbar. Die letzte Befehlsbestätigung vermeidet unbeabsichtigte Touch-Angriffe.

## Checkout- und Veröffentlichungssicherheit

Der ursprüngliche Arbeitsordner war leer. Direktes Git-HTTPS scheiterte in der bereitgestellten Shell an der Namensauflösung, auch mit angefragtem Netzwerkzugriff. Der Quellstand wurde deshalb über die autorisierte GitHub-Anbindung gelesen. Für die lokale Entwicklung wurde ein sparsamer API-Checkout aufgebaut: Die originalen Git-Bäume und der signierte Ausgangscommit wurden anhand ihrer SHA-1-Hashes exakt verifiziert; nicht benötigte Bestandsdateien blieben als `skip-worktree` markiert. Auf dem GitHub-Branch bleibt immer der vollständige Originalbaum erhalten.

Der Code und alle neuen Assets liegen ausschließlich unter `experiments/hexfront-3d/`. Auf ausdrücklichen Wunsch wird zusätzlich die Root-README auf dem Experiment-Branch um Testlink und Screenshots ergänzt. Der Veröffentlichungs-Workflow und das Hauptspiel werden weder modifiziert noch gemergt. Der eigenständige Produktionsordner wird in einem neuen Vercel-Projekt ohne Git-Anbindung gehostet; dieses hat keine Verbindung zum bisherigen GitHub-Pages-Deployment.

Der ursprüngliche vollständige Touch-Test deckte überlagerte Feldanzeigen an Höhenkanten auf. Die Anzeige löst Kollisionen im Bildschirmraum einschließlich der vergrößerten Touch-Flächen. Feine Verbindungslinien ordnen verschobene Anzeigen weiterhin ihrer tatsächlichen Oberfläche zu. Im Kamera-Nachtrag wurden zusätzlich das Picking vor und hinter massiver Geometrie und die Projektion von Labels auf Rampen korrigiert. Spielpositionen und Navigation bleiben unverändert.
