import {browser,$} from '@wdio/globals';
import assert from 'node:assert/strict';
import {copyFileSync,existsSync,readFileSync,readdirSync,rmSync,statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import path from 'node:path';
import {RUN_DIR,shot,click,fill,nav,toast,noError,dialogText} from '../support/app';
// Season files with the Mac App Store sandbox on (docs/RELEASE.md § Season files under the sandbox). Run by
// `npm run e2e:sandbox`, which builds a sandboxed, ad-hoc-signed copy of the E2E app under its own bundle id.
// Synthetic data only. Unlike the other specs, the keychain is real: whether it works under the sandbox is the question.
// Only the Open and Save panels are mocked. They answer with a path in CHOSEN, the one folder this test build may use
// outside its container (the stand-in for a panel's grant; see run.mjs).
const ID=process.env.OPSANTA_SANDBOX_ID!;
const EXE=process.env.OPSANTA_E2E_APP!;
const CHOSEN=process.env.OPSANTA_SANDBOX_CHOSEN!;
const CONTAINER=path.join(homedir(),'Library','Containers',ID);
const SEASONS=path.join(CONTAINER,'Data','Library','Application Support',ID,'seasons');
const NAME='Sandbox Proof.opsanta';
const SEASON=path.join(CHOSEN,NAME);
const STRAY=path.join(RUN_DIR,'Outside the chosen folder.opsanta');
const PASS='sandbox synthetic passphrase';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const pathKey=(p:string)=>{const h=sha(p);return `passphrase:${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`};// native.ts pathKey
const listing=(dir:string)=>existsSync(dir)?readdirSync(dir).filter(f=>f!=='.DS_Store').sort():[];
// The app's own commands, called the way the frontend calls them.
const call=(cmd:string,args:Record<string,unknown>)=>browser.execute(async(c:string,a:Record<string,unknown>)=>{try{const v=await (window as unknown as {__TAURI__:{core:{invoke:(c:string,a:unknown)=>Promise<unknown>}}}).__TAURI__.core.invoke(c,a);return `ok ${JSON.stringify(v)}`}catch(e){return `error: ${String(e)}`}},cmd,args);
describe('Season files in the App Sandbox (Mac App Store build)',()=>{
 let created='';const started=Date.now();
 before(async()=>{
  assert.ok(ID&&CHOSEN,'run through npm run e2e:sandbox');
  for(const f of listing(CHOSEN))rmSync(path.join(CHOSEN,f),{recursive:true,force:true});
  await $('h1').waitForDisplayed({timeout:60000});
  const save=await browser.tauri.mock('plugin:dialog|save');await save.mockReturnValue(SEASON);
  const open=await browser.tauri.mock('plugin:dialog|open');await open.mockImplementation(()=>(window as unknown as {__opens:string[]}).__opens.shift()??null);
  await browser.execute(()=>{(window as unknown as {__opens:string[]}).__opens=[]});
 });
 const queueOpen=(p:string)=>browser.execute((f:string)=>{(window as unknown as {__opens:string[]}).__opens.push(f)},p);
 it('runs sandboxed: the binary carries the sandbox entitlement',()=>{const e=spawnSync('codesign',['-d','--entitlements','-','--xml',EXE],{encoding:'utf8'});assert.match(`${e.stdout}${e.stderr}`,/com\.apple\.security\.app-sandbox/,`${EXE} is not sandboxed`);});
 it('creates the season in the chosen folder and remembers the passphrase in the keychain',async()=>{
  await $('button.avatar').click();await click('Create new season');await dialogText('Start a new season');
  await $('[role="dialog"] input[type=password]').setValue(PASS);
  await $('//label[contains(.,"Remember on this computer")]/input').click();
  await click('Choose save location');
  await toast(/Encrypted season created/);await noError();await shot('sandbox-created');
  assert.deepEqual(listing(CHOSEN),[NAME]);
  // Written during this run, so a container left by an earlier run can't pass for this one. The 2 s slack covers
  // file systems that store modification times coarsely.
  const work=path.join(SEASONS,`${sha(SEASON)}.opsanta`);
  assert.ok(existsSync(work)&&statSync(work).mtimeMs>=started-2000,`this run's working copy should be in the sandbox container: ${work}`);
  assert.equal(await call('secret_get',{name:pathKey(SEASON)}),`ok ${JSON.stringify(PASS)}`,'the keychain did not keep the passphrase under the sandbox');
  created=sha(readFileSync(SEASON));
 });
 it('saves a change into the chosen file, and nothing beside it',async()=>{
  await nav('Teams');await click('Add team');await dialogText('Santa team');await fill('Team name','Team Sandbox');await fill('Team lead','Sam Sandbox');await fill('Lead phone','(626) 555-0199');await click('Save team');await $('[role="dialog"]').waitForExist({reverse:true});
  await browser.waitUntil(async()=>/saved on this device/.test(await $('.save-state').getText()),{timeoutMsg:'the change was not saved'});await noError();
  assert.notEqual(sha(readFileSync(SEASON)),created,'the season file did not change after a save');
  assert.deepEqual(listing(CHOSEN),[NAME],'saving left something beside the season file (a WAL, lock or backup)');
 });
 it('backs up into the container',async()=>{
  await nav('Settings');await click('Create encrypted backup');await toast(/Encrypted backup saved/);await noError();
  const dir=path.join(SEASONS,'backups',sha(SEASON));const fresh=listing(dir).filter(f=>statSync(path.join(dir,f)).mtimeMs>=started-2000);assert.equal(fresh.length,1,`one new backup expected in ${dir}, found ${fresh}`);
  assert.deepEqual(listing(CHOSEN),[NAME]);
 });
 it('locks, then reopens with the passphrase from the keychain and finds the change',async()=>{
  await $('button.avatar').click();await click('Lock now');await toast(/Season locked/);
  await queueOpen(SEASON);await $('button.avatar').click();await click('Open encrypted season');
  // A remembered passphrase opens the season without asking. If the keychain failed, the unlock form shows instead.
  await browser.waitUntil(async()=>await $('[role="dialog"][aria-label="Unlock your season"]').isExisting()||/Encrypted season open/.test(await $('.toast').isExisting()?await $('.toast').getText():''),{timeout:30000,timeoutMsg:'the season neither opened nor asked for its passphrase'});
  assert.equal(await $('[role="dialog"][aria-label="Unlock your season"]').isExisting(),false,'the keychain did not return the remembered passphrase under the sandbox');
  await noError();await nav('Teams');await $('//*[normalize-space()="Team Sandbox"]').waitForExist({timeoutMsg:'the saved team is missing after reopening'});await shot('sandbox-reopened');
  assert.deepEqual(listing(CHOSEN),[NAME]);
 });
 it('cannot open a copy outside the chosen folder: the sandbox is enforced',async()=>{
  // The same season and passphrase, copied by the test to a folder the app was never given. Unsandboxed, it opens.
  copyFileSync(SEASON,STRAY);
  const r=await call('open_season',{path:STRAY,passphrase:PASS});
  assert.match(r,/^error: .*(Season file not found|Cannot open season file)/,`a sandboxed app must not reach ${STRAY}, got: ${r}`);
 });
 after(async()=>{
  // Leave nothing in the login keychain, and close the season so its file is complete on disk.
  const del=await call('secret_delete',{name:pathKey(SEASON)}).catch(e=>String(e));
  const left=await call('secret_get',{name:pathKey(SEASON)}).catch(e=>String(e));
  await call('close_season',{}).catch(()=>{});
  console.log(`\nSandbox evidence: ${RUN_DIR}\nSeason: ${SEASON}\nContainer: ${CONTAINER}\nKeychain entry deleted: ${del}; afterwards: ${left}\n`);
 });
});
