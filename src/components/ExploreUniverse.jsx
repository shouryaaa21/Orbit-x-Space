import { useState, useMemo } from 'react';
import { celestialBodies, sunData } from '../data/celestialBodies';
import { researchData } from '../data/researchDatabase';
import { playHover, playSelect } from '../utils/audio';

const ALL = [sunData, ...celestialBodies];

const CATEGORIES = ['ALL', 'TERRESTRIAL', 'GAS GIANT', 'ICE GIANT', 'DWARF'];

function filterByCategory(body, cat) {
  if (cat === 'ALL') return true;
  if (cat === 'TERRESTRIAL') return body.type?.includes('TERRESTRIAL');
  if (cat === 'GAS GIANT') return body.type?.includes('GAS GIANT');
  if (cat === 'ICE GIANT') return body.type?.includes('ICE GIANT');
  if (cat === 'DWARF') return body.type?.includes('DWARF');
  return true;
}

function BodyCard({ body, onSelect, isComparing, onCompare }) {
  const data = researchData[body.name];
  const physical = data?.physical;
  const orbital = data?.orbital;

  return (
    <div className={`explore-card ${isComparing ? 'is-comparing' : ''}`} onClick={() => { playSelect(); onSelect(body); }}>
      <div className="explore-card-header">
        <div className="explore-card-orb" style={{ background: body.color, boxShadow: `0 0 20px ${body.color}40` }} />
        <div>
          <div className="explore-card-name">{body.name}</div>
          <div className="explore-card-type">{data?.category || body.type}</div>
        </div>
      </div>

      <div className="explore-card-stats">
        {physical?.equatorialRadius && (
          <div className="explore-stat"><span>RADIUS</span><strong>{physical.equatorialRadius}</strong></div>
        )}
        {physical?.mass && (
          <div className="explore-stat"><span>MASS</span><strong>{physical.mass.split('(')[0].trim()}</strong></div>
        )}
        {physical?.surfaceGravity && (
          <div className="explore-stat"><span>GRAVITY</span><strong>{physical.surfaceGravity}</strong></div>
        )}
        {orbital?.orbitalPeriod && (
          <div className="explore-stat"><span>PERIOD</span><strong>{orbital.orbitalPeriod}</strong></div>
        )}
        {orbital?.orbitalVelocity && (
          <div className="explore-stat"><span>VELOCITY</span><strong>{orbital.orbitalVelocity}</strong></div>
        )}
        {data?.atmosphere?.composition && (
          <div className="explore-stat"><span>ATMOSPHERE</span><strong>{data.atmosphere.composition.split(',')[0]}</strong></div>
        )}
        {data?.surface?.moons !== undefined && (
          <div className="explore-stat"><span>MOONS</span><strong>{data.surface.moons}</strong></div>
        )}
        {data?.surface?.rings !== undefined && (
          <div className="explore-stat"><span>RINGS</span><strong>{data.surface.rings ? 'Yes' : 'No'}</strong></div>
        )}
      </div>

      {body.deep && <div className="explore-card-deep">{body.deep}</div>}

      {data?.missions?.length > 0 && (
        <div className="explore-card-missions">
          <span className="explore-missions-label">MISSIONS</span>
          <div className="explore-missions-list">
            {data.missions.slice(0, 3).map((m) => (
              <span key={m.name} className="explore-mission-chip">
                {m.name} <small>{m.year}</small>
              </span>
            ))}
            {data.missions.length > 3 && <span className="explore-mission-chip more">+{data.missions.length - 3}</span>}
          </div>
        </div>
      )}

      <button
        className="explore-card-btn"
        onClick={(e) => { e.stopPropagation(); playHover(); onCompare(body.name); }}
      >
        {isComparing ? '✓ COMPARE' : 'COMPARE'}
      </button>
    </div>
  );
}

function CompareView({ names }) {
  if (names.length < 2) return <div className="compare-hint">Select 2+ bodies to compare</div>;
  const bodies = names.map((n) => ALL.find((b) => b.name === n)).filter(Boolean);

  return (
    <div className="compare-table">
      <div className="compare-header">
        <div className="compare-label">PROPERTY</div>
        {bodies.map((b) => (
          <div key={b.name} className="compare-col" style={{ color: b.color }}>{b.name}</div>
        ))}
      </div>
      {[
        { label: 'Type', get: (b) => researchData[b.name]?.category || b.type },
        { label: 'Radius', get: (b) => researchData[b.name]?.physical?.equatorialRadius },
        { label: 'Mass', get: (b) => researchData[b.name]?.physical?.mass?.split('(')[0].trim() },
        { label: 'Density', get: (b) => researchData[b.name]?.physical?.meanDensity },
        { label: 'Gravity', get: (b) => researchData[b.name]?.physical?.surfaceGravity },
        { label: 'Escape V.', get: (b) => researchData[b.name]?.physical?.escapeVelocity },
        { label: 'Orbital Period', get: (b) => researchData[b.name]?.orbital?.orbitalPeriod },
        { label: 'Rotation', get: (b) => researchData[b.name]?.orbital?.rotationPeriod },
        { label: 'Axial Tilt', get: (b) => researchData[b.name]?.orbital?.axialTilt },
        { label: 'Temperature', get: (b) => researchData[b.name]?.thermal?.meanSurface || researchData[b.name]?.thermal?.cloudTop },
        { label: 'Atmosphere', get: (b) => researchData[b.name]?.atmosphere?.composition?.split(',')[0] },
        { label: 'Moons', get: (b) => String(researchData[b.name]?.surface?.moons ?? '—') },
        { label: 'Rings', get: (b) => researchData[b.name]?.surface?.rings ? 'Yes' : 'No' },
        { label: 'Missions', get: (b) => String(researchData[b.name]?.missions?.length ?? 0) },
      ].map((row) => (
        <div key={row.label} className="compare-row">
          <div className="compare-label">{row.label}</div>
          {bodies.map((b) => (
            <div key={b.name} className="compare-col">{row.get(b) || '—'}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ExploreUniverse({ onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [view, setView] = useState('grid'); // 'grid' or 'compare'

  const filtered = useMemo(() => {
    return ALL.filter((b) => {
      const matchCat = filterByCategory(b, category);
      const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const toggleCompare = (name) => {
    playHover();
    setCompareList((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="explore-overlay" onClick={onClose}>
      <div className="explore-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="explore-header">
          <div>
            <h2 className="explore-title">EXPLORE THE UNIVERSE</h2>
            <p className="explore-subtitle">{ALL.length} celestial bodies · comprehensive research database</p>
          </div>
          <button className="explore-close" onClick={onClose}>×</button>
        </div>

        {/* Toolbar */}
        <div className="explore-toolbar">
          <div className="explore-search">
            ⌕
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bodies…"
            />
          </div>

          <div className="explore-cats">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`explore-cat ${category === c ? 'is-active' : ''}`}
                onClick={() => { playHover(); setCategory(c); }}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="explore-view-toggle">
            <button
              className={`explore-view-btn ${view === 'grid' ? 'is-active' : ''}`}
              onClick={() => setView('grid')}
            >
              GRID
            </button>
            <button
              className={`explore-view-btn ${view === 'compare' ? 'is-active' : ''}`}
              onClick={() => setView('compare')}
            >
              COMPARE ({compareList.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="explore-content">
          {view === 'grid' ? (
            <div className="explore-grid">
              {filtered.map((body) => (
                <BodyCard
                  key={body.name}
                  body={body}
                  onSelect={onSelect}
                  isComparing={compareList.includes(body.name)}
                  onCompare={toggleCompare}
                />
              ))}
            </div>
          ) : (
            <CompareView names={compareList} />
          )}
        </div>
      </div>
    </div>
  );
}
