import test from 'node:test';
import assert from 'node:assert/strict';
import {smoothPlotPath} from '../control-plot-path.js';
test('rounded torque display segments remain within adjacent filtered values',()=>{
 const points=[[0,0],[1,5],[2,-2],[3,-1.9],[4,8],[5,7.9]];
 const segments=smoothPlotPath(points).split('C').slice(1);
 assert.equal(segments.length,points.length-1);
 for(let i=0;i<segments.length;i++){
  const n=segments[i].split(/[ ,]+/).map(Number),lo=Math.min(points[i][1],points[i+1][1]),hi=Math.max(points[i][1],points[i+1][1]);
  assert.deepEqual(n.slice(4),points[i+1]);
  for(const y of [n[1],n[3]])assert.ok(y>=lo-1e-3&&y<=hi+1e-3);
 }
});
