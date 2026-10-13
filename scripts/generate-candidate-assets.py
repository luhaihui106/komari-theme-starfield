#!/usr/bin/env python3
"""Generate isolated candidate assets; no production files are touched."""
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
def sha(data):
    return hashlib.sha256(data).hexdigest()
def download(url):
    return urlopen(url, timeout=60).read()

def main():
    earth = ROOT / 'public/images/earth'
    records = []
    def replace(path, data, source, recipe, classification):
        old = sha(path.read_bytes()) if path.exists() else None
        path.write_bytes(data)
        records.append(dict(path=str(path.relative_to(ROOT)), old_sha256=old, sha256=sha(data), source=source, recipe=recipe, classification=classification))
    # The accepted NASA day texture remains byte-for-byte unchanged.
    day = ROOT / 'public/assets/earth/earth-blue-marble.webp'
    day_target = earth / 'earth-blue-marble.webp'
    replace(day_target, day.read_bytes(), 'NASA_TEXTURE.md', 'Exact accepted lossless WebP bytes, unchanged', 'NASA informational imagery')
    legacy_day = earth / 'earth-blue-marble.jpg'
    if legacy_day.exists():
        records.append(dict(path=str(legacy_day.relative_to(ROOT)), old_sha256=sha(legacy_day.read_bytes()), sha256=None, replacement=str(day_target.relative_to(ROOT))))
        legacy_day.unlink()
    night_url = 'https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg'
    night = download(night_url)
    replace(earth / 'earth-night.jpg', night, night_url, 'Official 2016 Black Marble 3600x1800 JPEG, unchanged', 'NASA informational imagery')
    geo_url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/f1890d9f152c896d250a77557a5751a93d494776/geojson/ne_110m_admin_0_countries.geojson'
    raw = download(geo_url)
    assert sha(raw) == '6866c877d39cba9c357620878839b336d569f8c662d3cfab4cb1dbe2d39c977f'
    mask = Image.new('L', (2048,1024), 255)
    draw = ImageDraw.Draw(mask)
    for f in json.loads(raw)['features']:
        polys = [f['geometry']['coordinates']] if f['geometry']['type'] == 'Polygon' else f['geometry']['coordinates']
        for poly in polys:
            for index, ring in enumerate(poly):
                points = [((lon+180)/360*2048, (90-lat)/180*1024) for lon,lat,*_ in ring]
                draw.polygon(points, fill=0 if index == 0 else 255)
    import io
    stream = io.BytesIO(); mask.save(stream, format='PNG', optimize=False)
    replace(earth / 'earth-water.png', stream.getvalue(), geo_url, '2048x1024 equirectangular ocean-white land-black mask; Pillow polygon rasterization; no elevation claim', 'Public-domain Natural Earth derivative')
    neutral = Image.new('L', (2048,1024), 128)
    stream = io.BytesIO(); neutral.save(stream, format='PNG', optimize=False)
    replace(earth / 'earth-topology.png', stream.getvalue(), 'scripts/generate-candidate-assets.py', 'Uniform 128 neutral bump map; removes unsupported elevation rather than inventing terrain', 'Original program output, MIT')
    generic = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="7" y="10" width="50" height="35" rx="7" fill="#0d2438" stroke="#79d5e8" stroke-width="3"/><path d="M17 22l7 6-7 6m15 0h13M25 45v9m14-9v9M19 55h26" fill="none" stroke="#b7f1df" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>\n'
    replace(ROOT/'public/images/logo/generic-system.svg', generic.encode(), 'scripts/generate-candidate-assets.py', 'Original terminal/monitor geometry, no traced brand silhouette', 'Original program output, MIT')
    (ROOT/'docs/asset-evidence/generated-assets.json').write_text(json.dumps(dict(schema=1, generator='scripts/generate-candidate-assets.py', records=[{k:v for k,v in r.items() if k != 'old_sha256'} for r in records]), indent=2)+'\n')
    print(f'{len(records)} explicit candidate transitions')
if __name__ == '__main__':
    main()
