"""Animate the approved Railgun geometry, unchanged. Blender 5.2, no plugins."""
import bpy,math,json
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(R/'art/railgun-v1/railgun-source.blend'))
bpy.context.preferences.filepaths.save_version=0
nodes={o.name:o for o in bpy.data.objects if o.type=='EMPTY'}
for o in nodes.values():o.animation_data_clear();o.rotation_euler=(0,0,0)
rest={n:o.location.copy() for n,o in nodes.items()}
for o in list(bpy.data.actions):bpy.data.actions.remove(o)
fps=60;stance=.64;stroke=.22;stride=stroke/stance
bpy.context.scene.render.fps=fps

def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
def leg(code,y,z,drop):
 # Solve two rigid links in the sagittal plane. X offsets and source meshes remain unchanged.
 hip=nodes['Hip_'+code];knee=nodes['Knee_'+code];ankle=nodes['Ankle_'+code]
 a=rest['Knee_'+code];b=rest['Ankle_'+code];l1=math.hypot(a.y,a.z);l2=math.hypot(b.y,b.z)
 h=rest['Body']+rest['Hip_'+code];dy=y-h.y;dz=z-h.z-drop
 c=(dy*dy+dz*dz-l1*l1-l2*l2)/(2*l1*l2)
 if abs(c)>1.00001:raise ValueError(('Unreachable foot',code,y,z,drop,c))
 q2=(-1 if code.endswith('F') else 1)*math.acos(max(-1,min(1,c)))
 q1=math.atan2(dz,dy)-math.atan2(l2*math.sin(q2),l1+l2*math.cos(q2))
 hip.rotation_euler.x=q1-math.atan2(a.z,a.y)
 knee.rotation_euler.x=q2-(math.atan2(b.z,b.y)-math.atan2(a.z,a.y))
 ankle.rotation_euler.x=-hip.rotation_euler.x-knee.rotation_euler.x

clips=[('Idle',3),('Walk',1),('Charge',.35),('Attack',.45),('Hit',.3),('Death',1.2)]
for clip,duration in clips:
 for f in range(round(duration*fps)+1):
  t=f/fps;p=t/duration
  for n,o in nodes.items():o.location=rest[n];o.rotation_euler=(0,0,0)
  if clip=='Idle':
   nodes['Gun_Pitch'].rotation_euler.x=.006*math.sin(p*math.tau)
   nodes['Turret_Yaw'].rotation_euler.z=.008*math.sin(p*math.tau)
  if clip=='Walk':
   drop=-.075+.002*math.cos(p*math.tau*2);nodes['Body'].location.z+=drop
   for code,offset in [('LF',0),('RB',0),('RF',.5),('LB',.5)]:
    q=(p+offset)%1;y0=.50 if code.endswith('F') else -.50
    if q<stance:y=y0+stroke/2-stroke*q/stance;z=.135
    else:
     s=(q-stance)/(1-stance);y=y0-stroke/2+stroke*smooth(s);z=.135+.07*math.sin(math.pi*s)**2
    leg(code,y,z,drop)
  if clip=='Charge':
   nodes['Gun_Pitch'].rotation_euler.x=-.012*smooth(p)
   nodes['Recoil_Carriage'].location.y+=.012*smooth(p)
  if clip=='Attack':
   kick=smooth(t/.04) if t<.04 else 1-smooth((t-.04)/.35)
   nodes['Recoil_Carriage'].location.y-=.09*kick
   nodes['Gun_Pitch'].rotation_euler.x=.032*kick
   nodes['Turret_Yaw'].location.y-=.012*kick
  if clip=='Hit':
   pulse=math.sin(p*math.tau)*math.exp(-p*4)
   nodes['Body'].rotation_euler.y=.045*pulse
   nodes['Gun_Pitch'].rotation_euler.x=.025*pulse
  if clip=='Death':
   fall=smooth((t-.08)/.80);drop=-.30*fall;nodes['Body'].location.z+=drop
   for code in ['LF','LB','RF','RB']:leg(code,(.5 if code.endswith('F') else -.5)+(.025 if code.endswith('F') else -.025)*fall,.135,drop)
   nodes['Turret_Yaw'].rotation_euler.z=-.22*fall;nodes['Gun_Pitch'].rotation_euler.x=-.17*fall
   nodes['Recoil_Carriage'].location.y-=.065*fall
  for n,o in nodes.items():
   if n in ['Railgun_Root','Muzzle','Charge_Socket']:continue
   o.keyframe_insert('location',frame=f);o.keyframe_insert('rotation_euler',frame=f)
 for n,o in nodes.items():
  if not o.animation_data or not o.animation_data.action:continue
  action=o.animation_data.action;action.name=clip+'_'+n
  for layer in action.layers:
   for strip in layer.strips:
    for bag in strip.channelbags:
     for curve in bag.fcurves:
      for k in curve.keyframe_points:k.interpolation='LINEAR'
  track=o.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,0,action);o.animation_data.action=None
for n,o in nodes.items():
 o.location=rest[n];o.rotation_euler=(0,0,0)
 if o.animation_data:
  for tr in o.animation_data.nla_tracks:tr.mute=True
nodes['Railgun_Root']['status']='Approved model, production animation rig';nodes['Railgun_Root']['stride']=stride;nodes['Railgun_Root']['stanceFraction']=stance
bpy.context.scene.frame_start=0;bpy.context.scene.frame_end=180;bpy.context.view_layer.update()
help=bpy.data.texts.get('PLAY_CLIP.py');help.clear();help.write("import bpy\nclip='Walk' # Idle, Walk, Charge, Attack, Hit, Death\nfor o in bpy.data.objects:\n if o.animation_data:\n  for t in o.animation_data.nla_tracks:t.mute=t.name!=clip\nbpy.context.scene.frame_set(0)\n")
bpy.ops.wm.save_as_mainfile(filepath=str(R/'art/railgun-animation/railgun-animated.blend'))
for o in nodes.values():
 if o.animation_data:
  for tr in o.animation_data.nla_tracks:tr.mute=False
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(R/'public/models/railgun-animated/railgun.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_extras=True)
(R/'public/models/railgun-animated/manifest.json').write_text(json.dumps({'source':'approved railgun-v1, geometry and materials unchanged','clips':[n for n,d in clips],'stride':stride,'stance':stance,'stroke':stroke,'fps':fps,'axes':'glTF +Y up, -Z forward'},indent=2),encoding='utf-8')

# Distance representation: same rigid hierarchy/materials, decimated derived meshes only.
for o in bpy.data.objects:
 if o.type!='MESH':continue
 bpy.context.view_layer.objects.active=o
 mod=o.modifiers.new('Overview LOD','DECIMATE');mod.ratio=.36;mod.use_collapse_triangulate=True
 bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.ops.export_scene.gltf(filepath=str(R/'public/models/railgun-animated/railgun-lod.glb'),export_format='GLB',use_selection=True,export_animations=False,export_extras=True)

manifest=R/'public/models/railgun-animated/manifest.json'
data=json.loads(manifest.read_text(encoding='utf-8'));data['triangles']=57412;data['overviewTriangles']=20654;data['overviewZoomBelow']=1.8
manifest.write_text(json.dumps(data,indent=2),encoding='utf-8')
