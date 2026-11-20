import React from 'react';
import {workspaceSteps,stepForPage} from '../workspace';

type StepLabel = typeof workspaceSteps[number]['label'];

export function StepBar({page,work,navigate}:{
  page:string;
  work:Record<StepLabel,string>;
  navigate:(page:string)=>void;
}) {
  const current=stepForPage(page);
  return <nav className="nav-pills step-bar" aria-label="Season workflow">
    {workspaceSteps.map((step,index)=>
      <button type="button" key={step.label} className={current===step?'active':''}
        aria-current={current===step?'step':undefined} onClick={()=>navigate(step.pages[0])}>
        <span className="step-number">{index+1}</span>
        <span><strong>{step.label}</strong><small>{work[step.label]}</small></span>
      </button>
    )}
  </nav>;
}
