import { useEffect, useRef, useCallback } from 'react';
import { jdToDateStr, dateToJD } from '../utils/orbitalMechanics';
import { playHover } from '../utils/audio';

const SPEED_PRESETS = [
  { label: '1d/s', daysPerSec: 1 },
  { label: '7d/s', daysPerSec: 7 },
  { label: '30d/s', daysPerSec: 30 },
  { label: '1yr/s', daysPerSec: 365.25 },
  { label: '10yr/s', daysPerSec: 3652.5 },
];

// Simulation state advanced at 10Hz inside a ref; React state syncs
// at the same cadence. Planets read JD through closure so it's always
// fresh without 60fps full-tree re-renders.
export default function SimulationBar({ simJD, onJDChange, paused, onTogglePause, speedIdx = 1, onSpeedChange }) {
  const lastTick = useRef(performance.now());
  const rafRef = useRef(null);
  const accRef = useRef(0);
  const pausedRef = useRef(paused);
  const speedRef = useRef(SPEED_PRESETS[speedIdx].daysPerSec);

  pausedRef.current = paused;
  speedRef.current = SPEED_PRESETS[speedIdx].daysPerSec;

  useEffect(() => {
    lastTick.current = performance.now();
    accRef.current = 0;

    const tick = (now) => {
      const dt = (now - lastTick.current) / 1000;
      lastTick.current = now;
      if (dt > 0 && dt < 0.5) accRef.current += dt;

      // Apply accumulated time at ~10Hz
      if (accRef.current >= 0.1) {
        const advance = accRef.current * speedRef.current;
        accRef.current = 0;
        if (!pausedRef.current && advance > 0) {
          onJDChange((prev) => prev + advance);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [onJDChange]);

  const cycleSpeed = useCallback(() => {
    playHover();
    onSpeedChange((i) => (i + 1) % SPEED_PRESETS.length);
  }, [onSpeedChange]);

  const jumpToToday = useCallback(() => {
    playHover();
    onJDChange(dateToJD(new Date()));
  }, [onJDChange]);

  return (
    <div className="sim-bar">
      <div className="sim-date">
        <span className="sim-label">SIMULATION DATE</span>
        <span className="sim-jd">{jdToDateStr(simJD)}</span>
      </div>

      <div className="sim-controls">
        <button className="sim-btn" onClick={() => onJDChange((j) => j - 365.25)} onMouseEnter={playHover} title="Jump back 1 year">
          ◀◀
        </button>

        <button className={`sim-btn play-btn ${paused ? 'is-paused' : ''}`} onClick={onTogglePause} onMouseEnter={playHover} title="Space to toggle">
          {paused ? '▶' : '⏸'}
        </button>

        <button className="sim-btn speed-btn" onClick={cycleSpeed} onMouseEnter={playHover} title="← → to change speed">
          {SPEED_PRESETS[speedIdx].label}
        </button>

        <button className="sim-btn" onClick={() => onJDChange((j) => j + 365.25)} onMouseEnter={playHover} title="Jump forward 1 year">
          ▶▶
        </button>
      </div>

      <button className="sim-btn today-btn" onClick={jumpToToday} onMouseEnter={playHover}>
        TODAY
      </button>
    </div>
  );
}
