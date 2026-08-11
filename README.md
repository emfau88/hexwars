# Hexwars / HEXFRONT

Dieses Repository enthält zwei eigenständige Browser-Spiele mit unterschiedlichen Spielsystemen. Beide werden gemeinsam über GitHub Pages veröffentlicht, teilen aber weder Spiellogik noch Speicherstände.

## Direkt spielen

| Spiel | Stil | Link |
| --- | --- | --- |
| **HEXFRONT: Tactics** | Zugängliche, rundenbasierte Truppentaktik | **[Tactics spielen](https://emfau88.github.io/hexwars/)** |
| **HEXFRONT** | Echtzeit-Gebietskontrolle mit 10-Level-Kampagne | **[Kampagne spielen](https://emfau88.github.io/hexwars/campaign/)** |

## HEXFRONT: Tactics

Ein kompaktes, rundenbasiertes Taktikspiel im Stil der Kampagnenvariante. Das erste Gefecht ist als verständliches Training gebaut: Drei orange Einheiten treten gegen zwei blaue Gegner an, der eigene Kern ist widerstandsfähiger und die KI beginnt bewusst zurückhaltend. Eine kurze Einweisung und kontextabhängige Hinweise führen durch Auswahl, Bewegung, Angriff und Zugwechsel.

Das Interface ist mobile-first gestaltet und funktioniert per Touch, Maus oder Tastatur.

### Steuerung

1. Eine orange Einheit auswählen.
2. Auf ein grün markiertes Feld tippen, um sie zu bewegen.
3. Ein gold markiertes Ziel angreifen.
4. Den Zug mit **E** oder der großen Schaltfläche beenden.

Gewonnen wird durch die Zerstörung des blauen Kerns oder beider blauen Einheiten. Die Schaltfläche **Einweisung** öffnet die Kurzanleitung jederzeit erneut.

## HEXFRONT – 10-Level-Kampagne

Ein schnelles Echtzeit-Strategiespiel über Gebietskontrolle. Einheiten wachsen auf kontrollierten Hexfeldern nach und werden als Verbände über die Karte geschickt. Die Kampagne führt über zehn handgebaute Gefechte schrittweise Basen, Hügel, Gruppenbefehle und Relais ein. Fortschritt und Bestzeiten werden lokal im Browser gespeichert.

### Steuerung

1. Auf der Kampagnenkarte ein freigeschaltetes Level wählen.
2. Den Sendemodus **50 %**, **100 %** oder später **Bündel** auswählen.
3. Von einem eigenen orangefarbenen Feld zu einem erreichbaren Ziel ziehen.
4. Neutrale Felder einnehmen, Fronten verstärken und die feindliche Basis erobern.

Hügel stärken Verteidiger. Relais ermöglichen Sprünge über eine größere Distanz. Neue Regeln und schwierigere KI werden im Verlauf der Kampagne freigeschaltet.

## Projektstruktur

- `/index.html`, `/styles.css`, `/src/` – HEXFRONT: Tactics
- `/campaign/index.html` – eigenständige HEXFRONT-Kampagne
- `/tests/` – Tests der Tactics-Spiellogik
- `/scripts/build.mjs` – erzeugt das gemeinsame statische Deployment

## Lokal prüfen

```bash
npm test
npm run build
```

Danach enthält `dist/` beide Spiele. Das Projekt hat keine Laufzeit-Abhängigkeiten und kann über jeden statischen Webserver ausgeliefert werden.

## Deployment

Jeder Push auf `main` testet und baut beide Spiele über GitHub Actions. Das erzeugte `dist/`-Verzeichnis wird anschließend als GitHub Page veröffentlicht.
