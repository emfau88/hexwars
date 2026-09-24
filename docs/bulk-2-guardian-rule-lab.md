# HEXFRONT – Bulk-2-Abschlussbericht: Guardian-Regellabor

**Stand:** 19. September 2026  
**Ergebnis:** `GO` für einen späteren Guardian-Vertikalschnitt mit endlichem Shield-Pool; `GO` für Bulk 3 als nächsten Schritt  
**Wichtig:** In Bulk 2 wurde kein Guardian-Produktionscode und kein Levellayout verändert.

## Fragestellung

Das Labor prüft nicht, ob zusätzliche Ziele grundsätzlich interessant sind, sondern ob ihre Kontrolle die Ökonomie des direkten HQ-Rushes tatsächlich verändert. Ein Modell besteht das Gate nur, wenn:

- der direkte HQ-Angriff weiterhin möglich bleibt;
- der direkte Angriff bei aktiven Schutzpunkten aber messbar schlechter als das Ausschalten der Schutzpunkte wird;
- die Regel einen konzentrierten Angriff nicht nur durch einen noch größeren Stack beantwortet;
- Schutzabbau und Guardian-Zustand später klar darstellbar sind;
- das Modell ohne zweite Währung, Build-Menü oder allgemeines Angriffslimit auskommt.

## Versuchsaufbau

Der neue isolierte Harness verwendet die unveränderten Level- und Combatregeln, ergänzt aber außerhalb von `GameState` zwei neutrale Guardian-Proxies seitlich vor dem gegnerischen HQ. Damit werden keine Produktionsregeln vorweggenommen.

Kontrollierte Hauptmatrix:

- Referenzkarten: Level 2, 3, 5 und 8;
- gegnerische AI aus, damit die Regelökonomie nicht mit AI-Verhalten vermischt wird;
- Supply wahlweise an/aus;
- Strategien: direkter HQ-Rush, ein Guardian, beide Guardians sequenziell, geteilte Front;
- Modelle: Baseline, endlicher Shield-Pool, Defense-Multiplikator, Approach-/Network-Defense;
- Messwerte: Siegzeit, gesendete und verbleibende Kräfte, absorbierter Angriff, kontrollierte Guardians, Kartenabdeckung, Routebreite und maximaler Frontstack-Anteil.

Der Harness ist absichtlich primitiv. Er ist ein reproduzierbarer Wirtschaftstest, kein Ersatz für Human-Playtests oder die spätere Guardian-fähige AI.

## Ergebnis

### 1. Endlicher Shield-Pool besteht das Regel-Gate

Jeder aktive Guardian trägt einen eigenen endlichen Anteil zum HQ-Shield bei. Ein direkter Angriff verbraucht beide Pools. Wird ein Guardian kontrolliert, entfällt sein verbleibender Pool sofort. Ohne aktive Guardians kämpft das HQ mit seiner normalen bestehenden Base-Defense.

Bei einem gemeinsamen Laborwert von 96 Shieldpunkten pro Guardian ergibt sich:

| Karte | Baseline direkter Rush | direkter Rush mit Shield | beide Guardians, dann HQ | Vorteil Guardian-Route | erster gemessener 10-%-Break-even |
| --- | ---: | ---: | ---: | ---: | ---: |
| Level 2 | 40,0 s | 100,2 s | 65,2 s | 35 % | 48 |
| Level 3 | 44,4 s | 93,3 s | 79,1 s | 15 % | 96 |
| Level 5 | 54,1 s | 107,7 s | 73,6 s | 32 % | 48 |
| Level 8 | 54,3 s | 101,0 s | 88,7 s | 12 % | 96 |

Der direkte Rush bleibt in allen vier Fällen erfolgreich. Er wird nicht verboten, sondern zahlt eine klar begrenzte wirtschaftliche Abkürzungssteuer. Gleichzeitig ist das Ausschalten beider Guardians auf allen vier Referenzkarten mindestens 10 % schneller.

`96` ist kein Produktwert. Es ist der erste gemeinsame Laborwert, der die qualitative Invariante über alle vier Karten erfüllt. Die mapweisen Break-even-Werte unterscheiden sich deutlich und müssen später gegen Matchdauer, Guardian-Anzahl und echte Spielerprofile normalisiert werden.

### 2. Defense-Multiplikator wird als Primärmodell verworfen

Ein reiner Multiplikator ist bei kleinen Werten wirkungslos und wird bei hohen Werten schnell binär. Er skaliert mit jeder späteren Garnison und Regeneration, ist für Spieler schlechter prognostizierbar und erzeugt keinen so klaren sichtbaren Verbrauchszustand wie ein Shield-Pool. Im Labor konnte er den Break-even ebenfalls erreichen, bietet aber bei höherer Tuning- und Kommunikationsgefahr keinen systemischen Vorteil.

### 3. Network Defense wird als Default verworfen

Die getestete Flächenverteidigung absorbiert Angriffe in kontrollierten HQ-Sektoren. Sie ist topologieabhängig, schwerer lesbar und entkoppelt den Nutzen der benannten Guardians: Das Erobern eines Guardians reduziert nicht zwangsläufig genug kontrollierte Sektoren. Sie kann später als besondere Kartenregel interessant sein, ist aber kein guter kompakter Kampagnenstandard.

### 4. Guardians lösen den HQ-Rush, nicht jede Form des Doomstackings

Der primitive Angreifer erreicht weiterhin bis zu 100 % Frontstack-Anteil. Guardians verteilen die wirtschaftlich relevanten Angriffspunkte und korrigieren die direkte HQ-Abkürzung; sie bestrafen nicht generell jede Truppenkonzentration. Ein globaler Konzentrationsmalus oder Angriffscap wäre dafür systemischer, würde aber Kernregeln, Lesbarkeit und AI deutlich stärker aufblähen. Deshalb wird kein allgemeines Anti-Stack-System empfohlen.

### 5. Supply und AI sind echte Abhängigkeiten

Im Level-2-Kontrollfall gewinnt der direkte Rush ohne automatische Supply weiterhin, während die sequenzielle Zwei-Guardian-Route im primitiven Harness ins 300-Sekunden-Limit läuft. Das zeigt: Mehrere Angriffspunkte funktionieren in HEXFRONT nur zusammen mit verständlicher Logistik und Reservebewegung. Guardians dürfen Supply nicht als Nebensystem behandeln.

Ein zusätzlicher AI-Stresstest bestätigt außerdem, dass die aktuelle AI Guardian-Zustände weder bewertet noch verteidigt oder gezielt angreift. Dieses Ergebnis ist erwartet und sperrt einen bloßen Leveldaten-Rollout: Der Produktionsslice in Bulk 4 benötigt Guardian-aware Target Scoring, HQ-Reservebewertung und Supplyziele.

## Gewählte Regelhypothese

Für den späteren Vertikalschnitt wird folgende Hypothese ausgewählt:

1. Ein HQ besitzt pro aktivem verbündetem Guardian einen separaten, endlichen Shield-Pool.
2. Eingehender feindlicher Angriff auf das HQ verbraucht zuerst diese Pools; der direkte Angriff bleibt möglich.
3. Erobern oder Deaktivieren eines Guardians entfernt dessen noch vorhandenen Pool unmittelbar und dauerhaft, solange der Guardian nicht wieder vollständig reaktiviert wurde.
4. Ohne aktive Guardians gelten die normalen HQ-/Base-Combatregeln; die Victory Condition bleibt ausschließlich HQ-Capture.
5. Das Shield regeneriert während eines laufenden Angriffs nicht. Ob eine langsame Regeneration außerhalb von Combat nötig ist, bleibt eine spätere, ausdrücklich zu testende Option.
6. Guardian-Zellen erhalten keine normale Produktion und keine reguläre automatische Supply-Garnison, solange ein späterer Test nicht das Gegenteil belegt.
7. Level 1 bleibt guardianfrei. Level 2 sollte wegen seines 50-%-/100-%-Tutorialziels ebenfalls nicht automatisch zwei Guardians erhalten.
8. Zwei Guardians sind kein globales Kartentemplate. Maps erhalten null, einen oder zwei nur aus einer begründeten Routenrolle.

## Neue Dateien und Kommandos

- `scripts/guardian-lab.ts` – isoliertes Modell, Strategien und Parameter-Sweep;
- `scripts/balance-guardian-lab.ts` – vergleichbare Tabellenzusammenfassung;
- `npm run balance:guardians` – reproduzierbarer Sweep;
- `tests/doomstack.test.ts` – Proxypositionen, Shieldverbrauch, Zwei-Guardian-Pfad, gemeinsames 10-%-Gate und Supply-Abhängigkeit.

Der bestehende Doomstack-Harness exportiert nun seine allgemeine Routen-, Positions- und Konzentrationslogik, ohne sein bisheriges Verhalten zu ändern.

## Risiken vor Produktionscode

- Shieldwerte sind noch nicht gegen Human-Playtests oder alle zehn Maprollen kalibriert.
- Ein einmalig endlicher Shield kann von Spielern bewusst durch Wellen „abgeschält“ werden. Das ist erwünschte theoretische Direktangriffsmöglichkeit, muss aber klar visualisiert und gegen stumpfes Warten geprüft werden.
- Guardian-Rückeroberung und Shield-Wiederaufbau können Snowballing oder Endlosschleifen erzeugen; dafür gibt es noch keine Entscheidung.
- Guardians können zur vorgeschriebenen Checkliste werden. Maprollen und Anzahl müssen variieren.
- Die aktuelle AI und automatische Supply kennen keine Structures; ein Produktionsrollout ohne diese Integration ist unzulässig.
- Ein Shield von 96 Laborpunkten ist für frühe Karten wahrscheinlich zu hoch. Der relevante Befund ist die Break-even-Kurve, nicht die absolute Zahl.

## Gate-Entscheidung

`GO` für die Regelhypothese „endlicher Shield-Pool pro aktivem Guardian“, aber noch kein `GO` für den Kampagnenrollout. Der nächste planmäßige Schritt bleibt Bulk 3: vollständiger Level-1-Visual-PoC auf der stabilen World-Transform-Basis. Level 1 bleibt dabei guardianfrei; der PoC reserviert nur saubere Structure-Layer und Safe-Area-Verträge. Der eigentliche Guardian-Produktionsslice folgt erst in Bulk 4.
