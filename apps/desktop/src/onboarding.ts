// First-run and returning-user helpers (ONBOARDING-AND-ENVIRONMENTS-PLAN.md §4). Pure, so they're unit tested.

// ── Recent seasons ────────────────────────────────────────────────────────────────────────────────────────────────
// The welcome window lists the seasons opened on this computer, newest first, like Xcode's and Obsidian's. Only the
// path and the season's name are kept, in this app's own webview storage (one per bundle ID, so Dev and the real app
// never share a list). Opening a recent season still goes through the season's passphrase or the keychain.
export type Recent={path:string;name:string;openedAt:number};
export const RECENTS_KEY='opsanta.recents';
const MAX_RECENTS=6;
export function addRecent(list:Recent[],r:Recent):Recent[]{return [r,...list.filter(x=>x.path!==r.path)].slice(0,MAX_RECENTS);}
export function forgetRecent(list:Recent[],path:string):Recent[]{return list.filter(x=>x.path!==path);}
export function parseRecents(raw:string|null):Recent[]{
  try{const v=JSON.parse(raw??'[]');return Array.isArray(v)?v.filter((x):x is Recent=>typeof x?.path==='string'&&typeof x?.name==='string'&&typeof x?.openedAt==='number').slice(0,MAX_RECENTS):[];}catch{return [];}
}
// localStorage can throw (blocked storage) or be empty; the welcome window works without it.
export function loadRecents():Recent[]{try{return parseRecents(localStorage.getItem(RECENTS_KEY));}catch{return [];}}
export function storeRecents(list:Recent[]){try{localStorage.setItem(RECENTS_KEY,JSON.stringify(list));}catch{/* the list is a convenience */}}
export const fileName=(path:string)=>path.split(/[\\/]/).pop()??path;
export const folderOf=(path:string)=>{const parts=path.split(/[\\/]/);parts.pop();const home=parts.slice(0,3).join('/');return (/^\/Users\/[^/]+$/.test(home)?'~'+parts.slice(3).map(p=>'/'+p).join(''):parts.join('/'))||'/';};

// ── Synced folders ────────────────────────────────────────────────────────────────────────────────────────────────
// A season file is a live encrypted database that the app locks and rewrites in place after every save. A folder that
// a sync service copies between computers can hand an older copy back or show it on two computers at once, so the app
// warns before saving a season there (Obsidian gives the same advice for vaults). Returns the service's name, or null.
export function syncedFolder(path:string):string|null{
  const p=path.replace(/\\/g,'/');
  if(/\/Library\/Mobile Documents\//.test(p))return 'iCloud Drive';
  const cloud=p.match(/\/Library\/CloudStorage\/([A-Za-z]+)/);
  if(cloud)return ({Dropbox:'Dropbox',OneDrive:'OneDrive',GoogleDrive:'Google Drive',Box:'Box'} as Record<string,string>)[cloud[1]]??'a cloud storage service';
  if(/\/(Dropbox|OneDrive[^/]*|Google Drive|My Drive|Box)\//i.test(p))return p.match(/\/(Dropbox|OneDrive|Google Drive|My Drive|Box)/i)![1].replace(/My Drive/i,'Google Drive');
  return null;
}

// ── The four steps ────────────────────────────────────────────────────────────────────────────────────────────────
// A step is done when it has had work and none is left. "Nothing to check" in an empty season isn't done.
// unrouted counts only families Routes can place (model.ts routable); printed counts route prints, not the pickup packet.
export type StepCounts={families:number;importWork:number;routes:number;unrouted:number;children:number;pendingLetters:number;printed:number;stale:number;printBlockers:number};
export function stepsDone(c:StepCounts){
  return {
    Import:c.families>0&&c.importWork===0,
    Routes:c.routes>0&&c.unrouted===0,
    Letters:c.children>0&&c.pendingLetters===0,
    Print:c.printed>0&&c.stale===0,
  };
}
// What each step has left (RELEASE-UX-PLAN item 4). Before the first print, Print counts what blocks printing, the same
// number as Print's check; after it, the routes to reprint.
export function stepWork(c:StepCounts){
  return {
    Import:`${c.importWork} to check`,
    Routes:`${c.unrouted} without a route`,
    Letters:`${c.pendingLetters} to look at`,
    // U3: before the first print, Print waits on steps 1–3 instead of re-counting their work as its own blockers.
    Print:c.printed>0?(c.stale?`${c.stale} to reprint`:'All printed'):(c.importWork||c.unrouted||c.pendingLetters)?'After steps 1–3':c.printBlockers?`${c.printBlockers} to fix`:'Ready to print',
  };
}
// One line per step for "How the four steps work" (Help menu, and once above an empty Step 1).
export const STEP_GUIDE=[
  {label:'Import',line:'Bring in the Airtable export, then fix addresses the map couldn’t find.'},
  {label:'Routes',line:'Add your Santa teams and plan routes. Lock any route you’ve set by hand.'},
  {label:'Letters',line:'Look at the letters the app flags. Everything else prints as written.'},
  {label:'Print',line:'Print each team’s packet. After a late change, only the changed pages reprint.'},
] as const;
export const TOUR_KEY='opsanta.fourStepsSeen';
export function tourSeen(){try{return localStorage.getItem(TOUR_KEY)==='1';}catch{return false;}}
export function markTourSeen(seen:boolean){try{if(seen)localStorage.setItem(TOUR_KEY,'1');else localStorage.removeItem(TOUR_KEY);}catch{/* convenience only */}}
