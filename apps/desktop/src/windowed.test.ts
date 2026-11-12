import {describe,it,expect} from 'vitest';
import {WINDOW,windowSpan} from './windowed';
describe('family and address list window',()=>{
 it('keeps a short list whole',()=>{expect(windowSpan(0,40,10)).toEqual({start:0,end:10})});
 it('opens at the top of a long list',()=>{expect(windowSpan(0,40,740)).toEqual({start:0,end:WINDOW})});
 it('follows the scroll and stays on a full last page',()=>{expect(windowSpan(1000,50,740).start).toBe(Math.floor(1000/50)-8);expect(windowSpan(1e6,40,740)).toEqual({start:740-WINDOW,end:740})});
});
