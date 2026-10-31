# End-to-end tests

These tests drive the **real desktop app**: the Rust backend, the encrypted season file and the macOS WKWebView. They run through WebdriverIO's Tauri service with its embedded WebDriver server. Plain `tauri-driver` can't drive the macOS webview; see `docs/PROBLEMS-AND-CHALLENGES.md` A1.

```bash
npm run e2e:build
```

```bash
npm run e2e
```

- `e2e:build` makes a debug app with the WebDriver plugins (Cargo feature `e2e`), `withGlobalTauri` turned on and the frontend built with `VITE_E2E=1`. Normal `tauri dev` and release builds include none of this.
- Each run writes evidence to `e2e/.artifacts/<timestamp>/` (gitignored):
  - the encrypted season file
  - every exported PDF
  - screenshots
  - the input CSV
  - `routes.json`
- Keep the Mac awake while it runs (for example `caffeinate -d npm run e2e`); see problems doc A5.

## What the specs cover

Each spec file launches a fresh app.

- **`specs/journey.e2e.ts`**
  1. **Sign-ups → routes:**
     - Create an encrypted season and import a synthetic export shaped like 2025.
     - Geocode with mocked services. Fix the miss, move the out-of-area family to pickup, and accept the proposed flags.
     - Add teams, approve the letters, rebalance into 2 routes.
     - Lock and reopen the file, and check the routes come back.
  2. **Sign-ups + routes → letters and labels:**
     - Check before printing, then export one PDF of all routes.
     - Letters print in route and stop order, in the 2025 template's field order.
     - Drawings appear; no placeholders and no raw links.
     - Labels match the Avery 5163 geometry.
  3. **Team packet:**
     - Cover, route sheet, manifest, letters and labels in that order, stamped on every page.
     - After a late change: a reason is required, the call list updates, and only the changed pages reprint.
- **`specs/cleanup-packets.e2e.ts`**
  - Export an encrypted packet for Entry IDs 26001–26005; the coordinator keeps editing one of those letters.
  - A volunteer opens the packet: only those families, drawings included.
  - The volunteer approves, edits, flags and holds letters, then saves.
  - The coordinator imports: 10 field changes merge, and 1 clash is resolved in the conflict dialog. Also checked: who cleaned each letter, and the change log.
- **`specs/airtable-sync.e2e.ts`:** paged Airtable read, refresh of an expired drawing link, and an idempotent re-sync.
- **`specs/season-security.e2e.ts`:** keychain "remember passphrase" with fallback, and the purge.
- **`specs/updates.e2e.ts`:** updates are offered, install only after "Install and restart", and pause Dec 20–26 (the updater plugin is mocked).
- **`specs/planning-and-pickup.e2e.ts`:** locked routes, freeze, and the pickup-event packet.

Shared setup lives in `support/season.ts` (`routedSeason()`), UI helpers in `support/app.ts`, and PDF reading in `support/pdf.ts`.

The network (Census, Nominatim, Airtable) and native dialogs are mocked at the IPC layer in `support/app.ts`. All test data is synthetic (`support/fixture.ts`). Never replace it with real 2025 records.
