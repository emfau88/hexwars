# Field Operations – drei eigenständige 3D-Missionen

Stand: 13. Oktober 2026. Isoliert im Branch `experiment/hexfront-3d-diorama`.

## Karten und taktische Unterschiede

| Mission | Aufbau | Entscheidung |
|---|---|---|
| 01 – Bastion Morgenwacht | Bestehende 37-Felder-Festung, zentrales Plateau, zwei Aufstiege. Unveränderte Geometrie, Ausgangstruppen, Dekoration, Assets und Regeln. | Höhenkontrolle und Nachschub auf einer zusammenhängenden Front. |
| 02 – Windpass | Neuer länglicher Grundriss, 34 Felder, echte Schluchtlücken, westlicher Höhenzug mit versetztem Relais und schmaler östlicher Talsteg; andere HQ-Positionen. | Kurzer direkter Engpass gegen längeren erhöhten Flankenweg. Jeder Weg funktioniert auch ohne den anderen. |
| 03 – Auenstrom | 33 Felder, zwei Ufer, verzweigtes Wasser und genau drei begehbare Furten. Zentrales Relais auf Höhe 1; seitliche Höhenzüge mit Rampen. | Drei Fronten beobachten, Reserven halten und an einem Übergang konzentrieren. Jede Furt verbindet die HQs unabhängig von den beiden anderen. |

Inspiration aus dem Originalrepository: `src/levels/level02.ts` (Zwei Wege), `level06.ts` (Geteiltes Feld) und `level09.ts` (Drei Pässe). Es wurden Aufbauideen übernommen, keine neue Mechanik und keine 2D-Kartengrafik importiert. Die erste 3D-Karte bleibt als Referenz erhalten. Die beiden neuen Karten verwenden eigene Koordinaten, Auslassungen, HQ-/Relaispositionen, Rampen und Dekorationskompositionen, statt die bestehende Insel umzufärben.

## Menü und Fortschritt

Das Vollbildmenü verwendet echte 3D-Aufnahmen der drei Karten, eine große Vorschau des ausgewählten Einsatzes und eine hervorgehobene Startaktion. Die Bilder entstehen mit `node scripts/capture-campaign-art.mjs` in der vorhandenen Dioramaansicht; die Spielkamera bleibt unverändert. Ein Sieg schaltet die nächste Mission frei. Abgeschlossene Missionen bleiben wiederholbar. Das Menü pausiert eine laufende Partie; „Partie fortsetzen“ führt genau dorthin zurück. „Neuen Einsatz starten“ setzt die Partie zurück; die Konsequenz steht im Menü.

Gespeichert werden nur Missionserfolge und Auswahl, keine laufenden Gefechte. `localStorage` benutzt den Schlüssel `hexfront.campaign.v1`; beschädigte und unbekannte Werte werden normalisiert. Bei blockiertem Speicher bleibt der Fortschritt per `history.state` innerhalb desselben Tabs über Missionswechsel erhalten. Andere Browser/Geräte teilen den Fortschritt nicht. Beim Wechsel einer Mission wird die Seite neu geladen, damit die vorherige WebGL-Szene zuverlässig freigegeben wird.

Smartphones verwenden eine feste Start-/Fortsetzen-Leiste und einen getrennt scrollenden Missionsbereich. Missionskarten und Startaktionen besitzen große Bedienflächen; die kompakte Schließen-Taste misst 44 px. Tastaturfokus bleibt im nativen Dialog, Escape setzt eine laufende Partie fort. Es gibt keine frei drehbare Kamera oder zusätzliche Spielsysteme.

## Sichtbarkeit und Materialsystem

Die bisherige 70°-Kamera und das bestehende geometrische Framing bleiben erhalten. Für die neuen unregelmäßigen Grundrisse folgt ein schmaler, zusammenhängender Landschaftsrand den tatsächlichen Außenkanten; Schlucht- und Flusslücken bleiben offen. Höhen, Rampen, Picking und KI verwenden dieselben Daten. Wasser ist ausschließlich Dekoration unterhalb der Ufer und zählt nicht als begehbares Feld.

Die bestehenden HQs, Drohnen, Relais, PBR-Felsen und Pflanzen werden weiterverwendet. Die neuen Karten verteilen wenige Objekte an Rändern; die Feldzentren bleiben frei. Auenstrom ergänzt ein selbst erstelltes Wassermesh, eine kleine prozedurale Normalmap und dezente Strömung. Pausieren und reduzierte Bewegung stoppen die Strömung. Keine neuen externen Assets oder Abhängigkeiten. Herkunft der bestehenden Ressourcen: [ASSET_LICENSES.md](../ASSET_LICENSES.md).

## Prüfung

- `npm test`: 46 Tests; Originalzustand, Wirtschaft, Kämpfe, Kamera, neue Kartengraphen, alle Rampenrichtungen, transportierte Einheiten, Sichtbarkeit, Freischaltung und Speicherfallback.
- `npm run test:campaign`: tatsächliche Chromium-Laufzeit, 1440 × 900, 390 × 844 und zusätzlich 360 × 740. Maus-/Touchbefehle, Zoom/Fit, Pause/Fortsetzen, LQ, Missionswechsel, drei Siege, Niederlagen und Neustart. Der vollständige Kampagnendurchlauf nutzt echte Battle-Befehle mit manuell fortgeschalteter Simulationszeit; kein gesetzter Gewinner und keine veränderten Garnisonen. Die Langzeitstrategie wird über die Simulations-API ausgeführt, zusätzliche Eingabetests über echte Maus-/Touchereignisse.
- Für beide neuen Karten werden sämtliche Feldzentren aus der realen Kamera projiziert und per Raycast wieder der richtigen logischen Zelle zugeordnet. Runtime-Screenshots wurden visuell geprüft. Alle dargestellten HQs, Zahlen und Wege bleiben zuordenbar.
- `node tests/campaign-production.mjs`: öffentlicher Build ohne Diagnose-API; echte Uhr, gesperrte Direktlinks, Missionswechsel und Menü bei 390 × 844 sowie 320 × 568 bestanden, keine JavaScript-Fehler.
- `npm run preview:prepare`: eigenständiger Produktions-Build mit deaktivierten QA-Hooks. Der Original-Build und GitHub Pages bleiben unangetastet.

Maschinenlesbare Ergebnisse: [runtime-report.json](campaign/runtime-report.json), [production-report.json](campaign/production-report.json). Aufnahmen stammen aus der laufenden Three.js-Anwendung, nicht aus Renderkonzepten.

| Bild | Desktop | Mobile |
|---|---|---|
| Menü | [Öffnen](campaign/menu-desktop.png) | [Öffnen](campaign/menu-mobile.png) |
| Windpass | [Öffnen](campaign/windpass-desktop.png) | [Öffnen](campaign/windpass-mobile.png) |
| Auenstrom | [Öffnen](campaign/auenstrom-desktop.png) | [Öffnen](campaign/auenstrom-mobile.png) |

## Grenzen

Die neuen Missionen sind geometrisch und taktisch unterschiedlich, teilen aber bewusst die bestehende Art-Familie. Auf sehr kleinen Displays ist Auenstrom in der Übersicht kompakter; Zoom/Fit und Verschieben bleiben verfügbar. Die automatisierten Siege beweisen Erreichbarkeit, keine abschließende menschliche Balance. Windpass kann durch den langen Höhenweg etwa sieben Minuten dauern; Spielstil und Entscheidungen verändern die Dauer stark. Es wurden keine echten Smartphones oder belastbaren Hardware-FPS gemessen. Der Wasserstil ist bewusst reduziert, ohne Reflexions- oder Strömungssimulation. Der Detailgrad bleibt der des vorhandenen stilisierten Dioramas, kein behauptetes AAA-Niveau.

## Lokal starten

```sh
cd experiments/hexfront-3d
npm ci
npm run dev
```

`http://127.0.0.1:4174/`. Produktion: `npm run build`, danach `npm run preview`. Für einen echten Neubeginn den lokalen Fortschritt für diese Origin löschen; ein laufendes Gefecht wird grundsätzlich nicht gespeichert.
