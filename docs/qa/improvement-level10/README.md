# Level 10 – Eislandschaft

Nutzervorgabe vom 2. November 2026: Das Finale ist eine Eislandschaft. Keine Änderung an aktiven Feldern, neutralen Stärken, HQ-, Relais- oder Hügelpositionen.

## Pipeline

1. `node --import tsx scripts/export-map-art-guide.ts 10 docs/qa/improvement-level10`
2. Built-in ImageGen, Skill `imagegen`: Guide als Geometriequelle, Level 8 nur als Referenz für die Maltechnik.
3. Ein warmer erster Entwurf wurde verworfen. Eis-v1 wurde lokal korrigiert: zentralen See um rund 35 % verschmälern, südliches Ende 22 px zurücknehmen, Umgebung erhalten.
4. Eis-v2 als WebP (Qualität 90), Vorschau 474 × 360 (Qualität 85). Manifest enthält tatsächliche Quellgröße 1439 × 1093 und sechs Safe Areas.

## Finaler Prompt

Precise local edit of this HEXFRONT snowy game background. Preserve the entire winter landscape, ruins, trees, framing, lighting, all snow texture and clearings. Change only the central blue frozen lake and its immediate shoreline. Make the blue lake about 35% narrower horizontally, keeping its alternating zigzag centerline. Bring the bottom tip 22 pixels upward. Replace removed water with continuous pale snow. The intended lake region at 1439×1093 is x651–787, y336–754; centers alternate (696,388), (741,467), (696,546), (741,624), (696,702). No grid, text, units, towers or UI. This is a geometry correction, not a redesign.

## Gespeicherte Laufzeitdateien

- `public/assets/maps/level10-core-ice-v2.webp`
- `public/assets/map-previews/level10-preview-ice-v2.webp`
- Generatorquelle: `level10-ice-generated-v2.png`
- Sichtprüfung: `ice-runtime-v2-mobile.png`; v1-Bilder bleiben nur als Entwicklungsevidenz erhalten.

Der Eissee bleibt nicht spielbares Gelände. Keine neuen Eisregeln und kein zusätzlicher Wächter. Schnee und kalte Farbgebung gelten auch für die klassische Fallback-Darstellung. Separate Wasseranimation wird bewusst weggelassen: Der See ist gefroren.
