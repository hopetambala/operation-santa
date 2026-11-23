import {describe,expect,it} from 'vitest';
import {parseRows,mergeImport,relooks} from './importer';
import {emptySeason} from './model';
// UX-HEURISTIC-REVIEW U1: reviewing a letter used to freeze the family's children against later Airtable changes.
// The team cleans in Airtable (dedupes, siblings, phone numbers), so a re-import has to bring those in.
const row=(extra:Record<string,string>={})=>({'Entry ID':'700','Family Name':'Synthetic','House Number':'100','Street Name':'Maple','Suffix':'Ave','City & State':'Pasadena, CA','Zip Code':'91101','Child #1: Name':'Ana','Child #1: Age':'6','Child #1: First Choice':'Books','Child #1: Letter to Santa':'Dear Santa, a book please. Call 626-555-0101.','Child #2: Name':'Ben','Child #2: Letter to Santa':'Dear Santa, a ball please.',...extra});
// An older season: "Looks good" on both letters added the 'children' override.
function looked(){const s=emptySeason();mergeImport(s,parseRows([row()],'t','h1'),'');const f=s.families[0];f.overrides=['children'];for(const c of f.children){c.clean=c.letter.replace(/ Call .*$/,'');c.state='approved';}return s;}
describe('re-import after letters were looked at (U1)',()=>{
 it('adds a sibling added in Airtable, and puts a letter changed in Airtable back to look at',()=>{const s=looked();
  const p=parseRows([row({'Child #1: Letter to Santa':'Dear Santa, a book please.','Child #3: Name':'Cam','Child #3: Letter to Santa':'Dear Santa, a kite please.'})],'t','h2');
  expect(relooks(s,p)).toBe(1);mergeImport(s,p,'');const [a,b,c]=s.families[0].children;
  expect(s.families[0].children).toHaveLength(3);expect(c.name).toBe('Cam');expect(c.state).toBe('pending');
  expect(a.letter).toBe('Dear Santa, a book please.');expect(a.clean).toBe('Dear Santa, a book please.');expect(a.state).toBe('pending');
  expect(b.state).toBe('approved');expect(b.clean).toBe('Dear Santa, a ball please.');});
 it('takes Airtable’s child details unless they were edited in the app',()=>{const s=looked();const f=s.families[0];f.children[1].name='Benjamin';
  mergeImport(s,parseRows([row({'Child #1: Name':'Anna','Child #1: First Choice':'Paint','Child #2: Name':'Benny'})],'t','h2'),'');const [a,b]=s.families[0].children;
  expect(a.name).toBe('Anna');expect(a.first).toBe('Paint');expect(a.state).toBe('approved');expect(b.name).toBe('Benjamin');});
 it('keeps a child that only exists in the app (a merged duplicate sign-up)',()=>{const s=looked();const f=s.families[0];f.children.push({...structuredClone(f.children[0]),id:'700-m701-1',name:'Dee'});
  mergeImport(s,parseRows([row({'Family Name':'Synthetic family'})],'t','h2'),'');expect(s.families[0].children.map(c=>c.name)).toEqual(['Ana','Ben','Dee']);});
 it('looking at a letter no longer marks the children as edited in the app',async()=>{const src=await import('node:fs').then(fs=>fs.readFileSync(new URL('./cleanup.tsx',import.meta.url),'utf8')+fs.readFileSync(new URL('./workflow.ts',import.meta.url),'utf8'));
  expect(src.match(/overrides,'children'/g)??[]).toHaveLength(1);});// only mergeFamilies, which really adds app-only children
});
