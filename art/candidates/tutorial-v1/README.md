# Level 1 tutorial guidance assets — v1

Generated with the built-in ImageGen workflow on 24 September 2026.

The current files are lossless source candidates with transparent backgrounds.
They are not wired into the game and have not yet been resized or compressed for
production. The existing Level 1 desktop capture and orange HQ asset were used as
style references only.

## Asset set

- `source/tutorial-origin-beacon-v1.png` — warm orange/gold origin marker for the player HQ
- `source/tutorial-command-arrow-v1.png` — upward painterly movement arrow with fading trail
- `source/tutorial-target-marker-v1.png` — ivory/gold destination marker with green confirmation glow
- `source/tutorial-desktop-pointer-v1.png` — desktop pointer with orange press contact
- `source/tutorial-touch-hand-v1.png` — touch gesture with orange press contact

## Shared prompt direction

Use case: `stylized-concept`

Create isolated transparent tutorial-overlay assets for Hexfront in a premium
painterly tabletop-strategy style. Match the existing lush diorama presentation
with tactile ivory enamel, antique brass, warm orange light and restrained
forest-green accents. Keep silhouettes readable at gameplay size. Do not include
text, numbers, logos, watermarks, map terrain, hexagons, headquarters, frames,
black backgrounds or checkerboard backgrounds.

## Asset-specific prompt direction

### Origin beacon

One centered circular tactical beacon with two concentric rings, four restrained
direction ticks, tiny warm motes and a completely empty center occupying at least
55 percent of the diameter.

### Command arrow

One gently curved upward movement arrow with a broad elegant arrowhead and a
tapered textured command trail. Antique-gold core, orange rim and soft fading tail;
suitable for rotation and modest scaling.

### Target marker

One centered circular destination marker with four inward-facing brackets, a softly
illuminated inner rim and an open center occupying at least 60 percent of the
diameter. Pale ivory-gold and muted brass with a delicate green confirmation glow.

### Desktop pointer

One stylized mouse-pointer arrow angled up-left, made from ivory enamel and antique
brass, with a small warm press glow exactly at the pointed tip. No physical mouse.

### Touch hand

One simplified, non-photorealistic ghost hand with an extended index finger and a
small warm contact glow below the fingertip. Compact and readable at mobile scale.

## Next review gate

Composite the source candidates over the real Level 1 desktop and mobile boards,
evaluate them at final display size, then selectively simplify and resize only the
approved assets before copying them into `public/assets`.
