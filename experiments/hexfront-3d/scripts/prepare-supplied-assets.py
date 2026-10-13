"""Blender 5.2: conservative cleanup of the four supplied textured GLBs.
No source is overwritten. UVs and source surface geometry are retained.
Run: blender --background --python scripts/prepare-supplied-assets.py -- SOURCE_DIR
"""
import bpy,bmesh,math,json,sys,hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[sys.argv.index('--')+1])
out=root/'public/assets/supplied';out.mkdir(parents=True,exist_ok=True)
work=root/'docs/imported-assets';work.mkdir(parents=True,exist_ok=True)
report=json.loads((work/'optimization.json').read_text()) if (work/'optimization.json').exists() else {}
def empty(name,parent=None,location=(0,0,0)):
 o=bpy.data.objects.new(name,None);bpy.context.scene.collection.objects.link(o);o.parent=parent;o.location=location;return o

def part_from_faces(original,faces,name,parent,pivot,transform):
 # Keep loop UVs, including seams. No global separate-by-loose-parts operation.
 mesh=original.data.copy();o=bpy.data.objects.new(name,mesh);bpy.context.scene.collection.objects.link(o)
 bm=bmesh.new();bm.from_mesh(mesh);bm.faces.ensure_lookup_table();drop=[f for f in bm.faces if f.index not in faces];bmesh.ops.delete(bm,geom=drop,context='FACES');bm.to_mesh(mesh);bm.free();mesh.validate();mesh.update()
 o.parent=parent
 for v in mesh.vertices:v.co=transform(v.co)-Vector(pivot)
 o.location=(0,0,0)
 for p in mesh.polygons:p.use_smooth=True
 return o

def map_image(name,rgba,size,space='Non-Color'):
 i=bpy.data.images.new(name,width=size[0],height=size[1],alpha=True);i.colorspace_settings.name=space;i.pixels.foreach_set(rgba.reshape(-1));i.pack();return i

for kind,ratio,width in [('HQ',.48,1.65),('HoverBot',.24,1.04),('Relay',.48,1.68),('Mech',.42,1.32)]:
 if '--hq-only' in sys.argv and kind!='HQ':continue
 bpy.ops.wm.read_factory_settings(use_empty=True)
 filename=source/('HQ-clean-source.glb' if kind=='HQ' else 'HEXFRONT_'+kind+'_source.glb');bpy.ops.import_scene.gltf(filepath=str(filename))
 original=next(o for o in bpy.context.scene.objects if o.type=='MESH');bpy.context.view_layer.objects.active=original;original.select_set(True)
 original.data.transform(original.matrix_world);original.matrix_world=Matrix.Identity(4)
 before=len(original.data.polygons)
 # Weld only duplicate positions. Corner UVs survive; do not split fused limbs.
 bm=bmesh.new();bm.from_mesh(original.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000005)
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
 if kind=='HQ':
  # New freestanding HQ source: remove only its uneven bottom 3.6%.
  # A planar cut and real downward-facing caps produce a level foundation.
  floor=-.408
  bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.000001,plane_co=(0,0,floor),plane_no=(0,0,1),clear_inner=True)
  edges=[e for e in bm.edges if e.is_boundary and all(abs(v.co.z-floor)<.00001 for v in e.verts)]
  caps=bmesh.ops.holes_fill(bm,edges=edges,sides=0).get('faces',[])
  for f in caps:
   if f.normal.z>0:f.normal_flip()
 # Imported scenery is absent on relay/bot/mech; preserve their structural feet.
 bm.to_mesh(original.data);bm.free();original.data.validate();original.data.update()
 cleaned=len(original.data.polygons)
 dec=original.modifiers.new('UV-preserving silhouette reduction','DECIMATE');dec.ratio=ratio;dec.use_collapse_triangulate=True
 bpy.context.view_layer.objects.active=original;bpy.ops.object.modifier_apply(modifier=dec.name)
 if kind=='HQ':
  # Collapse may move vertices along the underside. Finish with an exact,
  # sealed plane AFTER simplification; no later modifier may disturb it.
  bm=bmesh.new();bm.from_mesh(original.data);floor=-.398
  bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.000001,plane_co=(0,0,floor),plane_no=(0,0,1),clear_inner=True)
  edges=[e for e in bm.edges if e.is_boundary and all(abs(v.co.z-floor)<.00001 for v in e.verts)]
  caps=bmesh.ops.holes_fill(bm,edges=edges,sides=0).get('faces',[])
  bm.normal_update()
  for f in caps:
   if f.normal.z>0:f.normal_flip()
  bmesh.ops.triangulate(bm,faces=caps)
  bm.to_mesh(original.data);bm.free();original.data.validate();original.data.update()
 # Bake restrained material differentiation into small packed PBR maps.
 mat=original.data.materials[0];mat.name='Supplied_Surface';nodes=mat.node_tree.nodes;bs=next(n for n in nodes if n.type=='BSDF_PRINCIPLED');im=next(n.image for n in nodes if n.type=='TEX_IMAGE');im.name=kind+'_Original_Albedo';im.pack()
 rgba=np.array(im.pixels[:],dtype=np.float32).reshape(im.size[1],im.size[0],4);rgb=rgba[:,:,:3];dark=np.clip((.32-rgb.max(2))/.25,0,1)
 orm=np.ones_like(rgba);orm[:,:,1]=.64-dark*.12;orm[:,:,2]=.08+dark*.34;orm[:,:,0]=1
 tex=nodes.new('ShaderNodeTexImage');tex.image=map_image(kind+'_RoughnessMetal',orm,tuple(im.size));sep=nodes.new('ShaderNodeSeparateColor');mat.node_tree.links.new(tex.outputs['Color'],sep.inputs[0]);mat.node_tree.links.new(sep.outputs['Green'],bs.inputs['Roughness']);mat.node_tree.links.new(sep.outputs['Blue'],bs.inputs['Metallic'])
 # Only bright lamp texels emit; orange paint is below the yellow threshold.
 light=np.clip((rgb[:,:,0]-.68)*5,0,1)*np.clip((rgb[:,:,1]-.43)*6,0,1)*np.clip((rgb[:,:,1]-rgb[:,:,2]-.15)*6,0,1)
 glow=np.ones_like(rgba);glow[:,:,:3]=rgb*light[:,:,None];tex=nodes.new('ShaderNodeTexImage');tex.image=map_image(kind+'_LampMask',glow,tuple(im.size),'sRGB');mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.28
 verts=[v.co for v in original.data.vertices];lo=Vector(tuple(min(v[i] for v in verts) for i in range(3)));hi=Vector(tuple(max(v[i] for v in verts) for i in range(3)))
 scale=width/(hi.x-lo.x)
 if kind=='HQ':scale=min(scale,1.32/(hi.z-lo.z),1.65/(hi.y-lo.y))
 if kind=='Relay':scale=min(scale,1.37/(hi.z-lo.z))
 zorigin=lo.z+.24/scale if kind=='HoverBot' else lo.z
 def trans(v):return Vector((-v.x*scale,-v.y*scale,(v.z-zorigin)*scale))
 rootnode=empty({'HQ':'CommandHQ','HoverBot':'PIP','Relay':'Seed','Mech':'Mech'}[kind]);rootnode['source']='User-supplied HEXFRONT GLB; optimized in Blender 5.2'
 groups={'Body':set()};defs={}
 if kind=='HQ':
  # Split only the known dish/neck region, at the existing dark joint.
  pivot=trans(Vector((.332,.102,-.05)));radar=empty('Radar_Pivot',rootnode,pivot)
  tiltpoint=trans(Vector((.34,.08,.04)));tilt=empty('Dish_Tilt',radar,tiltpoint-pivot);defs['Radar']=(tilt,tiltpoint);groups['Radar']=set()
  empty('Hangar_Door',rootnode) # Source hangar is open; no false sliding facade.
 if kind=='Relay':
  p=trans(Vector((0,0,-.17)));core=empty('Core',rootnode,p);defs['Core']=(core,p);groups['Core']=set()
  for key,coord in [('DishL',(-.30,-.30,-.07)),('DishR',(.29,.29,-.07))]:
   p=trans(Vector(coord));node=empty(key,rootnode,p);defs[key]=(node,p);groups[key]=set()
 for face in original.data.polygons:
  x,y,z=face.center;key='Body'
  if kind=='HQ' and x>.18 and z>-.05:key='Radar'
  if kind=='Relay':
   if x*x+y*y<.128**2 and z>-.17:key='Core'
   elif x+y<-.39 and z>-.065:key='DishL'
   elif x+y>.39 and z>-.065:key='DishR'
  groups[key].add(face.index)
 objects=[]
 for name,faces in groups.items():
  if not faces:continue
  parent,pivot=defs.get(name,(rootnode,(0,0,0)));objects.append(part_from_faces(original,faces,kind+'_'+name,parent,pivot,trans))
 bpy.data.objects.remove(original,do_unlink=True)
 # Complete the small missing bot optic with one convex lens; keep its housing.
 if kind=='HoverBot':
  optic=bpy.data.materials.new('Supplied_Optic');optic.use_nodes=True;b=optic.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(1,.40,.045,1);b.inputs['Metallic'].default_value=.15;b.inputs['Roughness'].default_value=.22;b.inputs['Emission Color'].default_value=(1,.33,.035,1);b.inputs['Emission Strength'].default_value=.8
  bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=trans(Vector((0,-.284,.005))))
  lens=bpy.context.object;lens.name='HoverBot_ConvexOptic';lens.parent=rootnode;lens.scale=(.041*scale,.012*scale,.041*scale);lens.data.materials.append(optic)
  for f in lens.data.polygons:f.use_smooth=True
  objects.append(lens)
 # Remove empty importer containers, but keep all authored articulation roots.
 for o in list(bpy.context.scene.objects):
  if o.type=='EMPTY' and o!=rootnode and o.parent is None and len(o.children)==0:bpy.data.objects.remove(o,do_unlink=True)
 bpy.ops.object.select_all(action='DESELECT')
 for o in bpy.context.scene.objects:o.select_set(True)
 blend=root/'scripts'/('supplied-'+kind.lower()+'.blend');bpy.ops.wm.save_as_mainfile(filepath=str(blend))
 glb=out/(kind.lower()+'.glb');bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_image_format='AUTO')
 for o in objects:o.data.calc_loop_triangles()
 after=sum(len(o.data.loop_triangles) for o in objects)
 report[kind]={'sourceFile':filename.name,'sourceSha256':hashlib.sha256(filename.read_bytes()).hexdigest(),'sourceTriangles':before,'afterCleanup':cleaned,'optimizedTriangles':after,'reductionPercent':round((1-after/before)*100,1),'bytes':glb.stat().st_size,'parts':{k:len(v) for k,v in groups.items()},'scale':scale,'maxHeight':(hi.z-lo.z)*scale,'sourceTexture':'1024x1024 original retained','blend':blend.name}
 print(kind,report[kind])
(work/'optimization.json').write_text(json.dumps(report,indent=2))
