# Operation Santa

Local desktop season and Christmas Eve delivery planning for the Pasadena Jaycees. Built with Tauri, React, TypeScript, and Rust. This is an internal alpha; it is not a signed production release.

## Run locally

Requires Node.js 22 or later, Rust, and the platform's Tauri build prerequisites (Xcode command-line tools on macOS; Visual Studio C++ Build Tools and WebView2 on Windows).

```sh
npm ci
npm run desktop
```

For an in-memory preview with synthetic families:

```sh
npm run dev
```

The development server uses port 1420. If another development server already occupies that port, close that server before starting the desktop development command. Real imports and encrypted season files require the desktop app.

Screen color, type, space, and breakpoints come from the [style-dictionary-dlite](https://github.com/hopetambala/style-dictionary-dlite) `opsanta` brand. The generated files are committed, so building and running the app needs nothing extra. After editing `apps/desktop/src/brand/opsanta.tokens.json`, regenerate them (this fetches the pinned dLite commit, so it needs git and network access):

```sh
npm run tokens
```

The contract, including why dark mode is built and not applied, is in `apps/desktop/src/brand/TOKENS.md`.

## Build

macOS:

```sh
npm run desktop:build -- --bundles app,dmg
```

Outputs are under `target/release/bundle/macos/` and `target/release/bundle/dmg/`. This builds for the current machine's architecture. Developer ID signing/notarization and universal Intel/Apple Silicon packaging are not configured.

Windows (run on Windows):

```sh
npm run desktop:build -- --bundles nsis
```

Windows compilation and installation have not been verified on this Mac.

## Verify

```sh
npm test
cargo test --workspace --locked
npm run build
```

The optional native end-to-end harness and its isolation rules are described in `e2e/README.md`. Its WebDriver server is included only with the explicit `e2e` Cargo feature; do not use an E2E build for live family data.

## Current workflow

- Encrypted season files, automatic saves/backups, exclusive file locks, and optional OS keychain storage.
- CSV/XLSX import with the 2025 mapping profile, idempotent updates, field overrides, and proposed flags.
- Family review, address review, geocoding providers, Airtable integration, encrypted attachment storage and conversion.
- Building-aware routing, manual adjustments, locks, scenarios, estimated travel, and route validation.
- Letter cleanup and encrypted volunteer packets with merge conflict review.
- Team packets, pickup packets, manifests, letters, labels, navigation links, print snapshots, and replacement-page exports.
- Dispatch, outreach batches, change history, and post-season cleanup.

## Release limits

Passing local tests does not make this a production-approved release. The network integrations need a live contract check with public addresses and a dedicated test Airtable base. The custom routing heuristic is not the full ALNS/Rayon implementation described in the PRD; the standalone Rust solver is a baseline, while the desktop uses the TypeScript worker solver. PDFs currently use jsPDF instead of Typst, and unsupported emoji are removed. HEIC conversion depends on the webview's decoder. Signed distribution, Windows verification, full season-scale acceptance tests, and coordinator approval of physical printed packets remain release gates.

Detailed findings: `docs/PROBLEMS-AND-CHALLENGES.md`.

## Family data

Use synthetic fixtures for development and tests. Never copy the sibling `letters/` directory into this project or commit real sign-ups, attachments, exports, or season files. Encrypted season files do not encrypt exported PDF/CSV files; handle those separately. No real family records are bundled in the app.
