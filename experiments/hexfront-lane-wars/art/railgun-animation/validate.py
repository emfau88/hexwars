import struct,json,hashlib
from pathlib import Path
def asset(p):
 b=Path(p).read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);buf=b[28+n:]
 def value(i):
  a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];off=v.get('byteOffset',0)+a.get('byteOffset',0);components={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];size={5126:4,5125:4,5123:2,5121:1}[a['componentType']]*components*a['count'];return hashlib.sha256(buf[off:off+size]).hexdigest()
 result={};tris=0
 for node in j['nodes']:
  if 'mesh' not in node:continue
  mesh=j['meshes'][node['mesh']]
  result[node['name']]=[{k:value(v) for k,v in p['attributes'].items()} for p in mesh['primitives']]
  tris+=sum(j['accessors'][p['indices']]['count']//3 for p in mesh['primitives'])
 return result,tris
a,ta=asset('public/models/railgun-preview/railgun.glb');b,tb=asset('public/models/railgun-animated/railgun.glb');c,tc=asset('public/models/railgun-animated/railgun-lod.glb')
assert a==b,'Approved vertex attributes changed';assert a.keys()==c.keys()
print(json.dumps({'approvedGeometryUnchanged':True,'triangles':tb,'lodTriangles':tc,'rigidAssemblies':len(a)}))
Path('docs/railgun-animation/asset-validation.json').write_text(json.dumps({'approvedGeometryUnchanged':True,'triangles':tb,'lodTriangles':tc,'rigidAssemblies':len(a)},indent=2))
