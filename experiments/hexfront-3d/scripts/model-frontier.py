"""Author the PIP / Haven / Seed family in Blender; export an optimized GLB.
Run: blender --background --python scripts/model-frontier.py
Original mesh design for HEXFRONT. Blender coordinates: +Y front, +Z up.
No downloaded model, generated image, or game reference geometry is used.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/frontier'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def linear(v):
    return v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4

def material(name, colour, rough, metal=0, emission=0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    rgb = tuple(linear(int(colour[i:i+2],16)/255) for i in (0,2,4))
    p.inputs['Base Color'].default_value = (*rgb,1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if emission:
        p.inputs['Emission Color'].default_value = (*rgb,1)
        p.inputs['Emission Strength'].default_value = emission
    return m

M = {
 'Porcelain':material('Porcelain','E3DFCC',.43,.12),
 'Jade':material('Jade','638D83',.53,.28),
 'Graphite':material('Graphite','273B40',.61,.52),
 'Alloy':material('Alloy','A2B7B4',.36,.74),
 'Team':material('Team','FFFFFF',.44,.26),
 'Optic':material('Optic','FFFFFF',.27,.36,.22),
 'Glass':material('Glass','152D34',.22,.55),
 'Rubber':material('Rubber','465651',.88),
}

def group(name,parent=None,loc=(0,0,0)):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o)
    o.parent=parent;o.location=loc;return o

def finish(o,name,mat,parent,bevel=0,smooth=True):
    o.name=name;o.data.materials.clear();o.data.materials.append(M[mat]);o.parent=parent
    bpy.context.view_layer.objects.active=o
    if bevel:
        mod=o.modifiers.new('Manufactured edge radius','BEVEL');mod.width=bevel;mod.segments=3
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if smooth:
        for p in o.data.polygons:p.use_smooth=True
    if bevel:
        mod=o.modifiers.new('Panel corner normals','WEIGHTED_NORMAL');mod.keep_sharp=True;mod.weight=40
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def custom(name,verts,faces,mat,parent,bevel=0,smooth=True):
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o)
    return finish(o,name,mat,parent,bevel,smooth)

def shell(name,levels,mat,parent,n=40,power=2.6):
    # Each section has individually designed width/depth/centre; rounded
    # superellipse sections form continuous compound-curved housings.
    verts=[]
    for z,rx,ry,cy in levels:
        for i in range(n):
            a=i*math.tau/n;c=math.cos(a);s=math.sin(a)
            verts.append((math.copysign(abs(c)**(2/power),c)*rx,
                          math.copysign(abs(s)**(2/power),s)*ry+cy,z))
    faces=[]
    for j in range(len(levels)-1):
        for i in range(n):k=(i+1)%n;faces.append((j*n+i,j*n+k,(j+1)*n+k,(j+1)*n+i))
    faces += [tuple(reversed(range(n))),tuple((len(levels)-1)*n+i for i in range(n))]
    return custom(name,verts,faces,mat,parent)

def panel(name,outline,bottom,top,mat,parent,bevel=.02):
    n=len(outline);verts=[(x,y,z) for z in (bottom,top) for x,y in outline]
    faces=[tuple(reversed(range(n))),tuple(n+i for i in range(n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return custom(name,verts,faces,mat,parent,bevel)

def box(name,loc,scale,mat,parent,bevel=.02):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,parent,bevel)

def sphere(name,loc,scale,mat,parent,segments=24,rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=loc)
    o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,parent)

def cylinder(name,loc,radius,depth,mat,parent,n=24,rotation=(0,0,0),bevel=.012):
    bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=radius,depth=depth,location=loc,rotation=rotation)
    return finish(bpy.context.object,name,mat,parent,bevel)

def ring(name,loc,radius,tube,mat,parent,rotation=(0,0,0),scale=(1,1,1),segments=40):
    bpy.ops.mesh.primitive_torus_add(major_segments=segments,minor_segments=8,location=loc,rotation=rotation,major_radius=radius,minor_radius=tube)
    o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,parent)

def tube(name,pts,radius,mat,parent):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=6;cu.bevel_depth=radius;cu.bevel_resolution=2
    sp=cu.splines.new('BEZIER');sp.bezier_points.add(len(pts)-1)
    for b,p in zip(sp.bezier_points,pts):b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True)
    for a in bpy.context.selected_objects:
        if a!=o:a.select_set(False)
    bpy.ops.object.convert(target='MESH')
    return finish(bpy.context.object,name,mat,parent)

def cap_patch(name,rx,ry,rz,z0,side,mat,parent,gap=.028):
    # Split ceramic shell, actual open panel seam at the spine, not a painted line.
    verts=[];faces=[];nu=16;nv=8
    for j in range(nv+1):
        lat=.04+(math.pi/2-.10)*j/nv
        for i in range(nu+1):
            a=-math.pi/2+math.pi*i/nu
            x=side*(gap+rx*math.cos(lat)*math.cos(a))
            y=ry*math.cos(lat)*math.sin(a)
            z=z0+rz*math.sin(lat)+.025*(y/ry)
            verts.append((x,y,z))
    for j in range(nv):
        for i in range(nu):
            k=j*(nu+1)+i;face=(k,k+1,k+nu+2,k+nu+1);faces.append(face if side>0 else tuple(reversed(face)))
    o=custom(name,verts,faces,mat,parent)
    mod=o.modifiers.new('Shell thickness','SOLIDIFY');mod.thickness=.016
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Shell edge fillet','BEVEL');mod.width=.008;mod.segments=2
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def curved_panel(name, theta0, theta1, phi0, phi1, mat, parent, radii=(.275,.272,.254), centre=(0,0,.248)):
    # Separate double-curved manufactured shell pieces, with real panel gaps.
    nu=max(8,round((phi1-phi0)*12));nv=max(5,round((theta1-theta0)*12));verts=[];faces=[]
    for j in range(nv+1):
        t=theta0+(theta1-theta0)*j/nv
        for i in range(nu+1):
            p=phi0+(phi1-phi0)*i/nu
            verts.append((centre[0]+radii[0]*math.sin(t)*math.sin(p),centre[1]+radii[1]*math.sin(t)*math.cos(p),centre[2]+radii[2]*math.cos(t)))
    for j in range(nv):
        for i in range(nu):
            k=j*(nu+1)+i;faces.append((k+1,k+nu+2,k+nu+1,k))
    o=custom(name,verts,faces,mat,parent)
    m=o.modifiers.new('Ceramic wall','SOLIDIFY');m.thickness=.012
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
    m=o.modifiers.new('Soft panel lip','BEVEL');m.width=.006;m.segments=2;bpy.ops.object.modifier_apply(modifier=m.name)
    return o


def turned(name, profile, mat, parent, n=48):
    # Authored radial profile: actual intake bowls, rims and tapering housings.
    verts=[(r*math.cos(i*math.tau/n),r*math.sin(i*math.tau/n),z) for r,z in profile for i in range(n)]
    faces=[]
    for j in range(len(profile)-1):
        for i in range(n):k=(i+1)%n;faces.append((j*n+i,j*n+k,(j+1)*n+k,(j+1)*n+i))
    return custom(name,verts,faces,mat,parent)


def drone():
    root=group('PIP');body=group('Body',root)
    # A compact upright pear, not the old flattened wing-shaped chassis.
    sphere('Sealed optical chassis',(0,0,.248),(.267,.265,.248),'Graphite',body,40,24)
    # Rear helmet, two cheek shells, chin and shoulder caps have deliberate gaps.
    curved_panel('Rear helmet',.08,1.47,.76,math.tau-.76,'Porcelain',body)
    curved_panel('Forehead bridge',.075,.67,-.745,.745,'Porcelain',body)
    curved_panel('Lower ceramic jaw',1.59,2.76,-1.18,1.18,'Porcelain',body)
    for sign in (-1,1):
        lo,hi=sorted((sign*.71,sign*1.49))
        curved_panel('Lens cheek',.76,1.46,lo,hi,'Porcelain',body)
        lo,hi=sorted((sign*.79,sign*1.19))
        curved_panel('Shoulder team enamel',.38,1.14,lo,hi,'Team',body,radii=(.28,.277,.259))
        # Two tapered hover dishes float apart from the body on dark articulated shoulders.
        pod=group('PodL' if sign<0 else 'PodR',root,(sign*.439,-.016,.235));pod.rotation_euler=(math.radians(-17),sign*math.radians(10),0)
        turned('Continuous nacelle housing',[(.045,-.12),(.105,-.10),(.154,-.055),(.176,.005),(.176,.034),(.162,.069),(.142,.084),(.133,.070),(.135,.025),(.110,-.01),(.064,-.024)],'Graphite',pod)
        turned('Ceramic intake lip',[(.164,.025),(.175,.035),(.171,.058),(.156,.082),(.144,.086),(.140,.070),(.154,.054),(.159,.036)],'Porcelain',pod)
        turned('Recessed turbine bowl',[(.135,.063),(.128,.016),(.10,-.018),(.062,-.037),(.015,-.04)],'Alloy',pod)
        ring('Turbine light',(0,0,-.017),.066,.010,'Optic',pod,segments=32)
        sphere('Hover core',(0,0,-.014),(.042,.042,.018),'Optic',pod,24,12)
        turned('Nozzle ceramic fairing',[(.136,-.068),(.10,-.118),(.067,-.128),(.059,-.105),(.082,-.083)],'Porcelain',pod,n=32)
        ring('Nozzle aperture',(0,0,-.121),.053,.008,'Optic',pod,segments=28)
        # A short curved enamel strip, not a large emissive band.
        pts=[(.177*math.cos(a),.177*math.sin(a),.015) for a in [math.pi*.17,math.pi*.32,math.pi*.47,math.pi*.62,math.pi*.77]]
        tube('Pod team strip',pts,.013,'Team',pod)
        cylinder('Shoulder swivel',(sign*.28,-.018,.247),.082,.089,'Graphite',body,32,rotation=(0,math.pi/2,0))
        ring('Swivel bearing',(sign*.321,-.018,.247),.06,.009,'Alloy',body,rotation=(0,math.pi/2,0),segments=28)
        tube('Bent suspension',[(sign*.30,-.018,.183),(sign*.354,-.029,.15),(sign*.40,-.023,.145)],.027,'Graphite',body)
        fin=group('FinL' if sign<0 else 'FinR',root,(sign*.19,-.175,.105))
        o=panel('Small steering paddle',[(sign*-.035,0),(sign*.041,-.015),(sign*.061,-.086),(sign*.015,-.112)],0,.023,'Graphite',fin,.012);o.rotation_euler[0]=-.38
        tube('Paddle cap',[(sign*.038,-.035,.024),(sign*.05,-.078,.024)],.014,'Porcelain',fin)
    # Sensor tilts towards the tactical camera's upper hemisphere. A deep dark
    # recess, pale interrupted bezel and small luminous pupil read at 20–30 px.
    sensor=group('Sensor',root,(0,.188,.366));sensor.rotation_euler[0]=math.radians(-40)
    turned('Gimballed optic housing',[(.103,-.061),(.138,-.048),(.153,-.018),(.153,.034),(.136,.059),(.122,.059),(.117,.036),(.119,.014)],'Graphite',sensor)
    ring('Optic machined rim',(0,0,.04),.129,.010,'Alloy',sensor,segments=48)
    sphere('Deep glass lens',(0,0,.024),(.117,.117,.039),'Glass',sensor,40,20)
    ring('Iris aperture',(0,0,.063),.061,.008,'Optic',sensor,segments=40)
    sphere('Convex pupil',(0,0,.061),(.053,.053,.022),'Optic',sensor,32,16)
    sphere('Small reflected glint',(-.018,.022,.081),(.013,.010,.003),'Porcelain',sensor,16,8)
    for start,end in [(.15,1.28),(1.48,2.72),(3.00,4.08),(4.32,5.98)]:
        tube('Segmented ceramic eye bezel',[(.15*math.cos(a),.15*math.sin(a),.016) for a in [start+(end-start)*j/12 for j in range(13)]],.015,'Porcelain',sensor)
    # Raised short dorsal vane makes the outline identifiable from the back too.
    antenna=group('Antenna',root,(0,-.155,.414))
    shell('Antenna foot',[(-.015,.054,.05,0),(.018,.046,.041,0),(.045,.033,.03,0)],'Graphite',antenna,n=24,power=2.6)
    o=panel('Forward listening vane',[(-.028,-.009),(.028,-.009),(.036,-.042),(-.022,-.052)],.025,.166,'Porcelain',antenna,.016);o.rotation_euler[0]=-.18
    box('Vane enamel',(0,.01,.132),(.038,.008,.070),'Team',antenna,.010)
    # Underbody service plate retains a clear dark/pale separation without clutter.
    shell('Chin service cap',[(.011,.061,.083,.02),(.030,.085,.10,.02),(.052,.093,.105,.02)],'Alloy',body,n=28,power=2.7)
    return root


def hq():
    root=group('Haven');body=group('Structure',root)
    shell('Landing foundation',[(.015,.74,.68,0),(.04,.89,.78,0),(.14,.89,.78,0),(.19,.78,.70,0)],'Rubber',body,n=36,power=3.2)
    shell('Floating rim',[(.15,.80,.71,0),(.20,.85,.74,0),(.25,.80,.70,0)],'Alloy',body,n=36,power=3.2)
    shell('Habitat lower shell',[(.22,.65,.54,-.075),(.27,.74,.60,-.075),(.49,.75,.60,-.075),(.68,.68,.55,-.075),(.76,.53,.44,-.075)],'Jade',body,n=40,power=3.2)
    # Broad split ceramic roof, with exposed seam and glazed centre spine.
    roof=group('Roof',body,(0,-.075,0))
    for sign in (-1,1):cap_patch('Roof petal',.68,.55,.28,.68,sign,'Porcelain',roof,gap=.035)
    tube('Recessed roof spine',[(0,.43,.83),(0,.20,.943),(0,-.16,.955),(0,-.49,.81)],.032,'Graphite',body)
    tube('Roof signal line',[(0,.30,.92),(0,.08,.969),(0,-.11,.962)],.011,'Team',body)
    # Dock collar is a thick custom arched extrusion, with a genuine dark opening.
    dock=group('Dock',body,(0,.47,.23))
    outline=[(-.34,0),(-.33,.27),(-.24,.43),(0,.47),(.24,.43),(.33,.27),(.34,0)]
    # Tube runs in X/Z plane around the opening. The back wall sits inside.
    tube('Arched ceramic doorway',[(x,.17,z) for x,z in outline],.068,'Porcelain',dock)
    verts=[(x,.095,z) for x,z in outline];custom('Recessed dock mouth',verts,[tuple(range(len(verts)))],'Glass',dock,smooth=False)
    for x in (-.24,.24):
        tube('Dock guide',[(x,.128,.075),(x,.128,.235),(x*.77,.128,.30)],.014,'Team',dock)
    panel('Dock ramp',[(-.32,.54),(.32,.54),(.39,.82),(-.39,.82)],.18,.22,'Graphite',body,.025)
    for x in (-.27,.27):box('Dock edge light',(x,.68,.234),(.025,.23,.012),'Optic',body,.006)
    # Sculpted side cheeks, radiator recesses and maintenance insets.
    for sign in (-1,1):
        o=shell('Side cheek',[(.26,.11,.28,0),(.34,.17,.31,0),(.55,.15,.26,-.02),(.65,.10,.20,-.05)],'Porcelain',body,n=24,power=2.6);o.location.x=sign*.62;o.location.y=-.08
        for j in range(4):
            o=box('Vent slot',(sign*.751,-.22+j*.093,.414),(.013,.050,.15),'Graphite',body,.011);o.rotation_euler[1]=sign*-.12
        tube('Service stripe',[(sign*.40,y-.075,.68+.28*math.sqrt(1-((.40-.035)/.68)**2-(y/.55)**2)+.025*y/.55+.011) for y in [-.10,0,.10,.18]],.018,'Team',body)
        for y in (-.39,.19):cylinder('Roof fastener',(sign*.40,y,.68+.28*math.sqrt(1-((.40-.035)/.68)**2-((y+.075)/.55)**2)+.025*(y+.075)/.55+.012),.016,.008,'Alloy',body,n=12,bevel=.002)
    # Small rear communications well and a nodding, petal-shaped dish.
    cylinder('Comms seat',(0,-.36,.94),.211,.09,'Graphite',body,n=32)
    ring('Core insulator',(0,-.36,.99),.185,.025,'Alloy',body)
    sphere('Energy well',(0,-.36,1.01),(.14,.14,.075),'Optic',body)
    mast=group('Scanner',root,(.14,-.35,.92))
    tube('Curved mast',[(0,0,0),(.04,-.015,.15),(.00,-.055,.25)],.022,'Alloy',mast)
    dish=shell('Comms petal',[(.20,.07,.065,-.045),(.23,.17,.14,-.055),(.26,.185,.15,-.06),(.285,.17,.13,-.06)],'Porcelain',mast,n=28,power=2.5)
    sphere('Dish face',(0,-.06,.284),(.141,.104,.012),'Jade',mast,24,8)
    tube('Dish sensor stalk',[(0,-.06,.287),(0,-.065,.35)],.012,'Graphite',mast)
    sphere('Dish pickup',(0,-.065,.35),(.027,.027,.018),'Optic',mast,16,8)
    return root

def relay():
    root=group('Seed');body=group('Structure',root)
    outline=[(math.cos(i*math.tau/6)*.69,math.sin(i*math.tau/6)*.69) for i in range(6)]
    panel('Relay foundation',outline,.015,.14,'Rubber',body,.065)
    cylinder('Relay plinth',(0,0,.16),.51,.14,'Jade',body,32,bevel=.04)
    ring('Power cradle',(0,0,.26),.34,.05,'Graphite',body)
    ring('Status ring',(0,0,.292),.335,.015,'Optic',body)
    # Three continuous bowed ceramic arms, with metal inner tendons.
    for i in range(3):
        a=i*math.tau/3;arm=group('Bow'+str(i),body);arm.rotation_euler[2]=a
        tube('Ceramic bow',[(0,.39,.18),(0,.49,.47),(0,.43,.89),(0,.24,1.16)],.068,'Porcelain',arm)
        tube('Inner tendon',[(0,.29,.24),(0,.36,.55),(0,.32,.88),(0,.20,1.05)],.019,'Alloy',arm)
        sphere('Foot fairing',(0,.41,.21),(.14,.21,.09),'Porcelain',arm,24,8)
        tube('Status inset',[(0,.49,.49),(0,.478,.69)],.015,'Team',arm)
    rotor=group('Rotor',root,(0,0,.96))
    ring('Suspension halo',(0,0,0),.277,.028,'Jade',rotor,rotation=(.12,.07,0),segments=40)
    for i in range(3):
        a=i*math.tau/3;sphere('Halo clasp',(math.cos(a)*.28,math.sin(a)*.28,0),(.069,.069,.035),'Alloy',rotor,16,8)
    core=group('Core',root,(0,0,.62))
    shell('Seed core',[(-.29,.024,.024,0),(-.20,.12,.12,0),(-.05,.175,.175,0),(.15,.145,.145,0),(.30,.04,.04,0)],'Optic',core,n=32,power=2)
    for i in range(3):
        a=i*math.tau/3;rib=group('CoreRib'+str(i),core);rib.rotation_euler[2]=a
        tube('Seed rib',[(0,.038,-.26),(0,.18,-.05),(0,.15,.15),(0,.037,.28)],.015,'Alloy',rib)
    return root

roots=[drone(),hq(),relay()]

# Preserve moving pivots; merge only meshes with the same parent and material.
# This creates reusable material batches without welding away articulation.
for o in list(bpy.data.objects):
    if o.type=='MESH':
        bpy.context.view_layer.objects.active=o
        bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        # World-length UV projection, consistent microscopic material scale.
        uv=o.data.uv_layers.new(name='Surface scale') if not o.data.uv_layers else o.data.uv_layers.active
        for poly in o.data.polygons:
            axis=max(range(3),key=lambda j:abs(poly.normal[j]));axes=[j for j in range(3) if j!=axis]
            for li in poly.loop_indices:
                v=o.data.vertices[o.data.loops[li].vertex_index].co
                uv.data[li].uv=(v[axes[0]]*2,v[axes[1]]*2)

buckets={}
for o in list(bpy.data.objects):
    if o.type=='MESH':buckets.setdefault((o.parent,o.data.materials[0].name),[]).append(o)
for (parent,mat),objects in buckets.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    o=bpy.context.object;o.name=f'{parent.name}_{mat}'

# Conservative collapse after edge normals are authored; the live asset stays small.
for root,ratio in zip(roots,[.46,.65,.62]):
    for o in root.children_recursive:
        if o.type!='MESH' or len(o.data.polygons)<50:continue
        bpy.context.view_layer.objects.active=o
        mod=o.modifiers.new('Web mesh budget','DECIMATE');mod.ratio=ratio
        bpy.ops.object.modifier_apply(modifier=mod.name)

stats={}
for root in roots:
    meshes=[o for o in root.children_recursive if o.type=='MESH']
    stats[root.name]={'meshes':len(meshes),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)}
bpy.context.preferences.filepaths.save_version=0
bpy.context.preferences.filepaths.file_preview_type='NONE'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'scripts/frontier-source.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'frontier.glb'),export_format='GLB',export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
stats['bytes']=(OUT/'frontier.glb').stat().st_size
(OUT/'model-manifest.json').write_text(json.dumps({'authoring':'Blender '+bpy.app.version_string,'design':'PIP / Haven / Seed — original HEXFRONT family','models':stats},indent=2)+'\n')
print('FRONTIER_MODELS',json.dumps(stats))
