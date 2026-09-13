/**
 * Full universe search results — every catalogued body (planets, moons,
 * dwarf planets, comets, asteroids), each with its canonical photo,
 * kind badge and parent. Clicking any result opens the complete data
 * sheet (same data as Explore Universe) instead of just flying to it.
 */
import { CATALOG } from '../data/catalog';
import { PhotoThumb } from './SmartPhoto';
import { playHover } from '../utils/audio';

const KIND_ICON = { STAR: '☀️', PLANET: '🪐', MOON: '🌙', 'DWARF PLANET': '🧊', COMET: '☄️', ASTEROID: '🪨' };
const KIND_CLASS = { STAR: 'star', PLANET: 'planet', MOON: 'moon', 'DWARF PLANET': 'dwarf', COMET: 'comet', ASTEROID: 'asteroid' };

export default function SearchResults({ query, onOpenSheet }) {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const results = CATALOG.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.parent || '').toLowerCase().includes(q) ||
      c.kind.toLowerCase().includes(q)
  );
  if (results.length === 0) return null;

  return (
    <div className="results results--universe">
      <div className="results-head">
        {results.length} RESULT{results.length === 1 ? '' : 'S'} IN THE UNIVERSE
      </div>
      <div className="results-list">
        {results.map((entry) => (
          <button
            key={entry.name}
            className="result-row"
            onClick={() => { playHover(); onOpenSheet(entry.name); }}
          >
            <PhotoThumb name={entry.name} />
            <span className="result-info">
              <span className="result-name">{entry.name}</span>
              <span className="result-meta">
                {KIND_ICON[entry.kind]} {entry.kind}
                {entry.parent ? ` · ${entry.parent}` : ''}
              </span>
            </span>
            <span className={`result-kind-badge kind-${KIND_CLASS[entry.kind] || 'planet'}`}>
              {entry.kind === 'STAR' ? 'STAR' : entry.kind === 'PLANET' ? 'PLANET' : entry.kind === 'MOON' ? 'MOON' : entry.kind === 'DWARF PLANET' ? 'DWARF' : entry.kind === 'COMET' ? 'COMET' : 'ASTEROID'}
            </span>
          </button>
        ))}
      </div>
      <div className="results-foot">PRESS ESC TO CLOSE · CLICK FOR FULL DATA SHEET</div>
    </div>
  );
}
