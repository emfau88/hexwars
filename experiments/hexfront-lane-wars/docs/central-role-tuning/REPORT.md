# Zentrale Front: drei bestätigte Einheitenwerte

| Wert | Vorher | Jetzt |
| --- | --- | --- |
| Railgun-Tempo | 1,0 | **0,8** |
| Mech-Reichweite | 2,8 | **3,0** |
| Drohnen-Tempo | 1,6 | **1,8** |

Nur diese drei Spielwerte wurden geändert. Railgun-Reichweite bleibt 5,2, Mech-Tempo 0,9 und Drohnen-Reichweite 1,1. Schaden, Feuerraten, Lebenspunkte, Wirtschaft, Produktion, KI, HQs, Fabrikausfahrten und Darstellung einschließlich Sound/Doppelstrahlen bleiben unverändert. Die Änderung gilt für beide Fraktionen in Zentrale Front; historische Missionen und Kampflabor behalten ihre Profile.

Bestehende zentrale Spielstände übernehmen die drei früheren Standardwerte beim Laden. Andere gespeicherte Werte, Positionen, Ziele, Lebenspunkte, Abklingzeiten, Credits und individuelle abweichende Profile bleiben erhalten. Die Spielstanddatei wird beim Einlesen nicht verändert.

## Prüfung

- **94/94 automatisierte Tests bestanden**, einschließlich realer Bewegungsgeschwindigkeit beider Fraktionen, Mech-Zielauswahl an der Reichweitengrenze, exakter Spielstandmigration und unveränderter historischer Profile.
- Sechs vollständige, deterministische KI-Partien: drei Paarungen plus jeweils vollständig vertauschte Fraktionen/Controller-Reihenfolge. Ergebnisse, Laufzeiten, HQ-Zustände und wirtschaftliche Metriken sind gespiegelt identisch.
- Fünf Tests zu Entscheidungen nach Minute drei und zwei gespiegelte direkte Gefechte.
- Browser: tatsächliche Werte im Laufzeitprofil und im gespeicherten Spielstand, Mech-Reichweite im HUD, Sound, Pause, Doppelstrahlen und vollständige Partie bis HQ-Zerstörung geprüft. Lokaler Browserlauf: 179,25 s, Orange 800 HQ-LP / Blau 0, keine Browserfehler. Build erfolgreich.

## Ergebnisse und verbleibende Schwächen

| Orange / Blau | Gewinner | Dauer |
| --- | --- | --- |
| Pressure / Siege | Siege | 199,0 s (3:19) |
| Pressure / Economy | Economy | 280,65 s (4:41) |
| Siege / Economy | Siege | 97,2 s (1:37) |

Der frühere offene Pressure/Economy-Vergleich endet jetzt regulär. Die Belagerungseröffnung gegen Wirtschaftsaufbau bleibt zu stark bzw. sehr schnell. Diese Tests sind keine menschlichen Siegraten.

Im vorbereiteten Spätentscheidungsfall verliert Nichtreagieren nach 256,7 s. Umrüstung allein bleibt bis zur Messgrenze von 720 s offen; Umrüstung plus gezielter Drohnen-Nachschub gewinnt nun nach 402,45 s. Ein anderer Konterwechsel von Railguns zu Mechs dreht eine Niederlage in einen Sieg nach 316,2 s.

Die drei reinen Einheitenkonter bleiben in den geprüften Gefechten bei einer und vier Fabriken erhalten. **Eine reine Vier-Fabriken-Drohnenarmee schlägt die Mischung aus zwei Mech- und zwei Railgun-Fabriken in diesem direkten Test jedoch nicht mehr** (beide Fraktionen geprüft). Weitere Werte wurden zur Kompensation ausdrücklich nicht verändert. Erwartete Testergebnisse wurden entsprechend dokumentiert aktualisiert; die Prüfungen auf Symmetrie und tatsächliche Konter bleiben bestehen.

Protokolle: [Matchdaten](matches.json), [Testlauf](unit-tests.txt), [lokaler Browserlauf](local-playback.json).

## Öffentlicher Playlink

Runtime-Commit `37a6864b689f4c3ad4052508de968b9cc2fd2fe6` über rawcdn.githack.com erfolgreich geprüft: drei gewünschte Werte im realen Spielstand, Mech-Reichweite im HUD, unveränderter Railgun-Sound und Doppelstrahlen, reguläres Spielende durch HQ-Zerstörung nach 179,25 s. Keine Browserfehler. [Öffentliches Prüfprotokoll](public.json). Beide Branch-READMEs verlinken diesen Stand.
