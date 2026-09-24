# Bulk 8H – Relay-Visualisierung und Zelltypen-Legende

**Stand:** 24. September 2026  
**Status:** `DONE`  
**Scope:** Visuelle Lesbarkeit des bestehenden Relay-Systems und eine levelabhängige CELL-TYPES-Legende. Keine Änderung an Relay-Reichweite, Guardian-Mechanik oder Balance.

## Ergebnis

Relay und Guardian sind jetzt bereits an ihrer Silhouette eindeutig voneinander zu unterscheiden. Das Relay nutzt ein eigenes Funkmast-Artwork mit offenem Signalring; der Guardian behält seine separate Schildgenerator-Gestalt. Ein kontrolliertes Relay zeigt dauerhaft eine dezente Reichweiten-Aura. Beim Drücken und Halten werden alle tatsächlich erreichbaren Spielfelder in Distanz zwei markiert und über feine Funklinien mit dem Relay verbunden. Dieselbe Rückmeldung funktioniert mit Maus und Touch.

Die rechte `CELL TYPES`-Kachel verwendet nun echte Struktur-Icons für Base, Relay und Guardian. Hill und Landscape erhalten klar lesbare, code-native Symbole. Jeder Eintrag wird ausschließlich eingeblendet, wenn der Zell- oder Strukturtyp im aktuell geladenen Level vorkommt. Dadurch nennt Level 7 beispielsweise Base, Relay und Landscape, aber weder Hill noch Guardian.

Der englische Standardtext beschreibt die Relay-Regel präzise: `Relay: only this cell can send up to 2 hexes away`. Die deutsche Übersetzung lautet: `Relais: Nur dieses Feld kann bis zu 2 Hexfelder weit senden`.

## Assets und QA

- Runtime-Relay: `public/assets/structures/relay-neutral-v2.png` (512 × 512 px, transparent, unter 300 KB)
- ImageGen-Quelle: `docs/qa/bulk-8h-relay-visuals/relay-imagegen-source-v2.png`
- Finale Desktop-/Mobile-Captures: `docs/qa/bulk-8h-relay-visuals/level07-runtime-final/`
- Ausgewählte Reichweitenzustände: `docs/qa/bulk-8h-relay-visuals/relay-selected-desktop.png` und `relay-selected-mobile.png`
- Übernahmezustände für Spieler und Gegner: `docs/qa/bulk-8h-relay-visuals/relay-owned-*.png`

Built-in Image Generation erzeugte ein neutrales Top-down-Kommunikationsrelais passend zur bestehenden HQ-/Guardian-Art-Direction: kompakter runder Sockel, schlanker Funkmast und offener Signalring, ohne Seitenmodule, Dreipunktform oder Schildgenerator-Silhouette. Der Export wurde anschließend als transparentes Runtime-Sprite optimiert.

Typprüfung und alle 108 Logik-/Regressionstests bestehen. Die gezielten Browserfälle für Relay und Guardian wurden jeweils auf Desktop und Mobile vollständig ausgeführt; der bekannte Windows-Playwright-Cleanup musste nach dem letzten abgeschlossenen Fall manuell beendet werden. Der Produktions-Build und das separate Kongregate-Paket wurden erfolgreich erstellt.
