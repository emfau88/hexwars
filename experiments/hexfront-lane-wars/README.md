# HEXFRONT Lane Wars · Zentrale Front

Eine vollständige Partie Mensch gegen KI auf einer zentralen Lane: vier Fabrikplätze, zwei wählbare Startfabriken, die drei vorhandenen Robotertypen und unterschiedliche gegnerische Eröffnungen. Originalmodelle, Diorama-Landschaft und Keramik-HUD bleiben erhalten.

## Spielen

**[▶ Zentrale Front im Browser spielen](https://rawcdn.githack.com/emfau88/hexwars/65ba8647138cba8ec3f940160f21f0ca6be8bdf0/experiments/hexfront-lane-wars/index.html)** · **[Railgun: Sound, Doppelstrahlen und Tests](docs/railgun-sound/REPORT.md)**

**Aktuelle Einheitenwerte:** Railgun-Tempo **0,8**, Mech-Reichweite **3,0**, Drohnen-Tempo **1,8**. [Tests, Spielstände und Match-Ergebnisse](docs/central-role-tuning/REPORT.md).

Öffentlicher Laufzeitstand `65ba864`, ohne lokalen Server. Falls ein Hinweis erscheint: **Open the page** anklicken.

```powershell
node scripts/serve.mjs
```

[Lokale Partie](http://127.0.0.1:4181/) · [Kampflabor](http://127.0.0.1:4181/lab.html) · [M1.5-Demo](http://127.0.0.1:4181/m15.html)

Node.js ab Version 20 genügt zum Starten. Alle Ressourcen liegen im Experiment. „Zentrale Front spielen“ startet den Hauptmodus. Vorher kannst du einen Gegner und unter „Zwei Startfabriken wählen“ die Produktion festlegen. „Abwechselnde Strategien“ wechselt bei neuen Partien zwischen Eisenkeil, Vorhut und Aufbaukommando.

Unter „Weitere Missionen“ bleibt **Erste Front** als Einführung erhalten. Ihr Sieg schaltet unverändert die Zwei-Lane-Mission **Wiesenkrieg** frei. Getrennte lokale Spielstände bleiben unter `hexfront-lane-wars-campaign-v1` erhalten. „Neu“ ersetzt nach Bestätigung nur den ausgewählten Missionsspielstand.

## Bedienung und Werte des Hauptmodus

- **Fabrikkarte oder Gebäude:** bauen (120 Credits) oder umrüsten (30). Ein Auftrag gilt ab der nächsten gemeinsamen **20-Sekunden-Welle**. Neubauten erscheinen zunächst transparent; Korrektur und Storno erstatten die entsprechende Reservierung.
- **Wirtschaft:** einmalig 80 Credits, Einkommen steigt von 2 auf 3,2 Credits/s. Nach Bezahlung der beiden Startfabriken bleiben 40 Credits.
- **Sofortnachschub:** Typ antippen. Ein zusätzlicher Verband verlässt das HQ, kostet 80 Credits und hat 30 Sekunden Abklingzeit. Keine fortlaufenden manuellen Bestellungen nötig.
- **Menü / Leertaste:** pausieren oder fortsetzen. Auch Tabwechsel pausiert; keine Offline-Produktion.
- **Kamera:** Mausrad oder Plus/Minus, Ziehen zum Verschieben, ⌖ für Übersicht. Roboter anklicken zeigt ihre tatsächlichen Werte.
- **Smartphone:** „Fabriken & Wirtschaft“ öffnet die Verwaltung; Nachschub und Pause bleiben erreichbar. „?“ zeigt Hinweise. Die Frontanzeige lässt sich für Verstärkungsdetails aufklappen.

HQs haben in neuen zentralen Partien 800 LP und verursachen 2 Schaden/s. Ausrückende Einheiten kämpfen und sind angreifbar, sobald sie vor dem Fabriktor erscheinen. Der Mech schießt mit 3,0 Reichweite; Fernkämpfer haben jetzt 5,2 Reichweite (zuletzt von 4,8 angehoben; ältere Missionen und Kampflabor bleiben bei 4,0). Ausschließlich tatsächliche Angriffe beenden die Partie. Die älteren Missionen behalten ihre bisherigen 15-Sekunden-Wellen und Kosten; Wiesenkrieg zusätzlich seine kostenlosen Richtungspfeile und die Nachschubwahl per Drag/Tap auf eine Lane.

## Sichtbare Railgun-Schüsse

Leuchtende Rails beim Laden, kurzer heller Lichtstrahl und klarer Einschlag. Gameplay und Balance unverändert. [Effekte, Screenshots und Tests](docs/railgun-effects/REPORT.md).

## Animierte Railgun

Das freigegebene vierbeinige GLB ist im Spiel eingebaut: Walk, Idle, Charge, Attack, Hit und Death, mit einzelnen Gelenken, sichtbarer Ladung, synchronem Rückstoß und Zusammenbruch. **[Railgun-Animationen prüfen](https://rawcdn.githack.com/emfau88/hexwars/65ba8647138cba8ec3f940160f21f0ca6be8bdf0/experiments/hexfront-lane-wars/railgun-viewer.html)** · [GLB, Blender-Datei, Performance und Tests](docs/railgun-animation/REPORT.md). Die ursprüngliche [Modellfreigabe](railgun-preview.html) bleibt separat erhalten.

Reichweite in **Zentrale Front: 5,2 statt 4,8 (+8,3 %)**, auch beim Fortsetzen alter zentraler Standardspielstände. Aktuell gilt zusätzlich: Railgun-Tempo 0,8, Mech-Reichweite 3,0 und Drohnen-Tempo 1,8. Die größere Reichweite beeinflusst einige Referenzpartien deutlich; [Reichweiten-Audit](docs/railgun-sound/range-audit.json).

## Mech-Animation

Der originale Mech besitzt jetzt bewegliche mechanische Gelenke, Walk/Idle/Attack/Hit/Death und unabhängige Animationen im laufenden Spiel. [Animierten Mech drehen und prüfen](https://rawcdn.githack.com/emfau88/hexwars/1e8467ebb8fd74eeba4f33d15fcfc56e0362db1a/experiments/hexfront-lane-wars/mech-viewer.html) · [GLB, Blender-Datei, Performance und Testbericht](docs/mech-animation/REPORT.md). Gameplay und Fabrikmodell bleiben unverändert.

## Fabriken und Sofortnachschub

Der Nachschub-Cooldown in Zentrale Front beträgt jetzt **30 Sekunden** für beide Fraktionen, auch beim Fortsetzen älterer Spielstände. Kosten, Wellen und alle übrigen Spielwerte bleiben unverändert. [Prüfbericht](docs/SUPPLY-30.md).

Die neue **GLB-Fabrik ist im Spiel eingebaut**: vier animierte Torsegmente, sichtbarer Innenraum, Orange/Blau und drei austauschbare Produktionsmodule. [Integration und Tests](docs/factory-integration/REPORT.md) · [GLB und Blender-Quelle](docs/factory-model/REVIEW.md) · [Separate Modellansicht](factory-preview.html). Die Tore bleiben bei Robotern im Durchlass offen; Gameplay und Balance sind unverändert.

## Ergebnisse vor der Cooldown-Änderung (35 Sekunden)

**79 Logiktests**, **30 gezielte 3D-Browserfälle** an Fabrik-/HQ-Ausgängen und vollständige Build-/öffentliche Partien bestanden. Ein Sieg mit tatsächlichen HUD-Eingaben endet nach 6:59; Speichern/Fortsetzen, Niederlage, Neustart und Hochformat-Touch sind geprüft. Das Kampflabor besteht seine 14 Browserprüfungen; die alten Kampfabläufe bleiben durch Regressionstests abgesichert.

Die sechs reagierenden KI-Referenzpartien enden nach **5:27, 6:59 und 7:00**. Im breiten Audit bleiben jedoch **28 von 56 Läufen** nach zwölf Minuten offen (zuvor 14). Darin sind auch starre Pläne, Spiegelungen und Parameterkontrollen enthalten. Die Balance ist damit weiterhin nicht allgemein gelöst. [Details und Rohdaten](docs/DEPLOYMENT-COMBAT.md) · [GDD v0.3.1](docs/GDD.md).

**Bitte für die aktuelle Balance eine neue zentrale Partie starten.** Bestehende Spielstände erhalten Fabrikkampf und Mech-Reichweite ebenfalls, behalten aber ihre bisherigen HQ-Werte. Wirtschaft und Produktionsrhythmus bleiben unverändert. Der oben beschriebene Nachschub-Cooldown von 30 Sekunden gilt auch für diese Spielstände.

## Prüfen

```powershell
npm test
npm run test:factory-preview
npm run test:factory-game
npm run test:supply
npm run test:deployment
npm run audit:central
npm run build
npm run test:central-browser
npm run test:match
npm run test:mobile
npm run test:browser
npm run test:visual
```

Logiktests, Balance-Audits und Build brauchen keinen Browser. Für Browsertests: `npm ci`, gegebenenfalls `npx playwright install chromium` und laufender lokaler Server. Der eigenständige statische Build liegt in `dist/` und ist unter [localhost /dist/](http://127.0.0.1:4181/dist/) erreichbar. Mit `$env:MATCH_URL='http://127.0.0.1:4181/dist/'` lässt sich der vollständige Hauptmodus dort testen.

`window.__LANE_MATCH__` liefert Zustandskopien und Diagnosen. Nur `?qa=1` aktiviert die beschleunigte Testuhr mit derselben Simulation.

## Erhaltene Grundlagen

Sicherung vor Zentrale Front: `4dee21b`, Tag `codex/lane-wars-pre-central-front`. Der alte M1-Ablauf wird gegen eine eingefrorene Referenz pro Schritt geprüft; nur der neue Modus erhält eigene Einheitenwerte. Weitere Rollen lassen sich später über Profile und zugehörige Darstellung ergänzen. Jetzt gibt es keine zusätzlichen Einheiten, Gebäude oder Forschung.

Der Fernkämpfer bleibt ein Modellplatzhalter und der Mech verwendet weiterhin Ganzkörperanimation. Diese Erweiterung enthält keine neue Soundproduktion.

Historische Berichte: [M2.1](docs/MILESTONE-2.1.md), [Mobile-HUD](docs/MOBILE-HUD.md), [M2](docs/MILESTONE-2.md), [Fabrikausfahrten](docs/FACTORY-EXITS.md), [M1.5](docs/VISUAL-INTEGRATION.md).

**Railgun-Update:** Zwei gerade Strahlen aus den Rohröffnungen, Lade-/Schuss-/Einschlagsound und weiter entfernte Vorschau im Viewer. Ton im Viewer bzw. in den Spieleinstellungen abschaltbar. Zentrale Front: Reichweite jetzt **5,2**. [Umsetzung, Tests und Balancefolgen](docs/railgun-sound/REPORT.md).
