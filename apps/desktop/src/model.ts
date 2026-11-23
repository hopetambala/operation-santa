export type Mode = 'home'|'pickup'|'special';
export type Status = 'new'|'verified'|'routed'|'cancelled';
export const statuses:Status[]=['new','verified','routed','cancelled'];
export type Rsvp = 'none'|'waiting'|'confirmed'|'confirmed_no_kids';
export type Attachment = {id:string;name:string;url:string;airtableId:string;kind:'image'|'pdf'|'docx'|'gdoc'|'other';state:'pending'|'downloaded'|'converted'|'failed'|'unsupported';hash:string;renders:string[];error:string;tries:number};
export type Child = {id:string;name:string;age:string;ageGroup:string;gender:string;first:string;second:string;letter:string;clean:string;translation:string;state:'pending'|'approved'|'flagged'|'do_not_print';files:Attachment[];cleanedBy:string;cleanedAt:string};
export type Family = {id:string;name:string;phone:string;email:string;street:string;unit:string;city:string;zip:string;access:string;accessTranslation:string;additionalTranslation:string;airtableStatus:string;mode:Mode;status:Status;rsvp:Rsvp;flags:string[];proposals:string[];notes:string;sourceNotes:string;rudolph:string;hardship:string;language:'en'|'es';previous:string;heard:string;additional:string;requests:string;created:string;recordId:string;children:Child[];lat:number|null;lon:number|null;geo:'pending'|'review'|'ok'|'manual'|'failed';geoSource:string;geoConfidence:number;suggestion:{lat:number;lon:number;label:string;confidence:number}|null;missing:boolean;raw:Record<string,string>;overrides:string[]};
export type Route = {number:number;label:string;ids:string[];locked:boolean;team:string;kind:'normal'|'special';pinned:string[];start?:string};
export type Team = {id:string;name:string;lead:string;phone:string;spanish:boolean;notes:string};
export type Settings = {year:number;actor:string;depot:string;depotPhone:string;lat:number;lon:number;start:string;end:string;target:number;max:number;fleet:number;fleetMode:'fixed'|'auto';base:number;extra:number;apartment:number;gate:number;toys:number;discount:number;speed:number;circuity:number;parking:number;kidsPerBag:number;serviceZips:string;labelFormat:'5163'|'5160';labelAddress:boolean;legSize:number;letterLimit:number;airtableBase:string;airtableTable:string;airtableSync:boolean;helperPackets:boolean};
export type Change = {id:string;at:string;actor:string;entity:string;field:string;before:string;after:string;reason:string};
export type PrintJob = {id:string;route:number;version:number;at:string;snapshot:string};
export type Batch = {id:string;name:string;hash:string;at:string;added:number;updated:number;missing:number};
export type GeoHit = {lat:number;lon:number;confidence:number;source:string;label:string};
export type Season = {schema:1;id:string;name:string;demo:boolean;settings:Settings;families:Family[];routes:Route[];teams:Team[];changes:Change[];prints:PrintJob[];imports:Batch[];frozen:boolean;geocache:Record<string,GeoHit>;packet?:{type:'cleanup';path:string;base:Record<string,{clean:string;state:string}>};purgedAt?:string};
// Pasadena Jaycees’ Operation Santa FAQ, “Where is Santa’s delivery range?”
const defaultServiceZips = '91001, 91006, 91007, 91011, 91012, 91020, 91021, 91024, 91025, 91030, 91066, 91077, 91101, 91103, 91104, 91105, 91106, 91107, 91108, 91775, 91776, 91778';
export const defaults:Settings = {year:2026,actor:'Coordinator',depot:'150 N Madison Ave, Pasadena, CA 91101',depotPhone:'',lat:34.1478,lon:-118.1445,start:'16:30',end:'20:30',target:195,max:225,fleet:8,fleetMode:'fixed',base:12,extra:0,apartment:0,gate:0,toys:0,discount:0,speed:18,circuity:1.35,parking:4,kidsPerBag:3,serviceZips:defaultServiceZips,labelFormat:'5163',labelAddress:true,legSize:9,letterLimit:1500,airtableBase:'',airtableTable:'',airtableSync:false,helperPackets:false};
// Settings ▸ Advanced (Hope, 2026-11-05): features that could be useful but are unproven stay in the app, off by default. With a switch off, its buttons aren't rendered.
export const features=(s:Season)=>({airtableSync:!!s.settings.airtableSync,helperPackets:!!s.settings.helperPackets});
export const flagList = ['spanish_speaker','extra_toys','adopt_a_family','do_not_share_with_volunteers','duplicate_address_ok','eaton_impacted','paper_letter','include_out_of_area'];
export const reasons = ['cancelled_by_family','no_response','duplicate','moved_to_pickup','address_fix','added_late','rebalanced','other'];
export const uid=()=>crypto.randomUUID();
export function emptySeason():Season{return {schema:1,id:uid(),name:'Operation Santa 2026',demo:false,settings:{...defaults},families:[],routes:[],teams:[],changes:[],prints:[],imports:[],frozen:false,geocache:{}}}
export const blankFamily=(id:string):Family=>({id,name:'',phone:'',email:'',street:'',unit:'',city:'Pasadena, CA',zip:'',access:'',accessTranslation:'',additionalTranslation:'',airtableStatus:'',mode:'home',status:'new',rsvp:'none',flags:[],proposals:[],notes:'',sourceNotes:'',rudolph:'prefer_not',hardship:'',language:'en',previous:'',heard:'',additional:'',requests:'',created:new Date().toISOString(),recordId:'',children:[],lat:null,lon:null,geo:'pending',geoSource:'',geoConfidence:0,suggestion:null,missing:false,raw:{},overrides:[]});
export const blankChild=(id:string):Child=>({id,name:'',age:'',ageGroup:'',gender:'',first:'',second:'',letter:'',clean:'',translation:'',state:'pending',files:[],cleanedBy:'',cleanedAt:''});
// Fills fields added after a season file was first written, so older files keep opening.
export function migrate(s:Season):Season{const legacy=s as Season&{scenarios?:unknown;dispatch?:unknown;sweep?:unknown;contacts?:unknown;outreach?:unknown};for(const k of ['scenarios','dispatch','sweep','contacts','outreach'] as const)delete legacy[k];const base=emptySeason();for(const k of Object.keys(base) as (keyof Season)[])if(s[k]===undefined&&k!=='packet'&&k!=='purgedAt')(s as unknown as Record<string,unknown>)[k]=base[k];// A season saved before the Advanced switches existed, with an Airtable base already set up, was using Sync: keep it on.
if(s.settings&&s.settings.airtableSync===undefined&&s.settings.airtableBase)s.settings.airtableSync=true;const {labelStart: _labelStart, serviceCities: _serviceCities, serviceBuffer: _serviceBuffer, ...saved} =
  (s.settings ?? {}) as Partial<Settings> & {labelStart?:number;serviceCities?:string;serviceBuffer?:number};
s.settings={...defaults,...saved};s.teams=s.teams.map(t=>{const {seats:_,...rest}=t as Team&{seats?:number};return {...rest,notes:t.notes??''}});s.routes=s.routes.map(r=>({...r,pinned:r.pinned||[],kind:r.kind==='normal'?'normal':r.kind?'special':'normal'}));s.families=s.families.map(f=>{const legacy=f as Family&{uploads?:string[]};const next={...blankFamily(f.id),...f};next.children=f.children.map(c=>{const old=c as Child&{uploads?:string[]};const child={...blankChild(c.id),...c};if(old.uploads){child.files=old.uploads.map((u,i)=>attachmentFrom(`${c.id}-legacy${i}`,u,u,''));delete (child as Child&{uploads?:string[]}).uploads}return child});delete legacy.uploads;const st=next.status as string;if(st==='delivered'||st==='missed')next.status=s.routes.some(r=>r.ids.includes(next.id))?'routed':'verified';return next});return s;}
// Route swatches. Hex stays for canvas and PDF fills, which cannot resolve a CSS variable.
// Screens use routeColor(), which points at --tk-dlite-semantic-color-route-N. model.test.ts locks the two together.
export const colors=['#1f6b5c','#a64f1d','#3a5aa0','#8f3f6e','#6b6118','#24697a','#6a4a99','#a23a33','#4a6b25','#4d5a66'];
export const routeColor=(i:number)=>`var(--tk-dlite-semantic-color-route-${(i%colors.length)+1})`;
export function clean(v:unknown):string {const s=String(v??'').trim().replace(/\r\n?/g,'\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[“”]/g,'"').replace(/[‘’]/g,"'");return /^(none|null|undefined|n\/a|out of area)$/i.test(s)?'':s;}
export const placeholder=/(^|[\s,])(none|null|undefined|n\/a)([\s,]|$)/i;
export function attachmentFrom(id:string,name:string,url:string,airtableId:string):Attachment{return {id,name,url,airtableId,kind:kindOf(name,url),state:'pending',hash:'',renders:[],error:'',tries:0}}
export function kindOf(name:string,url:string):Attachment['kind']{const n=`${name} ${url}`.toLowerCase();if(/docs\.google\.com|drive\.google\.com|\.gdoc\b/.test(n))return 'gdoc';if(/\.(jpe?g|png|heic|heif|webp|gif)\b/.test(n))return 'image';if(/\.pdf\b/.test(n))return 'pdf';if(/\.docx?\b/.test(n))return 'docx';if(!/^https?:/.test(url))return 'other';return /airtableusercontent|airtable\.com/.test(n)?'image':'other';}
export function addressLines(f:Pick<Family,'street'|'unit'|'city'|'zip'>){const unit=clean(f.unit);return [clean(f.street).replace(/\s+/g,' '),unit&&(/^(apt|unit|ste|suite|#|spc|space|bldg)/i.test(unit)?unit:`Unit ${unit}`),[clean(f.city),clean(f.zip)].filter(Boolean).join(' ')].filter(Boolean);}
export const address=(f:Pick<Family,'street'|'unit'|'city'|'zip'>)=>addressLines(f).join(', ');
// Address review's "Open in Google Maps" in the browser preview; the desktop app builds the same URL in Rust (main.rs map_url).
export const mapSearchUrl=(address:string)=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
export const navAddress=(f:Pick<Family,'street'|'city'|'zip'>)=>[clean(f.street),clean(f.city),clean(f.zip)].filter(Boolean).join(', ');
export function zip5(zip:string) {
  return /^(\d{5})(?:-\d{4})?$/.exec(String(zip??'').trim())?.[1];
}
export const building=(f:Pick<Family,'street'|'city'|'zip'>)=>`${f.street} ${f.city.split(',')[0]} ${zip5(f.zip) ?? f.zip}`.toLowerCase().replace(/\b(avenue|ave|street|st|boulevard|blvd|drive|dr|road|rd|place|pl|court|ct|lane|ln)\b/g,m=>m.slice(0,2)).replace(/[^a-z0-9]/g,'');
export const phoneDisplay=(p:string)=>{const d=p.replace(/\D/g,'').replace(/^1(?=\d{10}$)/,'');return d.length===10?`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`:clean(p);};
export const letterOf=(c:Child)=>c.state==='approved'?c.clean:c.letter;
export const bags=(f:Family,s:Settings)=>Math.max(1,Math.ceil(f.children.length/Math.max(1,s.kidsPerBag)));
export const held=(f:Family)=>f.flags.includes('do_not_share_with_volunteers');
// The team sets Airtable Status to "Issue, Investigating" while it sorts a family out (the same kids on two forms, say). Routing leaves it alone; printing its route waits for a re-import (RELEASE-UX-PLAN item 9).
export const onHold=(f:Pick<Family,'airtableStatus'>)=>/^issue,\s*investigating$/i.test((f.airtableStatus??'').trim());
const index=new WeakMap<Family[],Map<string,Family>>();
export function byId(s:Season){let m=index.get(s.families);if(!m){m=new Map(s.families.map(f=>[f.id,f]));index.set(s.families,m)}return m;}
export const family=(s:Season,id:string)=>byId(s).get(id);
export const routeOf=(s:Season,id:string)=>s.routes.find(r=>r.ids.includes(id));
export const eligible=(f:Family)=>f.mode==='home'&&f.status!=='cancelled';
export function distance(a:{lat:number;lon:number},b:{lat:number;lon:number}){const rad=Math.PI/180;const x=Math.sin((b.lat-a.lat)*rad/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin((b.lon-a.lon)*rad/2)**2;return 3958.8*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));}
export function leg(a:{lat:number;lon:number},b:{lat:number;lon:number},s:Settings,park=true){
  const miles=distance(a,b)*s.circuity;
  return {miles,min:miles/s.speed*60+(park?s.parking:0)};
}
// D2: the planned minutes per family at the door, averaged over home deliveries, so the committee can compare it with 2025's flat 10.
export function averageStop(s:Season){const homes=s.families.filter(eligible);return homes.length?homes.reduce((a,f)=>a+service(f,s.settings),0)/homes.length:0;}
export function service(f:Family,s:Settings,repeat=false){return Math.max(5,Math.min(25,s.base+s.extra*Math.max(0,f.children.length-1)+(f.unit?s.apartment:0)+(f.access?s.gate:0)+(f.flags.includes('extra_toys')?s.toys:0)-(repeat?s.discount:0)));}
export const mins=(t:string)=>{const [h,m]=t.split(':').map(Number);return h*60+m};
export const clock=(m:number)=>new Date(2026,11,24,0,Math.round(m)).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
// Round first: rounding only the minutes turned 179.6 into "2h 60m".
export const duration=(n:number)=>{const m=Math.round(n);return `${Math.floor(m/60)}h ${m%60}m`;};
// Screens use sentence case; nothing in CSS capitalizes words (RELEASE-UX-PLAN item 10).
export const sentence=(t:string)=>t?t[0].toUpperCase()+t.slice(1):t;
export const plural=(n:number,one:string,many=`${one}s`)=>`${n} ${n===1?one:many}`;
export const startOf=(r:Route,s:Season)=>r.start||s.settings.start;
function stopSuffix(index:number):string {
  let suffix = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    suffix = String.fromCharCode(97 + (n - 1) % 26) + suffix;
  }
  return suffix;
}

export function routeStats(r:Route,season:Season) {
  const st = season.settings;
  const families = r.ids.map(id => family(season,id)).filter((f):f is Family => !!f);
  const buildings = new Map<string,{number:number;count:number;visited:number}>();
  for (const f of families) {
    const key = building(f);
    const stop = buildings.get(key);
    if (stop) stop.count++;
    else buildings.set(key,{number:buildings.size+1,count:1,visited:0});
  }

  let prev = {lat:st.lat,lon:st.lon};
  let previousBuilding = '';
  let drive = 0, work = 0, miles = 0, longLeg = 0;
  const start = mins(startOf(r,season));
  const stops = families.map(f => {
    const key = building(f);
    const stop = buildings.get(key)!;
    const points = {lat:f.lat ?? prev.lat,lon:f.lon ?? prev.lon};
    const trip = previousBuilding===key ? {min:.5,miles:0} : leg(prev,points,st);
    drive += trip.min;
    miles += trip.miles;
    longLeg = Math.max(longLeg,trip.miles);
    const eta = start+drive+work;
    const firstAtBuilding = stop.visited===0;
    const svc = service(f,st,!firstAtBuilding);
    const stopLabel = String(stop.number)+(stop.count>1 ? stopSuffix(stop.visited) : '');
    stop.visited++;
    work += svc;
    previousBuilding = key;
    prev = points;
    return {f,eta,svc,legMiles:trip.miles,stopLabel,firstAtBuilding};
  });
  if (stops.length) {
    const back = leg(prev,st,st,false);
    drive += back.min;
    miles += back.miles;
  }
  return {
    stops,places:buildings.size,drive,work,miles,longLeg,total:drive+work,finish:start+drive+work,
    kids:families.reduce((n,f)=>n+f.children.length,0),
    bags:families.reduce((n,f)=>n+bags(f,st),0),
  };
}
// Only the fields that appear on paper. A change to any of them makes the route's packet stale.
export function printed(f:Family){return {id:f.id,name:f.name,phone:f.phone,address:addressLines(f),access:f.access,accessTranslation:f.accessTranslation,additionalTranslation:f.additionalTranslation,flags:f.flags,rudolph:f.rudolph,hardship:f.hardship,additional:f.additional,requests:f.requests,held:held(f),children:f.children.map(c=>({name:c.name,age:c.age,gender:c.gender,first:c.first,second:c.second,held:c.state==='do_not_print',text:letterOf(c),translation:c.translation,renders:c.files.flatMap(a=>a.renders)}))};}
// Every setting that reaches a packet: the stop and travel times behind each ETA, the North Pole on the cover and map, the phone links and the labels. A change to one makes every printed route stale and, after printing, asks for a reason.
export const paperSettings:(keyof Settings)[]=['base','extra','apartment','gate','toys','discount','speed','circuity','parking','depot','depotPhone','lat','lon','legSize','labelFormat','labelAddress','kidsPerBag'];
function printedStops(r:Route,s:Season) {
  const {stops,places}=routeStats(r,s);
  return stops.map(({f,stopLabel})=>({...printed(f),stop:`${stopLabel} of ${places}`}));
}
export function snapshot(r:Route,s:Season){const t=s.teams.find(t=>t.id===r.team);return JSON.stringify({route:{number:r.number,label:r.label,ids:r.ids,start:startOf(r,s)},team:t?{name:t.name,lead:t.lead,phone:t.phone}:null,settings:Object.fromEntries(paperSettings.map(k=>[k,s.settings[k]])),families:printedStops(r,s)});}
export function printState(r:Route,s:Season){const jobs=s.prints.filter(p=>p.route===r.number);const last=jobs.at(-1);return !last?'Not printed':last.snapshot===snapshot(r,s)?'Up to date':'Needs reprint';}
export type Diff = {added:string[];removed:string[];moved:string[];changed:{id:string;fields:string[]}[];team:boolean;route:boolean};
export function diffSincePrint(r:Route,s:Season):Diff|null{const last=s.prints.filter(p=>p.route===r.number).at(-1);if(!last)return null;let old:{route:{ids:string[]};team:unknown;families:ReturnType<typeof printedStops>};try{old=JSON.parse(last.snapshot)}catch{return null}if(!old.route)return {added:r.ids,removed:[],moved:[],changed:[],team:true,route:true};const now=JSON.parse(snapshot(r,s));const before=old.route.ids,after=r.ids;const added=after.filter(id=>!before.includes(id)),removed=before.filter(id=>!after.includes(id));const kept=after.filter(id=>before.includes(id));const oldOrder=before.filter(id=>kept.includes(id));const moved=kept.filter((id,i)=>oldOrder[i]!==id);const changed=now.families.filter((f:ReturnType<typeof printedStops>[number])=>before.includes(f.id)).map((f:ReturnType<typeof printedStops>[number])=>{const o=old.families.find(x=>x.id===f.id);const fields=o?(Object.keys(f) as (keyof typeof f)[]).filter(k=>JSON.stringify(f[k])!==JSON.stringify(o[k])):['all'];return {id:f.id,fields}}).filter((x:{fields:string[]})=>x.fields.length);return {added,removed,moved,changed,team:JSON.stringify(now.team)!==JSON.stringify(old.team),route:JSON.stringify(now.route)!==JSON.stringify(old.route)};}
const contact=/(\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})|([\w.+-]+@[\w-]+\.[\w.]+)|(https?:\/\/|www\.)/i;
// The translation prints under the letter, so a phone number in it needs a look too (RELEASE-UX-PLAN item 1). It is
// written in Airtable and can't be cleaned in the app, so the warning says where to fix it.
export const TRANSLATION_CONTACT='English translation contains a phone number, email, or link (fix it in Airtable, then import again)';
export function letterChecks(c:Child,limit:number){const t=letterOf(c);const out:string[]=[];if(contact.test(t))out.push('contains a phone number, email, or link');if(contact.test(c.translation??''))out.push(TRANSLATION_CONTACT);if(t.length>limit)out.push(`is over ${limit} characters`);if(!t.trim()&&!c.files.length)out.push('is empty');return out;}
// Phase 3 (Hope, 2026-11-05): letters are cleaned outside the app, so the import is trusted. A letter needs a look only when it has a warning, an upload that failed or can't be shown, or someone flagged it, and until someone says it looks good. Every other letter prints as imported.
// What the Letters screen says under "Needs a look" (RELEASE-UX-PLAN item 8).
export function lookReasons(c:Child,limit:number){const out=[...letterChecks(c,limit)];if(c.state==='flagged')out.unshift(c.cleanedBy?`Flagged by ${c.cleanedBy}`:'Flagged');if(c.files.some(a=>a.state==='failed'))out.push('Upload failed');if(c.files.some(a=>a.state==='unsupported'))out.push('Upload can’t be shown');return out;}
// "Looks good" approves the cleaned letter, not the translation, so a contact in the translation keeps blocking until Airtable is fixed.
export function needsLook(c:Child,limit:number){if(c.state==='do_not_print')return false;if(contact.test(c.translation??''))return true;if(c.state==='approved')return false;return c.state==='flagged'||letterChecks(c,limit).length>0||c.files.some(a=>a.state==='failed'||a.state==='unsupported');}
export type RepairPage='Families'|'Address review'|'Route planner'|'Letter cleanup';
export function familyChecks(f:Family,s:Season){const repairs=new Map<string,RepairPage>();const warnings:string[]=[];if(f.status==='cancelled')repairs.set(`#${f.id}: cancelled family is still routed.`,'Route planner');if(f.mode==='pickup')repairs.set(`#${f.id}: pickup family is still routed.`,'Route planner');if(!zip5(f.zip))repairs.set(`#${f.id}: add a valid ZIP code to the address.`,'Address review');
else if(!addressReady(f))repairs.set(`#${f.id}: review the address.`,'Address review');if([f.name,...addressLines(f),f.access].some(x=>placeholder.test(x)))repairs.set(`#${f.id}: placeholder text in the address or name.`,'Families');if(onHold(f))repairs.set(`#${f.id}: on hold in Airtable (Issue, Investigating). Resolve it there, then re-import.`,'Families');if(f.status!=='verified'&&f.status!=='routed')warnings.push(`#${f.id}: family is not verified.`);if(f.missing)warnings.push(`#${f.id}: missing from the latest import.`);if(f.children.length>6)warnings.push(`#${f.id}: ${f.children.length} children (check bag count).`);if(held(f))return {errors:[...repairs.keys()],warnings,repairs};f.children.forEach((c,i)=>{const who=`child ${i+1}`;if(c.state==='do_not_print')return;if(needsLook(c,s.settings.letterLimit))repairs.set(`#${f.id}: ${who}'s letter needs a look.`,'Letter cleanup');if(!letterOf(c).trim()&&!c.files.length)repairs.set(`#${f.id}: ${who}'s letter is empty and has no upload.`,'Letter cleanup');for(const a of c.files){if(a.state==='pending'||a.state==='downloaded')repairs.set(`#${f.id}: ${who}'s upload is still downloading.`,'Letter cleanup');if(a.state==='failed')repairs.set(`#${f.id}: ${who}'s upload failed to download (${a.error||'retry or skip it in Letter cleanup'}).`,'Letter cleanup');}if(contact.test(letterOf(c))||contact.test(c.translation??''))warnings.push(`#${f.id}: ${who}'s letter contains a phone number, email, or link.`);});const chars=f.children.reduce((n,c)=>n+letterOf(c).length+(c.translation?.length??0),0),images=f.children.reduce((n,c)=>n+c.files.reduce((m,a)=>m+a.renders.length,0),0);if(1+chars/2600+images/2>3)warnings.push(`#${f.id}: letters likely run past 3 pages.`);return {errors:[...repairs.keys()],warnings,repairs};}
export type RouteCheck={errors:string[];warnings:string[];repairs:Map<string,RepairPage>};
// Built once per checkRoutes call. The old per-stop scan walked every other route's families and re-ran building() each time: 255ms to check all routes of a 740-family / 50-route season, and Print center paid that again on every local re-render (257ms).
function buildingOwners(s:Season){const owners=new Map<string,Set<number>>();for(const r of s.routes)for(const id of r.ids){const f=family(s,id);if(!f)continue;const b=building(f);let set=owners.get(b);if(!set){set=new Set();owners.set(b,set);}set.add(r.number);}return owners;}
function checksWith(r:Route,s:Season,owners:Map<string,Set<number>>):RouteCheck{const repairs=new Map<string,RepairPage>();const warnings:string[]=[];const st=s.settings;const stats=routeStats(r,s);const team=s.teams.find(t=>t.id===r.team);if(!team)repairs.set('Assign a team.','Route planner');if(!r.ids.length)repairs.set('Route has no stops.','Route planner');
if(stats.stops.some(({f,firstAtBuilding},i)=>!firstAtBuilding&&building(f)!==building(stats.stops[i-1].f)))repairs.set('Re-sequence the route to keep families at the same building together.','Route planner');if(stats.total>st.max||stats.finish>mins(st.end)-15)repairs.set('Route exceeds the delivery limit.','Route planner');else if(stats.total>st.target)warnings.push(`Route runs ${Math.round(stats.total-st.target)} min over the target.`);if(r.kind==='normal'&&r.ids.length&&r.ids.length<6)warnings.push('Fewer than 6 stops: candidate to merge.');if(stats.longLeg>3)warnings.push(`A ${stats.longLeg.toFixed(1)} mi leg: likely outlier.`);for(const {f} of stats.stops){const c=familyChecks(f,s);for(const [message,page] of c.repairs)repairs.set(message,page);warnings.push(...c.warnings);if(r.kind==='normal'&&f.mode==='home'&&outOfArea(f,st))repairs.set(`#${f.id}: outside the service area. Review the ZIP or move the family to a special route.`,'Address review');if(f.flags.includes('spanish_speaker')&&team&&!team.spanish)warnings.push(`#${f.id}: Spanish-speaking family on a team without a Spanish speaker.`);const who=owners.get(building(f));if(who&&who.size>1)repairs.set(`#${f.id}: building is split across routes.`,'Route planner');}return {errors:[...repairs.keys()],warnings:[...new Set(warnings)],repairs};}
export function checkRoutes(s:Season,routes:Route[]){const owners=buildingOwners(s);const out=new Map<number,RouteCheck>();for(const r of routes)out.set(r.number,checksWith(r,s,owners));return out;}
export function checks(r:Route,s:Season){return checksWith(r,s,buildingOwners(s));}
export const issues=(r:Route,s:Season)=>checks(r,s).errors;
export function seasonWarnings(s:Season){const out:string[]=[];const totals=s.routes.filter(r=>r.kind==='normal'&&r.ids.length).map(r=>routeStats(r,s).total);if(totals.length>1&&Math.max(...totals)-Math.min(...totals)>45)out.push(`Route durations spread ${Math.round(Math.max(...totals)-Math.min(...totals))} min (goal ≤ 45).`);return out;}
export function audit(s:Season,entity:string,field:string,before:unknown,after:unknown,reason=''){s.changes.unshift({id:uid(),at:new Date().toISOString(),actor:s.settings.actor,entity,field,before:typeof before==='string'?before:JSON.stringify(before),after:typeof after==='string'?after:JSON.stringify(after),reason});}
// One change_log row per changed field, so the log stays readable and small.
export function auditFamily(s:Season,old:Family|null,next:Family,reason:string,what='edit'){if(!old){audit(s,next.id,`${what}: created`,null,{name:next.name,address:address(next),children:next.children.length},reason);return;}for(const k of Object.keys(next) as (keyof Family)[]){if(k==='raw'||k==='overrides')continue;const a=JSON.stringify(old[k]),b=JSON.stringify(next[k]);if(a!==b)audit(s,next.id,`${what}: ${k}`,k==='children'?`${old.children.length} children`:old[k],k==='children'?`${next.children.length} children (letters/choices updated)`:next[k],reason);}}
// R-CHG-2 and Hope's 2026-11-05 decision: ask for a reason only when the change touches a route whose packet has been printed. Freezing alone doesn't ask, and the pickup packet (saved as route 0) is not a route print.
export function needsReason(s:Season,routes:number[]){return routes.some(n=>n>0&&s.prints.some(p=>p.route===n));}
export const routesOf=(s:Season,ids:Iterable<string>)=>[...new Set([...ids].map(id=>routeOf(s,id)?.number).filter((n):n is number=>n!==undefined))];
// Settings reach paper through the packet snapshot (start time, depot, children per bag, street address on labels): only routes whose snapshot changes are touched.
export function settingsRoutes(s:Season,next:Settings){const after={...s,settings:next};return s.routes.filter(r=>snapshot(r,s)!==snapshot(r,after)).map(r=>r.number);}
export const reasonRequired='This route has been printed, so a reason is required.';
export function serviceZipCodes(st:Settings) {
  return st.serviceZips.trim().split(/[,\s]+/).filter(Boolean);
}
export function inArea(f:Pick<Family,'zip'>,st:Settings):boolean|null {
  const zip = zip5(f.zip);
  return zip ? serviceZipCodes(st).includes(zip) : null;
}
export const addressReady = (f:Family) =>
  (f.geo==='ok'||f.geo==='manual') && f.lat!==null && f.lon!==null && zip5(f.zip)!==undefined;
export const outOfArea=(f:Family,st:Settings)=>inArea(f,st)===false&&!f.flags.includes('include_out_of_area');
// LR-4: every eligible home family that is on no route, sorted into exactly one reason.
export function unrouted(s:Season){const on=new Set(s.routes.flatMap(r=>r.ids));const all=s.families.filter(f=>eligible(f)&&!on.has(f.id));const outOfArea_:Family[]=[],needsAddress:Family[]=[],noRoom:Family[]=[];for(const f of all){if(outOfArea(f,s.settings))outOfArea_.push(f);else if(!addressReady(f))needsAddress.push(f);else noRoom.push(f);}return {all,noRoom,needsAddress,outOfArea:outOfArea_};}
// The step bar's Routes count: families Routes can place now. Those waiting on an address are Import's work (RELEASE-UX-PLAN item 4).
export const routable=(s:Season)=>unrouted(s).all.filter(addressReady).length;
// Short words for the Families table (RELEASE-UX-PLAN item 7).
const flagWords:Record<string,string>={spanish_speaker:'Spanish',extra_toys:'Extra toys',adopt_a_family:'Adopt',do_not_share_with_volunteers:'Held',duplicate_address_ok:'Same address OK',eaton_impacted:'Eaton',paper_letter:'Paper letter',include_out_of_area:'Out of area OK'};
export const flagLabel=(flag:string)=>flagWords[flag]??sentence(flag.replaceAll('_',' '));
export const geoLabel=(geo:Family['geo'])=>geo==='ok'||geo==='manual'?'Pin OK':'Check pin';
// U3: why an address is in Address review, in words (was "review · demo 95%": the geocoder's state, source and score).
export const reviewReason=(f:Pick<Family,'geo'|'geoConfidence'>)=>f.geo==='review'?(f.geoConfidence?`Map wasn't sure (${Math.round(f.geoConfidence*100)}%)`:"Map wasn't sure"):f.geo==='failed'?'No match found':f.geo==='pending'?'New since last import':'Pin OK';
// U3: one plain label per Airtable column in the import preview. The form has two "Number of Children" columns.
const CHILD_PARTS:Record<string,string>={'Name':'name','Age':'age','Age Grouping':'age group','Gender':'gender','First Choice':'1st choice','Second Choice':'2nd choice','Letter to Santa':'letter','Letter to Santa (Spanish to English translation)':'letter translation','Upload Letter to Santa':'drawing'};
export const fieldLabel=(k:string)=>{if(/^Number of Children/.test(k))return 'Number of children';const c=/^Child #(\d+): (.+)$/.exec(k);if(c)return `Child ${c[1]}: ${CHILD_PARTS[c[2]]??c[2].toLowerCase()}`;return sentence(k.toLowerCase());};
export function duplicates(s:Season){const groups=new Map<string,Family[]>();for(const f of s.families){if(f.status==='cancelled'||!f.street)continue;const k=`${building(f)}|${f.unit.toLowerCase().replace(/[^a-z0-9]/g,'').replace(/^(apt|unit|ste)/,'')}`;groups.set(k,[...(groups.get(k)||[]),f]);}return [...groups.values()].filter(g=>g.length>1&&!g.every(f=>f.flags.includes('duplicate_address_ok')));}
export function nextManualId(s:Season){let n=90001;const ids=new Set(s.families.map(f=>f.id));while(ids.has(String(n)))n++;return String(n);}
export function moveGroup(s:Season,id:string,to:number,reason:string){const f=family(s,id);if(!f)throw Error('Family not found.');const from=routeOf(s,id);const target=s.routes.find(r=>r.number===to);if(!target)throw Error('Choose a route.');if(from===target)return;if(from?.locked||target.locked)throw Error('Unlock both routes before moving stops.');const ids=from?from.ids.filter(x=>{const o=family(s,x);return o&&building(o)===building(f)}):[id];if(from&&ids.some(x=>from.pinned.includes(x)))throw Error('Unpin this building before moving it.');if(needsReason(s,[from?.number??-1,to])&&!reason.trim())throw Error(reasonRequired);if(from)from.ids=from.ids.filter(x=>!ids.includes(x));target.ids.push(...ids);audit(s,ids.join(', '),'route',from?from.label:'Unrouted',target.label,reason);}
// Moves a whole building block one position earlier (-1) or later (+1) inside its route.
export function shiftStop(s:Season,id:string,dir:-1|1,reason:string){const r=routeOf(s,id);const f=family(s,id);if(!r||!f)throw Error('Stop not found.');if(r.locked)throw Error('Unlock the route before reordering.');if(needsReason(s,[r.number])&&!reason.trim())throw Error(reasonRequired);const blocks:string[][]=[];for(const x of r.ids){const o=family(s,x);const last=blocks.at(-1);if(last&&o&&building(family(s,last[0])!)===building(o))last.push(x);else blocks.push([x]);}const i=blocks.findIndex(b=>b.includes(id));const j=i+dir;if(j<0||j>=blocks.length)return;[blocks[i],blocks[j]]=[blocks[j],blocks[i]];const before=r.ids.join(',');r.ids=blocks.flat();audit(s,r.label,'stop order',before,r.ids.join(','),reason);}
export function removeStop(s:Season,id:string,reason:string){const r=routeOf(s,id);if(!r)return;if(r.locked)throw Error('Unlock the route first.');if(needsReason(s,[r.number])&&!reason.trim())throw Error(reasonRequired);r.ids=r.ids.filter(x=>x!==id);r.pinned=r.pinned.filter(x=>x!==id);audit(s,id,'route',r.label,'Unrouted',reason);}
export function demoSeason(count=96):Season{const s=emptySeason();s.demo=true;s.name='Operation Santa 2026';s.settings.depotPhone='(626) 555-0150';const names=['Rivera','Bennett','Santos','Park','Williams','Flores','Morgan','Chen','Reyes','Brooks','Patel','Garcia','Robinson','Torres','Kim','Ellis'];const streets=['Maple','Oak','Cedar','Juniper','Holly','Magnolia','Walnut','Rose'];const kidNames=['Alex','Sam','Taylor','Charlie'];for(let i=0;i<count;i++){const group=Math.floor(i/3);const angle=group*2.39996;const radius=.007+((group*17)%37)/1000;const kids=1+i%4;const f:Family={...blankFamily(String(26001+i)),name:`${names[i%names.length]} ${String.fromCharCode(65+Math.floor(i/names.length))}`,phone:'(626) 555-0100',email:`family${i+1}@example.invalid`,street:`${100+group*12} ${streets[group%8]} Ave`,unit:i%3?String(100+i%3):'',city:i%13===0?'Altadena, CA':'Pasadena, CA',zip:'91101',access:i%5===0?'Demo gate: 1234':'',mode:i%17===0?'pickup':'home',rsvp:i%17===0?'waiting':'none',status:i%11===0?'new':'verified',flags:i%7===0?['spanish_speaker']:i%9===0?['extra_toys']:[],sourceNotes:'Synthetic record. Not a real household.',rudolph:i%3===0?'yes':'no',hardship:i%10===0?'Eaton fire: able to participate':'',lat:defaults.lat+Math.sin(angle)*radius,lon:defaults.lon+Math.cos(angle)*radius*1.2,geo:i%19===0?'review':'ok',geoSource:'demo',geoConfidence:.95,children:Array.from({length:kids},(_,j)=>({...blankChild(`${26001+i}-${j+1}`),name:`${kidNames[j]} ${String.fromCharCode(65+i%26)}.`,age:String(4+(i+j)%10),first:['Books','Art supplies','Science kit','Building blocks'][(i+j)%4],second:'Board game',letter:i%9===0?'Dear Santa, I would love something to create and share with my family. You can call my mom at (626) 555-0100. Thank you!':'Dear Santa, I would love something to create and share with my family. Thank you for visiting us!',clean:'Dear Santa, I would love something to create and share with my family. Thank you for visiting us!',state:i%9===0?'pending':'approved'}))};s.families.push(f);}s.teams=Array.from({length:8},(_,i)=>({id:`team-${i+1}`,name:`Team ${i+1}`,lead:['Jamie','Casey','Drew','Robin','Jess','Avery','Cameron','Riley'][i],phone:'(626) 555-0100',spanish:i%3===0,notes:''}));return s;}
// R-MRG-6: block on errors before rendering anything.
// {season:true} is for printing every route at once: it also refuses while home families are left off every route (LR-4),
// so nobody prints the season's packets with families silently missing. Single routes and replacement pages still print.
export function printCheck(routes:Route[],s:Season,o:{season?:boolean;audit?:Map<number,RouteCheck>}={}){const errors:string[]=[],warnings:string[]=[];const repairPages=new Set<RepairPage>();if(o.season){const u=unrouted(s);if(u.all.length){repairPages.add('Route planner');if(u.needsAddress.length||u.outOfArea.length)repairPages.add('Address review');const n=(k:number,one:string,many:string)=>`${k} ${k===1?one:many}`;errors.push(`${n(u.all.length,'home delivery has','home deliveries have')} no route: ${[u.noRoom.length&&`${u.noRoom.length} don’t fit within the ${duration(s.settings.max)} limit`,u.needsAddress.length&&n(u.needsAddress.length,'needs an address','need an address'),u.outOfArea.length&&n(u.outOfArea.length,'is out of area','are out of area')].filter(Boolean).join(', ')}. Route them or record cancellations before printing every route. Add teams if the routes are full.`);}}const audited=o.audit??checkRoutes(s,routes);for(const r of routes){const c=audited.get(r.number)!;for(const page of c.repairs.values())repairPages.add(page);errors.push(...c.errors.map(e=>`${r.label}: ${e}`));warnings.push(...c.warnings.map(w=>`${r.label}: ${w}`));}return {errors,warnings,repairPages};}
