"""Validate the exported GLB, never the authoring meshes."""
import bpy,json,math,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
R=Path(__file__).resolve().parents[2];OUT=R/'docs/factory-model/qa';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.scene.render.fps=24
bpy.ops.import_scene.gltf(filepath=str(R/'public/models/factory-preview/factory.glb'))
factory=set(bpy.data.objects);doors=[bpy.data.objects.get('Hangar_Segment_'+str(i)) for i in range(1,5)]
assert all(doors)
def world_mesh(objects,omit_floor=False):
 vs=[];fs=[]
 for o in objects:
  if o.type!='MESH':continue
  base=len(vs);pts=[o.matrix_world@v.co for v in o.data.vertices];vs.extend(pts)
  for f in o.data.polygons:
   if omit_floor and max(pts[i].z for i in f.vertices)<.16:continue
   fs.append(tuple(base+i for i in f.vertices))
 return vs,fs
def bounds(objects):
 v,_=world_mesh(objects)
 return {'min':[min(p[k] for p in v) for k in range(3)],'max':[max(p[k] for p in v) for k in range(3)]}
states=[]
for frame in [0,6,12,18,24,100]:
 bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
 states.append({'frame':frame,'positions':[list(d.location) for d in doors]})
bpy.context.scene.frame_set(100);bpy.context.view_layer.update()
baseBounds=bounds(factory)
v,f=world_mesh(factory,True);walls=BVHTree.FromPolygons(v,f)
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(R/'public/models/mech.glb'))
mech=set(bpy.data.objects)-before;bpy.context.view_layer.update()
mv,mf=world_mesh(mech);lo=Vector(tuple(min(p[k] for p in mv) for k in range(3)));hi=Vector(tuple(max(p[k] for p in mv) for k in range(3)))
scale=1.45/(hi.z-lo.z);center=(lo+hi)/2
mv=[Vector(((p.x-center.x)*scale,(p.y-center.y)*scale,(p.z-lo.z)*scale)) for p in mv]
def overlaps(x,y,yaw,pitch=0,roll=0,bob=0,height=.11):
 # Three.js Euler XYZ -> Blender coordinates (X, -Z, Y), rendered transform.
 # Core movement sway tested directly as a rotation around the model's forward Y.
 transform=Matrix.Rotation(yaw,4,'Z') @ Matrix.Rotation(roll,4,'Y') @ Matrix.Rotation(pitch,4,'X')
 shifted=[transform@p+Vector((x,y,height+bob)) for p in mv]
 tree=BVHTree.FromPolygons(shifted,mf)
 hits=walls.overlap(tree)
 return len(hits)
straight=[]
for y in [.25,.40,.55,.70,.85,1.0,1.15,1.30,1.45,1.60,1.75,1.9]:
 for roll in [-.071,0,.071]:
  for pitch in [-.035,.035]:
   for bob in [-.028,.028]:
    n=overlaps(0,y,0,pitch,roll,bob)
    if n:straight.append({'y':y,'roll':roll,'pitch':pitch,'bob':bob,'intersections':n})
routeHits=[]
routes=json.loads((R/'art/factory-v1/exit-poses.json').read_text())
for p in routes:
 n=overlaps(p['x'],p['y'],p['yaw'],0,math.sin(p['time']*8)*.016,math.sin(p['time']*9)*.028,p['groundOffset'])
 if n:routeHits.append({**p,'intersections':n})
# Folded door segments must remain separate and fit under the cassette roof.
doorBounds=[bounds([d]+list(d.children_recursive)) for d in doors]
stackHits=[]
for i,a in enumerate(doors):
 av,af=world_mesh([a]+list(a.children_recursive));A=BVHTree.FromPolygons(av,af)
 for j,b in enumerate(doors[i+1:],i+1):
  bv,bf=world_mesh([b]+list(b.children_recursive));count=len(A.overlap(BVHTree.FromPolygons(bv,bf)))
  if count:stackHits.append({'segments':[i+1,j+1],'intersections':count})

# Full motion: layers retreat first, then lift. Check rigid panels against each
# other and the actual housing at intermediate frames as well as the end pose.
doorObjects={o for d in doors for o in [d]+list(d.children_recursive)}
bv,bf=world_mesh(factory-doorObjects,True);housing=BVHTree.FromPolygons(bv,bf)
motionHits=[]
for frame in range(0,25,2):
 bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
 trees=[]
 for d in doors:
  dv,df=world_mesh([d]+list(d.children_recursive));tree=BVHTree.FromPolygons(dv,df);trees.append(tree)
  n=len(housing.overlap(tree))
  if n:
   contactPoints=[bv[v] for a,b in housing.overlap(tree) for v in bf[a]]
   contactBounds={'min':[round(min(p[k] for p in contactPoints),4) for k in range(3)],'max':[round(max(p[k] for p in contactPoints),4) for k in range(3)]}
   motionHits.append({'frame':frame,'segment':d.name,'housingIntersections':n,'contactBounds':contactBounds})
 for i,A in enumerate(trees):
  for j,B in enumerate(trees[i+1:],i+1):
   n=len(A.overlap(B))
   if n:motionHits.append({'frame':frame,'segments':[i+1,j+1],'segmentIntersections':n})

report={'factorySHA256':hashlib.sha256((R/'public/models/factory-preview/factory.glb').read_bytes()).hexdigest(),'mechSHA256':hashlib.sha256((R/'public/models/mech.glb').read_bytes()).hexdigest(),'source':'exported factory.glb and existing mech.glb, imported into Blender','factoryBoundsBlenderXYZ':baseBounds,
 'mechSize':[max(p[k] for p in mv)-min(p[k] for p in mv) for k in range(3)],
 'doorStates':states,'openSegmentBounds':doorBounds,'stackIntersections':stackHits,'doorMotionSamples':13,'doorMotionIntersections':motionHits,
 'straightSamples':144,'straightIntersections':straight,'actualRouteSamples':len(routes),'actualRouteIntersections':routeHits,
 'scope':'Triangle-surface intersections against the open factory; floor triangles below 0.16 omitted. Straight studio pass: foot origin 0.11. Route pass: actual firstHeight terrain function minus existing factory root 0.06; no gameplay changed. Sway +/-0.071 includes hit+walking amplitude; bob +/-0.028 and pitch +/-0.035.'}
(OUT/'geometry.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('GEOMETRY_CHECK',json.dumps({k:v for k,v in report.items() if k not in ['doorStates','openSegmentBounds','straightIntersections','actualRouteIntersections']}))
print('INTERSECTIONS',len(straight),len(routeHits),len(stackHits),flush=True)

assert not straight and not routeHits and not stackHits and not motionHits, 'Geometry intersections require correction before approval preview'
