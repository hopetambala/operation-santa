import {browser,$,$$} from '@wdio/globals';
import type {ChainablePromiseElement} from 'webdriverio';
import {mkdirSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
import {families,UPLOAD_URL,drawingPng} from './fixture';
// Every run writes its season file, PDFs, screenshots and logs here, so a pass leaves evidence behind.
export const RUN_DIR=path.resolve(import.meta.dirname,'..','.artifacts',new Date().toISOString().replace(/[:.]/g,'-'));
mkdirSync(RUN_DIR,{recursive:true});
export const SEASON_PATH=path.join(RUN_DIR,'Operation Santa 2026.opsanta');
export const PASSPHRASE='e2e synthetic passphrase';
let shots=0;
export const shot=(name:string)=>browser.saveScreenshot(path.join(RUN_DIR,`${String(++shots).padStart(2,'0')}-${name}.png`));
export const field=(label:string)=>$(`//label[contains(@class,"field")][span[normalize-space()="${label}"]]//*[self::input or self::textarea or self::select]`);
// Exact visible text: a partial match would let "Approve" hit the "Approved" filter tab.
export const button=(text:string)=>$(`//button[normalize-space(.)="${text}"]`);
export const enabledButton=async(text:string)=>{const b=await button(text);await b.waitForEnabled({timeout:15000});return b;};
// WebDriver's elementClick scrolls the target into view itself; an explicit scrollIntoView runs as an async script,
// which WebKit never completes while the Mac's screen is locked.
export async function click(text:string){const b=await enabledButton(text);await b.click();}
// A button inside a named dialog, for labels that also appear on the page behind it ("Save scenario").
export async function clickIn(dialog:string,text:string){const b=await $(`//*[@role="dialog" and @aria-label="${dialog}"]//button[normalize-space(.)="${text}"]`);await b.waitForEnabled();await b.click();}
export async function fill(label:string,value:string){const f=await field(label);await f.waitForDisplayed();await setInput(f,value);}
export async function nav(page:string){await $(`nav [aria-label="${page}"]`).click();await browser.waitUntil(async()=>(await $('h1').getText()).replace(/\s+/g,' ')===page,{timeoutMsg:`${page} did not open`});}
export async function toast(match:RegExp,timeout=30000){let last='';await browser.waitUntil(async()=>{const t=await $('.toast');last=await t.isExisting()?await t.getText():'';return match.test(last)},{timeout,timeoutMsg:`No toast matching ${match}; last toast: "${last}"`}).catch(async e=>{const err=await $('.error-banner');const banner=await err.isExisting()?await err.getText():'none';await shot('toast-timeout');throw Error(`${e.message}\nError banner: ${banner}\nPage: ${(await pageText()).slice(0,700)}`)});const close=await $('.toast button[aria-label="Dismiss"]');if(await close.isExisting())await close.click();return last;}
export async function noError(){const e=await $('.error-banner');if(await e.isExisting())throw Error(`App error banner: ${await e.getText()}`);}
// After freezing or printing, the app asks for a reason code (R-CHG-2). Answer it when it appears.
// `other:<text>` picks Other, checks it can't be recorded without a description, then writes one.
export async function reasonIfAsked(code:string){const m=await $('[role="dialog"][aria-label="Leave a note for the next person"]');if(!(await m.isExisting()))return false;const [reason,text]=code.split(/:(.*)/s);await choose(await m.$('select'),reason);if(reason==='other'){if(await (await button('Record & continue')).isEnabled())throw Error('"other" was accepted without a description');await setInput(field('Describe the change'),text||'');}await click('Record & continue');await m.waitForExist({reverse:true});return true;}
// WebKit's embedded driver selects options without firing `change`, which React listens for; do what a user's pick does.
export async function choose(select:ChainablePromiseElement|WebdriverIO.Element,value:string){const el=await select;await browser.execute((node:HTMLSelectElement,v:string)=>{Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value')!.set!.call(node,v);node.dispatchEvent(new Event('change',{bubbles:true}));},el as unknown as HTMLSelectElement,value);}
// Same idea for controlled inputs and textareas: WebDriver's clear() never reaches React state, so typing appends.
export async function setInput(input:ChainablePromiseElement|WebdriverIO.Element,value:string){const el=await input;await browser.execute((node:HTMLInputElement|HTMLTextAreaElement,v:string)=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node),'value')!.set!.call(node,v);node.dispatchEvent(new Event('input',{bubbles:true}));},el as unknown as HTMLInputElement,value);}
export async function dialogText(title:string){const d=await $(`[role="dialog"][aria-label="${title}"]`);await d.waitForDisplayed({timeoutMsg:`Dialog "${title}" did not open`});return d.getText();}
export async function pageText(){return (await $('main').getText()).replace(/\s+/g,' ');}
// The hidden <input type=file> is fed the CSV directly; WebDriver cannot drive the native file picker.
export async function importCsv(csv:string,name='signups-2025-shaped.csv',selector='input[type=file][accept=".csv,.xlsx"]'){await browser.execute((text:string,file:string,sel:string)=>{const input=document.querySelector<HTMLInputElement>(sel)!;const dt=new DataTransfer();dt.items.add(new File([text],file,{type:'text/csv'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));},csv,name,selector);}
export const newestPdf=()=>readdirSync(RUN_DIR).filter(f=>f.endsWith('.pdf')).map(f=>path.join(RUN_DIR,f)).sort((a,b)=>statSync(b).mtimeMs-statSync(a).mtimeMs)[0];
// IPC mocks (R-IMP-7, §10.1): the geocoders and Airtable never see a request, and native dialogs answer with paths in RUN_DIR.
// Saved paths use the platform separator, so they equal SEASON_PATH: the keychain and backup keys hash the path string.
export async function installMocks(){const census=Object.fromEntries(families.filter(f=>f.geo.census).map(f=>[f.id,f.geo.census]));const miss=families.find(f=>f.geo.nominatim)!;await browser.execute((data:object)=>{(window as unknown as {__e2e:object}).__e2e=data},{dir:RUN_DIR,sep:path.sep,openQueue:[] as string[],census,nominatim:{match:miss.street.toLowerCase(),lat:miss.geo.nominatim![0],lon:miss.geo.nominatim![1],label:`${miss.street} ${miss.suffix}, ${miss.city.split(',')[0]}, CA ${miss.zip}`},uploadUrl:UPLOAD_URL,png:drawingPng(),freshUrls:[] as string[],expiredUrls:[] as string[],secrets:{} as Record<string,string>,airtable:{pages:[] as string[],records:{} as Record<string,string>}});
 type E={dir:string;sep:string;openQueue:string[];census:Record<string,[number,number]>;nominatim:{match:string;lat:number;lon:number;label:string};uploadUrl:string;png:string;freshUrls:string[];expiredUrls:string[];secrets:Record<string,string>;airtable:{pages:string[];records:Record<string,string>}};
 const save=await browser.tauri.mock('plugin:dialog|save');await save.mockImplementation((a:{options:{defaultPath:string}})=>{const e=(window as unknown as {__e2e:E}).__e2e;return `${e.dir}${e.sep}${a.options.defaultPath.replace(/[\\/:]/g,'_')}`});
 const open=await browser.tauri.mock('plugin:dialog|open');await open.mockImplementation((a:{options:{directory?:boolean}})=>{const e=(window as unknown as {__e2e:E}).__e2e;return a.options.directory?e.dir:(e.openQueue.shift()??null)});
 const census_=await browser.tauri.mock('geocode_census');await census_.mockImplementation((a:{rows:{id:string;street:string;city:string;state:string;zip:string}[]})=>{const e=(window as unknown as {__e2e:E}).__e2e;return a.rows.map(r=>{const g=e.census[r.id];return {id:r.id,matched:!!g,exact:!!g,lat:g?g[0]:null,lon:g?g[1]:null,matchedAddress:g?`${r.street}, ${r.city}, ${r.state}, ${r.zip}`.toUpperCase():''}})});
 const nom=await browser.tauri.mock('geocode_nominatim');await nom.mockImplementation((a:{query:string})=>{const n=(window as unknown as {__e2e:E}).__e2e.nominatim;return a.query.toLowerCase().includes(n.match)?{lat:n.lat,lon:n.lon,houseLevel:false,displayName:n.label}:null});
 const fetch_=await browser.tauri.mock('fetch_attachment');await fetch_.mockImplementation((a:{url:string})=>{const e=(window as unknown as {__e2e:E}).__e2e;return a.url===e.uploadUrl||e.freshUrls.includes(a.url)?{status:200,contentType:'image/png',data:e.png}:e.expiredUrls.includes(a.url)?{status:410,contentType:'',data:''}:{status:404,contentType:'',data:''}});
 // The OS keychain stays untouched: secrets live in the page for the length of the run.
 const secretSet=await browser.tauri.mock('secret_set');await secretSet.mockImplementation((a:{name:string;value:string})=>{(window as unknown as {__e2e:E}).__e2e.secrets[a.name]=a.value;return null});
 const secretGet=await browser.tauri.mock('secret_get');await secretGet.mockImplementation((a:{name:string})=>(window as unknown as {__e2e:E}).__e2e.secrets[a.name]??null);
 const secretDel=await browser.tauri.mock('secret_delete');await secretDel.mockImplementation((a:{name:string})=>{delete (window as unknown as {__e2e:E}).__e2e.secrets[a.name];return null});
 // Airtable API (R-IMP-6): first page, the offset page, and single-record lookups used to refresh expired links.
 const airtable=await browser.tauri.mock('airtable_get');await airtable.mockImplementation((a:{path:string})=>{const at=(window as unknown as {__e2e:E}).__e2e.airtable;const rec=a.path.match(/\/(rec\w+)/);if(rec)return at.records[rec[1]];return a.path.includes('offset=')?at.pages[1]:at.pages[0]});
 return {save,open,census:census_,nominatim:nom,fetch:fetch_,secretSet,secretGet,airtable};}
export const queueOpen=(p:string)=>browser.execute((file:string)=>{(window as unknown as {__e2e:{openQueue:string[]}}).__e2e.openQueue.push(file)},p);
export const setE2e=(patch:Record<string,unknown>)=>browser.execute((p:Record<string,unknown>)=>{Object.assign((window as unknown as {__e2e:Record<string,unknown>}).__e2e,p)},patch);
