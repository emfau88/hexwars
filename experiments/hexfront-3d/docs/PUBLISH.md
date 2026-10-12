# Isolierte Veröffentlichung – 12.10.2026

## Technologie-Fassung: lokal fertig, Push ausstehend

Die neue Fassung wurde im isolierten Experiment implementiert. [Inhalt, Screenshots, Clip und Tests](TECHNOLOGY.md). Beide vollständigen Browserpartien (Maus und Touch) bestanden mit Sieg nach 167,1 s / 33 Befehlen, Niederlage bei Untätigkeit nach 257,55 s sowie Neustart. Der Produktions-Build enthält 27 Dateien und keine QA-API.

Am 12.10.2026 schlug die erneute GitHub-Verbindungsprüfung mit `Could not resolve host: github.com` fehl. Die rein lesende Windows-Prüfung fand nur 169.254-Adressen ohne IPv4-Standardgateway; auch eine direkte HTTPS-Verbindung zu 1.1.1.1 scheiterte. Es wurden keine DNS-/Netzwerkeinstellungen verändert. Deshalb ist die neue Fassung noch nicht öffentlich geprüft oder als veröffentlicht ausgewiesen. Die README-Links verweisen bis zum erfolgreichen Push ausdrücklich auf den bisherigen Stand.

## Bisher veröffentlicht: Drag-and-drop-Fix

Produktions-Commit: `47f5d8b59d5f89de398397c8893bcc30d2030d31`, ausschließlich auf `experiment/hexfront-3d-diorama`. Maus/Touch, vollständige Partien, fünf Kamera-/Eingabe-Viewports und Produktions-Build bestanden. [Steuerung und Nachweise](DRAG.md).

Nach erneutem Verbinden mit dem Mobilfunk-Hotspot gelang der Push am 12.10.2026. Beide README-Testlinks zeigen jetzt diesen Produktionsstand. Main/Pages bleiben unverändert.

**[Aktuelle Version mit Drag-and-drop spielen](https://rawcdn.githack.com/emfau88/hexwars/47f5d8b59d5f89de398397c8893bcc30d2030d31/experiments/hexfront-3d/preview/index.html)** — beim ersten Besuch „Open the page“ bestätigen.

- Öffentliche Browserprüfung bestanden: Desktop 1440 × 900 und Touch-Mobile 390 × 844; Start, echter Ziehbefehl, laufende Uhr und Pause. Kein horizontaler Überlauf, keine Produktions-QA-API, keine Spiel-/Assetfehler. [Zusammengeführter Bericht](drag/live/production-report.json) mit den getrennten [Desktop-](drag/live/desktop-report.json) und [Mobile-Läufen](drag/live/mobile-report.json).
- Alle **25 Dateien / 2.309.509 Bytes** vom CDN geladen und per SHA-256 gegen die Git-Blobs geprüft. [Öffentliche Dateiprüfung](drag/live/assets-report.json), [Produktionsmanifest](drag/build-report.json).
- Öffentliche Aufnahmen während des Ziehens tatsächlich visuell geprüft: [Desktop](drag/live/desktop-drag.png), [Mobile](drag/live/mobile-drag.png). Quelle, Ziel, Weg und sendbare Stärke sind zugeordnet; der Hinweis überdeckt das mobile Befehlsfeld nicht.
- Vollständige lokale Maus-/Touch-Partien mit Sieg, Niederlage und Neustart sowie fünf Kamera-/Eingabe-Viewports bestanden. [Details](DRAG.md). Das veröffentlichte Runtime-Paket ist bytegleich mit diesem geprüften Produktionsstand.

Die vorherigen Online-Versuche wurden durch einen Netzwerkwechsel und einen Lade-Timeout unterbrochen. Ein anschließender Mobile-Lauf führte den Spielbefehl erfolgreich aus, meldete aber eine blockierte Werbeanfrage der Hosting-Bestätigungsseite ([unveränderter Rohbericht](drag/live/mobile-host-warning-report.json)). Der Test protokolliert solche Anfragen jetzt getrennt als `hostWarnings`; echte Spielanfragen bleiben fehlerrelevant. Der abschließende Mobile-Lauf bestand. Die öffentlichen Einzelmessungen lagen bei 5,11 s Desktop bzw. 4,98 s Mobile bis zur Bereitschaft; ein früherer Versuch benötigte 23,25 s. Das ist keine Ladezeitgarantie. Software-Rendering und Touch-Emulation ersetzen keine Prüfung auf physischen Android-/iOS-Geräten oder in Safari; 60 FPS sind dort weiterhin nicht belegt.

## Vorheriger Stand: Overlay-/HUD-Pass

- Branch: `experiment/hexfront-3d-diorama`; Produktions-Commit: `2656632061cf3a538c7001bff8c74e2bb56a324c`.
- **[Vorherigen HUD-Stand spielen](https://rawcdn.githack.com/emfau88/hexwars/2656632061cf3a538c7001bff8c74e2bb56a324c/experiments/hexfront-3d/preview/index.html)** – beim ersten Besuch „Open the page“ bestätigen.
- Ruhigere Zahlen und Auswahlmarkierungen, kompakter mobiler Match-HUD; Art-Pass, Kamera, alle 37 Sektoren und Spielregeln bleiben erhalten. [Vorher/Nachher und vollständige Tests](HUD.md).
- Öffentliche Browserprüfung nach dem Push bestanden: Desktop 1440 × 900 und Touch-Mobile 390 × 844, Start, Auswahl, Befehle, laufende Uhr und Pause; keine Browser-/HTTP-Fehler, kein horizontaler Überlauf und keine Produktions-QA-API. [Live-Bericht](hud-live/production-report.json).
- Alle **25 Dateien / 2.303.306 Bytes** vom CDN abgerufen und bytegenau per SHA-256 geprüft. [Dateiprüfung](hud-live/assets-report.json), [Produktionsmanifest](hud/build-report.json).
- Die öffentlichen Befehlsbilder wurden tatsächlich visuell geprüft: [Desktop](hud-live/desktop-command.png), [Mobile](hud-live/mobile-command.png). Weitere Start-/Matchbilder liegen unter `hud-live/`.
- Vollständige Partien mit Sieg, Niederlage und Neustart auf Desktop/Mobile sowie Eingabeprüfungen auf fünf Viewports bestanden. Reale Mobilgeräte und Safari bleiben ungeprüft; keine 60-FPS-Zusage. Details in [HUD.md](HUD.md).
- Nur der Experiment-Branch wird veröffentlicht. `main`, Pages-Workflow und bisherige Veröffentlichungen bleiben unverändert.

## Historie: Veröffentlichung des Art-Passes vor dem HUD-Update

Die folgenden Nachweise und Dateizahlen beschreiben ausdrücklich den früheren Stand `e9330f8`; der aktuelle Play-Link steht oben und in beiden READMEs.

- Experiment: `experiment/hexfront-3d-diorama`.
- Art-Commit: `c66de31b2d1ea3dc69f26eb299e7e7e3056a6b8f`.
- Statischer Produktions-Build: `e9330f8388f6048b60d6b704ebde1e1b82ae28ac`.
- [Öffentlicher Play-Link](https://rawcdn.githack.com/emfau88/hexwars/e9330f8388f6048b60d6b704ebde1e1b82ae28ac/experiments/hexfront-3d/preview/index.html) – veröffentlicht und im Browser geprüft.
- Am 12.10.2026 auf GitHub gepusht. Öffentliche Browserprüfung auf Desktop und Mobile bestanden; der Remote-Branch wurde nach dem Push mit dem lokalen Commit verglichen.
- `main` bleibt bei `29ff12d6897db9b994b97be980efb0037e54d476`; Pages-Workflow und bestehende Veröffentlichungen werden nicht geändert.

Der erste Git-Push brach während des Uploads mit einem Verbindungsabbruch ab. Nachfolgend hatte Windows für WLAN keine IPv4-Adresse und keine IPv4-Standardroute; GitHub war nicht mehr erreichbar. Der GitHub-CLI-Benutzer `emfau88` besitzt Schreibrechte am Repository. Der separate GitHub-Connector besitzt dagegen keine Berechtigung zum Anlegen des Branches. Nach Wechsel auf einen Mobilfunk-Hotspot gelang der Push. Keine Zugangsdaten wurden in Dateien übernommen.

Vercel ist für diesen Weg nicht nötig. Die vorherige URL https://hexfront-3d-diorama.vercel.app/ enthält weiterhin den alten Prototyp. Das Vercel-Projekt konnte wegen fehlender Kontoberechtigung nicht aktualisiert werden.

## Testlink ohne zusätzliche Anmeldung

[raw.githack.com](https://raw.githack.com/) liefert die eingecheckten statischen Dateien mit den für HTML, JavaScript und Modelle nötigen MIME-Typen aus. Die CDN-URL enthält den vollständigen Commit-Hash: Ein späterer Branch-Push ändert diesen Teststand nicht unbemerkt. Der erste HTML-Aufruf zeigt wie in der [Dokumentation](https://raw.githack.com/) beschrieben eine Bestätigungsseite für das Ziel-Repository. **„Open the page“** öffnet das Spiel; dieser Ablauf wurde im Desktop- und Mobile-Test jeweils tatsächlich durchlaufen. Es wird kein Konto benötigt. Dies ist eine kostenlose experimentelle Vorschau ohne Verfügbarkeitsgarantie.

`preview/` enthält ausschließlich die 24 Dateien des Produktions-Builds, keine Tests, Geheimnisse, Server oder Entwicklungs-Diagnose-API. Alle Spielfiles und Modelle nutzen relative URLs und funktionieren auch im Unterverzeichnis. Git speichert mit den Quelldateien identische Assets als dieselben Blobs.

## Prüfungen dieses Veröffentlichungsschritts

- Alle 15 vorhandenen Logik- und Kameratests erneut bestanden.
- `npm run preview:prepare` erfolgreich; Produktions-Diagnosen sind deaktiviert.
- Jede Datei in `preview/` wurde mit `dist/` bytegenau verglichen. Die [SHA-256-Liste](publish/build-report.json) bezeichnet die anschließend normalisierten Git-Blobs; lokale Windows-Zeilenenden können abweichen.
- Unter `http://127.0.0.1:4178/preview/index.html` mit Chromium geprüft: Desktop 1440 × 900 und Touch-Portrait 390 × 844, Start, Auswahl, echter Truppenbefehl, laufende Uhr und Pause bestanden. Keine fehlenden Assets, Browserausnahmen oder horizontaler Überlauf. [Maschinenlesbarer Bericht](publish/production-report.json).
- Neue Runtime-Screenshots tatsächlich visuell geprüft: [Desktop](publish/final-desktop.png), [Mobile](publish/final-mobile.png). Hexkonturen und orange/blaue Besitzflächen sind sichtbar; Rampen haben keine Querstreifen.
- **Öffentlicher Endpunkt bestanden:** Der README-Play-Link wurde mit frischem Browserkontext in Desktop 1440 × 900 und Touch-Portrait 390 × 844 geöffnet. Repository-Hinweis bestätigt, Szene vollständig geladen, Produktion ohne QA-API, kein horizontaler Überlauf, echte Auswahl und Truppenbefehle, laufende Uhr und Pause bestanden. Keine HTTP-Fehler und keine Browserausnahmen. [Online-Bericht](publish-live/production-report.json).
- **Auslieferungsintegrität:** Alle 24 Dateien über den öffentlichen CDN-Pfad abgerufen: 2.295.210 Bytes, HTTP 200, sämtliche SHA-256-Werte stimmen mit dem Produktions-Commit überein. HTML, JavaScript und CSS haben passende MIME-Typen. [Dateiprüfung](publish-live/assets-report.json).
- **Öffentliche Runtime-Screenshots:** [Desktop](publish-live/final-desktop.png) und [Mobile](publish-live/final-mobile.png), beide tatsächlich visuell geprüft. Hexkonturen, Teamflächen und beide HQs sind klar zuzuordnen; die Rampenquerstreifen fehlen wie beauftragt.
- Der öffentliche Test verwendete Chromium/SwiftShader; das ist weiterhin kein Leistungsnachweis für echte Smartphones. Gemessene Ladebereitschaft dieses einzelnen Netzwerktests: Desktop 8,24 s, Mobile 3,47 s. Daraus wird keine allgemeine Ladezeit- oder FPS-Garantie abgeleitet.
- Die vollständigen Match-, Höhen-, Eingabe- und Art-Tests des unveränderten Spiels stehen in [ART.md](ART.md).

## Nachweis und Isolation

Der Remote-Branch enthielt nach dem ersten erfolgreichen Upload den vorbereiteten Commit `35587a6e03465c98d05e033064c3ccdcb683470a`. Der danach folgende Dokumentationscommit ergänzt diesen Bericht, die öffentlichen Screenshots und die aktualisierten README-Hinweise. Die spielbare CDN-URL bleibt auf den unveränderten Build-Commit `e9330f8388f6048b60d6b704ebde1e1b82ae28ac` fixiert.

`main` wurde auf GitHub erneut als `29ff12d6897db9b994b97be980efb0037e54d476` bestätigt. Der vorhandene Pages-Workflow reagiert nur auf Pushes nach `main` oder einen manuellen Start. Es gab keinen Merge, Force-Push, Workflow-Start oder Eingriff in bestehendes Hosting.

## Einen späteren Teststand erzeugen

```powershell
cd experiments/hexfront-3d
npm test
npm run preview:prepare
```

`preview/` ist erzeugte Ausgabe; Änderungen erfolgen in `src/`, `public/`, `vendor/` und `index.html`. Das Skript bereinigt ausschließlich die fest geprüften Experiment-Unterordner `dist/` und `preview/`. Den neuen Build committen, den neuen vollständigen SHA in den Play-Link beider README-Dateien übernehmen und nur den Experiment-Branch pushen. Keine Pages-Konfiguration nötig.

Lokaler Start wie bisher: `npm run dev`, danach http://127.0.0.1:4174. Separater Produktionsstart: `npm run build`, `npm run preview`.
