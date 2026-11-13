import {browser,$,$$} from '@wdio/globals';
import assert from 'node:assert/strict';
import {writeFileSync,statSync} from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import {airtableExport} from '../support/airtable-export';
import {RUN_DIR,field,shot,click,fill,nav,noError,reasonIfAsked,dialogText,pageText,importCsv,installMocks,setE2e,setInput,newestPdf,choose} from '../support/app';
import {createSeason} from '../support/season';
import {readPdf} from '../support/pdf';
import {inArea,defaults,type Family} from '../../apps/desktop/src/model';
import {WINDOW} from '../../apps/desktop/src/windowed';
// The usability test's success criterion: a coordinator takes the season's Airtable export, as downloaded,
// and gets from a fresh install to a printed route packet. A season-sized synthetic export (740 families,
// the 2025 form's columns and answers) stands in for the real one, which never leaves the club's machines.
const x=airtableExport(740);
const timings:Record<string,number>={};
let t0=0;const start=()=>{t0=Date.now();};const stop=(step:string)=>{timings[step]=Math.round((Date.now()-t0)/100)/10;};
const count=async(label:RegExp)=>Number((await $(`//button[contains(.,"(")][starts-with(normalize-space(.),"${label.source}")]`).getText()).match(/\((\d+)\)/)?.[1]??NaN);
// Out of area by the app's own rule (service-city circles plus the buffer), for families the geocoder places.
const away=x.families.filter(f=>f.away),outOfArea=x.families.filter(f=>f.geo&&!f.away&&inArea({lat:f.geo.lat,lon:f.geo.lon,city:f.city} as Family,defaults)===false);
// A season-sized run: WDIO fixes each test's limit before it starts, so the limit is set here, for the whole suite.
describe('A coordinator’s season from an Airtable export',function(){this.timeout(25*60_000);
 before(async()=>{writeFileSync(path.join(RUN_DIR,'airtable-export-740.csv'),x.csv());await $('h1').waitForDisplayed({timeout:60000});await installMocks();
  // Uploads in yesterday's export have expired (HTTP 410); a fresh export's links download.
  await setE2e({census:x.census,expiredUrls:x.uploadUrls({fresh:false}),freshUrls:x.uploadUrls({fresh:true})});await createSeason();});
 it('previews the export: every family, the real pickups, and no guessed ones',async()=>{start();await importCsv(x.csv(),'Op Santa Sign-ups-Grid view.csv');const text=await dialogText('Review your import');stop('import preview');
  assert.ok(text.includes('740 new'),text.slice(0,300));assert.ok(text.includes(`${x.uploadUrls({fresh:false}).length} uploads to download`));assert.ok(!/doesn’t recognize|no column for/.test(text),`unexpected import warning: ${text.slice(0,600)}`);await shot('export-preview');
  start();await click('Accept import');
  // Accepting backs the season up first, so the families arrive a moment after the click.
  await browser.waitUntil(async()=>/740 not looked up yet: open Address review and press Geocode/.test(await pageText()),{timeout:60000,timeoutMsg:'the 740 imported families never showed as not looked up'});await $(`//*[contains(text(),"${x.uploadUrls({fresh:false}).length} failed · 0 still downloading")]`).waitForExist({timeout:180000});stop('accept + upload attempts');await noError();
  await nav('Families');const t=await pageText();assert.match(t,/740 families · 2\d{3} children/);await shot('families');});
 // The families table mounts a window of rows. It used to stop at the first 400; every family must still be reachable,
 // and Tab at the edge of the mounted rows must reach the next family rather than leave the list.
 // This WebDriver sends keys as synthetic keydown events: no native focus move and no shiftKey. So the test sends the
 // keydown itself at the window's edges, which is the path the app handles; Tab between mounted rows is the browser's.
 it('reaches every family in the table while mounting only a window of rows',async()=>{await nav('Families');const rows=async()=>(await $$('tbody tr')).length;
  const indexes=async()=>Promise.all(await $$('tbody tr').map(async r=>Number(await r.getAttribute('data-window-index'))));
  const rowOfFocus=()=>browser.execute(()=>document.activeElement?.closest('tr')?.getAttribute('data-window-index')??null);
  const tabFrom=(i:number,shift:boolean)=>browser.execute((i:number,shift:boolean)=>{const box=document.querySelector(`tbody tr[data-window-index="${i}"] input[type=checkbox]`) as HTMLElement;box.focus({preventScroll:true});box.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',code:'Tab',shiftKey:shift,bubbles:true,cancelable:true}));},i,shift);
  assert.ok(await rows()>0&&await rows()<=WINDOW,`${await rows()} rows mounted at the top`);
  const last=Math.max(...await indexes());await tabFrom(last,false);
  await browser.waitUntil(async()=>await rowOfFocus()===String(last+1),{timeout:5000,timeoutMsg:`Tab from row ${last}, the last one mounted, did not reach row ${last+1}`});
  await browser.execute(()=>window.scrollTo(0,document.documentElement.scrollHeight));await $('tbody tr[aria-rowindex="741"]').waitForExist({timeout:5000,timeoutMsg:'the 740th family never appeared at the bottom of the list'});assert.ok(await rows()<=WINDOW,`${await rows()} rows mounted at the bottom`);
  const first=Math.min(...await indexes());assert.ok(first>0,'the bottom of the list does not mount the first family');await tabFrom(first,true);
  await browser.waitUntil(async()=>await rowOfFocus()===String(first-1),{timeout:5000,timeoutMsg:`Shift+Tab from row ${first}, the first one mounted, did not reach row ${first-1}`});
  await browser.execute(()=>window.scrollTo(0,0));await noError();});
 it('explains the expired upload links, and a fresh export downloads them',async()=>{await nav('Letter cleanup');const t=await pageText();assert.ok(/0\/\d+ ready/.test(t),t.slice(0,300));await shot('uploads-expired');
  start();await importCsv(x.csv({fresh:true}),'Op Santa Sign-ups-Grid view (1).csv');const text=await dialogText('Review your import');assert.ok(text.includes('0 new'),text.slice(0,300));await click('Accept import');await nav('Overview');await $('//*[contains(text(),"0 failed · 0 still downloading")]').waitForExist({timeout:300000});stop('re-import fresh export + downloads');await noError();});
 it('geocodes the whole season in one go and leaves only the real problems for review',async()=>{await nav('Address review');const misses=x.families.filter(f=>!f.geo).length;start();await $('//button[starts-with(normalize-space(.),"Geocode ")]').click();await $(`//strong[normalize-space()="${misses} addresses"]`).waitForExist({timeout:180000}).catch(async()=>{await shot('geocode-timeout');throw Error(`geocoding did not finish: Addresses (${await count(/Addresses/)}), expected ${misses} still waiting. ${(await pageText()).slice(0,1200)}`);});stop('geocode 740');await noError();await shot('address-review');
  const flags=await count(/Proposed flags/);assert.ok(flags>0);await click(`Proposed flags (${flags})`);start();await click('Accept all');await $('//button[contains(.,"Proposed flags (0)")]').waitForExist({timeout:60000});stop('accept proposed flags');
  const area=await count(/Out of area/);assert.equal(area,outOfArea.length,'families outside the service circles are out of area');if(area){await click(`Out of area (${area})`);start();for(let i=0;i<area;i++){await click('Move to pickup');await reasonIfAsked('moved_to_pickup');}await $('//button[contains(.,"Out of area (0)")]').waitForExist();stop('out of area → pickup');}
  await nav('Families');await choose($('select[aria-label="Filter families"]'),'pickup');assert.match(await pageText(),new RegExp(`${away.length+area} families`),'exactly the relocated, no-address and out-of-area families are pickups');await choose($('select[aria-label="Filter families"]'),'all');});
 it('lets a person pin the addresses the geocoder missed',async()=>{await nav('Address review');let left=await count(/Addresses/);timings['addresses a person pins']=left;start();while(left>0){const id=(await $('.panel-padding h3').getText()).match(/#(\d+)/)![1];const f=x.families.find(z=>z.id===id)!;const at=f.city.startsWith('Altadena')?[34.19,-118.13]:[34.15,-118.13];await fill('Latitude',String(at[0]+Number(id)%50/5000));await fill('Longitude',String(at[1]-Number(id)%37/5000));await click('Pin is right');await browser.waitUntil(async()=>(await count(/Addresses/))<left,{timeout:15000});left=await count(/Addresses/);}stop('pin missed addresses');await shot('addresses-done');});
 it('plans with 2025’s 45 teams, keeps saying when they don’t fit, and finds how many teams it takes',async()=>{const sheet=(n:number)=>Papa.unparse(Array.from({length:n},(_,i)=>({Team:`Team ${String(i+1).padStart(2,'0')}`,Lead:`Lead ${i+1}`,Phone:`(626) 555-${String(100+i).padStart(4,'0')}`,Spanish:i%4===0?'Yes':'No'})));writeFileSync(path.join(RUN_DIR,'teams-45.csv'),sheet(45));
  await nav('Teams');await importCsv(sheet(45),'teams-45.csv','input[type=file][hidden]');await $('//*[contains(text(),"Team 45")]').waitForExist();
  await nav('Route planner');await setInput($('input[aria-label="Team count"]'),'45');start();await click('Rebalance unlocked');await browser.waitUntil(async()=>(await $$('.route-card')).length===45,{timeout:120000,timeoutMsg:'45 routes were not planned'});stop('plan 45 routes');await noError();
  // 2025's flat 10 minutes a stop put 13 routes past 3h30 (P10). With real stop times 45 teams may not be enough,
  // and the planner has to say so after the toast is gone.
  const short=Number((await pageText()).match(/UNROUTED\s*(\d+)/)?.[1]);timings['unrouted with 45 teams']=short;if(short>0){await browser.pause(7000);assert.match(await pageText(),/don’t fit on 45 teams within the 3h 45m limit\. Set Fleet to “Fewest that fit”/,'the note outlives the toast');await nav('Print center');await click('Show details');assert.match(await pageText(),/home deliveries have no route: \d+ don’t fit/,'Check names the unrouted families before anyone prints every route');await nav('Route planner');}await shot('routes-45');
  await choose(field('Fleet'),'auto');start();await click('Rebalance unlocked');await browser.waitUntil(async()=>/UNROUTED\s*0/.test(await pageText()),{timeout:180000,timeoutMsg:'fewest that fit left families unrouted'});stop('plan fewest that fit');const needed=(await $$('.route-card')).length;timings['teams needed']=needed;
  await nav('Teams');await importCsv(sheet(needed),`teams-${needed}.csv`,'input[type=file][hidden]');await $(`//*[contains(text(),"Team ${needed}")]`).waitForExist();
  await nav('Route planner');await click('Rebalance unlocked');
  // The plan already shows 0 unrouted before this rebalance, so wait for what it does: every route gets a team.
  await browser.waitUntil(async()=>{const t=await pageText();return /UNROUTED\s*0/.test(t)&&!/No team assigned/.test(t)},{timeout:180000,timeoutMsg:'the rebalance left a route without a team'});const t=await pageText();assert.ok(!/No team (yet|assigned)|don’t fit/.test(t),t.slice(0,600));await noError();await shot(`routes-${needed}`);});
 // About 2,000 letters at season size. The suite's limit sits above the wait's own, so a slow run reports how far it got.
 it('times letter approvals at season size, then clears the queue',async()=>{await nav('Letter cleanup');start();for(let i=0;i<20;i++)await click('Approve');stop('20 approvals by hand');timings['seconds per approval']=Math.round(timings['20 approvals by hand']/20*100)/100;
  // The rest go through the same button in-page; WebDriver round-trips would take most of an hour. Batches of 50
  // keep each script call well inside WebDriver's script timeout on slow CI runners.
  // The queue's header reads "… · 1 of N"; N is how many letters are left.
  let left=NaN;start();try{await browser.waitUntil(async()=>{const r=await browser.execute(async()=>{const done=()=>Array.from(document.querySelectorAll('h2,h3,p,strong')).some(e=>/Every letter has had a little care/.test(e.textContent||''));for(let n=0;n<50&&!done();n++){const b=Array.from(document.querySelectorAll('button')).find(e=>(e.textContent||'').trim()==='Approve') as HTMLButtonElement|undefined;if(!b)break;b.click();await new Promise(r=>setTimeout(r,0));}const m=Array.from(document.querySelectorAll('.panel-head p')).map(e=>/ of (\d+)$/.exec(e.textContent||'')?.[1]).find(Boolean);return {done:done(),left:done()?0:Number(m??NaN)};});if(r.left!==left&&Math.floor(r.left/250)!==Math.floor(left/250))console.log(`[approvals] ${r.left} left after ${Math.round((Date.now()-t0)/1000)} s`);left=r.left;return r.done},{timeout:20*60_000,interval:100});}catch(e){await shot('approvals-timeout');throw Error(`${left} letters still waiting after ${Math.round((Date.now()-t0)/1000)} s: ${(e as Error).message}`)}stop('approve the remaining letters');await noError();});
 it('passes Check and prints every route packet in one PDF',async()=>{const n=timings['teams needed'];await nav('Print center');const t=await pageText();assert.ok(t.includes('No blocking problems.'),`Check should pass: ${t.slice(0,900)}`);// A season-sized PDF takes minutes, longer than the 6 s toast stays up, so wait for the file and its size to settle.
  const before=newestPdf();start();await click('All routes, one PDF');let size=-1;await browser.waitUntil(async()=>{const p=newestPdf();if(!p||p===before)return false;const s=statSync(p).size;const settled=s>0&&s===size;size=s;return settled;},{timeout:540000,interval:3000,timeoutMsg:'the season PDF was not written'});stop('print every route');await noError();const pages=await readPdf(newestPdf());timings['pages printed']=pages.length;assert.equal(pages.filter(p=>/Route \d+ · Stop 1 of/.test(p.text)).length,n);await shot('printed');});
});
after(()=>{writeFileSync(path.join(RUN_DIR,'airtable-export-timings.json'),JSON.stringify(timings,null,2));console.log('\nAirtable export timings (s):',timings,`\nEvidence: ${RUN_DIR}\n`);});
