// One shared load for a lazy chunk. A success is kept; a failure is forgotten, so the next open loads again
// instead of replaying the error.
export function loadOnce<T>(load:()=>Promise<T>){
 let pending:Promise<T>|undefined;
 return ():Promise<T>=>pending??=load().catch(err=>{pending=undefined;throw err;});
}
