# Working on Operation Santa (agents)

Read `README.md` first. These rules keep agents' builds apart from the real app (`docs/ONBOARDING-AND-ENVIRONMENTS-PLAN.md` §2, kept locally).

## Two identities

| | Bundle ID | Name | Used by |
| --- | --- | --- | --- |
| **Dev** | `org.pasadenajaycees.opsanta.dev` | Operation Santa Dev (slate icon, hazard band, yellow ribbon in the window) | `npm run desktop`, `npm run desktop:dev-app`, `npm run e2e:build`, guide screenshots |
| **Production** | `org.pasadenajaycees.opsanta` | Operation Santa | `npm run release:mac`, `release:mas`, `release:windows` only |

The sandbox proof (`npm run e2e:sandbox`) uses its own `org.pasadenajaycees.opsanta.sandboxtest`.

## Rules

- **Build and run the Dev identity.** Never build the production identity except through a `release:*` script, and never with `--features e2e` (the release gate refuses both).
- **Never copy a build into `/Applications`**, and never `open -a "Operation Santa"`: that opens whatever Launch Services picks, which may be the coordinator's real install. Launch a build by its full path.
- **Never leave production-ID `.app` bundles lying around.** Apple's App Store can update a stray copy instead of installing to Applications (Apple Developer Forums 763399). If a release build left one under `target/`, unregister it: `lsregister -u <path>`.
- **Synthetic data only.** Never copy `../letters`, real sign-ups, exports or season files into this project or a test run.
- E2E runs get a fresh app data folder each time (`OPSANTA_DATA_DIR`, set by `e2e/wdio.conf.ts`, honored only in E2E builds). Don't point it at real app data.
- The E2E WebDriver server listens on `127.0.0.1:4445`, so only one E2E app can run at a time on a machine.
- Uploading to TestFlight (`release:mas -- --upload`), notarizing (`release:mac -- --notarize`) and publishing a GitHub Release send things to Apple or the public. Do them only when Hope has said to.
