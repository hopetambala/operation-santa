// One save at a time. Changes made while a save runs are written together afterwards, as the newest state only, and
// the data is built only for states that get written: each save rewrites the whole encrypted file.
export function saver(save:(data:string)=>Promise<unknown>){
 let next:(()=>string)|null=null;let running=false;let run:Promise<void>=Promise.resolve();let last=run;
 // `running` is set before drain starts, so a build that throws before the first await can't leave it stuck.
 async function drain(){try{while(next){const build=next;next=null;await save(build())}}finally{running=false}}
 // Resolves once this change is on disk; rejects if the save that carried it failed. A change made during a failed
 // save still gets its own attempt.
 function schedule(build:()=>string):Promise<void>{next=build;if(!running){running=true;run=drain().catch(e=>{if(next&&!running)last=schedule(next);throw e});last=run}return run}
 return {schedule,idle:():Promise<void>=>last.catch(()=>{})};
}
