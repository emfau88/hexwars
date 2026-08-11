# Hexwars

Ein kompaktes, rundenbasiertes Taktikspiel für den Browser. Drei blaue Einheiten treten gegen eine KI an, um den gegnerischen Reaktorkern zu zerstören. Der Zünder kann Terrain in Brand setzen; Feuer verursacht Schaden und springt auf angrenzende Waldfelder über.

## Spielen

1. Eine blaue Einheit auswählen.
2. Auf ein türkis markiertes Feld klicken, um sie zu bewegen.
3. Ein orange markiertes Ziel angreifen.
4. Den Zug mit **E** oder der Schaltfläche beenden.

Ziel ist es, den roten Kern zu zerstören oder alle roten Einheiten auszuschalten.

## Lokal prüfen

```bash
npm test
npm run build
```

Danach kann der Inhalt von `dist/` über einen beliebigen statischen Webserver geöffnet werden. Das Projekt hat keine Laufzeit-Abhängigkeiten.

## Deployment

Jeder Push auf `main` testet und baut das Spiel über GitHub Actions. Das erzeugte `dist/`-Verzeichnis wird anschließend als GitHub-Page veröffentlicht.
