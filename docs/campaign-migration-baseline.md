# HEXFRONT campaign migration baseline

Recorded from `main` before isolating or restructuring the campaign product.

## Product boundary

- `campaign/index.html` is the real-time territory-control campaign and becomes the standalone HEXFRONT product.
- The root `index.html`, `styles.css`, `src/core.js`, and `src/game.js` are the preserved, turn-based **HEXFRONT Tactics** legacy game.
- The two games currently share only the repository root and the old hand-written build process. They do not share runtime state or save keys.

## Current campaign responsibilities

| Current area in `campaign/index.html` | Target module boundary |
| --- | --- |
| Owners, terrain, decorations, numeric balance constants, hex math, seeded RNG | `src/core/types.ts`, `config.ts`, `hex.ts`, `random.ts` |
| Level metadata, routes, terrain, fixed units, decoration placement | `src/levels/` |
| Match state, board creation, selection, elapsed time and deterministic update loop | `src/core/GameState.ts` |
| Production and endgame scaling | `src/systems/GrowthSystem.ts` |
| Army travel, arrivals, sieges and capture | `src/systems/MovementSystem.ts`, `CombatSystem.ts` |
| AI scoring, focus target selection and actions | `src/systems/AISystem.ts` |
| End conditions and progression completion | `src/systems/VictorySystem.ts` |
| Pointer drag interpretation and key shortcuts | `src/input/InputController.ts` |
| Board geometry, hexes, landscape, water, vegetation and effects | `src/rendering/` |
| HUD, campaign map, result overlay and responsive presentation | `src/ui/` |
| Synthesized SFX | `src/audio/` |
| Local campaign progress and save-key migration | `src/persistence/` |
| Narrow development-only inspection API | `src/debug/` |

## Verified Phase-0 behaviour

On 2026-08-12, Level 1 was opened at the existing campaign URL with no debug mutation. A real pointer drag was performed from the orange base to the adjacent neutral hex.

- Level 1 started with only the `50 %` send mode enabled; `100 %` and `BÜNDEL` were disabled.
- The pointer drag produced one player action.
- The sent army reached and captured the neutral hex: player fields increased from 1 to 2 and captures from 0 to 1.
- Existing unit tests passed (11/11) and the legacy build completed successfully.

## Migration invariants

1. Preserve the existing campaign rules and deterministic seeded board generation through the architectural migration.
2. Do not import campaign code from the legacy tactics game or vice versa.
3. Keep `hexfront_campaign_progress_v2` readable during the migration; any new save format must migrate it explicitly.
4. Do not change balance, level layouts, AI parameters, or visual direction until module parity and browser regression coverage are in place.
5. Keep the Canvas 2D renderer; the simulation must be independently testable without a DOM or canvas.
