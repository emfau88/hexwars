import bpy,math
from mathutils import Vector
from pathlib import Path
R=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'public/models/mech.glb'))
meshes=[o for o in bpy.data.objects if o.type=='MESH']
for o in meshes:
 o.data.transform(o.matrix_world);o.parent=None;o.matrix_world.identity()
pts=[v.co for o in meshes for v in o.data.vertices];lo=Vector([min(v[k] for v in pts) for k in range(3)]);hi=Vector([max(v[k] for v in pts) for k in range(3)]);c=(lo+hi)/2;s=1.45/(hi.z-lo.z)
for o in meshes:
 for v in o.data.vertices:v.co=Vector(((v.co.x-c.x)*s,(v.co.y-c.y)*s,(v.co.z-lo.z)*s))
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=800;scene.render.resolution_y=850;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.3,.3,.3,1)
for name,loc,energy,size in [('Key',(-3,4,5),400,4),('Fill',(3,2,3),200,3),('Back',(0,-3,4),300,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.7))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=1.85
for name,loc in [('front',(0,5,.725)),('side',(5,0,.725)),('back',(0,-5,.725))]:
 cam.location=loc;cam.rotation_euler=(Vector((0,0,.725))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(R/'docs/mech-animation'/('source-'+name+'.png'));bpy.ops.render.render(write_still=True)
