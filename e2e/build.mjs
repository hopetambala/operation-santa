// Cross-platform `npm run e2e:build` (Windows can't do `VITE_E2E=1 cmd`): a debug app with the WebDriver
// plugins (Cargo feature `e2e`), withGlobalTauri on, and the frontend built with VITE_E2E=1.
// `shell: true` is only so Windows can find npx.cmd. Node then joins the arguments without
// quoting them, so a path with a space would be split. These arguments have none today;
// quoteCmdArg leaves them unchanged and quotes them if one is added.
import {spawnSync} from 'node:child_process';
import {quoteCmdArg} from '../scripts/release-common.mjs';
const win=process.platform==='win32';
const args=['tauri','build','--debug','--no-bundle','--features','e2e','--config','src-tauri/tauri.e2e.conf.json'];
const r=spawnSync(win?quoteCmdArg('npx'):'npx',win?args.map(quoteCmdArg):args,{cwd:'apps/desktop',stdio:'inherit',shell:win,env:{...process.env,VITE_E2E:'1'}});
process.exit(r.status??1);
