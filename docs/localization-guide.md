# HEXFRONT localization guide

HEXFRONT uses English as its default source language and supports German through a persistent `EN | DE` control in the menu settings. The selected language is stored locally and applied immediately to the document language, interface, level copy, status messages, results and accessibility labels.

## Adding static interface copy

1. Add an English key to `src/i18n/catalog.ts` under `EN_TRANSLATIONS`.
2. Add the matching German value to `DE_TRANSLATIONS`.
3. Bind static HTML with `data-i18n="key"`. Use `data-i18n-aria-label`, `data-i18n-title` or `data-i18n-content` for the corresponding attribute.
4. Use `i18n.t('key')` for dynamic TypeScript messages. Interpolation uses named placeholders such as `{level}`.

The German catalogue is typed against the complete English key set. A missing German entry therefore fails the TypeScript check. Automated tests also reject unknown HTML bindings and empty catalogue values.

## Adding campaign content

All player-facing level and act fields use `LocalizedText`. Supply both languages with the helper:

```ts
name: localized('I · THE PATH', 'I · DER PFAD'),
objective: localized('Capture the blue base.', 'Erobere die blaue Basis.'),
```

The required bilingual fields are:

- Level: `name`, `short`, `blurb`, `objective`, `rule`
- Campaign act: `roman`, `name`, `difficulty`

Omitting either language fails compilation. `tests/localization.test.ts` additionally checks every level and act for non-empty copy.

## Rules for future work

- Do not put player-facing prose directly in game logic, input handlers or UI controllers.
- Keep simulation and event results language-neutral; translate their codes at the UI boundary.
- Treat English as the editorial source, but review both languages as authored product copy rather than machine-translated fallback text.
- Include visible labels, tooltips, confirmation dialogs, toasts, result reasons and ARIA names.
- Check both languages at desktop width and at the 390 × 844 mobile-portrait target.

## Verification

Run before merging localized content:

```bash
npm run typecheck
npm test
npm run test:browser
npm run build
```

The browser suite verifies English default behavior, live German switching, persistence after reload, responsive overflow and minimum mobile touch sizes.
