/**
 * Global simulation clock — single source of truth for simulation time.
 * Lives outside React so planets read fresh JD every frame without re-renders.
 * UI (date readout) syncs at 4Hz via subscribe.
 */

const DAY_MS = 86400000;

const listeners = new Set();
let lastNotify = 0;

export const simClock = {
  jd: dateToJDEstimate(new Date()),
  paused: false,
  daysPerSec: 7,
};

function dateToJDEstimate(d) {
  return 2440587.5 + d.getTime() / DAY_MS;
}

/** Advance the clock; called from a single rAF loop. */
export function advanceClock(dtSeconds) {
  if (!simClock.paused && dtSeconds > 0 && dtSeconds < 0.5) {
    simClock.jd += simClock.daysPerSec * dtSeconds;
  }
  const now = performance.now();
  if (now - lastNotify > 250) {
    lastNotify = now;
    listeners.forEach((fn) => fn(simClock.jd));
  }
}

export function setPaused(p) {
  simClock.paused = p;
}

export function setDaysPerSec(d) {
  simClock.daysPerSec = d;
}

export function setJD(jd) {
  simClock.jd = jd;
  listeners.forEach((fn) => fn(simClock.jd));
}

export function jumpDelta(days) {
  simClock.jd += days;
  listeners.forEach((fn) => fn(simClock.jd));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
