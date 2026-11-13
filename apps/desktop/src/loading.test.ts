import {describe,it,expect} from 'vitest';
import {loadOnce} from './loading';
describe('lazy chunk loads',()=>{
 it('loads once and shares the result',async()=>{let calls=0;const load=loadOnce(async()=>{calls++;return 'module'});expect(await Promise.all([load(),load()])).toEqual(['module','module']);expect(await load()).toBe('module');expect(calls).toBe(1)});
 it('forgets a failed load so the next open tries again',async()=>{let calls=0;const load=loadOnce(async()=>{calls++;if(calls===1)throw Error('offline');return 'module'});await expect(load()).rejects.toThrow('offline');expect(await load()).toBe('module');expect(calls).toBe(2)});
});
