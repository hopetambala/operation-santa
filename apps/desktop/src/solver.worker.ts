import {solve} from './solver';
import type {Season} from './model';
self.onmessage=(event:MessageEvent<{season:Season}>)=>{try{self.postMessage({result:solve(event.data.season)})}catch(e){self.postMessage({error:e instanceof Error?e.message:String(e)})}};
