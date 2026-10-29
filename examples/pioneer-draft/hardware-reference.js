// URDF coordinates are metres, Z proximal. glTF uses [URDF x, z, -y].
// This point is rigidly carried by the femoral J2–J3 body, not by J2 itself.
export function addFemoralReference(frames,neutralURDF=[0,0,.012]){
 const zero=frames[0].transformsURDF.condyle_right;
 const d=neutralURDF.map((v,i)=>v-zero[i][3]);
 const local=[0,1,2].map(j=>d.reduce((sum,v,i)=>sum+zero[i][j]*v,0));
 const transform=(m,p)=>[0,1,2].map(i=>m[i][3]+p.reduce((sum,v,j)=>sum+m[i][j]*v,0));
 const gltf=p=>[p[0],p[2],-p[1]];
 for(const frame of frames){
  const m=frame.transformsURDF.condyle_right;
  frame.femoralReference=gltf(transform(m,local));
  frame.femoralAxisZ=gltf([m[0][2],m[1][2],m[2][2]]);
 }
 return {body:'condyle_right',neutralURDF:[...neutralURDF],localPoint:local};
}
