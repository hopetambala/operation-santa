import {browser,$} from '@wdio/globals';
import assert from 'node:assert/strict';
import {click,nav,toast} from '../support/app';
// Automatic updates (PRD §14): ask before installing, never during delivery week. The updater plugin is mocked:
// it only exists in the downloadable release builds, and the test must never fetch or install a real update.
const today=new Date();const deliveryWeek=today.getMonth()===11&&today.getDate()>=20&&today.getDate()<=26;
describe('Updates: offered, never forced',()=>{
 let check:Awaited<ReturnType<typeof browser.tauri.mock>>,install:Awaited<ReturnType<typeof browser.tauri.mock>>,restart:Awaited<ReturnType<typeof browser.tauri.mock>>;
 before(async()=>{await $('h1').waitForDisplayed({timeout:60000});check=await browser.tauri.mock('plugin:updater|check');install=await browser.tauri.mock('plugin:updater|download_and_install');await install.mockReturnValue(null);restart=await browser.tauri.mock('restart_app');await restart.mockReturnValue(null);});
 // The real command, not a mock: the E2E build, like the Mac App Store build, has no updater (Apple updates store
 // copies, and App Review rejects apps that offer their own updates).
 it('offers no update check in a build without the updater',async()=>{await nav('Settings');await $('button=Save settings').waitForDisplayed();assert.equal(await $('button=Check for updates').isExisting(),false,'"Check for updates" shown in a build without the updater');});
 it('says so when the app is already up to date',async()=>{const builtIn=await browser.tauri.mock('updater_built_in');await builtIn.mockReturnValue(true);await check.mockReturnValue(null);await nav('Overview');await nav('Settings');await click('Check for updates');await toast(deliveryWeek?/Updates are paused until December 27/:/You have the latest version/);});
 it('offers a new version and installs it only when asked',async function(){if(deliveryWeek)this.skip();await check.mockReturnValue({rid:7,version:'0.2.0',currentVersion:'0.1.0',body:'Fixes for label printing.'});await click('Check for updates');const offer=await $('[role="status"].update-offer');await offer.waitForDisplayed({timeoutMsg:'no update offer shown'});assert.match(await offer.getText(),/Version 0\.2\.0 is ready/);await install.update();assert.equal(install.mock.calls.length,0,'nothing installs before the coordinator says so');await offer.$('button=Install and restart').click();await browser.waitUntil(async()=>{await restart.update();return restart.mock.calls.length===1},{timeoutMsg:'the app was not restarted after installing'});await install.update();assert.equal(install.mock.calls.length,1);assert.equal((install.mock.calls[0][0] as {rid:number}).rid,7)});
});
