import {describe,it,expect} from 'vitest';
import {WINDOW,clampRow,placedWindow,slideWindow,windowSpan} from './windowed';
describe('family and address list window',()=>{
 it('keeps a short list whole',()=>{expect(windowSpan(0,40,10)).toEqual({start:0,end:10});expect(slideWindow(0,10,9)).toEqual({start:0,end:10});expect(placedWindow(1,5000,64,false)).toEqual({start:0,end:1})});
 it('opens at the top of a long list',()=>{expect(windowSpan(0,40,740)).toEqual({start:0,end:WINDOW})});
 it('follows the scroll and stays on a full last page',()=>{expect(windowSpan(1000,50,740).start).toBe(Math.floor(1000/50)-8);expect(windowSpan(1e6,40,740)).toEqual({start:740-WINDOW,end:740})});
 it('steps one row so Tab can leave the mounted window without mounting the whole list',()=>{expect(slideWindow(0,740,WINDOW)).toEqual({start:1,end:WINDOW+1});expect(slideWindow(10,740,9)).toEqual({start:9,end:9+WINDOW});expect(slideWindow(740-WINDOW,740,800)).toEqual({start:740-WINDOW,end:740});expect(slideWindow(20,740,19)).toEqual({start:19,end:19+WINDOW})});
 it('starts a filtered list at the top instead of the scroll left by the previous one',()=>{expect(placedWindow(53,20000,64,true)).toEqual({start:0,end:WINDOW});expect(placedWindow(740,20000,64,false).start).toBeGreaterThan(0)});
 it('rejects a row height that is really the spacer',()=>{expect(clampRow(64)).toBe(64);expect(clampRow(160)).toBe(160);expect(clampRow(20)).toBeNull();expect(clampRow(44288)).toBeNull();expect(clampRow(Number.NaN)).toBeNull();expect(clampRow(Number.POSITIVE_INFINITY)).toBeNull()});
});
