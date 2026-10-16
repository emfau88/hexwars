"""HEXFRONT factory: original authored hard-surface mesh, Blender 5.2.
Front Blender +Y -> glTF -Z. Isolated preview asset, not loaded by the game.
Run blender --background --factory-startup --python art/factory-v1/model_factory.py
"""
import bpy, math, json, random, sys, struct
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2]
OUT=R/'public/models/factory-preview'; OUT.mkdir(parents=True,exist_ok=True)
ART=R/'art/factory-v1'; ART.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def linear(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def color(h):return tuple(linear(int(h[i:i+2],16)/255) for i in (0,2,4))
def mat(n,h,r=.4,m=.15,e=0):
 a=bpy.data.materials.new(n);a.use_nodes=True;p=a.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*color(h),1);p.inputs['Roughness'].default_value=r;p.inputs['Metallic'].default_value=m
 p.inputs['Emission Color'].default_value=(*color(h),1);p.inputs['Emission Strength'].default_value=e
 return a
M={n:mat(n,*v) for n,v in {
 'Ceramic':('DFDFD3',.38,.12),'CeramicLight':('F0EEE2',.32,.14),
 'Team':('F49A43',.37,.23),'Graphite':('263437',.48,.55),
 'Recess':('111E21',.58,.35),'Alloy':('6F8587',.32,.7),
 'Rubber':('192729',.8,.03),'Light':('A5E7DB',.28,.15,1.8),
 'WarmLight':('F9C779',.32,.1,1.3),'Marking':('D8C5A1',.55,.1)}.items()}
def empty(n,parent=None,loc=(0,0,0)):
 o=bpy.data.objects.new(n,None);bpy.context.collection.objects.link(o);o.parent=parent;o.location=loc;return o
root=empty('Factory_Root');body=empty('Factory_Body',root)
root['asset']='HEXFRONT compact robot factory v1';root['status']='approval preview only'
root['front']='-Z in glTF';root['clear_opening']='1.86 wide x 1.64 high'
def finish(o,n,ma,parent,bevel=0):
 o.name=n;o.parent=parent;o.data.materials.append(M[ma]);bpy.context.view_layer.objects.active=o
 if bevel:
  b=o.modifiers.new('Designed edge radius','BEVEL');b.width=bevel;b.segments=2;b.limit_method='ANGLE'
  bpy.ops.object.modifier_apply(modifier=b.name)
 for f in o.data.polygons:f.use_smooth=True
 w=o.modifiers.new('Weighted production normals','WEIGHTED_NORMAL');w.keep_sharp=True;w.weight=50
 bpy.ops.object.modifier_apply(modifier=w.name)
 return o
def mesh(n,v,f,ma='Ceramic',parent=body,bevel=.006):
 me=bpy.data.meshes.new(n);me.from_pydata(v,[],f);me.update()
 o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o)
 # Consistent outward normals on authored closed sections.
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
 return finish(o,n,ma,parent,bevel)
def plate(n,poly,axis,lo,hi,ma='Ceramic',parent=body,bevel=.006):
 # Extruded custom two-dimensional engineering outline, never a cube stack.
 v=[]
 for d in [lo,hi]:
  for a,b in poly:v.append((d,a,b) if axis=='X' else (a,d,b) if axis=='Y' else (a,b,d))
 N=len(poly);f=[tuple(reversed(range(N))),tuple(N+i for i in range(N))]
 f += [(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)]
 return mesh(n,v,f,ma,parent,bevel)
def rr(w,d,r,n=5,offset=(0,0)):
 return [(cx+r*math.cos(a)+offset[0],cy+r*math.sin(a)+offset[1])
 for cx,cy,start in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]
 for a in [math.radians(start+i*90/n) for i in range(n+1)]]
def panel(n,pos,size,ma,parent=body,r=.025,bevel=.005,axis='Z'):
 x,y,z=pos;w,d,h=size
 bevel=bevel if min(size)>.06 else 0
 steps=3 if max(size)>.8 else 2
 if axis=='Z':return plate(n,rr(w,d,min(r,w/2,d/2),steps,(x,y)),'Z',z-h/2,z+h/2,ma,parent,bevel)
 if axis=='Y':return plate(n,rr(w,h,min(r,w/2,h/2),steps,(x,z)),'Y',y-d/2,y+d/2,ma,parent,bevel)
 return plate(n,rr(d,h,min(r,d/2,h/2),steps,(y,z)),'X',x-w/2,x+w/2,ma,parent,bevel)
def tube(n,a,b,r,ma,parent=body,N=12):
 a,b=Vector(a),Vector(b);u=(b-a).normalized();x=u.cross(Vector((0,0,1)))
 if x.length<.01:x=u.cross(Vector((1,0,0)))
 x.normalize();y=u.cross(x)
 v=[tuple(c+r*(x*math.cos(i*math.tau/N)+y*math.sin(i*math.tau/N))) for c in [a,b] for i in range(N)]
 f=[tuple(reversed(range(N))),tuple(N+i for i in range(N))]+[(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)]
 return mesh(n,v,f,ma,parent,.002)
def arch(n,outer,inner,y0,y1,ma,parent=body):
 def shape(w,b,t,ch):return [(-w,b),(w,b),(w,t-ch),(w-ch,t),(-w+ch,t),(-w,t-ch)]
 A=shape(*outer);B=shape(*inner);N=len(A)
 v=[(x,y,z) for y in [y0,y1] for ring in [A,B] for x,z in ring];f=[]
 for i in range(N):
  j=(i+1)%N;f.extend([(i,j,N+j,N+i),(2*N+i,3*N+i,3*N+j,2*N+j),(i,2*N+i,2*N+j,j),(N+i,N+j,3*N+j,3*N+i)])
 return mesh(n,v,f,ma,parent,.006)
def shell_slice(n,points,y0,y1,ma='Ceramic'):
 # A curved, hollow armoured strip with visible thickness at its panel seams.
 v=[(x,y,z) for y in [y0,y1] for x,z in points];N=len(points)
 f=[(i,i+1,N+i+1,N+i) for i in range(N-1)]
 o=mesh(n,v,f,ma,body,0)
 bpy.context.view_layer.objects.active=o
 mod=o.modifiers.new('Real panel thickness','SOLIDIFY');mod.thickness=.035;mod.offset=-1
 bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('Soft ceramic seams','BEVEL');mod.width=.008;mod.segments=2
 bpy.ops.object.modifier_apply(modifier=mod.name)
 return o
# Floor and perimeter: flat entry, no raised ramp that would intercept current exits.
panel('Foundation gasket',(0,-.03,.025),(2.04,1.94,.05),'Graphite',r=.17)
panel('Interior floor',(0,.03,.047),(1.84,1.88,.025),'Graphite',r=.07)
for x in [-.78,.78]:
 panel('Floor rail',(x,.03,.068),(.042,1.83,.021),'Alloy',r=.01)
 panel('Rail guide light',(x,.65,.081),(.014,.30,.012),'WarmLight',r=.006)
for y in [-.74,-.35,.04,.43,.82]:
 panel('Floor service tile',(0,y,.067),(1.40,.36,.018),'Graphite',r=.045)
 for x in [-.62,.62]:panel('Floor fastener',(x,y,.079),(.025,.025,.006),'Alloy',r=.01,bevel=.001)
for x in [-.84,.84]:
 panel('Foundation corner bumper',((1 if x>0 else -1)*.982,.66,.15),(.098,.28,.25),'Team',r=.075)
 panel('Rear foundation bumper',(x,-.80,.14),(.32,.27,.23),'Team',r=.06)
# A continuous U-shell cross-section, split into manufactured ceramic bays.
# Side surfaces follow bulged curves rather than upright flat boxes.
left=[(-.95,.18),(-.991,.36),(-1.018,.80),(-1.014,1.28),(-.989,1.58),(-.949,1.77),(-.872,1.90),(-.74,1.973),(-.52,2.01),(0,2.025)]
profile=left+[(-x,z) for x,z in reversed(left[:-1])]
# Dark inner structural hull below the ceramic armour.
for sign in [-1,1]:
 side=[(sign*.955,.13),(sign*.969,1.60),(sign*.88,1.79),(sign*.72,1.89),(sign*.0,1.92)]
 shell_slice('Pressure hull '+str(sign),side,-.86,.65,'Graphite')
 # Three long panels with real joints; upper shoulder curves into the roof.
 pts=[(sign*abs(x),z) for x,z in left]
 for i,(a,b) in enumerate([(-.91,-.45),(-.432,.12),(.138,.67)]):
  shell_slice('Ceramic shoulder '+str(sign)+' bay '+str(i),pts,a,b)
 # Side recessed machinery inserts follow the surface and have proper inner pockets.
 sidepoly=[(-.36,.42),(.20,.42),(.28,.55),(.28,1.15),(.16,1.28),(-.41,1.28),(-.48,1.15),(-.48,.55)]
 plate('Recessed radiator surround',sidepoly,'X',sign*.998,sign*1.026,'Graphite',bevel=.018)
 for i in range(6):
  y=-.34+i*.092
  panel('Cooling louvre',(sign*1.029,y,.84),(.016,.043,.60),'Alloy',r=.012,axis='X',bevel=.002)
 # Slim team bands carry the HQ colour grammar without changing the silhouette.
 band=[(-.91,.27),(.67,.27),(.67,.41),(-.91,.41)]
 plate('Lower enamel belt',band,'X',sign*.983,sign*1.024,'Team',bevel=.01)
 for y in [-.71,.46]:
  panel('Side inset identification tab',(sign*1.018,y,1.34),(.018,.21,.09),'Team',axis='X',r=.026)
# Proper rear wall with a recessed access hatch, pipes, visible wiring chase.
rear=[(-.94,.12),(.94,.12),(.94,1.64),(.78,1.87),(-.78,1.87),(-.94,1.64)]
plate('Rear pressure bulkhead',rear,'Y',-.89,-.83,'Graphite',bevel=.018)
plate('Rear ceramic armour',[(-.94,.22),(.94,.22),(.94,1.57),(.77,1.87),(-.77,1.87),(-.94,1.57)],'Y',-.944,-.905,'Ceramic',bevel=.016)
panel('Rear maintenance recess',(0,-.972,.99),(1.12,.05,1.08),'Recess',axis='Y',r=.13,bevel=.01)
panel('Rear flush service lid',(0,-1.006,1.0),(.96,.035,.91),'Graphite',axis='Y',r=.12)
for x in [-.36,.36]:
 panel('Service hatch vertical rail',(x,-1.028,.99),(.035,.025,.71),'Alloy',axis='Y',r=.01,bevel=.002)
panel('Rear enamel latch',(0,-1.031,1.04),(.42,.025,.18),'Team',axis='Y',r=.035)
for x in [-.65,.65]:
 tube('Rear service conduit',(x,-.979,.38),(x,-.979,1.38),.035,'Graphite')
 for z in [.44,.92,1.30]:panel('Conduit clamp',(x,-1.014,z),(.13,.025,.07),'Alloy',axis='Y',r=.012)
# Recessed portal; the upper lintel has an actual void and houses the folded shutter.
arch('Portal graphite collar',(1.025,.045,1.985,.22),(.935,.055,1.77,.12),.60,.71,'Graphite')
arch('Ceramic portal armour',(1.028,.13,2.01,.21),(.958,.08,1.82,.13),.65,.775,'CeramicLight')
arch('Inner machined door track',(.953,.055,1.80,.12),(.93,.055,1.735,.09),.60,.71,'Alloy')
# Guard strips along curved jambs, not freestanding columns.
for sign in [-1,1]:
 polygon=[(sign*.966,.42),(sign*1.024,.42),(sign*1.024,1.56),(sign*.968,1.72),(sign*.926,1.70),(sign*.968,1.53)]
 plate('Portal enamel shoulder',polygon,'Y',.781,.804,'Team',bevel=.008)
 panel('Portal running light',(sign*.988,.814,1.25),(.024,.018,.34),'Light',axis='Y',r=.009,bevel=.002)
panel('Lintel status recess',(0,.790,1.917),(.50,.025,.095),'Recess',axis='Y',r=.035)
panel('Lintel status lamp',(0,.808,1.917),(.36,.014,.025),'Light',axis='Y',r=.011,bevel=.002)
# Ceiling, interior wall panels and ribs remain modelled with the door open.
panel('Hangar ceiling',(0,-.23,1.86),(1.86,1.08,.065),'Recess',r=.07)
for y in [-.65,-.20,.24]:
 for sign in [-1,1]:
  panel('Interior armoured wall',(sign*.944,y,.91),(.022,.38,1.42),'Graphite',axis='X',r=.045)
  panel('Wall rib',(sign*.945,y+.16,.91),(.025,.045,1.44),'Alloy',axis='X',r=.009,bevel=.002)
 panel('Ceiling beam',(0,y,1.817),(1.81,.06,.065),'Graphite',r=.02)
 panel('Hangar work lamp',(0,y+.05,1.791),(.90,.028,.016),'WarmLight',r=.012,bevel=.002)
for sign in [-1,1]:
 for y in [-.55,-.1]:
  panel('Interior service box',(sign*.888,y,.52),(.045,.20,.28),'Recess',axis='X',r=.035)
  panel('Interior status strip',(sign*.86,y,.60),(.012,.12,.025),'WarmLight',axis='X',r=.009,bevel=.001)
# A flattish industrial roof, with two flush radiator beds and a keyed module socket.
panel('Roof top ceramic crown',(0,-.08,2.005),(1.40,1.42,.055),'Ceramic',r=.21,bevel=.012)
for sign in [-1,1]:
 panel('Roof radiator inset',(sign*.63,-.38,2.05),(.26,.72,.035),'Recess',r=.07)
 for j in range(6):
  panel('Roof heat exchanger fin',(sign*.63,-.64+j*.102,2.075),(.215,.037,.025),'Alloy',r=.012,bevel=.002)
 panel('Roof enamel service cap',(sign*.62,-.005,2.09),(.27,.20,.07),'Team',r=.06)
# Socket and blind alignment pins are shared by all optional visual production cassettes.
socket=empty('Production_Socket',root,(0,-.34,2.055));socket['purpose']='visual module only; shared interface for drone, mech, rail'
panel('Cassette mounting gasket',(0,-.34,2.05),(.82,.94,.045),'Graphite',r=.13)
panel('Cassette interface',(0,-.34,2.078),(.72,.84,.035),'Team',r=.11)
for x in [-.27,.27]:
 for y in [-.64,-.04]:panel('Flush roof fixing',(x,y,2.104),(.043,.043,.012),'Alloy',r=.015,bevel=.002)

# Low shutter cassette. Clear pocket below; shell closes around the folded rigid panels.
plate('Shutter cassette roof',[(-.94,.08),(.94,.08),(1.01,.22),(1.01,.84),(.90,.96),(-.90,.96),(-1.01,.84),(-1.01,.22)],'Z',2.085,2.14,'Ceramic',bevel=.014)
panel('Cassette front brow',(0,.937,2.035),(1.84,.055,.155),'CeramicLight',axis='Y',r=.05,bevel=.009)
for sign in [-1,1]:
 plate('Cassette cheek',[(.08,1.87),(.90,1.87),(.94,2.04),(.84,2.14),(.15,2.14)],'X',sign*.942,sign*1.008,'Team',bevel=.012)
panel('Shutter top weather seal',(0,.727,1.719),(1.85,.045,.068),'Graphite',axis='Y',r=.015,bevel=.003)

# Four real shutter segments: separate rigid nodes, no scale-to-zero substitute.
doors=[]
for i in range(4):
 d=empty('Hangar_Segment_'+str(i+1),root,(0,.59,.267+i*.405));doors.append(d)
 d['animation']='Door_Open';d['closedHeight']=d.location.z;d['openHeight']=1.84+i*.012
 shape=[(-.907,-.194),(.907,-.194),(.919,-.17),(.919,.17),(.895,.194),(-.895,.194),(-.919,.17),(-.919,-.17)]
 plate('Shutter armour '+str(i+1),shape,'Y',-.032,.025,'Ceramic',d,.012)
 panel('Shutter lower edge '+str(i),(0,.033,-.16),(1.73,.023,.039),'Graphite',d,axis='Y',r=.01,bevel=.002)
 for x in [-.77,.77]:
  panel('Shutter carriage '+str(i),(x,.039,0),(.085,.038,.18),'Alloy',d,axis='Y',r=.018,bevel=.003)
  panel('Shutter enamel latch '+str(i),(x,.062,.005),(.057,.018,.065),'Team',d,axis='Y',r=.012,bevel=.002)
 if i==1:
  panel('Shutter recessed ID plate',(0,.043,.03),(.42,.021,.13),'Graphite',d,axis='Y',r=.027)
  # Three bold channels stay readable at the actual game distance.
  for x in [-.105,0,.105]:panel('Shutter factory mark',(x,.058,.03),(.036,.012,.065),'Marking',d,axis='Y',r=.006,bevel=.001)
# Production cassettes share a single mechanical footprint, each low and readable.
modules={}
for role in ['drone','mech','rail']:
 mod=empty('Module_'+role);modules[role]=mod
 panel(role+' cassette shoe',(0,0,.035),(.70,.82,.07),'Graphite',mod,r=.10)
 panel(role+' enamel skirt',(0,0,.087),(.68,.78,.045),'Team',mod,r=.095)
 if role=='drone':
  # Twin service coils, broad circular signature from the game camera.
  for x in [-.18,.18]:
   tube('Drone coil socket',(x,0,.10),(x,0,.19),.155,'Graphite',mod,24)
   tube('Drone ceramic coil',(x,0,.18),(x,0,.24),.143,'Ceramic',mod,24)
   tube('Drone coil core',(x,0,.235),(x,0,.251),.091,'Team',mod,20)
   tube('Drone coil indicator',(x,0,.250),(x,0,.257),.042,'Light',mod,16)
 elif role=='mech':
  # Broad reinforced press bridge, industrial rather than a command tower.
  plate('Mech press bridge',[(-.28,-.27),(.28,-.27),(.31,-.16),(.31,.17),(.20,.29),(-.20,.29),(-.31,.17),(-.31,-.16)],'Z',.11,.22,'Ceramic',mod,.018)
  plate('Mech visible chevron',[(-.23,.11),(0,.29),(.23,.11),(.19,.02),(0,.16),(-.19,.02)],'Z',.225,.25,'Team',mod,.006)
  for x in [-.20,.20]:panel('Mech press vent',(x,-.15,.24),(.105,.20,.04),'Graphite',mod,r=.018)
 else:
  # Twin longitudinal cooling rails: same total height, clearly different plan.
  for x in [-.19,.19]:
   panel('Rail ceramic channel',(x,0,.18),(.20,.66,.16),'Ceramic',mod,r=.075,bevel=.012)
   panel('Rail channel crown',(x,0,.27),(.075,.55,.025),'Team',mod,r=.025)
   panel('Rail channel status',(x,.20,.288),(.035,.10,.01),'Light',mod,r=.01,bevel=.001)
  for y in [-.25,-.10,.05,.20]:panel('Rail heat transfer rib',(0,y,.15),(.19,.04,.06),'Alloy',mod,r=.012)

# Recessed service labels and sparse fasteners give the shell scale.
for sign in [-1,1]:
 for yy in [-.72,.43]:
  # Side caution triangle cut as a shallow relief.
  plate('Ceramic caution badge',[(yy-.043,.52),(yy+.043,.52),(yy,.60)],'X',sign*1.020,sign*1.024,'Team',bevel=.001)
 for zz in [.63,1.38]:
  for yy in [-.75,.48]:
   tube('Recessed shoulder fastener',(sign*1.017,yy,zz),(sign*1.024,yy,zz),.012,'Graphite',N=8)
# A large visible stepped seam breaks up the roof shoulder at the rear.
for sign in [-1,1]:
 panel('Rear shoulder access inset',(sign*.62,-.70,1.992),(.27,.27,.025),'Graphite',r=.06)
 panel('Rear shoulder removable cover',(sign*.62,-.70,2.01),(.23,.23,.022),'Team',r=.05)


# Rear service station is visible through the open portal.
panel('Interior docking console',(0,-.795,.87),(.79,.055,.62),'Graphite',axis='Y',r=.09)
panel('Interior service access',(0,-.757,.90),(.65,.025,.43),'Alloy',axis='Y',r=.065)
panel('Console inset display',(0,-.736,1.00),(.38,.022,.13),'Recess',axis='Y',r=.025)
for x in [-.12,0,.12]:
 panel('Console readout',(x,-.720,1.00),(.06,.009,.016),'WarmLight',axis='Y',r=.004,bevel=0)
tube('Rear power coupling',(0,-.734,.77),(0,-.706,.77),.065,'Team',N=16)
for x in [-.68,.68]:
 for j in range(3):
  yy=.60+j*.11
  plate('Threshold safety marking',[(x-.025,yy-.04),(x+.025,yy-.01),(x+.025,yy+.03),(x-.025,yy)],'Z',.079,.081,'Team',bevel=0)
# Cut the complete shutter movement envelope in the inner shell, including its
# curved lower edge. Keep a real pocket for the folded stack beneath the roof.
cutter=plate('TEMP shutter pocket',[(-.94,.16),(.94,.16),(.94,2.084),(-.94,2.084)],'Y',.10,.949,'Recess',bevel=0)
for o in list(bpy.data.objects):
 if o.type=='MESH' and any(o.name.startswith(prefix) for prefix in ['Ceramic shoulder','Pressure hull','Roof top ceramic crown','Hangar ceiling','Ceiling beam','Hangar work lamp']):
  bpy.context.view_layer.objects.active=o
  mod=o.modifiers.new('Shutter pocket clearance','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;mod.solver='EXACT';bpy.ops.object.modifier_apply(modifier=mod.name)
  if not o.data.polygons:bpy.data.objects.remove(o,do_unlink=True)
bpy.data.objects.remove(cutter,do_unlink=True)

# Quiet surface finish: editable, shared image rather than one texture per part.
rng=random.Random(719)
grain=bpy.data.images.new('Factory_coating_roughness',width=128,height=128)
grain.colorspace_settings.name='Non-Color'
pixels=[]
for y in range(128):
 for x in range(128):
  v=.40+(rng.random()-.5)*.035+.012*math.sin(x*.16+y*.09);pixels.extend((1,v,0,1))
grain.pixels.foreach_set(pixels);grain.pack()
for name in ['Ceramic','CeramicLight','Team']:
 m=M[name];t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=grain
 sep=m.node_tree.nodes.new('ShaderNodeSeparateColor');m.node_tree.links.new(t.outputs['Color'],sep.inputs[0])
 m.node_tree.links.new(sep.outputs['Green'],m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'])
# World-length UVs for the small coating texture. Each named panel stays editable.
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 uv=o.data.uv_layers.new(name='Surface')
 for f in o.data.polygons:
  axis=max(range(3),key=lambda i:abs(f.normal[i]));axes=[i for i in range(3) if i!=axis]
  for li in f.loop_indices:
   co=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(co[axes[0]]*2,co[axes[1]]*2)
# Door animation is exported as one named clip with four independently keyed nodes.
for i,d in enumerate(doors):
 closed=d.location.copy()
 for frame,t,depth in [(1,0,0),(5,0,1),(25,1,1)]:
  d.location=(0,.59-(.08+i*.115)*depth,closed.z+(1.84+i*.012-closed.z)*t)
  d.keyframe_insert(data_path='location',frame=frame,group='Hangar segment '+str(i+1))
 d.animation_data.action.name='Door_Open_'+str(i+1)
 for layer in d.animation_data.action.layers:
  for strip in layer.strips:
   for channelbag in strip.channelbags:
    for curve in channelbag.fcurves:
     for keyframe in curve.keyframe_points:keyframe.interpolation='LINEAR'
 # NLA strip naming tells the glTF exporter to merge tracks into one clip.
 track=d.animation_data.nla_tracks.new();track.name='Door_Open'
 strip=track.strips.new('Door_Open',1,d.animation_data.action);d.animation_data.action=None
bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=25;bpy.context.scene.render.fps=24;bpy.context.scene.frame_set(1)
# Authoring scene: selected base at origin, module samples alongside it.
for i,(role,o) in enumerate(modules.items()):o.location=(2.7,(i-1)*1.25,0)

# Bake short-range geometric occlusion into vertex colour, independent of a studio render.
# Static shell uses the open pose so its interior does not acquire a painted shut-door shadow.
from mathutils.bvhtree import BVHTree
bpy.context.scene.frame_set(25);bpy.context.view_layer.update()
verts=[];faces=[]
for o in list(bpy.data.objects):
 if o.type!='MESH' or o.data.materials[0].name in ['Light','WarmLight']:continue
 offset=len(verts);verts.extend([o.matrix_world@v.co for v in o.data.vertices])
 faces.extend([tuple(offset+i for i in f.vertices) for f in o.data.polygons])
bvh=BVHTree.FromPolygons(verts,faces,all_triangles=False)
rays=[]
for i in range(12):
 zz=(i+.5)/12;angle=i*2.399963229728653;r=math.sqrt(1-zz*zz)
 rays.append(Vector((r*math.cos(angle),r*math.sin(angle),zz)))
def shaded_material(name,metal,rough):
 m=mat(name,'FFFFFF',rough,metal)
 n=m.node_tree.nodes.new('ShaderNodeVertexColor');n.layer_name='SurfaceColor'
 m.node_tree.links.new(n.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 return m
surface=shaded_material('Factory_Ceramic',.12,.41)
mechanical=shaded_material('Factory_Mechanical',.48,.46)
shutter=shaded_material('Factory_Shutter',.24,.42)
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 name=o.data.materials[0].name
 if name in ['Team','Light','WarmLight']:continue
 base=M[name].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value[:3]
 layer=o.data.color_attributes.new(name='SurfaceColor',type='FLOAT_COLOR',domain='CORNER')
 values=[];normal_matrix=o.matrix_world.to_3x3()
 for v in o.data.vertices:
  p=o.matrix_world@v.co;n=(normal_matrix@v.normal).normalized()
  x=n.cross(Vector((0,0,1)))
  if x.length<.01:x=n.cross(Vector((1,0,0)))
  x.normalize();y=n.cross(x);blocked=0
  for d in rays:
   direction=x*d.x+y*d.y+n*d.z;hit=bvh.ray_cast(p+n*.004,direction,.22)
   if hit[0] is not None:blocked+=max(0,1-hit[3]/.22)
  ao=1-.65*blocked/len(rays)
  # Restrained tonal variation on lower armour, not fake directional lighting.
  wear=.94+.06*min(1,max(0,p.z/.45))
  values.append((*[c*ao*wear for c in base],1))
 for loop in o.data.loops:layer.data[loop.index].color=values[loop.vertex_index]
 o.data.materials.clear()
 o.data.materials.append(shutter if o.parent in doors else surface if name in ['Ceramic','CeramicLight','Marking'] else mechanical)
bpy.context.scene.frame_set(1);bpy.context.view_layer.update()
print('SURFACE_OCCLUSION_BAKED',flush=True)

# Save before joining: named panels, materials, animation tracks, module parts editable.
bpy.context.scene.world.color=(.15,.15,.15)
bpy.context.preferences.filepaths.save_version=0;bpy.context.preferences.filepaths.file_preview_type='NONE'
bpy.ops.object.select_all(action='DESELECT');root.select_set(True);bpy.context.view_layer.objects.active=root
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.region_3d.view_distance=6
   area.spaces.active.region_3d.view_location=(0,0,1)
   area.spaces.active.shading.type='MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(ART/'factory-source.blend'))
print('AUTHORING_SAVED',flush=True)
# Export batching by articulation + surface category: doors remain separate.
def ancestors(o):
 p=o
 while p:
  yield p;p=p.parent
def family(o):
 return next((a for a in ancestors(o) if a in doors or a in modules.values()),body)
# Reduce the many authored pieces to a small number of draw surfaces.
buckets={}
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 parent=family(o);ma=o.data.materials[0]
 key=(parent,ma.name)
 buckets.setdefault(key,[]).append(o)
for (parent,ma),objs in buckets.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0]
 if len(objs)>1:bpy.ops.object.join()
 o=bpy.context.object;o.name=parent.name+'_'+ma
 world=o.matrix_world.copy();o.parent=parent;o.matrix_world=world
print('MESHES_BATCHED',flush=True)
def select_tree(r):
 bpy.ops.object.select_all(action='DESELECT')
 for o in [r]+list(r.children_recursive):o.select_set(True)
 bpy.context.view_layer.objects.active=r
def variants(path):
 # Standard glTF material variants; default Orange works in non-variant viewers.
 raw=path.read_bytes();jl=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+jl]);rest=raw[20+jl:]
 mats=doc.get('materials',[]);team=[i for i,m in enumerate(mats) if m.get('name')=='Team']
 if team:
  doc.setdefault('extensionsUsed',[]).append('KHR_materials_variants')
  doc.setdefault('extensions',{})['KHR_materials_variants']={'variants':[{'name':'Orange'},{'name':'Blue'}]}
  for i in team:
   blue=json.loads(json.dumps(mats[i]));blue['name']='Team_Blue';blue.setdefault('pbrMetallicRoughness',{})['baseColorFactor']=[*color('469DCE'),1];j=len(mats);mats.append(blue)
   for mesh in doc.get('meshes',[]):
    for p in mesh['primitives']:
     if p.get('material')==i:p.setdefault('extensions',{})['KHR_materials_variants']={'mappings':[{'material':i,'variants':[0]},{'material':j,'variants':[1]}]}
 js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
 path.write_bytes(struct.pack('<III',0x46546c67,2,20+len(js)+len(rest))+struct.pack('<II',len(js),0x4e4f534a)+js+rest)
 return doc
def export(r,name,animation=False):
 select_tree(r)
 path=OUT/(name+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,
  export_animations=animation,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_frame_range=True,export_anim_slide_to_zero=True,
  export_cameras=False,export_lights=False,export_extras=True)
 doc=variants(path)
 triangles=sum(doc['accessors'][p['indices']]['count']//3 for m in doc.get('meshes',[]) for p in m['primitives'])
 return {'file':path.name,'bytes':path.stat().st_size,'triangles':triangles,'meshes':len(doc.get('meshes',[])),'materials':len(doc.get('materials',[])),
 'primitives':sum(len(m['primitives']) for m in doc.get('meshes',[])),'animations':[a.get('name') for a in doc.get('animations',[])]}
assets=[export(root,'factory',True)]
for role,mod in modules.items():
 mod.location=(0,0,0);assets.append(export(mod,'module-'+role))
manifest={'name':'HEXFRONT factory v1','status':'approval preview, not integrated','source':'art/factory-v1/factory-source.blend','authorship':'Original custom mesh surfaces authored with Blender '+bpy.app.version_string,
 'units':'game units; glTF Y up; front -Z','door':{'nodes':[d.name for d in doors],'clip':'Door_Open','duration':1,'clearWidth':1.86,'clearHeight':1.64},
 'socket':'Production_Socket','teamVariants':['Orange','Blue'],'assets':assets}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8');print('FACTORY_EXPORT',json.dumps(manifest),flush=True)
