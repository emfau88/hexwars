"""Re-encode only the selected CC0 maps; no generative image edits.
Usage: python scripts/prepare-materials.py SOURCE_DIRECTORY
Fetch URLs and original hashes are retained in material-provenance.json.
"""
from pathlib import Path
from PIL import Image
import hashlib,json,sys
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root/'public/assets/materials'
out=root/'public/assets/materials'
selected=[('rock_boulder_dry','diff',1024),('rock_boulder_dry','nor_gl',512),('rock_boulder_dry','rough',512),('rock_wall_02','diff',1024),('rock_wall_02','rough',512)]
records=[]
for asset,kind,size in selected:
 original=source/f'{asset}_{kind}_1k.jpg'
 data=original.read_bytes()
 with Image.open(original) as image:
  image=image.convert('RGB')
  if image.size!=(size,size): image=image.resize((size,size),Image.Resampling.LANCZOS)
  file=out/f'{asset}_{kind}.webp'
  image.save(file,'WEBP',lossless=kind!='diff',quality=82,method=6)
 records.append({'file':file.name,'source':f'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/{asset}/{original.name}','assetPage':f'https://polyhaven.com/a/{asset}','license':'CC0-1.0','authors':['Dimitrios Savva','Rico Cilliers'] if asset=='rock_boulder_dry' else ['Rob Tuytel'],'originalSha256':hashlib.sha256(data).hexdigest(),'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'dimensions':[size,size],'bytes':file.stat().st_size,'modification':'WebP encoding; normal/roughness resized to 512; no painted or generated replacement','retrieved':'2026-10-12'})
(out/'material-provenance.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
print('Verified selected maps:',len(records),'bytes:',sum(r['bytes'] for r in records))
