import { playHover } from '../utils/audio';

const VIEW_PRESETS = [
  { label: '🌍 OVERVIEW', pos: [0, 12, 30], target: [0, 0, 0] },
  { label: '☀️ INNER', pos: [3, 4, 8], target: [0, 0, 0] },
  { label: '🪐 OUTER', pos: [0, 25, 50], target: [0, 0, 0] },
  { label: '⬆️ TOP DOWN', pos: [0, 60, 0.1], target: [0, 0, 0] },
  { label: '↔️ EDGE ON', pos: [50, 0.5, 0.1], target: [0, 0, 0] },
];

export default function ControlsBar({ toggles, onToggle, onViewPreset }) {
  const toggleBtns = [
    { key: 'orbits', icon: '◎', label: 'Orbits' },
    { key: 'labels', icon: 'Aa', label: 'Labels' },
    { key: 'atmosphere', icon: '◌', label: 'Atmo' },
    { key: 'belts', icon: '∘', label: 'Belts' },
    { key: 'comets', icon: '☄', label: 'Comets' },
  ];

  return (
    <div className="controls-bar">
      <div className="controls-group">
        {toggleBtns.map(({ key, icon, label }) => (
          <button
            key={key}
            className={`ctrl-btn ${toggles[key] ? 'is-on' : ''}`}
            title={label}
            onClick={() => { playHover(); onToggle(key); }}
          >
            <span className="ctrl-icon">{icon}</span>
            <span className="ctrl-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="controls-divider" />

      <div className="controls-group">
        {VIEW_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="ctrl-btn view-btn"
            title={preset.label}
            onClick={() => { playHover(); onViewPreset(preset); }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
