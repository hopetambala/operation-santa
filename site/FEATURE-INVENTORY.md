# Feature inventory

Every screen, button, setting, file format and flow a person can use in the Operation Santa desktop app, as of 2026-11-04 (working tree on `main` after `bf1d50d`, including uncommitted changes from the parallel session). It's for maintainers: it's excluded from the public site build (see `_config.yml`).

**How it was built:** by reading `apps/desktop/src/*.tsx|ts` and `apps/desktop/src-tauri/src/main.rs`, then checking each flow against the E2E specs in `e2e/specs/` and the unit tests in `apps/desktop/src/model.test.ts` and `updates.test.ts`.

**Columns**
- **Code** is the file where the feature lives. Line numbers aren't given because most files are long single lines.
- **Who**: C = coordinator, RP = route planner, LC = letter cleaner, PL = print lead, TL = Santa team lead. Team leads never run the app; they use what it prints.
- **Evidence**: the E2E spec (`*.e2e.ts`) or unit test (`unit`) that exercises the flow. "none" means the flow has no automated test, only the source.
- **Guide** is the page under `site/` that covers it.

Features cut on 2026-10-30 aren't listed and aren't documented anywhere on the site: Dispatch, sweep route, scenarios, route split, next season, the post-season report, the Circuit export, the team-count sweep and Outreach. `scope.e2e.ts` guards them.

## 1. Install, update and the app shell

| Feature | Where in the app | Code | Who | Evidence | Guide |
|---|---|---|---|---|---|
| Install from the macOS DMG, TestFlight or the Windows installer | outside the app | `docs/RELEASE.md`, `.github/workflows/release.yml` | C, RP, LC, PL | none (release checklist is manual) | `start-here/install.md` |
| Update offer at launch: **Install and restart** / **Later** | banner under the page title | `main.tsx`, `updates.ts`, `main.rs` `restart_app` | C | `updates.e2e.ts`, unit | `start-here/install.md` |
| **Check for updates** | Settings ▸ "Your season, on your device" | `more.tsx`, `main.tsx` `checkUpdates` | C | `updates.e2e.ts` | `start-here/install.md` |
| Updates paused Dec 20–26 | automatic | `updates.ts` `updateWindowOpen` | everyone | unit | `start-here/install.md`, `christmas-eve/north-pole.md` |
| Demo season with fictional families on first launch | Overview banner, **New season** | `main.tsx`, `solver.ts` `demo`, `model.ts` `demoSeason` | everyone | `scope.e2e.ts` (runs on it) | `start-here/tour.md` |
| Top bar: tab icons, badges, bell (open tasks), save state, **Import families** / **Plan routes** shortcut, avatar menu | every page | `main.tsx` | everyone | `scope.e2e.ts` (tab names) | `start-here/tour.md` |
| Overview: stat cards, funnel, "Route overview", "Task list" | Overview | `main.tsx` | C | none | `start-here/tour.md` |
| "Leave a note for the next person" reason prompt (8 reasons, "other" needs text) | appears only for a change to a printed route | `main.tsx` `withReason`, `model.ts` `needsReason` | C, RP, LC | `planning-and-pickup.e2e.ts`, unit | `routing/late-changes.md`, `start-here/tour.md` |
| Error banner and toasts | every page | `main.tsx` | everyone | none | `reference/troubleshooting.md` |

## 2. Season files and passphrases

| Feature | Where in the app | Code | Who | Evidence | Guide |
|---|---|---|---|---|---|
| **Create new season**: passphrase (10+ characters), **Choose save location**, `.opsanta` file | avatar ▸ "Your season", or Settings ▸ **New encrypted season** | `main.tsx` `create`, `main.rs` `create_season` | C | `journey.e2e.ts` | `start-here/season-file.md` |
| **Save this demo as a season** | avatar menu (demo only) | `main.tsx` | C | none | `start-here/season-file.md` |
| **Open encrypted season** / **Open season file**, "Unlock your season", **Open season** | avatar menu, Settings | `main.tsx` `openSeason`/`unlock`, `main.rs` `open_season` | C | `journey.e2e.ts`, `season-security.e2e.ts` | `start-here/season-file.md` |
| "Remember on this computer (system keychain)" | create and unlock dialogs | `main.tsx`, `native.ts` `secretSet`, `main.rs` `secret_*` | C | `season-security.e2e.ts` | `start-here/season-file.md` |
| Wrong remembered passphrase falls back to asking | open | `main.tsx` | C | `season-security.e2e.ts` | `start-here/season-file.md` |
| Automatic save after every change ("Saving…" / "Encrypted · saved on this device") | top bar | `main.tsx` `update`, `main.rs` `save_season` | everyone | `journey.e2e.ts` | `start-here/season-file.md` |
| One file, one user: file locked while open | automatic | `main.rs` (flock on the file) | C | Rust tests | `start-here/season-file.md` |
| **Lock now**; auto-lock after 30 minutes idle | avatar menu; automatic | `main.tsx` `lock`, `main.rs` `close_season` | C | `journey.e2e.ts` (Lock now) | `start-here/season-file.md` |
| Encrypted backups: every 15 minutes, before imports, geocoding, rebalancing, packet merges and the purge; last 20 kept; **Create encrypted backup** | Settings; automatic | `main.tsx` `backup`, `main.rs` `backup_season` | C | `season-security.e2e.ts` (backup folder) | `start-here/season-file.md`, `reference/files.md` |
| Restore a backup (open the backup `.opsanta` file with the same passphrase) | outside the app, then **Open season file** | `main.rs` `backup_of`, `docs/RELEASE.md` | C | Rust test (restored backup wins) | `start-here/season-file.md` |
| Open a newer-version file: "created by a newer version" error | open | `main.rs` | C | none | `reference/troubleshooting.md` |

## 3. Sign-ups: import and Airtable sync

| Feature | Where in the app | Code | Who | Evidence | Guide |
|---|---|---|---|---|---|
| **Import families** (Airtable "Download CSV" `.csv`, or `.xlsx`) | top bar on Overview and Families | `main.tsx` `handleImport`, `importer.ts` `parseImport` | C | `journey.e2e.ts`, `airtable-export.e2e.ts`, unit | `sign-ups/import-csv.md` |
| 2025 form profile: Entry ID, address parts, up to 13 children, hardship (any year), poverty → "Rudolph Route", Spanish detection | import | `importer.ts` `parseRows` | C | unit, `airtable-export.e2e.ts` | `sign-ups/import-csv.md`, `reference/files.md` |
| "Review your import": new / changed / missing / uploads / proposed-flag counts, field-by-field diff, warnings (missing columns, unknown hardship answers, child-count mismatch), **Cancel import** / **Accept import** | modal | `main.tsx` | C | `journey.e2e.ts`, `airtable-export.e2e.ts` | `sign-ups/import-csv.md` |
| Re-import is safe: in-app edits win, missing families flagged not deleted, changed addresses re-geocoded | Accept import | `importer.ts` `mergeImport` | C | `airtable-sync.e2e.ts`, unit | `sign-ups/import-csv.md` |
| Uploads (drawings, PDFs, Word files) download right after import; Google Docs links marked "by hand" | automatic | `attachments.ts`, `main.rs` `fetch_attachment` | C | `airtable-export.e2e.ts` | `sign-ups/import-csv.md`, `sign-ups/letter-cleanup.md` |
| Expired upload links (HTTP 410): message says to download a fresh CSV and import again | Letter cleanup | `attachments.ts` | C | `airtable-export.e2e.ts` | `sign-ups/import-csv.md`, `reference/troubleshooting.md` |
| Airtable connection: personal access token, **Save token**, **Remove** (keychain only) | Settings ▸ "Airtable connection" | `more.tsx` | C | `airtable-sync.e2e.ts` (mocked keychain) | `sign-ups/airtable-sync.md` |
| Airtable base ID and table | Settings ▸ "Airtable (read-only)" | `more.tsx` | C | `airtable-sync.e2e.ts` | `sign-ups/airtable-sync.md` |
| **Sync Airtable**: paged read, same preview and merge as a CSV | Families toolbar | `main.tsx` `syncAirtable`, `importer.ts` `airtableImport`, `main.rs` `airtable_get` | C | `airtable-sync.e2e.ts` | `sign-ups/airtable-sync.md` |
| Expired drawing link refreshed through the Airtable record | automatic during downloads | `attachments.ts` `freshUrl` | C | `airtable-sync.e2e.ts` | `sign-ups/airtable-sync.md` |

## 4. Families

| Feature | Where in the app | Code | Who | Evidence | Guide |
|---|---|---|---|---|---|
| Search (name, address, email, Entry ID) | Families | `main.tsx` | C, RP | none | `sign-ups/families.md` |
| Filters: All families, Home delivery, Pickup, Special delivery, New, Verified, Not on a route, Proposed flags, Missing from latest import, Cancelled | Families | `main.tsx` | C, RP | none | `sign-ups/families.md` |
| Table columns and flag legend (SS, ET, AAF, DNSWV, "?" proposed) | Families | `main.tsx` | C, RP | none | `sign-ups/families.md` |
| Bulk edit: **Set status…**, **Set delivery…**, **Add flag…**, **Remove flag…**, **Clear** | Families, after ticking rows | `main.tsx` `bulk` | C | none | `sign-ups/families.md` |
| **Add family** (manual Entry IDs from 90001; never flagged missing) | Families | `main.tsx`, `model.ts` `nextManualId` | C | `scope.e2e.ts` (button present) | `sign-ups/families.md` |
| Family editor, Details tab: contact and address, Delivery, Status, Pickup RSVP, Rudolph Route, Hardship, Answer language, coordinates, "I verified this address…", flags, printed notes, coordinator notes, Route | click a row | `main.tsx` `FamilyModal` | C, RP | `journey.e2e.ts` (Save family) | `sign-ups/families.md` |
| Children & letters tab: child fields, Letter to Santa, **Add child**, **Remove child**, drawings | family editor | `main.tsx` | C, LC | none | `sign-ups/families.md` |
| History tab | family editor | `main.tsx` | C | none | `sign-ups/families.md`, `reference/change-log.md` |
| Edits become overrides that later imports keep | Save family | `main.tsx` `saveFamily` | C | `airtable-sync.e2e.ts`, unit | `sign-ups/families.md` |
| Cancel or move to pickup takes the family off its route | Save family | `main.tsx` `saveFamily` | C | unit | `sign-ups/families.md`, `routing/late-changes.md` |
| **Fallback CSV** (same file as MyRouteOnline CSV) | Families toolbar | `main.tsx`, `importer.ts` `fallbackCsv` | C | unit | `printing/myrouteonline-fallback.md` |

## 5. Address review

| Feature | Where in the app | Code | Who | Evidence | Guide |
|---|---|---|---|---|---|
| **Geocode N**: cache, then US Census batch, then OpenStreetMap; only street, city, state and ZIP are sent | Address review header | `review.tsx`, `geocode.ts`, `main.rs` `geocode_census`/`geocode_nominatim` | RP | `journey.e2e.ts`, `airtable-export.e2e.ts` | `sign-ups/address-review.md` |
| Addresses tab: queue, map, **Accept suggestion**, Latitude/Longitude, click map to drop a pin, **Edit address**, **Copy coordinates**, **Pin is right** | Address review | `review.tsx` | RP | `journey.e2e.ts`, `airtable-export.e2e.ts` | `sign-ups/address-review.md` |
| Duplicates tab: **Merge into #…**, **Cancel this one**, **Keep both (different families)** | Address review | `review.tsx`, `workflow.ts` `mergeFamilies` | C, RP | unit | `sign-ups/address-review.md` |
| Out of area tab: **Move to pickup**, **Special delivery**, **Include anyway** | Address review | `review.tsx`, `model.ts` `inArea` | C, RP | `journey.e2e.ts` (Move to pickup), unit | `sign-ups/address-review.md` |
| Proposed flags tab: from Jaycee Notes and the hardship answer; accept or dismiss each, **Accept all** | Address review | `review.tsx`, `importer.ts` `proposals` | C | `journey.e2e.ts`, unit | `sign-ups/address-review.md` |
| Service area (cities + buffer miles) | Settings ▸ "Service area" | `more.tsx`, `model.ts` | C | unit | `sign-ups/address-review.md`, `reference/settings.md` |

## 6. Teams

| Feature | Where in the app | Code | Who | Evidence | Guide |
|---|---|---|---|---|---|
| **Add team**; "Santa team" editor: Team name, Team lead, Lead phone, Seats in the car, Notes, "Spanish-speaking team member", **Save team**, **Remove team** | Teams | `planner.tsx` `Teams` | C | `journey.e2e.ts` | `routing/teams.md` |
| **Import CSV** (Team, Lead, Phone, Spanish, Seats, Notes; `.csv` or `.xlsx`; updates teams with the same name) | Teams | `planner.tsx` `importTeams` | C | none | `routing/teams.md`, `reference/files.md` |
| **Export CSV** (`Operation Santa teams.csv`, includes each team's route) | Teams | `planner.tsx` | C | none | `routing/teams.md`, `reference/files.md` |
| Assign a team to a route (shows "(also Route N)" and "ES") | Route planner ▸ route detail ▸ Team | `planner.tsx` | C, RP | `journey.e2e.ts` | `routing/teams.md`, `routing/route-planner.md` |

## 7. Route planner

| Feature | Where in the app | Code | Who | Evidence | Guide |
|---|---|---|---|---|---|
| Teams count and Fleet: **Fixed count** / **Fewest that fit** | planner controls | `planner.tsx`, `solver.ts` | RP | `airtable-export.e2e.ts`, unit | `routing/route-planner.md` |
| Read-outs: TARGET · LIMIT, LONGEST · SPREAD, UNROUTED, "Estimated travel" | planner controls | `planner.tsx` | RP | `airtable-export.e2e.ts` | `routing/route-planner.md` |
| **Rebalance unlocked** (keeps locked and special routes, pinned families, route numbers and teams) | planner | `planner.tsx` `rebalance`, `solver.ts`, `solver.worker.ts` | RP | `journey.e2e.ts`, `planning-and-pickup.e2e.ts`, unit | `routing/route-planner.md` |
| "Families don't fit" note and spread warning | planner | `planner.tsx`, `model.ts` `seasonWarnings` | RP | `airtable-export.e2e.ts` | `routing/route-planner.md` |
| Route list cards (stops, children, miles, duration bar, team, finish) | planner | `planner.tsx` | RP | none | `routing/route-planner.md` |
| Route detail: map, stop list with ETAs, Start time | planner | `planner.tsx` | RP | `journey.e2e.ts` | `routing/route-planner.md` |
| Move a stop earlier/later (whole building moves together) | stop arrows | `planner.tsx`, `model.ts` `shiftStop` | RP | unit | `routing/route-planner.md` |
| Move a stop to another route / **Remove from route** | stop's route menu | `planner.tsx`, `model.ts` `moveGroup`/`removeStop` | RP | unit | `routing/route-planner.md` |
| Pin a family to its route | stop pin icon | `planner.tsx` | RP | unit | `routing/route-planner.md` |
| **Re-sequence** one route | route detail | `planner.tsx`, `solver.ts` `resequence` | RP | unit | `routing/route-planner.md` |
| **Lock** / **Unlock** a route | route detail | `planner.tsx` | RP | `planning-and-pickup.e2e.ts`, unit | `routing/route-planner.md` |
| **Delete** an empty route | route detail | `planner.tsx` | RP | none | `routing/route-planner.md` |
| **Special route** ("New special route", **Create route**) | planner | `planner.tsx` | RP | unit (special routes kept) | `routing/route-planner.md` |
| Unrouted table: **Add to route** ("Choose…"), out-of-area guard | planner, below the routes | `planner.tsx` | RP | none | `routing/route-planner.md`, `routing/late-changes.md` |
| **Insert new families** (cheapest fit into unlocked routes; suggests adding a team) | planner | `planner.tsx`, `solver.ts` `insertNew` | RP | unit | `routing/late-changes.md` |
| **Freeze plan** / **Unfreeze plan** | planner controls | `planner.tsx` | C | `planning-and-pickup.e2e.ts` | `routing/late-changes.md` |

## 8. Letter cleanup and cleanup packets

| Feature | Where in the app | Code | Who | Evidence | Guide |
|---|---|---|---|---|---|
| Upload counters, **Download uploads**, **Retry failed** | Letter cleanup header | `cleanup.tsx`, `attachments.ts` | C, LC | `airtable-export.e2e.ts` | `sign-ups/letter-cleanup.md` |
| Conversion of uploads: photos to JPEG, PDFs to page images (first 4 pages), Word text appended to the letter; HEIC may fail | automatic | `attachments.ts` | C | unit (Word text) | `sign-ups/letter-cleanup.md` |
| Per-upload **Retry** and **Skip upload (print placeholder)** | letter view | `cleanup.tsx` | C, LC | none | `sign-ups/letter-cleanup.md` |
| Tabs: Needs review, Uploads to check, Approved, Held, All letters | Letter cleanup | `cleanup.tsx` | LC | `cleanup-packets.e2e.ts` | `sign-ups/letter-cleanup.md` |
| Letter view: original, gift wishes, uploads; "Cleaned letter" box; warnings (contact details, too long, empty); **Previous**, **Next letter**, **Flag**, **Hold from print**, **Approve** | Letter cleanup | `cleanup.tsx`, `model.ts` `letterChecks` | LC | `journey.e2e.ts`, `cleanup-packets.e2e.ts`, `airtable-export.e2e.ts` | `sign-ups/letter-cleanup.md` |
| **Cleanup packet** export: From/To Entry ID, Only route, passphrase, **Choose where to save** (`.opsanta-packet`) | Letter cleanup | `cleanup.tsx`, `workflow.ts` `buildPacket`, `main.rs` `export_packet` | C | `cleanup-packets.e2e.ts` | `sign-ups/cleanup-packets.md` |
| **Open a cleanup packet** (packet mode, only those families) | avatar menu or Settings | `main.tsx` `openPacket`, `main.rs` `open_packet` | LC | `cleanup-packets.e2e.ts` | `sign-ups/cleanup-packets.md` |
| **Save edited packet** (`Cleaned by <name>.opsanta-packet`) | Letter cleanup in packet mode | `cleanup.tsx` | LC | `cleanup-packets.e2e.ts` | `sign-ups/cleanup-packets.md` |
| **Import returned packet**: field-by-field merge; conflicts dialog **Keep mine** / **Take theirs** | Letter cleanup | `cleanup.tsx`, `workflow.ts` `mergePacket` | C | `cleanup-packets.e2e.ts`, unit | `sign-ups/cleanup-packets.md` |
| Display name used on cleaned letters and packets | Settings ▸ "Your display name" | `more.tsx` | LC, C | `cleanup-packets.e2e.ts` | `sign-ups/cleanup-packets.md`, `reference/settings.md` |

## 9. Print center

| Feature | Where in the app | Code | Who | Evidence | Guide |
|---|---|---|---|---|---|
| "Check before printing": blocking problems and warnings, **Show details** | Print center | `printcenter.tsx`, `printing.ts` `printCheck`, `model.ts` `checks` | PL | `airtable-export.e2e.ts`, unit | `printing/print-center.md` |
| **All routes, one PDF** / **One PDF per route** / **Export PDF** (one route) | Print center | `printcenter.tsx`, `printing.ts` | PL | `airtable-export.e2e.ts`, `journey.e2e.ts` | `printing/print-center.md` |
| Duplex ("each family starts on a new sheet") | Print center banner | `printcenter.tsx`, `printing.ts` `pad` | PL | none | `printing/print-center.md` |
| Team packet contents: cover with map and QR codes, route sheet, packing manifest, letters in stop order, bag labels; version stamp and shred footer | the PDF | `printing.ts` | PL, TL | `journey.e2e.ts`, unit | `printing/print-center.md`, `christmas-eve/team-lead.md` |
| Print state per route: Not printed / Up to date / Needs reprint; **Review** | Print center cards | `printcenter.tsx`, `model.ts` `printState` | PL | `journey.e2e.ts`, unit | `printing/reprints.md` |
| **Phone links** (Google Maps legs, addresses only), **Copy** | Print center cards | `printcenter.tsx`, `printing.ts` `navigationText` | PL, TL | `scope.e2e.ts` (present), unit | `printing/print-center.md`, `christmas-eve/team-lead.md` |
| Labels: Avery 5163 or 5160, **Start at slot**, "Street address on labels" | Print center | `printcenter.tsx`, `printing.ts` `labels` | PL | `journey.e2e.ts` (5163 geometry) | `printing/labels.md` |
| **Alignment test page** | Print center | `printing.ts` `labelTest` | PL | none | `printing/labels.md` |
| **Needs reprint (N)** (one PDF of the stale packets) | Print center | `printcenter.tsx` | PL | none | `printing/reprints.md` |
| **Replacement pages** (sheet, manifest, labels and only changed letters) | Print center | `printing.ts` `replacement` | PL | `journey.e2e.ts`, unit | `printing/reprints.md` |
| "Call these teams" with **Copy call list** | Print center | `printcenter.tsx` `diffText` | C, PL | none | `printing/reprints.md` |
| **Pickup event packet (N)**: check-in sheet, letters, labels | Print center ▸ "Other printouts and exports" | `printing.ts` `pickupPacket` | C, PL | `planning-and-pickup.e2e.ts` | `printing/pickup-event.md` |
| **Coordinator holds (N)** | Print center ▸ "Other printouts and exports" | `printing.ts` `letterProof` | C | none | `printing/pickup-event.md`, `sign-ups/letter-cleanup.md` |
| **MyRouteOnline CSV** (Entry ID + address, home families only) | Print center ▸ "Other printouts and exports" | `importer.ts` `fallbackCsv` | C, RP | `scope.e2e.ts` (present), unit | `printing/myrouteonline-fallback.md` |

## 10. Change log, Settings and the purge

| Feature | Where in the app | Code | Who | Evidence | Guide |
|---|---|---|---|---|---|
| Change log: search, newest 500, before/after, reason ("Before printing" when none) | Change log | `more.tsx` `ChangeLog`, `model.ts` `audit` | C | none | `reference/change-log.md` |
| Change log **Export CSV** | Change log | `more.tsx` | C | none | `reference/change-log.md` |
| Settings: Season, North Pole and delivery window, Service time model, Service area, Printing, Airtable; **Save settings** with validation | Settings | `more.tsx` | C | `airtable-sync.e2e.ts`, `cleanup-packets.e2e.ts` | `reference/settings.md` |
| **Purge sensitive records**: type PURGE CHILD DATA, **Purge now**; deletes backups; Jan 31 reminder | Settings ▸ "After the season" | `main.tsx`, `workflow.ts` `purge`, `main.rs` `vacuum_season`/`purge_backups` | C | `season-security.e2e.ts`, unit | `after-the-season/purge.md` |

## 11. In the code but with no guide

| Item | Why there's no guide |
|---|---|
| `travel_matrix_ors` (OpenRouteService road times) and the `ors_key` secret in `main.rs` | No screen calls it. Travel is estimated from straight-line distance × "Road distance multiplier" at "Estimated speed". |
| Browser preview (`npm run dev`) | Developer tool with synthetic data only. Covered by the repo README. |
| E2E build (`e2e` Cargo feature) | Must never reach volunteers. Covered by `e2e/README.md`. |
| ~~Family statuses "delivered" and "missed"~~ | Removed (Nov 5): older season files turn them back into routed or verified. |
| Overview funnel (Imported → Verified → Geocoded → Routed) | Described in one line in the tour. The 2026-10-30 audit called it "not grounded"; it's still in the app. See open questions. |
| `asset_*`, `vacuum_season`, `write_export` and other internal commands | No direct user action; they run behind the features above. |
