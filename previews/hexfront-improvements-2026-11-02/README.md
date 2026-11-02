# HEXFRONT – browser test build, 2 November 2026

Production-mode build of source commit `9812ced1bd30d323549130862aa16b5bab7ccbe4` on `codex/improve-mobile-onboarding-copy`. Includes the ice finale, logistics/controls improvements, corrected Kongregate integration and the mobile hint flicker fix. Map zoom is unchanged; per-map proposals are documented separately. Development cheats and inspection APIs are excluded.

This folder is committed so the branch can provide a playable HTTPS preview on phones using the same pinned githack hosting already used elsewhere in this repository. The main README links to the exact artifact commit. Main/GitHub Pages and portal uploads are separate from this preview.

Rebuild from the desired source revision:

```sh
npx vite build --mode production --outDir previews/hexfront-improvements-2026-11-02
```

Then verify the generated assets and absence of development entry points, update `build-info.json` with the source revision, commit the files, and update the main README to the new artifact commit. A pinned CDN URL always serves its original files.

Manual campaign, physical device and real portal checks remain open. Use [the test checklist](../../docs/manuelle-testcheckliste-2026-11-02.md). Kongregate statistics are deliberately inactive on this standalone preview host; verify them in Kongregate's own preview later.
