# Meilenstein 1.5 – Ergebnis und visuelle Prüfung

Stand: 14. Oktober 2026. Die ausführbare Lane-Wars-Ansicht verbindet die unveränderte M1-Kampfsimulation mit der bestehenden HEXFRONT-Art-Direction. Es handelt sich um vorbereitete Gefechte, noch nicht um eine vollständige Fabrikstrategie.

## Vorschau und Bedienung

- Spiel: `http://127.0.0.1:4181/`
- Erhaltenes Labor: `http://127.0.0.1:4181/lab.html`
- Alle Screenshots und direkter Vergleich: `http://127.0.0.1:4181/review.html`
- Unabhängiger Start: `node scripts/serve.mjs` im Experimentordner. Node 20+, ohne Installation für Runtime/Headless-Tests. `npm run build` erzeugt den eigenständigen statischen Ordner `dist/`.

Gefecht auswählen, starten, pausieren und neu aufstellen. Mausrad/Plus/Minus zoomen, Ziehen verschiebt den Ausschnitt begrenzt. 55° und 70° sind umschaltbar. „Modelle ansehen“ oder ein angeklickter Roboter ermöglicht die Nahansicht; Fadenkreuz/Escape kehrt zur Übersicht zurück.

## Umgesetzt und bewusst abgegrenzt

Zusammenhängende Wiesenlandschaft mit Felsgruppen, kleinen Anhöhen, Gras, Farnen, Ruinen und wenigen inaktiven Technikrequisiten. Unten Orange, oben Blau; vier reservierte Bauflächen je HQ. Auf Nutzerwunsch längere, gespiegelte Routen: je **29,928 Welteinheiten** Mittellinienlänge. Die erste visuelle Fassung hatte nur etwa 20. Beide Routen haben dieselbe Länge und konstante Darstellungsprogression.

Die Simulation behält ihre unveränderten 30 Längeneinheiten. Querabstände werden zur Lesbarkeit doppelt so breit dargestellt. Reichweiten und Treffer werden ausschließlich im bisherigen Simulationsraum berechnet, niemals aus Felsen, der Kamera oder dem gerenderten Weltabstand. Das Gelände verschafft keiner Fraktion Vorteile. Die drei neuen Präsentationsszenarien staffeln ausschließlich ihre Startformation großzügiger; die ursprünglichen Laborszenarien bleiben unverändert.

Original-HQ, Original-Hover-Bot und Original-Mech mit erhaltenen Texturen und selektiven Fraktionsfarben. Hoverbewegung, Zielausrichtung, kosmetische Energieimpulse, Mech-Rückstoß, stärkerer Fernkampfschuss, Trefferreaktion und kleine Zerstörungsfragmente visualisieren reale Simulationsereignisse. Effekte berechnen keinen Schaden. Die Mech-Beine sind starr; das wird bei Auswahl ausdrücklich angezeigt. Der Fernkämpfer ist ein einfacher, erkennbar vorläufiger Platzhalter mit langen Waffenläufen.

Das HUD übernimmt Mixed-Squads-Keramik, Salbeitöne, warme Akzente, Systemschrift und die vorhandenen SVG-Symbole. Unimplementierte HQ-LP, Credits, Einkommen und nächste Welle zeigen Striche. Vier Fabrikkarten und Sofortnachschub sind deaktivierte Vorschau. Es gibt keine Produktionswellen, Käufe, Forschung, KI-Strategie, neuen funktionalen Gebäude oder zusätzlichen Einheitentypen. HQs werden in dieser Demonstration nicht angegriffen.

## Tatsächlich geprüfte Bilder

Alle neuen Bilder wurden mit Chromium aus der laufenden Anwendung aufgenommen und visuell angesehen. Die Referenzen wurden aus den vorhandenen Branches übernommen und ebenfalls tatsächlich betrachtet.

| Datei in `visual-qa/` | Inhalt |
|---|---|
| `01-battlefield.png` | Vollständiges Feld, 1440 × 900, normaler Zoom, 55° |
| `02-tactical.png` | Dasselbe Feld mit 70°-Taktikkamera |
| `03-models-orange.png` | Originalmodelle und Platzhalter, orange Nahansicht |
| `03b-models-blue.png` | Blaue Modelle, Keramikdetails bleiben erhalten |
| `04-combat.png` | Gleichzeitige gemischte Gefechte auf beiden Lanes bei 8,10 s |
| `05-hud-combat.png` | HUD und Gefechte bei 10,70 s |
| `08-combat-closeup.png` | Nahansicht während des Kampfes |
| `09-reference-comparison.png` | Direkter Vergleich Mixed Squads / Lane Wars, beide 70° |
| `06-compact.png` | Kompakter Desktop, 1100 × 750 |
| `07-mobile.png` | Hochformat-Kontrolle, 390 × 844 |

Die erste Sichtprüfung führte zu konkreten Korrekturen: mehr horizontale Wegausdehnung; längere statt kurzer fast gerader Routen; größere seitliche Darstellungsabstände; großzügigere Demo-Startformation; etwas größere Drohnen; Innenausrichtung der HQ-Zugänge; Auswahlkarte in Nahansichten rechts und keine schwebenden Lane-Beschriftungen über Modellen.

Im normalen 1440 × 900 / 55°-Ausschnitt wurden die tatsächlichen Mesh-Vertices projiziert: Drohnen ungefähr **22–24 px breit / 27–30 px hoch**, Mechs **34–44 / 44–47 px**, Fernkämpfer **46 / 41–45 px**. Das sind projektierte Silhouetten, keine pauschalen Bounding-Box-Ecken. Beide HQs liegen vollständig im freien Bildbereich: Blau ungefähr y=107–242, Orange y=639–751. Die Zahlen ergänzen die Sichtprüfung; sie beweisen allein keine gute Gestaltung.

## Technische Ergebnisse

- **26/26 Headless-Tests bestanden**: alle 22 bestehenden M1-Tests plus Prüfsummen, gleiche Routenlängen/Progression, variable Zeitschritte der Präsentationen und gespiegelte Lane-Ergebnisse.
- **2.025 Balance-Gefechte** erneut ausgeführt, keine Spiegelungsfehler oder ungelösten Kämpfe. `balance-results.json` ist bytegleich mit der M1-Ergebnisdatei: SHA-256 `bb4a37c9de5fb75eafc649c4a0e945b8ac8ccf5b67b4a3217ed1215f45a15528`.
- `rules.js`, `simulation.js`, `scenarios.js` bytegleich zur abgeschlossenen M1-Basis; gespeicherte Prüfsummen in `core-baseline.json`.
- **14 Labor-Browserprüfungen bestanden**, darunter alle sieben Gefechte mit exakt gleichen Ergebnissen wie ohne Browser.
- **12 Prüfgruppen der neuen Browseransicht bestanden**, darunter reale Wiedergabe/Pause, Auswahl, Nahansicht, beide Kameras, sichere Gesamtansicht, Modellgrößen, Ereigniseffekte, inaktive Vorschau-Elemente, kompakter Desktop, Labor-Rückweg und sechs exakt gleiche Lane-Ergebnisse.
- Keine JavaScript-Konsolenfehler oder fehlgeschlagenen Requests in diesen Prüfungen. Chromium 151.0.7922.34. Nachweise: `qa/browser-results.json`, `visual-qa/browser-results.json`, `visual-qa/capture-errors.json`.
- Übersicht: 68 gemeldete Draw Calls, 805.435 gerenderte Dreiecke, 16 Texturen. Wiederholte Roboter/Felsen/Pflanzen verwenden Instancing und geteilte Materialien. Im pausierten Zustand zeichnet die Szene nur bei Änderungen neu. Das ist eine Messung dieses Szenarios, **kein** Leistungsnachweis für spätere unbegrenzte Produktion.
- Alle Runtime-Dateien sind lokal in der neuen Variante. Kein Importpfad und kein Browserrequest führt zu Mixed Squads, HEXFRONT 3D oder einem CDN. Die vorhandenen Referenzen werden nicht verändert.
- Der eigenständige `dist/`-Build wurde anschließend aus dem Ziel-Worktree mit denselben zwölf Browser-Prüfgruppen erfolgreich geprüft: `visual-qa/production-browser-results.json`. Ein erster Durchlauf meldete zwei `ERR_ABORTED`-Anfragen für das Hover-Bot-GLB, obwohl Modell- und Gefechtsprüfungen erfolgreich waren. Im gezielt instrumentierten Wiederholungslauf trat das nicht erneut auf; seine genaue Ursache ist nicht nachgewiesen. Die Fehler wurden nicht ausgefiltert und es wurde dafür keine Änderung am Spiel vorgenommen.

Die vorbereitete Begegnung endet nach 17,45 Simulationssekunden: Westen Blau, Osten Orange; die getauschten Aufstellungen liefern gespiegelten Schaden und Überlebende. Das ist eine Demonstration desselben Regelwerks, keine neue Matchdauer- oder Wirtschaftsbalance.

## Kritische eigene Bewertung

Die neue Ansicht trägt die HEXFRONT-Identität: dieselben detaillierten Robotermodelle und Farbakzente, dieselbe Fels-/Wiesenfamilie, warmes Licht und ruhiges Keramik-HUD. Das Feld hat keine Brettkante und keine Hex-Eroberungslogik. Beide Lanes sind im normalen Desktopausschnitt nachvollziehbar; die Verbände verteilen sich deutlich breiter als auf der Laborbahn. Die 55°-Ansicht macht Körper und Waffen besser lesbar als die stärkere Draufsicht.

Noch sichtbar vorläufig: Der Fernkämpfer wirkt neben den texturierten GLBs einfacher und sauberer. Mechs gleiten mit Ganzkörperbewegung statt sauberem Fußkontakt. Treffer und Zerstörungen sind zurückhaltende geometrische Effekte; Lauf-, Gelenk- und ausgearbeitete Todesanimationen fehlen. Die kleinen Ruinen sind weniger detailliert als HQ und Roboter. Der Bodenatlas wirkt in starker Nahansicht weicher als die Robotertexturen.

Die Landschaft ist absichtlich weitgehend übersichtlich. Sie erreicht die Material- und Farbfamilie der Referenz, besitzt aber noch nicht deren aufwendige Felsplateau-Architektur. Dichte Schwärme können sich während des Kampfes teilweise überlagern; die M1-Abstandsregeln wurden dafür nicht verändert. Bei 1100 × 750 bleiben alle Bedienelemente nutzbar, doch Drohnen werden kleiner. Im schmalen Hochformat ist die Gesamtsicht keine ausreichende Modellansicht; dort ist Zoom nötig. PC-first bleibt die Zielplattform dieses Meilensteins.

Damit ist die visuelle Integration als prüfbare Desktop-Vorschau umgesetzt. Die angeführten Grenzen bleiben offen und werden nicht als fertige Animation oder finales Modell kaschiert. Die Bilder und die laufende Vorschau ermöglichen die gestalterische Abnahme durch den Nutzer.

## Fehlende Modelle und Animationen

1. Finales Fernkampf-GLB mit dem gewünschten Konzept, Materialdetails und Waffenpivots. In den geprüften Referenzbranches gibt es kein entsprechendes GLB.
2. Mech: Gelenkaufbereitung/Retopologie, Rig, Gewichte, Idle/Walk/Turn/Fire/Hit/Death-Clips und Fußkontakt. Geladenes GLB hat 1 Mesh, 0 Skins, 0 Animationsclips.
3. Vollständige HQ-Radar-/Hangar-/Ausfahrtsanimation, getrennte Waffenbewegungen, ausgereifte Treffer-/Zerstörungssequenzen und Audio.
4. Echte sichtbare Fabrikgebäude mit Ausfahrten, erst im ausdrücklich späteren Fabrikmeilenstein.

Details und Herkunft aller übernommenen Bestandteile stehen in `ASSET-INTEGRATION.md`.

## Entwicklungsstand und Ablage

Geprüfter Zielbranch: `codex/lane-wars`, Ausgangs-HEAD `f187bc3`. Zielordner im vorhandenen Worktree: `C:/Users/madde/.codex/worktrees/lane-wars/hexwars/experiments/hexfront-lane-wars`.

Der ältere, unvollständige Lane-Wars-Produktionsentwurf wurde unverändert als `experiments/hexfront-lane-wars-before-m15` im selben Worktree gesichert. Das abgeschlossene M1-Labor aus dem aktuellen Chat liefert die Kampfgrundlage; eine identische Arbeitskopie der neuen Variante bleibt im aktuellen Chat-Workspace erhalten. Der Chat-Workspace selbst bleibt auf seinem bestehenden Branch `codex/improve-mobile-onboarding-copy`. Keine Branch-Umschaltung und kein Merge nach main. Commit und Push des Lane-Wars-Stands erfolgen auf ausdrücklichen Nutzerauftrag auf `codex/lane-wars`. Die bestehenden Mixed-Squads-/HEXFRONT-3D-Dateien und die getrackten Hauptspiel-Dateien bleiben unverändert.
