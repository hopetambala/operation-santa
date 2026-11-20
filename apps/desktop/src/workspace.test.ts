import {describe,expect,it} from 'vitest';
import {workspaceSteps,stepForPage} from './workspace';

describe('four-step workspace',()=>{
  it('opens the four steps in coordinator order',()=>{
    expect(workspaceSteps.map(step=>[step.label,step.pages[0]])).toEqual([
      ['Import','Families'],['Routes','Route planner'],['Letters','Letter cleanup'],['Print','Print center']
    ]);
  });
  it('identifies a step from its secondary page and keeps season tools separate',()=>{
    expect(stepForPage('Address review')?.label).toBe('Import');
    expect(stepForPage('Teams')?.label).toBe('Routes');
    expect(stepForPage('Settings')).toBeUndefined();
  });
});
