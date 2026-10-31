import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
// Real-app E2E: drives the debug Tauri binary through WebdriverIO's embedded WebDriver server.
// On macOS this is the only WebDriver path into WKWebView; tauri-driver covers Windows/Linux only.
// Build first with `npm run e2e:build` (bundles the frontend with VITE_E2E=1 and withGlobalTauri on).
const root=path.resolve(import.meta.dirname,'..');
const app=path.join(root,'target','debug',process.platform==='win32'?'opsanta.exe':'opsanta');
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
 // The Tauri service starts the app once and only replaces it if it dies, so spec files would share one app and its
 // state. Stop it after each spec file; the service sees the port closed and starts a fresh app for the next one.
 async onWorkerEnd(){stopApp();for(let i=0;i<60&&await appListening();i++)await sleep(250);},
 waitforTimeout:15000,
};
// Only this build of the app, matched by its full path, so an installed copy of Operation Santa keeps running.
function stopApp(){if(process.platform==='win32')spawnSync('powershell',['-NoProfile','-Command',`Get-Process opsanta -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${app.replace(/'/g,"''")}' } | Stop-Process -Force`]);else spawnSync('pkill',['-f',`^${app.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`]);}
async function appListening(){try{return (await fetch('http://127.0.0.1:4445/status',{signal:AbortSignal.timeout(1000)})).ok}catch{return false}}
