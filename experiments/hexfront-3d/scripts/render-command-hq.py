"""Studio views of the shipped GLB, without changing its meshes or the game.
Blender 5.2: blender --background --python asset-gallery/render_assets.py
"""
import bpy, math, json, hashlib
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parents[1] / 'docs/hq-command'
HERE.mkdir(parents=True,exist_ok=True)
SOURCE = Path(__file__).resolve().parents[1] / 'public/assets/command-hq/command-hq.glb'

def linear(n):
    return n / 12.92 if n <= .04045 else ((n + .055) / 1.055) ** 2.4

def colour(h):
    return tuple(linear(int(h[i:i+2],16)/255) for i in (0,2,4)) + (1,)

def bounds(objects):
    points=[o.matrix_world @ Vector(v) for o in objects if o.type=='MESH' for v in o.bound_box]
    return points,Vector(tuple(min(p[i] for p in points) for i in range(3))),Vector(tuple(max(p[i] for p in points) for i in range(3)))

def light(name, position, energy, size, tint, target):
    d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size;d.color=tint
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=position
    o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()

report={'source':str(SOURCE),'sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'images':[],
        'note':'New HQ GLB, isolated studio inspection. Orange/blue are material variants of identical meshes. Studio light differs from gameplay; not yet published.'}

for name,filename,azimuth,elevation in [('CommandHQ','hq-orange.png',32,32),('CommandHQ','hq-blue.png',32,32),('CommandHQ','hq-tactical.png',32,70)]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene
    scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=48;scene.cycles.use_denoising=True
    scene.render.threads_mode='FIXED';scene.render.threads=12
    scene.render.resolution_x=1200;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
    scene.render.film_transparent=False;scene.view_settings.view_transform='AgX'
    scene.world=bpy.data.worlds.new('Neutral studio');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.19,.22,.23,1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.45
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    asset=bpy.data.objects[name];keep={asset,*asset.children_recursive}
    for o in list(bpy.data.objects):
        if o not in keep:bpy.data.objects.remove(o,do_unlink=True)
    # Match runtime team/material adjustments; all geometric data stays intact.
    for mat in bpy.data.materials:
        if not mat.use_nodes:continue
        p=mat.node_tree.nodes.get('Principled BSDF')
        if not p:continue
        if mat.name in ('HQ_Team','HQ_Lights','HQ_Core'):
            tint=colour(('629EBF' if mat.name=='HQ_Team' else '88D1ED') if filename=='hq-blue.png' else ('E89842' if mat.name=='HQ_Team' else 'FFBD70'))
            p.inputs['Base Color'].default_value=tint
            if mat.name in ('HQ_Lights','HQ_Core'):
                p.inputs['Emission Color'].default_value=tint
                p.inputs['Emission Strength'].default_value=.34 if name=='PIP' else 1.4
                if name=='PIP':p.inputs['Metallic'].default_value=.12;p.inputs['Roughness'].default_value=.26
    bpy.context.view_layer.update()
    _,lo,hi=bounds(keep);factor=2.7/max(hi-lo)
    asset.scale*=factor;bpy.context.view_layer.update();_,lo,hi=bounds(keep)
    asset.location+=Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z+(.3 if name=='PIP' else .015)))
    bpy.context.view_layer.update();points,lo,hi=bounds(keep);target=(lo+hi)/2
    # All sides of the exported model remain visible; fixed front three-quarter.
    a,e=math.radians(azimuth),math.radians(elevation)
    direction=Vector((math.sin(a)*math.cos(e),math.cos(a)*math.cos(e),math.sin(e)))
    camdata=bpy.data.cameras.new('Inspection');cam=bpy.data.objects.new('Inspection',camdata);bpy.context.collection.objects.link(cam)
    cam.location=target+direction*10;cam.rotation_euler=(-direction).to_track_quat('-Z','Y').to_euler()
    camdata.type='ORTHO';scene.camera=cam;bpy.context.view_layer.update()
    inverse=cam.matrix_world.inverted();projected=[inverse@p for p in points]
    width=max(p.x for p in projected)-min(p.x for p in projected);height=max(p.y for p in projected)-min(p.y for p in projected)
    camdata.ortho_scale=max(width,height*1200/1100)*1.20
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.015));floor=bpy.context.object;floor.name='Display floor only'
    mat=bpy.data.materials.new('Neutral backdrop');mat.use_nodes=True;p=mat.node_tree.nodes['Principled BSDF'];p.inputs['Base Color'].default_value=colour('515C60');p.inputs['Roughness'].default_value=.88;floor.data.materials.append(mat)
    light('Large warm key',(-3,4,6),600,4.0,(1,.92,.82),target)
    light('Cool broad fill',(4,1,3.5),350,4.0,(.80,.90,1),target)
    light('Ceramic rim',(1,-3,5),650,3.0,(1,.98,.92),target)
    scene.render.filepath=str(HERE/filename);bpy.ops.render.render(write_still=True)
    report['images'].append({'asset':name,'file':filename,'cameraElevation':elevation,'cameraAzimuth':azimuth,'samples':48,'render':'Cycles CPU'})
    (HERE/'render-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print('ASSET_RENDER_DONE',name,flush=True)
