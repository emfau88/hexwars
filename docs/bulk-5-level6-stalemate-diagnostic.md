# Bulk 5 – Level-6-Stillstandsdiagnose

Stand: 19. September 2026  
Status: Ursache reproduziert und kleinste systemische Korrektur verifiziert

## Fragestellung und reproduzierbarer Lauf

Der Headless-Harness `npm run balance:level6-diagnostic` spielt Level 6 mit dem aktuellen westlichen Guardian deterministisch bis Sieg/Niederlage oder 300 Sekunden. Beide Seiten verwenden dieselbe Kampagnen-AI; die Spielerseite entscheidet alle 1,4 Sekunden mit Skill 0,94. Er protokolliert in 60-Sekunden-Phasen:

- Felder, Gesamtstärke, West-/Oststärke, HQ- und Guardian-Garnison;
- alle AI-Aktionstypen, Commands, Ziele und transportierten Einheiten;
- hostile Sends getrennt von eigenen Reinforcement- und automatischen Supply-Sends;
- Growth, Capture-Zeitpunkte, Combatverluste beider Seiten und verbrauchten HQ-Shield;
- vollständige Zellzustände alle 30 Sekunden (Owner, Garnison, Siege und eingehende Armeen);
- stärkste Kampffelder sowie häufigste Source→Target-Verbindungen.

`--json` gibt den vollständigen maschinenlesbaren Trace aus; `--none` führt dieselbe Messung ohne Guardian aus.

## Vorher: kein Guardian-Kampf, sondern ein AI-Rückzugskreislauf

Der ursprüngliche Lauf endete nach 300 Sekunden im Timeout. Der Guardian blieb unberührt bei 58 Garnison und 36 Shieldpunkten. Zwischen Sekunde 240 und 300 galt:

| Team | AI-Commands | transportierte Einheiten | hostile Commands | Combatverlust | Growth | Aktionstyp |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Spieler-Bot | 43 | 472 | 0 | 0 | 0 | 43× `counter` |
| Gegner-Bot | 41 | 370 | 0 | 0 | 0 | 41× `counter` |

Die größten Schleifen waren `(5,5) → Spieler-HQ (3,11)` mit 642 Einheiten über 56 Sends und `(4,6) → Gegner-HQ (3,1)` mit 622 Einheiten über 54 Sends. Gleichzeitig standen sich an der Ostfront weiterhin gegnerische Felder gegenüber, ohne noch anzugreifen.

Die Kämpfe vor dem Stillstand lagen fast ausschließlich im Osten: `(5,6)` verursachte insgesamt 491,9 Verluste, `(5,8)` 306,1 und `(5,5)` 227,1. Am Guardianfeld `(2,4)` fand kein relevanter Kampf statt; der HQ-Shield verlor 0 Punkte. Damit war der Guardian nicht die direkte Ursache des Stillstands.

## Ursache

`baseApproach()` wertete jede starke gegnerische Zelle in bis zu sechs Hex Entfernung als akute HQ-Gefahr. Sobald die HQ-Reserve unter dem daraus berechneten Ziel lag, überstimmte `counter` reguläre Angriffe. Weil lange Sends zwischen eigenen Feldern über das Supply-Netz erlaubt sind, schickten beide Seiten Frontreserven immer wieder zurück zum HQ. Nach dem Endgame-Growth-Fade bei 240 Sekunden gab es keinen neuen Produktionsimpuls mehr, der diese symmetrische Schleife aufbrechen konnte.

Kausalkette:

`ferne Front ≤ 6 Hex` → falscher HQ-Alarm → `counter` schlägt Attack/Breakout → Front wird ins HQ entleert → Supply füllt wieder nach → erneuter Rücktransport → kein Kontakt und kein Sieg.

## Korrektur und Gegenprobe

Der HQ-Notfallmodus reagiert jetzt auf:

- bereits direkt zum HQ eingehende gegnerische Stärke; oder
- eine starke gegnerische Zelle in höchstens drei Hex Entfernung.

Eine entfernte Front bleibt damit Aufgabe der normalen Attack-/Breakout-/Logistics-Bewertung. Der vorhandene Test für eine echte nahe Vanguard bleibt grün; ein neuer Regressionstest stellt sicher, dass eine sechs Hex entfernte Armee keinen Rückzug zum HQ auslöst.

| Messung | Vorher | Nachher |
| --- | ---: | ---: |
| Ergebnis | Timeout | Sieg |
| Dauer | 300,0 s | 239,2 s |
| hostile Commands 240–300 s | 0 | nicht erreicht – Match beendet |
| Guardian am Ende | aktiv, Shield 36 | aktiv, Shield 0 |
| entscheidender HQ-Kampf | keiner | `(3,1)`, 206,3 Gesamtverlust inkl. 36 Shield |

Im korrigierten Lauf bleiben echte Kämpfe aktiv. Zwischen 180 und Matchende senden Spieler- und Gegner-Bot 14 beziehungsweise 12 hostile Commands. Der direkte Angriff verbraucht den Shield und erobert das HQ; der Guardian muss weiterhin nicht zwingend genommen werden.

## Balancebefund nach der Korrektur

- Ohne Guardian gewinnt derselbe symmetrische Lauf nach 101,2 Sekunden; mit Guardian nach 239,2 Sekunden. Der Guardian verhindert den Sieg nicht, verlängert diesen naiven Direktlauf aber um Faktor 2,36. Das ist ein relevantes Tuning-Risiko, kein technischer Fehler.
- Der isolierte Routenvergleich bleibt stabil: West über Guardian 51,1 Sekunden/46 Reststärke; Ost direkt 60,9 Sekunden/60 Reststärke.
- Der Doomstack gewinnt Level 6 weiterhin nach 103,6 Sekunden. Konzentration ist also nicht verboten, nur deutlich verteuert.
- Die 15 Spielerprofil-Läufe gewinnen mit West-Guardian 9/15, mit Ost-Guardian 8/15 und ohne Guardian 7/15. Aktuell: cautious 0/5, aggressive 4/5, tactical 5/5.
- Zehn der 15 aktuellen Profile erobern irgendwann den Guardian; zehn eröffnen trotzdem zuerst auf der Ostflanke. „Erste Flanke“ und endgültiger Guardianpfad sind deshalb getrennt zu lesen.

## Schlussfolgerung

Der beobachtete Timeout war ein globaler AI-Alarmfehler und ist behoben. Die Headless-Daten beantworten jedoch nicht, ob 239 Sekunden gegen eine naive symmetrische AI spielerisch angenehm sind. Bulk 5 bleibt deshalb im Review: Der aktuelle Guardian erzeugt eine echte ökonomische Wahl und lässt den Direktrush technisch offen, aber Shieldhöhe, vorsichtiger Spielstil und wahrgenommene Matchlänge brauchen weiterhin Abnahme. Weitere Guardians werden aus diesen Daten ausdrücklich nicht abgeleitet.
