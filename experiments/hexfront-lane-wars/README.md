# HEXFRONT Lane Wars · Meilenstein 1.5

Eigenständige 3D-Vorschau und erhaltenes Kampflabor. Zwei vorbereitete Gefechte nutzen dieselbe browserunabhängige M1-Simulation. Die Originalvarianten und das ursprüngliche Hauptspiel bleiben unverändert.

## Direkt im Browser testen

**[Lane Wars starten](https://rawcdn.githack.com/emfau88/hexwars/c038ffed9718192a7249ec8764951d3f5d3293c2/experiments/hexfront-lane-wars/index.html)** · [Kampflabor](https://rawcdn.githack.com/emfau88/hexwars/c038ffed9718192a7249ec8764951d3f5d3293c2/experiments/hexfront-lane-wars/lab.html) · [Screenshot-Galerie](https://rawcdn.githack.com/emfau88/hexwars/c038ffed9718192a7249ec8764951d3f5d3293c2/experiments/hexfront-lane-wars/review.html)

Öffentliche Vorschau ohne Installation, festgelegt auf `c038ffe` von `codex/lane-wars`. Beim Hinweis des Vorschauhosts **Open the page** wählen und anschließend **Gefechte starten**. Falls die 3D-Ansicht beim Laden der Assets stehen bleibt, können die Gefechte im separat verlinkten Kampflabor geprüft werden. Die unten beschriebenen lokalen Startschritte starten die 3D-Ansicht unabhängig vom Vorschauhost.

## Start

Im Verzeichnis `experiments/hexfront-lane-wars`:

```powershell
node scripts/serve.mjs
```

- Spielansicht: http://127.0.0.1:4181/
- Technisches Kampflabor: http://127.0.0.1:4181/lab.html
- Screenshots und Vergleich: http://127.0.0.1:4181/review.html

Node.js ab Version 20 genügt. Keine Installation, kein CDN, keine benachbarten Experimente und kein externer Dienst für Vorschau oder Headless-Tests. `PORT` kann den lokalen Port ändern.

## Bedienung

Gefecht auswählen und starten, pausieren oder neu aufstellen. Beide Lanes laufen gleichzeitig. 55°-Diorama ist die normale Ansicht; 70°-Taktik ist umschaltbar. Mausrad / Plus / Minus zoomen, Ziehen verschiebt den Ausschnitt begrenzt, Fadenkreuz oder Escape zeigt wieder alles. Roboter anklicken und „Näher ansehen“ öffnet die Modellansicht im Gelände. Leertaste startet/pausiert. Beim Wechsel zu einem anderen Tab wird pausiert.

HQ-Status, Credits, Einkommen, Wellen und Fabrikkarten sind ausdrücklich inaktive UI-Vorschauen. Kein Produktionssystem, kein HQ-Endspiel und keine zusätzlichen Gameplay-Systeme. Der Fernkämpfer ist ein Platzhalter; der Mech besitzt noch kein Lauf-Rig. Die Demo endet nach den vorbereiteten Gefechten und lässt sich manuell wiederholen.

## Prüfen und bauen

```powershell
npm test
npm run balance
npm run test:browser
npm run test:visual
npm run capture
npm run build
npm run preview
```

Die ersten beiden Prüfungen benötigen keinen Browser. `balance` schreibt 2.025 Vergleiche nach `docs/balance-results.json`. Browserprüfungen benötigen einen laufenden Server und Playwright (im Hauptprojekt bereits vorhanden); sie verwenden isoliertes Chromium. Sie sind keine Abhängigkeit der auslieferbaren Spielansicht. `build` erstellt einen statischen Ordner `dist/`; `preview` liefert diesen über denselben Port aus. Vor einem zweiten Server den ersten beenden oder `PORT` setzen.

## Struktur

- `src/simulation.js`, `rules.js`, `scenarios.js`: unveränderter M1-Kern, durch SHA-256 abgesichert.
- `src/presentation.js`: einmalige, breiter gestaffelte Startaufstellungen auf zwei Lanes.
- `src/routes.js`: längere, gleich lange Darstellungswege; kein Navigationseingriff.
- `src/battle-view.js`, `landscape-view.js`, `model-library.js`: Darstellung und Ereigniseffekte.
- `src/main.js`, `view.js`, `style.css`, `lab.html`: erhaltene technische Laboransicht.
- `docs/GDD.md`: GDD v0.2 mit freigegebener M1.5-Ergänzung.
- `docs/VISUAL-INTEGRATION.md`: Ergebnisse und kritische Bewertung.
- `docs/ASSET-INTEGRATION.md`: Wiederverwendung, Lizenzen, fehlende Animationen.

`window.__LANE_WARS__` liefert Zustandskopien und Renderdiagnosen; `window.__COMBAT_LAB__` bleibt im Labor erhalten. Nur mit `?qa=1` wird eine zusätzliche, deterministische Teststeuerung freigeschaltet. Diese durchläuft denselben Simulations- und Ereignisweg wie die sichtbare Wiedergabe.

Falls Playwright in einem separaten Worktree fehlt: einmalig npm ci im Experimentordner und gegebenenfalls npx playwright install chromium. Das betrifft ausschließlich Browser-QA; Spielansicht und Headless-Tests bleiben installationsfrei.
