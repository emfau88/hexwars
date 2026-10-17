"""HEXFRONT quadruped railgun: separate approval asset. Blender +Y front, Z up.
Authored curved armour surfaces and mechanical joints; no gameplay integration.
"""
import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
R=Path(__file__).resolve().parents[2];OUT=R/'public/models/railgun-preview'
bpy.ops.wm.read_factory_settings(use_empty=True)
def linear(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def material(name,h,rough=.4,metal=.1,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;c=tuple(linear(int(h[i:i+2],16)/255) for i in (0,2,4));bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal;bs.inputs['Emission Color'].default_value=(*c,1);bs.inputs['Emission Strength'].default_value=emission;m.diffuse_color=(*c,1);return m
M={n:material(n,*p) for n,p in {'Ceramic':('E5E3D8',.34,.12),'Team':('F49A43',.37,.22),'Graphite':('263438',.43,.65),'Rubber':('141F22',.74,.03),'Alloy':('799194',.3,.8),'Optics':('A0E3DF',.25,.25,1.4),'Marking':('F4F0DF',.5,.1)}.items()}
nodes={};origin={}
def joint(name,p,parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.empty_display_type='ARROWS';o.empty_display_size=.055;o.parent=nodes.get(parent);origin[name]=Vector(p);o.location=Vector(p)-(origin[parent] if parent else Vector());nodes[name]=o;return o
joint('Railgun_Root',(0,0,0));joint('Body',(0,0,.66),'Railgun_Root');joint('Turret_Yaw',(0,-.07,.91),'Body');joint('Gun_Pitch',(0,-.02,1.055),'Turret_Yaw');joint('Recoil_Carriage',(0,-.02,1.055),'Gun_Pitch');joint('Muzzle',(0,1.13,1.055),'Recoil_Carriage');joint('Charge_Socket',(0,-.33,1.10),'Recoil_Carriage')
nodes['Railgun_Root']['status']='Approval model v1; not integrated into the game';nodes['Railgun_Root']['front']='glTF -Z';nodes['Railgun_Root']['units']='world metres; original placeholder target height 1.3'

def mesh(name,v,f,mat,parent='Body',bevel=0,smooth=False):
 me=bpy.data.meshes.new(name);me.from_pydata(v,[],f);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(M[mat]);o.parent=nodes[parent];me.transform(Matrix.Translation(-origin[parent]));bpy.context.view_layer.objects.active=o;o.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
 if bevel:
  mod=o.modifiers.new('Machined edge radius','BEVEL');mod.width=bevel;mod.segments=2;mod.limit_method='ANGLE';bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in me.polygons:p.use_smooth=smooth
 if bevel or smooth:
  mod=o.modifiers.new('Surface normals','WEIGHTED_NORMAL');mod.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=mod.name)
 o.select_set(False);return o

def rounded(w,d,r,n=3):
 return [(x+r*math.cos(a),y+r*math.sin(a)) for x,y,start in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)] for a in [math.radians(start+i*90/n) for i in range(n+1)]]
def loft(name,sections,mat,parent='Body',axis='Z',bevel=0):
 # Every section is a designed rounded manufacturing outline, with varying width/depth/offset.
 v=[]
 for at,w,d,r,x,y in sections:
  for a,b in rounded(w,d,min(r,w/2,d/2)):
   a+=x;b+=y;v.append((a,b,at) if axis=='Z' else (a,at,b) if axis=='Y' else (at,a,b))
 n=len(v)//len(sections);f=[tuple(reversed(range(n))),tuple((len(sections)-1)*n+i for i in range(n))]
 for j in range(len(sections)-1):
  for i in range(n):k=j*n+i;l=j*n+(i+1)%n;f.append((k,l,l+n,k+n))
 return mesh(name,v,f,mat,parent,bevel,True)
def panel(name,pos,size,mat,parent='Body',r=.025):
 x,y,z=pos;w,d,h=size;return loft(name,[(z-h/2,w,d,r,x,y),(z+h/2,w,d,r,x,y)],mat,parent,bevel=min(.006,h/4))
def rod(name,a,b,r,mat,parent='Body',N=12,r2=None):
 a,b=Vector(a),Vector(b);u=(b-a).normalized();x=u.cross(Vector((0,0,1)))
 if x.length<.01:x=u.cross(Vector((1,0,0)))
 x.normalize();y=u.cross(x);v=[tuple(c+rad*(x*math.cos(i*math.tau/N)+y*math.sin(i*math.tau/N))) for c,rad in [(a,r),(b,r if r2 is None else r2)] for i in range(N)];f=[tuple(reversed(range(N))),tuple(N+i for i in range(N))]+[(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)];return mesh(name,v,f,mat,parent,.002,True)
def bearing(name,p,r,length,parent,axis='X'):
 p=Vector(p);v=Vector((1,0,0) if axis=='X' else (0,0,1))
 rod(name+' core',p-v*length/2,p+v*length/2,r,'Graphite',parent,20)
 for sign in [-1,1]:
  c=p+v*(length/2+.002)*sign;rod(name+' machined lip',c-v*.009,c+v*.009,r*.88,'Alloy',parent,16);rod(name+' ceramic hub',c+v*.01*sign,c+v*.017*sign,r*.59,'Team',parent,16);rod(name+' axle',c+v*.017*sign,c+v*.020*sign,r*.22,'Graphite',parent,12)
def beam(name,a,b,w,d,mat,parent):
 a,b=Vector(a),Vector(b);u=(b-a).normalized();x=Vector((0,1,0));x=(x-u*x.dot(u)).normalized();y=u.cross(x);v=[];ring=rounded(w,d,min(w,d)*.25)
 for p,scale in [(a,.74),(a.lerp(b,.14),1),(a.lerp(b,.80),.9),(b,.65)]:v += [tuple(p+scale*(x*q+y*r)) for q,r in ring]
 n=len(ring);f=[tuple(reversed(range(n))),tuple(3*n+i for i in range(n))]+[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(3) for i in range(n)];return mesh(name,v,f,mat,parent,.005,True)
# Low, tapered main hull. Recessed seams separate curved armour panels.
loft('Sealed graphite underbody',[(.46,.52,.68,.15,0,0),(.52,.76,.87,.18,0,0),(.70,.82,.94,.20,0,0),(.77,.69,.82,.20,0,0)],'Graphite')
loft('Ceramic chassis shell',[(.59,.79,.91,.20,0,0),(.64,.84,.95,.22,0,0),(.76,.80,.91,.23,0,0),(.85,.61,.73,.23,0,-.025)],'Ceramic')
loft('Armoured dorsal stripe',[(.817,.26,.62,.09,0,-.03),(.854,.24,.58,.08,0,-.03)],'Team')
# Front sensor face under the turret. Glass set into a dark, beveled pocket.
loft('Front sensor housing',[(.418,.37,.15,.055,0,.69),(.477,.32,.12,.045,0,.69)],'Graphite',axis='Y')
loft('Front sensor glass',[(.479,.21,.058,.022,0,.70),(.486,.21,.058,.022,0,.70)],'Optics',axis='Y')
for s in [-1,1]:
 loft('Shoulder team fairing',[(.64,.13,.52,.06,s*.391,-.035),(.72,.16,.54,.07,s*.376,-.035),(.79,.12,.46,.055,s*.35,-.035)],'Team')
 # Side vents recessed in dark plates with stepped alloy fins.
 for j in range(5):panel('Side radiator fin',(s*.419,-.22+j*.065,.635),(.022,.028,.082),'Alloy',r=.008)
 for y in [-.32,.30]:rod('Hull fastener',(s*.24,y,.806),(s*.24,y,.816),.014,'Graphite',N=8)
loft('Rear power cassette',[(.52,.50,.22,.07,0,-.43),(.67,.59,.24,.075,0,-.43),(.75,.48,.19,.065,0,-.43)],'Graphite')
for x in [-.18,-.09,0,.09,.18]:panel('Rear heat exchanger',(x,-.542,.64),(.041,.025,.16),'Alloy',r=.01)
# Four independent articulated leg chains. Armour follows its segment; bearings bridge real pivots.
for sx,side in [(-1,'L'),(1,'R')]:
 for sy,end in [(1,'F'),(-1,'B')]:
  code=side+end;hip=Vector((sx*.365,sy*.30,.64));knee=Vector((sx*.565,sy*.44,.40));ankle=Vector((sx*.65,sy*.50,.135))
  joint('Hip_'+code,hip,'Body');joint('Knee_'+code,knee,'Hip_'+code);joint('Ankle_'+code,ankle,'Knee_'+code)
  bearing('Hip '+code,hip,.093,.13,'Hip_'+code);beam('Upper actuator '+code,hip,knee,.12,.13,'Graphite','Hip_'+code)
  # Curved clamshell on upper link; local geometry shaped around the oblique mechanical strut.
  beam('Upper ceramic armour '+code,hip.lerp(knee,.2)+Vector((sx*.035,0,.025)),hip.lerp(knee,.81)+Vector((sx*.045,0,.015)),.19,.16,'Ceramic','Hip_'+code)
  beam('Upper identification stripe '+code,hip.lerp(knee,.23)+Vector((sx*.104,0,.015)),hip.lerp(knee,.63)+Vector((sx*.10,0,.015)),.10,.023,'Team','Hip_'+code)
  bearing('Knee '+code,knee,.076,.17,'Knee_'+code);beam('Lower actuator '+code,knee,ankle,.082,.09,'Graphite','Knee_'+code)
  beam('Shin ceramic guard '+code,knee.lerp(ankle,.28)+Vector((0,.035,.01)),knee.lerp(ankle,.78)+Vector((0,.035,.01)),.12,.13,'Ceramic','Knee_'+code)
  # Protective piston travels with its link; no unsupported endpoints bridging unrelated moving nodes.
  rod('Shin hydraulic barrel '+code,knee.lerp(ankle,.15)+Vector((0,-.065,0)),knee.lerp(ankle,.55)+Vector((0,-.065,0)),.027,'Graphite','Knee_'+code)
  rod('Shin polished piston '+code,knee.lerp(ankle,.48)+Vector((0,-.065,0)),ankle+Vector((0,-.065,.02)),.014,'Alloy','Knee_'+code)
  bearing('Ankle '+code,ankle,.049,.10,'Ankle_'+code)
  x,y,_=ankle
  loft('Foot sole '+code,[(.0,.27,.34,.06,x,y+.035),(.055,.29,.36,.06,x,y+.035),(.073,.27,.34,.055,x,y+.035)],'Rubber','Ankle_'+code)
  loft('Foot ceramic cap '+code,[(.064,.27,.33,.055,x,y+.035),(.105,.25,.31,.07,x,y+.035),(.154,.16,.23,.07,x,y+.015)],'Ceramic','Ankle_'+code)
  panel('Foot identification '+code,(x,y+.105,.139),(.09,.12,.02),'Team','Ankle_'+code,r=.022)
  for q in [-1,1]:panel('Split toe grip '+code,(x+q*.073,y+.18,.057),(.10,.035,.055),'Graphite','Ankle_'+code,r=.012)
# Wide turret race and low curved armour maintain the original cannon silhouette.
bearing('Turret slew ring',(0,-.07,.86),.205,.11,'Turret_Yaw',axis='Z')
loft('Turret cradle',[(.90,.40,.46,.12,0,-.08),(.96,.54,.56,.13,0,-.08),(1.10,.46,.51,.13,0,-.11),(1.16,.34,.40,.12,0,-.15)],'Ceramic','Turret_Yaw')
for s in [-1,1]:bearing('Elevation trunnion',(s*.21,-.02,1.055),.075,.055,'Gun_Pitch')
# Sliding breech and two long electromagnetic rails, with clearly open acceleration channel.
loft('Recoil breech',[(.955,.34,.49,.075,0,-.17),(1.025,.40,.53,.10,0,-.17),(1.19,.32,.46,.11,0,-.20),(1.225,.22,.36,.08,0,-.22)],'Graphite','Recoil_Carriage')
loft('Breech ceramic crown',[(1.175,.34,.43,.10,0,-.20),(1.235,.29,.40,.10,0,-.21),(1.26,.23,.34,.09,0,-.22)],'Ceramic','Recoil_Carriage')
panel('Breech coloured saddle',(0,-.22,1.26),(.115,.29,.018),'Team','Recoil_Carriage',r=.045)
for s in [-1,1]:
 # Custom tapered longitudinal sections, broader coils near breech, slim muzzle.
 loft('Accelerator rail structure',[(.00,.13,.145,.025,s*.145,1.055),(.18,.145,.16,.025,s*.145,1.055),(.77,.115,.13,.023,s*.145,1.055),(1.10,.10,.115,.02,s*.145,1.055)],'Graphite','Recoil_Carriage',axis='Y')
 loft('Rail ceramic fairing',[(.01,.085,.095,.025,s*.205,1.09),(.13,.10,.11,.025,s*.205,1.09),(.55,.085,.085,.02,s*.198,1.085),(.65,.055,.065,.018,s*.19,1.08)],'Ceramic','Recoil_Carriage',axis='Y')
 loft('Rail team upper inset',[(.13,.065,.022,.009,s*.148,1.142),(.58,.058,.020,.008,s*.148,1.129)],'Team','Recoil_Carriage',axis='Y')
 loft('Conductor strip',[(.12,.017,.025,.006,s*.087,1.07),(1.075,.017,.025,.006,s*.097,1.07)],'Optics','Recoil_Carriage',axis='Y')
 for j in range(6):
  y=.12+j*.135;panel('Electromagnetic winding',(s*.16,y,1.042),(.15,.044,.17),'Alloy','Recoil_Carriage',r=.012)
  panel('Coil insulator',(s*.16,y,1.135),(.12,.046,.022),'Graphite','Recoil_Carriage',r=.008)
 # Ceramic muzzle jaws, chamfered shaped end pieces rather than a solid blocking muzzle.
 loft('Muzzle ceramic jaw',[(.98,.13,.155,.025,s*.145,1.055),(1.10,.145,.16,.025,s*.145,1.055),(1.16,.12,.13,.025,s*.145,1.055)],'Ceramic','Recoil_Carriage',axis='Y')
 loft('Muzzle aperture',[(1.161,.061,.074,.012,s*.145,1.055),(1.164,.061,.074,.012,s*.145,1.055)],'Graphite','Recoil_Carriage',axis='Y')
 panel('Breech charge cell',(s*.21,-.28,1.105),(.052,.19,.085),'Team','Recoil_Carriage',r=.022)
 for j in range(3):panel('Charge status LED',(s*.24,-.32+j*.041,1.11),(.01,.018,.035),'Optics','Recoil_Carriage',r=.004)
# Small sensor and markings retain the friendly HEXFRONT read from above.
rod('Antenna base',(.25,-.31,.80),(.25,-.31,.88),.031,'Graphite');rod('Antenna',(.25,-.31,.87),(.25,-.31,1.25),.011,'Alloy');rod('Antenna tip',(.25,-.31,1.23),(.25,-.31,1.29),.018,'Team')
for x in [-.025,.025]:panel('Dorsal unit stripe',(x,.16,.851),(.018,.11,.006),'Marking',r=.004)
# Recessed service panels, mechanical fasteners and serial details stay visible in close-up.
for sign in [-1,1]:
 for y in [-.23,.18]:
  rod('Shoulder panel screw',(sign*.453,y,.727),(sign*.464,y,.727),.012,'Graphite',N=8)
  rod('Shoulder screw slot',(sign*.464,y,.727),(sign*.466,y,.727),.0045,'Alloy',N=6)
 for y in [-.11,-.015,.08]:
  panel('Chassis radiator slot',(sign*.30,y,.823),(.046,.068,.007),'Graphite',r=.01)
 for y in [.25,.52]:
  rod('Rail shroud fastener',(sign*.247,y,1.078),(sign*.251,y,1.078),.009,'Graphite','Recoil_Carriage',N=8)
 # Engraved technical designation on each coloured shoulder fairing.
 bpy.ops.object.text_add(location=(sign*.459,-.045,.725),rotation=(math.pi/2,0,sign*math.pi/2));t=bpy.context.object;t.name='Unit designation R03';t.data.body='R03';t.data.size=.055;t.data.align_x='CENTER';t.data.extrude=.0004;t.data.materials.append(M['Marking']);bpy.ops.object.convert(target='MESH');t.data.transform(t.matrix_world);t.parent=nodes['Body'];t.matrix_basis.identity();t.data.transform(Matrix.Translation(-origin['Body']))
for side in ['LF','LB','RF','RB']:
 knee=origin['Knee_'+side];ankle=origin['Ankle_'+side]
 for q in [.35,.68]:
  c=knee.lerp(ankle,q)+Vector((0,.098,0));rod('Shin recessed screw',c,c+Vector((0,.005,0)),.009,'Graphite','Knee_'+side,N=8)
# One small PBR palette atlas for non-team surfaces reduces the runtime to two materials per assembly.
# UVs remain editable; colours/metallic/roughness/emission are genuine exported textures.
import numpy as np
names=[n for n in M if n!='Team'];size=512;tile=128
rgba=np.ones((size,size,4),dtype=np.float32);orm=np.ones_like(rgba);emit=np.zeros_like(rgba);emit[:,:,3]=1
rng=np.random.default_rng(31)
for idx,name in enumerate(names):
 row,col=divmod(idx,4);bs=M[name].node_tree.nodes.get('Principled BSDF');base=np.array(bs.inputs['Base Color'].default_value[:3]);rough=bs.inputs['Roughness'].default_value;metal=bs.inputs['Metallic'].default_value;strength=bs.inputs['Emission Strength'].default_value
 yy,xx=np.mgrid[0:tile,0:tile];grain=rng.normal(0,.006,(tile,tile));brushed=.005*np.sin(yy*.7) if name=='Alloy' else 0
 block=rgba[row*tile:(row+1)*tile,col*tile:(col+1)*tile];block[:,:,:3]=np.clip(base[None,None,:]*(1+grain[:,:,None]+np.asarray(brushed).reshape(tile,tile,1) if isinstance(brushed,np.ndarray) else 1+grain[:,:,None]),0,1)
 orm[row*tile:(row+1)*tile,col*tile:(col+1)*tile,1]=rough;orm[row*tile:(row+1)*tile,col*tile:(col+1)*tile,2]=metal
 if strength:emit[row*tile:(row+1)*tile,col*tile:(col+1)*tile,:3]=base

def image(name,pixels):
 im=bpy.data.images.new(name,width=size,height=size,alpha=True);im.colorspace_settings.name='Non-Color';im.pixels.foreach_set(pixels.ravel());im.pack();return im
surface=bpy.data.materials.new('Railgun_Surface');surface.use_nodes=True;bs=surface.node_tree.nodes.get('Principled BSDF');links=surface.node_tree.links
for label,pixels,socket in [('Albedo',rgba,'Base Color'),('Emission',emit,'Emission Color')]:
 tex=surface.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image('Railgun_'+label,pixels);links.new(tex.outputs['Color'],bs.inputs[socket])
bs.inputs['Emission Strength'].default_value=1.4
tex=surface.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image('Railgun_ORM',orm);sep=surface.node_tree.nodes.new('ShaderNodeSeparateColor');links.new(tex.outputs['Color'],sep.inputs['Color']);links.new(sep.outputs['Green'],bs.inputs['Roughness']);links.new(sep.outputs['Blue'],bs.inputs['Metallic'])
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 source=o.data.materials[0].name
 if source=='Team':continue
 idx=names.index(source);row,col=divmod(idx,4);uv=o.data.uv_layers.new(name='PaletteUV')
 for f in o.data.polygons:
  axis=max(range(3),key=lambda k:abs(f.normal[k]));axes=[k for k in range(3) if k!=axis]
  for li in f.loop_indices:
   co=o.data.vertices[o.data.loops[li].vertex_index].co
   uv.data[li].uv=((col+(0.05+(float(co[axes[0]])*1.37)%1*.90))/4,(row+(0.05+(float(co[axes[1]])*1.37)%1*.90))/4)
 o.data.materials.clear();o.data.materials.append(surface)
# Group each rigid assembly; all surfaces remain editable meshes in the .blend.
bpy.context.view_layer.update()
for name,node in nodes.items():
 children=[o for o in node.children if o.type=='MESH']
 if not children:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in children:o.select_set(True)
 bpy.context.view_layer.objects.active=children[0];bpy.ops.object.join();children[0].name=name+'_Geometry'
# Mechanical proof clips, deliberately not presented as final combat animations.
rest={n:(o.location.copy(),o.rotation_euler.copy()) for n,o in nodes.items()};fps=30;bpy.context.scene.render.fps=fps
for clip,duration in [('Idle',3),('Aim_Check',4),('Joint_Check',4),('Recoil_Check',1.5)]:
 for frame in range(round(duration*fps)+1):
  t=frame/fps;p=t/duration
  for n,o in nodes.items():o.location=rest[n][0];o.rotation_euler=(0,0,0)
  if clip=='Idle':nodes['Gun_Pitch'].rotation_euler.x=.006*math.sin(p*math.tau)
  if clip=='Aim_Check':nodes['Turret_Yaw'].rotation_euler.z=.45*math.sin(p*math.tau);nodes['Gun_Pitch'].rotation_euler.x=.12*math.sin(p*math.tau)
  if clip=='Joint_Check':
   for side,offset in [('LF',0),('RB',0),('RF',math.pi),('LB',math.pi)]:
    q=math.sin(p*math.tau+offset);nodes['Hip_'+side].rotation_euler.x=.12*q;nodes['Knee_'+side].rotation_euler.x=-.22*q;nodes['Ankle_'+side].rotation_euler.x=.10*q
  if clip=='Recoil_Check':
   q=max(0,1-abs(t-.5)/.18);nodes['Recoil_Carriage'].location.y-=.085*q
  for n,o in nodes.items():
   if n in ['Railgun_Root','Muzzle','Charge_Socket']:continue
   o.keyframe_insert('location',frame=frame);o.keyframe_insert('rotation_euler',frame=frame)
 for n,o in nodes.items():
  if not o.animation_data or not o.animation_data.action:continue
  action=o.animation_data.action;action.name=clip+'_'+n
  for layer in action.layers:
   for strip in layer.strips:
    for bag in strip.channelbags:
     for fc in bag.fcurves:
      for k in fc.keyframe_points:k.interpolation='LINEAR'
  tr=o.animation_data.nla_tracks.new();tr.name=clip;tr.strips.new(clip,0,action);o.animation_data.action=None
for n,o in nodes.items():
 o.location=rest[n][0];o.rotation_euler=(0,0,0)
 if o.animation_data:
  for tr in o.animation_data.nla_tracks:tr.mute=True
bpy.context.scene.frame_start=0;bpy.context.scene.frame_end=120;bpy.context.view_layer.update()
help=bpy.data.texts.new('PLAY_CLIP.py');help.write("import bpy\nclip='Aim_Check' # Idle, Aim_Check, Joint_Check, Recoil_Check\nfor o in bpy.data.objects:\n if o.animation_data:\n  for t in o.animation_data.nla_tracks:t.mute=t.name!=clip\nbpy.context.scene.frame_set(0)\n")
bpy.ops.wm.save_as_mainfile(filepath=str(R/'art/railgun-v1/railgun-source.blend'))
for o in nodes.values():
 if o.animation_data:
  for tr in o.animation_data.nla_tracks:tr.mute=False
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(OUT/'railgun.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_extras=True)
(OUT/'manifest.json').write_text(json.dumps({'status':'separate approval model; no game integration','height':1.29,'front':'-Z','joints':list(nodes),'materials':['Railgun_Surface','Team'],'palette':list(M),'clips':['Idle','Aim_Check','Joint_Check','Recoil_Check'],'note':'Joint_Check proves articulated geometry. It is not a finished grounded locomotion clip.'},indent=2),encoding='utf-8')
print('RAILGUN_EXPORT_COMPLETE')
