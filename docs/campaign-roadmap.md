# Campaign Mode — Prioritized Product Roadmap

**Derived from:** `docs/campaign-audit.md`  
**Roadmap date:** 11 August 2026  
**Implementation status updated:** 12 August 2026
**Principle:** no production implementation begins until the relevant decision gate is approved

## Current implementation status — 12 August 2026

The restructuring brief in `docs/auftrag-hexfront-neustrukturierung.md` is complete. This roadmap remains the product and commercial plan beyond that technical/core-gameplay brief; “complete” below therefore means the roadmap exit criteria, not merely that implementation has started.

| Step | Status | Current evidence / remaining gap |
|---:|---|---|
| 1 | Open | `HEXFRONT` is still a collision-prone working title; promise and clearance are not approved. |
| 2 | Open | Some command-language outliers were removed, but no approved bilingual lexicon exists. |
| 3 | Partial | `npm run balance` is deterministic and covers all ten maps; 1,000-run distributions, bias thresholds and CI failure gates remain. |
| 4 | Partial | Symmetric decline/stop behavior exists at 180/240 s; alternatives and human comprehension have not been compared. |
| 5 | Complete | Terrain Atlas V2 is now the production campaign menu on desktop and mobile: one deterministic hex grid, real-cell stations, exposed-edge shores and a responsive dossier. Earlier directions remain archived for traceability. |
| 6 | Mostly complete | Runtime, level data, systems, input, rendering, UI, audio, persistence and debug are separated and typed; locale catalogues and CSS token consolidation remain. |
| 7 | Open | English-default runtime localization and persistent `EN | DE` toggle are not implemented. |
| 8 | Partial | Real drag input and reduced Level-1 HUD exist; paused first action, tap-origin/tap-target and keyboard-equivalent input remain. |
| 9 | Partial | The production menu and Level 1 now share the sage/cream shell, vegetation, water and shore materials. Remaining levels and the in-match HUD still need full token and biome alignment. |
| 10 | Partial, Level 1 pilot | Visible hexes remain. Level 1 now uses generated water/shore materials with code-derived coast geometry only on exposed water edges; extension to other biomes and maps still requires approval. |
| 11 | Partial | Levels 1 and 2 were rebuilt and tested; Level 3, mastery goals and human acquisition testing remain. |
| 12 | Partial | Icon labels, reduced-motion CSS and 44 px touch targets exist; keyboard, zoom, non-color state and assistive-technology testing remain. |
| 13 | Open | No production telemetry or consent model. |
| 14 | Partial | All ten maps are supply-aware, mirrored where symmetric and regression-tested; authored roles/landmarks and human balance proof remain. |
| 15 | Open | Results, mastery and next-dossier flow are not production-ready. |
| 16 | Open | Sound remains a functional prototype without an authored nonmilitary palette. |
| 17 | Partial | Build, browser matrix and Pages CI exist; screenshot regression, performance budgets, save recovery and release packaging remain. |
| 18 | Open | Premium scope and monetization await vertical-slice data. |
| 19 | Deferred | Post-launch systems remain intentionally out of scope. |

## Completed targeted corrections — 11 August 2026

These small corrections were approved separately from the full production roadmap:

- Level 1 is now 50%-only and Level 2 performs the real 100% unlock.
- Level 9 neutral strengths are mirrored to remove the accidental seeded AI advantage.
- Portrait mobile shows a compact current-act route before the mission dossier.
- The AI now begins low-priority rear-to-front logistics once a front is established; Level 5 also has a bounded late phase to prevent the observed static reserve deadlock. This is a pragmatic human-versus-AI safeguard, not a claim of solved AI-versus-AI balance.
- Correct base coordinates, rather than any captured base tile, now decide victory.
- These contracts now sit inside a 34-test logic/simulation suite and a 10-flow desktop/mobile Playwright suite. A deterministic ten-level balance runner exists; the large-batch distributions and thresholds required to complete step 3 remain outstanding.

## How to read this roadmap

- **P0:** commercial or foundational blocker;
- **P1:** required for a public vertical slice;
- **P2:** production polish and release readiness;
- **P3:** expansion only after validation.

Effort is relative and intentionally coarse: `S` (small), `M` (medium), `L` (large), `XL` (multi-system). It is not a schedule estimate.

## Release gates

| Gate | Decision | Must be true before proceeding |
|---|---|---|
| A — Product identity | Name, tone and product promise | Nonmilitary positioning approved; name shortlist commercially screened |
| B — Visual direction | Campaign/menu/board system | One of three new mockup directions approved on desktop and portrait mobile |
| C — Loop validation | Match pacing and first-use UX | Automated duration targets pass; first-session test meets criteria |
| D — Vertical slice | Levels 1–3 public-quality | EN/DE, accessibility baseline, telemetry and responsive QA pass |
| E — Full campaign | Ten-level production benchmark | Every map has an authored role, balance evidence and final presentation |
| F — Commercial release | Platform and monetization | Product scope, store assets, privacy, install path and pricing approved |

## P0 — Resolve before visual production

### 1. Rename and define the product promise

**Audit:** BR-01, PR-01, COPY-01  
**Effort:** M  
**Dependency:** none

Actions:

- freeze new public `HEXFRONT` branding;
- write a one-sentence English product promise and German equivalent;
- approve tone pillars and a prohibited-language list;
- run a 50+ candidate naming sprint;
- screen final candidates across app stores, Steam, web, domains and trademarks;
- obtain professional legal clearance before final identity work;
- decide whether the separate turn-based root game remains, is renamed separately or is removed from the campaign acquisition path.

Exit criteria:

- approved cleared name;
- approved sentence: genre, core action, session promise and differentiator;
- campaign has one unambiguous public URL/product hierarchy;
- no “command/commander/front/war” framing unless explicitly re-approved.

### 2. Approve the bilingual terminology system

**Audit:** COPY-01, GD-04, LOC-01  
**Effort:** S  
**Dependency:** step 1

Actions:

- create the English source lexicon;
- create German equivalents in complete UI sentences;
- resolve terms for player/rival, base/anchor, round/map, modes and results;
- retain the corrected Level 1/2 100% unlock progression;
- rewrite Level 5 and Level 9 goals around commitment and mobility rather than deception.

Exit criteria:

- every core concept has one term per language;
- no mission copy promises an unverified mechanic;
- terms fit 320 px layouts at the target type scale.

### 3. Convert the debug simulation into a campaign balance harness

**Audit:** GD-01, MAP-03, TECH-02  
**Effort:** L  
**Dependency:** none

Actions:

- extract deterministic campaign simulation from the HTML;
- run large batches for all ten maps;
- report finish rate, duration distribution, side win rate, field swings and resolution cause;
- fail builds on disconnected maps, unresolved 10-minute runs and severe side bias;
- record baseline results before changing balance.

Exit criteria:

- at least 1,000 deterministic runs per map/configuration in balance reports;
- 100% map connectivity;
- no unresolved run after 10 simulated minutes;
- expected side advantage documented per map instead of accidental.

### 4. Prototype and select the match-resolution system

**Audit:** GD-01  
**Effort:** L  
**Dependency:** step 3

Actions:

- prototype the visible symmetric regeneration decline recommended by the audit;
- use the implemented Level 5 late-phase behavior as the first prototype, not as final balance proof;
- compare it against the current baseline and one alternative;
- expose the phase clearly in UI copy and board feedback;
- playtest whether the end feels earned;
- tune AI behavior for the resolution phase.

Exit criteria:

- median early campaign duration 2–4 minutes;
- median late campaign duration 3–6 minutes;
- p95 below 8 minutes;
- no hidden side buff, random critical rule or hard unexplained timeout;
- player-test comprehension at least 80% after one explanation.

### 5. Create and approve three new campaign-overview mockups

**Audit:** VIS-01, UI-D-01, UI-M-01  
**Effort:** M  
**Dependency:** steps 1–2

Create desktop + portrait pairs for:

1. Scenario Atlas;
2. Landscape Sequence;
3. Modern Tabletop.

All three must use:

- the board palette and actual map previews;
- Mockup 1’s water/shore/tree quality only as an environment reference;
- no fantasy map language;
- no white/bland productivity-app treatment;
- no military command table;
- a level route reachable immediately on mobile.

Exit criteria:

- one direction approved explicitly by the product owner;
- rejected traits documented so they do not return during implementation;
- desktop and mobile use the same system rather than separate compositions.

## P1 — Build the public vertical slice

### 6. Split the campaign into testable systems

**Audit:** TECH-01, TECH-02, LOC-01  
**Effort:** L  
**Dependency:** step 3 design for the simulation boundary

Target modules:

- campaign/map data;
- pure simulation/economy/combat;
- AI;
- canvas environment and board renderer;
- UI/input;
- localization catalogue;
- save/settings;
- audio/haptics.

Exit criteria:

- no behavior change in baseline replays;
- campaign tests run independently of a browser;
- CSS has one intentional token layer, not stacked rebuild overrides;
- both languages can be changed without editing game logic.

### 7. Implement the English/German runtime toggle

**Audit:** LOC-01, COPY-01  
**Effort:** M  
**Dependency:** steps 2 and 6

Actions:

- English is default source language;
- add persistent `EN | DE` segmented control to settings/pause;
- localize DOM, canvas text, toasts, results and accessibility labels;
- update `<html lang>` live;
- add missing-string tests.

Exit criteria:

- 100% string coverage in both languages;
- language survives reload and campaign return;
- no truncation in supported desktop/mobile matrices;
- no gameplay string remains hard-coded outside the locale files.

### 8. Rebuild first-session onboarding and input

**Audit:** GD-02, GD-03, UI-M-02, A11Y-01  
**Effort:** L  
**Dependency:** steps 2 and 6

Actions:

- begin Level 1 paused;
- teach one valid first send in context;
- support drag and tap-origin/tap-target;
- add selection, invalid-target and cancel states;
- begin AI/time after first valid action;
- hide locked-system explanations until introduced;
- add keyboard-equivalent selection.

Exit criteria:

- 85%+ first-time Level 1 completion without external explanation;
- median time to first valid action below 20 seconds;
- at most one failed gesture for 80% of first-time testers;
- interaction works with touch, mouse and keyboard.

### 9. Implement the approved shared visual system

**Audit:** VIS-01, VIS-05, UI-D-01, UI-D-02, UI-M-01  
**Effort:** XL  
**Dependency:** gate B and step 6

Actions:

- define shared color, type, spacing, radius and elevation tokens;
- package the approved UI font locally;
- rebuild campaign overview in the approved layout;
- simplify the desktop HUD and mobile header;
- retain the corrected mobile route-before-dossier order and refine its visual treatment;
- move utilities into a labeled pause/settings sheet;
- scale desktop gameplay using active board bounds.

Exit criteria:

- blind reviewers identify menu and board as the same game;
- primary action and objective found in under five seconds;
- no critical mobile text below 12 px;
- all primary touch targets at least 44×44 px;
- 320–480 px portrait and standard desktop widths pass visual QA.

### 10. Unify decorative hexes into coherent terrain regions

**Audit:** VIS-02, VIS-03, VIS-04, A11Y-02  
**Effort:** XL  
**Dependency:** gate B and step 6

Actions:

- retain the complete, clearly visible hex structure across playable and decorative terrain;
- generate connected terrain regions from adjacent decorative cells without turning the board into a freeform background illustration;
- draw coherent water and shoreline transitions across neighboring hexes while keeping the grid rhythm readable;
- use a restrained library of trees, conifers, bushes, small trees, reeds and grass variations;
- group vegetation across neighboring cells only where it does not obscure hex boundaries or playable-edge clearance;
- author one or two landmarks per map;
- redesign ruins so they cannot read as locks;
- separate water from rival blue;
- share the renderer with map previews;
- honor reduced-motion preferences.

Exit criteria:

- players distinguish playable versus decorative areas in under two seconds;
- water is perceived as one connected body while the underlying hex structure remains obvious;
- no decorative symbol is mistaken for a lock, objective or selectable cell;
- ownership remains readable in grayscale and common color-vision simulations.

### 11. Re-author and rebalance Levels 1–3 as the acquisition slice

**Audit:** MAP-01, MAP-02, MAP-03, MAP-04, GD-04  
**Effort:** L  
**Dependency:** steps 3–4 and 8–10

Actions:

- Level 1: retain the corrected 50%-only control set; add one safe first action;
- Level 2: retain the corrected real 100% unlock and teach focus-versus-split allocation;
- Level 3: make center value explicit and measure direct/bypass behavior;
- mirror or author all neutral values;
- give each map a distinct continuous landmark;
- add transparent mastery goals.

Exit criteria:

- each level teaches one named decision;
- at least 70% of testers can state that lesson after play;
- no map text contradicts enabled controls;
- balance and duration targets pass.

### 12. Establish the accessibility baseline

**Audit:** A11Y-01, A11Y-02, UI-M-02, UI-M-03, VIS-03  
**Effort:** L  
**Dependency:** steps 7–10

Actions:

- restore pinch/page zoom;
- add accessible icon names and visible tooltips;
- implement keyboard selection and board summary;
- add non-color ownership/terrain cues;
- expose important messages through live regions;
- respect reduced motion;
- test focus order and 200% zoom.

Exit criteria:

- WCAG 2.2 AA for non-canvas UI;
- full campaign/menu operation by keyboard;
- no critical state communicated only by color;
- documented NVDA, VoiceOver and TalkBack test results.

### 13. Add privacy-conscious vertical-slice telemetry

**Audit:** BUS-01, BUS-02, TECH-02  
**Effort:** M  
**Dependency:** measurement definitions from steps 3, 8 and 11

Actions:

- define minimal event schema and consent behavior;
- measure campaign funnel, first input, duration, failure, retry and mode usage;
- separate test/debug sessions;
- create one dashboard for the release gates.

Exit criteria:

- no personal identity required;
- event and privacy documentation approved;
- vertical-slice metrics can answer every gate C/D question;
- events are tested and versioned.

## P2 — Complete and polish the ten-level campaign

### 14. Re-author Levels 4–10 with explicit roles

**Audit:** MAP-01, MAP-02, MAP-03, MAP-04  
**Effort:** XL  
**Dependency:** validated Levels 1–3 and resolution system

Required roles:

- Level 4: hill/defense;
- Level 5: switching cost and commitment, not claimed deception;
- Level 6: group-send mastery;
- Level 7: single-relay reach;
- Level 8: choose and support one of multiple special targets;
- Level 9: mobility versus staying power, with authored fairness;
- Level 10: combined-system finale with an authored climax.

Exit criteria:

- every map has a unique tactical sentence and visual landmark;
- neutral values are deliberate;
- automated and human balance targets pass;
- Level 10 has a campaign-resolution screen.

### 15. Upgrade results, mastery and replay flow

**Audit:** GD-05, BUS-01  
**Effort:** M  
**Dependency:** map targets from steps 11 and 14

Actions:

- add one transparent mastery goal per map;
- improve result hierarchy and feedback;
- show what was learned and what unlocks next;
- take “next” to the next dossier, not directly into live play;
- preserve best times and migrate existing saves safely.

Exit criteria:

- result meaning understood without explanation;
- new mechanics cannot be skipped by the next-level flow;
- retry and next actions are distinct and accessible.

### 16. Author the sound and haptic palette

**Audit:** AUD-01  
**Effort:** M  
**Dependency:** visual/interaction system stable

Actions:

- replace oscillator-only prototype sounds;
- keep the palette tactile and nonmilitary;
- persist sound/haptic settings;
- add restrained act ambience if testing supports it.

Exit criteria:

- all critical events have distinct, non-fatiguing feedback;
- mute and haptic settings persist;
- no information depends on audio alone.

### 17. Finish release QA and web product basics

**Audit:** TECH-02, TECH-03  
**Effort:** L  
**Dependency:** gate E

Actions:

- browser/device matrix and screenshot regression;
- save migration and recovery tests;
- performance budgets for low-end mobile;
- manifest, icons and offline strategy if PWA is selected;
- campaign landing page, metadata and store-quality screenshots;
- remove or restrict production debug affordances according to the business model.

Exit criteria:

- target devices sustain the selected frame-rate budget;
- no blocker/high-severity issue in release matrix;
- install/offline behavior matches published claims;
- public URL leads to the intended product.

## P3 — Expand only after measured demand

### 18. Decide full premium scope and monetization

**Audit:** BUS-01, BUS-02, PR-01  
**Effort:** product decision  
**Dependency:** vertical-slice data and cost model

Preferred direction:

- free web/demo slice;
- one-time premium game or full-campaign unlock;
- more authored scenarios, optional mastery challenges and difficulty variants;
- no energy system, forced daily streak or intrusive ads.

Do not set final price or content count until acquisition, completion, replay intent and production cost are known.

### 19. Optional post-launch systems

Only consider after the core campaign meets retention and review targets:

- challenge variants using existing maps;
- asynchronous daily seeded challenge without streak pressure;
- accessibility presets;
- cloud save or export/import;
- fair leaderboard only with server-authoritative validation;
- additional biomes and scenario packs.

## Suggested execution order

1. Name/product/tone decisions.
2. Balance harness and baseline.
3. Three revised campaign-overview mockups.
4. Visual direction approval.
5. Campaign modularization.
6. Resolution phase prototype.
7. Input/onboarding and EN/DE architecture.
8. Shared UI system and continuous environment renderer.
9. Levels 1–3 vertical slice.
10. Accessibility and telemetry.
11. Gate C/D playtest release.
12. Levels 4–10 and campaign payoff.
13. Audio, web packaging and commercial decision.

## Definition of a successful vertical slice

The project is ready to leave vertical-slice status only when all of the following are true:

- cleared new name and coherent nonmilitary product promise;
- approved campaign/board visual system;
- English and German complete;
- Level 1 first-time completion at least 85%;
- target match-duration distribution achieved;
- no unresolved automated match after 10 simulated minutes;
- touch, mouse and keyboard input supported;
- mobile route selection is immediate and all touch targets meet size targets;
- Levels 1–3 each teach and test a different decision;
- accessibility baseline and privacy-conscious telemetry pass;
- blind reviewers consistently describe menu and board as the same game.
