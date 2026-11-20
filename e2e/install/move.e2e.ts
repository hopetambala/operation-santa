import {browser,$} from '@wdio/globals';
import assert from 'node:assert/strict';
import {existsSync,readdirSync} from 'node:fs';
import path from 'node:path';
// Move to Applications, for real (main.rs move_to_applications). Run by e2e/install/run.mjs: a debug Dev build with the
// updater feature (the direct-download build) runs from Downloads in a throwaway home folder, with "Applications"
// pointed at a scratch folder (OPSANTA_APPLICATIONS_DIR, debug builds only). The real /Applications and Trash are untouched.
const HOME=process.env.HOME!;
const APPS=process.env.OPSANTA_APPLICATIONS_DIR!;
const NAME='Operation Santa Dev.app';
describe('Move to Applications (direct-download build opened from Downloads)',()=>{
 it('offers to move, then copies itself into Applications, trashes the original and reopens from there',async()=>{
  assert.ok(APPS&&HOME.includes('opsanta-move-'),'run through e2e/install/run.mjs');
  await $('h1').waitForDisplayed({timeout:60000});
  const title=$('//h2[normalize-space()="Move Operation Santa to the Applications folder?"]');
  await title.waitForExist({timeout:20000,timeoutMsg:'no move offer for a copy running from Downloads'});
  assert.match(await $('[role="dialog"]').getText(),/running from Downloads/);
  console.log('MOVE-CLICKED');await $('//button[normalize-space()="Move and Restart"]').click();
  await browser.waitUntil(async()=>existsSync(path.join(APPS,NAME,'Contents','MacOS','opsanta')),{timeout:60000,timeoutMsg:'the app never arrived in Applications'}).catch(e=>{throw e});
  assert.equal(existsSync(path.join(HOME,'Downloads',NAME)),false,'the original left Downloads');
  assert.ok(readdirSync(path.join(HOME,'.Trash')).some(n=>n.startsWith('Operation Santa Dev (moved to Applications')),'the original is in the Trash');
 });
});
