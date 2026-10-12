# Isolierte Veröffentlichung – 12.10.2026

## Aktueller Status

- Experiment: `experiment/hexfront-3d-diorama`.
- Art-Commit: `c66de31b2d1ea3dc69f26eb299e7e7e3056a6b8f`.
- Statischer Produktions-Build: `e9330f8388f6048b60d6b704ebde1e1b82ae28ac`.
- [Vorbereiteter Play-Link](https://rawcdn.githack.com/emfau88/hexwars/e9330f8388f6048b60d6b704ebde1e1b82ae28ac/experiments/hexfront-3d/preview/index.html) – erst nach erfolgreichem Push erreichbar.
- Lokal geprüft und committet. GitHub-Upload und öffentliche Browserprüfung noch ausstehend.
- `main` bleibt bei `29ff12d6897db9b994b97be980efb0037e54d476`; Pages-Workflow und bestehende Veröffentlichungen werden nicht geändert.

Der erste Git-Push brach während des Uploads mit einem Verbindungsabbruch ab. Nachfolgend hatte Windows für WLAN keine IPv4-Adresse und keine IPv4-Standardroute; GitHub war nicht mehr erreichbar. Der GitHub-CLI-Benutzer `emfau88` besitzt Schreibrechte am Repository. Der separate GitHub-Connector besitzt dagegen keine Berechtigung zum Anlegen des Branches. Keine Zugangsdaten wurden in Dateien übernommen.

Vercel ist für diesen Weg nicht nötig. Die vorherige URL https://hexfront-3d-diorama.vercel.app/ enthält weiterhin den alten Prototyp. Das Vercel-Projekt konnte wegen fehlender Kontoberechtigung nicht aktualisiert werden.

## Testlink ohne zusätzliche Anmeldung

[raw.githack.com](https://raw.githack.com/) liefert die eingecheckten statischen Dateien mit den für HTML, JavaScript und Modelle nötigen MIME-Typen aus. Die CDN-URL enthält den vollständigen Commit-Hash: Ein späterer Branch-Push ändert diesen Teststand nicht unbemerkt. Laut [Dokumentation](https://raw.githack.com/) zeigt der Dienst bei einem ersten HTML-Aufruf eine Bestätigungsseite für das Ziel-Repository. Es wird kein Konto benötigt. Dies ist eine kostenlose experimentelle Vorschau ohne Verfügbarkeitsgarantie.

`preview/` enthält ausschließlich die 24 Dateien des Produktions-Builds, keine Tests, Geheimnisse, Server oder Entwicklungs-Diagnose-API. Alle Spielfiles und Modelle nutzen relative URLs und funktionieren auch im Unterverzeichnis. Git speichert mit den Quelldateien identische Assets als dieselben Blobs.

## Prüfungen dieses Veröffentlichungsschritts

- Alle 15 vorhandenen Logik- und Kameratests erneut bestanden.
- `npm run preview:prepare` erfolgreich; Produktions-Diagnosen sind deaktiviert.
- Jede Datei in `preview/` wurde mit `dist/` bytegenau verglichen. Die [SHA-256-Liste](publish/build-report.json) bezeichnet die anschließend normalisierten Git-Blobs; lokale Windows-Zeilenenden können abweichen.
- Unter `http://127.0.0.1:4178/preview/index.html` mit Chromium geprüft: Desktop 1440 × 900 und Touch-Portrait 390 × 844, Start, Auswahl, echter Truppenbefehl, laufende Uhr und Pause bestanden. Keine fehlenden Assets, Browserausnahmen oder horizontaler Überlauf. [Maschinenlesbarer Bericht](publish/production-report.json).
- Neue Runtime-Screenshots tatsächlich visuell geprüft: [Desktop](publish/final-desktop.png), [Mobile](publish/final-mobile.png). Hexkonturen und orange/blaue Besitzflächen sind sichtbar; Rampen haben keine Querstreifen.
- Der veröffentlichte HTTP-Endpunkt wurde noch nicht geprüft. Das lokale Ergebnis ist kein Nachweis für die Erreichbarkeit des externen Dateidienstes.
- Die vollständigen Match-, Höhen-, Eingabe- und Art-Tests des unveränderten Spiels stehen in [ART.md](ART.md).

## Veröffentlichung fortsetzen

Im vollständigen Checkout `hexwars-art-publish`:

```powershell
git status --short
git branch --show-current
git push -u origin experiment/hexfront-3d-diorama
```

Kein Force-Push und kein Merge nach `main`. Anschließend den Branch-SHA auf GitHub vergleichen, den Play-Link im Browser öffnen und Desktop/Mobile prüfen. Erst nach erfolgreicher Prüfung den ausstehenden Status in beiden README-Dateien und diesem Bericht aktualisieren.

## Einen späteren Teststand erzeugen

```powershell
cd experiments/hexfront-3d
npm test
npm run preview:prepare
```

`preview/` ist erzeugte Ausgabe; Änderungen erfolgen in `src/`, `public/`, `vendor/` und `index.html`. Das Skript bereinigt ausschließlich die fest geprüften Experiment-Unterordner `dist/` und `preview/`. Den neuen Build committen, den neuen vollständigen SHA in den Play-Link beider README-Dateien übernehmen und nur den Experiment-Branch pushen. Keine Pages-Konfiguration nötig.

Lokaler Start wie bisher: `npm run dev`, danach http://127.0.0.1:4174. Separater Produktionsstart: `npm run build`, `npm run preview`.
