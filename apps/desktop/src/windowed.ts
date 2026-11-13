import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
// Two viewports of a one-line row (~32–40px) plus 8 rows of overscan, so a fling
// doesn't go blank under the sticky top bar. Replaces slice(0, 400), which hid
// every family past 400. Node markup of all 740 rows (the usability-test season)
// was ~5ms; this window is for the DOM those rows would mount. WKWebView layout was not measured.
export const WINDOW=48;
const OVERSCAN=8;
// A data row is one or two lines. Table layout can report the spacer's height
// on the measured row; feeding that back in made the next spacer tens of millions
// of pixels and the webview died on the next filter.
const MAX_ROW=160;
export function windowSpan(intoPx:number,rowH:number,count:number,size=WINDOW){
 if(rowH<=0||count<=size)return {start:0,end:count};
 const start=Math.max(0,Math.min(count-size,Math.floor(Math.max(0,intoPx)/rowH)-OVERSCAN));
 return {start,end:start+size};
}
// Tab only reaches mounted rows. Move the window just far enough that `index` is inside it.
export function slideWindow(start:number,count:number,index:number,size=WINDOW){
 const span=Math.min(Math.max(count,0),size);
 if(span===0)return {start:0,end:0};
 let next=start;
 if(index>=start+span)next=index-span+1;
 else if(index<start)next=index;
 next=Math.max(0,Math.min(count-span,next));
 return {start:next,end:next+span};
}
// Null means "keep the previous height". A spacer-sized reading must not become the unit.
export function clampRow(h:number){return Number.isFinite(h)&&h>20&&h<=MAX_ROW?h:null;}
// After a filter or a search, ignore the scroll offset left by the previous list.
// Otherwise the new, shorter list opens on a blank spacer from the old scroll.
export function placedWindow(count:number,intoPx:number,rowH:number,stickTop:boolean,size=WINDOW){
 const n=Math.max(0,count);
 if(n===0)return {start:0,end:0};
 if(stickTop)return {start:0,end:Math.min(n,size)};
 return windowSpan(intoPx,rowH,n,size);
}
export function useWindow(count:number,resetKey?:string){
 const box=useRef<HTMLElement|null>(null);
 // Guess until the first row is measured. Too high leaves a gap; too low stacks rows.
 const [rowH,setRowH]=useState(64);
 const [span,setSpan]=useState({start:0,end:Math.min(count,WINDOW),count});
 const live=useRef({count,rowH});live.current={count,rowH};
 const pending=useRef<number|null>(null);
 const pin=useRef<number|null>(null);
 const stick=useRef(span.count!==count);
 const reset=useRef(resetKey);
 if(span.count!==count)stick.current=true;
 const update=()=>{
  const node=box.current;if(!node)return;
  const {count:n,rowH:h}=live.current;
  const into=Math.max(0,-node.getBoundingClientRect().top);
  if(stick.current&&into<=h)stick.current=false;
  let next=placedWindow(n,into,h,stick.current);
  const held=pin.current;
  if(!stick.current&&held!==null&&(held<next.start||held>=next.end))next=slideWindow(next.start,n,held);
  else if(!stick.current&&held!==null)pin.current=null;
  setSpan(cur=>cur.count===n&&cur.start===next.start&&cur.end===next.end?cur:{...next,count:n});
 };
 const updateRef=useRef(update);updateRef.current=update;
 useEffect(()=>{
  // A new search or filter should show the first match, which sits above the current scroll.
  if(resetKey!==undefined&&reset.current!==resetKey){reset.current=resetKey;stick.current=true;pin.current=null;pending.current=null;}
  if(live.current.count!==span.count)stick.current=true;
  if(stick.current){
   const node=box.current;
   // Scroll the whole panel, not the row box: the search field sits above the rows.
   if(node){const anchor=node.closest('section')??node;const bar=document.querySelector('.topbar')?.getBoundingClientRect().height??0;const top=anchor.getBoundingClientRect().top;if(top<bar)window.scrollBy(0,top-bar);}
  }
  let frame=0;const onScroll=()=>{if(pending.current!==null)return;if(!frame)frame=requestAnimationFrame(()=>{frame=0;updateRef.current();});};
  const release=()=>{pin.current=null;stick.current=false;};
  updateRef.current();
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);
  window.addEventListener('wheel',release,{passive:true});
  window.addEventListener('pointerdown',release);
  return ()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);window.removeEventListener('wheel',release);window.removeEventListener('pointerdown',release);};
 },[count,rowH,resetKey,span.count]);
 useEffect(()=>{
  const index=pending.current;
  if(index===null||!box.current)return;
  const item=box.current.querySelector<HTMLElement>(`[data-window-index="${index}"]`);
  pending.current=null;
  if(!item)return;
  const target=item.matches('a,button,input,select,textarea')?item:item.querySelector<HTMLElement>('a,button,input,select,textarea');
  target?.focus({preventScroll:true});
  target?.scrollIntoView({block:'nearest'});
 },[span.start,span.end,count]);
 const boxRef=(node:HTMLElement|null)=>{box.current=node;if(node)requestAnimationFrame(()=>updateRef.current());};
 const measure=(node:HTMLElement|null)=>{if(!node)return;const next=clampRow(node.getBoundingClientRect().height);if(next!==null)setRowH(prev=>Math.abs(prev-next)>1?next:prev);};
 const shown=span.count===count&&!stick.current?span:{start:0,end:Math.min(count,WINDOW),count};
 const onKeyDown=(e:KeyboardEvent<HTMLElement>)=>{
  if(e.key!=='Tab'||e.altKey||e.ctrlKey||e.metaKey)return;
  const root=box.current;if(!root||count<=WINDOW)return;
  const active=document.activeElement;
  if(!(active instanceof HTMLElement)||!root.contains(active))return;
  const item=active.closest<HTMLElement>('[data-window-index]');
  if(!item||!root.contains(item))return;
  const index=Number(item.dataset.windowIndex);
  if(!Number.isInteger(index))return;
  const next=e.shiftKey?index-1:index+1;
  if(next<0||next>=count||(next>=shown.start&&next<shown.end))return;
  const slid=slideWindow(shown.start,count,next);
  if(slid.start===shown.start&&slid.end===shown.end)return;
  e.preventDefault();
  pending.current=next;pin.current=next;stick.current=false;
  setSpan({...slid,count});
 };
 return {start:shown.start,end:shown.end,before:shown.start*rowH,after:Math.max(0,count-shown.end)*rowH,boxRef,measure,onKeyDown};
}
