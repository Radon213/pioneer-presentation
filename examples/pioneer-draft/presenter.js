import slides from './deck-data.js?v=revision-20261029-64';
import {getTalkStage,countSpokenWords,scriptParts} from './presenter-script.js?v=revision-20261029-64';
const $=selector=>document.querySelector(selector);
const audienceSession=new URLSearchParams(location.search).get('audience');
const channel=typeof BroadcastChannel==='function'?new BroadcastChannel(`pioneer-draft-presenter${audienceSession?':'+audienceSession:''}`):null;
const command=action=>channel?.postMessage({type:'command',action});
const clock=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
let elapsed=0,started=0,running=false,lastState=0,current=null,stageStarted=0,stageElapsed=0;
function elapsedNow(){return elapsed+(running?(performance.now()-started)/1000:0);}
function toggleTimer(){if(running){elapsed=elapsedNow();stageElapsed+=performance.now()-stageStarted;}else{started=performance.now();stageStarted=started;}running=!running;$('#pause').textContent=running?'Pause timer':elapsed?'Resume timer':'Start timer';}
function resetTimer(){elapsed=0;started=performance.now();stageStarted=started;stageElapsed=0;paintClock();}
function setSpokenText(element, text) {
 element.replaceChildren(...scriptParts(text).map(part=>{
  if(!part.strong)return document.createTextNode(part.text);
  const strong=document.createElement('strong');strong.textContent=part.text;return strong;
 }));
}
function setParagraphs(element,text){
 const sentences=text.split(/(?<=[.!?])\s+(?=(?:\*\*)?[A-Z])/);
 element.replaceChildren(...sentences.reduce((groups,sentence,index)=>{if(index%2===0)groups.push(sentence);else groups[groups.length-1]+=' '+sentence;return groups;},[]).map(text=>{const p=document.createElement('p');setSpokenText(p,text);return p;}));
}
function receive(data){
 if(data?.type!=='state'||!Number.isInteger(data.page)||!Number.isInteger(data.step))return;
 const slide=slides[data.page-1],stage=slide?.stages[data.step],spoken=getTalkStage(data.page,data.step);if(!stage||!spoken)return;
 lastState=performance.now();$('#connection').dataset.connected='true';$('#connection').textContent='Connected to audience window';$('#previous').disabled=false;$('#advance').disabled=false;
 const key=`${data.page}/${data.step}`;if(current?.key===key)return;
 current={key,page:data.page,step:data.step,seconds:spoken.seconds};stageStarted=performance.now();stageElapsed=0;$('#reference').open=false;
 $('#position').textContent=`${data.page}-${data.step+1} · Chapter ${data.page} / ${slides.length} · Stage ${data.step+1} / ${slide.stages.length}`;
 $('#allocation').textContent=`Target ${spoken.seconds} s`;
 $('#title').textContent=slide.title;$('#subtitle').textContent=stage.subtitle||slide.subtitle||'';setParagraphs($('#script'),spoken.text);$('#script').classList.toggle('is-long',countSpokenWords(spoken.text)>60);
 $('#reference-text').textContent=data.slide?.notes||stage.notes;
 const nextPage=data.step<slide.steps?data.page:data.page+1,nextStep=data.step<slide.steps?data.step+1:0;
 const nextSlide=slides[nextPage-1],nextStage=nextSlide?.stages[nextStep],nextSpoken=getTalkStage(nextPage,nextStep);
 $('#next-position').textContent=nextStage?`${nextPage}-${nextStep+1} · ${nextSpoken.seconds} s`:'';
 $('#next-title').textContent=nextStage?(nextStage.subtitle||nextSlide.subtitle||nextSlide.title):'End of presentation';
 setSpokenText($('#next-script'),nextSpoken?nextSpoken.text.split(/(?<=[.!?])\s+(?=(?:\*\*)?[A-Z])/).slice(0,2).join(' '):'Thank you.');
 paintClock();
}
function paintClock(){
 const total=elapsedNow();$('#timer').textContent=clock(total);$('#timer').dataset.over=String(total>720);
 if(!current)return;const stageSeconds=(stageElapsed+(running?performance.now()-stageStarted:0))/1000;
 $('#stage-fill').style.width=`${Math.min(100,100*stageSeconds/current.seconds)}%`;
 const ahead=slides.slice(0,current.page-1).reduce((n,s)=>n+s.duration,0)+Array.from({length:current.step},(_,i)=>getTalkStage(current.page,i).seconds).reduce((a,b)=>a+b,0);
 $('#pace').textContent=`Stage ${clock(stageSeconds)} / ${clock(current.seconds)} · planned cue ${clock(ahead)} · full talk 12:00`;
}
$('#previous').addEventListener('click',()=>command('previous'));$('#advance').addEventListener('click',()=>command('next'));$('#pause').addEventListener('click',toggleTimer);$('#reset').addEventListener('click',resetTimer);
let heldKey=null,holdTimer=0;
function releaseHold(){clearTimeout(holdTimer);heldKey=null;command('hold-stop');}
addEventListener('keydown',event=>{
 if(event.ctrlKey||event.metaKey||event.altKey||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
 if(event.target.closest('button,a,summary')&&['Enter',' '].includes(event.key))return;
 const forward=['ArrowRight','ArrowDown',' ','PageDown','Enter'].includes(event.key),back=['ArrowLeft','ArrowUp','PageUp','Backspace'].includes(event.key);
 if(forward||back){event.preventDefault();if(event.repeat||heldKey===event.key)return;releaseHold();heldKey=event.key;command(forward?'next':'previous');if(event.key.startsWith('Arrow'))holdTimer=setTimeout(()=>command(forward?'hold-next':'hold-previous'),180);}
 else if(event.key.toLowerCase()==='r'){event.preventDefault();resetTimer();}else if(event.key.toLowerCase()==='t'){event.preventDefault();toggleTimer();}
});
addEventListener('keyup',event=>{if(event.key===heldKey)releaseHold();});addEventListener('blur',releaseHold);addEventListener('pagehide',()=>{releaseHold();channel?.close();});
channel?.addEventListener('message',event=>receive(event.data));
setInterval(()=>{paintClock();const connected=lastState>0&&performance.now()-lastState<7000;$('#connection').dataset.connected=String(connected);if(!connected){$('#connection').textContent=channel?'Waiting for the audience window on this site…':'This browser does not support presenter sync.';$('#previous').disabled=true;$('#advance').disabled=true;}},250);
setInterval(()=>command('request'),2500);command('request');
