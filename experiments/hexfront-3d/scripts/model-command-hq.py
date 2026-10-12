"""Original HEXFRONT Command HQ, authored in Blender 5.2.
Run: blender --background --python scripts/model-command-hq.py
Front = +Y. Designed panel volumes, open hangar and closed parabolic dish.
The existing PIP/Seed library is deliberately never read or overwritten.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1]; OUT=R/'public/assets/command-hq'; OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def linear(v): return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def material(name,h,rough,metal=0,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');c=tuple(linear(int(h[i:i+2],16)/255) for i in (0,2,4))
 p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emit
 return m
M={n:material(n,*v) for n,v in {
 'HQ_Ceramic':('DDDCD0',.36,.13),'HQ_Team':('E89842',.38,.23),
 'HQ_Metal':('394346',.42,.63),'HQ_Alloy':('838F8E',.31,.72),
 'HQ_Recess':('172123',.69,.17),'HQ_Glass':('233B42',.21,.46),
 'HQ_Lights':('FFC175',.28,.12,.45),'HQ_Core':('FFD9A2',.26,.18,.45),
 'HQ_Wear':('797C74',.65,.25)}.items()}
def group(name,parent=None,loc=(0,0,0)):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;o.location=loc;return o
root=group('CommandHQ'); static=group('HQ_Static',root)
def finish(o,name,mat,parent,bevel=0):
 o.name=name;o.parent=parent;o.data.materials.clear();o.data.materials.append(M[mat]);bpy.context.view_layer.objects.active=o
 if bevel:
  b=o.modifiers.new('Machined edge radius','BEVEL');b.width=bevel;b.segments=3;b.limit_method='ANGLE';b.angle_limit=.45
  bpy.ops.object.modifier_apply(modifier=b.name)
 for p in o.data.polygons:p.use_smooth=True
 w=o.modifiers.new('Area weighted panel normals','WEIGHTED_NORMAL');w.keep_sharp=True;w.weight=50;bpy.ops.object.modifier_apply(modifier=w.name)
 return o
def mesh(name,v,f,mat,parent=static,bevel=.006):
 me=bpy.data.meshes.new(name);me.from_pydata(v,[],f);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);return finish(o,name,mat,parent,bevel)
def box(name,pos,size,mat,parent=static,bevel=.012):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,mat,parent,bevel)
def cylinder(name,pos,r,d,mat,parent=static,n=32,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=d,location=pos,rotation=rot);return finish(bpy.context.object,name,mat,parent,min(.005,d/6))
def rr(w,d,r,n=10):
 return [(cx+r*math.cos(a),cy+r*math.sin(a)) for cx,cy,start in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)] for a in [math.radians(start+i*90/n) for i in range(n+1)]]
def volume(name,levels,mat,parent=static,offset=(0,0),cut=False):
 # A rounded rectangular architectural section with a deliberately stepped roof.
 rings=[[(x+offset[0],y+offset[1],z) for x,y in rr(w,d,r)] for z,w,d,r in levels];n=len(rings[0]);v=sum(rings,[])
 f=[tuple(reversed(range(n))),tuple((len(rings)-1)*n+i for i in range(n))]+[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(len(rings)-1) for i in range(n)]
 o=mesh(name,v,f,mat,parent,.004)
 if cut:
  cutter=box('Hangar negative',(0,.57,.295),(.62,1.04,.47),'HQ_Recess',parent,.045)
  bpy.context.view_layer.objects.active=o;b=o.modifiers.new('Actual hangar cavity','BOOLEAN');b.operation='DIFFERENCE';b.object=cutter;b.solver='EXACT';bpy.ops.object.modifier_apply(modifier=b.name);bpy.data.objects.remove(cutter,do_unlink=True)
 return o
def plate_run(name,levels,mat,offset=(0,0),parent=static,gap=.008,omit_front=False):
 # Independent shell segments: actual open joints reveal the dark pressure hull.
 rings=[[(x+offset[0],y+offset[1],z) for x,y in rr(w,d,r)] for z,w,d,r in levels];n=len(rings[0])
 # Eleven samples per corner. Group curved corners with the adjacent half side.
 for j in range(0,n,11):
  ids=[(j+k)%n for k in range(12)]
  v=[rings[i][k] for i in range(len(rings)) for k in ids];stride=len(ids)
  # Shrink end faces slightly, leaving consistent manufactured panel gaps.
  for i in range(len(rings)):
   a=Vector(v[i*stride]);b=Vector(v[i*stride+1]);v[i*stride]=tuple(a+(b-a).normalized()*gap)
   a=Vector(v[i*stride+stride-1]);b=Vector(v[i*stride+stride-2]);v[i*stride+stride-1]=tuple(a+(b-a).normalized()*gap)
  f=[(i*stride+k,i*stride+k+1,(i+1)*stride+k+1,(i+1)*stride+k) for i in range(len(rings)-1) for k in range(stride-1)]
  o=mesh(name+str(j),v,f,mat,parent,0)
  bpy.context.view_layer.objects.active=o;b=o.modifiers.new('Real shell thickness','SOLIDIFY');b.thickness=.021;b.offset=-1;bpy.ops.object.modifier_apply(modifier=b.name)
  b=o.modifiers.new('Panel edge glints','BEVEL');b.width=.004;b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name)
  if omit_front:
   cutter=box('Portal clearance',(0,.67,.29),(.68,1.0,.49),'HQ_Recess',parent,.045);bpy.context.view_layer.objects.active=o;b=o.modifiers.new('Front portal opening','BOOLEAN');b.operation='DIFFERENCE';b.object=cutter;bpy.ops.object.modifier_apply(modifier=b.name);bpy.data.objects.remove(cutter,do_unlink=True)
def arch(name,outer,inner,y,depth,mat,parent=static):
 # Closed chamfered door surround, not a tube laid over a solid wall.
 def outline(w,b,t,ch):return [(-w,b),(w,b),(w,t-ch),(w-ch,t),(-w+ch,t),(-w,t-ch)]
 a=outline(*outer);b=outline(*inner);n=len(a);v=[(x,Y,z) for Y in [y-depth/2,y+depth/2] for poly in [a,b] for x,z in poly];f=[]
 for i in range(n):
  k=(i+1)%n;f.extend([(i,k,n+k,n+i),(2*n+i,3*n+i,3*n+k,2*n+k),(i,2*n+i,2*n+k,k),(n+i,n+k,3*n+k,3*n+i)])
 return mesh(name,v,f,mat,parent,.008)
def rod(name,a,b,r,mat,parent=static):
 a=Vector(a);b=Vector(b);o=cylinder(name,(a+b)/2,r,(b-a).length,mat,parent,16);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o

# Foundation follows the footprint; front ramp occupies the existing docking lane.
volume('Recessed footing',[(.02,1.56,1.10,.22),(.07,1.62,1.16,.22),(.13,1.58,1.12,.20)],'HQ_Metal',offset=(0,-.06))
volume('Pressure hull',[(.11,1.47,.98,.21),(.28,1.53,1.05,.25),(.51,1.41,.95,.25),(.59,1.24,.82,.23)],'HQ_Recess',offset=(0,-.06),cut=True)
plate_run('Lower ceramic shoulder',[(.16,1.57,1.09,.22),(.35,1.60,1.12,.25),(.52,1.48,1.03,.25),(.595,1.30,.89,.23)],'HQ_Ceramic',offset=(0,-.06),omit_front=True)
plate_run('Armoured sill',[(.095,1.57,1.09,.23),(.15,1.59,1.11,.23)],'HQ_Team',offset=(0,-.06),omit_front=True)
volume('Shoulder roof',[(.578,1.32,.90,.23),(.610,1.29,.87,.23)],'HQ_Ceramic',offset=(0,-.06))
arch('Portal outer armour',(.385,.105,.555,.11),(.315,.10,.485,.09),.478,.10,'HQ_Team')
arch('Portal dark inner collar',(.316,.10,.486,.09),(.266,.103,.436,.065),.485,.105,'HQ_Metal')
arch('Recessed hangar seal',(.271,.107,.439,.065),(.244,.105,.410,.05),.414,.027,'HQ_Alloy')
box('Hangar interior rear',(0,.135,.265),(.54,.045,.33),'HQ_Recess')
box('Hangar ceiling lamp',(0,.502,.417),(.30,.027,.023),'HQ_Lights',bevel=.006)
box('Interior strip',(0,.299,.334),(.30,.012,.016),'HQ_Lights',bevel=.004)
door=group('Hangar_Door',root,(0,.26,.18))
box('Armoured shutter',(0,0,.095),(.475,.035,.205),'HQ_Metal',door,.01)
for z in [.045,.115,.18]:box('Door lamella',(0,.025,z),(.438,.023,.037),'HQ_Alloy',door,.004)
box('Door status',(0,.040,.116),(.19,.012,.018),'HQ_Lights',door,.003)
# Ramp is a bespoke sloped solid with side guards, not decorative cross-bars.
v=[(-.27,.40,.10),(.27,.40,.10),(.30,.96,.025),(-.30,.96,.025),(-.27,.40,.14),(.27,.40,.14),(.30,.96,.055),(-.30,.96,.055)]
mesh('Dock ramp',v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'HQ_Metal')
for s in [-1,1]:
 rod('Ramp guide',(s*.256,.44,.15),(s*.287,.91,.073),.016,'HQ_Team')
 rod('Ramp inset light',(s*.239,.55,.132),(s*.259,.81,.092),.006,'HQ_Lights')
 # Recessed service cheek; louvres sit inside a dark frame, below shell face.
 pod=group('Service cheek '+str(s),static,(s*.675,.12,0))
 volume('Service armoured module',[(.11,.29,.48,.07),(.31,.34,.49,.09),(.49,.29,.43,.085)],'HQ_Metal',pod)
 box('Inset radiator well',(s*.148,.015,.30),(.016,.27,.21),'HQ_Recess',pod,.018)
 for z in [.235,.278,.321,.364]:box('Recessed cooling louvre',(s*.164,.015,z),(.019,.21,.012),'HQ_Alloy',pod,.003)
 volume('Service cap',[(.478,.295,.432,.086),(.51,.256,.39,.08)],'HQ_Team',pod)
 cylinder('Service socket',(s*.54,.46,.25),.034,.014,'HQ_Alloy',rot=(math.pi/2,0,0),n=16)
 cylinder('Socket inset',(s*.54,.469,.25),.021,.018,'HQ_Recess',rot=(math.pi/2,0,0),n=16)

# Boolean pockets remove the ceramic behind each radiator cheek.
for o in list(bpy.data.objects):
 if o.type=='MESH' and o.name.startswith('Lower ceramic shoulder'):
  for side in [-1,1]:
   cutter=box('Radiator negative',(side*.80,.12,.32),(.24,.35,.37),'HQ_Recess',bevel=.028)
   bpy.context.view_layer.objects.active=o;b=o.modifiers.new('Radiator clearance','BOOLEAN');b.operation='DIFFERENCE';b.object=cutter;bpy.ops.object.modifier_apply(modifier=b.name);bpy.data.objects.remove(cutter,do_unlink=True)

# Distinct raised command module, set back and offset from the hangar axis.
cx,cy=-.215,-.175
volume('Command isolation gasket',[(.604,.91,.72,.16),(.656,.92,.72,.17)],'HQ_Metal',offset=(cx,cy))
volume('Command pressure vessel',[(.65,.84,.64,.17),(.82,.86,.65,.18),(.967,.73,.54,.15)],'HQ_Recess',offset=(cx,cy))
plate_run('Command ceramic plate',[(.666,.917,.719,.18),(.83,.93,.724,.19),(.968,.79,.61,.16)],'HQ_Ceramic',offset=(cx,cy),gap=.009)
volume('Command roof crown',[(.962,.80,.62,.16),(.995,.73,.55,.14)],'HQ_Team',offset=(cx,cy))
box('Forward command recess',(cx,.184,.812),(.34,.046,.183),'HQ_Metal',bevel=.043)
box('Command viewport',(cx,.211,.825),(.267,.027,.075),'HQ_Glass',bevel=.022)
box('Viewport status',(cx,.226,.775),(.13,.01,.012),'HQ_Lights',bevel=.002)
for s in [-1,1]:box('Command flank light',(cx+s*.371,cy,.768),(.018,.26,.024),'HQ_Lights',bevel=.005)
# Designed roof equipment: one canted sensor spine, clustered comms mast, access well.
volume('Sensor foot',[(.990,.29,.29,.05),(1.045,.26,.25,.05)],'HQ_Metal',offset=(cx-.10,cy-.03))
spine=volume('Canted sensor housing',[(1.03,.16,.20,.04),(1.19,.18,.16,.04),(1.28,.11,.13,.025)],'HQ_Ceramic',offset=(cx-.13,cy-.06))
box('Sensor dark slot',(cx-.13,cy+.026,1.157),(.082,.018,.15),'HQ_Recess',bevel=.01)
box('Sensor team crest',(cx-.13,cy+.028,1.249),(.071,.024,.035),'HQ_Team',bevel=.006)
cylinder('Comms plinth',(cx+.12,cy-.13,1.024),.094,.06,'HQ_Metal')
for x,y,h in [(cx+.10,cy-.15,1.39),(cx+.17,cy-.18,1.31),(cx+.17,cy-.09,1.21)]:
 cylinder('Tapered antenna base',(x,y,1.074),.020,.07,'HQ_Alloy',n=16)
 rod('Antenna shaft',(x,y,1.08),(x,y,h),.010,'HQ_Metal')
 cylinder('Signal cap',(x,y,h),.013,.026,'HQ_Lights',n=16)
core=group('HQ_EnergyCore',root,(cx+.19,cy+.105,1.015))
cylinder('Energy seat',(0,0,0),.070,.032,'HQ_Metal',core)
cylinder('Energy lens',(0,0,.022),.049,.018,'HQ_Core',core)
for i in range(4):
 a=i*math.tau/4;box('Core restraint',(math.cos(a)*.053,math.sin(a)*.053,.025),(.02,.02,.018),'HQ_Alloy',core,.004)

# Readable roof services and actual inset details. No decorative pipe forest.
for x in [cx-.23,cx+.24]:
 box('Roof service rail',(x,cy-.03,1.007),(.025,.26,.022),'HQ_Alloy',bevel=.005)
box('Control cartridge',(cx+.14,cy+.06,1.066),(.13,.13,.11),'HQ_Metal',bevel=.018)
box('Control ceramic lid',(cx+.14,cy+.06,1.126),(.125,.125,.02),'HQ_Ceramic',bevel=.008)
box('Cartridge face inset',(cx+.14,cy+.13,1.068),(.081,.008,.055),'HQ_Recess',bevel=.007)
for z in [1.05,1.07,1.09]:box('Cartridge indicator',(cx+.14,cy+.136,z),(.052,.008,.004),'HQ_Alloy',bevel=.001)
for z in [1.105,1.14,1.175]:box('Sensor recessed ribs',(cx-.13,cy+.035,z),(.060,.012,.013),'HQ_Alloy',bevel=.003)
# A socket with a deeply seated optical element identifies the command module.
box('Command front socket seat',(cx,.230,.820),(.15,.045,.145),'HQ_Metal',bevel=.025)
cylinder('Command socket bezel',(cx,.261,.82),.055,.022,'HQ_Alloy',rot=(math.pi/2,0,0),n=32)
cylinder('Command socket seal',(cx,.274,.82),.043,.018,'HQ_Recess',rot=(math.pi/2,0,0),n=32)
cylinder('Command optic',(cx,.287,.82),.027,.015,'HQ_Core',rot=(math.pi/2,0,0),n=32)
# Small floating panel ribs subdivide the broad roof without cluttering it.
for x,y in [(-.56,.21),(-.48,-.40),(.10,-.42)]:
 box('Shoulder maintenance inset',(x,y,.612),(.15,.058,.007),'HQ_Metal',bevel=.009)
 box('Shoulder hatch',(x,y,.619),(.119,.038,.008),'HQ_Alloy',bevel=.005)
# Offset radar on a genuine azimuth + tilt gimbal. Concave front, convex back,
# sealed rim and rear braces; no open cylinder ends or coincident flat disks.
volume('Radar shoulder pedestal',[(.58,.40,.43,.07),(.64,.39,.41,.07),(.715,.28,.29,.06)],'HQ_Metal',offset=(.49,-.17))
plate_run('Radar pedestal trim',[(.595,.402,.432,.07),(.622,.395,.425,.07)],'HQ_Team',offset=(.49,-.17))
radar=group('Radar_Pivot',root,(.49,-.17,.723));radar.rotation_euler[2]=math.radians(-18)
cylinder('Azimuth bearing',(0,0,0),.126,.045,'HQ_Alloy',radar)
for x in [-.10,.10]:box('Gimbal fork',(x,0,.092),(.04,.10,.17),'HQ_Metal',radar,.015)
rod('Tilt axle',(-.14,0,.15),(.14,0,.15),.035,'HQ_Alloy',radar)
tilt=group('Dish_Tilt',radar,(0,0,.15));tilt.rotation_euler[0]=math.radians(-26)
def dish():
 n=64;nr=8;v=[]
 # tiny central ring avoids degenerate triangles while feed boss covers the hole.
 for back in [False,True]:
  for j in range(nr+1):
   r=.004+(.286-.004)*j/nr;z=.095*(r/.286)**2-(.018 if back else 0)
   for i in range(n):a=i*math.tau/n;v.append((math.cos(a)*r,math.sin(a)*r,z))
 f=[];count=(nr+1)*n
 for side in range(2):
  for j in range(nr):
   for i in range(n):q=(side*count+j*n+i,side*count+j*n+(i+1)%n,side*count+(j+1)*n+(i+1)%n,side*count+(j+1)*n+i);f.append(tuple(reversed(q)) if side==0 else q)
 for i in range(n):k=(i+1)%n;f.extend([(nr*n+i,count+nr*n+i,count+nr*n+k,nr*n+k),(i,k,count+k,count+i)])
 mesh('Parabolic ceramic reflector',v,f,'HQ_Ceramic',tilt,0)
 # A closed swept rim, with four team colour segments rather than a flat decal.
 for j in range(4):
  verts=[];N=16
  for r,z in [(.278,.084),(.293,.084),(.294,.101),(.281,.107)]:
   for i in range(N+1):a=(j+i/N)*math.tau/4;verts.append((r*math.cos(a),r*math.sin(a),z))
  faces=[(k*(N+1)+i,k*(N+1)+i+1,((k+1)%4)*(N+1)+i+1,((k+1)%4)*(N+1)+i) for k in range(4) for i in range(N)]
  faces.extend([tuple(k*(N+1) for k in reversed(range(4))),tuple(k*(N+1)+N for k in range(4))]);mesh('Reflector rim '+str(j),verts,faces,'HQ_Team' if j%2 else 'HQ_Alloy',tilt,.002)
 cylinder('Dish hub',(0,0,-.02),.064,.065,'HQ_Metal',tilt)
 rod('Receiver arm',(0,0,.005),(0,0,.21),.015,'HQ_Metal',tilt)
 cylinder('Receiver capsule',(0,0,.214),.033,.055,'HQ_Team',tilt)
 cylinder('Receiver tip',(0,0,.246),.024,.012,'HQ_Lights',tilt)
 for j in range(4):
  a=j*math.tau/4
  rod('Rear structural brace',(math.cos(a)*.052,math.sin(a)*.052,-.028),(math.cos(a)*.245,math.sin(a)*.245,.045),.011,'HQ_Alloy',tilt)
dish()
# The pivot axle sits behind the reflector, never through its concave face.
for o in tilt.children:o.location.z+=.070
# Selective hardware and wear marks, never a blanket of rivets.
for x,y,z in [(-.56,.32,.559),(.51,.32,.563),(-.61,-.37,.564),(.04,-.44,.985),(-.48,-.38,.986)]:
 cylinder('Flush panel fastener',(x,y,z),.010,.004,'HQ_Alloy',n=12)
for x,y,z,w in [(-.47,.29,.586,.042),(.55,.28,.572,.03),(-.41,-.05,.995,.035)]:box('Edge use mark',(x,y,z),(w,.008,.002),'HQ_Wear',bevel=0)

# Tiny original roughness variation, packed into glTF's G channel. Kept quiet
# so the manufactured silhouettes remain legible at tactical scale.
import random
rng=random.Random(81)
for name in ['HQ_Ceramic','HQ_Team','HQ_Metal','HQ_Alloy']:
 m=M[name];p=m.node_tree.nodes.get('Principled BSDF');rough=p.inputs['Roughness'].default_value
 im=bpy.data.images.new(name+' surface finish',width=128,height=128);im.colorspace_settings.name='Non-Color'
 pixels=[]
 for y in range(128):
  for x in range(128):
   v=rough+(rng.random()-.5)*.045+.008*math.sin(x*.11+y*.07);pixels.extend((1,v,1,1))
 im.pixels.foreach_set(pixels);im.pack()
 t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=im
 sep=m.node_tree.nodes.new('ShaderNodeSeparateColor');m.node_tree.links.new(t.outputs['Color'],sep.inputs[0]);m.node_tree.links.new(sep.outputs['Green'],p.inputs['Roughness'])

# Consistent world-length UVs for fine coating grain; preserve named editable
# pieces and modifiers in the .blend, then batch GLB by articulation/material.
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 uv=o.data.uv_layers.new(name='Surface');o.data.update()
 for p in o.data.polygons:
  axis=max(range(3),key=lambda j:abs(p.normal[j]));axes=[j for j in range(3) if j!=axis]
  for li in p.loop_indices:
   co=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(co[axes[0]]*2,co[axes[1]]*2)
bpy.context.preferences.filepaths.save_version=0;bpy.context.preferences.filepaths.file_preview_type='NONE'
bpy.ops.wm.save_as_mainfile(filepath=str(R/'scripts/command-hq-source.blend'))
buckets={}
for o in list(bpy.data.objects):
 if o.type=='MESH':
  p=o.parent
  while p not in [static,radar,tilt,door,core,root] and p is not None:p=p.parent
  # Parent transforms baked when reparenting before joining.
  world=o.matrix_world.copy();o.parent=p;o.matrix_world=world
  buckets.setdefault((p,o.data.materials[0].name),[]).append(o)
for (parent,mat),objects in buckets.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 if len(objects)>1:bpy.ops.object.join()
 bpy.context.object.name=parent.name+'_'+mat
stats={'authoring':'Blender '+bpy.app.version_string,'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.data.objects if o.type=='MESH'),'meshes':len([o for o in bpy.data.objects if o.type=='MESH']),'articulations':['Radar_Pivot','Dish_Tilt','Hangar_Door','HQ_EnergyCore'],'source':'Original mesh architecture following the user-provided HQ reference; no third-party model.'}
bpy.ops.export_scene.gltf(filepath=str(OUT/'command-hq.glb'),export_format='GLB',export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
stats['bytes']=(OUT/'command-hq.glb').stat().st_size;(OUT/'manifest.json').write_text(json.dumps(stats,indent=2)+'\n');print('COMMAND_HQ',json.dumps(stats))
