// Procedural ambient audio engine — deep space drone, shimmering pad and
// UI interaction blips. No audio files: everything is synthesized with the
// Web Audio API on demand after the first user gesture.

let ctx = null;
let master = null;
let padGain = null;
let droneGain = null;
let started = false;
let muted = false;

const listeners = new Set();

function ensureContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

/** Slow evolving chord pad (D minor add9), built from detuned saw pairs. */
function startPad() {
  padGain = ctx.createGain();
  padGain.gain.value = 0.05;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.4;
  padGain.connect(filter);
  filter.connect(master);

  const freqs = [73.42, 110.0, 146.83, 220.0, 293.66]; // D2 A2 D3 A3 D4
  freqs.forEach((f, i) => {
    [-4, 3].forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = 0.12 / (i * 0.5 + 1);
      osc.connect(g);
      g.connect(padGain);
      osc.start();
    });
  });

  // slow filter sweep for breathing motion
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 380;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();
}

/** Very low drone with a hint of Solar wind noise. */
function startDrone() {
  droneGain = ctx.createGain();
  droneGain.gain.value = 0.1;
  droneGain.connect(master);

  [36.71, 55.0].forEach((f) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    osc.connect(g);
    g.connect(droneGain);
    osc.start();
  });

  // filtered noise = solar wind
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 240;
  noiseFilter.Q.value = 0.6;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.05;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(droneGain);
  noise.start();
}

export function startAmbient() {
  if (started) return;
  ensureContext();
  started = true;
  startPad();
  startDrone();
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 1.4);
}

export function setMuted(next) {
  muted = next;
  if (ctx && master) {
    master.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.25);
  }
  listeners.forEach((fn) => fn(muted));
}

export function isMuted() {
  return muted;
}

export function onMuteChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* --------------------------------- blips --------------------------------- */

export function playHover() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(660, t + 0.07);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + 0.2);
}

export function playSelect() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  [392, 587.33].forEach((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const g = ctx.createGain();
    const t0 = t + i * 0.06;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + 0.5);
  });
}

export function playWhoosh() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.7;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(200, t);
  filter.frequency.exponentialRampToValueAtTime(1800, t + 0.45);
  filter.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(t);
  src.stop(t + 0.7);
}
