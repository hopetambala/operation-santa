// npm run e2e:sandbox: proves season files work with the Mac App Store sandbox on (docs/RELEASE.md § Season files
// under the sandbox). Builds the E2E debug app as a sandboxed, ad-hoc-signed .app, then runs season.sandbox.ts.
// It signs with no certificate, sends nothing anywhere, and never types or clicks outside the app's webview.
//
// - Its own bundle id, so its sandbox container never mixes with the real app's (or a later App Store build's).
// - Entitlements.sandbox-test.plist must stay Entitlements.mas.plist minus the keys that need a provisioning profile,
//   plus network.server for the WebDriver port. This script checks that, so the proof can't drift from the store build.
// - In the store build a volunteer's file is reachable because they picked it in the Open or Save panel. Those panels
//   run in a separate system process and only appear when the app takes the screen's focus, so an unattended test can't
//   use them. This build instead gets one test-only exception for e2e/.artifacts/sandbox-chosen/, added to its copy of
//   the entitlements at build time. Everything else, the keychain included, runs under the real sandbox. The real panels
//   are checked by hand on the TestFlight build (docs/RELEASE.md).
// Needs macOS and no other E2E app on port 4445.
import {spawnSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ROOT,DESKTOP,TAURI_DIR,TARGET,fail,capture,merge} from '../../scripts/release-common.mjs';

export const SANDBOX_ID='org.pasadenajaycees.opsanta.sandboxtest';
const TEST_ENTITLEMENTS=join(ROOT,'e2e','sandbox','Entitlements.sandbox-test.plist');
const PROFILE_ONLY=['com.apple.application-identifier','com.apple.developer.team-identifier'];
const CHOSEN_KEY='com.apple.security.temporary-exception.files.absolute-path.read-write';
const CHOSEN=join(ROOT,'e2e','.artifacts','sandbox-chosen');
const TEST_ONLY=['com.apple.security.network.server'];

/** JSON → plist XML through plutil (stdin), for the generated entitlements. */
const plistXml=obj=>{const r=spawnSync('plutil',['-convert','xml1','-o','-','-'],{input:JSON.stringify(obj),encoding:'utf8'});if(r.status!==0)fail('plutil could not write the test entitlements');return r.stdout};
const plist=file=>{const r=capture('plutil',['-convert','json','-o','-',file]);if(!r.ok)fail(`${file} is not a readable plist`);return JSON.parse(r.out)};
/** Problems if the test entitlements differ from the store's by anything but the expected keys. */
export function entitlementDrift(store,test){
  const problems=[];
  for(const [k,v] of Object.entries(store))if(!PROFILE_ONLY.includes(k)&&JSON.stringify(test[k])!==JSON.stringify(v))problems.push(`${k} is ${JSON.stringify(v)} in Entitlements.mas.plist but ${JSON.stringify(test[k])} in the test entitlements`);
  for(const k of Object.keys(test))if(!(k in store)&&!TEST_ONLY.includes(k))problems.push(`${k} is only in the test entitlements`);
  for(const k of PROFILE_ONLY)if(k in test)problems.push(`${k} needs a provisioning profile; an ad-hoc build that claims it will not launch`);
  return problems;
}

if(process.argv[1]===import.meta.filename){
  if(process.platform!=='darwin')fail('The sandbox proof runs on a Mac.');
  // Every E2E app's WebDriver server listens on 127.0.0.1:4445. If another one is up (another checkout's npm run e2e),
  // WebdriverIO would drive that app instead of this one.
  if(spawnSync('lsof',['-nP','-iTCP:4445','-sTCP:LISTEN']).status===0)fail('Another E2E app is listening on 127.0.0.1:4445. Wait for that run to finish, then try again.');
  const drift=entitlementDrift(plist(join(TAURI_DIR,'Entitlements.mas.plist')),plist(TEST_ENTITLEMENTS));
  if(drift.length)fail(`Entitlements.sandbox-test.plist no longer matches Entitlements.mas.plist:\n  - ${drift.join('\n  - ')}`);

  // The one folder this build may use outside its container, standing in for the file a volunteer picks in the Open or
  // Save panel. Added only to this build's copy of the entitlements (see the header).
  mkdirSync(CHOSEN,{recursive:true});
  const tmp=mkdtempSync(join(tmpdir(),'opsanta-sandbox-'));
  const entitlements=join(tmp,'Entitlements.sandbox-run.plist');
  writeFileSync(entitlements,plistXml({...plist(TEST_ENTITLEMENTS),[CHOSEN_KEY]:[`${CHOSEN}/`]}));
  const e2e=JSON.parse(readFileSync(join(TAURI_DIR,'tauri.e2e.conf.json'),'utf8'));
  const config=merge(e2e,{identifier:SANDBOX_ID,bundle:{macOS:{signingIdentity:'-',hardenedRuntime:true,entitlements}}});
  const file=join(tmp,'tauri.sandbox.conf.json');
  writeFileSync(file,JSON.stringify(config));
  // Tauri's own signing and notarization variables are dropped: this build is ad-hoc signed and never leaves the Mac.
  const env={...process.env,VITE_E2E:'1'};
  for(const k of Object.keys(env))if(/^APPLE_/.test(k))delete env[k];
  const b=spawnSync('npx',['tauri','build','--debug','--features','e2e','--bundles','app','--config',file],{cwd:DESKTOP,stdio:'inherit',env});
  if(b.status!==0)fail('The sandboxed E2E build failed.');

  const app=join(TARGET,'debug','bundle','macos','Operation Santa.app');
  const exe=join(app,'Contents','MacOS','opsanta');
  if(!existsSync(exe))fail(`${exe} was not produced`);
  const ents=capture('codesign',['-d','--entitlements','-','--xml',app]).out;
  if(!ents.includes('com.apple.security.app-sandbox'))fail(`${app} is not sandboxed`);
  console.log(`✓ Sandboxed, ad-hoc signed: ${app}`);

  if(!ents.includes(CHOSEN_KEY))fail(`${app} lacks the test folder exception`);
  const t=spawnSync('npx',['wdio','run','e2e/wdio.conf.ts','--spec','e2e/sandbox/season.sandbox.ts'],{cwd:ROOT,stdio:'inherit',env:{...process.env,OPSANTA_E2E_APP:exe,OPSANTA_SANDBOX_ID:SANDBOX_ID,OPSANTA_SANDBOX_CHOSEN:CHOSEN}});
  process.exit(t.status??1);
}
