# HEXFRONT – Supply-aware Kampagnenbalance

Stand: 2026-08-12

## Methodik und Grenze

Jedes Level wird deterministisch mit derselben Spielsimulation, realer Bewegung, Kampf, Wachstum und Supply gespielt. Ein schnelles kompetentes Spielermodell entscheidet ab 2,5 Sekunden ungefähr alle 1,4 Sekunden mit Skill 0,94; die Gegner-KI verwendet die echten Levelwerte. Das ist ein reproduzierbarer Smoke-Test für Blockaden, extreme Dauer und grobe Machtspitzen – kein Ersatz für Human-Playtests, Lesbarkeit oder subjektiven Spielspaß.

Aufruf: `npm run balance`

## Messung

| Level | Ergebnis Modell | Zeit | Felder P1:P2 | Kräfte P1:P2 | Bewertung |
| --- | --- | ---: | ---: | ---: | --- |
| 1 – Der Pfad | Sieg | 71,8 s | 19:0 | 206:0 | Zielkorridor 60–100 s getroffen. |
| 2 – Zwei Wege | Sieg | 80,2 s | 20:2 | 178:9 | Richtiger früher Schwierigkeitsanstieg; 100-%-Breakthrough jetzt explizit. |
| 3 – Das Zentrum | Sieg | 136,3 s | 26:7 | 411:47 | Deutlich längere erste „volle“ Karte, aber vor Endgame. |
| 4 – Hochland | Sieg | 163,5 s | 29:10 | 485:116 | Hügel erzeugt erwartete Verzögerung. |
| 5 – Zwei Pässe | Sieg | 134,1 s | 24:5 | 305:47 | Beide Engstellen bleiben durch Supply bedienbar. |
| 6 – Doppelfront | Sieg | 233,0 s | 24:7 | 343:34 | Erster harter Prüfstein; Fokus ist hier absichtlich relevant. Human-Playtest nötig. |
| 7 – Relaisinsel | Sieg | 151,8 s | 24:9 | 351:69 | Akt III beginnt anspruchsvoll, bleibt im Normalwachstum. |
| 8 – Signalgärten | Niederlage | 178,2 s | 5:35 | 17:612 | Hohe Relais-/Frontkomplexität; stärkster Kandidat für späteres Human-Balancing. |
| 9 – Drei Pässe | Niederlage | 163,5 s | 10:27 | 84:351 | Schwierigkeit steigt, Match bleibt zeitlich kontrolliert. |
| 10 – Der Ring | Niederlage | 129,3 s | 9:26 | 42:255 | Finale reagiert schnell; zwei KI-Aktionen machen es klar anspruchsvoll. |

## Entscheidungen

- Kein pauschales Absenken später KI-Werte anhand von Bot-vs-KI-Ergebnissen. Ein menschlicher Frontfokus und bewusstes 100-%-Timing sind genau die Fähigkeiten, die das Modell nur unzureichend abbildet.
- Level 6 und 8 sind priorisierte Human-Playtest-Kandidaten: Level 6 geht über 180 Sekunden, Level 8 ist der erste reproduzierbare Modellverlust.
- Endgame bleibt unverändert bei 180 Sekunden Ausklang und 240 Sekunden Wachstumsende.
- Alle symmetrischen Kampagnenkarten verwenden gespiegelte Neutralstärken. Dadurch entsteht keine unsichtbare Startbevorzugung durch den Level-Seed; Level 9 behält seine bereits korrigierte Spiegelung.
- Level 2 besitzt nun zwei symmetrische Startziele: 4 Einheiten für den sicheren 50-%-Aufbau und 12 Einheiten für den sofortigen 100-%-Durchbruch bei leerer Basis.
- Alle zehn Levels müssen zusätzlich in beiden Browser-Viewports startbar bleiben; dies ist Teil der Playwright-Suite.
