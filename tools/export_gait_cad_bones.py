"""Restore the four group-1 CAD bone visuals omitted by the gait export.
Read-only research sources; one exact left mesh per bone, source-proven right
reflection, no decimation, clipping, solver step or changed recorded pose.
"""
from pathlib import Path
import gzip, hashlib, json, struct, xml.etree.ElementTree as ET
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
MODEL=Path('/home/arl/Documents/Pioneer/work/aakj-spring-material-2026-10-27/weak_active_blender_rgba.xml')
ASSETS=Path('/home/arl/Documents/Pioneer/work/aakj-ultimate-drive-2026-10-26/models/assets')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
files=[MODEL]+[ASSETS/f'cad_original_{role}_{side}.obj' for role in ['femur','tibia'] for side in ['left','right']]
before={str(p):sha(p) for p in files}
xml=ET.parse(MODEL).getroot();chunks=[];offset=0;meshes={};bones=[];mirror_checks={}
def parse(path):
 vertices=[];faces=[]
 for line in path.read_text().splitlines():
  if line.startswith('v '):vertices.append([float(x) for x in line.split()[1:4]])
  elif line.startswith('f '):
   face=[int(x.split('/')[0])-1 for x in line.split()[1:]]
   assert len(face)==3
   faces.append(face)
 return np.asarray(vertices,dtype='<f4'),np.asarray(faces,dtype='<u4')
def append(a):
 global offset
 a=np.ascontiguousarray(a);d={'offset':offset,'length':a.size};chunks.append(a.tobytes());offset+=a.nbytes;return d
def triangle_keys(v,f):
 q=np.rint(v*1e7).astype(np.int64)
 return sorted(tuple(sorted(tuple(p) for p in q[tri])) for tri in f)
for role in ['femur','tibia']:
 left,faces=parse(ASSETS/f'cad_original_{role}_left.obj');right,right_faces=parse(ASSETS/f'cad_original_{role}_right.obj');mirrored=left.copy();mirrored[:,0]*=-1
 sort=lambda v:v[np.lexsort((v[:,2],v[:,1],v[:,0]))]
 error=float(np.abs(sort(mirrored)-sort(right)).max());assert error==0
 assert triangle_keys(mirrored,faces)==triangle_keys(right,right_faces)
 mirror_checks[role]={'vertexSetMaxErrorM':error,'sameTrianglesAt1e7Grid':True,'rightMeshReorderingOnly':True}
 meshes[role]={'positions':append(left),'indices':append(faces),'vertices':len(left),'triangles':len(faces),'bounds':[left.min(0).tolist(),left.max(0).tolist()]}
 for side,letter in [('left','l'),('right','r')]:
  name=f'{role}_{letter}_geom_1';geom=xml.find(f'.//geom[@name="{name}"]');assert geom is not None and geom.get('group')=='1'
  mesh=xml.find(f'./asset/mesh[@name="{geom.get("mesh")}"]');assert Path(mesh.get('file')).name==f'cad_original_{role}_{side}.obj'
  bones.append({'name':name,'side':side,'role':role,'mesh':role,'reflectX':side=='right','position':[float(x) for x in geom.get('pos','0 0 0').split()],'quaternionWXYZ':[float(x) for x in geom.get('quat','1 0 0 0').split()],'rgba':[float(x) for x in geom.get('rgba').split()]})
meta={'schema':'pioneer-source-cad-bones-v1','bones':bones,'meshes':meshes,'provenance':{'sourceModel':str(MODEL),'sourceModelSHA256':before[str(MODEL)],'sourceFilesSHA256':before,'mirrorChecks':mirror_checks,'classification':'Exact source XML group-1 CAD bone visuals; saved bone-body transforms; no clipping or geometry change','omissionCause':'Original gait exporter selected group 0 anatomy and group 2 device visuals, excluding these group 1 bones','physicsSteps':0}}
encoded=json.dumps(meta,separators=(',',':')).encode();header=b'PCDB1LE\0'+struct.pack('<I',len(encoded))+encoded;header+=b'\0'*((-len(header))%4);binary=header+b''.join(chunks)
base=ROOT/'examples/pioneer-draft/assets/gait-source-cad-bones.bin';base.write_bytes(binary);base.with_suffix('.bin.gz').write_bytes(gzip.compress(binary,compresslevel=9,mtime=0))
assert before=={str(p):sha(p) for p in files}
report={**meta['provenance'],'meshes':{k:{x:v for x,v in m.items() if x not in ['positions','indices']} for k,m in meshes.items()},'binaryBytes':len(binary),'gzipBytes':base.with_suffix('.bin.gz').stat().st_size,'researchSourcesUnchanged':True,'sharedBilateralBuffers':True}
(ROOT/'docs/gait-source-bones49.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:report[k] for k in ['binaryBytes','gzipBytes','researchSourcesUnchanged','mirrorChecks']},indent=2))
