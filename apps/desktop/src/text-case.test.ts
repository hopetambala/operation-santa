import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {duration,plural,sentence} from './model';
// RELEASE-UX-PLAN items 2 and 10.
const css=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8');
// The declarations inside every rule whose selector mentions `selector`.
const rules=(text:string,selector:string)=>[...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>m[1].includes(selector)).map(m=>m[2]).join('\n');
describe('Durations',()=>{
 it('carry 60 minutes into the hour instead of printing "2h 60m"',()=>{expect(duration(179.6)).toBe('3h 0m');expect(duration(59.5)).toBe('1h 0m');expect(duration(125)).toBe('2h 5m');expect(duration(0)).toBe('0h 0m');});
});
describe('Sentence case and plurals',()=>{
 it('badges and the family editor’s flags are not forced into Title Case',()=>{expect(rules(css('./brand/components.css'),'.badge')).not.toMatch(/text-transform:\s*capitalize/);expect(rules(css('./styles.css'),'.flag-grid')).not.toMatch(/text-transform:\s*capitalize/);});
 it('sentence() capitalizes only the first letter',()=>{expect(sentence('out of area')).toBe('Out of area');expect(sentence('do not share with volunteers')).toBe('Do not share with volunteers');expect(sentence('')).toBe('');});
 it('plural() agrees with the count',()=>{expect(plural(1,'check')).toBe('1 check');expect(plural(2,'check')).toBe('2 checks');expect(plural(0,'recorded change')).toBe('0 recorded changes');expect(plural(1,'family','families')).toBe('1 family');expect(plural(3,'family','families')).toBe('3 families');});
});
