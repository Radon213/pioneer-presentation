import test from 'node:test';
import assert from 'node:assert/strict';
import slides from '../deck-data.js';
import {talk,getTalkStage,talkSeconds,talkWords,countSpokenWords,spokenText,scriptParts} from '../presenter-script.js';
test('spoken script covers every audience stage and keeps the twelve-minute chapter budget',()=>{
 assert.equal(talk.length,slides.length);assert.equal(talkSeconds,720);
 for(const [i,slide] of slides.entries()){
  assert.equal(talk[i].length,slide.stages.length,`Chapter ${i+1}`);
  assert.equal(talk[i].reduce((n,r)=>n+r[0],0),slide.duration);
  for(const [j,row] of talk[i].entries()){
   assert.ok(row[0]>0);assert.ok(row[1].trim().length>20);assert.equal(getTalkStage(i+1,j).cue,`${i+1}-${j+1}`);
   assert.ok(!row[1].includes('한국어:'));
  }
 }
 assert.ok(talkWords>1000&&talkWords<1450,'leaves room for a clear 12-minute delivery');
 assert.equal(getTalkStage(7,0),null);assert.equal(getTalkStage(1,1),null);
});
test('spoken results retain the limits of the saved standing and walking evidence',()=>{
 assert.match(spokenText(getTalkStage(5,5).text),/reinforcement-learning pilot did not show an added benefit/);
 assert.match(spokenText(getTalkStage(5,6).text),/not a robustness test/);
 assert.match(spokenText(getTalkStage(5,7).text),/different teacher/);
 assert.match(spokenText(getTalkStage(5,9).text),/cannot call this a completed walking result/);
 assert.match(spokenText(getTalkStage(4,5).text),/separate analyses/);
});

test('speaker emphasis stays plain-text safe and does not count pause cues as words',()=>{
 const cue='Use **spring preload** / before the rise.';
 assert.equal(spokenText(cue),'Use spring preload before the rise.');
 assert.equal(countSpokenWords(cue),6);
 assert.deepEqual(scriptParts(cue),[
  {text:'Use ',strong:false},{text:'spring preload',strong:true},{text:' / before the rise.',strong:false}
 ]);
 assert.deepEqual(scriptParts('**<img src=x onerror=alert(1)>**'),[
  {text:'<img src=x onerror=alert(1)>',strong:true}
 ]);
 assert.equal(countSpokenWords('  /  '),0);
});
test('speaker script has restrained emphasis and explicit breath cues in every chapter',()=>{
 for(const chapter of talk)for(const [,text] of chapter){
  const marked=scriptParts(text).filter(part=>part.strong);
  assert.ok(marked.length>=2&&marked.length<=4,`${marked.length} bold cues: ${text}`);
  assert.match(text,/ \/ /);
  assert.equal((text.match(/\*\*/g)||[]).length,marked.length*2);
 }
});
