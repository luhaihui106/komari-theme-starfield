#!/usr/bin/env python3
"""Render the approved, unmodified original geometric SVG. MIT licensed.
Requirements: CairoSVG==2.8.2 Pillow==12.0.0
Usage: python scripts/generate-favicon.py [output-directory]
"""
from pathlib import Path
import hashlib
import io
import sys
import cairosvg
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
source = root / 'docs/favicon/original-earth-refined.svg'
if not source.exists():
    source = Path(__file__).resolve().parent / 'original-earth-refined.svg'
assert hashlib.sha256(source.read_bytes()).hexdigest() == 'e0ed7ef98a8f88401a636070b0b7806d62bfc3cf37bc99fee79a44329bd10f5b'
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'public'
out.mkdir(parents=True, exist_ok=True)
master = Image.open(io.BytesIO(cairosvg.svg2png(bytestring=source.read_bytes(), output_width=1024, output_height=1024))).convert('RGBA')
sizes = (16, 32, 48, 64, 128, 256)
master.resize((256, 256), Image.Resampling.LANCZOS).save(out / 'favicon.ico', sizes=[(s, s) for s in sizes])
master.resize((180, 180), Image.Resampling.LANCZOS).save(out / 'apple-touch-icon.png')
strip = Image.new('RGB', (640, 290), '#edf2f7')
draw = ImageDraw.Draw(strip)
x = 10
for size in sizes:
    icon = master.resize((size, size), Image.Resampling.LANCZOS)
    strip.paste(icon, (x, 22), icon)
    draw.text((x, 4), str(size), fill='#172a42')
    x += size + 12
strip.save(out / 'favicon-size-check.png')
ico = Image.open(out / 'favicon.ico')
assert ico.ico.sizes() == {(s, s) for s in sizes}
for size in sizes:
    assert ico.ico.getimage((size, size)).size == (size, size)
assert Image.open(out / 'apple-touch-icon.png').size == (180, 180)
for name in ('favicon.ico', 'apple-touch-icon.png'):
    print(name, hashlib.sha256((out / name).read_bytes()).hexdigest())
