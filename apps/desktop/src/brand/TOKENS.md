# Design tokens

Screens read tokens built by [style-dictionary-dlite](https://github.com/hopetambala/style-dictionary-dlite). The brand source in this repo is `apps/desktop/src/brand/opsanta.tokens.json`. Layout, type, color, space, radius, elevation, and motion use the generated `--tk-dlite-*` custom properties. Do not add a second palette in CSS.

## Rebuild

From the repo root, after changing `apps/desktop/src/brand/opsanta.tokens.json`:

```sh
npm run tokens
```

That fetches style-dictionary-dlite at the commit pinned in `scripts/build-tokens.mjs` (`v0.4.0`, `90def0b`) into `node_modules/.cache/style-dictionary-dlite`, copies the brand file in, runs the dictionary's `build/index.ts` with this repo's exact-pinned `style-dictionary` and `tsx` (dLite's own lockfile and `node_modules` are not used), and copies into `apps/desktop/src/brand/generated/`:

| File | What it is |
|---|---|
| `variables.css` | Light custom properties. Imported by `tokens.css`. This is what the app paints. |
| `variables.dark.css` | Built, not imported. The dark mode block in the brand is empty, so this file repeats the light values. |
| `custom-media.css` | `@custom-media --tk-dlite-bp-*` from `semantic.breakpoint`. Reference only. |
| `breakpoints.json` | The same breakpoints as numbers. `apps/desktop/dlite-breakpoints.ts` reads this during Vite so `@media (--tk-dlite-bp-md-down)` works. Vite processes each CSS file alone, so the `@custom-media` sheet is not in scope otherwise. `-down` stays `breakpoint - 0.02px`, matching the dictionary. |

`generated/` is build output, committed so the app builds without the generator. Edit `opsanta.tokens.json` in this folder, then rerun `npm run tokens` and commit both. CI on macOS runs `npm run tokens` and fails if `generated/` differs from what is committed.

To move to a newer dLite release, change `tag` and `commit` in `scripts/build-tokens.mjs`, run `npm run tokens`, and review the diff in `generated/`.

## Names the screens use

The dictionary's name transform is `tk-dlite-{primitive|semantic}-{path}`. Confirmed against `variables.css` after a build, not guessed. Examples:

- `--tk-dlite-semantic-color-action-primary`
- `--tk-dlite-semantic-spacing-400`
- `--tk-dlite-semantic-typography-size-400`
- `--tk-dlite-semantic-border-radius-lg`
- `--tk-dlite-semantic-elevation-low`
- `--tk-dlite-semantic-motion-duration-quick`
- `--tk-dlite-semantic-sizing-target-min` (24px) and `-target-comfortable` (44px)
- `--tk-dlite-semantic-focus-ring-width` (3px on this brand; the shared default is 2px)
- `--tk-dlite-primitive-fontWeight-semibold` (the transform does not kebab `fontWeight`)

Route swatches are `--tk-dlite-semantic-color-route-1` through `-route-10`. `model.ts` still keeps the same hexes in `colors` because canvas and PDF fills cannot resolve a CSS variable. `model.test.ts` fails if the two drift.

## Breakpoints

`semantic.breakpoint` is sm 640, md 768, lg 1024, xl 1280. The app uses three bands of that scale, everywhere, via `--tk-dlite-bp-*`:

| Band | Query | Window |
|---|---|---|
| compact | `--tk-dlite-bp-md-down` | phone, under 768 |
| regular | `--tk-dlite-bp-md-up` and `--tk-dlite-bp-lg-down` | tablet, 768–1023 |
| expanded | base styles, which match `--tk-dlite-bp-lg-up` | desktop, 1024 and up |

xl is not a fourth layout. The content max-width is the brand's own `--tk-dlite-semantic-sizing-content-width` (1440px), not a breakpoint. Equal card grids use `repeat(auto-fit, minmax(min(100%, …), 1fr))` so they reflow without a private query.

## What this brand overrides, and why

- **Color** is the Operation Santa guide (paper, forest, crimson, gold, the ten route colors), stored as DTCG colors on the `opsanta` brand. The shared semantic layer is Puente blue. Putting the hexes in the brand file is the dictionary's extension point, not a parallel system.
- **font-body** is Plus Jakarta Sans. The shared token is Source Serif 4. The product brand uses Plus Jakarta for every UI string. `font-letter` is Georgia for a child's letter; the shared faces have no letter slot. The app still serves `public/fonts/PlusJakartaSans.ttf`.
- **Focus ring width** is 3px. The shared token is 2px. The brand guide asks for 3px so the gold ring stays obvious on warm paper.
- **Sizes** follow the brand book, not dLite's shared scale: `typography.size-600/700/800/900` are 19/22/32/34px (letter, title, stat, page-title), `border.radius-sm/md/lg` are 8/12/16px and a brand `radius-xl` (24px) rounds dialogs, `elevation.low/high` are the brand's ink-tinted shadow-card and shadow-overlay, and `sizing.content-width` is 1440px. The scale stays in increasing order. `model.test.ts` checks the generated values.
- **Unrouted map pin** is `#5f5c55` and **danger** is crimson-800 `#8b1c22`, darker than the brand book's `#77756e` and crimson-700. Both read better (the pin is 5.8:1 on the map ground instead of 4.0:1); the brand book is to be updated to match.
- **color-scheme** is `light` on `:root`, and `variables.dark.css` is not imported. The brand guide says the app is light only this season. Declaring `light` stops the webview from painting dark form controls when the Mac is in Dark Mode. `theme-color` in `index.html` is `#1f4d38` (action-primary) because a meta tag cannot read a custom property.
- **Motion** tokens time color changes and the busy spinner only. The brand guide forbids decorative motion, so buttons do not scale on hover.

## Contrast

`npm run tokens` does not fail the build on this brand (the dictionary's gate is Puente). The opsanta light pairs were checked with the dictionary's own `build/a11y/contrast.ts` and passed WCAG 2.2 AA (4.5:1 text, 3:1 UI). Gold `#9a7a2e` is focus only: it clears 3:1 and fails 4.5:1 as text, so it is not a text color.
