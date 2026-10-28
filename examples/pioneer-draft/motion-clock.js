// Shared presentation time: changing speed never restarts a running animation.
let rate=1,real=performance.now(),virtual=real;
export function motionNow(){const next=performance.now();virtual+=(next-real)*rate;real=next;return virtual;}
export function getMotionRate(){return rate;}
export function setMotionRate(next){motionNow();rate=Math.max(1,Math.min(100,Number(next)||1));}
