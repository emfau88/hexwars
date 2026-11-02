# Balanceprüfung – Verbesserungspass 2. November 2026

## Methode und Grenzen

150 Läufe mit drei Profilen und fünf Varianten auf zehn Karten, zehn primitive Doomstack-Läufe und 90 gezielte Routenläufe. Die Simulationen verwenden nun dieselbe Referenzgeometrie wie der Renderer (Radius 40,3), statt verkürzter 50/45-Abstände. Das ist eine Korrektur der Messmethode, keine Änderung der Laufgeschwindigkeit im Spiel.

Der zusätzliche Routenbot minimiert geschätzte Eroberungskosten, umgeht starke neutrale Felder, nutzt Relaissprünge, wartet auf ausreichende Angriffsstärke und führt manuell Verstärkungen zusammen. Drei Varianten vergleichen Nachschub aus, Nachschub an mit Halten und Nachschub an ohne Halten. Entscheidungstakte: 1,0 / 1,2 / 1,4 Sekunden. Ein Regressionstest belegt explizit die Wahl eines 5er-Feldes statt eines gleich langen 12er-Wegs.

Die Profile sind reproduzierbare Heuristiken, keine Menschen. Sie kennen den offenen Spielzustand, verhandeln keine unbekannten Informationen und bilden nicht jede kluge Entscheidung ab. Siege/Niederlagen rechtfertigen allein keine Stärkeänderung. Menschliche Erstspieler-Tests und physische Geräte sind nicht durchgeführt.

## Ergebnisse

| Level | Profil-Siege / 15 | Gezielte Route: manuell / 3 | Auto + Halten / 3 | Auto ohne Halten / 3 | Timeouts aller 24 Läufe |
|---|---:|---:|---:|---:|---:|
| 1 | 15 | 3 | 3 | 3 | 0 |
| 2 | 15 | 3 | 3 | 3 | 0 |
| 3 | 10 | 3 | 3 | 3 | 0 |
| 4 | 11 | 3 | 3 | 3 | 0 |
| 5 | 6 | 3 | 3 | 3 | 0 |
| 6 | 9 | 3 | 3 | 3 | 0 |
| 7 | 10 | 3 | 3 | 3 | 0 |
| 8 | 6 | 1 | 2 | 2 | 0 |
| 9 | 11 | 3 | 3 | 3 | 0 |
| 10 | 2 | 3 | 1 | 1 | 0 |

## Bewertung

- Level 5/6 sind mit gezielter Route in allen neun Varianten gewinnbar. Die zuvor schwachen vorsichtigen Profile belegen keine Unfairness. Keine pauschale Abschwächung.
- Level 7 ist mit gezielter Route in allen neun Varianten gewinnbar. Level 8 bleibt empfindlicher für Angriffszeitpunkte; Auto-Nachschub verbessert hier den Erfolg des gezielten Modells von 1/3 auf 2/3.
- Level 10: manuell 3/3 Siege, automatisch jeweils 1/3. Die ersten Abweichungen der untersuchten 1,2-s-Läufe entstehen erst nach rund 60 Sekunden durch kleine Lieferungen zum Relais. Der Brückenkopf nach einem Sprung ist noch nicht über eigene Nachbarfelder angeschlossen. Auto-Nachschub teleportiert nicht über neutrale Felder; manuelle Relaissendungen bleiben nötig. Kein belegter Truppenverlust oder Verstoß gegen Halten.
- Halten und Nicht-Halten sind bei diesen gezielten Läufen gleich, weil der Bot die jeweils vorderste Route sammelt und dort kein weiter vorne liegendes eigenes Ziel für Auto-Abzüge vorhanden ist. Der separate Halten-Regressionstest deckt Sammelfelder im Hinterland ab.
- Kein zusätzlicher Fokus-Schalter ohne belegten Bedarf. Schalter aus, manuelles Verstärken und Halten bleiben bewusste taktische Werkzeuge.

## Finale: Variantenvergleich

| Zusätzlicher Wächter | KI-Befehle je Zyklus | Gezielte Siege / 9 | Profil-Siege / 15 | Timeouts |
|---|---:|---:|---:|---:|
| Nein | 1 | 9 | 7 | 0 |
| Nein | 2 | 5 | 2 | 0 |
| Ja | 1 | 3 | 5 | 1 |
| Ja | 2 | 0 | 2 | 0 |

Entscheidung: bestehende zwei KI-Befehle, keine zusätzlichen Wächter, unveränderte Ringgeometrie und Startstärken. Ein zusätzlicher Wächter verengt die erfolgreiche Strategieauswahl und erzeugt in einer Variante einen Timeout. Die Lernaufgabe bleibt Schwerpunktbildung an einem Ufer, bewusster Relaissprung und Absicherung der eigenen Basis. Das Finale wird gemäß Nutzervorgabe als Eislandschaft gestaltet.

Level-6-Routenprüfung nach Geometriekorrektur: West 53,6 s, Ost 58,8 s; beide gewinnen. Der alte Test verlangte mindestens 10 % Zeitgewinn und mehr Resttruppen auf der langsameren Route. Tatsächlich spart West nun 8,8 % und behält 57 statt 53 Truppen. Die Tests prüfen weiterhin Sieg, Wächterzustand und den wirtschaftlichen Vorteil, ohne die veraltete Messschwelle.

Rohdaten: `hexfront-implementation/profile-balance-real.json`, `doomstack-real.json`, `strategic-variants.json`, `finale-comparison.json` in der lokalen Evidenzablage.
