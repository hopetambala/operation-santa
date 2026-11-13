// Cross-platform `npm run e2e:build` (Windows can't do `VITE_E2E=1 cmd`): a debug app with the WebDriver
// plugins (Cargo feature `e2e`), withGlobalTauri on, and the frontend built with VITE_E2E=1.
// spawnCmd goes through cmd on Windows so npx.cmd is found, and quotes the line so an argument with a
// space would stay whole. These arguments have none today.
import {spawnCmd} from '../scripts/release-common.mjs';
const r=spawnCmd('npx',['tauri','build','--debug','--no-bundle','--features','e2e','--config','src-tauri/tauri.e2e.conf.json'],{cwd:'apps/desktop',stdio:'inherit',env:{...process.env,VITE_E2E:'1'}});
process.exit(r.status??1);
