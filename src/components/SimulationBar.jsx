import { useEffect, useRef, useState } from 'react';
import { jdToDateStr, dateToJD } from '../utils/orbitalMechanics';
import { simClock, advanceClock, setPaused, setDaysPerSec, setJD, jumpDelta, subscribe } from '../utils/simClock';
import { playHover } from '../utils/audio';

const SPEED_PRESETS = [
  { label: '1d/s', daysPerSec: 1 },
  { label: '7d/s', daysPerSec: 7 },
  { label: '30d/s', daysPerSec: 30 },
  { label: '1yr/s', daysPerSec: 365.25 },
  { label: '10yr/s', daysPerSec: 3652.5 },
];

/**
 * Owns the single rAF loop that advances the global simClock.
 * The date readout re-renders only on clock notifications (~4Hz),
 * while the 3D scene reads simClock.jd directly every frame.
 */
export default function SimulationBar({ paused, speedIdx = 1, onSpeedChange, onTogglePause }) {
  const [displayJD, setDisplayJD] = useState(simClock.jd);
  const rafRef = useRef(null);
  const lastRef = useRef(performance.now());

  // Mirror UI state into the clock
  setPaused(paused);
  setDaysPerSec(SPEED_PRESETS[speedIdx].daysPerSec);

  useEffect(() => subscribe(setDisplayJD), []);

  useEffect(() => {
    lastRef.current = performance.now();
    const tick = (now) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      advanceClock(dt);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div className="sim-bar">
      <div className="sim-date">
        <span className="sim-label">SIMULATION DATE</span>
        <span className="sim-jd">{jdToDateStr(displayJD)}</span>
      </div>

      <div className="sim-controls">
        <button className="sim-btn" onClick={() => jumpDelta(-365.25)} onMouseEnter={playHover} title="Back 1 year">◀◀</button>

        <button className={`sim-btn play-btn ${paused ? 'is-paused' : ''}`} onClick={onTogglePause} onMouseEnter={playHover} title="Space to toggle">
          {paused ? '▶' : '⏸'}
        </button>

        <button className="sim-btn speed-btn" onClick={() => { playHover(); onSpeedChange((i) => (i + 1) % SPEED_PRESETS.length); }} onMouseEnter={playHover} title="← → to change speed">
          {SPEED_PRESETS[speedIdx].label}
        </button>

        <button className="sim-btn" onClick={() => jumpDelta(365.25)} onMouseEnter={playHover} title="Forward 1 year">▶▶</button>
      </div>

      <button className="sim-btn today-btn" onClick={() => { playHover(); setJD(dateToJD(new Date())); }} onMouseEnter={playHover}>
        TODAY
      </button>
    </div>
  );
}
