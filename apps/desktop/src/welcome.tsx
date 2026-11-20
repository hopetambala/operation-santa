import React,{useState} from 'react';
import {Plus,FolderOpen,BookOpen,X,Upload,ArrowRight,Clock} from 'lucide-react';
import {Button,BrandMark} from './ui';
import {type Recent,STEP_GUIDE,fileName,folderOf} from './onboarding';

// The welcome window (ONBOARDING-AND-ENVIRONMENTS-PLAN.md §4): what Xcode and Obsidian show when nothing is open. Left,
// the app and its three actions; right, the seasons opened on this computer. The window itself shrinks to fit (main.rs
// window_mode), and comes back whenever the season is locked or closed.
export function Welcome({version,recents,onNew,onOpen,onOpenRecent,onForget,onGuide,desktop}:{
  version:string;recents:Recent[];onNew:()=>void;onOpen:()=>void;onOpenRecent:(r:Recent)=>void;onForget:(r:Recent)=>void;onGuide:()=>void;desktop:boolean;
}){
  return <section className="welcome" aria-labelledby="page-title">
    <div className="welcome-main">
      <span className="welcome-icon"><BrandMark size={88}/></span>
      <h1 id="page-title" tabIndex={-1}>Operation Santa</h1>
      <p className="welcome-version">{version?`Version ${version}`:'Pasadena Jaycees'}</p>
      <div className="welcome-actions">
        <button type="button" className="welcome-action" onClick={onNew}><Plus size={18}/><span><strong>New season…</strong><small>Start this year’s encrypted season file</small></span></button>
        <button type="button" className="welcome-action" onClick={onOpen}><FolderOpen size={18}/><span><strong>Open season…</strong><small>Pick a season file on this computer</small></span></button>
        <button type="button" className="welcome-action" onClick={onGuide}><BookOpen size={18}/><span><strong>Open the guide</strong><small>Step-by-step help for every role</small></span></button>
      </div>
      {!desktop&&<p className="welcome-note">This browser preview uses fictional families only. Real seasons open in the desktop app.</p>}
    </div>
    <div className="welcome-recents">
      <h2>Recent seasons</h2>
      {recents.length?<ul>{recents.map(r=><li key={r.path}>
        <button type="button" className="recent" onClick={()=>onOpenRecent(r)} title={r.path}>
          <Clock size={16}/><span><strong>{fileName(r.path).replace(/\.opsanta$/i,'')}</strong><small>{folderOf(r.path)}</small></span>
        </button>
        <button type="button" className="icon-btn recent-forget" aria-label={`Remove ${fileName(r.path)} from recent seasons`} onClick={()=>onForget(r)}><X size={14}/></button>
      </li>)}</ul>:<p className="welcome-empty">Seasons you open on this computer show up here.</p>}
    </div>
  </section>;
}

// "How the four steps work": once above an empty Step 1, and again from Help ▸ How the Four Steps Work. The step bar
// and each step's empty state carry the rest, as Apple's onboarding guidance prefers to a slideshow.
export function FourSteps({onDone}:{onDone:()=>void}){
  return <section className="four-steps" aria-labelledby="four-steps-title">
    <div className="four-steps-head"><h2 id="four-steps-title">How the four steps work</h2><Button onClick={onDone}>Got it</Button></div>
    <ol>{STEP_GUIDE.map((s,i)=><li key={s.label}><span className="step-number">{i+1}</span><span><strong>{s.label}</strong><small>{s.line}</small></span></li>)}</ol>
    <p className="four-steps-foot">The bar at the top shows what’s left in each step, with a check mark when a step is done. Find this again under Help.</p>
  </section>;
}

// Step 1 before anything is imported: one obvious action. Drop the Airtable export here or choose it.
export function ImportStart({onChoose,onFile,disabled}:{onChoose:()=>void;onFile:(f:File)=>void;disabled:boolean}){
  const [over,setOver]=useState(false);
  const drop=(e:React.DragEvent)=>{e.preventDefault();setOver(false);const f=e.dataTransfer.files?.[0];if(f&&!disabled)onFile(f);};
  return <section className={`import-start${over?' over':''}`} onDragOver={e=>{e.preventDefault();if(!disabled)setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={drop} aria-labelledby="import-start-title">
    <Upload size={32}/>
    <h2 id="import-start-title">Bring in this year’s sign-ups</h2>
    <p>In Airtable, open the Letters table and download it as CSV. Drop the file here, or choose it.</p>
    <Button primary disabled={disabled} onClick={onChoose}><Upload size={16}/>Choose the Airtable export…</Button>
    <small>CSV or Excel. Importing the same export again updates families instead of adding them twice.</small>
  </section>;
}

// The next step can't start until an earlier one has something in it.
export function StepFirst({title,detail,action,onAction}:{title:string;detail:string;action:string;onAction:()=>void}){
  return <section className="step-first"><div><h2>{title}</h2><p>{detail}</p></div><Button primary onClick={onAction}>{action}<ArrowRight size={16}/></Button></section>;
}
