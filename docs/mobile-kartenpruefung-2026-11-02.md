# Mobile Hinweiszeile und Kartenansicht

Stand: 2. November 2026. Nachtrag zum [Verbesserungsplan](hexfront-verbesserungsplan-2026-11-02.md), ausgelöst durch den Handy-Test des Nutzers.

## Behobenes Flackern

Die Befehlsvorschau lag als undurchsichtige Ebene über der Hinweiszeile. Jeder Ziehvorgang überdeckte dadurch den Hinweis; beim Loslassen erschien er wieder. Reproduziert auf Level 4: Hinweis und Vorschau begannen beide bei y=125, die Vorschau überdeckte die gesamte 40 Pixel hohe Hinweisfläche.

Die Vorschau nutzt jetzt die vorhandene Zeile für Zeit und Feldauswahl darüber. Anleitung und Truppenmenge bleiben gleichzeitig lesbar. Die Kartenfläche wächst oder schrumpft beim Ziehen nicht. Der Vorschautext wird nur bei einer tatsächlichen Änderung aktualisiert, damit die Statusansage für Screenreader nicht in jedem Zeichenbild neu gesetzt wird. Das reguläre Abschließen einer Einführung und wichtige Ereignismeldungen bleiben möglich.

## Alle zehn Karten geprüft

140 Kombinationen: zehn Karten × sieben Fenstergrößen × Deutsch/Englisch. Größen in CSS-Pixeln: 320×568, 360×800, 390×664, 390×844, 430×932, 768×1024 und 1440×900. Die verkürzte Ansicht 390×664 berücksichtigt weniger verfügbaren Platz, etwa durch Browserleisten; sie ersetzt keinen Safari-Test auf Hardware.

In jeder Kombination wurde die Karte geladen und ein echter Ziehvorgang vom eigenen HQ ausgelöst und abgebrochen. Ergebnis: keine Vorschau über dem Hinweis, keine abgeschnittene Vorschau, kein horizontaler Seitenüberlauf und keine Verschiebung oder Größenänderung des Canvas durch die Vorschau. Die zehn unterschiedlichen Kartenbilder wurden zusätzlich visuell kontrolliert. Zehn gezielte Browsertests für Bedienung, Speichern und Hinweisstabilität sowie die Typprüfung bestehen.

**Weitere Prüfungen laut Nutzer auf gängige Formate beschränken:** Handy 360×800, 390×844 und 430×932; Tablet 768×1024; Desktop 1440×900. Die zusätzlichen bereits vorhandenen Messungen bleiben als Nachweis erhalten, werden aber nicht als Pflichtmatrix fortgeführt.

Messwerte: [QA-Ergebnisse](../qa/mobile-layout-2026-11-02/results.json). [Hinweis während einer Ziehbewegung](../qa/mobile-layout-2026-11-02/hint-after-drag.png). Das sind lokale Chromium-Prüfungen; die erneute Abnahme am echten Handy bleibt offen.

## Vorschlag zur Kartengröße – noch nicht umgesetzt

Alle Karten werden derzeit anhand desselben 7×13-Rasters eingepasst, unabhängig davon, welche Felder die jeweilige Mission nutzt. Dadurch bleibt besonders bei Level 1 viel Landschaft um die kleine Spielfläche. Bei kurzen Handyansichten begrenzt dagegen vor allem die verbleibende Höhe die Feldgröße: Bei 320×568 bleiben ungefähr 321–331 Pixel für das Spielfeld, bei 390×844 sind es 607 Pixel.

Empfehlung: Den Ausschnitt je Karte aus allen spielbaren Feldern einschließlich HQ-Grafiken, Relais, Wächtern und Schildanzeige berechnen. Die komplette spielbare Fläche erhält einen Sicherheitsrand. Dekorative Landschaft darf seitlich abgeschnitten werden. Illustration, Feldgeometrie und Eingaben müssen denselben Maßstab und Versatz nutzen. Die Kamera bleibt während der Partie fest; keine Sprünge beim Erobern oder Auswählen.

Die folgende Tabelle zeigt die ungefähre rechnerische Größenreserve bei unveränderter Bedienoberfläche und 14 Pixeln Rand. Die Prozentwerte beziehen sich auf Feldabstände und Grafikgröße, nicht auf die Fläche. Sie sind Anhaltspunkte für einen späteren Entwurf, keine bereits eingebauten Zoomwerte.

| Karte | Besonderheit für den Ausschnitt | 360×800 | 390×844 | 430×932 |
|---|---|---:|---:|---:|
| 1 · Der Pfad | Kurze, schmale Spielfläche; beide HQs näher zusammen | +76 % | +75 % | +88 % |
| 2 · Zwei Wege | Beide Außenwege und die weit auseinanderliegenden HQs erhalten | +16 % | +15 % | +23 % |
| 3 · Das Zentrum | Seitliche Felder und Zentrum erhalten | +16 % | +15 % | +23 % |
| 4 · Hochland | Breite Reihen und alle Hügel erhalten | +16 % | +15 % | +23 % |
| 5 · Die zwei Pässe | Zwei Wächter sowie Schildanzeige oberhalb des HQs benötigen Platz | +10 % | +10 % | +18 % |
| 6 · Geteiltes Feld | Beide Ufer, Wächter und Schildanzeige erhalten | +10 % | +10 % | +18 % |
| 7 · Die Relaisinsel | Zentrales Relais und beide seitlichen Inselteile erhalten | +16 % | +15 % | +23 % |
| 8 · Signalgärten | Beide weit außen liegenden Relais samt Zahlen erhalten | +16 % | +15 % | +23 % |
| 9 · Drei Pässe | Alle drei Zugänge und die äußeren Hügel erhalten | +16 % | +15 % | +23 % |
| 10 · Der Ring | Beide Uferwege und Relais um den langen Eissee erhalten | +16 % | +15 % | +23 % |

Dass mehrere Reserven gleich ausfallen, liegt an ihrer gleichen äußeren Ausdehnung; Wege und Engstellen wurden trotzdem pro Karte betrachtet. Wächtergrafiken wurden konservativ einschließlich Schild berücksichtigt. Die endgültige Umsetzung muss zusätzlich Beschriftungen, Tutorialmarkierungen und Hilfeknöpfe gegen den gewählten Rand prüfen.

Für Level 1 würde ich zunächst ungefähr **60 % größere Felder** zeigen; das lässt mehr Landschaft und Platz für die Einführung als die rechnerische Grenze. Für die langen Karten würde ich den zusätzlichen Platz abhängig von Fensterhöhe und Karteninhalt nutzen, bei 390×844 etwa **10–15 %**, bei den Wächterkarten etwas vorsichtiger. Ein pauschaler Zoom von 150 % würde auf diesen langen Karten wichtige Bereiche abschneiden.

Als zweite, gesonderte Verbesserung bietet sich eine kompakte Hochkant-Bedienoberfläche an: weniger Titel- und Leerraum, etwa 35–50 Pixel zusätzliche Kartenhöhe als Ziel. Truppenstände, Modus, Nachschub und Pause müssen erreichbar bleiben; Schaltflächen behalten mindestens 44 Pixel Höhe. Diese Ansicht sollte bewusst eingeschaltet oder einmal beim Missionsstart festgelegt werden, statt ihre Höhe bei jeder Meldung zu ändern. Erst zusammen mit dem Ausschnitt je Karte kann die zusätzliche Höhe zuverlässig größere Felder ermöglichen.

Die vorhandene manuelle Vergrößerung mit Verschieben bleibt für Details nützlich. Als automatischer Standard wäre sie ungeeignet, weil wichtige Fronten außerhalb des sichtbaren Ausschnitts liegen könnten.

## Noch offen

- [x] Hinweisflackern reproduziert und korrigiert.
- [x] Alle zehn Karten in der Größen-/Sprachmatrix einschließlich Ziehvorgang kontrolliert.
- [x] Kartenspezifische Größenreserven und Empfehlungen dokumentiert.
- [ ] Korrigierte Hinweiszeile erneut auf dem echten Handy abnehmen.
- [x] Entscheidung für dieses Update: Die getestete Kartenansicht gefällt dem Nutzer und bleibt erhalten. Die vorgeschlagene zusätzliche Vergrößerung ist zurückgestellt, nicht umgesetzt.
- Eine spätere Änderung des Ausschnitts erfordert erneut die Prüfung aller zehn Karten mit Randbeschriftungen, Gebäuden, Einführung, Touch-Zielen, Verschieben und Orientierungswechsel.
