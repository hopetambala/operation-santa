import {describe,expect,it} from 'vitest';
import {issues} from './model';
import {demo} from './solver';
import {packet} from './printing';
// UX-HEURISTIC-REVIEW U2: a team lead who hits a locked gate needs one number, on every page they carry.
async function pageTexts(bytes:ArrayBuffer){const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');const doc=await pdfjs.getDocument({data:new Uint8Array(bytes),isEvalSupported:false,useSystemFonts:false}).promise;const out:string[]=[];for(let n=1;n<=doc.numPages;n++){const c=await (await doc.getPage(n)).getTextContent();out.push(c.items.map(i=>'str' in i?i.str:'').join(' ').replace(/\s+/g,' '));}await doc.destroy();return out;}
describe('North Pole phone on the route packet (U2)',()=>{
 it('is on the cover and every route page, but not on the label sheets',async()=>{const s=demo();expect(s.settings.depotPhone).toBe('(626) 555-0150');const r=s.routes.find(r=>!issues(r,s).length)!;
  const pages=await pageTexts((await packet(r,s,{duplex:false})).bytes);const has=(t:string)=>t.includes('North Pole phone: (626) 555-0150');
  expect(pages[0].split('North Pole phone: (626) 555-0150').length-1).toBe(2);// cover line and footer
  const letters=pages.filter(t=>t.includes('Rudolph Route:'));expect(letters.length).toBeGreaterThan(0);expect(letters.every(has)).toBe(true);
  const without=pages.filter(t=>!has(t));expect(without.length).toBeGreaterThan(0);for(const t of without)expect(t).toMatch(/Bag \d+ of \d+/);// only label sheets go without
  expect(pages.slice(0,3).every(has)).toBe(true);},30000);
 it('prints no phone line when the setting is empty',async()=>{const s=demo();s.settings.depotPhone='';const r=s.routes.find(r=>!issues(r,s).length)!;const pages=await pageTexts((await packet(r,s)).bytes);expect(pages.some(t=>t.includes('North Pole phone'))).toBe(false);},30000);
});
