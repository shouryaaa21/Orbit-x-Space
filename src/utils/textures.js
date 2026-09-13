// Procedural texture generation — every texture is synthesized locally with
// canvas + noise, so there are zero network fetches and instant loading.

import * as THREE from 'three';

/* ---------------------------- noise utilities ---------------------------- */

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function valueNoise2D(seed = 1) {
  const rng = makeRng(seed);
  const size = 256;
  const table = new Float32Array(size * size);
  for (let i = 0; i < table.length; i++) table[i] = rng();
  const at = (x, y) => table[((y & 255) << 8) | (x & 255)];
  const fade = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = fade(xf);
    const v = fade(yf);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

function fbm(noise, x, y, octaves = 5, lacunarity = 2, gain = 0.5) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/* ---------------------------- canvas helpers ----------------------------- */

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext('2d')];
}

function toTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function hexToRgb(hex) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}

/* --------------------------- planet surfacing ---------------------------- */

function lerpRgb(a, b, t, out) {
  out[0] = a[0] + (b[0] - a[0]) * t;
  out[1] = a[1] + (b[1] - a[1]) * t;
  out[2] = a[2] + (b[2] - a[2]) * t;
}

/**
 * Rocky / terrestrial surface: fBm terrain with optional ice caps, craters
 * and secondary accent coloring (e.g. continents on Earth).
 */
function paintRocky(ctx, W, H, body, seed) {
  const noise = valueNoise2D(seed);
  const noise2 = valueNoise2D(seed + 77);
  const palette = (body.palette || [body.color]).map(hexToRgb);
  const accent = body.accent ? hexToRgb(body.accent.color) : null;
  const accentThresh = body.accent ? body.accent.threshold : 2;
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const bump = body.bumpiness ?? 0.6;

  // pre-generate crater centers for small bodies
  const craters = [];
  if (bump > 0.6) {
    const rng = makeRng(seed * 13 + 5);
    for (let i = 0; i < 90; i++) {
      craters.push({ x: rng() * W, y: 0.18 * H + rng() * 0.64 * H, r: 3 + rng() * 10 });
    }
  }

  for (let y = 0; y < H; y++) {
    const v = y / H;
    const polar = Math.abs(v - 0.5) * 2; // 0 at equator, 1 at poles
    for (let x = 0; x < W; x++) {
      const u = x / W;
      // latitude-corrected sample to avoid pole pinching
      const long = u * Math.PI * 2;
      const latV = (v - 0.5) * Math.PI;
      const sx = Math.cos(long) * Math.cos(latV) * 8 + 40;
      const sy = Math.sin(long) * Math.cos(latV) * 8 + 40;
      const sz = Math.sin(latV) * 8 + 40;
      let n = (fbm(noise, sx, sy, 6) + fbm(noise, sz, sy, 6)) * 0.5;
      n = Math.pow(n, 1.2 - bump * 0.3);

      // craters darken local area with rim highlight
      let crater = 0;
      for (const c of craters) {
        const dx = Math.min(Math.abs(x - c.x), W - Math.abs(x - c.x));
        const dy = y - c.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < c.r) {
          const t = d / c.r;
          crater += t < 0.75 ? -0.28 * (1 - t) : 0.22 * (t - 0.75) / 0.25;
        }
      }
      n = THREE.MathUtils.clamp(n + crater * 0.9, 0, 1);

      // band across palette
      const stops = palette.length - 1;
      const idx = Math.min(Math.floor(n * stops), stops - 1);
      const local = n * stops - idx;
      const rgb = [0, 0, 0];
      lerpRgb(palette[idx], palette[idx + 1], local, rgb);

      // accent regions (continents / frost patches)
      if (accent) {
        const m = fbm(noise2, sx * 1.4, sy * 1.4, 4);
        if (m > accentThresh) {
          const t = Math.min((m - accentThresh) / 0.18, 1);
          lerpRgb(rgb, accent, t * 0.85, rgb);
        }
      }

      // ice caps
      const capSize = body.name === 'Mars' ? 0.82 : 0.86;
      if (polar > capSize) {
        const t = Math.min((polar - capSize) / 0.12, 1);
        lerpRgb(rgb, [240, 244, 250], t, rgb);
      }

      const i = (y * W + x) * 4;
      data[i] = rgb[0] * 255;
      data[i + 1] = rgb[1] * 255;
      data[i + 2] = rgb[2] * 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Banded gas-giant surface with turbulent flow and optional storm ovals. */
function paintBanded(ctx, W, H, body, seed) {
  const noise = valueNoise2D(seed);
  const noise2 = valueNoise2D(seed + 31);
  const palette = (body.palette || [body.color]).map(hexToRgb);
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const stops = palette.length - 1;

  const rng = makeRng(seed * 7 + 3);
  const storms = body.storm ? [{ x: rng(), y: 0.62, rx: 0.055, ry: 0.032 }] : [];
  if (body.name === 'Saturn') storms.push({ x: 0.3, y: 0.36, rx: 0.04, ry: 0.02 });

  for (let y = 0; y < H; y++) {
    const v = y / H;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      // wavy horizontal bands
      const warp = fbm(noise, u * 6, v * 14, 4) - 0.5;
      const band = v + warp * 0.045;
      let n = 0.5 + 0.5 * Math.sin(band * Math.PI * (5 + stops * 2.2));
      n = 0.55 * n + 0.45 * fbm(noise2, u * 10, v * 40, 3);

      // storm ovals
      for (const s of storms) {
        let du = Math.abs(u - s.x);
        du = Math.min(du, 1 - du);
        const dv = (v - s.y) / s.ry;
        const d = Math.sqrt((du / s.rx) ** 2 + dv * dv);
        if (d < 1) {
          const t = 1 - d;
          n = n * (1 - t) + (body.name === 'Jupiter' ? 0.14 : 0.85) * t * t;
        }
      }

      const idx = Math.min(Math.floor(n * stops), stops - 1);
      const local = n * stops - idx;
      const rgb = [0, 0, 0];
      lerpRgb(palette[idx], palette[idx + 1], local, rgb);

      // darken poles slightly
      const polar = Math.abs(v - 0.5) * 2;
      if (polar > 0.75) {
        const t = (polar - 0.75) / 0.25;
        rgb[0] *= 1 - t * 0.35;
        rgb[1] *= 1 - t * 0.35;
        rgb[2] *= 1 - t * 0.35;
      }

      const i = (y * W + x) * 4;
      data[i] = rgb[0] * 255;
      data[i + 1] = rgb[1] * 255;
      data[i + 2] = rgb[2] * 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function planetTexture(body, seed = 7) {
  const W = 1024;
  const H = 512;
  const [canvas, ctx] = makeCanvas(W, H);
  if (body.banded) paintBanded(ctx, W, H, body, seed);
  else paintRocky(ctx, W, H, body, seed);
  return toTexture(canvas);
}

export function moonTexture(moon, seed = 3) {
  const W = 512;
  const H = 256;
  const [canvas, ctx] = makeCanvas(W, H);
  paintRocky(ctx, W, H, { ...moon, accent: null, bumpiness: moon.bumpiness ?? 0.6 }, seed);
  return toTexture(canvas);
}

/* ------------------------------- clouds ---------------------------------- */

/** Semi-transparent turbulent cloud layer (Earth, Venus). */
export function cloudTexture(body, seed = 11) {
  const W = 1024;
  const H = 512;
  const [canvas, ctx] = makeCanvas(W, H);
  const noise = valueNoise2D(seed);
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const tint = hexToRgb(body.cloudColor || '#ffffff');
  const venus = body.name === 'Venus';

  for (let y = 0; y < H; y++) {
    const v = y / H;
    const latV = (v - 0.5) * Math.PI;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const long = u * Math.PI * 2;
      const sx = Math.cos(long) * Math.cos(latV) * 10 + 50;
      const sy = Math.sin(long) * Math.cos(latV) * 10 + 50;
      const sz = Math.sin(latV) * 10 + 50;
      let n = (fbm(noise, sx, sy, 5) + fbm(noise, sz, sy, 5)) * 0.5;
      if (venus) {
        // strong zonal streaks
        const streak = fbm(noise, u * 3 + fbm(noise, sz, sy, 3) * 1.5, v * 22, 3);
        n = 0.4 * n + 0.6 * streak;
      }
      const a = THREE.MathUtils.clamp((n - (venus ? 0.42 : 0.52)) * (venus ? 5.5 : 4.5), 0, 1);
      const i = (y * W + x) * 4;
      data[i] = tint[0] * 255;
      data[i + 1] = tint[1] * 255;
      data[i + 2] = tint[2] * 255;
      data[i + 3] = a * 255 * (venus ? 0.96 : 0.85);
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(canvas);
}

/* -------------------------------- rings ---------------------------------- */

/** Radially-striped ring texture with a Cassini-division-style gap. */
export function ringTexture(color = '#d8c8a0', seed = 17) {
  const W = 1024;
  const H = 8;
  const [canvas, ctx] = makeCanvas(W, H);
  const noise = valueNoise2D(seed);
  const rgb = hexToRgb(color);
  const img = ctx.createImageData(W, H);
  const data = img.data;

  for (let x = 0; x < W; x++) {
    const t = x / W;
    let a = 0.65 + 0.35 * fbm(noise, t * 60, 0.5, 4);
    // Cassini division
    const gap = Math.abs(t - 0.62);
    if (gap < 0.035) a *= gap / 0.035;
    // inner fade & outer fade
    if (t < 0.06) a *= t / 0.06;
    if (t > 0.94) a *= (1 - t) / 0.06;
    // brighten a couple of ringlets
    if (Math.abs(t - 0.3) < 0.02) a = Math.min(a * 1.4, 1);
    const i = x * 4;
    for (let y = 0; y < H; y++) {
      const j = (y * W + x) * 4;
      data[j] = rgb[0] * 255;
      data[j + 1] = rgb[1] * 255;
      data[j + 2] = rgb[2] * 255;
      data[j + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = toTexture(canvas);
  return tex;
}

/* ------------------------------ progress API ------------------------------ */

let cache = new Map();

export function getPlanetTexture(body) {
  if (!cache.has(body.name)) cache.set(body.name, planetTexture(body));
  return cache.get(body.name);
}

export function getMoonTexture(moon) {
  const key = `${moon.name}-moon`;
  if (!cache.has(key)) cache.set(key, moonTexture(moon));
  return cache.get(key);
}

export function getCloudTexture(body) {
  const key = `${body.name}-clouds`;
  if (!cache.has(key)) cache.set(key, cloudTexture(body));
  return cache.get(key);
}

export function getRingTexture(rings) {
  const key = `rings-${rings.color}`;
  if (!cache.has(key)) cache.set(key, ringTexture(rings.color));
  return cache.get(key);
}

/* ------------------------------ bump maps ------------------------------- */

/** Grayscale heightmap for surface relief. */
export function bumpTexture(body, seed = 20) {
  const W = 512;
  const H = 256;
  const [canvas, ctx] = makeCanvas(W, H);
  const noise = valueNoise2D(seed + (body.name?.charCodeAt(0) || 0));
  const img = ctx.createImageData(W, H);
  const data = img.data;

  for (let y = 0; y < H; y++) {
    const latV = (y / H - 0.5) * Math.PI;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const long = u * Math.PI * 2;
      const sx = Math.cos(long) * Math.cos(latV) * 10 + 50;
      const sy = Math.sin(long) * Math.cos(latV) * 10 + 50;
      const sz = Math.sin(latV) * 10 + 50;
      let n = (fbm(noise, sx, sy, 5) + fbm(noise, sz, sy, 5)) * 0.5;
      // Gas giants get very subtle bump; rocky planets get strong relief
      if (body.banded) n = 0.45 + n * 0.1;
      else n = 0.2 + n * 0.6;
      const val = Math.floor(THREE.MathUtils.clamp(n, 0, 1) * 255);
      const i = (y * W + x) * 4;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(canvas);
}

export function getBumpTexture(body) {
  const key = `${body.name}-bump`;
  if (!cache.has(key)) cache.set(key, bumpTexture(body));
  return cache.get(key);
}

/* ------------------------- Earth night lights ----------------------------- */

/** Procedural city-lights texture for Earth's dark side. */
export function nightLightsTexture(seed = 42) {
  const W = 512;
  const H = 256;
  const [canvas, ctx] = makeCanvas(W, H);
  const noise = valueNoise2D(seed);
  const noise2 = valueNoise2D(seed + 33);
  const img = ctx.createImageData(W, H);
  const data = img.data;

  // Identify land vs ocean using the same threshold as Earth's diffuse
  const isLand = (u, v) => {
    const long = u * Math.PI * 2;
    const latV = (v - 0.5) * Math.PI;
    const sx = Math.cos(long) * Math.cos(latV) * 8 + 40;
    const sy = Math.sin(long) * Math.cos(latV) * 8 + 40;
    const sz = Math.sin(latV) * 8 + 40;
    const n = (fbm(noise, sx, sy, 5) + fbm(noise, sz, sy, 5)) * 0.5;
    return n > 0.48;
  };

  // Pre-generate city clusters (lat/lon in UV space, brightness, spread)
  const rng = makeRng(seed * 7 + 11);
  const cities = [];
  for (let i = 0; i < 400; i++) {
    cities.push({
      u: rng(),
      v: 0.12 + rng() * 0.76, // avoid extreme poles
      brightness: 0.3 + rng() * 0.7,
      spread: 2 + rng() * 5,
    });
  }

  for (let y = 0; y < H; y++) {
    const v = y / H;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      let val = 0;
      if (isLand(u, v)) {
        for (const city of cities) {
          const dx = Math.min(Math.abs(u - city.u), 1 - Math.abs(u - city.u));
          const dy = v - city.v;
          const dist = Math.sqrt(dx * dx * W * W * 0.25 + dy * dy * H * H);
          if (dist < city.spread * 6) {
            val = Math.max(val, city.brightness * (1 - dist / (city.spread * 6)));
          }
        }
        // Add micro-clusters from noise
        val += fbm(noise2, u * 40, v * 20, 2) * 0.08;
      }
      val = THREE.MathUtils.clamp(val, 0, 1);
      const i = (y * W + x) * 4;
      data[i] = Math.floor(val * 255);       // warm white R
      data[i + 1] = Math.floor(val * 210);   // G
      data[i + 2] = Math.floor(val * 140);   // warm B
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(canvas);
}

let _nightLightsTex = null;
export function getNightLightsTexture() {
  if (!_nightLightsTex) _nightLightsTex = nightLightsTexture();
  return _nightLightsTex;
}

/**
 * Pre-generates all textures, calling onProgress(0..1) as each completes.
 * Uses chunked setTimeout so the loading UI can render between items.
 */
export function preloadAllTextures(celestialBodies, sunData, onProgress) {
  const tasks = [];
  for (const body of celestialBodies) {
    tasks.push(() => getPlanetTexture(body));
    tasks.push(() => getBumpTexture(body));
    if (body.name === 'Earth') tasks.push(() => getNightLightsTexture());
    if (body.clouds) tasks.push(() => getCloudTexture(body));
    if (body.rings) tasks.push(() => getRingTexture(body.rings));
    for (const moon of body.moons || []) {
      tasks.push(() => getMoonTexture(moon));
      tasks.push(() => bumpTexture(moon, 25));
    }
  }
  const total = tasks.length;
  let done = 0;
  return new Promise((resolve) => {
    if (total === 0) {
      onProgress?.(1);
      resolve();
      return;
    }
    onProgress?.(0);
    const step = () => {
      const batch = tasks.splice(0, 3);
      for (const task of batch) task();
      done += batch.length;
      onProgress?.(Math.min(done / total, 1));
      if (tasks.length === 0) {
        resolve();
      } else {
        setTimeout(step, 30);
      }
    };
    step();
  });
}
