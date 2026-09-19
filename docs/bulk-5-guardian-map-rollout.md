# Bulk 5 – selektiver Guardian-Rollout und Kartenbalance

Stand: 19. September 2026
Status: `REVIEW` – Level-6-Testkarte technisch integriert; strategische Kampagnen-Abnahme und Human-Playtest offen

## Entscheidung pro Karte

| Level | Rolle | Guardians | Entscheidung |
| ---: | --- | ---: | --- |
| 1 | 50-%-Bewegung und Lesbarkeit | 0 | Kein zweites Ziel im ersten Tutorial. |
| 2 | 100-%-Send und Reserve | 0 | Der unmittelbare Durchbruch ist hier Lerninhalt; ein Schild würde ihn konterkarieren. |
| 3 | starker neutraler Mittelpunkt | 0 | Umgehen oder Erobern bleibt die zentrale Wahl. |
| 4 | Group Send und Hill | 0 | Kein Guardian zusätzlich zur ersten Gruppenmechanik. |
| 5 | zwei Pässe | 2 | Bestehender Vertikalschnitt: zwei echte Schildanker für zwei Fronten. |
| 6 | getrennte West-/Ostfront mit Auto-Supply | 1 | Ein östlicher Guardian macht die etwas längere Ostfront zu einer Zeit-/Truppenwahl, ohne beide Wege vorzuschreiben. |
| 7 | einzelnes Insel-Relay | 0 | Das Relay ist bereits das prägende Positionsziel. |
| 8 | zwei Relay-Flanken | 0 | Zusätzliche Guardians würden die offene Relay-Wahl überladen. |
| 9 | drei Pässe: äußere Hills, mittleres Relay | 0 | Ein Guardian könnte einen Übergang zur Pflichtstrecke machen; erst die bestehende Routenwahl human-validieren. |
| 10 | Finale um See und zwei Relays | 0 | Die drei Spieler-Botprofile verlieren bereits ohne Guardian alle 15 Läufe. Erst Grundbalance klären, dann Finale-Schutz erneut prüfen. |

Diese Null-Entscheidungen sind bewusst, nicht die Behauptung, dass der direkte HQ-Rush auf allen Karten gelöst wäre. Der primitive Doomstack gewinnt weiterhin auf mehreren ungeschützten Karten. Auch auf Level 6 bleibt ein konzentrierter Westangriff erfolgreich, kostet im isolierten Vergleich aber mehr Zeit als der östliche Guardian-Weg. Die Regel verändert dort die beste Route, nicht die grundsätzliche Möglichkeit zur Konzentration.

## Level 6: technischer und ökonomischer Befund

- Ein Guardian auf `(4,4)`, 7 Startverteidiger, 36 endliche Shieldpunkte, Link zum Enemy-HQ. Seine Zelle wächst nicht und erhält keinen automatischen Nachschub.
- Das vorhandene 7×13-Layout, die zwei Korridore, Terrainregionen und HQ-Positionen bleiben unverändert. Es gibt keine neue Map-Art; der Guardian verwendet den Code-Platzhalter aus Bulk 4.
- Leveltext benennt beide Optionen. Structure-State, Combat, Supply, Growth, AI und Victory nutzen die bestehende Bulk-4-Domain ohne neue Sonderregel.
- Der reproduzierbare Harness `npm run balance:guardian-rollout` isoliert die Routen bei deaktivierter Gegner-AI:

| Route | Ergebnis | Zeit | Guardian am Ende | Spieler-Reststärke |
| --- | --- | ---: | --- | ---: |
| West direkt zum HQ | Sieg | 59,6 s | Shield verbraucht | 57 |
| Ost über Guardian zum HQ | Sieg | 51,0 s | erobert | 50 |

Der Ostweg ist rund 14 % schneller, während der Westweg mehr Stärke übrig lässt. Das ist eine kleine, echte Timing-vs-Reserve-Wahl. Shield-Sweeps mit 24/30/36 Punkten ergaben für den direkten Weg 58,3/58,7/59,6 s; die Guardian-Route blieb bei 51,0 s. Die 36 Punkte sind deshalb noch Testtuning, kein endgültiger Balancewert.

## Kampagnenrisiko und Gate

- Der einfache Doomstack-Bot gewinnt Level 6 weiterhin, braucht aber 71,3 statt zuvor 43,5 s. Das System macht nicht jede Ein-Routen-Strategie unmöglich.
- Der symmetrische Kampagnen-Bot braucht nun 232,6 statt 127,7 s. Diese deutliche Verlängerung kann strategische Tiefe oder unnötige Zähigkeit bedeuten; Simulation allein entscheidet das nicht.
- Die aktualisierten Spielerprofile berücksichtigen nun HQ-Shield und aktive Guardians im Zielwert und der Verteidigungsschätzung. Auf Level 6 gewinnen vorsichtig/aggressiv/taktisch 3/5, 2/5 und 5/5 Varianten. Level 10 bleibt auch ohne Guardian bei 0/15.
- Der erste Level-5-Spielerbericht bewertet die höhere Schwierigkeit positiv. Für Level 6 fehlt noch ein Human-Playtest zu Verständlichkeit, Dauer und echter Frontwahl.
- Vor einem weiteren Guardian-Rollout Level 5 und 6 mehrfach manuell spielen, Matchdauer gegen Baseline beurteilen und die finale Level-10-Grundbalance getrennt untersuchen. Danach erst Bulk 5 `DONE` und Bulk 6 beginnen. Falls Level 6 nur länger statt interessanter wird: Shield/Garnison reduzieren oder diesen Guardian zurücknehmen.

## Verifikation

- Unit-Tests für bewusst begrenzte Guardian-Verteilung, Level-6-Authoring und beide Produktionsrouten.
- Browser-Smoke auf Desktop und Mobile für Level-6-State, Shield und sichtbare Legende sowie Start aller zehn Levels.
- Visueller Review: `docs/qa/bulk-5-level6-desktop.png` und `docs/qa/bulk-5-level6-mobile.png`. Der Code-Guardian sitzt korrekt im östlichen Korridor; Verbindung und HQ-Shield bleiben kleine Platzhalter und benötigen den geplanten Structure-Lesbarkeits-Pass aus Bulk 7. Auf schmalem Desktop überdeckt das linke Command-Panel weiterhin einen Teil der Westflanke; separat als UI-Polish behandeln.
- Typprüfung, Produktions-Build, Kampagnen-, Profil- und Doomstack-Simulationen.
- Abschlussstand der technischen Prüfung: 81/81 Unit-Tests, 39/39 ausgeführte Browser-Tests auf Desktop/Mobile (5 plattformbedingt übersprungen), Typprüfung und Produktions-Build bestanden.

Entscheidung: `ADJUST/REVIEW`, noch kein Go für Bulk 6. Ein weiterer Guardian auf den übrigen Karten würde den offenen Doomstack-Befund nicht automatisch lösen und könnte die bereits hohe Schwierigkeit verschlechtern.
