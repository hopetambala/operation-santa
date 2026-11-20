import {describe,expect,it} from 'vitest';
import {demoSeason,moveGroup,removeStop,emptySeason,audit} from './model';
import {solve} from './solver';
import {changeText,changeRows,short} from './more';
// RELEASE-UX-PLAN item 5: the change log shows what changed and finds it by value.
describe('Change log',()=>{
 const moved=()=>{const s=demoSeason(24);s.routes=solve(s).routes;const r=s.routes.find(r=>r.number===1)!;const id=r.ids[0];removeStop(s,id,'');moveGroup(s,id,1,'');return {s,id};};
 it('shows field: before → after in the row, using route labels',()=>{const {s,id}=moved();const c=s.changes.find(c=>c.entity.split(', ').includes(id)&&c.after==='Route 01')!;expect(changeText(c)).toBe('route: Unrouted → Route 01');expect(s.changes.some(c=>c.before==='Route 01'&&c.after==='Unrouted')).toBe(true);});
 it('searching for a value finds who moved onto or off a route',()=>{const {s,id}=moved();const rows=changeRows(s.changes,'route 01');expect(rows.length).toBeGreaterThanOrEqual(2);expect(rows.every(c=>c.entity.split(', ').includes(id)||/Route 01/.test(c.before+c.after+c.entity))).toBe(true);expect(changeRows(s.changes,'zzz-nothing')).toEqual([]);});
 it('keeps long values short, with the full value kept for hover',()=>{expect(short('x'.repeat(200)).length).toBeLessThanOrEqual(61);expect(short('short')).toBe('short');const s=emptySeason();audit(s,'1','notes','',`${'a'.repeat(100)}`,'');expect(changeText(s.changes[0])).toMatch(/^notes: Empty → a+…$/);});
});
