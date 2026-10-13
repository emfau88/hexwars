# HEXFRONT — Mixed Squads

Separate playable prototype on branch `experiment/mixed-squads`, based on `experiment/hexfront-3d-diorama` at `b4f3dd0`. All additions live in this directory. The original 2D game, portal builds, 3D campaign, legacy economy, models and deployment workflows are unchanged.

## Start

From this directory, with Node.js 20 or newer:

```sh
npm run dev
```

Open **http://127.0.0.1:4176/hexfront-mixed-squads/**. Set `PORT` for another port. The server only binds to localhost by default. No runtime package installation is needed; terrain modules, textures, models and Three.js are read from the existing sibling `../hexfront-3d` directory. Keep that directory alongside this one when working from source.

```sh
npm test
npm run build
npm run preview
```

The build copies its read-only dependencies into **this variant's own `dist/`** and disables the development inspection API. The resulting `dist/` is independently hostable, including under a URL subdirectory. Its root index links to the new game. No existing preview or deployment is overwritten. Stop the dev server before starting preview on the same port.

`npm run test:browser` additionally requires Playwright/Chromium (already available in the parent development checkout). It starts its own localhost servers, checks native mouse/touch controls and full campaign progression, builds and checks production, and writes screenshots plus a report to ignored `test-results/`.

## Play

- Capture the blue HQ. All three existing maps are available through sequential campaign unlocks.
- Connected territory earns credits: HQ **2/s**, other connected sectors **0.9/s** each, connected relay **+20%**. Disconnected sectors give no income.
- The HQ starts a repeating **drone → drone → mech** production sequence. Open **HQ-Produktion** or **⚙** to add/remove orders, toggle repetition, pause production or refund the active order. Opening this planning panel pauses the match.
- Drones: **12 credits, 1.8 s, 12 HP, 3 damage/s, 1.1 s/hex**. Mechs: **40 credits, 4.8 s, 48 HP, 8 damage/s, 1.9 s/hex**. Each faction has a 160-robot production limit. Existing reinforcements are never truncated.
- Select **Verband / Drohnen / Mechs**, then **50% / Alle**. Drag an owned field to the target or tap both and confirm. Mixed formations move at mech speed. Empty fields remain owned. A selected type with no units cannot move.
- Select an owned field and choose **Sammelpunkt**. The HQ automatically dispatches surplus while keeping six robots. Supply uses friendly routes only. It replans at reached waypoints, waits for disconnected routes or stops at the last safe field if the next field falls. Such stopped troops can be moved manually. A convoy caught on a captured waypoint can be lost; it never starts an autonomous attack.
- Fights run in 0.25-second exchanges, with simultaneous damage and existing terrain/HQ bonuses. Reinforcements join either side. Engaged formations cannot withdraw. When both factions attack neutral defenders, the later formation waits until the current engagement ends.
- One model represents each present type on a field or in transit. A single rounded combat value shows the resident force on each field (one healthy drone = one point; terrain bonuses appear in the order forecast). Exact drone/mech counts appear only in the selected field’s command panel. During combat the field value belongs to its current defender; attackers remain visible as models. Damage is retained in aggregate health buckets when formations split or merge. Projectiles and hit reactions illustrate the simulation; they do not decide combat.

The campaign uses `hexfront.mixed-squads.campaign.v1` and a separate history-state key. It neither imports nor overwrites original campaign progress. Reloading does not resume an unfinished battle.

## Deliberate limits

No mech rig, skeletal animation, foot placement or new model authoring. The existing mech moves as a rigid model following the ramp surface. Fire, recoil, impact and disappearance effects provide feedback. No new buildings, unit types, special abilities or maps.

The AI follows the same credits, production, movement and damage rules as the player. Automated match outcomes provide regression evidence, not a guarantee of human balance. Browser checks cover desktop and emulated touch layouts; they are not physical-phone FPS measurements.
