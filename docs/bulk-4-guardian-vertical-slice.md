# Bulk 4 – Guardian-Vertikalschnitt

Stand: 19. September 2026  
Status: `REVIEW` – technischer Slice implementiert, erster Human-Playtest positiv; wiederholte Balance-Abnahme offen

## Ergebnis

Level 5 („Zwei Pässe“) besitzt als einzige Testkarte zwei gegnerische Guardians. Beide liegen an den zwei namensgebenden Passrouten und liefern je 48 Punkte eines endlichen HQ-Shields. Das HQ bleibt direkt angreifbar und bleibt das einzige Siegesziel.

Level 1 bleibt guardianfrei, Level 2 behält sein 100-%-Tutorial und Level 4 führt weiterhin ausschließlich Group Send ein. Damit wird kein frühes Tutorial mit einer zweiten neuen Regel überladen.

## Implementierte Verträge

- Eigenständige Structure-Domain für `hq`, `relay` und `guardian` mit ID, Zelle, maximalem Hex-Footprint, Owner, ursprünglichem Owner, Status, Verbindung sowie aktuellem/maximalem Shield. Authoring validiert spielbare Zellen, Überlappungen und Guardian-HQ-Links.
- HQs und Relays werden bereits als Structure-State gespiegelt; ihre bestehenden Terrainregeln bleiben in diesem Slice kompatibel bestehen.
- Guardian-Zustände: `active`, nach Eroberung `captured`, nach vollständigem Shieldverbrauch oder Rückeroberung ohne Regeneration `disabled`.
- Direkter HQ-Combat verbraucht zuerst die endlichen Guardian-Pools. Es gibt keine Unverwundbarkeit und keinen globalen Angriffscap.
- Eroberung eines Guardians entfernt dessen Restschild dauerhaft. Ein Guardian-Schild regeneriert im Slice nicht.
- Guardian-Zellen produzieren keine Einheiten und werden weder Quelle noch Ziel des automatischen Supply. Manuelle Bewegung über beziehungsweise von kontrollierten Zellen bleibt möglich.
- AI bewertet aktive gegnerische Guardians deutlich höher als ein noch geschütztes HQ und hält eigene Guardian-Garnisonen stationär, statt sie für gewöhnliche Angriffe zu entleeren.
- Victory bleibt ausschließlich an HQ-Capture beziehungsweise die bestehenden Eliminierungsregeln gebunden.
- Debug-API exportiert Structure-Zustände; die Kampagnen-Persistenz speichert weiterhin nur Missionsfortschritt, deshalb entsteht kein inkompatibler Mid-Mission-Save.

## Visuelle Rückmeldung

- kompakter Code-Platzhalter mit eigener Guardian-Silhouette;
- Teamring und pulsierender Aktivring;
- gestrichelte Verbindung zum geschützten HQ;
- HQ-Shieldring mit lokalisiertem Restwert;
- deaktivierter beziehungsweise eroberter Zustand ohne aktiven Ring;
- eigener Guardian-Eintrag in der Cell-Type-Legende und explizite Level-5-Regelkopie.

Die Platzhalter beweisen Zustände und Footprints, sind aber keine finale Structure-Art aus Bulk 7.

## Balance-Evidenz

Der reproduzierbare Produktions-Harness `npm run balance:guardian-production` isoliert zunächst die Routenökonomie mit deaktivierter Gegner-AI:

| Strategie | Ergebnis | Zeit | Guardian | verbleibender Shield |
| --- | --- | ---: | --- | ---: |
| direktes HQ | Sieg | 74,3 s | – | 0 |
| West-Guardian → HQ | Sieg | 63,4 s | erobert | 0 |
| Ost-Guardian → HQ | Sieg | 53,0 s | erobert | 0 |

Damit bleibt der direkte Angriff möglich, ist aber auf dieser Karte wirtschaftlich schlechter als die Guardian-Route. Nach genau einem Guardian bleiben zunächst 48 Shieldpunkte, die auf dem anschließenden HQ-Angriff endlich verbraucht werden.

Ein erster symmetrischer AI-vs-AI-Stresstest endete nach mehr als 600 simulierten Sekunden ohne Sieg. Der Screenshot-Review deckte danach auf, dass die Gegner-AI ihre Guardian-Garnison fast vollständig für gewöhnliche Angriffe abgab. Nach der gezielten Korrektur bleibt die Garnison stationär; der reproduzierbare Autoplay-Lauf endet nun nach 131,1 s mit Spieler-Niederlage, einem eroberten Guardian und 48 verbleibenden Shieldpunkten. Der erste manuelle Spielerbericht beschreibt Level 5 als deutlich schwieriger als zuvor und bewertet genau diese zusätzliche Schwierigkeit als gewünscht. Das ist ein positives qualitatives Signal, aber noch keine mehrfache Balance-Abnahme. Bulk 4 bleibt in `REVIEW`; Werte werden nicht blind anhand eines einzigen Bot-Profils oder eines einzelnen Spielberichts verändert.

## Verifikation

- neue Structure-/Guardian-Tests: Aufbau, Shieldverbrauch, Capture-State, Growth-/Supply-Ausschluss, stationäre AI-Garnison, AI-Zielwert, Produktionsrouten und Legacy-HQ-Kompatibilität;
- Browser-Smoke: zwei aktive Guardians, je 48 Shield, HQ-Link und sichtbare Guardian-Legende;
- bestehende Doomstack-Matrix: direkter Level-5-Rush verliert nun, statt das geschützte HQ wie zuvor direkt zu überrennen;
- QA-Screenshot: `docs/qa/bulk-4-guardian-slice-level5.png`.
- Verifikation nach dem Slice: 78 Unit-Tests und 37 Browser-Tests bestanden, fünf Browser-Tests erwartungsgemäß übersprungen; Typprüfung und Produktions-Build bestanden.

## Exit-Gate vor Bulk 5

1. Level 5 mindestens mehrfach manuell auf Verständlichkeit, Matchdauer und Guardian-vs-direkt-Entscheidung spielen.
2. Prüfen, ob 48 pro Guardian und 8 Startgarnison den gewünschten Druck erzeugen, ohne den Spieler zu einer starren Checkliste zu zwingen.
3. Spieler-vs-AI- und Autoplay-Tempo vergleichen; die jetzige Autoplay-Niederlage nach 131,1 s nicht mit einer pauschalen Shield-Absenkung beantworten. Danach Produktionsharness plus Kampagnen-Balance erneut ausführen.
4. Erst danach `DONE` und Entscheidung über null/einen/zwei Guardians auf weiteren Karten.
