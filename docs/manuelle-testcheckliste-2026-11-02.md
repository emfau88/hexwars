# HEXFRONT – Manuelle Testcheckliste

Stand: 2. November 2026. Für die nächste Testsitzung auf `codex/improve-mobile-onboarding-copy`. Alle Checkboxen unten sind manuelle Prüfungen und deshalb zunächst offen. Automatische Ergebnisse und Gesamtstatus stehen im [Verbesserungsplan](hexfront-verbesserungsplan-2026-11-02.md).

## 1. Den richtigen Stand starten

- [ ] **Direkt auf dem Handy oder PC:** [Aktuellen Teststand öffnen](https://rawcdn.githack.com/emfau88/hexwars/789a38cfda751e28c1314a21b432c3378acc5029/previews/hexfront-improvements-2026-11-02/index.html). Kein lokaler Server nötig. Falls der Host eine Zwischenseite zeigt, **Open the page** antippen. Das ist Spielquellstand `b46c11e`, festgehalten in Vorschau-Commit `789a38c`.
- [ ] **Alternativ lokal:** Im Projektordner den genannten Branch verwenden und mit `npm run dev` starten. Die im Terminal angezeigte Adresse öffnen, normalerweise `http://127.0.0.1:5173/`.
- [ ] Die Seite einmal neu laden. Ohne Entwicklungsparameter wie `unlock`, `autoplay` oder `speed` testen, damit Freischaltung und Tempo dem normalen Spiel entsprechen.
- [ ] Bestehenden Fortschritt zunächst im bisherigen Browserprofil auf demselben Host prüfen. Spielstände werden nicht automatisch zwischen localhost, der Handy-Vorschau und Kongregate synchronisiert. Für den frischen Kampagnendurchlauf ein separates Profil oder privates Fenster verwenden; den alten Spielstand nicht dafür löschen. Private Fenster verlieren ihren Speicher üblicherweise beim Schließen.
- [ ] Für spätere Portaltests ein frisch gebautes Paket dieses Quellstands in der Portal-Vorschau verwenden. Die bereits vorhandenen ZIPs und die bisher veröffentlichte Version enthalten die jüngsten Korrekturen noch nicht. Lokal werden absichtlich keine Kongregate-Werte übertragen.

## 2. Kampagne und Spielstände

- [ ] **Frischer Start:** Nur Level 1 ist freigeschaltet. Die erste Anweisung ist verständlich; vor dem ersten gültigen Befehl läuft die Schlacht noch nicht los.
- [ ] **Alle zehn Level:** Jeden Sieg regulär erspielen. „Weiter“ und die Kampagnenkarte führen zur nächsten freigeschalteten Mission. Nach ausgewählten Siegen neu laden: Fortschritt und Bestzeit bleiben erhalten.
- [ ] **Vor Level 9 gewonnen wurde:** Level 10 bleibt gesperrt. **Nach einem Sieg in Level 9:** Level 10 wird direkt angeboten und ist auf der Kampagnenkarte spielbar.
- [ ] **Alter Spielstand mit neun Siegen:** Level 10 lässt sich auswählen; die bisherigen Siege und Bestzeiten bleiben erhalten.
- [ ] **Level 10:** Die Karte ist eine Eislandschaft. Wege, Relais, Hügel und HQs passen zum Hintergrund; der Eissee ist nicht spielbar.
- [ ] **Sieg in Level 10:** Kampagnenabschluss mit 10/10, nachvollziehbaren Bestzeiten und Möglichkeiten zum Wiederholen beziehungsweise zur Kampagnenkarte. Kein nicht vorhandenes Level 11.
- [ ] **Nach dem Finale neu laden:** 10/10 und Bestzeiten bleiben erhalten. Beim Wiederholen verbessert eine langsamere Zeit den Rekord nicht; eine schnellere ersetzt ihn.
- [ ] **Niederlage:** Wiederholen funktioniert, abgeschlossene Missionen und vorhandene Bestzeiten gehen nicht verloren.

## 3. Nachschub, Sammeln und Truppenmengen

Diese Fälle sind ab Missionen mit Auto-Nachschub relevant. Bewusst auch so spielen, wie du tatsächlich spielst: Truppen sammeln, günstige Wege nehmen und teure neutrale Felder umgehen.

- [ ] **Normaler Nachschub:** Mit Automatik an bewegen sich Überschüsse verständlich in Richtung Front. Die erste automatische Bewegung wird erklärt.
- [ ] **Angriff auf ein eigenes Feld:** Sobald ein feindlicher Transport konkret auf dieses Feld zuläuft oder dort gekämpft wird, zieht die Automatik keine Verteidiger ab. Ein manuell befohlener Abzug bleibt möglich.
- [ ] **Hier halten:** Eigenes Sammelfeld auswählen und HALTEN aktivieren. Dort bleiben Truppen trotz aktiver Automatik liegen; Verstärkungen dürfen ankommen. Halten lösen: regulärer Nachschub kann wieder abziehen.
- [ ] **Global abschalten:** NACHSCHUB AUS verhindert neue automatische Abzüge. Bereits reisende Transporte fahren weiter. Einstellung nach Neustart, Missionswechsel und Seiten-Reload kontrollieren.
- [ ] **50 % senden:** Die angezeigte Hälfte wird geschickt. Bei aktiver Automatik darf der Rest später automatisch weiterziehen; mit HALTEN auf der Quelle bleibt er dort. Das muss verständlich sein.
- [ ] **Mehrere Verstärkungen:** Zwei oder drei Quellen auf dasselbe eigene Feld schicken. Ziel darf höchstens 68 Einheiten enthalten. Überzählige Truppen dürfen nicht ohne Kampf verschwinden.
- [ ] **Überfüllung:** Bei einem fast vollen Ziel erscheint gegebenenfalls eine Rückführung mit ↩. Wenn kein Platz verfügbar ist, bleiben wartende Truppen mit Ⅱ und Menge erkennbar; sobald Platz entsteht, werden sie wieder untergebracht.
- [ ] **Unterbrochener Weg:** Ein Gegner erobert einen Teil einer Versorgungsroute. Transporte sollen nachvollziehbar umgeleitet beziehungsweise untergebracht werden, statt über fremde Felder zu teleportieren oder lautlos zu verschwinden. Nach Rückeroberung kann die Versorgung wieder einsetzen.
- [ ] **Relais-Brückenkopf in Level 10:** Ein isoliert erobertes Feld erhält noch keinen Auto-Nachschub über neutrale Zwischenfelder. Nach Eroberung einer zusammenhängenden eigenen Landverbindung ist Versorgung möglich.

Bei Mengenvergleichen Wachstum und Kampfverluste berücksichtigen. Auffällige Verluste am besten kurz filmen; eine reine Vorher-/Nachher-Zahl während eines Kampfes ist nicht eindeutig.

## 4. Bewegung, Zahlen und Übersicht

- [ ] **Bewegung:** Normale Befehle, lange Versorgungswege und Rücktransporte beobachten. Keine abrupten zusätzlichen Sprünge beim Vorbeifahren an Feldzahlen. Richtungswechsel entlang einer echten Hexroute sind normal.
- [ ] **Gebäude:** Besonders Level 5–8 und 10 prüfen. Zahlen an Relais, Wächtern und HQs bleiben bei eigenem, neutralem und gegnerischem Besitz sowie im Kampf lesbar.
- [ ] **Große Stapel:** Zweistellige Werte bis 68 bleiben auch bei vielen gleichzeitig fahrenden Truppen eindeutig lesbar.
- [ ] **Schilde:** Voller, teilweise verbrauchter und erschöpfter HQ-Schild sind unterscheidbar. Nach Eroberung eines Wächters passt die Anzeige zur neuen Situation.
- [ ] **Bedienflächen:** Hinweise, Gruppenvorschau, Nachschubsteuerung und Seitenpanel verdecken keine spielbaren Felder. Auch die äußersten Felder lassen sich auswählen.
- [ ] **Fenstergrößen:** Großes Desktopfenster, schmaleres Fenster, Tablet-Hochformat und Smartphone ansehen; auch Deutsch und Englisch wechseln. Keine abgeschnittenen wichtigen Texte oder unerreichbaren Schalter.
- [ ] **Längere Partie:** Bei vielen Transporten und mehreren Fronten bleiben Darstellung und Eingaben flüssig.

## 5. Befehle, Pause und Hilfe

- [ ] **Maus:** Ziehen und Loslassen sendet genau einmal. Zusätzlich Quelle anklicken und anschließend Ziel anklicken ausprobieren.
- [ ] **Touch:** Quelle/Ziel antippen und Ziehen ausprobieren. Eine abgebrochene Wischgeste, ein zweiter Finger oder eine Berührung außerhalb des Spielfelds darf keinen unbeabsichtigten Befehl erzeugen.
- [ ] **Tastatur:** Spielfeld fokussieren; Home/Pfeiltasten zur Auswahl, Enter zum Auswählen/Senden und Escape zum Abbrechen. 1/2/3 wechseln die verfügbaren Versandarten; P pausiert.
- [ ] **Vorschau:** 100 % und 50 % zeigen passende Versandmengen. GRUPPE markiert die beteiligten Quellen; ihre Einzelmengen ergeben die angezeigte Summe und passen zu den tatsächlich versandten Truppen.
- [ ] **Pause:** Während des Pausenmenüs ändern sich Truppen, Kämpfe und Spielzeit nicht. Fortsetzen führt an derselben Stelle weiter.
- [ ] **Tabwechsel:** Zu einem anderen Tab wechseln und zurückkehren. Die Partie ist pausiert und lässt sich kontrolliert fortsetzen.
- [ ] **Neustart/Verlassen:** Die Aktionen sind im Menü eindeutig. Öffnen des Menüs allein setzt nichts zurück; gewollter Neustart beziehungsweise Kampagnenwechsel funktioniert.
- [ ] **Sprache/Ton:** Im Menü umschalten, anschließend weiterspielen und neu laden. Einstellungen passen zur Auswahl; auf dem Smartphone setzt Ton nach einer bewussten Berührung ein und stört bei Pause nicht.
- [ ] **Vergrößern:** Vergrößerte Karte verschieben, Felder antippen und zur Gesamtansicht zurückkehren. Keine unbeabsichtigten Befehle beim Verschieben.
- [ ] **Hilfe:** Regeln zu Halten, Nachschub, Hügeln, HQ-Schilden und Relais lassen sich erneut nachlesen. Sind sie auch ohne unsere Erklärung verständlich?
- [ ] **Lange Partie:** Bei 3 Minuten wird nachlassendes Wachstum angekündigt; bei 4 Minuten endet es. Uhr und Phase bleiben auch mobil sichtbar.
- [ ] **Reduzierte Bewegung:** Falls auf dem Gerät aktiviert, ist die dekorative Animation reduziert und das Spiel weiterhin bedienbar.

## 6. Fairness und Verständnis

- [ ] **Gezieltes Spiel:** Mit einem großen Stapel auf sinnvoller Route angreifen. Teure neutrale Felder auslassen, sofern ein günstigerer Gesamtweg existiert. Prüfen, ob HALTEN und Automatik dieses Vorgehen unterstützen.
- [ ] **Vergleich:** Dieselbe schwierige Mission einmal mit, einmal ohne Auto-Nachschub spielen. Konkrete Situationen notieren, in denen die Automatik störte oder geholfen hat.
- [ ] **Schwierigkeitsverlauf:** Besonders Level 5, 6, Übergang 6 → 7 und Finale 10 beurteilen: verständliche Aufgabe, sinnvolle Optionen, keine langen Phasen ohne lohnende Aktion.
- [ ] **Endspiel:** Bleibt nach dem Wachstumsende eine sinnvolle Entscheidung möglich, oder entsteht eine für den Spieler nicht erkennbare Sackgasse?
- [ ] **Neue Spieler, falls verfügbar:** Ohne Voraberklärung spielen lassen. Zeitpunkt des ersten gültigen Befehls, Fehlgesten, Verständnis von 50 %/GRUPPE/Nachschub/Relais und konkrete Abbruchgründe notieren. Der Plan sieht fünf bis acht neue Spieler vor; bis dahin bleibt dieser Punkt offen.

## 7. Kongregate – erst in der aktuellen Portal-Vorschau

- [ ] Mit angemeldetem Konto starten: SDK lädt und `initialized = 1` wird übertragen. In der Entwicklerkonsole auf Fehler achten; für die API-Diagnose nennt Kongregate `?debug_level=4` auf der Spielseite.
- [ ] Bei `missions_completed` die Option **Display in Leaderboards** aktivieren. Nach einem echten Sieg erscheint der passende Fortschritt als tatsächlicher Ranglisteneintrag.
- [ ] Seite neu laden: Gespeicherter Fortschritt wird erneut übermittelt und nicht zurückgesetzt. Falls als Gast begonnen, nach Login nochmals prüfen.
- [ ] Mission 10 wirklich gewinnen: `campaign_complete = 1` und eine positive `final_mission_best_ms` werden gespeichert. Eine schnellere Wiederholung verbessert die Min-Rangliste, eine langsamere nicht.
- [ ] Einbettung, Größenänderung, Sprache und Speichern innerhalb des Portals prüfen. Bei blockiertem Speicher muss das Spiel bedienbar bleiben und auf fehlende dauerhafte Speicherung hinweisen.
- [ ] Für diese Prüfungen keine Debug-Siege oder künstlichen Zeiten an öffentliche Ranglisten senden. Die Statistik-Verwaltungsseite zeigt Definitionen; der Nachweis ist ein tatsächlich gespeicherter Wert/Ranglisteneintrag.

Details und Statistikvorschläge: [Kongregate-Diagnose](kongregate-statistics-audit-2026-11-02.md). Neue Statistiken wie eine Summe aller Level-Bestzeiten sind optional und bislang nicht implementiert.

## 8. Weitere Portale – nur wenn deren Update ebenfalls vorgesehen ist

- [ ] **Y8:** Start, Speicher, Layout und Ton im echten Portal testen. Bei einer tatsächlich ausgelieferten Werbung muss das Spiel pausieren und danach korrekt fortsetzen. Eine vorher manuell pausierte Partie darf nicht selbstständig weiterlaufen. Werbeanforderung erfolgt nach Sieg/Niederlage; das Portal entscheidet über die Auslieferung.
- [ ] **GameMonetize:** Entsprechende Prüfung beim ersten Missionsstart der Sitzung. Keine zusätzliche Werbeanforderung nach jedem Ergebnis; keine ungewollte Wiederholung innerhalb derselben Sitzung.

## Fehler kurz festhalten

```text
Level / Browser / Gerät / Sprache:
Lokaler Test oder Portal-Vorschau:
Auto-Nachschub an/aus; HALTEN an/aus; Versandart:
Schritte unmittelbar vor dem Problem:
Erwartetes Verhalten:
Tatsächliches Verhalten:
Wiederholbar? Screenshot oder kurzes Video:
```

Nach dem Test die passenden Checkboxen abhaken und Auffälligkeiten ergänzen. Ein Commit oder Push bedeutet keine Spiel-/Portal-Freigabe. Erst nach der Abnahme das endgültige Upload-Paket erstellen beziehungsweise genau das zur Veröffentlichung vorgesehene Paket nochmals prüfen.
