import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
// Real-app E2E: drives the debug Tauri binary through WebdriverIO's embedded WebDriver server.
// On macOS this is the only WebDriver path into WKWebView; tauri-driver covers Windows/Linux only.
// Build first with `npm run e2e:build` (bundles the frontend with VITE_E2E=1 and withGlobalTauri on).
const root=path.resolve(import.meta.dirname,'..');
// OPSANTA_E2E_APP points at another build of the E2E app: npm run e2e:sandbox uses its sandboxed .app.
const app=process.env.OPSANTA_E2E_APP??path.join(root,'target','debug',process.platform==='win32'?'opsanta.exe':'opsanta');
// The app inherits this and writes any panic there (main.rs `record_panics`); CI uploads e2e/.artifacts.
process.env.OPSANTA_E2E_LOG=path.join(root,'e2e','.artifacts','app-panics.log');
export const config:WebdriverIO.Config={
 runner:'local',
 specs:['./specs/**/*.e2e.ts'],
 maxInstances:1,
 capabilities:[{browserName:'tauri','tauri:options':{application:app}} as WebdriverIO.Capabilities],
 services:[['tauri',{appBinaryPath:app,driverProvider:'embedded',captureFrontendLogs:true,captureBackendLogs:true,logDir:path.join(root,'e2e','.artifacts','logs')}]],
 framework:'mocha',
 mochaOpts:{ui:'bdd',timeout:10*60*1000,bail:true},
 reporters:['spec'],
 logLevel:'warn',
 // A13: the service's per-command focus recovery never matches this app (the window is titled "Operation Santa", the page
 // "Operation Santa · Route planner"), so before every element lookup it ran about ten scripts in the app: window states,
 // a sync of each of the nine mocks, and a window switch that fails. On Windows the embedded WebDriver plugin can corrupt
 // the app's heap while it runs scripts (webdriverio/desktop-mobile#1079, #1095), and with that traffic the app crashed
 // mid-spec in most Windows runs: 14 crash dumps in 9 suites, against 0 in 21 suites with this switch. Choosing the one
 // window explicitly turns the recovery off. Mocks still sync after every click, setValue and browser.tauri.execute.
 // beforeSuite, not before: the config's before runs ahead of the service's, which is what adds browser.tauri.
 async beforeSuite(){await browser.tauri.switchWindow('main');},
 // The plugin bug is upstream and still possible at the lower traffic, so a Windows spec file gets one retry, in a fresh
 // app. CI's exit-code log (e2e/watch-app-exits.ps1) still flags any crash the retry hides.
 specFileRetries:process.platform==='win32'?1:0,
 // The Tauri service starts the app once and only replaces it if it dies, so spec files would share one app and its
 // state. Stop it after each spec file; the service sees the port closed and starts a fresh app for the next one.
 async onWorkerEnd(){stopApp();for(let i=0;i<60&&await appListening();i++)await sleep(250);},
 waitforTimeout:15000,
};
// Only this build of the app, matched by its full path, so an installed copy of Operation Santa keeps running.
function stopApp(){if(process.platform==='win32')spawnSync('powershell',['-NoProfile','-Command',`Get-Process opsanta -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${app.replace(/'/g,"''")}' } | Stop-Process -Force`]);else spawnSync('pkill',['-f',`^${app.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`]);}
async function appListening(){try{return (await fetch('http://127.0.0.1:4445/status',{signal:AbortSignal.timeout(1000)})).ok}catch{return false}}
