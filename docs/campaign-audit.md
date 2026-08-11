# Campaign Mode — Game Design, UI/UX and Publishing Audit

**Project:** current working title `HEXFRONT`  
**Audit date:** 11 August 2026  
**Scope:** campaign mode in `campaign/index.html`, desktop and mobile portrait  
**Status:** full audit plus a targeted correction pass requested after the audit

## Follow-up correction status — 11 August 2026

The original findings remain the baseline record. Four concrete issues have now received a narrow implementation pass; this does not replace the larger roadmap or human playtesting.

| Finding | Status | Correction |
|---|---|---|
| GD-01 — Level 5 stalemate | Mitigated; human validation still required | Correct base-coordinate victory detection, remove unintended defensive pass bonuses, let the AI relay rear reserves toward an established front, taper regeneration after three minutes and stop it after four minutes. The goal is credible human-versus-AI convergence, not perfect AI-versus-AI parity. |
| MAP-03 — Level 9 side bias | Fixed for Level 9 | Neutral strengths are mirrored across the horizontal player/AI axis while keeping the seeded layout deterministic. |
| GD-04 — Level 1/2 unlock contradiction | Fixed | Level 1 now teaches 50% only and disables 100%; Level 2 is the real 100% unlock. |
| UI-M-01 — mobile campaign route | Fixed in the current layout | Portrait mobile places a compact current-act route before the mission dossier, hides inactive act groups and scrolls the selected dossier into view only when needed. |

Five campaign regression checks now protect these implementation contracts. They complement, but do not replace, the recommended extracted balance harness and device playtests.

## 1. Executive verdict

The campaign is a promising, immediately understandable prototype with a good mobile-sized core: choose an owned field, send part or all of its strength, capture connected territory and reach the opposing anchor. The board is readable, the orange/blue ownership model is learned quickly, and ten hand-authored layouts already form a usable campaign skeleton.

It is **not yet commercially release-ready**. A publisher would give it a **conditional greenlight for a focused vertical-slice phase**, not a full production greenlight. The largest blockers are:

1. The name `HEXFRONT` is commercially unusable without a formal clearance and is already occupied by very close products.
2. The campaign menu and the board communicate two different products: dark technical command software versus a light, friendly landscape game.
3. The baseline loop could settle into long equilibrium states; one deterministic Level 5 AI-vs-AI sample was still unresolved after more than nine simulated minutes. A targeted late-match correction is now implemented, but its commercial pacing still needs human playtesting.
4. The first-session UX starts real time before the player has safely learned the only supported gesture.
5. Several mission texts promise decisions the mechanics do not reliably create, especially deception under complete information.
6. Mobile portrait fits the board well, but its campaign navigation, touch targets, typography and icon semantics are not yet publication quality.
7. English/German localization, accessibility, campaign tests, analytics and install/distribution readiness are absent.

The strongest market direction is not “military command”. It is:

> **A fast, readable territory game about timing, flow and commitment on small living landscapes.**

The game should feel tactical, calm and intelligent—not martial, fantasy-medieval or like command-center software.

## 2. Audit method and limits

The review included:

- source and content inspection of the complete campaign implementation;
- desktop testing at a large viewport;
- mobile portrait testing at a phone-sized viewport;
- practical verification of campaign selection, level start and input behavior;
- structural analysis of all ten playable graphs;
- review of map economy, AI parameters, neutral placement and progression;
- deterministic accelerated AI-vs-AI balance samples;
- current-name and product-conflict research;
- build and existing test execution.

Both `npm test` and `npm run build` pass. The five existing tests cover the separate turn-based game, not the campaign system. The accelerated balance samples are diagnostic signals, not replacements for human playtests or broad simulation batches.

## 3. Publisher scorecard

Scale: 1 = concept only, 5 = workable prototype, 8 = market-ready indie quality, 10 = genre reference.

| Area | Current | Potential | Publisher assessment |
|---|---:|---:|---|
| Core idea | 7 | 8 | Clear and easy to explain; familiar but usable foundation |
| Moment-to-moment loop | 5 | 8 | Good immediacy, insufficient match convergence and decision variety |
| Campaign/map design | 6 | 8 | Solid learning sequence, several repeated structures and unproven claims |
| Desktop UI/UX | 5 | 8 | Functional, but spatially inefficient and too technical |
| Mobile portrait UI/UX | 5 | 9 | Board fit is strong; navigation and controls need a dedicated design pass |
| Visual identity/cohesion | 4 | 8 | Individual parts work, but menu and board feel like separate games |
| Text and tone | 3 | 8 | Understandable, but militarized and sometimes mechanically inaccurate |
| Onboarding | 4 | 8 | A hint exists; there is no safe interactive first-use sequence |
| Localization | 1 | 8 | German-only and strings are embedded throughout the implementation |
| Accessibility | 3 | 8 | Some semantic menu controls, but the game canvas is pointer-only |
| Audio/haptics | 3 | 7 | Functional beeps and vibration, no authored audio identity |
| Technical/QA readiness | 3 | 8 | Dependency-light build, but campaign is an untested monolith |
| Commercial readiness | 3 | 8 | Name, positioning, content proposition and distribution require decisions |

## 4. Product pillars — the recommended north star

Every future feature, map and screen should be tested against five pillars:

1. **Readable at a glance.** Ownership, valid routes, strength, targets and outcome risk must be visible without opening a panel.
2. **Commitment under complete information.** Depth should come from timing, travel, allocation and switching cost—not hidden information or claimed deception.
3. **Short matches with a real finish.** A normal mobile session should resolve in roughly 3–5 minutes; late states must converge.
4. **Living landscape, abstract play layer.** The world may feel warm and varied, but playable fields remain the strongest visual layer.
5. **Tactical, not militaristic.** Use “move”, “shift”, “link”, “route”, “rival” and “anchor”; avoid commander fantasy and battlefield bureaucracy.

## 5. What is already good

### Core interaction

- The ownership model is immediately visible.
- Numbers on fields make strength legible without opening detail views.
- A one-gesture real-time loop is well suited to touch.
- `50%`, `100%` and later group sending create understandable commitment levels.
- Travel time makes allocation decisions observable rather than instantaneous.
- Rules are deterministic enough to support mastery and fair replays.

### Board and mobile fit

- The 7×13 portrait footprint uses phone height effectively.
- The board remains fully visible above a persistent action bar.
- Team colors and neutral fields have strong text contrast.
- Safe-area padding and orientation handling are already considered.
- Water, trees and biome changes give the campaign more personality than a purely abstract grid.

### Campaign foundation

- Ten fixed maps provide a deliberate teaching sequence.
- Difficulty and AI cadence increase gradually.
- Hills, group sending and relays are introduced in stages.
- Progress and best times are stored locally.
- The mission preview accurately communicates the broad starting shape.

### Engineering foundation

- There are no runtime dependencies.
- The static build is simple and reproducible.
- The simulation is seeded, which is a good basis for deterministic balance tests.
- Debug parameters and an autoplay path already exist, even though they are not yet turned into a test harness.

## 6. Core loop and match psychology

### Current loop

1. Read owned strength and adjacent opportunities.
2. Choose 50%, 100% or later a linked send.
3. Drag from an owned field to a reachable field.
4. Wait for travel, combat and regeneration.
5. Expand, reinforce and eventually capture the opposing base.

The loop has a good first 30 seconds. The primary weakness appears after both sides own many fields: every controlled field regenerates, the front repeatedly refills and waiting can become as valuable as acting. As the maps broaden, the player performs more monitoring without receiving a proportionate increase in strategic tools.

### Königsweg: a visible, symmetric resolution phase

Do not add fog of war, random critical hits or an arbitrary hard time limit. Preserve complete information. Add a clearly announced late-match phase:

- the normal growth phase remains unchanged;
- after the target session time, regeneration declines smoothly and symmetrically;
- existing strength is not deleted;
- combat and travel rules remain constant;
- the UI shows the phase change before it matters.

This makes stored strength and prior positioning decisive, lets the active AI finish a campaign match and does not secretly favor either side. Exact timings must be simulation- and playtest-tuned.

**Acceptance criteria**

- median Level 1–3 completion: 2–4 minutes;
- median Level 8–10 completion: 3–6 minutes;
- 95th percentile below 8 minutes;
- no deterministic automated run remains active after 10 simulated minutes;
- at least 70% of test players describe the end state as earned, not timer-forced.

### First-session psychology

The first campaign should create competence before urgency. At present the match timer and AI start immediately, while the player only receives a fading text hint. The AI delay helps, but it is invisible and does not make the first interaction safe.

**Königsweg**

- Start Level 1 paused.
- Highlight the orange origin and one valid target.
- Accept both drag and tap-origin/tap-target input.
- Start simulation time and AI only after the first valid send.
- Teach growth after the first capture, then introduce the second send mode contextually.
- Do not show hills, relays or group-send explanations before their unlock level.

This supports competence, lowers first-action anxiety and avoids a large tutorial modal.

## 7. Desktop UI/UX

### What works

- The top bar communicates both sides symmetrically.
- The side panel keeps controls away from the board.
- The mission preview and mission detail can coexist at desktop width.
- Keyboard shortcuts exist for mode selection, restart and returning to the map.

### Problems and Königswege

| Finding | Impact | Königsweg | Acceptance |
|---|---|---|---|
| The board is narrow inside a very large empty stage because hex radius is capped at 34 px. | The game feels like a small prototype floating in wallpaper. | Scale from the active map bounds, not the full 7×13 decorative rectangle; use surrounding space for quiet continuous landscape, not empty flat color. | Playable area occupies about 45–60% of available stage width without exceeding comfortable reading size. |
| The side panel is a stack of dark diagnostic cards with 9–10 px text. | It reads as developer telemetry/command software. | Replace it with one calm mission strip, one primary mode control and a collapsible info/legend sheet. | A new player identifies the primary action and objective in under five seconds. |
| Mission, rule, front balance, time, actions, captures, legend, utilities and best time compete at equal weight. | High cognitive density; weak hierarchy. | Show objective, selected mode and field balance by default; move secondary statistics and full legend behind an info control. | No more than three simultaneous information priorities outside the board. |
| The desktop campaign page gives the journey panel excessive empty vertical space while the dossier is narrow and dense. | Premium appearance is undermined; layout feels dashboard-like. | Use a balanced atlas layout: compact progression rail plus a larger shared-material preview and briefing area. | No large unintentional void; selected mission and campaign position are visible together. |

## 8. Mobile portrait UI/UX

### What works

- The gameplay board fits portrait very well.
- Field numbers remain readable at the tested phone size.
- The bottom mode bar is reachable with one hand.
- The initial mission CTA is visible without scrolling on a common tall phone.

### Critical mobile findings

1. **The campaign route is below the entire selected mission dossier.** Returning to the campaign map shows a 590 px dossier first; the level route begins around 678 px below the top in the tested viewport. Choosing another level requires scrolling past the current briefing.
2. **The game only supports drag.** Two taps—origin and destination—perform no action; a drag does. This was verified practically. Drag-only interaction is less forgiving for tremor, one-handed play and small screens.
3. **Bottom controls are undersized.** Mode controls are about 37 px high and utility buttons about 42×39 px in the tested viewport.
4. **Utility icons have no accessible names.** Restart, map and fullscreen are symbol-only in the mobile bar.
5. **Browser zoom is disabled.** `maximum-scale=1` and `user-scalable=no` prevent users from enlarging the UI.
6. **The header is extremely compressed.** Tiny all-caps labels and numbers communicate data, but reinforce the “technical instrument” impression.

### Mobile Königsweg

- Put a compact horizontal act/level rail directly below the header.
- Place the selected preview and CTA after that rail.
- Keep the large campaign introduction below or collapse it after the first visit.
- Support drag and two-step tap input with a strong selected-origin state and an obvious cancel action.
- Make every primary touch target at least 44×44 CSS px, preferably 48 px.
- Move restart, sound, language and fullscreen into a labeled pause/settings sheet; keep only gameplay modes in the persistent bottom bar.
- Keep mode labels short and semantic: `SPLIT / ALL / LINK` and `TEILEN / ALLES / VERBUND` are stronger starting points than percentages alone.
- Restore browser zoom and test 200% page zoom.

**Acceptance criteria**

- from returning to the map, another unlocked mission is selectable with one tap plus at most one short horizontal swipe;
- all controls pass 44×44 px minimum target size;
- first-time users complete the first send with at most one failed gesture;
- no critical label is below 12 px; normal body copy is at least 14–16 px on mobile;
- portrait widths 320, 360, 390, 430 and 480 px have no clipped actions or horizontal page overflow.

## 9. Visual identity and menu/board cohesion

The current mismatch is structural, not cosmetic:

- campaign/menu: near-black glass panels, monospaced microcopy, “command table” framing, boxed telemetry;
- board: pale sage field, cream cells, illustrated water, trees and soft environmental colors.

The menu therefore promises a severe military/technical game, while play delivers a friendly living board. Both can be attractive separately, but together they weaken trust and brand memory.

### Recommended direction

Use a **contemporary landscape atlas**, not a fantasy overworld and not a white productivity dashboard.

- Keep deep moss/charcoal as a framing color, not the dominant content surface.
- Reuse the board’s cream, sage, water blue and terracotta in previews, cards, progress and controls.
- Let real map previews be the visual hero of the campaign screen.
- Replace “HF badge + command table” cues with a simple wordmark and landscape-derived geometry.
- Use subtle depth and material continuity, not parchment, heraldry, glowing quest paths or medieval mountains.

### Guardrails for the next mockups

The next three campaign-overview mockups should all avoid:

- fantasy maps, parchment, medieval serif type, runes or heraldic emblems;
- military command-center language, radar motifs and dense telemetry;
- mostly white/very pale app UI;
- a completely abstract UI disconnected from the map renderer.

They should test three layouts, not three unrelated art styles:

1. **Scenario Atlas — recommended:** compact act rail + large living map preview + calm dossier.
2. **Landscape Sequence:** missions presented as connected environment slices, without a fantasy travel map.
3. **Modern Tabletop:** tactile contemporary board-game presentation with mid-tone panels and the same terrain materials.

Each mockup should show desktop and portrait mobile together and use the map-decoration quality of Mockup 1 only as a reference for water, shoreline and tree grouping.

## 10. Map rendering, hex fields and decoration

### Current strengths

- Playable fields use consistent ownership colors and readable numbers.
- The full-grid canvas ensures predictable layout.
- Biomes distinguish acts and maps.
- Trees, water, ruins, marsh, mountains and snow already provide a useful vocabulary.

### Current weaknesses

- Decorative cells are still outlined as individual hexes, so the environment looks like 91 equally important tiles.
- Water is drawn cell-by-cell; no connected shoreline is formed.
- Trees are isolated symbols inside cells instead of coherent groves.
- Random decoration produces noise rather than authored landmarks.
- Water and the blue rival occupy closely related hues.
- Ruin art resembles a padlock at gameplay scale and can be read as a locked field.
- Every map retains the same rectangular honeycomb silhouette even when its playable topology differs.
- Canvas tree motion ignores `prefers-reduced-motion`.

### Königsweg: separate gameplay topology from environment art

Keep playable cells as crisp hexes. Render non-playable environment as a continuous lower-priority layer:

1. Build connected water, marsh, ridge and grove regions from neighboring decorative cells.
2. Draw shoreline only on water/non-water boundaries.
3. Remove most internal borders between decorative hexes.
4. Allow tree groups and reeds to span decorative cell boundaries, while keeping a clearance zone around playable edges.
5. Use one or two authored landmarks per map, not detail in every cell.
6. Keep environment saturation and contrast below playable fields.
7. Separate rival blue from water with hue, value, outline and a non-color marker.
8. Use the same environment renderer for campaign preview and gameplay, with a low-detail preview mode.

### Recommended biome identities

| Level | Visual landmark | Clarity rule |
|---|---|---|
| 1 | Curved shore plus two small groves | Friendly and sparse; strongest reference to Mockup 1 decoration |
| 2 | Continuous dividing stream/green strip | Two routes remain instantly legible |
| 3 | Broken circular ruin around the center | Ruins frame, never cover, the key central field |
| 4 | Layered ridge/terrace around the hill | Height shown through shadow and contour, not busy rock icons |
| 5 | One continuous mountain ridge with two openings | Pass openings must read before individual field values |
| 6 | Wetland band with reeds and shallow pools | Avoid blue rival/water confusion |
| 7 | Coherent island shoreline | Relay visibly belongs to the island landmark |
| 8 | Garden hedges, paths and restrained flower groups | “Garden” must be readable as a designed place, not random biome noise |
| 9 | Snow ridge with three unmistakable openings | Special terrain remains stronger than snow decoration |
| 10 | Long continuous lake and a distinctive final landmark | The board silhouette should finally feel like a ring around water |

## 11. Map design audit

All maps have the same shortest base-to-base distance: **10 adjacent steps**. Their differences come from width, connectivity, special cells and neutral strength—not route length. This directly corrects the earlier “short/risky versus long/safe” framing.

| # | Map | Playable fields | Topology signal | Audit | Königsweg |
|---:|---|---:|---|---|---|
| 1 | Der Pfad | 18 | 4 articulation fields, 2 bridge edges | Strong guided opener, but still offers two adjacent first choices and exposes 100% immediately. | Keep. Pause until first valid send; teach 50% only; introduce 100% in Level 2. |
| 2 | Zwei Wege | 22 | Exactly 2 shortest route families; low average connectivity | One of the clearest maps. It creates allocation commitment, not a safe/risky route choice. Text incorrectly says 100% unlocks although it is already available in Level 1. | Keep the two-route structure. Make this the real 100% unlock and teach focus versus split allocation. |
| 3 | Das Zentrum | 35 | Broad center; 225 shortest paths | Direct versus bypass is about neutral cost and central connectivity, not distance. The 15-strength center needs a visible long-term reason to own it. | Keep, but explicitly communicate its connectivity value; measure center capture versus bypass behavior. |
| 4 | Hochland | 41 | Very open, high average degree | Good single-rule terrain introduction. Hill value is mostly communicated in text and a tiny glyph. | Keep; add selection/risk feedback and a strong but quiet elevation treatment. |
| 5 | Zwei Pässe | 36 | Two separated mid-map passages | Switching cost may create reaction lag, but “fake one pass” is not proven and should not be promised. Automated play showed severe equilibrium risk. | Reframe around commitment and transfer cost. Retain two clear passes; validate whether switching can actually punish a committed rival. |
| 6 | Doppelfront | 37 | Two broad parallel fronts | Mechanically close to Levels 2 and 5; group send is the real novelty. | Make group send the centerpiece with a safe interactive unlock. Reduce explanatory load elsewhere. |
| 7 | Relaisinsel | 37 | Broad center with one central relay | Strong thematic/mechanical pairing. Relay range is invisible until learned from text. | Keep; when selected, preview every distance-2 target and visually link the island landmark to the relay. |
| 8 | Signalgärten | 43 | Widest/openest map; 2 relays + hill | Good choice of special targets, but visually not yet a garden and cognitively dense one level after relay introduction. | Keep with clearer garden landmarks; ensure one relay is a viable commitment rather than requiring both. |
| 9 | Drei Pässe | 41 | 3 differentiated passages | The middle relay versus outer hills is a genuine mechanical choice. “Deception” language is still unsupported. Seeded neutrals favor the AI route to the middle in the current deterministic setup. | Reframe as mobility versus staying power; mirror or deliberately author neutral strength. |
| 10 | Der Ring | 38 | Two sides around central water; 2 relays | Uses all rules, but its finale is mostly “faster AI with two actions” and lacks a unique payoff. | Keep the ring/lake concept; give the finale one visible authored climax and a post-campaign resolution, not more hidden AI advantage. |

### Cross-map findings

#### Repetition

Levels 2, 5 and 6 all explore separated fronts. Levels 3, 4, 7, 8 and 9 are broad arenas differentiated mainly by special cells. This is a valid teaching sequence, but commercial variety needs more than decoration.

**Königsweg:** preserve portrait orientation and fixed controls, but vary silhouette, starting asymmetry, landmark placement and objective framing. Do not add a new mechanic to every map. Use three or four reusable tactical verbs across more distinct situations.

#### Neutral-value fairness

Neutral strengths are generated deterministically but not mirrored. On symmetric layouts this creates accidental, hidden side bias. The clearest sample is Level 9: the cheapest initial cost from the player base to the middle was 38 versus 30 from the AI base.

**Königsweg:** author or mirror neutral values for symmetric maps. Use intentional asymmetry only when the briefing names it and the player receives an explicit compensating advantage.

#### Perfect-information decisions

“Deception” should not be a campaign promise unless the system creates commitment that cannot be reversed in time. The rival sees every army and can react. Real decisions available to this game are:

- how much strength to commit;
- when to leave a productive field weak;
- which lane receives scarce reinforcement;
- whether switching cost is worth paying;
- whether a relay’s reach is worth its capture cost;
- whether to spend strength now or enter the resolution phase with reserves.

Build and write around these decisions.

## 12. Text, terminology and localization

### Tone mismatch

Current phrases such as `TACTICAL FRONT COMMAND`, `VOM ERSTEN BEFEHL BIS ZUM RING`, `NÄCHSTER EINSATZ`, `GEFECHT`, `FEIND`, `FRONTSALDO`, `KOMMANDO`, `Brückenkopf`, `Flanken` and `Bündelangriff` collectively push the product toward military command language.

### Recommended terminology direction

| Current concept | English direction | German direction |
|---|---|---|
| Campaign | Journey / Campaign | Reise / Kampagne |
| Battle | Map / Round / Scenario | Karte / Runde / Szenario |
| Enemy | Rival / Blue | Gegenüber / Blau |
| Base | Anchor / Origin | Anker / Ursprung |
| Front balance | Field balance | Feldvorteil |
| 50% send | Split | Teilen |
| 100% send | All / Commit | Alles / Festlegen |
| Group send | Link | Verbund |
| Next deployment | Next map | Nächste Karte |
| Command difficulty | Mastery | Könnerstufe |

These are directional terms, not final copy. The final lexicon must be tested in complete sentences in both languages.

### Mechanical copy errors

- Level 1 states that 50% and 100% are available.
- Level 2 says 100% is unlocked there.
- In code, `features.all` is already true in every level.

This damages trust and progression clarity.

### Localization Königsweg

- English becomes the default source language.
- A persistent `EN | DE` segmented toggle is available from campaign settings and the in-game pause sheet.
- All visible strings, canvas labels, ARIA labels, toasts and result reasons come from one string catalogue.
- The document `<html lang>` changes with the selected language.
- Language choice is stored locally and applies without reload.
- Layout is tested with the longer of each English/German pair.

## 13. Typography

The UI requests `Inter` but does not package or import it, so appearance depends on the device. Monospace is applied to titles, labels, mission names, stats, buttons and map numbers. Many labels are 7–10 px. This is the primary reason mobile feels “technical”.

### Königsweg

- Package one readable contemporary sans locally; `Manrope` is a suitable direction, subject to final brand testing.
- Use tabular-number font features for statistics instead of a second monospace family.
- Reserve uppercase for short category labels.
- Use sentence case for objectives, buttons and explanations.
- Minimum mobile sizes: 12 px metadata, 14–16 px body, 16+ px primary controls.
- Reduce extreme letter spacing, especially in German.

## 14. Accessibility

### Current positives

- Campaign navigation uses real buttons.
- Focus-visible styles exist on important menu controls.
- Team text contrast on the playable fields is strong.
- Some menu elements have useful ARIA labels.

### Current blockers

- The gameplay canvas has no accessible name, focus model or keyboard equivalent.
- Mobile utility icons have no ARIA labels.
- Ownership depends heavily on orange versus blue.
- The muted 7 px act metadata can fall below contrast requirements; one representative pair is about 3.3:1.
- Browser zoom is disabled.
- Canvas animation continues under reduced-motion preference.
- Toasts and changing game state are not exposed through an accessible live region.

### Königsweg

1. Add keyboard/tap selection: focus a field, select origin, select destination, cancel.
2. Expose a concise accessible board summary and selected-field state outside the canvas.
3. Add shape/pattern markers for ownership and special fields.
4. Restore zoom and test at 200%.
5. Honor reduced motion inside the render loop.
6. Give every icon button a visible tooltip and accessible label.
7. Do not claim full screen-reader gameplay until it has been tested with NVDA, VoiceOver and TalkBack.

## 15. Results, progression and replay value

Best time, action count and captures are good raw material, but the result screen only reports them. There is no target, grade, learning feedback, campaign payoff or reason to replay except improving a locally stored number.

### Königsweg

- Give each map one primary completion goal and one optional mastery goal.
- Grade against transparent targets, never opaque “AI score”.
- After a win, show the key decision learned by that map and preview the next rule.
- Route “next” through the next mission dossier instead of starting it immediately; otherwise new rules can be skipped.
- Add an authored campaign completion screen after Level 10.

Avoid daily streaks, energy systems and advertising pressure during validation. They would conflict with the calm premium positioning.

## 16. Audio and haptics

Current oscillator beeps communicate input, capture, denial, victory and defeat, and vibration is used for sends. This is functional prototyping but not a marketable sound identity. Sound preference is not persisted.

### Königsweg

- Create a small authored palette: selection, send, arrival, capture, contested field, relay, victory and defeat.
- Use soft material/percussive sounds rather than weapons or radio chatter.
- Add restrained environment beds per act only after the loop is stable.
- Persist sound and haptic settings independently.
- Test mobile vibration sparingly and never require it for information.

## 17. Technical, QA and publishing readiness

### Campaign architecture

The campaign is a roughly 99 KB single HTML file containing markup, several generations of overlapping CSS and the full simulation/rendering code. The layered style rebuilds explain why menu and board tokens diverged and make responsive regression likely.

**Königsweg:** before substantial redesign, separate campaign data, simulation, renderer, UI, localization and persistence. Preserve deterministic seeds. This is not cleanup for its own sake; it is required to test balance and implement two languages safely.

### Testing

No automated test covers campaign topology, economy, AI, victory, progression, localization or responsive UI.

Required test layers:

- graph integrity: both anchors connected and all playable fields reachable;
- deterministic simulation batches for every map;
- match-duration and win-rate distributions;
- economy, hill, relay and group-send unit tests;
- save migration and language persistence;
- desktop and phone smoke tests;
- screenshot regression for menu and representative maps.

### Analytics

No telemetry exists. Commercial decisions currently cannot distinguish taste from friction.

Collect privacy-conscious events only after consent and a clear policy:

- campaign opened;
- mission selected/started/completed/failed/abandoned;
- first valid send time and failed input count;
- match duration and resolution phase reached;
- mode usage;
- retry and next-map behavior;
- language, viewport class and accessibility settings—not personal identity.

### Web product readiness

- No web app manifest, service worker, install experience or offline support.
- No dedicated campaign landing page or store-quality metadata/assets.
- The repository root launches a separate turn-based game with different mechanics and saves, creating product confusion.
- Debug query flags can unlock/autostart content. Fine for a free prototype; unsuitable as paid-content protection or trusted leaderboard input.

**Königsweg:** decide whether this is a free web game, a demo for a paid product or the paid product itself. For the recommended path, use the web version as an instrumented free vertical slice, validate the loop, then package a premium full campaign. Do not add ads before retention and session quality are proven.

## 18. Name and discoverability — immediate blocker

`HEXFRONT` is already used by multiple very close products:

- [HexFront on Google Play](https://play.google.com/store/apps/details?id=com.oar.hexfront.hexfront) describes a premium hex strategy game with a ten-level campaign.
- [hexfront.app](https://hexfront.app/) is a campaign manager for miniature wargaming groups.
- [Hexfront on itch.io](https://itch.io/e/40842872/girts-sacristan-kesteris-published-hexfront) is a browser hex-grid strategy game.

This creates store confusion, search-engine competition and potential legal exposure. This audit is not legal advice; a qualified trademark professional should perform the final clearance.

### Königsweg

Run a naming sprint before further public branding:

1. define tone: tactical, landscape, flow, nonmilitary, internationally pronounceable;
2. generate at least 50 candidates;
3. reject names already used in games, software and entertainment;
4. check domains, major app stores, Steam, social handles and relevant trademark classes;
5. test the final five for recall and pronunciation in English and German;
6. obtain legal clearance before logo, store art or paid acquisition.

Working directions such as `Fieldshift` or `Groundlines` are **not cleared recommendations**—only examples of a less militarized semantic territory.

## 19. Commercial product recommendation

The current ten-level campaign is a good vertical slice but too small and too mechanically repetitive to support a confident standalone premium launch at a meaningful price.

Recommended business sequence:

1. polish Levels 1–3 as a free acquisition slice;
2. validate first-session completion, match duration and replay intent;
3. finish a cohesive 10-level internal campaign as the production benchmark;
4. only then decide the paid scope using measured demand;
5. if premium, expand through authored scenarios and challenge goals—not grind.

A reasonable premium direction would be a one-time purchase or full-campaign unlock. Final price and content count should be decided after platform, retention and production cost are known; this audit does not pretend a price can be optimized without those inputs.

## 20. Findings register

Every roadmap item references one or more IDs below.

| ID | Priority | Finding | Required resolution |
|---|---|---|---|
| BR-01 | P0 | Exact-name conflict in the same genre | Rename after formal commercial clearance |
| PR-01 | P0 | Product promise is split between campaign and separate root game | Choose one acquisition/product hierarchy |
| GD-01 | P0 | Matches can enter long equilibrium states | Visible symmetric resolution phase + simulation targets |
| GD-02 | P0 | First match starts before safe learning | Pause until first valid send; contextual onboarding |
| GD-03 | P1 | Drag-only input | Add persistent origin selection and tap-target input |
| GD-04 | P1 | Mode progression/copy contradiction | Make unlock order real and consistent |
| GD-05 | P2 | Result/progression lacks mastery feedback | Transparent goals and authored next-step flow |
| MAP-01 | P1 | Deception claims are not mechanically demonstrated | Reframe around commitment or add validated switching cost |
| MAP-02 | P1 | Several maps repeat the same separated/open-front structures | Vary silhouette, landmark and tactical role |
| MAP-03 | P1 | Deterministic neutral values create accidental side bias | Mirror or deliberately author starting strengths |
| MAP-04 | P1 | Terrain reach/value is mostly textual | Selection previews and clearer terrain language |
| VIS-01 | P0 | Campaign menu and board look like different games | Approve one shared visual system before implementation |
| VIS-02 | P1 | Decorative environment remains a noisy hex grid | Continuous low-priority environment layer |
| VIS-03 | P1 | Water and rival blue are too closely related | Separate by hue/value/outline/non-color marker |
| VIS-04 | P2 | Ruin art resembles a lock | Redesign landmark silhouette |
| VIS-05 | P1 | Tiny monospace/all-caps system feels technical | New typography scale and locally packaged font |
| UI-D-01 | P1 | Desktop board underuses the stage | Active-bounds scaling and composed environment |
| UI-D-02 | P2 | Desktop side panel has weak hierarchy | Reduce to primary controls + collapsible detail |
| UI-M-01 | P1 | Mobile level route sits below a large dossier | Put compact route/act rail first |
| UI-M-02 | P1 | Touch targets and icon semantics are insufficient | 44–48 px targets, labels and pause/settings sheet |
| UI-M-03 | P1 | Browser zoom disabled | Restore and validate zoom |
| COPY-01 | P0 | Military/commander tone conflicts with product goal | Approve bilingual nonmilitary lexicon |
| LOC-01 | P1 | No English/German localization system | English source + persistent EN/DE toggle |
| A11Y-01 | P1 | Canvas is not keyboard/screen-reader operable | Equivalent selection model and accessible state |
| A11Y-02 | P2 | Canvas ignores reduced motion | Integrate preference into renderer |
| AUD-01 | P2 | Prototype beeps have no product identity | Authored nonmilitary sound palette |
| TECH-01 | P1 | Monolithic file and layered CSS overrides | Separate simulation, data, render, UI and locale modules |
| TECH-02 | P0 | No campaign test or balance harness | Deterministic batches and campaign test suite |
| TECH-03 | P2 | No PWA/landing/distribution layer | Implement after product/platform decision |
| BUS-01 | P1 | Current scope is a vertical slice, not a proven premium product | Validate before content expansion |
| BUS-02 | P1 | No analytics to guide commercial decisions | Privacy-conscious funnel and match metrics |

## 21. Final publisher recommendation

**Proceed**, but treat the next phase as product definition and vertical-slice validation—not cosmetic polishing.

The best version of this project is a distinctive, calm real-time territory tactics game whose environments feel alive while every decision remains exact. Preserve the readable board and short gesture loop. Remove the command-center identity, unsupported deception language and tiled decoration noise. Prove that matches finish, that new players understand the first move and that the campaign screen belongs to the same world as the board. Only then expand content or monetize.
