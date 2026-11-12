import {useEffect,useRef,useState} from 'react';
// Two viewports of a one-line row (~32–40px) plus 8 rows of overscan, so a fling
// doesn't go blank under the sticky top bar. Replaces slice(0, 400), which hid
// every family past 400. Node markup of all 740 rows (the usability-test season)
// was ~5ms; this window is for the DOM those rows would mount. WKWebView layout was not measured.
export const WINDOW=48;
const OVERSCAN=8;
export function windowSpan(intoPx:number,rowH:number,count:number,size=WINDOW){
 if(rowH<=0||count<=size)return {start:0,end:count};
 const start=Math.max(0,Math.min(count-size,Math.floor(Math.max(0,intoPx)/rowH)-OVERSCAN));
 return {start,end:start+size};
}
export function useWindow(count:number){
 const box=useRef<HTMLElement|null>(null);
 const [rowH,setRowH]=useState(64);
 const [span,setSpan]=useState({start:0,end:Math.min(count,WINDOW),count});
 if(span.count!==count)setSpan({start:0,end:Math.min(count,WINDOW),count});
 const live=useRef({count,rowH});live.current={count,rowH};
 const update=()=>{
  const node=box.current;if(!node)return;
  const {count:n,rowH:h}=live.current;
  const into=Math.max(0,-node.getBoundingClientRect().top);
  const next=windowSpan(into,h,n);
  setSpan(cur=>cur.count===n&&cur.start===next.start&&cur.end===next.end?cur:{...next,count:n});
 };
 const updateRef=useRef(update);updateRef.current=update;
 useEffect(()=>{
  let frame=0;const onScroll=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;updateRef.current();});};
  updateRef.current();
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);
  return ()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);};
 },[count,rowH]);
 const boxRef=(node:HTMLElement|null)=>{box.current=node;if(node)requestAnimationFrame(()=>updateRef.current());};
 const measure=(node:HTMLElement|null)=>{if(!node)return;const h=node.getBoundingClientRect().height;if(h>20)setRowH(prev=>Math.abs(prev-h)>1?h:prev);};
 const shown=span.count===count?span:{start:0,end:Math.min(count,WINDOW),count};
 return {start:shown.start,end:shown.end,before:shown.start*rowH,after:Math.max(0,count-shown.end)*rowH,boxRef,measure};
}
