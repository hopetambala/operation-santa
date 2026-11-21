import React from 'react';
import {Check} from 'lucide-react';
import {workspaceSteps,stepForPage} from '../workspace';

type StepLabel = typeof workspaceSteps[number]['label'];

// The four steps are the tour: each shows what's left, and a check mark once it had work and none is left
// (onboarding.ts stepsDone).
export function StepBar({page,work,done,navigate,target}:{
  page:string;
  work:Record<StepLabel,string>;
  // Where each step opens, when not its first page (workspace.ts stepTarget).
  target?:(label:StepLabel)=>string;
  done?:Record<StepLabel,boolean>;
  navigate:(page:string)=>void;
}) {
  const current=stepForPage(page);
  return <nav className="nav-pills step-bar" aria-label="Season workflow">
    {workspaceSteps.map((step,index)=>
      <button type="button" key={step.label} className={[current===step?'active':'',done?.[step.label]?'done':''].filter(Boolean).join(' ')}
        aria-current={current===step?'step':undefined} onClick={()=>navigate(target?target(step.label):step.pages[0])}>
        <span className="step-number" aria-label={done?.[step.label]?`Step ${index+1}, done`:undefined}>{done?.[step.label]?<Check size={14} aria-hidden="true"/>:index+1}</span>
        <span><strong>{step.label}</strong><small>{work[step.label]}</small></span>
      </button>
    )}
  </nav>;
}
