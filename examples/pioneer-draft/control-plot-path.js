/** Shape-preserving display curve: Bezier controls stay inside each segment's
 * vertical range, so rounding corners cannot invent a torque extremum. */
export function smoothPlotPath(points){
 if(!points.length)return '';
 const slope=(a,b)=>(b[1]-a[1])/(b[0]-a[0]||1);
 const m=points.map((p,i)=>{
  if(i===0)return points.length>1?slope(p,points[1]):0;
  if(i===points.length-1)return slope(points[i-1],p);
  const a=slope(points[i-1],p),b=slope(p,points[i+1]);
  return a*b<=0?0:2*a*b/(a+b);
 });
 const f=n=>n.toFixed(3);let d=`M${f(points[0][0])} ${f(points[0][1])}`;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=(b[0]-a[0])/3,lo=Math.min(a[1],b[1]),hi=Math.max(a[1],b[1]),bound=y=>Math.max(lo,Math.min(hi,y));
  d+=`C${f(a[0]+dx)} ${f(bound(a[1]+m[i-1]*dx))} ${f(b[0]-dx)} ${f(bound(b[1]-m[i]*dx))} ${f(b[0])} ${f(b[1])}`;
 }
 return d;
}
