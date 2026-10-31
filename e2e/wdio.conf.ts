import path from 'node:path';
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
 waitforTimeout:15000,
};
