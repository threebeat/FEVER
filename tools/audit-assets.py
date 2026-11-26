"""Inspect the exact meshes and resident block textures that the native build ships."""
from pathlib import Path
import struct
import sys

root = Path(__file__).resolve().parents[1]
meshes = {}
strides = {b'FVM1': 20, b'FVM2': 32, b'FVM3': 44}
for path in sorted((root / 'assets/meshes').glob('*.fvm')):
    data = path.read_bytes()
    magic, vertices, indices = struct.unpack_from('<4sII', data)
    if magic not in strides or not 0 < vertices <= 65535 or indices % 3 or len(data) != 12 + strides[magic] * vertices + 2 * indices:
        sys.exit(f'Invalid mesh payload: {path.name}')
    meshes[path.stem] = (vertices, indices // 3)
for name, (_, count) in meshes.items():
    if name.endswith('-low'):
        base = name[:-4]
        if base not in meshes or count >= meshes[base][1]:
            sys.exit(f'LOD did not reduce triangles: {name}')
for name in ('carbine','pistol','cole-passenger','cole-patrol','kennel-attendant','hound','reed-boot'):
    print(f'{name:12} {meshes[name][1]:6,} near  {meshes[name+"-low"][1]:6,} low')

resident = 0
for name, block_size in [('surfaces.dds', 8), ('response.dds', 16)]:
    data = (root / 'assets' / name).read_bytes()
    width, levels, layers = (struct.unpack_from('<I',data,i)[0] for i in (16,28,140))
    assert width == 256 and levels == 9 and layers == 8
    expected = sum(max(1, ((width >> i)+3)//4)**2 * block_size for i in range(levels)) * layers
    if len(data) != expected + 148:
        sys.exit(f'Bad mip chain: {name}')
    resident += expected
print(f'{len(meshes)} meshes; two resident material arrays {resident:,} bytes (including mipmaps, excluding driver alignment).')
