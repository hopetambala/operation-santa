# Design tokens

Screens read [style-dictionary-dlite](https://github.com/hopetambala/style-dictionary-dlite) (a local clone at `vendor/style-dictionary-dlite`, not committed). The brand source in this repo is `apps/desktop/src/brand/opsanta.tokens.json`. Layout, type, color, space, radius, elevation, and motion use the generated `--tk-dlite-*` custom properties. Do not add a second palette in CSS.

## Rebuild

From the repo root, after changing `apps/desktop/src/brand/opsanta.tokens.json`:

```sh
npm run tokens
```

That copies the brand file into the local clone, installs the dictionary's build tools if needed, runs its `npm run build`, and copies into `apps/desktop/src/brand/generated/`:

| File | What it is |
|---|---|
| `variables.css` | Light custom properties. Imported by `tokens.css`. This is what the app paints. |
| `variables.dark.css` | Built, not imported. The dark mode block in the brand is empty, so this file repeats the light values. |
| `custom-media.css` | `@custom-media --tk-dlite-bp-*` from `semantic.breakpoint`. Reference only. |
| `breakpoints.json` | The same breakpoints as numbers. `apps/desktop/dlite-breakpoints.ts` reads this during Vite so `@media (--tk-dlite-bp-md-down)` works. Vite processes each CSS file alone, so the `@custom-media` sheet is not in scope otherwise. `-down` stays `breakpoint - 0.02px`, matching the dictionary. |

`generated/` is build output. Edit `opsanta.tokens.json` in this folder, then rerun `npm run tokens`. The dictionary clone and its `node_modules` stay on disk only.

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

xl is the content max-width (`--tk-dlite-semantic-breakpoint-xl`), not a fourth layout. Equal card grids use `repeat(auto-fit, minmax(min(100%, …), 1fr))` so they reflow without a private query.

## What this brand overrides, and why

- **Color** is the Operation Santa guide (paper, forest, crimson, gold, the ten route colors), stored as DTCG colors on the `opsanta` brand. The shared semantic layer is Puente blue. Putting the hexes in the brand file is the dictionary's extension point, not a parallel system.
- **font-body** is Plus Jakarta Sans. The shared token is Source Serif 4. The product brand uses Plus Jakarta for every UI string. `font-letter` is Georgia for a child's letter; the shared faces have no letter slot. The app still serves `public/fonts/PlusJakartaSans.ttf`.
- **Focus ring width** is 3px. The shared token is 2px. The brand guide asks for 3px so the gold ring stays obvious on warm paper.
- **color-scheme** is `light` on `:root`, and `variables.dark.css` is not imported. The brand guide says the app is light only this season. Declaring `light` stops the webview from painting dark form controls when the Mac is in Dark Mode. `theme-color` in `index.html` is `#1f4d38` (action-primary) because a meta tag cannot read a custom property.
- **Motion** tokens time color changes and the busy spinner only. The brand guide forbids decorative motion, so buttons do not scale on hover.

## Contrast

`npm run tokens` does not fail the build on this brand (the dictionary's gate is Puente). The opsanta light pairs were checked with the dictionary's own `build/a11y/contrast.ts` and passed WCAG 2.2 AA (4.5:1 text, 3:1 UI). Gold `#9a7a2e` is focus only: it clears 3:1 and fails 4.5:1 as text, so it is not a text color.
