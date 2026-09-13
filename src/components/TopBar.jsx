import { useEffect, useState } from 'react';
import { isMuted, setMuted, playHover } from '../utils/audio';

function MissionClock() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return <span className="clock">T+ {mm}:{ss}</span>;
}

const SHORTCUTS = [
  { key: 'E', action: 'Explore Universe' },
  { key: 'SPACE', action: 'Pause / Play' },
  { key: 'ESC', action: 'Close panel / Deselect' },
  { key: '← →', action: 'Change speed' },
  { key: 'O', action: 'Toggle orbits' },
  { key: 'L', action: 'Toggle labels' },
  { key: 'B', action: 'Toggle belts' },
  { key: 'A', action: 'Toggle atmosphere' },
];

export default function TopBar({ query, onQueryChange, muted, onToggleMute, onExplore }) {
  const [showHelp, setShowHelp] = useState(false);
  const localMuted = muted ?? isMuted();

  return (
    <header className="top">
      <div className="brand">
        <i />
        ORBIT <small>SPACE EXPLORER</small>
        <MissionClock />
      </div>

      <div className="search">
        ⌕
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search celestial bodies…"
        />
      </div>

      <div className="top-actions">
        <button
          className="icon-btn explore-btn"
          onMouseEnter={playHover}
          onClick={onExplore}
          title="Explore Universe (E)"
        >
          🔭
        </button>

        <button
          className="icon-btn"
          onMouseEnter={playHover}
          onClick={() => { playHover(); setShowHelp((h) => !h); }}
          title="Keyboard shortcuts"
        >
          ?
        </button>

        <button
          className="icon-btn"
          onMouseEnter={playHover}
          onClick={onToggleMute}
          title={localMuted ? 'Unmute ambience' : 'Mute ambience'}
        >
          {localMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {showHelp && (
        <div className="help-popup" onClick={(e) => e.stopPropagation()}>
          <div className="help-title">KEYBOARD SHORTCUTS</div>
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="help-row">
              <kbd>{s.key}</kbd>
              <span>{s.action}</span>
            </div>
          ))}
          <button className="help-close" onClick={() => setShowHelp(false)}>CLOSE</button>
        </div>
      )}
    </header>
  );
}
