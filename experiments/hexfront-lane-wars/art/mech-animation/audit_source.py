import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'public/models/mech.glb'))
rows=[]
for o in bpy.data.objects:
 if o.type!='MESH':continue
 pts=[o.matrix_world@v.co for v in o.data.vertices]
 lo=[min(p[k] for p in pts) for k in range(3)];hi=[max(p[k] for p in pts) for k in range(3)]
 # Weld only in the diagnostic graph, to distinguish UV seams from actual parts.
 keys={};ids=[]
 for v in pts:
  key=tuple(round(c,5) for c in v)
  if key not in keys:keys[key]=len(keys)
  ids.append(keys[key])
 parent=list(range(len(keys)))
 def root(a):
  while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
  return a
 for e in o.data.edges:
  a,b=[root(ids[i]) for i in e.vertices];parent[a]=b
 groups={}
 for i,p in enumerate(pts):groups.setdefault(root(ids[i]),[]).append(i)
 components=[]
 for g in groups.values():
  if len(g)<3:continue
  components.append({'vertices':len(g),'min':[min(pts[i][k] for i in g) for k in range(3)],'max':[max(pts[i][k] for i in g) for k in range(3)]})
 rows.append({'name':o.name,'vertices':len(pts),'triangles':len(o.data.polygons),'bounds':{'min':lo,'max':hi},'materials':[m.name for m in o.data.materials],'uvLayers':len(o.data.uv_layers),'vertexGroups':[v.name for v in o.vertex_groups],'modifiers':[m.type for m in o.modifiers],'connectedParts':sorted(components,key=lambda c:-c['vertices'])})
report={'sha256':hashlib.sha256((R/'public/models/mech.glb').read_bytes()).hexdigest(),'meshes':rows,'armatures':[o.name for o in bpy.data.objects if o.type=='ARMATURE'],'actions':[a.name for a in bpy.data.actions]}
(R/'docs/mech-animation/source-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'hexfront-3d/scripts/supplied-mech.blend'))
print('BLEND_SOURCE',json.dumps([{'name':o.name,'type':o.type,'vertices':len(o.data.vertices) if o.type=='MESH' else 0,'modifiers':[m.type for m in o.modifiers]} for o in bpy.data.objects]))
