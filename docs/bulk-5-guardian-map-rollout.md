# Bulk 5 – selektiver Guardian-Rollout und Kartenbalance

Stand: 19. September 2026
Status: `REVIEW` – Level-6-Testkarte und Stillstandskorrektur technisch integriert; strategische Kampagnen-Abnahme und Human-Playtest offen

## Entscheidung pro Karte

| Level | Rolle | Guardians | Entscheidung |
| ---: | --- | ---: | --- |
| 1 | 50-%-Bewegung und Lesbarkeit | 0 | Kein zweites Ziel im ersten Tutorial. |
| 2 | 100-%-Send und Reserve | 0 | Der unmittelbare Durchbruch ist hier Lerninhalt; ein Schild würde ihn konterkarieren. |
| 3 | starker neutraler Mittelpunkt | 0 | Umgehen oder Erobern bleibt die zentrale Wahl. |
| 4 | Group Send und Hill | 0 | Kein Guardian zusätzlich zur ersten Gruppenmechanik. |
| 5 | zwei Pässe | 2 | Bestehender Vertikalschnitt: zwei echte Schildanker für zwei Fronten. |
| 6 | getrennte West-/Ostfront mit Auto-Supply | 1 | Ein westlicher Guardian stärkt die zuvor schwächere Westfront, ohne den Ostweg zu verbieten. |
| 7 | einzelnes Insel-Relay | 0 | Das Relay ist bereits das prägende Positionsziel. |
| 8 | zwei Relay-Flanken | 0 | Zusätzliche Guardians würden die offene Relay-Wahl überladen. |
| 9 | drei Pässe: äußere Hills, mittleres Relay | 0 | Ein Guardian könnte einen Übergang zur Pflichtstrecke machen; erst die bestehende Routenwahl human-validieren. |
| 10 | Finale um See und zwei Relays | 0 | Die drei Spieler-Botprofile verlieren bereits ohne Guardian alle 15 Läufe. Erst Grundbalance klären, dann Finale-Schutz erneut prüfen. |

Diese Null-Entscheidungen sind bewusst, nicht die Behauptung, dass der direkte HQ-Rush auf allen Karten gelöst wäre. Der primitive Doomstack gewinnt weiterhin auf mehreren ungeschützten Karten und auch auf Level 6. Die West-Platzierung macht seine Route teurer als zuvor, verbietet Konzentration aber nicht.

## Level 6: technischer und ökonomischer Befund

- Ein Guardian auf `(2,4)`, 7 Startverteidiger, 36 endliche Shieldpunkte, Link zum Enemy-HQ. Seine Zelle wächst nicht und erhält keinen automatischen Nachschub.
- Das vorhandene 7×13-Layout, die zwei Korridore, Terrainregionen und HQ-Positionen bleiben unverändert. Es gibt keine neue Map-Art; der Guardian verwendet den Code-Platzhalter aus Bulk 4.
- Leveltext benennt beide Optionen. Structure-State, Combat, Supply, Growth, AI und Victory nutzen die bestehende Bulk-4-Domain ohne neue Sonderregel.
- Der reproduzierbare Harness `npm run balance:guardian-rollout` isoliert die Routen bei deaktivierter Gegner-AI:

| Route | Ergebnis | Zeit | Guardian am Ende | Spieler-Reststärke |
| --- | --- | ---: | --- | ---: |
| West über Guardian zum HQ | Sieg | 51,1 s | erobert | 46 |
| Ost direkt zum HQ | Sieg | 60,9 s | Shield verbraucht | 60 |

Der Westweg ist rund 16 % schneller, während der direkte Ostweg mehr Stärke übrig lässt. Das ist im isolierten, gegnerlosen Routenlauf eine Timing-vs-Reserve-Wahl. Die 36 Punkte sind Testtuning, kein endgültiger Balancewert.

## Kampagnenrisiko und Gate

- Der einfache Doomstack-Bot gewinnt Level 6 weiterhin nach 103,6 s. Das System macht nicht jede Ein-Routen-Strategie unmöglich.
- Der frühere symmetrische 300-s-Timeout war kein Guardian-Combatproblem: Beide AIs klassifizierten eine bis zu sechs Hex entfernte Front als akute HQ-Gefahr. Zwischen Sekunde 240 und 300 waren alle 84 Entscheidungen reine `counter`-Rücktransporte, bei 0 Angriffen und 0 Kämpfen. Die korrigierte AI alarmiert nur bei direkt eingehenden HQ-Angriffen oder starker Feindpräsenz bis drei Hex Entfernung. Der identische Lauf endet nun nach 239,2 s mit einem Sieg; ohne Guardian nach 101,2 s. Vollständige Felder-, Send-, Verlust- und Phasendaten stehen in `docs/bulk-5-level6-stalemate-diagnostic.md`.
- Der Guardian verlängert den naiven symmetrischen Direktlauf damit weiterhin um Faktor 2,36. Das ist jetzt ein Balance-/Dauer-Risiko statt eines technischen Deadlocks.
- Die aktualisierten Spielerprofile berücksichtigen HQ-Shield und aktive Guardians im Zielwert und der Verteidigungsschätzung. `npm run balance:guardian-profiles` protokolliert zusätzlich die tatsächlich zuerst erreichte Nordflanke und Guardian-Eroberung. Die automatische Gegenprobe zeigt:

| Level-6-Fassung | Siege gesamt | zuerst West: Siege/Läufe | zuerst Ost: Siege/Läufe |
| --- | ---: | ---: | ---: |
| ohne Guardian | 7/15 | 1/5 | 6/9 (1 ohne Nordflanke) |
| Guardian Ost (verworfener erster Prototyp) | 8/15 | 3/7 | 5/8 |
| Guardian West (aktueller Prototyp) | 9/15 | 2/5 | 7/10 |

Bereits ohne Guardian war die Ostfront für diese Bots bevorzugt. Die östliche Guardian-Platzierung wurde deshalb verworfen; West verbessert den Gesamterfolg gegenüber Ost und der guardianlosen Fassung. Zehn Profile eröffnen weiter im Osten, und insgesamt zehn erobern später trotzdem den westlichen Guardian. „Erste Flanke“ ist somit keine reine Ein-Routen-Strategie. Level 10 bleibt mit 1/15 Siegen weiterhin deutlich zu schwer für diese Profile.
- Der erste Level-5-Spielerbericht bewertet die höhere Schwierigkeit positiv. Für Level 6 fehlt noch ein Human-Playtest zu Verständlichkeit, Dauer und echter Frontwahl.
- Vor einem weiteren Guardian-Rollout die hohe Dauer des naiven Direktlaufs und die Ostpräferenz human prüfen, Level 5 weiter abnehmen und die Level-10-Grundbalance getrennt klären. Ein Human-Test bleibt für Lesbarkeit und Spielgefühl nötig, nicht für die bereits automatisierten Siege, Routen und Verluste. Danach erst Bulk 5 `DONE` und Bulk 6 beginnen. Falls Level 6 nur länger statt interessanter wird: Shield reduzieren oder Guardian zurücknehmen.

## Verifikation

- Unit-Tests für bewusst begrenzte Guardian-Verteilung, Level-6-Authoring und beide Produktionsrouten.
- Browser-Smoke auf Desktop und Mobile für Level-6-State, Shield und sichtbare Legende sowie Start aller zehn Levels.
- Visueller Review: `docs/qa/bulk-5-level6-desktop.png` und `docs/qa/bulk-5-level6-mobile.png`. Der Code-Guardian sitzt korrekt im westlichen Korridor; Verbindung und HQ-Shield bleiben kleine Platzhalter und benötigen den geplanten Structure-Lesbarkeits-Pass aus Bulk 7. Auf schmalem Desktop überdeckt das linke Command-Panel weiterhin einen Teil der Westflanke; separat als UI-Polish behandeln.
- Typprüfung, Produktions-Build, Kampagnen-, Profil- und Doomstack-Simulationen.
- Abschlussstand: 83/83 Unit-Tests, Typprüfung und Produktionsverifikation bestanden. Die zuvor ausgeführte Browsermatrix bleibt bei 39/39 Tests auf Desktop/Mobile (5 plattformbedingt übersprungen); sie wurde nach der reinen AI-/Diagnoseänderung nicht erneut als teurer Voll-Lauf gestartet.

Entscheidung: `ADJUST/REVIEW`, noch kein Go für Bulk 6. Ein weiterer Guardian auf den übrigen Karten würde den offenen Doomstack-Befund nicht automatisch lösen und könnte die bereits hohe Schwierigkeit verschlechtern.
