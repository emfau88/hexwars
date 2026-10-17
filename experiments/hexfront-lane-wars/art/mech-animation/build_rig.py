"""Articulate the original textured mech; never replace its visible design.
Rigid parts are cut at mechanical seams, capped and supplied with inner joints.
Blender coordinates: Z up, +Y front. glTF: Y up, -Z front.
"""
import bpy,bmesh,math,json
from pathlib import Path
from mathutils import Vector,Matrix
R=Path(__file__).resolve().parents[2];OUT=R/'public/models/mech-animated';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'public/models/mech.glb'))
source=next(o for o in bpy.data.objects if o.type=='MESH');source.data.transform(source.matrix_world);source.parent=None;source.matrix_world.identity()
pts=[v.co for v in source.data.vertices];lo=Vector([min(v[k] for v in pts) for k in range(3)]);hi=Vector([max(v[k] for v in pts) for k in range(3)]);center=(lo+hi)/2;scale=1.45/(hi.z-lo.z)
for v in source.data.vertices:v.co=Vector(((v.co.x-center.x)*scale,(v.co.y-center.y)*scale,(v.co.z-lo.z)*scale))
surface=source.data.materials[0]
jointmat=bpy.data.materials.new('Mechanical_Inner');jointmat.diffuse_color=(.035,.049,.052,1);jointmat.use_nodes=True
bs=jointmat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.035,.049,.052,1);bs.inputs['Metallic'].default_value=.65;bs.inputs['Roughness'].default_value=.43
source.data.materials.append(jointmat)
# Imported UV splits are welded geometrically; per-loop texture coordinates remain intact.
bm=bmesh.new();bm.from_mesh(source.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000002);bm.to_mesh(source.data);bm.free()
def copy(o,name):
 n=bpy.data.objects.new(name,o.data.copy());bpy.context.collection.objects.link(n);return n
def clip(o,point,normal,positive):
 bm=bmesh.new();bm.from_mesh(o.data)
 result=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.000001,plane_co=point,plane_no=normal,clear_inner=positive,clear_outer=not positive)
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o.data.update()
def join(objects,name):
 objects=[o for o in objects if len(o.data.polygons)]
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=objects[0];o.name=name;return o
def extract(o,planes,name):
 inside=o;outside=[]
 for point,normal in planes:
  off=copy(inside,'Cut remainder');clip(off,point,normal,False);outside.append(off);clip(inside,point,normal,True)
 inside.name=name
 return inside,join(outside,'Remaining shell')
def split(o,point,normal,name1,name2):
 other=copy(o,name2);clip(o,point,normal,True);clip(other,point,normal,False);o.name=name1;return o,other
# Arms meet the torso in the dark recessed shoulder/underarm regions.
body=source;arms={}
for sign,side in [(1,'R'),(-1,'L')]:
 arm,body=extract(body,[((sign*.39,0,0),(sign,0,0)),((sign*.815,0,0),(sign,0,.6)),((0,0,.40),(0,0,1))],'Arm_'+side)
 arms[side]=arm
upper,lower=split(body,(0,0,.69),(0,0,1),'Torso_Shell','Lower_Assembly')
pelvis,legs=extract(lower,[((-.215,0,0),(1,0,0)),((.215,0,0),(-1,0,0)),((0,0,.36),(0,0,1))],'Pelvis_Shell')
right,left=split(legs,(0,0,0),(1,0,0),'Leg_R','Leg_L')
parts={'Torso':upper,'Pelvis':pelvis}
for side,leg in [('R',right),('L',left)]:
 thigh,shin=split(leg,(0,0,.325),(0,0,1),'Thigh_'+side,'Shin_'+side)
 shin,foot=split(shin,(0,0,.17),(0,0,1),'Shin_'+side,'Foot_'+side)
 parts.update({'Hip_'+side:thigh,'Knee_'+side:shin,'Ankle_'+side:foot})
for side,arm in arms.items():
 shoulder,forearm=split(arm,(0,0,.785),(0,0,1),'Shoulder_'+side,'Forearm_'+side)
 parts['Shoulder_'+side]=shoulder;parts['Elbow_'+side]=forearm
# The original barrels recoil independently, inside the existing gun housing.
barrel,forearm=split(parts['Elbow_R'],(0,.30,0),(0,1,0),'Barrels_R','Forearm_R');parts['Elbow_R']=forearm;parts['Barrel']=barrel
# Rejoin temporary partition seams before closing each final mechanical shell.
# Backpack tips crossing the waist plane belong to the torso, not to the moving legs.
for key,o in list(parts.items()):
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
 if key.startswith(('Hip_','Knee_','Ankle_')) or key=='Pelvis':
  remaining=set(bm.verts);transfer=[]
  while remaining:
   start=remaining.pop();seen={start};queue=[start]
   while queue:
    for edge in queue.pop().link_edges:
     for v in edge.verts:
      if v in remaining:remaining.remove(v);seen.add(v);queue.append(v)
   center=sum((v.co for v in seen),Vector())/len(seen)
   if center.y<-.30 and center.z>.5:transfer.extend(seen)
  if transfer:
   # Duplicate the shell then keep only the selected original backpack surface.
   patch=bm.copy();keep={tuple(v.co) for v in transfer};bmesh.ops.delete(patch,geom=[v for v in patch.verts if tuple(v.co) not in keep],context='VERTS')
   mesh=bpy.data.meshes.new('Backpack original surface');patch.to_mesh(mesh);patch.free();obj=bpy.data.objects.new('Backpack original surface',mesh);bpy.context.collection.objects.link(obj)
   for mat in o.data.materials:mesh.materials.append(mat)
   parts['Torso']=join([parts['Torso'],obj],'Torso_Shell');bmesh.ops.delete(bm,geom=transfer,context='VERTS')
 bm.to_mesh(o.data);bm.free()
# Small seam islands on the outer forearms/shoulders must follow those assemblies.
for key,o in list(parts.items()):
 if not (key.startswith('Hip_') or key=='Torso'):continue
 bm=bmesh.new();bm.from_mesh(o.data);remaining=set(bm.verts);moves={}
 while remaining:
  start=remaining.pop();seen={start};queue=[start]
  while queue:
   for edge in queue.pop().link_edges:
    for v in edge.verts:
     if v in remaining:remaining.remove(v);seen.add(v);queue.append(v)
  center=sum((v.co for v in seen),Vector())/len(seen);target=None
  if len(seen)<100:
   if key.startswith('Hip_') and abs(center.x)>.4:target='Elbow_'+('R' if center.x>0 else 'L')
   elif key.startswith('Hip_') and abs(center.x)<.24 and center.z>.6:target='Pelvis'
   elif key=='Torso' and abs(center.x)>.35:target='Shoulder_'+('R' if center.x>0 else 'L')
  if target:moves.setdefault(target,[]).extend(seen)
 for target,verts in moves.items():
  patch=bm.copy();keep={tuple(v.co) for v in verts};bmesh.ops.delete(patch,geom=[v for v in patch.verts if tuple(v.co) not in keep],context='VERTS')
  mesh=bpy.data.meshes.new('Reassigned original seam');patch.to_mesh(mesh);patch.free();obj=bpy.data.objects.new('Reassigned original seam',mesh);bpy.context.collection.objects.link(obj)
  for mat in o.data.materials:mesh.materials.append(mat)
  parts[target]=join([parts[target],obj],target+'_Shell');bmesh.ops.delete(bm,geom=verts,context='VERTS')
 bm.to_mesh(o.data);bm.free()
for key,o in parts.items():
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
 cap=bmesh.ops.holes_fill(bm,edges=[e for e in bm.edges if e.is_boundary],sides=0)
 for f in cap['faces']:f.material_index=1;f.smooth=False
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
nodes={};origins={}
def node(name,pivot,parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.empty_display_type='ARROWS';o.empty_display_size=.06
 origins[name]=Vector(pivot);o.parent=nodes.get(parent);o.location=Vector(pivot)-(origins[parent] if parent else Vector());nodes[name]=o;return o
node('Mech_Rig',(0,0,0));node('Pelvis',(0,0,.61),'Mech_Rig');node('Torso',(0,-.02,.70),'Pelvis')
for sign,side in [(1,'R'),(-1,'L')]:
 node('Hip_'+side,(sign*.28,-.04,.61),'Pelvis');node('Knee_'+side,(sign*.35,.02,.35),'Hip_'+side);node('Ankle_'+side,(sign*.37,-.015,.16),'Knee_'+side)
 node('Shoulder_'+side,(sign*.43,-.025,.98),'Torso');node('Elbow_'+side,(sign*.57,.02,.77),'Shoulder_'+side)
node('Barrel',(.65,.30,.70),'Elbow_R');node('Muzzle_Primary',(.65,.54,.70),'Barrel')
for key,o in parts.items():
 o.data.transform(Matrix.Translation(-origins[key]));o.parent=nodes[key];o.location=(0,0,0);o.name=key+'_Geometry'
for key,o in nodes.items():o.name=key
# Hidden joint mechanics bridge cuts; outer armour/UVs are the unchanged design.
def joint(name,center,radius,length,parent):
 bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=radius,depth=length,location=center,rotation=(0,math.pi/2,0));o=bpy.context.object;o.name=name
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 o.data.materials.append(jointmat)
 bevel=o.modifiers.new('Machined joint edges','BEVEL');bevel.width=.005;bevel.segments=1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=bevel.name)
 for f in o.data.polygons:f.use_smooth=True
 o.parent=nodes[parent];o.location=Vector(center)-origins[parent]
for sign,side in [(1,'R'),(-1,'L')]:
 for key,radius,length in [('Hip',.067,.09),('Knee',.057,.09),('Ankle',.045,.08),('Shoulder',.054,.085),('Elbow',.046,.07)]:joint(key+'_'+side+'_Bearing',origins[key+'_'+side],radius,length,key+'_'+side)
# Bake rigid pieces by parent/material before export, preserving all pivot nodes.
for key in parts:
 children=[o for o in nodes[key].children if o.type=='MESH']
 if len(children)>1:
  for o in children:o.matrix_world=nodes[key].matrix_world@o.matrix_basis
  join(children,key+'_Geometry')
rest={name:(o.location.copy(),o.rotation_euler.copy()) for name,o in nodes.items()}
def reset():
 for name,o in nodes.items():o.location=rest[name][0];o.rotation_euler=(0,0,0);o.animation_data_clear()
def leg(side,y,z,hipdrop=0,pitch=0):
 H=origins['Hip_'+side];K=origins['Knee_'+side];A=origins['Ankle_'+side]
 l1=math.hypot(K.y-H.y,K.z-H.z);l2=math.hypot(A.y-K.y,A.z-K.z)
 dy=y-H.y;dz=z-(H.z+hipdrop);d2=dy*dy+dz*dz
 q=-math.acos(max(-.999,min(.999,(d2-l1*l1-l2*l2)/(2*l1*l2))))
 a=math.atan2(dy,-dz)-math.atan2(l2*math.sin(q),l1+l2*math.cos(q))
 a0=math.atan2(K.y-H.y,H.z-K.z);b0=math.atan2(A.y-K.y,K.z-A.z)
 nodes['Hip_'+side].rotation_euler.x=a-a0;nodes['Knee_'+side].rotation_euler.x=q-(b0-a0);nodes['Ankle_'+side].rotation_euler.x=-(a-a0+q-(b0-a0))+pitch
clips={}
fps=60;bpy.context.scene.render.fps=fps
for clip,duration in [('Idle',3),('Walk',1),('Attack',.45),('Hit',.30),('Death',1.2)]:
 reset()
 for frame in range(round(duration*fps)+1):
  t=frame/fps;phase=t/duration
  for name,o in nodes.items():o.location=rest[name][0];o.rotation_euler=(0,0,0)
  if clip=='Idle':
   nodes['Torso'].rotation_euler.x=.008*math.sin(phase*math.tau);nodes['Elbow_L'].rotation_euler.x=.012*math.sin(phase*math.tau+.4)
  elif clip=='Walk':
   drop=-.035+.006*math.cos(phase*math.tau*2);nodes['Pelvis'].location.z+=drop
   for side,offset in [('R',0),('L',.5)]:
    p=(phase+offset)%1
    if p<.62:y=.14-.28*p/.62;lift=0;pitch=0
    else:
     swing=(p-.62)/.38;y=-.14+.28*(swing*swing*(3-2*swing));lift=.075*math.sin(math.pi*swing);pitch=.10*math.sin(math.pi*swing)
    leg(side,-.015+y,.16+lift,drop,pitch)
   nodes['Torso'].rotation_euler.z=.025*math.sin(phase*math.tau)
   nodes['Shoulder_L'].rotation_euler.x=.065*math.sin(phase*math.tau);nodes['Shoulder_R'].rotation_euler.x=-.04*math.sin(phase*math.tau)
  elif clip=='Attack':
   kick=t/.05 if t<.05 else math.exp(-(t-.05)*13)*(1-phase)
   nodes['Barrel'].location.y-=.055*kick;nodes['Elbow_R'].rotation_euler.x=.055*kick;nodes['Torso'].rotation_euler.x=.025*kick
  elif clip=='Hit':
   kick=math.sin(math.pi*phase)*(1-phase);nodes['Torso'].rotation_euler.x=-.065*kick;nodes['Torso'].rotation_euler.y=.04*kick
  else:
   v=min(1,t/.8);v=v*v*(3-2*v);drop=-.25*v;nodes['Pelvis'].location.z+=drop
   nodes['Torso'].rotation_euler.x=-.65*v;nodes['Torso'].rotation_euler.y=.10*v
   nodes['Shoulder_R'].rotation_euler.x=-.25*v;nodes['Elbow_R'].rotation_euler.x=-.20*v
   nodes['Shoulder_L'].rotation_euler.x=-.30*v;nodes['Elbow_L'].rotation_euler.x=-.15*v
   for side in ['R','L']:leg(side,-.015,.16,drop)
  for name,o in nodes.items():
   if name in ['Mech_Rig','Muzzle_Primary']:continue
   o.keyframe_insert('location',frame=frame);o.keyframe_insert('rotation_euler',frame=frame)
 for name,o in nodes.items():
  if not o.animation_data or not o.animation_data.action:continue
  action=o.animation_data.action;action.name=clip+'_'+name
  for layer in action.layers:
   for strip in layer.strips:
    for bag in strip.channelbags:
     for curve in bag.fcurves:
      for k in curve.keyframe_points:k.interpolation='LINEAR'
  track=o.animation_data.nla_tracks.new();track.name=clip;strip=track.strips.new(clip,0,action);strip.action_frame_start=0;strip.action_frame_end=duration*fps
  o.animation_data.action=None
 clips[clip]=duration
 # animation_data_clear would erase NLA: reset next pass by clearing only active action.
 for name,o in nodes.items():o.location=rest[name][0];o.rotation_euler=(0,0,0)
 # Preserve previously created NLA tracks across clip passes.
 reset=lambda:None
bpy.context.scene.frame_set(0);bpy.context.scene.frame_end=180
bpy.context.view_layer.update()
for o in nodes.values():
 if o.animation_data:
  for track in o.animation_data.nla_tracks:track.mute=True
bpy.context.scene['Animation_help']='NLA tracks: enable the SAME clip name on every joint. Idle, Walk, Attack, Hit, Death. 60 fps. Rigid parented geometry; no skin deformation. Rebuild via build_rig.py.'
helptext=bpy.data.texts.new('PLAY_ANIMATION.py');helptext.write("import bpy\n# Change clip to Idle, Walk, Attack, Hit or Death, then Run Script.\nclip='Walk'\ndurations={'Idle':180,'Walk':60,'Attack':27,'Hit':18,'Death':72}\nfor o in bpy.data.objects:\n if o.animation_data:\n  for track in o.animation_data.nla_tracks:track.mute=track.name!=clip\nbpy.context.scene.frame_start=0\nbpy.context.scene.frame_end=durations[clip]\nbpy.context.scene.frame_set(0)\n")
bpy.ops.wm.save_as_mainfile(filepath=str(R/'art/mech-animation/mech-rig.blend'))
for o in nodes.values():
 if o.animation_data:
  for track in o.animation_data.nla_tracks:track.mute=False
bpy.ops.object.select_all(action='DESELECT')
for o in [nodes['Mech_Rig']]+list(nodes['Mech_Rig'].children_recursive):o.select_set(True)
bpy.context.view_layer.objects.active=nodes['Mech_Rig']
bpy.ops.export_scene.gltf(filepath=str(OUT/'mech-rigged.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_force_sampling=True,export_extras=True)
(OUT/'rig.json').write_text(json.dumps({'source':'../mech.glb','status':'rigid mechanical animation; original textured armour preserved','height':1.45,'stride':.28/.62,'clips':clips,'pivots':{k:list(v) for k,v in origins.items()}},indent=2),encoding='utf-8')
print('RIG_EXPORT_COMPLETE')
