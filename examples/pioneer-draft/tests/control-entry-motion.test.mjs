import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleControlEntry} from '../control-entry-motion.js';
test('Control handoff preserves the outgoing scene before introducing its elastic-state diagram',()=>{
 assert.deepEqual(sampleControlEntry(0),{outgoingOpacity:1,outgoingY:-0,incomingOpacity:0,incomingY:18});
 assert.deepEqual(sampleControlEntry(1),{outgoingOpacity:0,outgoingY:-24,incomingOpacity:1,incomingY:0});
 let previous=sampleControlEntry(0);
 for(let i=1;i<=100;i++){const current=sampleControlEntry(i/100);assert.ok(current.outgoingOpacity<=previous.outgoingOpacity);assert.ok(current.incomingOpacity>=previous.incomingOpacity);previous=current;}
 assert.ok(sampleControlEntry(.28).outgoingOpacity>0);
 assert.ok(sampleControlEntry(.28).incomingOpacity>0);
 assert.deepEqual(sampleControlEntry(-1),sampleControlEntry(0));
 assert.deepEqual(sampleControlEntry(4),sampleControlEntry(1));
});
