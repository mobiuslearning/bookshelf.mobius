#!/usr/bin/env python3
"""Generate the procedural wood / paper textures used by the site.

Requires Pillow + numpy (bundled with the DSH Python runtime).
Run:  python3 scripts/make-textures.py
"""
from pathlib import Path
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "textures"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(20261018)


def smooth_noise(width: int, height: int, cell: int) -> np.ndarray:
    """Value noise: random grid upscaled with bicubic interpolation."""
    gw, gh = max(2, width // cell), max(2, height // cell)
    grid = rng.random((gh, gw)).astype(np.float32)
    image = Image.fromarray((grid * 255).astype(np.uint8), mode="L")
    image = image.resize((width, height), Image.Resampling.BICUBIC)
    return np.asarray(image, dtype=np.float32) / 255.0


def fbm(width: int, height: int) -> np.ndarray:
    layers = []
    for cell, weight in ((260, 0.55), (90, 0.28), (34, 0.12), (12, 0.05)):
        layers.append(smooth_noise(width, height, cell) * weight)
    return np.clip(sum(layers), 0, 1)


def colorize(value: np.ndarray, dark: tuple, light: tuple) -> np.ndarray:
    v = np.clip(value, 0, 1)[..., None]
    dark = np.array(dark, dtype=np.float32)
    light = np.array(light, dtype=np.float32)
    return (dark + (light - dark) * v).astype(np.uint8)


def make_wood(width, height, dark, light, plank_width=0, vertical=False, knots=3):
    n = fbm(width, height)
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    # Slow warp makes the grain wander instead of looking like a sine wave.
    warp = smooth_noise(width, height, 260) * 1.05
    fine_warp = smooth_noise(width, height, 26) * 0.7
    main_axis = xx if vertical else yy
    cross_axis = yy if vertical else xx
    # Broad cathedral grain + tight streaks.
    grain = np.sin((main_axis * 0.016 + warp * 1.35 + np.sin(cross_axis * 0.0035) * 0.9) * math.tau * 1.7)
    grain2 = np.sin((main_axis * 0.005 + warp * 0.55) * math.tau * 0.9)
    streak = smooth_noise(width, height, 7) * 0.55 + smooth_noise(width, height, 24) * 0.45
    value = 0.54 + grain * 0.022 + grain2 * 0.035 + (n - 0.5) * 0.14 + (streak - 0.5) * 0.06
    value += fine_warp * 0.012
    # Knots: concentric rings around a dark core.
    for _ in range(knots):
        cx, cy = rng.uniform(0.08, 0.92) * width, rng.uniform(0.1, 0.9) * height
        rx, ry = rng.uniform(0.035, 0.075) * width, rng.uniform(0.016, 0.038) * height
        d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
        ring = np.sin(d * 12.0 + warp * 3.0) * np.exp(-d * 0.55)
        value += ring * 0.038
        value -= np.exp(-((d * 2.2) ** 2)) * 0.12
    # Long scratches and pores.
    for _ in range(22):
        y0 = rng.uniform(0, height)
        x0 = rng.uniform(0, width)
        length = rng.uniform(width * 0.1, width * 0.6)
        angle = rng.uniform(-0.035, 0.035) + (math.pi / 2 if vertical else 0)
        x1 = x0 + math.cos(angle) * length
        y1 = y0 + math.sin(angle) * length
        overlay = Image.new("L", (width, height), 0)
        draw = ImageDraw.Draw(overlay)
        draw.line((x0, y0, x1, y1), fill=int(rng.uniform(8, 24)), width=1)
        overlay = overlay.filter(ImageFilter.GaussianBlur(0.6))
        value -= np.asarray(overlay, dtype=np.float32) / 255.0 * 0.09
    # Plank seams / grooves.
    if plank_width:
        position = np.mod(xx if not vertical else yy, plank_width)
        groove = np.exp(-((np.minimum(position, plank_width - position)) / 3.0) ** 2)
        value -= groove * 0.20
        value += (smooth_noise(width, height, plank_width) - 0.5) * 0.04
    value = np.clip(value, 0, 1)
    rgb = colorize(value, dark, light)
    image = Image.fromarray(rgb, "RGB")
    # Slight warm highlight wash.
    return image.filter(ImageFilter.UnsharpMask(radius=1.2, percent=45, threshold=4))


def make_paper(width=1200, height=1600):
    n = fbm(width, height)
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    fiber = smooth_noise(width, height, 2) * 0.5 + smooth_noise(width, height, 5) * 0.5
    blotch = smooth_noise(width, height, 150)
    value = 0.82 + (n - 0.5) * 0.10 + (fiber - 0.5) * 0.04 + (blotch - 0.5) * 0.10
    # Warm vignette.
    dist = np.sqrt(((xx - width / 2) / (width / 2)) ** 2 + ((yy - height / 2) / (height / 2)) ** 2)
    value -= np.clip(dist - 0.72, 0, 1) * 0.10
    rgb = colorize(np.clip(value, 0, 1), (206, 190, 163), (246, 239, 224))
    image = Image.fromarray(rgb, "RGB")
    draw = ImageDraw.Draw(image, "RGBA")
    for _ in range(420):
        x, y = rng.uniform(0, width), rng.uniform(0, height)
        length = rng.uniform(2, 12)
        draw.line((x, y, x + length, y + rng.uniform(-1.5, 1.5)), fill=(120, 100, 74, int(rng.uniform(4, 12))), width=1)
    return image.filter(ImageFilter.GaussianBlur(0.35))


def make_noise(size=256):
    array = rng.integers(0, 255, (size, size), dtype=np.uint8)
    image = Image.fromarray(array, "L").convert("RGBA")
    alpha = np.asarray(image)[..., 3]
    alpha = (rng.random((size, size)) * 18).astype(np.uint8)
    data = np.zeros((size, size, 4), dtype=np.uint8)
    data[..., :3] = 255
    data[..., 3] = alpha
    return Image.fromarray(data, "RGBA")


print("wood wall…")
make_wood(1800, 1200, (18, 10, 7), (104, 66, 42), plank_width=300, vertical=True, knots=2).save(
    OUT / "wood-wall.jpg", quality=86, optimize=True
)
print("shelf plank…")
make_wood(2200, 520, (28, 16, 10), (142, 93, 57), plank_width=0, knots=1).save(
    OUT / "wood-shelf.jpg", quality=88, optimize=True
)
print("dark shelf back…")
make_wood(1800, 900, (14, 8, 6), (76, 48, 32), plank_width=0, vertical=False, knots=1).save(
    OUT / "wood-back.jpg", quality=86, optimize=True
)
print("paper…")
make_paper().save(OUT / "paper.jpg", quality=88, optimize=True)
print("noise…")
make_noise().save(OUT / "noise.png", optimize=True)
print("done", OUT)
