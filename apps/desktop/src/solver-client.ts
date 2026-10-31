import type {Season} from './model';
import type {SolveResult} from './solver';
function run<T>(job:object,limit:number):Promise<T>{return new Promise((resolve,reject)=>{const worker=new Worker(new URL('./solver.worker.ts',import.meta.url),{type:'module'});const timer=setTimeout(()=>{worker.terminate();reject(Error(`Planning exceeded ${limit/1000} seconds. Reduce the scope and retry.`))},limit);worker.onmessage=e=>{clearTimeout(timer);worker.terminate();if(e.data.error)reject(Error(e.data.error));else resolve(e.data.result)};worker.onerror=()=>{clearTimeout(timer);worker.terminate();reject(Error('Route planner worker failed.'))};worker.postMessage(job)})}
export const solveInWorker=(season:Season)=>run<SolveResult>({season},60000);
