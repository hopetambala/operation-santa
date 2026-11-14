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

Each spec file gets a fresh app: `wdio.conf.ts` stops the app after every spec file, and the Tauri service starts a new one.

- **`specs/journey.e2e.ts`**
  1. **Sign-ups → routes:**
     - Create an encrypted season and import a synthetic export shaped like 2025.
     - Geocode with mocked services. Fix the miss, move the out-of-area family to pickup, and accept the proposed flags.
     - Add teams, look at the one flagged letter, rebalance into 2 routes.
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
  - The volunteer edits, approves, flags and holds letters ("Don't print"), then saves.
  - The coordinator imports: 10 field changes merge, and 1 clash is resolved in the conflict dialog. Also checked: who cleaned each letter, and the change log.
- **`specs/airtable-export.e2e.ts`:** the usability test's success criterion at season size. A coordinator takes a 740-family Airtable export (`support/airtable-export.ts`: synthetic, seeded, with the 2025 form's columns and English and Spanish answers) from a fresh install to 45 printed route packets:
  - import, with expired drawing links, then a fresh re-export that downloads them
  - geocode, accept the proposed flags (only the real pickup answers become pickups), move the out-of-area families to pickup, and pin the misses
  - import 45 teams from a sheet, plan 45 routes, look at the letters the app flags, and print one PDF
  - Writes `airtable-export-740.csv`, `teams-45.csv` and `airtable-export-timings.json` to the run folder; the usability study uses the first two. Takes about 15–25 minutes.
- **`specs/airtable-sync.e2e.ts`:** paged Airtable read, refresh of an expired drawing link, and an idempotent re-sync.
- **`specs/season-security.e2e.ts`:** keychain "remember passphrase" with fallback, and the purge.
- **`specs/updates.e2e.ts`:** no "Check for updates" in a build without the updater (the Mac App Store build), and in builds with it: updates are offered, install only after "Install and restart", and pause Dec 20–26 (the updater plugin is mocked).
- **`specs/planning-and-pickup.e2e.ts`:** locked routes, freeze, and the pickup-event packet.

Shared setup lives in `support/season.ts` (`routedSeason()`), UI helpers in `support/app.ts`, and PDF reading in `support/pdf.ts`.

The network (Census, Nominatim, Airtable) and native dialogs are mocked at the IPC layer in `support/app.ts`. All test data is synthetic (`support/fixture.ts`). Never replace it with real 2025 records.

## The App Sandbox proof (macOS only)

```bash
npm run e2e:sandbox
```

The Mac App Store build runs in Apple's App Sandbox, which lets the app reach only its own container and the file a volunteer picked in an Open or Save panel. `e2e:sandbox` proves season files still work there, with no certificate or provisioning profile:

- It builds the E2E app as a `.app`, ad-hoc signed with `sandbox/Entitlements.sandbox-test.plist` under its own bundle ID (`org.pasadenajaycees.opsanta.sandboxtest`), so its container never mixes with a real install.
- Those entitlements must equal `Entitlements.mas.plist` minus the two keys that need a provisioning profile, plus `network.server` for the WebDriver port. The runner fails if they drift.
- The real Open and Save panels run in a separate system process and appear only when the app takes the screen's focus, so an unattended test can't use them. Instead, the build's copy of the entitlements gets one test-only exception for `e2e/.artifacts/sandbox-chosen/`, which stands in for the panel's grant, and the spec mocks only the two panels. Everything else runs under the real sandbox, **including the real login keychain**.
- `sandbox/season.sandbox.ts` creates a season in that folder and remembers its passphrase, saves a change, backs up, locks and reopens from the keychain. Nothing but the season file may appear in the folder, the working copy and backups must land in the container, and a copy of the season in any other folder must not open.
- The keychain entry is deleted at the end. The container stays at `~/Library/Containers/org.pasadenajaycees.opsanta.sandboxtest` as evidence.

The real panels are checked by hand on the first TestFlight build (`docs/RELEASE.md`). It needs no other E2E app on port 4445; the runner refuses to start otherwise.
