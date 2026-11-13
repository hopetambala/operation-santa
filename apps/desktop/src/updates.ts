// Automatic updates for the downloadable (DMG/Windows) builds (PRD §14). The updater plugin exists only in those
// builds; App Store, test and dev builds have none, so every call here treats a missing plugin as "no update".
export type Update={rid:number;version:string;currentVersion:string;body?:string};
type Call=<T>(cmd:string,args?:Record<string,unknown>)=>Promise<T>;
// No prompts Dec 20–26: nothing about the app should change during delivery week.
export const updateWindowOpen=(now:Date)=>!(now.getMonth()===11&&now.getDate()>=20&&now.getDate()<=26);
export async function checkForUpdate(call:Call,now:Date):Promise<Update|null>{if(!updateWindowOpen(now))return null;try{return (await call<Update|null>('plugin:updater|check',{}))??null}catch{return null}}
// Whether to offer "Check for updates" at all. App Store and TestFlight copies are updated by Apple, and the store
// rejects apps that offer their own updates; older binaries and the browser preview have no such command.
export const selfUpdating=(call:Call)=>call<boolean>('updater_built_in').then(v=>v===true,()=>false);
// Only after the coordinator clicks "Install and restart".
export async function installUpdate(u:Update,call:Call,channel:()=>unknown):Promise<void>{await call('plugin:updater|download_and_install',{rid:u.rid,onEvent:channel()});await call('restart_app')}
