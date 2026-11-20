import {describe,expect,it} from 'vitest';
import {blankChild,lookReasons,mapSearchUrl,type Child} from './model';
// RELEASE-UX-PLAN items 6 and 8.
const kid=(o:Partial<Child>={})=>({...blankChild('1-1'),letter:'Dear Santa, a bike please.',...o});
describe('Why a letter needs a look',()=>{
 it('names the warning',()=>{expect(lookReasons(kid({letter:'Call my mom at (626) 555-0101'}),1500)).toContain('contains a phone number, email, or link');});
 it('names who flagged it, and a failed upload',()=>{expect(lookReasons(kid({state:'flagged',cleanedBy:'Robin'}),1500)).toContain('Flagged by Robin');expect(lookReasons(kid({files:[{id:'a',name:'x.jpg',url:'',airtableId:'',kind:'image',state:'failed',hash:'',renders:[],error:'',tries:1}]}),1500)).toContain('Upload failed');});
 it('says nothing for a letter that prints as imported',()=>{expect(lookReasons(kid(),1500)).toEqual([]);});
});
describe('Open in Google Maps',()=>{
 it('searches the address only',()=>{expect(mapSearchUrl('100 N Garfield Ave, Pasadena, CA 91101')).toBe('https://www.google.com/maps/search/?api=1&query=100%20N%20Garfield%20Ave%2C%20Pasadena%2C%20CA%2091101');});
});
