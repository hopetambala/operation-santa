import {describe,it,expect} from 'vitest';
import {settingsGroups,routeSettingsGroup,readSettings,visible} from './more';
import {emptySeason} from './model';
// Simplification phase 4: each control has one home.
const keys=(gs:{fields:{key:string}[]}[])=>gs.flatMap(g=>g.fields.map(f=>f.key));
const stopTimes=['base','extra','apartment','gate','toys','discount','speed','circuity','parking'];
describe('Settings: one home for each control',()=>{
 it('Settings no longer repeats the planner or the Print center, and has no "Start at slot"',()=>{const on=keys(settingsGroups);for(const k of ['fleet','fleetMode','labelFormat','labelAddress','labelStart'])expect(on).not.toContain(k)});
 it('the 9 stop-time numbers live in Route settings, visible, and only there',()=>{expect(keys([routeSettingsGroup])).toEqual(stopTimes);for(const k of stopTimes)expect(keys(settingsGroups)).not.toContain(k)});
 it('depot coordinates, stops per Maps link and letter length sit under Advanced',()=>{const adv=settingsGroups.find(g=>g.title==='Advanced')!;expect(keys([adv])).toEqual(expect.arrayContaining(['lat','lon','legSize','letterLimit','airtableSync','helperPackets']));for(const g of settingsGroups.filter(g=>g.title!=='Advanced'))for(const k of ['lat','lon','legSize','letterLimit'])expect(keys([g])).not.toContain(k)});
 it('no settings text mentions the planning specification',()=>{expect(JSON.stringify(settingsGroups)).not.toMatch(/specification|§/)});
 it('saving with Airtable Sync off keeps the hidden Airtable base and table (review finding)',()=>{const s=emptySeason();s.settings.airtableBase='appSYNTHETIC';s.settings.airtableTable='tblSYNTHETIC';const shown=visible(s);expect(shown.some(g=>g.title==='Airtable (read-only)')).toBe(false);const data=new FormData();for(const g of shown)for(const f of g.fields)if(f.type!=='checkbox')data.set(f.key,String(s.settings[f.key]));data.set('actor','Robin');const st=readSettings(shown,data,s.settings);expect(st.actor).toBe('Robin');expect(st.airtableBase).toBe('appSYNTHETIC');expect(st.airtableTable).toBe('tblSYNTHETIC')});
});
