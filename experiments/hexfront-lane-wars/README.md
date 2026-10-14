# HEXFRONT Lane Wars · Meilenstein 2

Vollständige 1v1-Partie Mensch gegen KI auf der erhaltenen M1.5-Diorama-Karte: zwei Lanes, vier Fabrikplätze, drei Robotertypen, Wirtschaft, gemeinsame 15-Sekunden-Wellen und echte HQ-Zerstörung. Der M1-Kampfkern bleibt bytegleich.

## Spielen

Im Verzeichnis `experiments/hexfront-lane-wars`:

```powershell
node scripts/serve.mjs
```

**[Partie öffnen](http://127.0.0.1:4181/)** · [Kampflabor](http://127.0.0.1:4181/lab.html) · [Erhaltene M1.5-Demo](http://127.0.0.1:4181/m15.html)

Der lokale Link benötigt den laufenden Server. Node.js ab Version 20 genügt; das Spiel lädt Modelle und Bibliotheken lokal, ohne npm-Installation oder CDN. `PORT` ändert bei Bedarf den Port. Der statische Build funktioniert auch auf einem beliebigen HTTP-Host.

[Ergebnisse, Matchprotokolle, bekannte Schwächen und Screenshots](docs/MILESTONE-2.md) · [GDD v0.2 mit freigegebener M2-Ergänzung](docs/GDD.md)

Die bisherige [öffentliche M1.5-Vorschau](https://rawcdn.githack.com/emfau88/hexwars/c038ffed9718192a7249ec8764951d3f5d3293c2/experiments/hexfront-lane-wars/index.html) zeigt ausdrücklich noch keine vollständige M2-Partie. M2 wurde lokal getestet; ein öffentlicher M2-Playlink ist nicht verifiziert.

## Bedienung

1. Die beiden Startfabriken über ihre Karten konfigurieren, ein KI-Profil wählen und **Partie starten**.
2. Credits werden automatisch verdient. Die vier Fabrikkarten öffnen Bau, Umrüstung und Lane-Zuweisung. Vorgemerkte Aufträge sind bis zur nächsten Welle korrigierbar oder gegen volle Erstattung stornierbar.
3. **Wirtschaft** erhöht das Einkommen einmalig. **Sofortnachschub** liefert gegen Credits einen Verband vom HQ-Ausgang; die Abklingzeit beträgt 15 Sekunden.
4. **Gegnerfabriken** zeigt die tatsächlich gebauten gegnerischen Fabriken. Eigene zukünftige Wellen werden je Lane angezeigt.
5. Ein zerstörtes HQ entscheidet die Partie. Die Ergebnisansicht erlaubt eine neue Partie.

Fabriken produzieren selbstständig, ohne wiederholte Bestellungen. Umrüstung und Lane-Wechsel gelten für zukünftige Wellen; vorhandene Roboter bleiben bestehen. Einheiten kämpfen automatisch. Es gibt keinen künstlichen Endtimer.

Leertaste startet/pausiert; Tabwechsel pausiert. Mausrad oder Plus/Minus zoomt, Ziehen verschiebt die Kamera. Fadenkreuz oder Escape zeigt die Übersicht, der Kameraschalter wechselt zwischen Diorama und Taktik. Roboter anklicken zeigt ihre echten Lebenspunkte.

## Prüfen und bauen

```powershell
npm test
npm run audit:matches
npm run audit:economy
npm run audit:late
npm run build
npm run test:browser
npm run test:visual
npm run test:match
```

Die ersten vier Befehle benötigen keinen Browser. Für Browserprüfungen einmalig `npm ci` und gegebenenfalls `npx playwright install chromium`; außerdem muss der Server laufen. `build` erstellt `dist/`. Mit laufendem Entwicklungsserver ist der statische Build unter [localhost /dist/](http://127.0.0.1:4181/dist/) erreichbar. `npm run preview` startet stattdessen einen Server direkt für den Build.

Die Match-Browserprüfung kann mit `$env:MATCH_URL='http://127.0.0.1:4181/dist/'` gegen den statischen Build laufen. Sie spielt vier vollständige Partien mit beschleunigter Testuhr, prüft echte UI-Befehle, Neustart und Browser-/Headless-Gleichheit. Sie ersetzt keine menschlichen Balance- oder Hardwaretests.

## Struktur und Grenzen

- `src/match.js`: Ressourcen, Aufträge, Wellen, Ausfahrten und HQ-Endspiel.
- `src/match-ai.js`: dieselben legalen Befehle, verzögerte öffentliche Wahrnehmung, drei Profile.
- `src/match-layout.js`, `factory-view.js`, `match-view.js`: reale Ausfahrtszeit, 3D-Fabriken und erhaltene Diorama-Darstellung.
- `src/match-main.js`, `match.css`: bedienbares Keramik-HUD.
- `src/simulation.js`, `rules.js`, `scenarios.js`: unveränderter M1-Kern, durch SHA-256 abgesichert.
- `lab.html`: separates Kampflabor. `m15.html`: erhaltene M1.5-Demo.
- Git-Tag `codex/lane-wars-m1.5`: Sicherung vor M2 bei `3b58f63`.

`window.__LANE_MATCH__` liefert Zustandskopien und Renderdiagnosen. Nur `?qa=1` aktiviert die deterministische Teststeuerung. Sie verwendet dieselben Simulationsschritte wie die normale Wiedergabe.

Vier bis sieben Minuten bleiben ein Ziel: In der 12-Partien-Messreihe endeten zehn Partien durch HQ-Zerstörung; zwei waren nach zehn Minuten noch offen. Fernkampf-/Lane-Balance und KI sind noch ausbaufähig. Der Fernkämpfer bleibt der vorhandene Platzhalter; der Mech besitzt weiterhin kein Lauf-Rig. Keine neuen Robotertypen, Gebäudearten, Karten, Forschung oder Multiplayer.
