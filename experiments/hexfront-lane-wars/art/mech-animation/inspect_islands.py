import bpy,bmesh,json
from pathlib import Path
bpy.ops.wm.open_mainfile(filepath=str(Path('art/mech-animation/mech-rig.blend').resolve()))
for o in bpy.data.objects:
 if o.type!='MESH':continue
 bm=bmesh.new();bm.from_mesh(o.data);left=set(bm.verts);islands=[]
 while left:
  start=left.pop();seen={start};q=[start]
  while q:
   for e in q.pop().link_edges:
    for v in e.verts:
     if v in left:left.remove(v);seen.add(v);q.append(v)
  faces=set(f for v in seen for f in v.link_faces);islands.append((len(faces),sum(f.calc_area() for f in faces),sum(f.material_index==0 for f in faces),[round(sum(v.co[i] for v in seen)/len(seen),3) for i in range(3)]))
 print(o.name,sorted(islands,reverse=True)[:15]);bm.free()
