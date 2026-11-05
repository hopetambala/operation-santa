// A season-sized synthetic Airtable export: the 2025 form's 128 columns, its answer options, and the
// mix of formats the real export had (counts measured from the 2025 export; no real values copied).
// Every name, phone, address number and letter is invented. Seeded, so every run produces the same file.
import Papa from 'papaparse';
import {HEADERS_2025} from './fixture';

const rng=(seed:number)=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
type Rand=ReturnType<typeof rng>;
const pick=<T,>(r:Rand,xs:readonly T[])=>xs[Math.floor(r()*xs.length)];
// Weighted pick: [[value, weight], …]
const weighted=<T,>(r:Rand,xs:readonly (readonly [T,number])[])=>{let t=r()*xs.reduce((a,[,w])=>a+w,0);for(const [v,w] of xs){if((t-=w)<0)return v;}return xs[0][0];};

// The 2025 form's answer options, exactly as Airtable exported them.
export const HARDSHIP={
 home:['We are able to participate in the traditional home visit','Podemos participar en la visita tradicional a domicilio'],
 homeEaton:['We are able to participate in the traditional home visit, but were impacted by the Eaton Fire','Podemos participar en la visita tradicional a domicilio, pero nos vimos afectados por el incendio de Eaton.'],
 relocated:['We have relocated outside of the service area because of the Eaton Fire','Nos hemos trasladado fuera del área de servicio debido al incendio de Eaton'],
 noAddress:['We are unable to provide a home address due to hardship','No podemos proporcionar una dirección residencial debido a dificultades'],
} as const;
const GIFTS=['⚽ Balls or Sports Equipment','🎨 Art Supplies','💃 Dolls or Barbies','🚗 Cars or Vehicle Toys','🚧 Blocks or Construction Toys','🦸 Action Figures','🧸 Plushes or Stuffed Animals','🎵 Music','🫟 Play-Doh or Slime','🧩 Games or Puzzles','🎒 Backpack','🍏 Food or Kitchen Toys','🔬 Science','📘 Books','🎩 Dress Up'];
const GENDERS=[['Male (Masculino)',52],['Female (Femenino)',48],['Non-Binary (No binario)',0.3]] as const;
const AGES=[['Infant (Bebé)',4,'Infant'],['1',3,'Toddler'],['2',5,'Toddler'],['3',6,'Toddler'],['4',8,'Young Elementary'],['5',9,'Young Elementary'],['6',9,'Young Elementary'],['7',8,'Young Elementary'],['8',8,'Older Elementary'],['9',7,'Older Elementary'],['10',7,'Older Elementary'],['11',6,'Middle School'],['12',6,'Middle School'],['13+',9,'High School']] as const;
// Public street names; house numbers are invented. Coordinates are a box around each city, not geocodes.
const CITIES=[
 {city:'Pasadena, CA',zips:['91101','91103','91104','91105','91106','91107'],w:657,box:[34.135,34.185,-118.165,-118.085],streets:[['Garfield','Ave','N'],['Marengo','Ave','N'],['Los Robles','Ave','N'],['Lake','Ave','N'],['Hill','Ave','N'],['Allen','Ave','N'],['Fair Oaks','Ave','N'],['Raymond','Ave','N'],['Orange Grove','Blvd','N'],['Washington','Blvd','E'],['Orange Grove','Blvd','E'],['Colorado','Blvd','E'],['Villa','St','E'],['Mountain','St','E'],['Howard','St','E'],['Summit','Ave','N'],['El Molino','Ave','N'],['Mentor','Ave','N'],['Catalina','Ave','N'],['Wilson','Ave','N']]},
 {city:'Altadena, CA',zips:['91001'],w:52,box:[34.180,34.200,-118.160,-118.110],streets:[['Lake','Ave','N'],['Allen','Ave','N'],['Fair Oaks','Ave','N'],['Woodbury','Rd','E'],['Altadena','Dr','E'],['Marengo','Ave','N'],['Mendocino','St','E']]},
 {city:'South Pasadena, CA',zips:['91030'],w:8,box:[34.105,34.120,-118.165,-118.145],streets:[['Mission','St',''],['Fremont','Ave',''],['Huntington','Dr','']]},
 {city:'San Gabriel, CA',zips:['91776'],w:12,box:[34.090,34.105,-118.110,-118.090],streets:[['Del Mar','Ave','S'],['San Gabriel','Blvd','S']]},
 {city:'Arcadia, CA',zips:['91006','91007'],w:6,box:[34.125,34.140,-118.050,-118.030],streets:[['Baldwin','Ave','N'],['Huntington','Dr','W']]},
 // Beyond the service circles (2025 had one family each in El Monte and La Crescenta).
 {city:'El Monte, CA',zips:['91731'],w:4,box:[34.065,34.075,-118.035,-118.020],streets:[['Santa Anita','Ave','N']]},
 {city:'La Crescenta, CA',zips:['91214'],w:3,box:[34.225,34.235,-118.245,-118.230],streets:[['Foothill','Blvd','']]},
 {city:'Sierra Madre, CA',zips:['91024'],w:1,box:[34.160,34.168,-118.060,-118.050],streets:[['Baldwin','Ave','N']]},
] as const;
const FIRST=['Ana','Ben','Cami','Dani','Eli','Fer','Gabi','Hugo','Isa','Joel','Kai','Lupe','Mia','Noe','Oli','Paz','Quinn','Rafa','Sol','Teo','Uri','Val','Wes','Xime','Yara','Zoe'];
const LAST=['Alamo','Birch','Ceiba','Datil','Encino','Fresno','Granado','Higuera','Illex','Jacaranda','Laurel','Maple','Nogal','Olmo','Pino','Quince','Roble','Sauce','Tilo','Ulmo','Viburno','Yuca'];
const EN=[(n:string,w:string)=>`Dear Santa, my name is ${n}. This year I would really like ${w}. I have been good and I help at home. Thank you!`,(n:string,w:string)=>`Hi Santa!!\nIt's ${n}. Can I please have ${w}? I love you and the reindeer 🦌🎄`,(n:string,w:string)=>`Dear Santa, I'm ${n}. I don't need much, maybe ${w}. Please bring something for my little brother too.`];
const ES=[(n:string,w:string)=>`Querido Santa, me llamo ${n}. Este año me gustaría ${w}. Me porté bien. ¡Gracias!`,(n:string,w:string)=>`Hola Santa, soy ${n}. Quisiera ${w} por favor. Feliz Navidad 🎅`];
const WISH=['a soccer ball','a paint set','a doll house','a toy truck','building blocks','a superhero','a stuffed bunny','a keyboard','slime','a puzzle','a new backpack','a play kitchen','a microscope','chapter books','a princess dress'];

export type Geo={lat:number;lon:number}|null;
export type ExportFamily={id:string;name:string;spanish:boolean;hardship:string;away:boolean;city:string;street:string;unit:string;kids:number;uploads:string[];geo:Geo;outOfArea:boolean};
export type SyntheticExport={csv:(o?:{fresh?:boolean})=>string;families:ExportFamily[];census:Record<string,[number,number]>;uploadUrls:(o:{fresh:boolean})=>string[]};

// Upload links: an export downloaded more than a couple of hours ago carries expired links; a fresh one doesn't.
const uploadUrl=(id:string,n:number,ext:string,fresh:boolean)=>`https://v5.airtableusercontent.com/v3/u/e2e/${fresh?'fresh':'stale'}-${id}-${n}.${ext}`;

export function airtableExport(count=740,seed=2026):SyntheticExport{
 const r=rng(seed);const families:ExportFamily[]=[];const rows:Record<string,string>[]=[];const uploads:{row:Record<string,string>;key:string;files:{id:string;n:number;ext:string}[]}[]=[];
 const census:Record<string,[number,number]>={};const buildings=new Map<string,[number,number]>();
 for(let i=0;i<count;i++){
  const id=String(26001+i);const spanish=r()<0.18;const L=spanish?1:0;
  const c=weighted(r,CITIES.map(x=>[x,x.w] as const));
  const [sname,sfx,ord]=pick(r,c.streets);const house=String(100+Math.floor(r()*2400));
  // A few families share a building (apartments) and a few sign up twice.
  const shareBuilding=i>0&&r()<0.12;const prev=shareBuilding?rows[rows.length-1]:null;
  const street=prev?prev['Street Name']:sname,hn=prev?prev['House Number']:house,od=prev?prev['Ordinal']:(ord||'None'),sx=prev?prev['Suffix']:sfx,city=prev?prev['City & State']:c.city,zip=prev?prev['Zip Code']:pick(r,c.zips);
  const unitRoll=r();const unit=prev||unitRoll<0.46?weighted(r,[[String(1+Math.floor(r()*40)),55],[`Apt ${1+Math.floor(r()*30)}`,12],[`#${1+Math.floor(r()*20)}`,8],[`Unit ${String.fromCharCode(65+Math.floor(r()*6))}`,6],[String(100+Math.floor(r()*300)),19]]):'None';
  const gate=r()<0.26?weighted(r,[[`Gate code #${1000+Math.floor(r()*9000)}`,5],[`Buzz ${unit.replace(/\D/g,'')||'1'} at the front`,3],['Back house, walk down the driveway',2],['Beware of dog',1]]):'';
  const key=`${hn} ${od} ${street} ${sx} ${zip}`;const box=CITIES.find(x=>x.city===city)!.box;
  if(!buildings.has(key))buildings.set(key,[+(box[0]+r()*(box[1]-box[0])).toFixed(5),+(box[2]+r()*(box[3]-box[2])).toFixed(5)]);
  const hard=weighted(r,[['home',72],['homeEaton',14],['relocated',3],['noAddress',2]] as const);const hardship=HARDSHIP[hard][L];const away=hard==='relocated'||hard==='noAddress';
  const kids=Math.min(13,weighted(r,[[1,22],[2,30],[3,24],[4,13],[5,6],[6,3],[7,1.2],[8,0.5]] as const)+(i===count-1?5:0));
  const last=pick(r,LAST)+(i%7?'':' '+pick(r,LAST));const fam=`${last} Test`;
  const phone=weighted(r,[[`(626) 555-${String(i).padStart(4,'0').slice(-4)}`,97],[`1626555${String(i).padStart(4,'0').slice(-4)}`,2],[`(626) 555-${String(i).padStart(4,'0').slice(-4)} or (626) 555-9${String(i).padStart(3,'0').slice(-3)}`,1]]);
  const notes=weighted(r,[['',90],['Extra toys please',3],['Duplicate address is fine',3],['Family asked for Spanish speaker',2],['Do not give address to volunteers',0.5]]);
  const row:Record<string,string>={'Family Name':fam,'Number of Children (#)':String(kids),'Jaycee Notes':notes,'Entry ID':id,'Created On':`11/${1+Math.floor(i/60)}/2026 ${1+i%12}:${String(i%60).padStart(2,'0')}${i%2?'pm':'am'}`,'Created By':'Op Santa Form','Contact Email':`family${id}@example.invalid`,'Contact Phone Number':phone,
   'Full Address':`${[hn,od==='None'?'':od,street,sx].filter(Boolean).join(' ')}${unit!=='None'?` ${unit}`:''}, ${city} ${zip}`,'House Number':hn,'Ordinal':od,'Street Name':street,'Suffix':sx,'Apartment/Unit':unit,'City & State':city,'Zip Code':zip,'Gate Code / Additional Address Info':gate,'Number of Children':String(kids),
   'Previous Participation':weighted(r,[[L?'Sí':'Yes',48],['No',40],['',2]]),'Other Open Answer':'','Below the Poverty Level?':weighted(r,L?[['Sí',55],['Prefiero no contester',45]]:[['Yes',55],['Prefer not to answer',20],['No',25]]),'2025 Eaton Fire / Hardship':hardship,'Additional Information':r()<0.1?'We have a friendly dog.':'','Special Requests Notes':''};
  const files:{id:string;n:number;ext:string}[]=[];
  for(let k=1;k<=kids;k++){const p=`Child #${k}: `;const [age,,group]=weighted(r,AGES.map(a=>[a,a[1]] as const));const name=`${pick(r,FIRST)} ${last.split(' ')[0]}`;const w=Math.floor(r()*GIFTS.length);
   const up=r()<0.08;const ext=weighted(r,[['jpg',52],['jpeg',50],['png',23]] as const);
   row[p+'Name']=name;row[p+'Age']=age;row[p+'Age Grouping']=group;row[p+'Gender']=weighted(r,GENDERS);row[p+'First Choice']=GIFTS[w];row[p+'Second Choice']=GIFTS[(w+1+Math.floor(r()*13))%GIFTS.length];
   row[p+'Letter to Santa']=up&&r()<0.5?'':pick(r,L?ES:EN)(name.split(' ')[0],WISH[w]);
   if(up){files.push({id,n:k,ext});row[p+'Upload Letter to Santa']='';}}
  if(files.length)uploads.push({row,key:id,files});
  rows.push(row);
  // San Gabriel and Arcadia sit inside the San Marino and Sierra Madre circles, so they count as in the area.
  const outOfArea=['El Monte, CA','La Crescenta, CA'].includes(city);
  // The mocked Census geocoder matches 97% of addresses; the rest wait in Address review.
  const matched=r()<0.97;const g=buildings.get(key)!;if(matched)census[id]=g;
  families.push({id,name:fam,spanish:!!L,hardship,away,city,street:`${hn} ${street}`,unit,kids,uploads:files.map(f=>`${f.n}.${f.ext}`),geo:matched?{lat:g[0],lon:g[1]}:null,outOfArea});
 }
 const fill=(fresh:boolean)=>{for(const u of uploads)for(const f of u.files)u.row[`Child #${f.n}: Upload Letter to Santa`]=`drawing-${f.id}-${f.n}.${f.ext} (${uploadUrl(f.id,f.n,f.ext,fresh)})`;};
 return {families,census,
  csv:(o={})=>{fill(!!o.fresh);return '﻿'+Papa.unparse({fields:HEADERS_2025,data:rows.map(row=>HEADERS_2025.map(h=>row[h]??''))});},
  uploadUrls:({fresh})=>uploads.flatMap(u=>u.files.map(f=>uploadUrl(f.id,f.n,f.ext,fresh)))};
}
