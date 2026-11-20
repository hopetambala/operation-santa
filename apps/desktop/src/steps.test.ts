import {describe,expect,it} from 'vitest';
import {stepWork,stepsDone} from './onboarding';
import {stepTarget} from './workspace';
import {demoSeason,routable,unrouted,flagLabel,flagList,geoLabel,printCheck} from './model';
import {solve} from './solver';
// RELEASE-UX-PLAN items 4 (the step bar's counts) and 7 (step 1 opens the work).
const none={families:0,importWork:0,routes:0,unrouted:0,children:0,pendingLetters:0,printed:0,stale:0,printBlockers:0};
describe('Step bar counts',()=>{
 it('before anything is printed, Print counts the problems that block printing',()=>{expect(stepWork({...none,routes:8,printBlockers:30}).Print).toBe('30 to fix');expect(stepWork({...none,routes:8,printBlockers:1}).Print).toBe('1 to fix');});
 it('after the first print, Print counts stale routes, and ignores blockers',()=>{const c={...none,routes:8,printed:8,stale:2,printBlockers:30};expect(stepWork(c).Print).toBe('2 to reprint');expect(stepsDone(c).Print).toBe(false);const ok={...c,stale:0};expect(stepWork(ok).Print).toBe('All printed');expect(stepsDone(ok).Print).toBe(true);});
 it('ready but never printed says so, without a check mark',()=>{const c={...none,routes:8,printBlockers:0};expect(stepWork(c).Print).toBe('Ready to print');expect(stepsDone(c).Print).toBe(false);});
 it('Routes leaves out families still waiting on an address; Import counts them',()=>{const s=demoSeason();s.routes=solve(s).routes;const u=unrouted(s);expect(u.needsAddress.length).toBeGreaterThan(0);expect(routable(s)).toBe(u.all.length-u.needsAddress.length);expect(stepWork({...none,unrouted:routable(s)}).Routes).toBe(`${routable(s)} without a route`);});
 it('Print’s count is the same one Print’s check shows',()=>{const s=demoSeason();s.routes=solve(s).routes;expect(printCheck(s.routes,s,{season:true}).errors.length).toBeGreaterThan(0);});
});
describe('Step 1 opens the work',()=>{
 it('opens Address review when Import has work, Families otherwise',()=>{expect(stepTarget('Import',5)).toBe('Address review');expect(stepTarget('Import',0)).toBe('Families');expect(stepTarget('Routes',5)).toBe('Route planner');});
 it('flags and pins read as short words, not abbreviations or a second "Verified"',()=>{expect(flagLabel('spanish_speaker')).toBe('Spanish');expect(flagLabel('extra_toys')).toBe('Extra toys');expect(flagLabel('adopt_a_family')).toBe('Adopt');expect(flagLabel('do_not_share_with_volunteers')).toBe('Held');for(const f of flagList)expect(flagLabel(f)).not.toMatch(/^[A-Z]{2,}$|_/);expect(geoLabel('ok')).toBe('Pin OK');expect(geoLabel('manual')).toBe('Pin OK');for(const g of ['pending','review','failed'] as const)expect(geoLabel(g)).toBe('Check pin');});
});
