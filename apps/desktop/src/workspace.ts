export const workspaceSteps = [
  {label:'Import', pages:['Families','Address review']},
  {label:'Routes', pages:['Route planner','Teams']},
  {label:'Letters', pages:['Letter cleanup']},
  {label:'Print', pages:['Print center']},
] as const;

export function stepForPage(page:string) {
  return workspaceSteps.find(step=>step.pages.some(candidate=>candidate===page));
}
