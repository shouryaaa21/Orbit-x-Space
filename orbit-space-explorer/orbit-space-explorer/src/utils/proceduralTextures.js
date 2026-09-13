import * as THREE from 'three';

// A small, deterministic value-noise + fractal-Brownian-motion implementation
// used to generate realistic-looking planet surfaces, cloud layers, ring
// bands, and a turbulent star surface entirely at runtime — no external
// image files, no network requests, so it always renders correctly no
// matter where the app is deployed.

function hash2(x, y, seed) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const tl = hash2(xi, yi, seed);
  const tr = hash2(xi + 1, yi, seed);
  const bl = hash2(xi, yi + 1, seed);
  const br = hash2(xi + 1, yi + 1, seed);

  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const top = tl + (tr - tl) * u;
  const bottom = bl + (br - bl) * u;
  return top + (bottom - top) * v;
}

/** Fractal Brownian motion: several octaves of value noise layered together. Returns roughly 0..1. */
function fbm(x, y, seed, octaves = 5) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let max = 0;

  for (let i = 0; i < octaves; i++) {
    value += valueNoise(x * frequency, y * frequency, seed + i * 17.3) * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / max;
}

function clamp255(value) {
  return Math.max(0, Math.min(255, value));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

/** Turns a name into a small stable number, so the same body always generates the same texture. */
export function hashSeed(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) % 100000;
  }
  return h || 1;
}

/** Builds a THREE.CanvasTexture by evaluating computePixel(nx, ny) — each in 0..1 — for every pixel. */
function generateTexture(size, computePixel) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    const ny = y / size;
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const [r, g, b, a] = computePixel(nx, ny);
      const idx = (y * size + x) * 4;
      imageData.data[idx] = clamp255(r);
      imageData.data[idx + 1] = clamp255(g);
      imageData.data[idx + 2] = clamp255(b);
      imageData.data[idx + 3] = clamp255(a);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

/** Cratered / continent-like diffuse surface for rocky bodies (Mercury, Venus, Earth, Mars, moons...). */
export function createRockyTexture({ color, size = 256, seed = 1 }) {
  const base = new THREE.Color(color);
  const texture = generateTexture(size, (nx, ny) => {
    const n = fbm(nx * 4, ny * 4, seed, 5);
    const shade = 0.55 + n * 0.6;
    return [base.r * 255 * shade, base.g * 255 * shade, base.b * 255 * shade, 255];
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Horizontally-banded, turbulent diffuse surface for gas giants (Jupiter, Saturn, Uranus, Neptune). */
export function createBandedTexture({ color, size = 256, seed = 2 }) {
  const base = new THREE.Color(color);
  const texture = generateTexture(size, (nx, ny) => {
    const wobble = fbm(nx * 2, ny * 8, seed, 4) * 0.12;
    const bands = Math.sin((ny + wobble) * Math.PI * 11) * 0.5 + 0.5;
    const n = bands * 0.65 + fbm(nx * 4, ny * 4, seed + 50, 3) * 0.35;
    const shade = 0.55 + n * 0.6;
    return [base.r * 255 * shade, base.g * 255 * shade, base.b * 255 * shade, 255];
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Grayscale relief map matching a rocky or banded surface, for use as a bump map (real-looking terrain depth). */
export function createBumpTexture({ size = 256, seed = 1, banded = false }) {
  return generateTexture(size, (nx, ny) => {
    let n;
    if (banded) {
      const wobble = fbm(nx * 2, ny * 8, seed, 4) * 0.12;
      const bands = Math.sin((ny + wobble) * Math.PI * 11) * 0.5 + 0.5;
      n = bands * 0.65 + fbm(nx * 4, ny * 4, seed + 50, 3) * 0.35;
    } else {
      n = fbm(nx * 4, ny * 4, seed, 5);
    }
    const gray = n * 255;
    return [gray, gray, gray, 255];
  });
}

/** Sparse, wispy white cloud layer with transparency — for Earth-like atmospheres. */
export function createCloudTexture({ size = 256, seed = 7 }) {
  const texture = generateTexture(size, (nx, ny) => {
    const n = fbm(nx * 5, ny * 5, seed, 5);
    const alpha = clamp01((n - 0.52) * 2.6) * 255;
    return [255, 255, 255, alpha];
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Concentric, semi-transparent banded ring texture (Saturn-style), varying along the radial axis. */
export function createRingTexture({ color = '#d8c28f', size = 256, seed = 3 }) {
  const base = new THREE.Color(color);
  const texture = generateTexture(size, (nx, ny) => {
    const n = fbm(ny * 12, 0.5, seed, 4);
    const gaps = Math.sin(ny * Math.PI * 18) * 0.3 + 0.7;
    const alpha = clamp01(0.3 + n * 0.45) * gaps * 255;
    return [base.r * 255, base.g * 255, base.b * 255, alpha];
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Turbulent, fiery surface for the Sun (or any other star). */
export function createStarTexture({ size = 256, seed = 5 }) {
  const hot = new THREE.Color('#fff2c2');
  const mid = new THREE.Color('#ff9d2e');
  const cool = new THREE.Color('#c94b00');

  const texture = generateTexture(size, (nx, ny) => {
    const n = fbm(nx * 6, ny * 6, seed, 5);
    const mixed = n < 0.5 ? cool.clone().lerp(mid, n * 2) : mid.clone().lerp(hot, (n - 0.5) * 2);
    return [mixed.r * 255, mixed.g * 255, mixed.b * 255, 255];
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
