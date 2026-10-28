import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPresentationNavigation,HOLD_PLAYBACK_RATE} from '../presentation-navigation.js';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function harness(){const calls=[],gates=[],rates=[];const nav=createPresentationNavigation({perform(direction,isCurrent){calls.push(direction);return new Promise(resolve=>gates.push({resolve,isCurrent}));},setRate:rate=>rates.push(rate)});return{nav,calls,gates,rates};}
test('rapid mixed inputs preserve FIFO and never interrupt the current step',async()=>{
 const h=harness();h.nav.request(1);h.nav.request(1);h.nav.request(-1);assert.deepEqual(h.calls,[1]);assert.equal(h.nav.snapshot().pending,2);assert.ok(h.rates.at(-1)>1);
 h.gates[0].resolve(true);await flush();assert.deepEqual(h.calls,[1,1]);h.gates[1].resolve(true);await flush();assert.deepEqual(h.calls,[1,1,-1]);h.gates[2].resolve(true);await flush();assert.equal(h.nav.snapshot().running,false);assert.equal(h.rates.at(-1),1);
});
test('held input produces one step at a time and release creates no backlog',async()=>{
 const h=harness();h.nav.hold(1);assert.deepEqual(h.calls,[1]);assert.equal(h.nav.snapshot().pending,0);assert.equal(h.rates.at(-1),100);
 h.gates[0].resolve(true);await flush();assert.deepEqual(h.calls,[1,1]);h.nav.hold(0);h.gates[1].resolve(true);await flush();assert.equal(h.calls.length,2);assert.equal(h.nav.snapshot().running,false);
});
test('holding at a boundary stops instead of spinning',async()=>{
 let calls=0;const nav=createPresentationNavigation({perform:async()=>{calls++;return false;},setRate(){}});nav.hold(-1);await flush();assert.equal(calls,1);assert.equal(nav.snapshot().heldDirection,0);assert.equal(nav.snapshot().running,false);
});
test('explicit route cancellation isolates stale async work from subsequent input',async()=>{
 const h=harness();h.nav.request(1);h.nav.request(1);h.nav.cancel();h.nav.request(-1);assert.equal(h.gates[0].isCurrent(),false);h.gates[0].resolve(true);await flush();assert.deepEqual(h.calls,[1,-1]);assert.equal(h.nav.snapshot().running,true);h.gates[1].resolve(true);await flush();assert.equal(h.nav.snapshot().running,false);
});
test('motion clock changes speed continuously without jumping elapsed progress',async()=>{
 const original=globalThis.performance;let time=0;globalThis.performance={now:()=>time};try{const m=await import('../motion-clock.js?test-clock');time=10;assert.equal(m.motionNow(),10);time=15;m.setMotionRate(6);time=20;assert.equal(m.motionNow(),45);m.setMotionRate(1);time=25;assert.equal(m.motionNow(),50);}finally{globalThis.performance=original;}
});

test('held playback is 100x without repeatedly reapplying an unchanged rate',async()=>{
 const h=harness();h.nav.hold(1);assert.equal(HOLD_PLAYBACK_RATE,100);
 for(let i=0;i<12;i++){h.gates[i].resolve(true);await flush();}
 assert.equal(h.calls.length,13);assert.ok(h.calls.every(d=>d===1));assert.equal(h.nav.snapshot().pending,0);
 assert.equal(h.rates.filter(r=>r===100).length,1);
 h.nav.hold(0);h.gates[12].resolve(true);await flush();assert.equal(h.calls.length,13);assert.equal(h.rates.at(-1),1);
});
test('release finishes only the in-flight held stage without a slow tail',async()=>{
 const h=harness();h.nav.hold(1);h.nav.hold(0);
 assert.equal(h.nav.snapshot().heldDirection,0);assert.equal(h.nav.snapshot().pending,0);assert.equal(h.rates.at(-1),100);
 h.gates[0].resolve(true);await flush();assert.deepEqual(h.calls,[1]);assert.equal(h.nav.snapshot().rate,1);assert.equal(h.nav.snapshot().running,false);
});
test('opposite hold reverses at the next semantic boundary without cancelling a stage',async()=>{
 const h=harness();h.nav.hold(1);h.nav.hold(-1);assert.deepEqual(h.calls,[1]);
 assert.equal(h.gates[0].isCurrent(),true);h.gates[0].resolve(true);await flush();assert.deepEqual(h.calls,[1,-1]);
 h.nav.hold(0);h.gates[1].resolve(true);await flush();assert.deepEqual(h.calls,[1,-1]);assert.equal(h.nav.snapshot().running,false);
});
test('a boundary in the old direction does not discard a new opposite hold',async()=>{
 const h=harness();h.nav.hold(1);h.nav.hold(-1);h.gates[0].resolve(false);await flush();
 assert.deepEqual(h.calls,[1,-1]);assert.equal(h.nav.snapshot().heldDirection,-1);
 h.nav.hold(0);h.gates[1].resolve(true);await flush();
});
test('explicit taps queued during a hold keep FIFO and return to the tap speed range',async()=>{
 const h=harness();h.nav.hold(1);h.nav.request(-1);h.nav.request(1);h.nav.hold(0);
 assert.equal(h.nav.snapshot().pending,2);h.gates[0].resolve(true);await flush();assert.deepEqual(h.calls,[1,-1]);
 assert.ok(h.nav.snapshot().rate<=6);h.gates[1].resolve(true);await flush();assert.deepEqual(h.calls,[1,-1,1]);
 h.gates[2].resolve(true);await flush();assert.equal(h.nav.snapshot().rate,1);assert.equal(h.nav.snapshot().running,false);
});

// Read the active consumer imports rather than duplicate a version constant in
// this test. Different query strings create independent browser ESM instances.
async function consumerClockURL(consumer){
 const file=new URL(`../${consumer}`,import.meta.url),source=await readFile(file,'utf8');
 const match=source.match(/\bfrom\s*(['"])([^'"]*motion-clock\.js(?:[?#][^'"]*)?)\1/);
 assert.ok(match,`${consumer} must declare its shared motion-clock import`);
 return new URL(match[2],file).href;
}
test('active app and continuous viewer resolve exactly one clock module including its cache query',async()=>{
 const [appURL,viewerURL]=await Promise.all([consumerClockURL('app.js'),consumerClockURL('continuous-knee-viewer.js')]);
 assert.equal(appURL,viewerURL,'A versioned/unversioned clock split makes the UI accelerate while 3D remains at 1x');
 const [appClock,viewerClock]=await Promise.all([import(appURL),import(viewerURL)]);
 assert.equal(appClock,viewerClock,'Both active consumers must share the same ESM clock instance');
 try{appClock.setMotionRate(HOLD_PLAYBACK_RATE);assert.equal(viewerClock.getMotionRate(),100,'Viewer must observe the app’s actual held rate');}
 finally{appClock.setMotionRate(1);}
});
test('the actual shared clock accumulates 100x time and stays continuous through rate changes',async()=>{
 const original=globalThis.performance;let time=10000,clock;
 globalThis.performance={now:()=>time};
 try{
  const [appURL,viewerURL]=await Promise.all([consumerClockURL('app.js'),consumerClockURL('continuous-knee-viewer.js')]);
  assert.equal(appURL,viewerURL);clock=await import(appURL);const viewerClock=await import(viewerURL);
  clock.setMotionRate(1);const base=clock.motionNow();
  time+=5;const beforeHold=clock.motionNow();clock.setMotionRate(HOLD_PLAYBACK_RATE);
  assert.equal(clock.motionNow(),beforeHold,'Changing speed must not jump presentation time');assert.equal(viewerClock.getMotionRate(),100);
  time+=10;assert.equal(viewerClock.motionNow()-base,1005,'Ten real milliseconds at 100x must advance a full virtual second');
  time+=2;const beforeBurst=clock.motionNow();clock.setMotionRate(6);assert.equal(clock.motionNow(),beforeBurst);
  time+=4;assert.equal(clock.motionNow()-base,1229);
  clock.setMotionRate(1);time+=3;assert.equal(clock.motionNow()-base,1232);
 }finally{clock?.setMotionRate(1);globalThis.performance=original;}
});
