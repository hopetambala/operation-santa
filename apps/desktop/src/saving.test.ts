import {describe,it,expect} from 'vitest';
import {saver} from './saving';
// A save rewrites the whole encrypted file, so at season size one takes a moment. Approving letters one after another
// must not queue one save per click (at 740 families that made each click take ~2 s on CI).
const slowDisk=()=>{const saved:string[]=[];let open:(()=>void)[]=[];const save=(d:string)=>new Promise<void>(r=>{saved.push(d);open.push(r)});const finish=()=>{const o=open;open=[];o.forEach(r=>r())};return {saved,save,finish};};
const flush=()=>new Promise(r=>setTimeout(r,0));
describe('Saving the season',()=>{
 it('saves only the newest state of changes made while a save is running',async()=>{const disk=slowDisk();const s=saver(disk.save);s.schedule(()=>'v1');for(let v=2;v<=100;v++)s.schedule(()=>`v${v}`);await flush();expect(disk.saved).toEqual(['v1']);disk.finish();await flush();expect(disk.saved).toEqual(['v1','v100']);disk.finish();await s.idle();expect(disk.saved).toEqual(['v1','v100']);});
 it('builds the save data only for states it writes',async()=>{const disk=slowDisk();const s=saver(disk.save);const built:number[]=[];for(let v=1;v<=50;v++)s.schedule(()=>{built.push(v);return `v${v}`});await flush();disk.finish();await flush();disk.finish();await s.idle();expect(built).toEqual([1,50]);});
 it('idle() waits until the last change is on disk',async()=>{const disk=slowDisk();const s=saver(disk.save);s.schedule(()=>'a');s.schedule(()=>'b');let done=false;const idle=s.idle().then(()=>{done=true});await flush();disk.finish();await flush();expect(done).toBe(false);disk.finish();await idle;expect(done).toBe(true);});
 it('reports a failed save, and still saves later changes',async()=>{let fail=true;const saved:string[]=[];const s=saver(async d=>{if(fail){fail=false;throw Error('disk full')}saved.push(d)});await expect(s.schedule(()=>'a')).rejects.toThrow('disk full');await s.schedule(()=>'b');expect(saved).toEqual(['b']);});
 it('keeps saving after building the data throws',async()=>{const saved:string[]=[];const {schedule,idle}=saver(async d=>{saved.push(d)});await expect(schedule(()=>{throw Error('cannot serialize')})).rejects.toThrow('cannot serialize');await schedule(()=>'b');await idle();expect(saved).toEqual(['b']);});
 it('a change made after a failure is not lost',async()=>{let fail=true;const saved:string[]=[];const s=saver(async d=>{if(fail){fail=false;throw Error('disk full')}saved.push(d)});const first=s.schedule(()=>'a').catch(()=>'failed');s.schedule(()=>'b');expect(await first).toBe('failed');await s.idle();expect(saved.at(-1)).toBe('b');});
});
