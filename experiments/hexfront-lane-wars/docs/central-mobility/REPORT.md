# Zentrale Front – Tempo und Reichweite

Änderung auf ausdrücklichen Wunsch: Drohnen-Tempo 1,8 → 2,1; Mech-Tempo 0,9 → 1,1; Mech-Reichweite 3,0 → 3,3; Railgun-Reichweite 5,2 → 5,5. Railgun-Tempo bleibt 0,8. Keine Änderungen an Schaden, HP, Angriffstakt, Wirtschaft, Wellen, KI, Modellen oder Missionen. Zwei-Lane-Version und Kampflabor behalten ihre eigenen bisherigen Profile.

| Einheit | Tempo | Reichweite | HP einzeln | Schaden/Angriff | Intervall | Einzelziel-DPS |
|---|---:|---:|---:|---:|---:|---:|
| Drohne | 2,1 | 1,1 | 24 | 6 | 0,6 s | 10 |
| Mech | 1,1 | 3,3 | 110 | 10 | 1,2 s | 8,33 |
| Railgun | 0,8 | 5,5 | 40 | 55 | 2,8 s | 19,64 |

Nur der Mech hat Flächenschaden: bis zu zwei zusätzliche Gegner innerhalb 0,8 um das Hauptziel erhalten jeweils 9 Schaden. Maximaler verteilter DPS: (10 + 9 + 9) / 1,2 = 23,33. Keine Rüstung, Resistenzen oder typabhängigen Schadensmultiplikatoren. Die Daten unter `counters` informieren die KI; sie verändern keinen Schaden. Drei Drohnen je Fabrikwelle ergeben zusammen 72 HP und theoretisch 30 DPS. Railgun-Zwillingsstrahlen visualisieren zusammen einen Angriff mit 55 Schaden. DPS gilt für ununterbrochenes Feuer; Bewegung, Zielwechsel und überschüssiger Schaden senken die tatsächliche Wirkung.

## Vergleich vollständiger Partien

[Messdaten](audit.json): identische Skripte vor/nach der Änderung, je drei Strategiepaare in beiden Fraktionsrichtungen (12 Läufe). Gespiegelte Laufzeiten, HQ-Werte und Wirtschaftsmetriken stimmen exakt überein. Keine menschlichen Gewinnquoten.

| Paarung | Vorher | Jetzt |
|---|---|---|
| Vorhut (pressure) – Eisenkeil (siege) | Eisenkeil, 199,00 s | Eisenkeil, 213,50 s; Sieger-HQ 764 |
| Vorhut – Aufbaukommando (economy) | Aufbaukommando, 280,65 s | Vorhut, 267,55 s; Sieger-HQ 278 |
| Eisenkeil – Aufbaukommando | Eisenkeil, 97,20 s | Aufbaukommando, 258,15 s; Sieger-HQ 420 |

Die drei Eröffnungen schlagen sich in diesen deterministischen Proben nun gegenseitig. Das belegt keine allgemeine Balance, zeigt aber weniger Dominanz des Eisenkeils. Die Paarungen dauern 3:34–4:28 und liegen noch unter dem Ziel von 5–8 Minuten.

Alle reinen Konter halten bei einer und vier Fabrikchargen, jeweils mit vertauschten Fraktionen: Drohnen schlagen Railguns, Mechs schlagen Drohnen, Railguns schlagen Mechs. Vier Drohnenchargen schlagen jetzt zwei Mech- plus zwei Railgunchargen; vorher gewann die gemischte Armee. Das ist ein konkreter Effekt der gemeinsam geänderten Werte, keine Garantie gegen jede gemischte Formation.

## Entscheidungen nach drei Minuten

Fünf identische späte Reaktionsproben vor/nach Änderung (10 Läufe):

- Mechs gegen gegnerische Railgun-Umrüstung, keine Reaktion: Niederlage nach 259,45 s (vorher 256,70 s).
- Auf Drohnen umrüsten: weiterhin nach 720 s offen, beide HQs 800. Ein konkretes Patt bleibt bestehen.
- Dieselbe Umrüstung plus ein bezahlter Drohnen-Nachschub bei 210 s: Sieg nach 318,10 s statt 402,45 s; eigenes HQ 800.
- Railguns gegen gegnerische Drohnen-Umrüstung ignorieren: Niederlage nach 299,30 s statt 401,25 s.
- Darauf mit Mech-Umrüstung reagieren: Sieg nach 305,90 s statt 316,20 s; eigenes HQ 632 statt 740.

720 s ist ausschließlich die Messgrenze, kein Spieltimer. Die Regressionstests erwarten die neu gemessenen Ergebnisse, prüfen weiterhin Konter, vollständige Spiegelung und den Vorteil gezielter Reaktionen. Es wurden keine weiteren Balancewerte geändert, um alte Siege oder Laufzeiten wiederherzustellen.

## Technische Prüfung

- 94/94 automatisierte Tests bestanden: Reichweitengrenzen, reale Wegstrecke beider Fraktionen, Spielstände, Wirtschaft, Nachschub, komplette Partien und unveränderte historische Simulation.
- Vorherige zentrale Standardwerte werden beim Laden übernommen. Benutzerdefinierte abweichende Werte, vorhandene Einheitenzustände und historische Missionen bleiben erhalten; aktuelles Speichern/Fortsetzen bleibt deterministisch.
- Statischer Build erfolgreich.
- [Lokale Browserprüfung](browser/results.json): tatsächliche Werte in HUD und Spielstand, GLB-Animationen, Fabrikmodell, beide Railgun-Strahlen, Sound und vollständige Partie bis zur HQ-Zerstörung; keine JavaScript-Fehler. Die Browserpartie enthält manuelle Pause-/Auswahlschritte vor KI-Übernahme und ist daher nicht die identische Eröffnung des Headless-Vergleichs.
- Mobile Touch-Steuerung und kompakte Leisten aus dem vorherigen geprüften Stand sind unverändert enthalten.

Reproduktion: `npm test`, `npm run build`, `node tests/central-role-public.mjs` (laufender Server auf Port 4181). Für den öffentlichen Build `PUBLIC_PLAY_URL` auf dessen Verzeichnis setzen; `ROLE_PUBLIC_OUTPUT` wählt einen separaten Ergebnisordner.

Öffentliche Nachprüfung erfolgreich: [Build 9cc31a6 spielen](https://rawcdn.githack.com/emfau88/hexwars/9cc31a630445fd7781b604a788bf6a80519d8c95/experiments/hexfront-lane-wars/index.html). [Browserprotokoll](public/results.json): alle vier neuen Werte in Laufzeit und gespeichertem Spiel, Reichweiten im HUD, Animationen und Sound bestätigt. Vollständige Partie nach 198,90 s durch HQ-Zerstörung beendet (Orange 764, Blau 0), identisch zur lokalen Browserprüfung; keine JavaScript-Fehler. Der hervorgehobene Playlink in beiden READMEs verweist auf diesen geprüften Laufzeitstand.
