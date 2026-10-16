# Nachschub: 30 Sekunden in Zentrale Front

Stand: 16.10.2026 · Branch codex/lane-wars.

## Umfang

Ausschließlich der Nachschub-Cooldown des Hauptmodus sinkt von 35 auf **30 Sekunden**, für beide Fraktionen. Unverändert: 80 Credits, 20-Sekunden-Wellen, Einkommen, Fabrikkosten, Einheiten, HQs, KI-Entscheidungslogik und alle Ausfahrten. Erste Front und Wiesenkrieg behalten 15 Sekunden und 60 Credits. Das Kampflabor bleibt erhalten.

HUD und Hinweise lesen bereits den tatsächlichen Regelwert; kein neuer Anzeigewert wurde hart codiert. Beim Laden eines zentralen Spielstands mit dem früheren Wert 35 wird genau diese Regel aktualisiert. Ein noch laufender Cooldown verkürzt sich um fünf Sekunden, höchstens bis „bereit“. Bereits verstrichene Zeit zählt weiterhin. Andere gespeicherte Werte werden nicht überschrieben.

## Technische Prüfung

- **83/83 Node-Tests bestanden**, einschließlich unveränderter M1-Kampfabläufe, Missionen, Wirtschaft und vollständiger Referenzläufe.
- Neue Tests prüfen beide Fraktionen an der Grenze 29,95 / 30,00 Sekunden, unveränderte Kosten und Spielregeln sowie alte und neue Spielstände.
- **Browserprüfung bestanden:** tatsächlicher HUD-Klick, Anzeige 30,0 Sekunden, Kostenabzug 80, Speichern/Fortsetzen mit 18 Sekunden Restzeit, Ablehnung vor Ablauf, Freigabe bei Ablauf. Beide alten Missionen behalten ihre Werte. Keine Konsolen-, Seiten- oder Ressourcenfehler.
- Statischer Build über npm run build geprüft.
- Öffentlicher README-Playlink auf Laufzeitcommit c738c46 im Browser geprüft: echte Nachschubbestellung, Anzeige „Bereit in 30.0 s“, keine Seiten- oder Spielressourcenfehler. [Öffentliches Prüfergebnis](supply-30-qa/public.json).

Reproduktion: npm test; npm run test:supply bei laufendem lokalen Server; npm run build.

[Browser-Ergebnis](supply-30-qa/browser.json) · [HUD-Screenshot](supply-30-qa/cooldown-30.png) · [Sechs Referenzläufe mit Befehlsverlauf](supply-30-qa/reference-games.json)

## Auswirkungen auf Referenzpartien

Je Paarung wurde auch die gespiegelte Fraktionsverteilung geprüft. Nur der Cooldown wurde verändert.

| Paarung | Ergebnis | Dauer |
| --- | --- | --- |
| Vorhut / Eisenkeil | Eisenkeil gewinnt, jeweils 590 HQ-LP übrig | 7:15,80 |
| Vorhut / Aufbaukommando | Vorhut gewinnt, jeweils 800 HQ-LP übrig | 9:25,35 |
| Eisenkeil / Aufbaukommando | Beide HQs leben: 794 / 672 LP | nach 12:00 offen |

**Vier von sechs Läufen enden, zwei bleiben am Messlimit offen.** Zwölf Minuten sind nur die Auswertungsgrenze, kein Spieltimer. Der kürzere Cooldown beseitigt festgefahrene Fronten nicht und verschlechtert diese kleine Referenzserie gegenüber dem vorherigen Stand. Die Resultate sind deterministische KI-Proben, keine menschlichen Siegquoten. Es wurden ausdrücklich keine zusätzlichen Balanceanpassungen vorgenommen. Der breite 56er-Audit des vorherigen Berichts wurde hier nicht erneut ausgeführt.

## Präzisierung des Spiegeltests

Die alte Testannahme „alle drei Paarungen enden vor zwölf Minuten“ trifft mit 30 Sekunden nicht mehr zu. Der Regressionstest hält deshalb die oben beobachteten Ergebnisse einschließlich des offenen Spiels explizit fest.

Zusätzlich muss ein vollständig gespiegelter KI-Test die Aufrufreihenfolge der Controller spiegeln. Die bestehende KI beobachtet nacheinander; ein im selben Tick zuvor bestellter Nachschub kann in der folgenden Beobachtung enthalten sein. Ohne gespiegelte Aufrufreihenfolge bestellt Vorhut bei Sekunde 564 einmal Drohnen statt Fernkämpfern: 232 statt 230 produzierte Roboter. Sieger, Dauer, HQ-Werte und Ausgaben dieser Partie sind gleich. Mit gespiegelter Reihenfolge sind auch beide vollständigen Wirtschafts-/Produktionsmetriken identisch.

Der Diagnosehelfer unterstützt diese Spiegelung jetzt; **die KI im Spiel wurde nicht verändert**. Die Abhängigkeit von der Beobachtungsreihenfolge bleibt eine bekannte technische Einschränkung und wurde nicht durch weitere Gameplayänderungen behoben.

## Fabrik

[Konzepttafel und Modellierungsbrief](factory-concept/BRIEF.md). Noch kein neues GLB, keine neue Fabrik im Spiel. Die vom Nutzer verlangte Freigabe des echten Modells steht aus.
