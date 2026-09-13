import { useState, useEffect } from 'react';

const BOOT_LINES = [
  'INITIALIZING DEEP-FIELD RENDERER…',
  'GENERATING PROCEDURAL PLANETARY SURFACES…',
  'CALIBRATING ORBITAL MECHANICS…',
  'SYNCING EPHEMERIS DATA…',
  'CHARGING PHOTON CANNONS… JUST KIDDING.',
  'ORBIT ONLINE.',
];

const BOOT_INTERVAL = 520;

/** Cinematic boot sequence + texture preloading progress. */
export default function Intro({ progress = 0, onComplete }) {
  const [lines, setLines] = useState([]);
  const [exiting, setExiting] = useState(false);
  const [ready, setReady] = useState(false);

  const shown = Math.round((ready ? 1 : 0.7) * (progress < 1 ? 0.7 + progress * 0.3 : 1) * 100);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setLines(BOOT_LINES.slice(0, i));
      if (i >= BOOT_LINES.length) {
        clearInterval(timer);
        setReady(true);
      }
    }, BOOT_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (ready && progress >= 1) {
      const t = setTimeout(() => {
        setExiting(true);
        setTimeout(onComplete, 950);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [ready, progress, onComplete]);

  return (
    <div className={`intro ${exiting ? 'is-exiting' : ''}`}>
      <div className="intro-inner">
        <div className="intro-mark">
          <span className="intro-dot" />
          ORBIT
        </div>
        <div className="intro-sub">DEEP-FIELD EXPLORER · v3.0</div>

        <div className="intro-lines">
          {lines.map((line, i) => (
            <div key={i} className="intro-line" style={{ animationDelay: `${i * 40}ms` }}>
              <span className="intro-caret">▸</span> {line}
            </div>
          ))}
        </div>

        <div className="intro-bar">
          <div className="intro-bar-fill" style={{ width: `${shown}%` }} />
        </div>
        <div className="intro-pct">{shown}%</div>
      </div>

      <div className="intro-planet" />
    </div>
  );
}
