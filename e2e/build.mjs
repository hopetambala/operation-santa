// Cross-platform `npm run e2e:build` (Windows can't do `VITE_E2E=1 cmd`): a debug app with the WebDriver
// plugins (Cargo feature `e2e`), withGlobalTauri on, and the frontend built with VITE_E2E=1.
import {spawnSync} from 'node:child_process';
const r=spawnSync('npx',['tauri','build','--debug','--no-bundle','--features','e2e','--config','src-tauri/tauri.e2e.conf.json'],{cwd:'apps/desktop',stdio:'inherit',shell:process.platform==='win32',env:{...process.env,VITE_E2E:'1'}});
process.exit(r.status??1);
