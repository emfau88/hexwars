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

`npm run test:readability` checks the empty opening map, selection reset, HQ deployment, income breakdown, mobile unit cards, camera alignment on all maps, and simultaneous battles with both mech muzzle origins on the measured gun arm.

`npm run test:cozy` checks menu/settings keyboard navigation, pause/resume and the HUD, production, victory and defeat layouts at 1440×900, 390×844, 320×740 and 844×390.

`npm run test:landscape` checks all three maps at desktop, narrow phone and landscape viewports: full-screen terrain coverage, complete playable-field framing, centered HQ, non-playable scenery, expandable briefing and camera controls.

## Visual review

The final desktop/mobile screenshots, paired 70° tactical / 55° diorama views, three browser reports and a German analysis brief are stored in [docs/review-2026-10-13](docs/review-2026-10-13). Open `index.html` for the gallery or read `analysis.json` from another chat. Run `node scripts/export-review.mjs` after the three browser suites pass to refresh the export.

## Play

- The cozy sci-fi UI uses cream ceramic panels, sage displays and amber actions. The gear opens the main menu: resume, choose a mission, or open settings for graphics and instructions. The selected-field panel appears only when needed; income and live production share a compact display. Victory and defeat have dedicated result cards and illustrations. Menus pause the match; resuming preserves the current battle.
- Menu/result artwork is stored in `public/ui/`, generated with the built-in Imagegen tool from the approved concept. `public/ui/assets.json` records the prompts and usage. Small control/unit illustrations are native SVG in `src/ui-icons.js`. No runtime image service is required.

- Capture the blue HQ. All three existing maps are available through sequential campaign unlocks.
- Ordinary neutral fields start empty and are captured on arrival without a fight. The relay retains its neutral guards. Empty fields have no number; rally flags remain visible. Each map is framed with your HQ at the bottom center and the enemy HQ above it.
- The landscape fills the viewport: rocky meadows around Morgenwacht, an extended valley around Windpass, and a continuous river through Auenstrom. Only outlined hexes are playable. Mission information opens from the compact top-left briefing. Camera fitting reserves space for the actual HUD; decorative surroundings do not shrink the battlefield or receive orders.
- The two raised ruin fragments beside Morgenwacht’s relay are removed, including their visual flight clearance. Ground-level ruins and the other maps retain their decoration.
- Ordinary fields and plateau tiles stay level on all three maps. Dedicated ramps contain the full ascent. Auenstrom's relay has a flat building platform with its approach slopes confined to its own edges. Rendered terrain, click surfaces and moving formations use the same surface; navigation connections, height tiers and combat bonuses are unchanged. Terrain tests verify the flat neighbors, continuous ramp joins and matching movement heights.
- Connected territory earns credits: HQ **2/s**, other connected sectors **0.9/s** each, connected relay **+20%**. Disconnected sectors give no income.
- Click the live **Cr/s** readout for the HQ contribution, connected-field contribution, relay bonus, total and disconnected fields. The same breakdown appears in production. This is gross income; paid production orders deduct credits separately.
- The HQ starts a repeating **drone → drone → mech** production sequence. Open the production row below your credit balance to add/remove orders, toggle repetition, pause production or refund the active order. Opening this planning panel pauses the match.
- Drones: **12 credits, 1.8 s, 12 HP, 3 damage/s, 1.1 s/hex**. Mechs: **40 credits, 4.8 s, 48 HP, 9 damage/s, 1.9 s/hex**. Unit cards explain fast expansion versus concentrated frontline strength. A mech has four times a drone's health and three times its firepower, retained until that mech dies. Each faction has a 160-robot production limit. Existing reinforcements are never truncated.
- Select **Verband / Drohnen / Mechs**, then **50% / Alle**. Drag an owned field to the target or tap both and confirm. After a successful order the source is deselected so the next formation can be selected immediately. Mixed formations move at mech speed. Empty fields remain owned. A selected type with no units cannot move.
- Select an owned field and choose **Sammelpunkt**. The HQ automatically dispatches surplus while keeping six robots. Supply uses friendly routes only. It replans at reached waypoints, waits for disconnected routes or stops at the last safe field if the next field falls. Such stopped troops can be moved manually. A convoy caught on a captured waypoint can be lost; it never starts an autonomous attack.
- Fights run in 0.25-second exchanges, with simultaneous damage and existing terrain/HQ bonuses. Reinforcements join either side. Engaged formations cannot withdraw. When both factions attack neutral defenders, the later formation waits until the current engagement ends.
- Independent fields fight concurrently, marked by a subtle pulsing contour (static with reduced motion). Mech shots start on the supplied model's right gun arm, not its opposite shield arm. The order forecast uses the actual damage exchanges for the current formations; future arrivals can change the outcome.
- Territory uses slightly stronger faction fills and wider light contours backed by a dark edge; neutral fields remain unfilled. Selection, reachable destinations and active battles use separate inset markers.
- One model represents each present type on a field or in transit. A single rounded combat value shows the resident force on each field (one healthy drone = one point; terrain bonuses appear in the order forecast). Exact drone/mech counts appear only in the selected field’s command panel. During combat the field value belongs to its current defender; attackers remain visible as models. Damage is retained in aggregate health buckets when formations split or merge. Projectiles and hit reactions illustrate the simulation; they do not decide combat.
- HQ starting stock and reserve are stored inside. Production briefly shows the completed robot leaving the gate; produced surplus gathers at the side or joins the outgoing supply formation. Departures follow the gate and pass around the HQ. The supplied model's empty door transform is supplemented with a local hatch; the shared GLB is unchanged. This presentation does not create additional simulated units.

The campaign uses `hexfront.mixed-squads.campaign.v1` and a separate history-state key. It neither imports nor overwrites original campaign progress. Reloading does not resume an unfinished battle.

## Deliberate limits

No mech rig, skeletal animation, foot placement or replacement model files. The existing mech moves as a rigid model following the ramp surface. Fire, recoil, impact and disappearance effects provide feedback. No new buildings, unit types, special abilities or maps. The extended landscape is static decoration using existing materials and meshes; map navigation, field count and balancing stay unchanged.

The AI follows the same credits, production, movement and damage rules as the player. Automated match outcomes provide regression evidence, not a guarantee of human balance. Browser checks cover desktop and emulated touch layouts; they are not physical-phone FPS measurements.
