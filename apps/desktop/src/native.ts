import {invoke as coreInvoke,isTauri} from '@tauri-apps/api/core';
import type {OpenDialogOptions,SaveDialogOptions} from '@tauri-apps/plugin-dialog';
type Invoke=<T>(cmd:string,args?:Record<string,unknown>)=>Promise<T>;
// Every IPC call goes through here. In E2E builds (VITE_E2E=1) a command WebdriverIO has mocked is answered from
// window.__wdio_mocks__ first: Tauri 2.12 freezes window.__TAURI__.core and makes __TAURI_INTERNALS__.invoke read-only,
// so the WDIO plugin cannot patch invoke itself. The check is compiled out of release builds.
export const invoke:Invoke=(cmd,args)=>{if(import.meta.env.VITE_E2E==='1'){const mock=(globalThis as {__wdio_mocks__?:Record<string,unknown>}).__wdio_mocks__?.[cmd];if(typeof mock==='function')return Promise.resolve().then(()=>mock(args));}return coreInvoke(cmd,args)};
// Same calls @tauri-apps/plugin-dialog makes, routed through invoke() above.
export const open=(options:OpenDialogOptions)=>invoke<string|null>('plugin:dialog|open',{options});
export const save=(options:SaveDialogOptions)=>invoke<string|null>('plugin:dialog|save',{options});
// Thin wrappers over the Rust commands, with in-memory fallbacks so the browser preview works on synthetic data.
export const native=isTauri();
export const toB64=(bytes:Uint8Array<ArrayBuffer>)=>{let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s);};
export const fromB64=(b64:string)=>Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
const memory=new Map<string,{mime:string;data:string}>();
async function sha(bytes:Uint8Array<ArrayBuffer>){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function assetPut(bytes:Uint8Array<ArrayBuffer>,mime:string){const data=toB64(bytes);if(native)return invoke<string>('asset_put',{data,mime});const h=await sha(bytes);memory.set(h,{mime,data});return h;}
const cache=new Map<string,string>();
export const assetPreload=(hash:string,mime:string,data:string)=>{memory.set(hash,{mime,data})};
export async function assetData(hash:string){return memory.get(hash)??(native?await invoke<{mime:string;data:string}|null>('asset_get',{hash}).catch(()=>null):null);}
export async function assetUrl(hash:string){if(cache.has(hash))return cache.get(hash)!;const a=await assetData(hash);if(!a)throw Error('A converted image is missing from this season. Re-run downloads in Letter cleanup.');const url=`data:${a.mime};base64,${a.data}`;if(cache.size>300)cache.clear();cache.set(hash,url);return url;}
export const assetPrune=(keep:string[])=>native?invoke<number>('asset_prune',{keep}):Promise.resolve(0);
export const fetchAttachment=(url:string)=>invoke<{status:number;contentType:string;data:string}>('fetch_attachment',{url});
export const airtableGet=async<T,>(path:string)=>JSON.parse(await invoke<string>('airtable_get',{path})) as T;
export const secretGet=(name:string)=>native?invoke<string|null>('secret_get',{name}):Promise.resolve(null);
export const secretSet=(name:string,value:string)=>invoke('secret_set',{name,value});
export const secretDelete=(name:string)=>invoke('secret_delete',{name});
export async function pathKey(path:string){const h=await sha(new TextEncoder().encode(path));return `passphrase:${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;}
// Webview blob downloads are unreliable inside Tauri, so desktop exports go through a save dialog and Rust.
export async function saveFile(data:BlobPart,name:string,type='text/plain'){const blob=new Blob([data],{type});if(native){const ext=name.split('.').pop()!;const path=await save({defaultPath:name,filters:[{name:ext.toUpperCase(),extensions:[ext]}]});if(!path)return false;await invoke('write_export',{path,data:toB64(new Uint8Array(await blob.arrayBuffer()))});return true;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;}
