import {browser,$} from '@wdio/globals';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readdirSync,renameSync} from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import {HEADERS_2025} from '../support/fixture';
import {createSeason} from '../support/season';
import {RUN_DIR,PASSPHRASE,click,nav,toast,dialogText,importCsv,installMocks,setE2e,queueOpen,setInput,reasonIfAsked,newestPdf} from '../support/app';
import {demoSeason,type Family} from '../../apps/desktop/src/model';
// Screenshots for the volunteer guides (site/), from the real app and its built-in demo season of fictional families.
// Run with `npm run guides:screenshots`; never point it at a real season. Each picture is independent, so one that
// can't be taken is reported and the rest still are.
const OUT=path.resolve(import.meta.dirname,'..','..','site','assets','images');mkdirSync(OUT,{recursive:true});
const failed:string[]=[];
async function snap(name:string,steps:()=>Promise<void>,el?:string){try{await steps();await browser.pause(1500);// let the navigation's sliding highlight settle
 const file=path.join(OUT,`${name}.png`);if(el)await $(el).saveScreenshot(file);else await browser.saveScreenshot(file);execFileSync('sips',['-Z','1600',file],{stdio:'ignore'});}catch(e){failed.push(`${name}: ${(e as Error).message.split('\n')[0]}`)}finally{await browser.keys('Escape').catch(()=>{});await browser.pause(200);}}
// First page of the newest PDF in RUN_DIR, as a PNG (Quick Look renders it the way Preview would).
function pdfPage(name:string){const pdf=newestPdf();execFileSync('qlmanage',['-t','-s','1600','-o',RUN_DIR,pdf],{stdio:'ignore'});const png=readdirSync(RUN_DIR).find(f=>f===`${path.basename(pdf)}.png`);if(!png)throw Error(`no preview for ${pdf}`);renameSync(path.join(RUN_DIR,png),path.join(OUT,`${name}.png`));}
// A 2025-shaped export of three demo families; the update gives one of them a third child and adds a new sign-up.
function demoCsv(update=false){const demo=demoSeason().families;const row=(f:Family,i:number)=>{const [,house='',rest='']=/^(\d+)\s+(.*)$/.exec(f.street)??[];const r:Record<string,string>={'Entry ID':f.id,'Family Name':f.name,'Number of Children (#)':String(f.children.length),'Number of Children':String(f.children.length),'Created On':`11/0${1+i}/2026 10:00am`,'Created By':'Form','Contact Email':`demo${f.id}@example.invalid`,'Contact Phone Number':f.phone,'Full Address':`${f.street}, ${f.city} ${f.zip}`,'House Number':house,'Street Name':rest,'Ordinal':'None','Suffix':'','Apartment/Unit':f.unit||'None','City & State':f.city,'Zip Code':f.zip};f.children.forEach((c,n)=>{const p=`Child #${n+1}: `;r[p+'Name']=c.name;r[p+'Age']=String(c.age);r[p+'Gender']=c.gender;r[p+'First Choice']=c.first;r[p+'Second Choice']=c.second;r[p+'Letter to Santa']=c.letter;});return HEADERS_2025.map(h=>r[h]??'');};
 const edited=structuredClone(demo[1]);edited.children.push({...structuredClone(edited.children[0]),name:'Jordan',age:6 as never});
 const fresh={...structuredClone(demo[0]),id:'26150',name:'Lopez Demo',street:'215 Holly St'};
 return '﻿'+Papa.unparse({fields:HEADERS_2025,data:update?[row(demo[0],0),row(edited,1),row(demo[2],2),row(fresh as Family,3)]:[row(demo[0],0),row(demo[1],1),row(demo[2],2)]});}
describe('Guide screenshots (demo season)',()=>{
 // Animations only run while the window is in front, so a background run could catch a highlight mid-slide: turn them off.
 before(async()=>{await $('h1').waitForDisplayed({timeout:60000});await installMocks();await browser.execute(()=>{const st=document.createElement('style');st.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.append(st)});await browser.pause(1500);});
 it('takes every screenshot it can',async function(){this.timeout(15*60_000);
  await snap('overview',async()=>{await nav('Overview')});
  await snap('families-filter',async()=>{await nav('Families');await $('select[aria-label="Filter families"]').click()});
  await snap('address-review',async()=>{await nav('Address review');const t=await $('//button[starts-with(normalize-space(.),"Addresses (")]');if(await t.isExisting())await t.click();await $('//button[normalize-space(.)="Pin is right"]').scrollIntoView({block:'end'})});
  await snap('letter-cleanup',async()=>{await nav('Letter cleanup')});
  await snap('teams',async()=>{await nav('Teams')});
  await snap('route-planner',async()=>{await nav('Route planner');await (await $('.route-card')).click();await browser.execute(()=>window.scrollTo(0,0))});
  await snap('settings',async()=>{await nav('Settings')});
  await snap('airtable-token-saved',async()=>{await setE2e({secrets:{airtable_token:'patDEMO.not-a-real-token'}});await nav('Overview');await nav('Settings');await $('//*[contains(text(),"Token saved")]').waitForExist({timeout:5000});await $('//*[contains(text(),"Token saved")]').scrollIntoView({block:'center'})});
  await snap('purge-dialog',async()=>{await nav('Settings');await click('Purge sensitive records');await dialogText('Purge sensitive records')});
  await snap('new-season-dialog',async()=>{await $('button.avatar').click();await click('Create new season');await dialogText('Start a new season')});
  // PDFs: a route that passes Check (its cover has the QR codes), and the label alignment test page.
  const pdfNamed=async(prefix:string)=>browser.waitUntil(async()=>readdirSync(RUN_DIR).some(f=>f.startsWith(prefix)&&f.endsWith('.pdf')),{timeout:60000,timeoutMsg:`no ${prefix} PDF`});
  try{await nav('Print center');await (await $('//button[normalize-space(.)="Export PDF" and not(@disabled)]')).click();await reasonIfAsked('other:Guide screenshots from the demo season');await pdfNamed('Route');pdfPage('route-packet-cover');}catch(e){failed.push(`route-packet-cover: ${(e as Error).message.split('\n')[0]}`)}
  try{await nav('Print center');await click('Alignment test page');await pdfNamed('Label alignment');pdfPage('label-alignment-test');}catch(e){failed.push(`label-alignment-test: ${(e as Error).message.split('\n')[0]}`)}
  // Importing and packets need an encrypted season: a new one, with the demo families imported, then an update.
  try{await createSeason();await importCsv(demoCsv(),'Op Santa Sign-ups-Grid view.csv');await dialogText('Review your import');await click('Accept import');await $('[role="dialog"]').waitForExist({reverse:true});await browser.pause(1500);}catch(e){failed.push(`encrypted season with demo families: ${(e as Error).message.split('\n')[0]}`)}
  await snap('import-review',async()=>{await nav('Families');await importCsv(demoCsv(true),'Op Santa Sign-ups-Grid view (1).csv');await dialogText('Review your import');const more=await $('//*[@role="dialog"]//summary');if(await more.isExisting())await more.click()});
  // Packet mode: export a packet for a few demo families, then open it the way a volunteer would.
  await snap('packet-mode',async()=>{await nav('Letter cleanup');await click('Cleanup packet');await setInput($('[role="dialog"] input[placeholder="first"]'),'26001');await setInput($('[role="dialog"] input[placeholder="last"]'),'26003');await setInput($('[role="dialog"] input[type=password]'),PASSPHRASE);await click('Choose where to save');await toast(/Packet with \d+ families saved/);const packet=readdirSync(RUN_DIR).find(f=>f.endsWith('.opsanta-packet'))!;await queueOpen(path.join(RUN_DIR,packet));await $('button.avatar').click();await click('Open a cleanup packet');await setInput($('[role="dialog"] input[type=password]'),PASSPHRASE);await click('Choose packet file');await toast(/families opened/)});
  console.log(`Guide screenshots in ${OUT}\nNot taken:\n${failed.join('\n')||'(none)'}`);
 });
});
