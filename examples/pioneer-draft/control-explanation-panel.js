import {CONTROL_MATH} from './control-math.js?v=revision-20261029-36';
// Diagram Design example-architecture and example-process primitives:
// 6 px nodes, masked labels, orthogonal ports, neutral strokes and one coral focus.
// The academic deck's paper, serif family and scene remain owned by its shell.
const P={ink:'#2d3142',muted:'#4f5d75',accent:'#bf4520',paper:'#fdfcf8',rule:'rgba(45,49,66,.14)',tint:'rgba(191,69,32,.08)'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const text=(x,y,s,size=28,color=P.ink,anchor='middle',extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
const path=(d,color=P.muted,width=1.8,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const arrow=(d,focus=false)=>path(d,focus?P.accent:P.muted,focus?2.2:1.8,`marker-end="url(#control-dd-${focus?'accent':'arrow'})"`);
function node(x,y,w,h,title,sub='',focus=false,size=29){const lines=Array.isArray(title)?title:[title],cy=y+h/2-(sub?14:0)-(lines.length-1)*17;return `<g class="control-node"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${P.paper}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${focus?P.tint:'rgba(45,49,66,.025)'}" stroke="${focus?P.accent:'rgba(45,49,66,.25)'}" stroke-width="${focus?2.2:1.5}"/>${lines.map((s,i)=>text(x+w/2,cy+i*34+10,s,size)).join('')}${sub?text(x+w/2,y+h-22,sub,sub.length>20?20:23,P.muted):''}</g>`;}
function svg(slug,title,desc,content,w=800,h=560){return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="control-${slug}-title control-${slug}-desc" data-diagram-design="repository-example-grammar"><title id="control-${slug}-title">${esc(title)}</title><desc id="control-${slug}-desc">${esc(desc)}</desc><defs><marker id="control-dd-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0 0L8 3L0 6Z" fill="${P.muted}"/></marker><marker id="control-dd-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0 0L8 3L0 6Z" fill="${P.accent}"/></marker></defs>${content}</svg>`;}
function elasticState(){return svg('elastic-state','Control the elastic state','Motor and joint motion determine relative spring deformation and elastic torque.',
 arrow('M204 212H292',true)+arrow('M508 212H596',true)+node(12,148,192,128,'Motor','referred angle')+node(292,148,216,128,'Spring','relative angle',true)+node(596,148,192,128,'Joint','output angle')+
 path('M400 276V336',P.accent)+text(400,390,'Prepare deformation',36,P.accent)+text(400,436,'before assistance is needed',29,P.muted)+
 `<path d="M342 88A64 64 0 0 1 458 88" fill="none" stroke="${P.accent}" stroke-width="2.2" marker-end="url(#control-dd-accent)"/><circle cx="400" cy="110" r="5" fill="${P.accent}"/>`);}
function benchmark(){return svg('benchmark','Human and implant share one simulation','Separate muscle and motor commands act on the coupled musculoskeletal and implant model.',
 arrow('M116 200V256Q116 264 124 264H220Q228 264 228 272V312')+arrow('M384 200V256Q384 264 376 264H280Q272 264 272 272V312',true)+
 node(12,80,208,120,'Muscles','22 actuators')+node(280,80,208,120,'Implants','two motor inputs',true)+node(72,312,356,136,['Human–implant','interaction'],'MuJoCo · MyoAssist')+
 text(250,520,'One coupled movement',30,P.muted),500,560);}
function timing(){let content=text(400,54,'Plan the elastic state',36)+
 path('M52 386H748',P.muted,1.6)+path('M52 120V386',P.muted,1.6)+text(48,99,'Spring state',26,P.muted,'start')+
 `<path data-control-timing-curve="true" data-control-draw="true" pathLength="1" d="M52 354C100 354 125 350 150 310S216 202 278 202S336 205 374 174S426 128 458 158S500 278 560 314S660 354 748 354" fill="none" stroke="${P.accent}" stroke-width="3.2"/>`+
 [276,508].map(x=>path(`M${x} 136V386`,P.rule,1.5)).join('')+
 text(156,448,'Prepare',32)+text(392,448,'Assist',32,P.accent)+text(628,448,'Release',32)+
 text(156,488,'Store elastic energy',23,P.muted)+text(392,488,'Support extension',23,P.muted)+text(628,488,'Recover for next action',23,P.muted)+
 `<g data-control-timing-marker="true"><path d="M52 108V386" stroke="${P.ink}" stroke-width="1.4"/><circle cx="52" cy="354" r="7" fill="${P.accent}" stroke="${P.paper}" stroke-width="2"/></g>`+
 text(400,552,'Control concept · not a measured trajectory',23,P.muted);
 return svg('timing','Prepare assist and release','A conceptual timing diagram illustrates preparing the spring, assisting extension and recovering the elastic state.',content);}
function teacher(){return svg('teacher','Develop a full-state teacher','Full simulated state supports model-based teacher strategy search and produces target spring torque trajectories.',
 arrow('M260 186H344',true)+arrow('M616 186H700',true)+arrow('M824 258V376Q824 384 816 384H528')+
 arrow('M276 384H144Q136 384 136 376V258')+
 node(12,114,248,144,['Full simulation','state'],'body · muscles · implant')+
 node(344,114,272,144,['Model-based','teacher'],'strategy search',true)+
 node(700,114,248,144,['Spring torque','targets'],'bilateral assistance')+
 node(276,324,252,120,['Coupled physics'],'movement + constraints')+
 text(480,48,'First, construct a workable strategy',36)+text(480,516,'Privileged state is available during development',28,P.muted),960,560);}
function sensing(){let cells='';for(let i=0;i<3;i++)cells+=`<rect x="${344+i*24}" y="${160-i*18}" width="200" height="128" rx="6" fill="${P.paper}" stroke="${i===2?P.accent:'rgba(45,49,66,.22)'}" stroke-width="${i===2?2:1.3}"/>`;
 return svg('sensing','Operate with device-side sensing','Device signals and three time steps form 54 input features; a physics observer estimates the elastic state without muscle or whole-body sensing.',
 arrow('M260 204H336')+arrow('M592 204H676',true)+
 node(12,132,248,144,['Local device','signals'],'encoder · current proxy')+text(136,320,'Own cue + command history',24,P.muted)+
 cells+text(492,190,'Recent history',26)+text(492,232,'18 features × 3',25,P.muted)+
 node(676,132,272,144,['Physics','observer'],'estimate spring state',true)+
 path('M812 276V356',P.accent)+text(812,402,'Elastic state',31,P.accent)+
 text(480,48,'What can the implant actually observe?',36)+
 path('M32 454H928',P.rule,1.5)+text(480,504,'No muscle activation or full-body state at runtime',28,P.muted),960,560);}
function student(){return svg('student','Transfer the strategy to a student','Teacher traces train a GRU student by imitation; runtime sensor history drives a spring torque residual through the fixed motor servo.',
 `<rect x="0" y="292" width="1000" height="180" fill="rgba(45,49,66,.018)"/>`+
 path('M0 90H1000 M0 276H1000 M0 472H1000',P.rule,1.3)+
 text(16,68,'Training',27,P.muted,'start')+text(16,320,'Runtime',27,P.muted,'start')+
 arrow('M244 182H308')+arrow('M418 248V332',true)+
 arrow('M228 394H308',true)+arrow('M528 394H608',true)+arrow('M788 394H836')+arrow('M910 296V332')+text(910,278,'Base target',23,P.muted)+
 node(16,116,228,132,['Teacher','traces'],'full-state strategy')+
 node(308,116,220,132,['Imitation','learning'],'supervised transfer')+text(442,300,'weights',23,P.muted,'start')+
 node(16,332,212,124,['Sensor','history'],'54 input features')+
 node(308,332,220,124,'GRU student','temporal memory',true)+
 node(608,332,180,124,['Spring torque','residual'],'two outputs',false,26)+
 node(836,332,148,124,['Fixed motor','servo'],'limits',false,25)+
 text(500,538,'The student adjusts the spring target; the servo drives the motor.',28,P.muted),1000,570);}
function evaluation(){return svg('evaluation','Nominal sit-to-stand evaluation','A source-recorded sit-to-stand replay is accompanied by live joint and device values rather than an effort reduction headline.',
 text(250,70,'Sit-to-stand',38)+text(250,112,'Simulation replay',26,P.muted)+
 path('M24 156H476 M24 314H476 M24 470H476',P.rule,1.5)+
 text(24,208,'Time',28,P.muted,'start')+text(476,208,'—',34,P.ink,'end','data-control-value="time"')+
 text(24,270,'Task phase',28,P.muted,'start')+text(476,270,'—',29,P.ink,'end','data-control-value="phase"')+
 text(24,370,'Knee flexion',28,P.muted,'start')+text(476,370,'—',32,P.ink,'end','data-control-value="knee"')+
 text(24,432,'Command power',28,P.muted,'start')+text(476,432,'—',32,P.ink,'end','data-control-value="power"')+
 text(250,516,'40 cm chair · nominal state',26,P.muted),500,560);}
function walking(){return svg('walking','Toward continuous walking assistance','Requested and applied motor torque are compared with actual shaft power from the recorded walking diagnostic.',
 text(500,38,'Repeated steps require elastic-state preparation',34)+
 text(88,100,'Gear-output torque (N·m)',27,P.muted,'start')+path('M88 126V364H928',P.muted,1.5)+
 [0,1,2].map(i=>path(`M88 ${126+i*119}H928`,P.rule,1)).join('')+
 `<path data-control-draw="true" pathLength="1" data-control-trace="requested" fill="none" stroke="${P.ink}" stroke-width="2.6"/><path data-control-draw="true" pathLength="1" data-control-trace="applied" fill="none" stroke="${P.accent}" stroke-width="3"/><path data-control-trace-guide="true" fill="none" stroke="${P.muted}" stroke-width="1.2"/><circle data-control-trace-dot="true" cx="88" cy="364" visibility="hidden" r="7" fill="${P.accent}" stroke="${P.paper}" stroke-width="2"/><g data-control-yticks="true"></g><g data-control-xticks="true"></g>`+
 path('M88 416H132',P.ink,2.6)+text(148,425,'Requested',26,P.muted,'start')+path('M360 416H404',P.accent,3)+text(420,425,'Applied',26,P.muted,'start')+
 text(928,425,'Time (s)',26,P.muted,'end')+
 text(88,502,'Shaft power',28,P.muted,'start')+`<rect x="320" y="478" width="440" height="28" rx="2" fill="rgba(45,49,66,.06)"/><rect data-control-power-bar="true" x="320" y="478" width="0" height="28" rx="2" fill="${P.accent}"/>`+path('M686.6667 466V518',P.ink,1.5)+text(776,500,'25 W limit',26,P.muted,'start')+
 text(500,554,'—',25,P.muted,'middle','data-control-value="walking"')+text(540,465,'—',25,P.accent,'middle','data-control-value="walkingpower"')+
 text(508,250,'Loading recorded torque traces…',27,P.muted,'middle','data-control-trace-empty="true"'),1000,580);}
const FIGURES=[elasticState,benchmark,timing,teacher,sensing,student,evaluation,walking];
const CAPTIONS=[
 'Relative deformation determines spring torque.',
 'Two distinct control paths, one coupled movement.',
 'Assistance includes preparation and recovery.',
 'Develop the strategy with simulated state information.',
 'Runtime sensing is restricted to device-side signals.',
 'Imitation transfers the strategy to a recurrent student.',
 'Preliminary evaluation under nominal conditions.',
 'Walking diagnostic · actuator-limit termination at 27.19 s.'
];
const finite=v=>Number.isFinite(v);
const fmt=(v,unit,d=1)=>finite(v)?`${v.toFixed(d)}${unit?' '+unit:''}`:'—';
function normalizeSeries(series){if(!series)return null;if(Array.isArray(series)){const rows=series.filter(r=>finite(r.timeSec)&&finite(r.requestedTorqueNm)&&finite(r.appliedTorqueNm));return rows.length>1?rows:null;}const ts=series.timeSec??series.time??[],req=series.requestedTorqueNm??series.requested??[],app=series.appliedTorqueNm??series.applied??[],power=series.motorPowerW??series.power??[];const rows=Array.from(ts,(t,i)=>({timeSec:t,requestedTorqueNm:req[i],appliedTorqueNm:app[i],motorPowerW:power[i]})).filter(r=>finite(r.timeSec)&&finite(r.requestedTorqueNm)&&finite(r.appliedTorqueNm));return rows.length>1?rows:null;}
export function createControlExplanationPanel(host){
 const root=document.createElement('div');root.className='control-explanation';root.hidden=true;root.setAttribute('aria-label','Control explanation');host.append(root);
 let current=-1,refs={},seriesRef=null,rows=null,plot=null,outgoing=null,inAnimation=null,outAnimation=null;
 const clearTransition=()=>{inAnimation?.cancel();outAnimation?.cancel();inAnimation=null;outAnimation=null;outgoing?.remove();outgoing=null;};
 const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const cache=()=>{refs={};for(const el of root.querySelectorAll('[data-control-value]'))refs[el.dataset.controlValue]=el;refs.timingCurve=root.querySelector('[data-control-timing-curve]');const marker=root.querySelector('[data-control-timing-marker]');refs.timingLine=marker?.querySelector('path');refs.timingDot=marker?.querySelector('circle');refs.timingLength=refs.timingCurve?.getTotalLength?.()??0;};
 const set=(name,value)=>{const el=refs[name];if(el&&el.textContent!==value)el.textContent=value;};
 function setSeries(series){if(series===seriesRef)return;seriesRef=series;rows=normalizeSeries(series);if(!rows){plot=null;root.querySelector('[data-control-trace-dot]')?.setAttribute('visibility','hidden');return;}const minT=rows[0].timeSec,maxT=rows.at(-1).timeSec,v=rows.flatMap(r=>[r.requestedTorqueNm,r.appliedTorqueNm]),minV=Math.floor(Math.min(0,...v)/4)*4,maxV=Math.ceil(Math.max(1,...v)/4)*4,pad=0;plot={x:t=>88+(t-minT)/(maxT-minT||1)*840,y:v=>364-(v-(minV-pad))/(maxV-minV+2*pad)*238,minT,maxT};
 for(const key of ['requested','applied']){const col=key==='requested'?'requestedTorqueNm':'appliedTorqueNm',el=root.querySelector(`[data-control-trace="${key}"]`);el?.setAttribute('d',rows.map((r,i)=>`${i?'L':'M'}${plot.x(r.timeSec).toFixed(2)} ${plot.y(r[col]).toFixed(2)}`).join(' '));}
 root.querySelector('[data-control-trace-empty]')?.setAttribute('visibility','hidden');
 const yTicks=root.querySelector('[data-control-yticks]');if(yTicks)yTicks.innerHTML=Array.from({length:4},(_,i)=>{const val=minV+(maxV-minV)*i/3;return text(72,plot.y(val)+8,val.toFixed(0),23,P.muted,'end');}).join('');
 const xTicks=root.querySelector('[data-control-xticks]');if(xTicks)xTicks.innerHTML=Array.from({length:3},(_,i)=>{const val=minT+(maxT-minT)*i/2;return text(plot.x(val),396,val.toFixed(2),23,P.muted);}).join('');
 }
 return {update({active,build=0,settled=false,progress=0,telemetry={}}){root.hidden=!active;if(!active){clearTransition();return;}const b=Math.max(0,Math.min(7,build|0));if(current!==b){clearTransition();if(current>=0&&!reducedMotion()&&root.cloneNode){outgoing=root.cloneNode(true);outgoing.classList.add('control-explanation-outgoing');outgoing.setAttribute('aria-hidden','true');outgoing.removeAttribute('aria-label');host.append(outgoing);outAnimation=outgoing.animate?.([{opacity:1},{opacity:0}],{duration:220,easing:'ease-out',fill:'forwards'});if(outAnimation)outAnimation.onfinish=()=>{outgoing?.remove();outgoing=null;};}current=b;root.dataset.build=String(b);root.innerHTML=`<div class="control-explanation-figure">${FIGURES[b]()}</div><div class="control-explanation-math">${CONTROL_MATH[b]}</div><p class="control-explanation-caption">${CAPTIONS[b]}</p>`;seriesRef=null;rows=null;plot=null;cache();if(!reducedMotion())inAnimation=root.animate?.([{opacity:0},{opacity:1}],{duration:340,delay:100,easing:'cubic-bezier(.2,.6,.2,1)',fill:'backwards'});}
 root.dataset.settled='true';root.style.opacity='1';
 if(b===2){const p=Math.max(0,Math.min(1,finite(progress)?progress:0)),point=refs.timingCurve?.getPointAtLength?.(p*refs.timingLength)??{x:52+696*p,y:354};refs.timingLine?.setAttribute('d',`M${point.x} 108V386`);refs.timingDot?.setAttribute('cx',point.x);refs.timingDot?.setAttribute('cy',point.y);}
 if(b===6){set('time',fmt(telemetry.timeSec,'s'));set('phase',telemetry.phaseLabel||'—');set('knee',fmt(telemetry.kneeAngleDeg,'°'));set('power',fmt(telemetry.motorPowerW,'W'));}
 if(b===7){setSeries(telemetry.series);if(plot){const time=finite(telemetry.timeSec)?telemetry.timeSec:plot.minT;let row=rows[0];for(const candidate of rows){if(candidate.timeSec>time)break;row=candidate;}const x=plot.x(row.timeSec),y=plot.y(row.appliedTorqueNm);root.querySelector('[data-control-trace-guide]')?.setAttribute('d',`M${x} 126V364`);const dot=root.querySelector('[data-control-trace-dot]');dot?.setAttribute('visibility','visible');dot?.setAttribute('cx',x);dot?.setAttribute('cy',y);const power=finite(telemetry.motorPowerW)?telemetry.motorPowerW:row.motorPowerW;root.querySelector('[data-control-power-bar]')?.setAttribute('width',finite(power)?440*Math.max(0,Math.min(1,Math.abs(power)/30)):0);set('walkingpower',fmt(power,'W',2)+(power>25?' · over limit':''));set('walking',`${fmt(row.timeSec,'s',2)}  ·  requested ${fmt(row.requestedTorqueNm,'N·m')}  ·  applied ${fmt(row.appliedTorqueNm,'N·m')}`);}}
 },dispose(){clearTransition();root.remove();}};
}
