#!/usr/bin/env python3
"""Original synthetic night sky; no input images. MIT, 2026 Hermes/SJC.
Run: uv run --with numpy --with pillow scripts/generate_starfield.py
Exact tested dependency versions are recorded in artwork/creation-manifest.json.
Fourier-filtered random fields have no interpolated lattice; irregular Gaussian
point-spread stars have subpixel locations and a continuous brightness distribution.
This is an artistic simulation, NOT a photograph or an astronomical star catalogue.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

W, H = 2560, 1440
OUTPUT = Path(__file__).resolve().parents[1] / 'artwork'
PARAMS = {
    'A': {'seed': 2026101301, 'stars': 7600, 'haze': 0.85, 'brightness': 0.87},
    'B': {'seed': 2026101302, 'stars': 10200, 'haze': 1.55, 'brightness': 0.98},
}

def field(rng, scale, slope):
    # Smooth isotropic spectral noise, not tiled/resized cell noise.
    white = rng.normal(size=(H, W)).astype(np.float32)
    fy = np.fft.fftfreq(H)[:, None]
    fx = np.fft.rfftfreq(W)[None, :]
    radius = np.sqrt(fx * fx + fy * fy)
    filt = (radius * radius + scale * scale) ** (-slope / 2)
    filt[0, 0] = 0
    out = np.fft.irfft2(np.fft.rfft2(white) * filt, s=(H, W))
    out = (out - out.mean()) / out.std()
    return out

def render(name, p):
    rng = np.random.default_rng(p['seed'])
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    x /= W
    y /= H
    large = field(rng, .0015, 1.65)
    wisps = field(rng, .004, 1.25)
    dust = field(rng, .012, .9)
    # Gentle off-axis wandering dust veil; central reading area stays quiet.
    band = np.exp(-((y - (.25 + .29*x + .07*np.sin(5*x))) / .22)**2)
    haze = np.clip(.7 + .32*large + .19*wisps + .05*dust, 0, 2.5) * band * p['haze']
    vignette = np.clip(1 - .24*((x-.48)**2 + (y-.48)**2), .7, 1)
    rgb = np.empty((H, W, 3), dtype=np.float32)
    for c, (base, tint) in enumerate([(5.5, 2.4), (10., 3.0), (19.5, 5.1)]):
        rgb[:, :, c] = (base + tint*haze) * vignette
    # Fine film-like grain is weak and non-periodic, not a texture overlay asset.
    rgb += rng.normal(0, .36, (H, W, 1))
    for _ in range(p['stars']):
        sx, sy = rng.uniform(0, W), rng.uniform(0, H)
        sigma = rng.uniform(.30, .66)
        lum = float(np.clip(rng.lognormal(2.20, .85), 2, 120)) * p['brightness']
        if lum > 48:
            sigma += rng.uniform(.08, .30)
        warm = rng.random() < .24
        color = np.array([1., .84, .65] if warm else [.72, .84, 1.], dtype=np.float32)
        if rng.random() < .28:
            color = np.array([.9, .94, 1.], dtype=np.float32)
        r = 7 if lum > 48 else 4
        x0, x1 = max(0, int(sx)-r), min(W, int(sx)+r+1)
        y0, y1 = max(0, int(sy)-r), min(H, int(sy)+r+1)
        yy, xx = np.mgrid[y0:y1, x0:x1]
        d2 = (xx-sx)**2 + (yy-sy)**2
        psf = np.exp(-d2/(2*sigma*sigma))
        if lum > 48:
            psf += .045*np.exp(-d2/(2*(sigma*3.1)**2))
        rgb[y0:y1, x0:x1] += psf[:, :, None]*lum*color
    im = Image.fromarray(np.uint8(np.clip(rgb, 0, 255)))
    png = OUTPUT/f'starry-night-{name}.png'
    webp = OUTPUT/f'starry-night-{name}.webp'
    im.save(png)
    im.save(webp, lossless=True, method=6)
    return {'variant': name, 'parameters': p, 'dimensions': [W,H],
            'files': {f.name: hashlib.sha256(f.read_bytes()).hexdigest() for f in [png,webp]},
            'rgb_mean': np.asarray(im).mean(axis=(0,1)).tolist()}

if __name__ == '__main__':
    OUTPUT.mkdir(exist_ok=True)
    records = [render(k,v) for k,v in PARAMS.items()]
    manifest = {'schema':1,'title':'Original Quiet Night / Veiled Night',
                'author':'Hermes/SJC, user-directed original procedural artwork',
                'license':'MIT','input_images':[], 'source':'scripts/generate_starfield.py',
                'source_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                'dependencies': {'numpy':np.__version__, 'pillow':Image.__version__},
                'claim':'Synthetic illustration only; no photographic or reference-match claim',
                'variants':records}
    (OUTPUT/'creation-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(manifest,indent=2))
