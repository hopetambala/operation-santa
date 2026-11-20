export const workspaceSteps = [
  {label:'Import', pages:['Families','Address review']},
  {label:'Routes', pages:['Route planner','Teams']},
  {label:'Letters', pages:['Letter cleanup']},
  {label:'Print', pages:['Print center']},
] as const;

// Step 1 opens where its work is: Address review holds every kind of import work (addresses, duplicates, out of area,
// proposed flags), so it opens there while any is left (RELEASE-UX-PLAN item 7).
export function stepTarget(label:string,importWork:number):string {
  const step=workspaceSteps.find(s=>s.label===label);
  if(!step)return 'Families';
  return label==='Import'&&importWork>0?'Address review':step.pages[0];
}

export function stepForPage(page:string) {
  return workspaceSteps.find(step=>step.pages.some(candidate=>candidate===page));
}
