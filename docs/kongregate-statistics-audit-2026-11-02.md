# HEXFRONT – Kongregate-Statistiken und Update-Abnahme

Stand: 2. November 2026. Quellcode, öffentlich ausgelieferte Spielversion, offizielles API-Handbuch und vom Nutzer gezeigte Statistik-Konfiguration geprüft. Keine Portal-Einstellungen verändert, keine Testwerte an Kongregate gesendet, kein Update veröffentlicht.

## Warum derzeit keine Werte ankommen

**Bestätigter Fehler im veröffentlichten Spiel:** Kongregate lädt HEXFRONT unter `game324999.konggames.com/gamez/0032/4999/live/`. Der ausgelieferte JavaScript-Code akzeptiert für die Statistik-Initialisierung jedoch ausschließlich `kongregate.com` beziehungsweise dessen Subdomains. Er beendet die Initialisierung deshalb bereits vor `loadAPI()`. Das betrifft auch `initialized` und den Missionsfortschritt, nicht nur die Finalzeit.

**Zusätzlicher Fehler im lokalen Quellstand:** Die aktuelle `index.html` bindet das Kongregate-SDK nicht ein; die bisherige Klasse erwartete trotzdem eine bereits vorhandene globale API. Im öffentlich ausgelieferten HTML ist das SDK dagegen bereits vorhanden. Fehlende SDK-Einbindung ist somit ein zusätzlicher Fehler für das nächste Update, nicht die Ursache im aktuellen Live-HTML. Die offizielle Dokumentation verlangt zuerst das Laden des SDK und danach `loadAPI()` / `getAPI()`: [JavaScript API](https://docs.kongregate.com/docs/javascript-api).

Die öffentlichen Lifetime-Abfragen für die IDs 143641 (`initialized`), 143642 (`missions_completed`) und 143645 (`final_mission_best_ms`) antworteten bei der Prüfung mit `success: true` und leeren Ergebnislisten. Das belegt leere öffentliche Ergebnisse; für die Ursache ist die falsche Domain-Prüfung im ausgelieferten Code maßgeblich.

## Was auf dem Screenshot richtig beziehungsweise unvollständig ist

Die vier Namen stimmen exakt mit dem Spielcode überein. Auch Max für Fortschritt/Abschluss und Min für die Bestzeit sind richtig. Die gezeigte `/statistics`-Seite verwaltet Definitionen; sie zeigt nicht automatisch Spielerwerte neben jeder Definition.

Nur `final_mission_best_ms` trägt auf dem Screenshot die Kennzeichnung „Leaderboard“. Für sichtbaren Kampagnenfortschritt muss bei `missions_completed` die Option „Display in Leaderboards“ aktiviert werden. Registrierung einer Statistik und Anzeige als Rangliste sind unterschiedliche Einstellungen. Siehe [Statistics & High Scores](https://docs.kongregate.com/docs/concepts-statistics).

Die vorhandene Finalstatistik hängt im Code an Mission 10. Solange diese gesperrt war, konnte ein regulärer Spieler weder die Finalzeit noch `campaign_complete` auslösen. Das neue lokale Spiel schaltet Mission 10 nach dem Sieg in Mission 9 frei.

## Lokal korrigiert und geprüft

- [x] Tatsächliche Kongregate-CDN-Domain `*.konggames.com` erkennen.
- [x] Extern gehostete Spiele innerhalb eines Kongregate-Iframes berücksichtigen; gewöhnliche lokale, GitHub-, Y8- und andere Portalaufrufe laden kein Kongregate-SDK.
- [x] Fehlendes offizielles SDK asynchron nachladen; pro Spielinstanz nur einmal initialisieren.
- [x] Fortschritt nach API-Bereitschaft und nach späterem Login erneut senden. Bereits gespeicherte Fortschritte werden übernommen.
- [x] SDK-Ausfall lässt das Spiel weiterlaufen; ein Diagnosehinweis erscheint in der Entwicklerkonsole.
- [x] Ungültige und auf null gerundete Bestzeiten verwerfen, statt eine Min-Rangliste mit einer uneinholbaren Null zu beschädigen.
- [x] Acht gezielte Tests bestanden; vor der Korrektur schlugen sieben Anforderungen fehl, darunter die echte CDN-Adresse und das Nachladen.
- [x] Browserprüfung des vollständigen Spiels unter nachgebildeter CDN-Adresse: SDK-Bereitschaft, alter 9/10-Spielstand, Sieg mit 10/10, Abschluss-/Zeitübertragung, Neuladen und Login bestanden. Bei blockiertem SDK bleibt das Spiel bedienbar. Die API war ein lokaler Testersatz; echte Serverannahme ist damit nicht bewiesen.
- [ ] Echte Übertragung in Kongregates Vorschau mit angemeldetem Konto und anschließend sichtbarem Ranglisteneintrag nachweisen.

Die bisherige Testsuite gab dem Adapter ein bereits fertiges SDK auf `www.kongregate.com`. Sie prüfte weder die tatsächliche Iframe-Domain noch das SDK-Laden. Daher blieb dieser Integrationsfehler trotz grüner Tests unentdeckt.

## Sinnvolle Statistiken

| Statistik | Typ | Sichtbar? | Empfehlung |
| --- | --- | --- | --- |
| `missions_completed` | Max | Ja | Bestehende Statistik als erste sichtbare Rangliste aktivieren; Fortschritt 0–10. |
| `campaign_complete` | Max | Eher nein | Bestehendes Abschlussmerkmal 0/1 für mögliche Achievements behalten. |
| `final_mission_best_ms` | Min | Ja | Bestehende Rangliste für die schnellste gewonnene Mission 10 behalten; ausschließlich positive Zeiten senden. |
| `initialized` | Max | Nein | Technisches Startsignal behalten; kein sinnvoller Spielerwettbewerb. |
| `campaign_best_total_ms` | Min | Ja | Empfohlene neue Statistik: Summe der zehn persönlichen Level-Bestzeiten, erst wenn alle zehn mit gültiger Zeit gewonnen wurden. Im Namen/Beschreibung klar als Summe von Einzelbestzeiten ausweisen, nicht als zusammenhängenden Speedrun. |
| `level_06_best_ms` / weitere ausgewählte Level | Min | Optional | Zusätzliche Streckenrekorde für interessante Missionen; nicht sofort zehn zusätzliche Ranglisten anlegen. |

Neue Statistiken sind hier Vorschläge und noch nicht implementiert oder im Portal angelegt. Zunächst die vorhandene Übertragung reparieren und den Missionsfortschritt sichtbar schalten. Die Summe der Level-Bestzeiten wäre anschließend die nützlichste Erweiterung.

Gesamte eroberte Felder oder produzierte Truppen empfehle ich nicht als zentrale Ranglisten: Sie belohnen unnötige Eroberungen und langes Warten. Das widerspricht dem sinnvollen Umgehen teurer neutraler Felder und einem konzentrierten HQ-Angriff. Bei künftigen wesentlichen Balanceänderungen müssen Zeitrekorde nach Regelversion getrennt betrachtet werden.

## Prüfung vor Veröffentlichung

1. Verbleibende lokale Abnahmepunkte im [Verbesserungsplan](hexfront-verbesserungsplan-2026-11-02.md) schließen; bewusst zurückgestellte Optionen benennen.
2. Erst danach ein neues, eindeutig bezeichnetes Kongregate-Paket aus diesem Quellstand erstellen und auf Debugfreiheit/Assetpfade prüfen. Die früher erzeugten Test-ZIPs enthalten die nachträglichen Bewegungs- und Statistik-Fixes noch nicht.
3. Paket in der Portal-Vorschau testen, bevor es veröffentlicht wird. Dort muss `initialized = 1` ankommen, anschließend ein echter Missionssieg den Fortschritt erhöhen und Reload denselben Fortschritt erneut übertragen.
4. Bei `missions_completed` die Ranglistenanzeige aktivieren und einen echten Eintrag kontrollieren. Für API-Diagnose nennt Kongregate den Parameter `?debug_level=4` auf der Spielseite. SDK-Bereitschaft allein bestätigt noch keine Serverannahme.
5. Den normalen Weg Level 9 → 10, eine echte gewonnene Finalmission, deren positive Bestzeit sowie den gespeicherten Abschluss 10/10 prüfen. Für öffentliche Ranglisten keine per Debug ausgelösten Siege verwenden.

Ein vollständiger menschlicher Kampagnendurchlauf, physische Touchgeräte und die tatsächliche Portal-Annahme sind weiterhin gesondert zu prüfen. Daher ist der Stand aktuell ein lokaler Testkandidat und noch kein vollständig freigegebenes Update.
