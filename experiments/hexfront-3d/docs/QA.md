# QA, Abgabe und offene Qualitätsziele

Geprüft am 11.10.2026. **Spielbarer Einzel-Level-Prototyp; keine vollständige Abnahme als Premium-Grafik oder als 60-FPS-Mobile-Spiel.** Das Referenzniveau von Tacticus wird ausdrücklich noch nicht erreicht.

## Nachgewiesene Funktion

- `npm test`: **12 von 12 bestanden**. Kartenumfang, verbundener Bewegungsgraph, ausschließlich vier Rampenübergänge, lückenlose Rampenoberflächen, abgewiesener Klippenbefehl ohne Zustandsänderung, eigene Zwischenfelder, abgefangene Konvois, Höhen-/HQ-Bonus ohne Doppelzählung, Einheitenkonservierung, Relaisproduktion, Pause, Sieg, Niederlage und vollständiger Reset.
- `npm run build`: **bestanden**, 28 statische Dateien, 1.52 MiB unkomprimiert. Alle referenzierten glTF-Bilder und Binärpuffer vorhanden. Keine externe CDN-Abhängigkeit. Diagnose-API und manuelle Uhr im Produktions-Build deaktiviert.
- Chromium **151.0.7922.34**, Playwright **1.62.1**, Node **22.17.1**. Desktop mit 1366 × 768; emuliertes Touch-Portrait mit 390 × 844, jeweils DPR 1.
- Auf **beiden** Ansichten: Anleitung öffnen/schließen, Operation starten, pausieren/fortsetzen, tatsächlicher Raycast auf eine unpassierbare Höhenkante mit Fehlermeldung, komplette Partie über Maus-/Touchklicks, Sieg, Neustart, eigenständiger KI-Sieg bei ausbleibender Gegenwehr, erneuter Neustart, Zoom/Zentrieren und Qualitätsumschaltung.
- Kein horizontaler Überlauf; Befehlsfläche innerhalb des sichtbaren Viewports. Die angeklickten Anzeigen werden auf Sichtbarkeit und freie Klickmitte geprüft. Keine JavaScript-Fehler oder fehlgeschlagenen HTTP-Assetantworten im erfolgreichen lokalen Durchlauf.

| Prüfung | Desktop | Touch-Portrait |
| --- | ---: | ---: |
| Sieg nach normaler Startaufstellung | 238.30 s | 238.30 s |
| Menschliche UI-Befehle im Siegmatch | 47 | 47 |
| KI-Befehle im Siegmatch | 35 | 35 |
| Niederlage ohne Gegenwehr | 239.55 s | 239.55 s |
| KI-Befehle im Niederlagenmatch | 37 | 37 |
| Initiale lokale Bereitschaft, Testlauf | 2,419 ms | 2,164 ms |

Die Uhr im vollständigen Matchtest wird in normalen 50-ms-Simulationsschritten zwischen echten UI-Befehlen fortgeschaltet. Etwa alle fünf Spielsekunden erfolgt eine Entscheidung mit den vorhandenen 50-%-/Alle-minus-eins-Befehlen. Weder Garnisonen noch Sieger werden manipuliert. Die End-to-End-Prüfung ersetzt keine vierminütige manuelle Spielsession; der separate Produktions-Smoke-Test belegt zusätzlich, dass reale Uhr, Maus-/Touchbefehle und Pause ohne Diagnosezugang funktionieren.

Die Simulationstests verwenden eine leicht andere Befehlsfolge und erreichen den Sieg nach 265.0 s mit 52 Befehlen; Niederlage nach 239.6 s. Damit liegt eine plausible Strategie im Zielkorridor von 3–6 Minuten. Eine robuste menschliche Balance-Studie ist das noch nicht. Sehr schnelles Flankieren und längere Verteidigung können andere Matchzeiten erzeugen.

## Tatsächlich geprüfte Bilder und Nachbesserungen

[Desktop](screenshots/desktop.png) und [Mobile](screenshots/mobile.png) stammen aus dem **lokal ausgelieferten Produktions-Build**, der dateigleich hochgeladen wurde. Es sind echte WebGL-Screenshots bei den oben genannten Viewports, keine bearbeiteten Bilder. Die Startansicht wurde zur klaren Beurteilung des Dioramas gewählt.

Zusätzliche Nachweise: [Desktop im Match](screenshots/desktop-battle.png), [Mobile im Match](screenshots/mobile-battle.png), [Sieg](screenshots/desktop-victory.png), [Niederlage](screenshots/mobile-defeat.png).

Alle diese Bilder wurden geöffnet und visuell geprüft. In den Iterationen wurden verkehrte Terrain-/Klippenflächen, rote statt olivgrüne Blattmasken, mobile Feldüberlagerungen und ein zu tiefer Desktop-Infobereich korrigiert. Die beiden Rampen, drei Höhenstufen, Felswände und aufliegenden Gebäude sind sichtbar. Verschobene Touch-Anzeigen besitzen Zuordnungslinien zur projizierten Oberfläche. Die komplette mobile Partie wurde nach dieser Korrektur wiederholt und bestanden.

## Performance: begrenzter Nachweis

Die Testumgebung meldet **ANGLE / Vulkan / SwiftShader Device (Subzero)**, also Software-Rendering. Im automatisierten Messfenster nach Neustart und Pause:

| Messwert | Desktop | Touch-Portrait |
| --- | ---: | ---: |
| Median rAF-Abstand, 120 Intervalle | 166.7 ms | 133.3 ms |
| 95. Perzentil | 183.4 ms | 133.4 ms |
| Gemeldete Render-Aufrufe | 119 | 119 |
| Dreiecke | 74,134 | 74,134 |

Das entspricht ungefähr 6 beziehungsweise 7.5 Frames pro Sekunde in **dieser** Software-Umgebung und verfehlt das 60-FPS-Ziel hier deutlich. Die Werte sind keine Messung eines Hardware-beschleunigten Smartphones und auch kein Benchmark während maximaler Kampflast. Es wäre falsch, daraus 60 FPS auf anderer Hardware abzuleiten. **Flüssige reale Geräteperformance bleibt eine offene Abnahmeanforderung.**

Statische Material-Batches, instanzierte Fahrzeuge, kleine Modell-/Texturauswahl und DPR-Begrenzung sind umgesetzt. LQ reduziert DPR auf 1 und Schatten auf 1024 statt 2048 Pixel. Der Nutzen auf schwachen echten Geräten muss noch gemessen werden. Die lokale Produktions-Smoke-Prüfung benötigte 4,213 ms / 3,526 ms bis zur Bereitschaft, während weitere Tests liefen; dies ist keine zugesicherte Netzwerk-Ladezeit.

## Veröffentlichung und Repository-Sicherheit

Preview: **https://hexfront-3d-diorama.vercel.app/**

Vercel bestätigt Deployment `dpl_63mDCqc8J9HZeCJhTm1NYqZKXphh` als **READY**, Projekt `hexfront-3d-diorama`. Eigenständiges statisches Projekt ohne Git-Anbindung, keine Änderung an der bisherigen Pages-Veröffentlichung. Datei-Hashes der hochgeladenen Laufzeit sind in [production-files.json](qa/production-files.json) dokumentiert; die über die Hosting-API einsehbaren Quell-Hashes stimmen überein.

**Der öffentliche Browserzugriff ist hier nicht abschließend verifiziert:** Shell-Chromium meldet DNS-Auflösungsfehler, der integrierte Browser `ERR_ADDRESS_UNREACHABLE`; die zusätzliche Hosting-Fetch-Funktion scheitert mit 403 beim Lesen der Alias-Berechtigung. Die Projektabfrage meldet keinen Passwort- oder SSO-Schutz. Es wurde keine bestehende Zugriffsbeschränkung geändert. Der lokale Produktions-Build wurde deshalb gesondert geprüft; die README verschweigt diese Grenze nicht.

GitHub verweigert sowohl Blob- als auch Branch-Schreibzugriff mit **403 / Resource not accessible by integration**. Der vorhandene GitHub-CLI-Zugang meldet ein ungültiges Token; direktes Git-HTTPS scheiterte bereits an der DNS-Auflösung. Solange kein funktionierender Schreibzugang besteht, sind Branch und README **nur lokal** gespeichert. Der lokale Experiment-Branch enthält die fertigen Dateien und lässt sich nach Erneuerung des Zugangs veröffentlichen. Es wird kein existierender Remote-Branch überschrieben und nichts nach `main` gemergt.

Die vorhandenen Root-Scripts, Workflow-, Portal- und Hauptspiel-Dateien bleiben unverändert. Einzige Änderung außerhalb des Experiment-Ordners ist der ausdrücklich gewünschte Link mit Screenshots in der Root-README auf dem Experiment-Branch.

## Noch fehlender Qualitätsumfang

- Die regelmäßigen hexagonalen Klippen benötigen stärker individuell modellierte Felsübergänge und handgesetzte Vegetation. Der nicht spielbare Außenrand ist ebenfalls zu geometrisch.
- Bodenmischung, Ruinen-Dichte, Gebäudedetails, Schattenkontakt und lokale Blickführung erreichen noch kein ausproduziertes Premium-Diorama. Der Aufbau ist absichtlich klein und konsistent, aber keine Tacticus-nahe Art-Abnahme.
- Fahrzeuge sind stilisierte zusammengesetzte Miniaturen. Figurenanimationen, ausgearbeitete Treffer-/Eroberungssequenzen und Audio fehlen.
- Echte Android-/iOS-Geräte, Safari, GPU-/Temperaturverhalten, lange Touch-Sessions und Barrierefreiheit für Tastatur/Screenreader sind nicht umfassend getestet. Das Spiel benötigt WebGL 2.
- Genau ein Level, einfache deterministische KI, kein Speicherstand und kein Multiplayer. Diese Punkte sind bewusste Umfangsgrenzen.

Nächster sinnvoller Entwicklungsschritt: **Environment-Art und GPU-Profiling dieses einen Levels**, anschließend mehrere menschliche Touch-Playtests. Weitere Systeme oder Karten würden die offenen Kernfragen derzeit nicht beantworten.

Maschinenlesbare lokale Nachweise: [vollständige Browserprüfung](qa/browser-report.json), [Produktions-Smoke-Test](qa/production-local-report.json).
