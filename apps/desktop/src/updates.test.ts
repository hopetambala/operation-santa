import {describe,it,expect,vi} from 'vitest';
import {updateWindowOpen,checkForUpdate,installUpdate,selfUpdating} from './updates';
const day=(m:number,d:number)=>new Date(2026,m-1,d,12);
describe('Automatic updates',()=>{
 it('are paused from Dec 20 to Dec 26 so nothing changes during delivery week',()=>{expect(updateWindowOpen(day(10,30))).toBe(true);expect(updateWindowOpen(day(12,19))).toBe(true);for(const d of [20,22,24,26])expect(updateWindowOpen(day(12,d)),`Dec ${d}`).toBe(false);expect(updateWindowOpen(day(12,27))).toBe(true)});
 it('returns the available update when the updater reports one',async()=>{const u={rid:7,version:'0.2.0',currentVersion:'0.1.0'};const call=vi.fn().mockResolvedValue(u);expect(await checkForUpdate(call,day(10,30))).toEqual(u);expect(call).toHaveBeenCalledWith('plugin:updater|check',{})});
 it('quietly finds nothing in builds without the updater (App Store, test and dev builds)',async()=>{const call=vi.fn().mockRejectedValue(new Error('plugin updater not found'));expect(await checkForUpdate(call,day(10,30))).toBeNull()});
 it('does not even ask during delivery week',async()=>{const call=vi.fn();expect(await checkForUpdate(call,day(12,23))).toBeNull();expect(call).not.toHaveBeenCalled()});
 it('installs only when asked: downloads the update, then restarts the app',async()=>{const calls:string[]=[];const call=vi.fn(async(cmd:string,args?:Record<string,unknown>)=>{calls.push(cmd);if(cmd==='plugin:updater|download_and_install')expect(args).toMatchObject({rid:7});return null});await installUpdate({rid:7,version:'0.2.0',currentVersion:'0.1.0'},call as never,()=>({channel:true}));expect(calls).toEqual(['plugin:updater|download_and_install','restart_app'])});
 it('offers "Check for updates" only in builds that update themselves',async()=>{expect(await selfUpdating(vi.fn().mockResolvedValue(true))).toBe(true);expect(await selfUpdating(vi.fn().mockResolvedValue(false))).toBe(false);expect(await selfUpdating(vi.fn().mockRejectedValue(new Error('command updater_built_in not found')))).toBe(false);const call=vi.fn().mockResolvedValue(true);await selfUpdating(call);expect(call).toHaveBeenCalledWith('updater_built_in')});
});
