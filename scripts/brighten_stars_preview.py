from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance
base = Path(__file__).resolve().parents[1] / 'artwork'
source = base / ('starry-night-' + 'B' + '.png')
im = Image.open(source).convert('RGB')
a = np.asarray(im, dtype=np.float32) / 255
# Lift middle tones so star points and blue haze survive phone previews.
a = np.clip(a ** 0.52, 0, 1)
im = Image.fromarray((a * 255).astype('uint8'))
im = ImageEnhance.Color(im).enhance(1.12)
im.thumbnail((1920, 1080), Image.Resampling.LANCZOS)
out = base / 'reproduced-starry-brighter.jpg'
im.save(out, quality=96, subsampling=0)
print(out)
