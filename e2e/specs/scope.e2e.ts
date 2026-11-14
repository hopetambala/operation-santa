import {$,$$} from '@wdio/globals';
import assert from 'node:assert/strict';
import {nav,pageText,button} from '../support/app';
// The app's agreed scope (docs/feature-grounding-audit.md): features cut on 2026-10-30 must not come back,
// and the grounded ones they were weighed against must stay. Runs on the built-in demo season, so no setup.
const absent=async(text:string)=>assert.equal(await (await button(text)).isExisting(),false,`"${text}" should be gone`);
const present=async(text:string)=>assert.ok(await (await button(text)).isExisting(),`"${text}" should still be there`);
describe('Scope: only features grounded in the 2025 problems',()=>{
 before(async()=>{await $('h1').waitForDisplayed({timeout:60000});});
 it('has no Dispatch or Outreach tab',async()=>{const tabs=await Promise.all(await $$('nav.nav-pills button > span').map(s=>s.getProperty('textContent') as Promise<string>));for(const cut of ['Dispatch','Outreach'])assert.ok(!tabs.includes(cut),`${cut} tab should be gone; tabs: ${tabs}`);for(const t of ['Families','Address review','Route planner','Teams','Letter cleanup','Print center','Change log','Settings'])assert.ok(tabs.includes(t),`${t} tab missing`);});
 it('Overview has no countdown or date strip',async()=>{assert.ok(!/days to Christmas Eve/.test(await pageText()));assert.equal(await $('.season-strip').isExisting(),false);});
 it('Route planner: no team-count sweep, scenarios or split; rebalance stays',async()=>{await nav('Route planner');const t=await pageText();assert.ok(!t.includes('How many teams do we need?'),'team-count sweep section is gone');for(const b of ['Run sweep','Save scenario','Split'])await absent(b);await present('Rebalance unlocked');});
 it('Print center: QR phone links and the MyRouteOnline fallback stay; the Circuit export is gone',async()=>{await nav('Print center');await absent('Circuit / RoadWarrior CSV');await present('MyRouteOnline CSV');assert.ok((await $$('//button[normalize-space()="Phone links"]')).length>0,'phone links (QR codes) stay');});
 it('Settings: no next-season or post-season report',async()=>{await nav('Settings');for(const b of ['Start next season from this one','Post-season report (.md)'])await absent(b);await present('Purge sensitive records');});
 it('Families keeps manual "Add family"',async()=>{await nav('Families');await present('Add family');});
 // Phase 3: the import is trusted; the queue holds only flagged letters, with "Looks good · next" and "Don't print".
 it('Letter cleanup asks only about flagged letters',async()=>{await nav('Letter cleanup');for(const b of ['Approve','Hold from print'])await absent(b);for(const b of ['Looks good · next','Don’t print'])await present(b);assert.ok(await $('//button[@role="tab" and contains(.,"to look at")]').isExisting(),'the first tab counts the letters to look at');});
 // Settings ▸ Advanced (simplification phase 2): unproven features stay in the code but aren't rendered until their switch is on.
 it('Airtable Sync and cleanup packets are hidden until switched on',async()=>{await nav('Families');await absent('Sync Airtable');await nav('Letter cleanup');for(const b of ['Cleanup packet','Import returned packet'])await absent(b);await nav('Settings');assert.ok(!(await pageText()).includes('Airtable connection'),'the Airtable token panel is hidden');assert.equal(await $('//label[normalize-space()="Base ID (app…)"]').isExisting(),false,'Airtable base and table are hidden');for(const label of ['Airtable Sync','Send letters to helpers'])assert.equal(await $(`//label[contains(@class,"checkbox") and normalize-space()="${label}"]/input`).isSelected(),false,`${label} starts off`);});
});
