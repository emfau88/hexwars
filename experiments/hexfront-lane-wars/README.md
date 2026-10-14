# HEXFRONT Lane Wars · Meilenstein 2.1

Eine spielbare Kampagne Mensch gegen KI mit **Erste Front** (eine Lane) und **Wiesenkrieg** (zwei Lanes). Die vorhandenen HEXFRONT-Modelle, Diorama-Materialien und das Keramik-HUD bleiben erhalten.

## Spielen

**[▶ M2.1 im Browser spielen](https://rawcdn.githack.com/emfau88/hexwars/60aaf1f6b893b3a607040571363c3fd50bb1a6e2/experiments/hexfront-lane-wars/index.html)** · **[Screenshots und Nachschubvideo](https://rawcdn.githack.com/emfau88/hexwars/60aaf1f6b893b3a607040571363c3fd50bb1a6e2/experiments/hexfront-lane-wars/m21-review.html)**

Öffentliche Vorschau des Kampagnenstands `60aaf1f`, ohne lokalen Server. Falls ein Hinweis erscheint, **Open the page** anklicken.

```powershell
node scripts/serve.mjs
```

**[Kampagne lokal spielen](http://127.0.0.1:4181/)** · [Bilder und Nachschubdemo](http://127.0.0.1:4181/m21-review.html) · [Kampflabor](http://127.0.0.1:4181/lab.html) · [M1.5-Demo](http://127.0.0.1:4181/m15.html)

Für die lokalen Links wird der Server benötigt. Node.js ab Version 20 genügt; sämtliche Spielressourcen liegen im Experiment, ohne CDN oder Abhängigkeit von anderen HEXFRONT-Varianten.

**Kampagne starten** beginnt sofort mit einer Drohnenfabrik. Ein Sieg in Erste Front schaltet Wiesenkrieg frei. Eigene Spielstände je Mission und Fortschritt bleiben lokal im Browser unter `hexfront-lane-wars-campaign-v1` erhalten. **Neu** ersetzt nach Bestätigung nur den gewählten Missionsspielstand.

## Bedienung

- **Fabrikkarte:** Typ bauen oder umrüsten. Neubauten erscheinen sofort transparent. Aufträge gelten ab der nächsten 15-Sekunden-Welle und sind bis dahin korrigierbar/stornierbar.
- **← WEST / OST →:** am Gebäude oder in der Karte kostenlos die nächste Produktionsrichtung wechseln. Bestehende Roboter behalten ihre Lane.
- **Nachschub:** Robotersymbol auf einen Weg ziehen; alternativ Typ antippen und anschließend Straße oder Frontanzeige antippen. In Erste Front genügt der Typ. 60 Credits, 15 Sekunden Abklingzeit, tatsächlicher Start am eigenen HQ.
- **Wirtschaft:** einmalig 80 Credits für dauerhaft +1 Credit/s. Fabriken produzieren ohne weitere Bestellungen.
- **Menü / Leertaste:** pausieren bzw. fortsetzen. Tabwechsel pausiert ebenfalls. Keine Offline-Produktion.
- **Kamera:** Plus/Minus oder Mausrad zoomt; Ziehen verschiebt; ⌖ zeigt die Übersicht. Diorama/Taktik und Modellbewegung stehen in den Einstellungen.
- **Roboter anklicken:** echte Lebenspunkte und Reichweite ansehen.

Das gegnerische HQ muss durch Angriffe zerstört werden. Kein künstliches Zeitlimit. [GDD mit freigegebener M2.1-Ergänzung](docs/GDD.md) · **[Ergebnisse, Teststatus und offene Schwächen](docs/MILESTONE-2.1.md)**.

## Prüfen

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

Die ersten drei Befehle benötigen keinen Browser. Für Browsertests einmalig `npm ci` und gegebenenfalls `npx playwright install chromium`; der lokale Server muss laufen. `build` erzeugt einen eigenständigen statischen Build in `dist/`. Er ist über [localhost /dist/](http://127.0.0.1:4181/dist/) prüfbar. Browsertests lassen sich mit `MATCH_URL` auf diesen Build richten.

`window.__LANE_MATCH__` liefert Zustandskopien und Diagnosen. Nur `?qa=1` aktiviert die beschleunigte Teststeuerung mit derselben Simulation.

## Entwicklungsstand

- Sicherung vor M2.1: `1a40373`, Tag `codex/lane-wars-pre-m2.1`.
- M1-Kampfkern und Roboterwerte bleiben unverändert. Missions-HQ-Werte und KI-Taktung sind im Ergebnisbericht dokumentiert.
- Gleiche Ausfahrtszeit je Typ unabhängig von Fabrikplatz, Lane oder Fraktion.
- Lange Patts bleiben bei bestimmten starren Produktionsplänen möglich. Der Fernkämpfer ist weiterhin ein Platzhalter, der Mech besitzt kein artikuliertes Lauf-Rig.
- Der öffentliche Playlink oben zeigt die M2.1-Kampagne. Die [frühere M1.5-Vorschau](https://rawcdn.githack.com/emfau88/hexwars/c038ffed9718192a7249ec8764951d3f5d3293c2/experiments/hexfront-lane-wars/index.html) bleibt als historischer Stand erhalten.

Historische Berichte: [M2](docs/MILESTONE-2.md), [Fabrikausfahrten](docs/FACTORY-EXITS.md), [M1.5](docs/VISUAL-INTEGRATION.md).
