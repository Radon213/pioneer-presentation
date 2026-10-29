import test from 'node:test';
import assert from 'node:assert/strict';
import slides from '../deck-data.js';
import {talk,getTalkStage,talkSeconds,talkWords} from '../presenter-script.js';
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
 assert.match(getTalkStage(5,5).text,/reinforcement-learning pilot did not show an added benefit/);
 assert.match(getTalkStage(5,6).text,/not different patients or a robustness test/);
 assert.match(getTalkStage(5,7).text,/separate walking experiment/);
 assert.match(getTalkStage(5,8).text,/cannot call this a completed walking result/);
 assert.match(getTalkStage(4,5).text,/separate analyses/);
});
