import {controlTeachingFigure,updateTeachingCursor} from './control-teaching-figures.js?v=revision-20261029-59';
import {CONTROL_INLINE_MATH as MATH} from './control-math.js?v=revision-20261029-59';
import {preloadPlotMarkup,createPreloadPlotController} from './control-preload-plot.js?v=revision-20261029-59';
import {createWalkingDisplaySeries,sampleWalkingTelemetry} from './control-walking-telemetry.js?v=revision-20261029-59';
// Diagram Design's repository grammar: neutral ink, thin orthogonal connectors,
// 6 px editorial nodes and one coral focal path. The deck owns paper and serif type.
const P={ink:'#2d3142',muted:'#4f5d75',accent:'#bf4520',paper:'#fdfcf8',rule:'rgba(45,49,66,.15)',tint:'rgba(191,69,32,.065)'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const text=(x,y,s,size=28,color=P.ink,anchor='middle',extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
const path=(d,color=P.muted,width=1.8,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const arrow=(d,focus=false)=>path(d,focus?P.accent:P.muted,focus?2.2:1.8,`marker-end="url(#control-dd-${focus?'accent':'arrow'})"`);
const rect=(x,y,w,h,focus=false)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${P.paper}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${focus?P.tint:'rgba(45,49,66,.018)'}" stroke="${focus?P.accent:'rgba(45,49,66,.25)'}" stroke-width="${focus?2.1:1.4}"/>`;
const formula=(key,x,y,w,h=52,size=28)=>`<foreignObject x="${x}" y="${y}" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" class="control-inline-math" style="font-size:${size}px">${MATH[key]||''}</div></foreignObject>`;
function svg(slug,title,desc,content,w=960,h=600){return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="control-${slug}-title control-${slug}-desc" data-diagram-design="repository-example-grammar"><title id="control-${slug}-title">${esc(title)}</title><desc id="control-${slug}-desc">${esc(desc)}</desc><defs><marker id="control-dd-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0 0L8 3L0 6Z" fill="${P.muted}"/></marker><marker id="control-dd-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0 0L8 3L0 6Z" fill="${P.accent}"/></marker></defs>${content}</svg>`;}
function coil(cx,cy,r=62){let d='';for(let i=0;i<=100;i++){let a=i/100*Math.PI*4,rr=r*(.2+.8*i/100);d+=`${i?'L':'M'}${(cx+rr*Math.cos(a)).toFixed(1)} ${(cy+rr*Math.sin(a)).toFixed(1)} `;}return path(d,P.accent,3,'data-control-coil');}
function elasticState(){return svg('elastic-state','Relative motion stores elastic energy','A conceptual torsion schematic links motor and output angles to spring deformation, nonlinear torque and stored energy.',
 text(240,62,'Relative motion',34)+text(710,62,'Elastic response',34)+
 path('M240 138V416 M106 276H374',P.rule,1.5)+`<circle cx="240" cy="276" r="126" fill="none" stroke="${P.ink}" stroke-width="3"/><circle cx="240" cy="276" r="88" fill="none" stroke="${P.muted}" stroke-width="2"/>`+
 `<g data-control-input>${path('M240 276V150',P.ink,5)}<circle cx="240" cy="150" r="9" fill="${P.ink}"/></g><g data-control-output>${path('M240 276V188',P.accent,6)}<circle cx="240" cy="188" r="9" fill="${P.accent}"/></g>`+coil(240,276,52)+
 path('M108 438H150',P.ink,4)+text(164,446,'Motor',25,P.ink,'start')+path('M264 438H306',P.accent,4)+text(320,446,'Output',25,P.ink,'start')+
 formula('deformation',28,486,424,68,29)+
 arrow('M408 276H500',true)+
 path('M548 340H892 M548 340V126',P.muted,1.5)+text(908,350,'δ',30,P.muted)+text(548,104,'τs',29,P.muted)+
 `<path d="${Array.from({length:81},(_,i)=>{const u=i/80;return `${i?'L':'M'}${548+336*u} ${340-214*u*u*(1.15-.15*u)}`;}).join(' ')}" fill="none" stroke="${P.accent}" stroke-width="3.2"/><path data-control-elastic-guide fill="none" stroke="${P.rule}" stroke-width="1.4"/><circle data-control-elastic-dot cx="548" cy="340" r="8" fill="${P.accent}" stroke="${P.paper}" stroke-width="2"/>`+
 formula('torque',592,364,280,58,33)+text(720,458,'Stored elastic energy',27,P.muted)+`<rect x="552" y="480" width="336" height="12" fill="rgba(45,49,66,.07)" rx="2"/><rect data-control-energy x="552" y="480" width="0" height="12" fill="${P.accent}" rx="2"/>`+
 formula('energy',540,502,360,96,27),960,640);}
function benchmark(){return svg('benchmark','One coupled simulation','Muscle and motor commands act on the same human and implant dynamics.',
 text(250,54,'Two control paths',34)+arrow('M128 206V266Q128 274 136 274H214Q222 274 222 282V330')+arrow('M372 206V266Q372 274 364 274H286Q278 274 278 282V330',true)+
 rect(20,100,216,106)+rect(264,100,216,106,true)+text(128,146,'Muscles',29)+text(128,181,'22 actuators',24,P.muted)+text(372,146,'Implants',29)+text(372,181,'Two motors',24,P.muted)+
 rect(64,330,372,154)+text(250,378,'Coupled dynamics',31)+text(250,420,'Human + implanted knees',25,P.muted)+text(250,458,'MuJoCo · MyoAssist',24,P.muted)+
 path('M92 554H408',P.rule,1.4)+text(250,594,'One shared movement',28,P.muted),500,640);}
function teacher(){return svg('teacher','Strategy development through recorded attempts','Recorded development snapshots progress from a failed rise to a revised strategy and nominal standing; these are different development configurations.',
 text(250,52,'Develop the strategy',34)+text(250,98,'Recorded development snapshots',23,P.muted)+
 arrow('M250 242V282')+arrow('M250 402V442')+
 `<g data-control-attempt="0">${rect(36,126,428,116)}${text(84,172,'01',28,P.muted)}${text(284,171,'Human policy',29)}${path('M78 202L92 194L104 212L118 220',P.muted,2.4)}${text(284,214,'Early training · no implant',21,P.muted)}</g>`+
 `<g data-control-attempt="1">${rect(36,282,428,120)}${text(84,328,'02',28,P.muted)}${text(284,328,'Revise strategy',29)}${path('M78 368L92 350L106 340L120 340',P.muted,2.4)}${text(284,372,'Timing + constraints',23,P.muted)}</g>`+
 `<g data-control-attempt="2">${rect(36,442,428,120,true)}${text(84,488,'03',28,P.muted)}${text(284,488,'Nominal standing',29)}${path('M78 532L92 508L106 502L120 502',P.accent,2.4)}${text(284,530,'Candidate strategy',23,P.muted)}</g>`+
 text(250,616,'—',24,P.muted,'middle','data-control-value="development"'),500,650);}
function signalWave(x,y,width,height,phase=0){let d='';for(let i=0;i<=32;i++){let xx=x+i/32*width,yy=y-height*Math.sin(i/32*Math.PI*2+phase)*.35;d+=`${i?'L':'M'}${xx.toFixed(1)} ${yy.toFixed(1)} `;}return path(d,P.muted,1.7);}
function sensing(){let cells='';for(let c=0;c<3;c++)for(let r=0;r<6;r++)cells+=`<rect x="${390+c*34}" y="${192+r*22}" width="24" height="12" rx="1" fill="${r===2&&c===2?P.accent:P.muted}" opacity="${.18+.12*c}" class="control-history-sample" style="--frame:${c}"/>`;
 return svg('sensing','Estimate the spring from local signals','Encoder history, an ideal current-to-torque proxy and own command or cue history form the input; a physics observer estimates the spring state.',
 text(480,50,'Local sensing → elastic-state estimate',35)+arrow('M292 274H364')+arrow('M536 274H612',true)+
 rect(12,130,280,316)+text(152,174,'Device signals',29)+
 text(32,230,'Encoder',24,P.muted,'start')+signalWave(146,222,126,36)+text(32,304,'Current proxy',20,P.muted,'start')+signalWave(184,296,88,40,.7)+text(32,378,'Own cue / request',20,P.muted,'start')+path('M226 374H238V352H258V374H272',P.muted,1.7)+
 `<circle class="control-sample-packet" cx="302" cy="274" r="4" fill="${P.muted}"/>`+rect(364,130,172,316)+text(450,174,'History',29)+cells+text(450,374,'3 frames',25,P.muted)+formula('inputs',374,394,152,46,24)+
 rect(612,130,336,316,true)+text(780,174,'Physics observer',29)+formula('observer',628,214,304,56,26)+formula('inverse',652,310,256,56,29)+
 text(780,408,'Torque → deformation',25,P.muted)+
 path('M12 506H948',P.rule,1.3)+text(480,552,'No muscle activation or whole-body state at runtime',28,P.muted),960,600);}
function student(){let memory='';for(let r=0;r<8;r++)for(let c=0;c<8;c++)memory+=`<rect class="control-memory-cell" style="--cell:${(r+c)%5}" x="${410+c*9}" y="${384+r*9}" width="5" height="5" fill="${P.accent}" opacity="${.15+(r+c)%5*.12}"/>`;
 return svg('student','Transfer the strategy to a recurrent student','Teacher targets supervise a GRU with 64 hidden units; runtime device history produces two spring-target residuals and a fixed motor servo executes them.',
 text(480,42,'Teach a sensor-based policy',35)+path('M12 240H948',P.rule,1.4)+text(28,94,'Training',24,P.muted,'start')+
 arrow('M328 156H436',true)+arrow('M728 212V280Q728 288 720 288H448V324',true)+
 rect(28,112,300,100)+text(178,150,'Teacher targets',28)+signalWave(62,185,232,32)+
 rect(436,112,484,100,true)+text(678,148,'Imitation learning',28)+formula('loss',452,163,452,42,19)+
 text(28,292,'Runtime',24,P.muted,'start')+arrow('M256 410H344')+arrow('M540 410H612',true)+arrow('M780 410H836')+
 rect(28,324,228,176)+text(142,366,'Sensor history',28)+[0,1,2].map(i=>path(`M${68+i*64} 402V462 M${48+i*64} 414H${88+i*64} M${48+i*64} 438H${88+i*64}`,P.muted,2)).join('')+
 rect(344,324,196,176,true)+text(442,364,'GRU · 64',28)+memory+text(442,482,'10 Hz',22,P.muted)+
 rect(612,324,168,176)+text(696,366,'Spring target',25)+path('M636 452H756 M636 452V390',P.rule,1.3)+path('M636 446L668 426L700 414L732 396L756 396',P.muted,2.1)+text(696,482,'0–6 N·m',22,P.muted)+
 rect(836,324,112,176)+text(892,372,'Servo',25)+`<circle cx="892" cy="416" r="23" fill="none" stroke="${P.muted}" stroke-width="2"/>`+path('M892 396V416H908',P.muted,2)+text(892,482,'100 Hz',21,P.muted)+
 formula('memory',16,532,472,52,26)+formula('target',500,532,448,52,22),960,610);}
function evaluation(intro=false){return svg(intro?'preload-sequence':'evaluation','Spring preload during sit-to-stand','The point follows the recorded spring deflection on the implemented nonlinear torque law. Shading indicates the elastic state; the reverse reset is presentation-only.',
 text(250,42,intro?'Prepare before rising':'Preload through the rise',32)+preloadPlotMarkup()+
 text(66,526,'Command power',24,P.muted,'start')+text(460,526,'—',27,P.ink,'end','data-control-value="power"')+
 path('M66 556H460',P.rule,1.2)+text(250,598,'—',25,P.muted,'middle','data-control-value="phase"')+
 text(250,638,'40 cm chair · nominal simulation',22,P.muted),500,700);}
function walking(terminal=false){return svg(terminal?'walking-limit':'walking-cycle','Spring preload during walking','The point follows the walking record on the same simulation spring law. Power is averaged for display and its raw peak is retained.',
 text(250,42,terminal?'Preload and drive limits':'Preload for the next step',31)+preloadPlotMarkup({footer:false})+
 text(66,521,'Mean shaft power',23,P.muted,'start')+text(460,521,'—',27,P.accent,'end','data-control-value="walkingpower"')+
 `<rect x="66" y="543" width="394" height="15" rx="2" fill="rgba(45,49,66,.07)"/><rect data-control-power-bar x="66" y="543" width="0" height="15" rx="2" fill="${P.accent}"/>`+
 path('M394.3 535V567',P.ink,1.4)+text(66,589,'0.5 s mean · 5 Hz',21,P.muted,'start')+text(394.3,589,'25 W limit',22,P.muted)+
 (terminal?text(250,628,'Recorded peak —',25,P.accent,'middle','data-control-value="rawpeak"'):'')+
 text(250,657,'—',23,P.muted,'middle','data-control-value="walking"'),500,700);}

const FIGURES=[elasticState,benchmark,()=>evaluation(true),teacher,sensing,student,()=>evaluation(false),()=>walking(false),()=>walking(false),()=>walking(true)];
const finite=v=>Number.isFinite(v);
const fmt=(v,unit,d=1)=>finite(v)?`${(Math.abs(v)<.5*10**-d?0:v).toFixed(d)}${unit?' '+unit:''}`:'—';
export function createControlExplanationPanel(host){
 const root=document.createElement('div');root.className='control-explanation';root.hidden=true;root.setAttribute('aria-label','Control explanation');host.append(root);
 let current=-1,refs={},seriesRef=null,displaySeries=null,lastPowerBucket=-1,limitSeen=false,preload=null,outgoing=null,inAnimation=null,outAnimation=null;
 const clearTransition=()=>{inAnimation?.cancel();outAnimation?.cancel();inAnimation=null;outAnimation=null;outgoing?.remove();outgoing=null;};
 const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const cache=()=>{refs={};for(const el of root.querySelectorAll('[data-control-value]'))refs[el.dataset.controlValue]=el;for(const attr of ['timing-curve','input','output','elastic-guide','elastic-dot','energy','replay-progress','trace-guide','trace-dot','power-bar','coil','trace-clip'])refs[attr]=root.querySelector(`[data-control-${attr}]`);const marker=root.querySelector('[data-control-timing-marker]');refs.timingLine=marker?.querySelector('path');refs.timingDot=marker?.querySelector('circle');refs.timingLength=refs['timing-curve']?.getTotalLength?.()??0;};
 const set=(name,value)=>{const el=refs[name];if(el&&el.textContent!==value)el.textContent=value;};
 function setSeries(series){if(series===seriesRef)return;displaySeries=createWalkingDisplaySeries(series,{torqueWindowSec:.24,powerWindowSec:.5});seriesRef=series;}

 return {update({active,build=0,settled=false,progress=0,entry=null,teaching=null,telemetry={}}){root.hidden=!active;if(!active){clearTransition();return;}const b=Math.max(0,Math.min(9,build|0));if(current!==b){clearTransition();if(current>=0&&!reducedMotion()&&root.cloneNode){outgoing=root.cloneNode(true);outgoing.classList.add('control-explanation-outgoing');outgoing.setAttribute('aria-hidden','true');outgoing.removeAttribute('aria-label');host.append(outgoing);outAnimation=outgoing.animate?.([{opacity:1},{opacity:0}],{duration:180,easing:'ease-out',fill:'forwards'});if(outAnimation)outAnimation.onfinish=()=>{outgoing?.remove();outgoing=null;};}current=b;root.dataset.build=String(b);root.innerHTML=`<div class="control-explanation-figure">${controlTeachingFigure(b,teaching)||FIGURES[b]()}</div>`;seriesRef=null;displaySeries=null;lastPowerBucket=-1;limitSeen=false;cache();preload=createPreloadPlotController(root);if(!reducedMotion())inAnimation=root.animate?.([{opacity:0},{opacity:1}],{duration:280,delay:60,easing:'cubic-bezier(.2,.6,.2,1)',fill:'backwards'});}
 root.dataset.settled=String(settled);root.style.opacity=String(entry?.incomingOpacity??1);root.style.transform=entry?`translateY(${entry.incomingY}px)`:'';if(entry){inAnimation?.cancel();inAnimation=null;}root.dataset.entryOpacity=String(entry?.incomingOpacity??1);
 if(b===0){const t=reducedMotion()?1.3:finite(telemetry.elapsedSec)?telemetry.elapsedSec:progress*8;const a=26+24*Math.sin(t*.8),o=9+12*Math.sin(t*.8-.6),d=Math.max(.01,Math.min(1,(a-o)/48));refs.input?.setAttribute('transform',`rotate(${a} 240 276)`);refs.output?.setAttribute('transform',`rotate(${o} 240 276)`);const u=d,x=548+336*u,y=340-214*(u*u*(1.15-.15*u));refs['elastic-dot']?.setAttribute('cx',x);refs['elastic-dot']?.setAttribute('cy',y);refs['elastic-guide']?.setAttribute('d',`M548 ${y}H${x}V340`);refs.energy?.setAttribute('width',336*d*d);let cd='';for(let i=0;i<=100;i++){const u=i/100,aa=(o+(a-o)*u)*Math.PI/180+u*Math.PI*4,rr=52*(.2+.8*u);cd+=`${i?'L':'M'}${(240+rr*Math.cos(aa)).toFixed(2)} ${(276+rr*Math.sin(aa)).toFixed(2)} `;}refs.coil?.setAttribute('d',cd);}
 if(b===3){const i=finite(telemetry.developmentIndex)?Math.min(2,telemetry.developmentIndex):0;for(const item of root.querySelectorAll('[data-control-attempt]'))item.style.opacity=Number(item.dataset.controlAttempt)===i?'1':'.32';set('development',telemetry.developmentLabel||'Development sequence');}
 if(b===2){
  preload?.update(telemetry,'sts');
  const bucket=Math.floor(((telemetry.elapsedSec??0)+1e-7)*5);
  if(bucket!==lastPowerBucket){lastPowerBucket=bucket;set('power',telemetry.resetting?'—':fmt(telemetry.motorPowerW,'W'));}
  set('phase',telemetry.resetting?'Return to start · presentation reset':`${fmt(telemetry.timeSec,'s')} · ${telemetry.phaseLabel||'Sit-to-stand'}`);
 }
 updateTeachingCursor(root,b,telemetry,teaching);
 if(b===9){
  setSeries(telemetry.series);
  if(displaySeries){
   const time=telemetry.timeSec??seriesRef.timeSec[0],raw=sampleWalkingTelemetry(seriesRef,time),mean=sampleWalkingTelemetry(displaySeries,time),past=sampleWalkingTelemetry(seriesRef,Math.max(seriesRef.timeSec[0],time-.12)),rate=(Math.abs(raw.springDeflectionDeg)-Math.abs(past.springDeflectionDeg))/.12;
   preload?.update({...raw,elapsedSec:telemetry.elapsedSec,preloadPhase:rate>6?'Build preload':rate< -6?'Release preload':null},'walking');
   const power=mean.motorPowerW;refs['power-bar']?.setAttribute('width',finite(power)?394*Math.max(0,Math.min(1,Math.abs(power)/30)):0);
   const bucket=Math.floor(((telemetry.elapsedSec??time)+1e-7)*5),atEnd=time>=seriesRef.timeSec.at(-1)-1e-5;
   if(bucket!==lastPowerBucket||atEnd){set('walkingpower',fmt(power,'W',1));lastPowerBucket=bucket;}
   if(raw.motorPowerW>seriesRef.powerLimitW)limitSeen=true;
   set('rawpeak',`Recorded peak: ${fmt(displaySeries.rawPeak.motorPowerW,'W',2)}`);
   set('walking',`${fmt(time,'s',1)} · 1×${limitSeen?' · raw limit exceeded':''}`);
  }
 }

 },dispose(){clearTransition();root.remove();}};
}
