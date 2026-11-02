# HEXFRONT – Änderungen und ausstehende Abnahme

Stand: 2. November 2026. Lokaler Testkandidat, noch keine Veröffentlichung. Verbindlicher Status: [Verbesserungsplan](hexfront-verbesserungsplan-2026-11-02.md).

Für die nächste manuelle Testsitzung: [Konkrete Testcheckliste mit erwarteten Ergebnissen](manuelle-testcheckliste-2026-11-02.md).

## Behobene Fehler

- Auto-Nachschub räumt Felder mit laufendem Kampf oder eintreffendem Angriff nicht mehr automatisch.
- Zielkapazitäten berücksichtigen manuelle und automatische Verstärkungen gemeinsam; gleichzeitige Quellen reservieren ihren Platz.
- Überzählige Truppen kehren sichtbar zurück oder warten auf freien Platz, statt still zu verschwinden.
- Gültige vorwärts gerichtete Nachschubwege werden bereits während der Suche berücksichtigt.
- Bedienpanel, Hinweise und Vorschauen liegen außerhalb des Spielfelds; Feldzahlen werden über Gebäuden, Linien und Transporten gezeichnet.
- Ein im Verbesserungspass eingeführtes abruptes Ausweichen der Truppensymbole wurde nach Nutzerfeedback entfernt. Die Symbole folgen wieder ihrem tatsächlichen Weg.
- Weiter zum nächsten Level reagiert sofort mit einem Ladezustand. Die nächste Karte wird schon auf dem Siegbildschirm vorgeladen; Abbruch und Ladefehler lassen die Bedienung erreichbar.
- Speicherfehler verhindern weder Spielstart noch vollständigen Sprachwechsel; bei fehlender dauerhafter Speicherung erscheint ein Hinweis.
- Die Kongregate-Anbindung erkennt die tatsächliche Spieldomain `*.konggames.com`, lädt das SDK bei Bedarf und überträgt Fortschritt erneut nach Login. Echte Serverannahme steht noch aus.

## Bedienung und Kampagne

- Nachschubschalter auch auf kleinen Displays, gespeicherte Präferenz, „Hier halten“ für gezieltes Sammeln.
- Tap/Tap zusätzlich zum Ziehen, Tastaturbefehle, sichtbarer Fokus, echte Pause und Fortsetzen.
- Manuell zuschaltbare Kartenvergrößerung mit Verschieben, erneut aufrufbare Hilfe, sichtbare Zeit und Wachstumsphase. Kein zusätzlicher automatischer Zoom pro Mission; die getestete Standardansicht bleibt für dieses Update erhalten.
- Vorschau einzelner Versandmengen und Gruppenbeiträge; keine unzuverlässige Siegprognose.
- Level 10 als Eislandschaft, nach einem Sieg in Level 9 auf der Kampagnenkarte spielbar. Alte Neun-Level-Spielstände bleiben kompatibel.
- Kampagnenabschluss nach Level 10 mit Gesamtübersicht und Level-Bestzeiten.
- Balanceprüfung enthält gezieltes Ansparen und kostengünstige HQ-Routen. Keine Abschwächung allein aufgrund schlechter Bot-Ergebnisse; kein zusätzlicher Wächter im Finale.

## Nachweise und Grenzen

- Typprüfung und 162/162 Logiktests bestanden.
- Vollständiger Browserlauf: 76 bestanden, sechs projektbedingt übersprungen. Spätere Beschränkung externer Kongregate-Einbindungen auf Iframes separat geprüft.
- 140 Karten-/Sprach-/Größenfälle: zehn Karten, sieben Fenstergrößen, EN/DE; keine verdeckten Feldmitten und kein horizontaler Seitenüberlauf.
- Bewegungsvergleich auf 31 Strecken, zusätzliche Schildansichten, Gruppen-/Touch-/Abbruchprüfungen und Level-10-Logistikfälle bestanden.
- Aktuelle Standard-/Kongregate-, Y8- und GameMonetize-Produktions-Builds lokal geprüft; lokale Iframe-Tests mit normalem und gesperrtem Speicher bestanden. Portal-SDKs dabei ersetzt; das belegt keine funktionierenden Live-Werbedienste oder gespeicherten Kongregate-Werte.
- Frische Kampagne mit tatsächlicher Spielsimulation durch alle zehn Level gewonnen, einschließlich Speichern/Neuladen nach jedem Sieg. Das ist kein menschlicher Kampagnendurchlauf.

## Vor einer vollständigen Freigabe offen

- Menschlicher Kampagnendurchlauf und die im Plan vorgesehenen Erstspieler-Beobachtungen.
- Physische Touchgeräte einschließlich Audio, Gesten und Bildlauf.
- Tatsächlicher Portalbetrieb; bei Kongregate insbesondere echter Statistikeintrag, Reload, Level-10-Abschluss und positive Finalzeit.
- Sichtbare Fortschrittsrangliste im Portal aktivieren; neue Statistiken sind optionale Vorschläge, keine Voraussetzung für die Fehlerkorrektur.
- Neue Upload-ZIPs aus dem geprüften Stand erstellen und genau diese Dateien abnehmen. Die früher erzeugten ZIPs enthalten die jüngsten Korrekturen nicht.

Die Quelländerungen sind lokal verfügbar unter `http://127.0.0.1:5173/`, solange der Entwicklungsserver läuft. Kein Update wurde hochgeladen. [Kongregate-Diagnose und Statistikvorschläge](kongregate-statistics-audit-2026-11-02.md).
