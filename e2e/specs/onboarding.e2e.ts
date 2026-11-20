import {browser,$} from '@wdio/globals';
import assert from 'node:assert/strict';
import {mkdirSync,renameSync} from 'node:fs';
import path from 'node:path';
import {RUN_DIR,PASSPHRASE,SEASON_PATH,seasonAction,click,toast,dialogText,installMocks,setE2e,newPassphrase} from '../support/app';
import {lockSeason} from '../support/season';
// First run and coming back (ONBOARDING-AND-ENVIRONMENTS-PLAN.md §4): the welcome window, the synced-folder warning,
// Step 1's start, the one-time "How the four steps work" card, and recent seasons. Synthetic season, no families.
const heading=(text:string)=>$(`//h2[normalize-space()="${text}"]`);
const recent=(name:string)=>$(`//button[contains(@class,"recent")][.//strong[normalize-space()="${name}"]]`);
describe('Onboarding: welcome window, first run and recent seasons',()=>{
 before(async()=>{await $('h1').waitForDisplayed({timeout:60000});await installMocks();});
 it('warns before saving a season into a synced folder, then saves where the coordinator chooses',async()=>{
  const synced=path.join(RUN_DIR,'Library','CloudStorage','Dropbox');mkdirSync(synced,{recursive:true});
  await setE2e({dir:synced});
  await seasonAction('New season…');await dialogText('Start a new season');
  assert.equal(await $('//label[contains(@class,"field")][.//span[normalize-space()="Season name"]]//input').getValue(),'Operation Santa 2026');
  await newPassphrase(PASSPHRASE);await click('Choose save location');
  const warning=await dialogText('That folder syncs to the cloud');assert.match(warning,/Dropbox/);
  await setE2e({dir:RUN_DIR});await click('Choose another folder');
  await toast(/Encrypted season created/);
 });
 it('opens the new season on Step 1 with one obvious action and the four steps explained once',async()=>{
  await browser.waitUntil(async()=>(await browser.execute(()=>window.innerWidth))>=1000,{timeoutMsg:'the window did not grow into the workspace'});
  assert.equal(await $('h1').getText(),'Import');
  assert.ok(await heading('Bring in this year’s sign-ups').isExisting(),'an empty Import offers the Airtable export');
  assert.ok(await heading('How the four steps work').isExisting(),'the four steps are explained on first run');
  await click('Got it');await heading('How the four steps work').waitForExist({reverse:true});
 });
 it('lists the season under Recent seasons after locking, and opens it from there',async()=>{
  await lockSeason();
  await browser.waitUntil(async()=>(await $('h1').getText())==='Operation Santa',{timeoutMsg:'locking did not return to the welcome window'});
  await recent('Operation Santa 2026').click();
  await dialogText('Unlock your season');await $('[role="dialog"] input[type=password]').setValue(PASSPHRASE);await click('Open season');
  await toast(/Encrypted season open/);
  assert.equal(await heading('How the four steps work').isExisting(),false,'the four-steps card does not come back by itself');
 });
 // What the Mac App Store build does after a relaunch: the sandbox says "denied" (sandbox.ts proves it), so the Open panel
 // opens on that season's file, and the coordinator only has to confirm it.
 it('asks for a recent season in the Open panel, in its folder, when the app may no longer read it',async()=>{
  await lockSeason();
  const access=await browser.tauri.mock('season_access');await access.mockReturnValue('denied');
  const opened:string[]=[];const open=await browser.tauri.mock('plugin:dialog|open');
  await open.mockImplementation((a:{options:{defaultPath?:string}})=>{(window as unknown as {__lastOpen:string}).__lastOpen=a.options.defaultPath??'';return a.options.defaultPath??null});
  await recent('Operation Santa 2026').click();
  await dialogText('Unlock your season');
  opened.push(await browser.execute(()=>(window as unknown as {__lastOpen:string}).__lastOpen));
  assert.equal(opened[0],SEASON_PATH,'the Open panel starts on the recent season');
  await $('[role="dialog"] input[type=password]').setValue(PASSPHRASE);await click('Open season');await toast(/Encrypted season open/);
  await access.mockRestore();await installMocks();
 });
 it('says so when a recent season was moved, and drops it from the list',async()=>{
  await lockSeason();
  const moved=`${SEASON_PATH}.moved`;renameSync(SEASON_PATH,moved);
  try{
   await recent('Operation Santa 2026').click();
   await browser.waitUntil(async()=>/isn’t where it was/.test(await $('.error-banner').getText().catch(()=>'')),{timeoutMsg:'no message about the moved season'});
   assert.equal(await recent('Operation Santa 2026').isExisting(),false,'the moved season left the list');
  }finally{renameSync(moved,SEASON_PATH);}
 });
});
