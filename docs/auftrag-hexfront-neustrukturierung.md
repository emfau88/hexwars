# Auftrag: HEXFRONT eigenständig strukturieren und Core-Gameplay verbessern

Diese Datei ist die laufende, verbindliche Arbeitsakte für den Auftrag. Sie wird nach jeder Phase mit Ergebnis, Verifikation und Commit aktualisiert.

## Leitentscheidung

HEXFRONT ist die Echtzeit-Kampagne und das einzige aktuelle Produkt im normalen Build. Die frühere rundenbasierte Tactics-Version bleibt vollständig unter `legacy/tactics/` erhalten, besitzt aber keine Runtime-, Save-, Test- oder Build-Kopplung mit HEXFRONT.

Der Territory-Control-Kern, Canvas 2D und die Kampagnenprogression bleiben erhalten. Es gibt keinen Genre-Pivot, keine neue Engine und kein Feature-Bloat. Routine-Logistik wird automatisiert; Angriffsrichtung, Truppenmenge, Risikowahl und Frontpriorität bleiben Entscheidungen des Spielers.

## Qualitätsregeln

- Phasen strikt trennen; während der Migration keine Balanceänderungen.
- Nach jeder größeren Phase: Typecheck, Unit-Tests, Build und Browser-Test.
- Große Änderungen in logisch getrennten Commits sichern.
- Seed-basierte Simulation reproduzierbar halten.
- Simulation, Input, Rendering, Leveldaten, UI, Audio und Persistenz klar trennen.
- Desktop und Mobile-Porträt prüfen; echte Pointer-Drags sind Pflicht.
- Die Debug-API darf Zustände prüfen, aber echte Eingabetests nicht ersetzen.

## Phasenstatus

### Phase 0 – Ausgangszustand sichern — ERLEDIGT

- [x] Kampagnen-Monolith vollständig inventarisiert.
- [x] Zielmodule für State, Level, Systeme, Input, Rendering, UI, Audio, Persistenz und Debug dokumentiert.
- [x] Level 1 im Browser gestartet.
- [x] Echten Pointer-Drag ausgeführt; neutrales Feld regulär erobert.
- [x] Baseline-Tests und Build erfolgreich.
- Ergebnis: `docs/campaign-migration-baseline.md`
- Commit: `8ffecc5 docs: record campaign migration baseline`

### Phase 1 – Kampagne als eigenständiges Produkt isolieren — ERLEDIGT

- [x] Kampagne als Root-Produkt unter `index.html` startbar.
- [x] Tactics vollständig nach `legacy/tactics/` archiviert.
- [x] Legacy aus normalem Build und Testlauf entfernt.
- [x] Assets und Campaign-Save unabhängig.
- [x] Root-Start, Tests und Build geprüft.
- Commit: `9ef8e56 refactor: isolate standalone campaign app`

### Phase 2 – Vite-/TypeScript-/ES-Modularchitektur — ERLEDIGT

- [x] Vite, TypeScript und ES-Module eingerichtet.
- [x] HTML, CSS und Runtime aus der ehemaligen Single-HTML-Datei getrennt.
- [x] `@ts-nocheck` entfernt und Runtime vollständig typisiert.
- [x] State, zehn deklarative Leveldateien, Systeme, Input, Rendering, UI, Audio, Persistenz und Debug in klare Module getrennt.
- [x] Simulation ist DOM-/Canvas-unabhängig; Input ruft eine enge Game-State-API auf.
- [x] Kontrollierte `window.__HEXFRONT__`-Schnittstelle ausschließlich im Debug-Modul erhalten.
- [x] UTF-8-Fehlkodierungen im Root-Shell bereinigt.
- [x] Funktionsparität im Browser auf Desktop und Mobile-Porträt bestätigt.
- [x] Echte Pointer-Drags auf beiden Viewports erfolgreich (Aktion 0 → 1, Eroberung 0 → 1).
- [x] Phase committed.

### Phase 3 – Funktionale Tests professionalisieren — ERLEDIGT

- [x] Unit-/Simulationstests: Wachstum, 50 %, 100 %, Kampf, Eroberung, Basis-Eroberung, Victory, Bewegung, KI, Freischaltungen, Savegame und deterministische Levelgenerierung.
- [x] Playwright-Konfiguration mit eigenem Produktionsbuild/Preview eingerichtet.
- [x] Browser-Suite auf Desktop und Mobile-Porträt: Kampagnenkarte, Unlocks, Levelstart und Sendemodi.
- [x] Echter Pointer-Drag löst einen regulären 50-%-Befehl und eine Eroberung aus.
- [x] Selbständige KI-Aktion beobachtet.
- [x] Gegnerische Basis ohne `debugWin` über normale Sendung, Bewegung und Kampf erobert.
- [x] Victory-Screen, Level-2-Unlock und gespeicherter Fortschritt nach neuem Seitenaufruf bestätigt.

### Phase 4 – Supply-System — ERLEDIGT

- [x] Front- und Hinterlanderkennung wird nach jeder Gebietsänderung aus dem Territory-Graphen neu berechnet.
- [x] Zentrale `SUPPLY_CONFIG`: 20 % Garnison, Mindestreserve, Transportintervall/-tempo, Fokus- und Lastgewichtung.
- [x] Hinterland verschickt ausschließlich den ganzzahligen Überschuss über physische, zeitgebundene Wege.
- [x] Automatische Routen enthalten nur eigene Hexes und können weder neutrale noch gegnerische Felder betreten.
- [x] Unterbrochene Korridore werden neu geroutet; ohne Route wird die komplette Ladung am letzten eigenen Feld gutgeschrieben.
- [x] Mehrere Fronten werden nach Weglänge, vorhandenem Bestand und bereits ankommendem Supply verteilt.
- [x] Kontextueller Frontfokus ab Level 6: eigenes Frontfeld antippen; konfigurierbare Gewichtung 3×; erneutes Antippen entfernt den Fokus.
- [x] Manueller Fernnachschub per direktem Drag zwischen verbundenen eigenen Hexes, mit 50-/100-%-Regel und realer Wegzeit.
- [x] Supply-Transporte sind als ruhige, goldumrandete Impulse sichtbar; Fokus erhält einen dezenten Ring.
- [x] Prototyptests A–G bestanden: Hinterland, kein Angriff, Trennung, zwei Fronten, Fokus, Ferntransport, Frontverschiebung.

### Phase 5 – Level 1 neu gestalten — AUSSTEHEND

- [ ] Nur 50 %, keine Relais, keine Bündelmechanik.
- [ ] Frühe echte Entscheidung zwischen kurzem/teurem und längerem/produktionsstärkerem Weg.
- [ ] Zieltempo per Playtest prüfen: erste Eingabe 2–4 s, erste Eroberung <10 s, Gegner 6–10 s, Begegnung 20–35 s, Sieg 60–100 s.
- [ ] Schwache, aber früher sichtbare KI.

### Phase 6 – Core-UX — AUSSTEHEND

- [ ] Drag zeigt Quelle, Ziel, Ausgangsmenge und gesendete Menge klar.
- [ ] Bewegungs-, Kampf- und Eroberungsfeedback verbessern.
- [ ] Zahl = spielbar, keine Zahl = ruhige Landschaft konsequent stärken.
- [ ] Level-1-HUD auf tatsächlich relevante Mechaniken reduzieren.
- [ ] Aktionen/Eroberungen aus dem primären HUD zurückstufen.

### Phase 7 – Kampagnenprogression und Supply-aware Balance — AUSSTEHEND

- [ ] Bestehende Progressionsreihenfolge erhalten und alle zehn Level neu prüfen.
- [ ] Level 2 so gestalten, dass 50 % und 100 % beide sinnvoll und riskant sind.
- [ ] Endgame-System zunächst erhalten; normale Matchdauer priorisieren.
- [ ] Alle Level auf Desktop und Mobile spielen/simulieren und Balancebefunde dokumentieren.

### Phase 8 – gezielter Polish und Abnahme — AUSSTEHEND

- [ ] Lesbarkeit, Input-, Bewegungs-, Kampf-, Supply- und Ergebnisfeedback polieren.
- [ ] Mobile Textgrößen, Touch-Ziele, Drag/Scroll-Konflikte, Frontfokus und Ferntransport prüfen.
- [ ] Abschließender Typecheck, Unit-, Browser- und Build-Lauf.
- [ ] Dokumentation und Commitübersicht finalisieren.

## Verifikationsprotokoll

| Datum | Phase | Prüfung | Ergebnis |
| --- | --- | --- | --- |
| 2026-08-12 | 0 | Bestehende Tests | 11/11 bestanden |
| 2026-08-12 | 0 | Echter Pointer-Drag in Level 1 | Aktion und Eroberung jeweils 0 → 1 |
| 2026-08-12 | 1 | Root-Start, Tests, Build | bestanden |
| 2026-08-12 | 2 | TypeScript-Typecheck | bestanden |
| 2026-08-12 | 2 | Übergangsguards | 8/8 bestanden |
| 2026-08-12 | 2 | Vite-Produktionsbuild | bestanden |
| 2026-08-12 | 2 | Desktop 1423 × 800, echter Pointer-Drag | Aktion und Eroberung jeweils 0 → 1 |
| 2026-08-12 | 2 | Mobile-Porträt 434 × 938, echter Touch-Drag | Aktion und Eroberung jeweils 0 → 1 |
| 2026-08-12 | 3 | Unit-/Simulationstests | 16/16 bestanden |
| 2026-08-12 | 3 | Playwright Desktop + Mobile-Porträt | 4/4 bestanden |
| 2026-08-12 | 3 | Typecheck und Produktionsbuild | bestanden |
| 2026-08-12 | 4 | Supply-Prototyptests A–G | 7/7 bestanden |
| 2026-08-12 | 4 | Gesamte Unit-/Simulationssuite | 23/23 bestanden |
| 2026-08-12 | 4 | Playwright inklusive Ferntransport/Fokus, Desktop + Mobile | 6/6 bestanden |

## Festgehaltene Befunde für spätere Phasen

- Mobile Bottom-Bar: gemessene Buttonhöhen von rund 37–42 px unterschreiten teilweise das 44-px-Mindestziel; Behebung in Phase 8.
- Die Begriffe „Täuschung“ und „sicherer Weg“ werden nicht als Kartenversprechen verwendet, wenn vollständige Information und direkte Reaktion diese Behauptung nicht tragen. Levelentscheidungen werden über Tempo, Truppenkosten, Produktion und Frontgeometrie messbar gemacht.

## Noch ausdrücklich ausgeschlossen

Kein 3D, Phaser/Engine-Wechsel, komplexes RTS, Gebäude-, Spell-, Tech-Tree-, Unit-Roster- oder Meta-Progressionssystem; keine globale Supply-Ressource, Teleportation, automatische Spielerangriffe, Rally-Point-Flut oder komplexe Logistikmenüs.
