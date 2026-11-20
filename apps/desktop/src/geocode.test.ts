import {expect,it} from 'vitest';
import {blankFamily,emptySeason} from './model';
import {storeLookupResults} from './geocode';

it('discards an address lookup if the family has moved or the coordinator has pinned it',()=>{
 const season=emptySeason();
 const original={...blankFamily('1'),street:'12 Maple Ave'};
 season.families=[{...original,street:'24 Oak St'}];
 const queries=new Map([[original.id,'12 maple ave, pasadena, ca']]);
 const hit={lat:34.1,lon:-118.1,confidence:.95,source:'census',label:'12 Maple Ave'};
 storeLookupResults(season,queries,{'1':hit});
 expect(season.families[0].geo).toBe('pending');
 expect(season.geocache).toEqual({});
 season.families=[{...original,geo:'manual',lat:34.2,lon:-118.2}];
 storeLookupResults(season,queries,{'1':hit});
 expect(season.families[0].lat).toBe(34.2);
 season.families=[original];
 storeLookupResults(season,queries,{'1':hit});
 expect(original.lat).toBe(34.1);
});
