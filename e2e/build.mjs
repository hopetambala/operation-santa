// Cross-platform `npm run e2e:build` (Windows can't do `VITE_E2E=1 cmd`): a debug app with the WebDriver
// plugins (Cargo feature `e2e`), withGlobalTauri on, and the frontend built with VITE_E2E=1.
// spawnCmd goes through cmd on Windows so npx.cmd is found, and quotes the line so an argument with a
// space would stay whole. These arguments have none today.
//
// The E2E app is always the Dev identity (tauri.dev.conf.json: "Operation Santa Dev", its own bundle ID, icon,
// app data and keychain service), so a test run can never touch a real install's files or be mistaken for it by
// Launch Services (docs: ONBOARDING-AND-ENVIRONMENTS-PLAN.md §2). This refuses to build with the production ID.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {spawnCmd,TAURI_DIR,PRODUCTION_ID} from '../scripts/release-common.mjs';
const dev=JSON.parse(readFileSync(join(TAURI_DIR,'tauri.dev.conf.json'),'utf8'));
if(!dev.identifier||dev.identifier===PRODUCTION_ID){console.error(`✗ tauri.dev.conf.json must give the E2E app its own identifier, not ${PRODUCTION_ID}.`);process.exit(1);}
const r=spawnCmd('npx',['tauri','build','--debug','--no-bundle','--features','e2e','--config','src-tauri/tauri.dev.conf.json','--config','src-tauri/tauri.e2e.conf.json'],{cwd:'apps/desktop',stdio:'inherit',env:{...process.env,VITE_E2E:'1'}});
process.exit(r.status??1);
