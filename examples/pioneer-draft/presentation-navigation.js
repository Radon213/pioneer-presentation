/** Serialize every semantic step; held input creates no queue or release backlog. */
export const HOLD_PLAYBACK_RATE=100;
const TAP_BURST_MAX_RATE=6;
export function createPresentationNavigation({perform,setRate,onState=()=>{}}){
 let queue=[],running=false,inFlight=false,held=0,epoch=0,burst=1,finishingHeld=false,lastPublished=null;
 const effectiveRate=()=>held||finishingHeld?HOLD_PLAYBACK_RATE:burst;
 const state=()=>({pending:queue.length,running,heldDirection:held,rate:effectiveRate()});
 const queuedRate=()=>queue.length?Math.min(TAP_BURST_MAX_RATE,1+queue.length*1.5):1;
 function publish(){
  const next=state();
  // Held steps share one rate. Avoid repeating expensive animation/DOM work
  // at every boundary when the actual navigation state has not changed.
  if(!lastPublished||lastPublished.rate!==next.rate)setRate(next.rate);
  if(!lastPublished||Object.keys(next).some(k=>next[k]!==lastPublished[k]))onState(next);
  lastPublished=next;
 }
 async function drain(){
  if(running)return;
  running=true;const version=epoch,isCurrent=()=>version===epoch;publish();
  try{
   while(isCurrent()&&(queue.length||held)){
    const direction=queue.length?queue.shift():held;
    finishingHeld=false;inFlight=true;publish();
    const moved=await perform(direction,isCurrent,()=>held!==0||finishingHeld);
    if(!isCurrent())break;
    inFlight=false;finishingHeld=false;
    if(!moved&&held===direction)held=0;
    if(!held)burst=queuedRate();
    publish();
   }
  }finally{
   if(isCurrent()){running=false;inFlight=false;finishingHeld=false;burst=1;publish();}
  }
 }
 return{
  request(direction){
   if(direction!==1&&direction!==-1)return;
   queue.push(direction);
   if(running||queue.length>1)burst=Math.max(burst,queuedRate());
   publish();void drain();
  },
  hold(direction){
   const next=direction===1||direction===-1?direction:0;
   // Release finishes the current held stage at speed, then generates no more.
   // An opposite hold takes effect only after the in-flight stage completes.
   if(!next&&held&&inFlight)finishingHeld=true;
   else if(next)finishingHeld=false;
   held=next;if(!running&&!held)burst=1;
   publish();if(held)void drain();
  },
  cancel(){epoch++;queue=[];held=0;running=false;inFlight=false;finishingHeld=false;burst=1;publish();},
  snapshot:state
 };
}
