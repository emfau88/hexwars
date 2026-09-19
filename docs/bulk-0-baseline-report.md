# HEXFRONT – Bulk-0-Baseline-Report

**Datum:** 19. September 2026  
**Bulk:** 0 – Baseline und Release-Identität  
**Ergebnis:** abgeschlossen mit dokumentierten Test- und Packaging-Abweichungen  
**Produktcode durch diesen Bulk verändert:** nein

## 1. Ergebnis

Der korrekte Ausgangspunkt für den nächsten Entwicklungs-Pass ist mit hoher Sicherheit:

```text
Branch: codex/improve-mobile-onboarding-copy
Commit: bb0fa85e538302cebb223699090e16003a0cf464
Subject: Add Kongregate update package
Commit tree: 2ba80e151179ae67bc436d5d7f3850dc78b63966
```

Der Live-Stand auf Kongregate nennt den 17. September 2026 als letztes Update und beschreibt genau die Inhalte der fünf Branch-Commits nach dem gemeinsamen Stand mit `main`: direkte Next-Level-Navigation, überarbeitete Supply-Logik, frühere Group-Freischaltung, klarere 100%-/Group-Einführung, stärkere Base-Pressure-Reaktion der AI, Balanceanpassungen Level 2–9, Desktop-Control-Polish, Kompatibilitätsfallbacks, Kongregate-Stats und den weiterhin offenen 100%-Single-Route-Rush.

Kongregate veröffentlicht keinen Commit-Fingerprint. Die Zuordnung ist daher inhaltlich und zeitlich sehr stark, aber nicht kryptographisch beweisbar.

## 2. Git- und Release-Identität

Nach `git fetch origin --prune`:

```text
origin/main: ced065f8151d653f03853e3dd3f488b988c7684b
origin/main tree: a5167530472b9db3046d7b320f80208e7ae3d6b4
merge base: b95a63259ea615db015f49ec2e89eefee7241693
merge-base tree: a5167530472b9db3046d7b320f80208e7ae3d6b4
origin/main...HEAD: 2 behind / 5 ahead
```

Damit enthalten die zwei `main`-Commits nach dem Merge-Base gegenüber `b95a632` keine zusätzliche Tree-Änderung. Der Kongregate-Branch ergänzt folgende fünf Inhaltscommits:

1. `24ba240` – Clarify 100 percent send unlock
2. `2c86951` – Add Kongregate campaign statistics
3. `45ee0b0` – Polish campaign onboarding and balance
4. `647f9d7` – Clarify command controls and scale campaign challenge
5. `bb0fa85` – Add Kongregate update package

Die lokale Branch-Spitze stimmt mit `origin/codex/improve-mobile-onboarding-copy` überein. Der lokale Branch `main` ist dagegen noch auf `dbe53fc` und deshalb nicht als Arbeitsbaseline geeignet.

## 3. Abgrenzung des Working Trees

Vor Beginn waren bereits uncommittierte Änderungen vorhanden:

- `index.html`
- `src/i18n/catalog.ts`
- `src/styles.css`
- `src/ui/CampaignUI.ts`

Sie bilden einen begonnenen, einklappbaren Desktop-Command-Dock-Pass. Bulk 0 hat diese Dateien nicht verändert. Die saubere Release-Baseline wurde in einem detached Worktree auf `bb0fa85` ausgeführt; ergänzend wurden Unit-Test, Typecheck und Browsermatrix des aktuellen Working-Tree-Overlays separat geprüft.

Neu durch Bulk 0 sind ausschließlich Dokumentation und QA-Screenshots:

- `docs/next-development-pass-plan.md`
- `docs/bulk-0-baseline-report.md`
- `docs/qa/bulk-0-baseline-2026-09-19/`

## 4. Testbaseline

### 4.1 Sauberer Commit `bb0fa85`

| Prüfung | Ergebnis |
| --- | --- |
| `npm ci` | bestanden; 27 Pakete, 0 bekannte Vulnerabilities |
| `npm test` | 59/59 bestanden |
| `npm run typecheck` | bestanden |
| `npm run verify:production` | bestanden; 47 Module; keine Development Entry Points im Produktionsbundle |
| `npm run package:kongregate` | bestanden |
| `npm run test:browser` | 22 bestanden, 4 übersprungen, 4 fehlgeschlagen |
| `npm run balance:doomstack` | bestanden; diagnostischer Doomstack bleibt dominant |
| `npm run balance:profiles` | bestanden; Ergebnisse unten festgehalten |

### 4.2 Browserabweichungen im sauberen Commit

1. Desktop und Mobile erwarten im ersten Campaign-Flow `LOCKED · II`, die Runtime liefert korrekt den neueren Text `LOCKED → LEVEL 2`.
2. Der Large-Desktop-Test sucht `.modeKeyboardGuide` und `1 = 50%`; die Runtime verwendet bereits `.modeKeyboardDiagram` mit Pfeilnotation. Dies ist ebenfalls Testdrift.
3. Der Desktop-Test für lazy geladene Decor-Kandidaten meldet im sauberen Worktree keine `/assets/decor-p1/`-Resource. Der Fehler war in einer isolierten Wiederholung reproduzierbar.

Die ersten drei fehlgeschlagenen Browserfälle sind zwei veraltete Assertions in beiden Viewports, nicht drei unabhängige Produktdefekte. Der Decor-Fall bleibt als gesonderter Test-/Ladebefund offen.

### 4.3 Aktueller Working Tree inklusive vorbestehendem Command-Dock-Pass

| Prüfung | Ergebnis |
| --- | --- |
| `npm test` | 59/59 bestanden |
| `npm run typecheck` | bestanden |
| `npm run test:browser` | 23 bestanden, 4 übersprungen, 3 fehlgeschlagen |

Hier bestehen nur die beiden bekannten veralteten UI-Erwartungen fort: zweimal Unlock-Label sowie einmal der alte Keyboard-Guide-Selector. Der Decor-Test besteht in beiden Browserprojekten. Das unterschiedliche Decor-Ergebnis zwischen sauberem Worktree und aktuellem Workspace ist ein Hinweis auf Timing-/Kontextsensitivität und darf nicht als stabil gelöst gelten.

## 5. Doomstack-Baseline

Der dedizierte Runner bestätigt, dass er derzeit misst und nicht verhindert:

| Level | Ergebnis | Zeit | Aktionen | Captures | Frontstack-Anteil |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | 100% gesperrt | 0,0 s | 0 | 0 | 0% |
| 2 | Sieg | 28,8 s | 20 | 11 | 100% |
| 3 | Sieg | 136,3 s | 67 | 16 | 100% |
| 4 | Sieg | 42,8 s | 28 | 15 | 100% |
| 5 | Sieg | 119,7 s | 59 | 17 | 100% |
| 6 | Sieg | 43,5 s | 31 | 12 | 100% |
| 7 | Sieg | 129,4 s | 60 | 17 | 100% |
| 8 | Zeitlimit | 300,0 s | 126 | 34 | 100% |
| 9 | Sieg | 118,5 s | 56 | 14 | 100% |
| 10 | Sieg | 58,2 s | 41 | 16 | 100% |

Level 2 ist damit der stärkste frühe Beleg: Ein 100%-Single-Route-Modell gewinnt in 28,8 Sekunden. `maxStack = 68` verhindert diese Angriffsform nicht.

## 6. Profil-Baseline

Gewinne aus je fünf deterministischen Varianten:

| Level | Cautious | Aggressive | Tactical |
| ---: | ---: | ---: | ---: |
| 1 | 0/5 | 5/5 | 5/5 |
| 2 | 5/5 | 5/5 | 5/5 |
| 3 | 2/5 | 5/5 | 5/5 |
| 4 | 4/5 | 5/5 | 5/5 |
| 5 | 5/5 | 5/5 | 4/5 |
| 6 | 3/5 | 3/5 | 4/5 |
| 7 | 5/5 | 4/5 | 5/5 |
| 8 | 1/5 | 3/5 | 5/5 |
| 9 | 5/5 | 5/5 | 5/5 |
| 10 | 0/5 | 0/5 | 0/5 |

Diese Werte sind Regressionsevidenz, keine Human-Balance-Freigabe.

## 7. Kongregate-Paket

### Getracktes Release-Artefakt

```text
Datei: releases/kongregate/hexfront-update-1.zip
Größe: 1.410.999 Byte
SHA-256: C49703155D63CF372ACA3A52689B3FAD2C78CA9C9C3F204A1B3BE5FF783844BD
```

### Reproduktion aus dem sauberen Commit

```text
Datei: dist/kongregate-upload/hexfront-kongregate-complete.zip
Größe: 1.410.845 Byte
SHA-256: E2709268D97FFDC0E8E377CB45A026150B0352EB6640C1B217AB5E680D3FDECE

Fallback assets ZIP:
Größe: 1.406.890 Byte
SHA-256: 5AB69D47940EE8C67AA42280F910EE9E65A9728D16237174E05FE60FE31AA753
```

Das Paket ist **nicht byteidentisch reproduzierbar**. Beide vollständigen ZIPs enthalten jedoch dieselben 58 Nutzdateien mit folgenden Ausnahmen auf Archiv-/Whitespace-Ebene:

- das getrackte ZIP enthält zusätzlich den leeren Ordner `assets/experiments/`;
- `assets/audio/ATTRIBUTION.md` unterscheidet sich nur durch Zeilenenden;
- `index.html` unterscheidet sich durch Checkout-Zeilenenden und ein zusätzliches Whitespace-CR-Zeichen, nicht durch DOM-Inhalt oder referenzierte Bundle-Dateien.

Die gebauten CSS-/JS-Hashes und alle 56 Binär-/Assetdateien stimmen inhaltlich überein. Für spätere Releases sollte die Packaging-Pipeline Zeilenenden und ZIP-Timestamps normalisieren, wenn ein reproduzierbarer SHA-256 gewünscht ist.

## 8. Geometrie- und Resize-Baseline

Die Screenshots wurden aus dem sauberen Commit im Testmodus aufgenommen:

| Datei | SHA-256 |
| --- | --- |
| [Level 1 Desktop](qa/bulk-0-baseline-2026-09-19/level-01-desktop-1366x768.png) | `DA0C48C985A0154618E05C000DB6F34FA070A49230C3B068CA457E0E90C64325` |
| [Level 2 Desktop](qa/bulk-0-baseline-2026-09-19/level-02-desktop-1366x768.png) | `263797F228DD9660DE9908410E01F517F71726A13FF4B4E88A0BF835163D91DF` |
| [Level 1 Mobile](qa/bulk-0-baseline-2026-09-19/level-01-mobile-390x844.png) | `59F15298C22FA5A1A0E369F6C0E7911BB5C9DF29B1FFAD64733B1F2C3419DF11` |
| [Level 2 Mobile](qa/bulk-0-baseline-2026-09-19/level-02-mobile-390x844.png) | `B53A057644351A26C755C6B898E92DE9D60C77D0887E8AED878FA67DBE3107D9` |

Der Lifecycle-Fehler ist reproduzierbar:

| Szenario | Canvas vor Restart | reale Stage | Canvas nach Restart | berechneter Radius vor → nach | Origin vor → nach |
| --- | --- | --- | --- | --- | --- |
| Desktop, nominell 1366×768 | 1367×768 | ca. 1035×710 | 1035×710 | 34,0 → 33,7 | `(492,1; 78,0)` → `(327,8; 51,7)` |
| Mobile, nominell 390×844 | 391×844 | ca. 391×718 | 391×718 | 28,87 → 28,87 | `(33,0; 162,2)` → `(33,0; 99,2)` |

Folgen:

- Desktop verschiebt den Board-Origin beim Restart ungefähr 164,3 px nach links und 26,3 px nach oben; der Radius schrumpft leicht.
- Mobile behält den Radius, verschiebt das Board aber ungefähr 63 px nach oben.
- Level 1 und Level 2 verwenden beim initialen Autostart dieselbe fehlerhafte Canvasgeometrie. Der sichtbare Sprung entsteht aus dem Lifecycle-Pfad, nicht aus absichtlich unterschiedlichen Levelmaßen.

Diese Werte sind die direkte Regression-Baseline für Bulk 1.

## 9. Bulk-0-Entscheidung

**GO für Bulk 1**, mit folgenden verbindlichen Vorbedingungen:

1. Die drei veralteten UI-Assertions werden als Testwartung behandelt, nicht als Gameplayänderung.
2. Der Decor-Lazy-Load-Test wird stabilisiert oder durch eine direktere Asset-/Renderer-Evidenz ersetzt.
3. Bulk 1 beginnt auf `codex/improve-mobile-onboarding-copy` und schützt den vorbestehenden Command-Dock-Pass.
4. Die Geometrie-Regression muss exakt die oben dokumentierten Start→Restart-Fehler abdecken.
5. Reproduzierbares ZIP-Packaging ist dokumentiert, aber kein Blocker für World Geometry; es wird spätestens in Bulk 9 gehärtet.

