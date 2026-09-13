import { useEffect } from 'react';
import { researchData } from '../data/researchDatabase';
import { CATALOG_BY_NAME } from '../data/catalog';
import { getElementSummary } from '../utils/orbitalMechanics';
import { simClock, subscribe } from '../utils/simClock';
import { useState } from 'react';
import { playSelect } from '../utils/audio';
import SmartPhoto from './SmartPhoto';

const KIND_LABEL = { STAR: 'STAR', PLANET: 'PLANET', MOON: 'MOON', 'DWARF PLANET': 'DWARF PLANET', COMET: 'COMET', ASTEROID: 'ASTEROID' };

function PropRow({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="prop-row">
      <span className="prop-label">{label}</span>
      <span className="prop-value">{value}</span>
    </div>
  );
}

function DataGrid({ title, obj }) {
  if (!obj || (typeof obj === 'object' && Object.keys(obj).length === 0)) return null;
  const entries = Object.entries(obj);
  if (entries.length === 0) return null;
  return (
    <div className="sheet-section">
      <div className="sheet-section-title">{title}</div>
      <div className="prop-grid">
        {entries.map(([k, v]) => (
          <PropRow key={k} label={typeof k === 'string' ? k.replace(/_/g, ' ') : k} value={typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v} />
        ))}
      </div>
    </div>
  );
}

/**
 * BodySheet — the complete, unified data sheet for any catalogued body.
 * Opened from search results or Explore Universe; shows the canonical
 * NASA photo, all structured data, research data (for planets), and
 * curated facts. Includes a live 3D system fly-to for scene bodies.
 */
export default function BodySheet({ bodyName, onClose, onFlyTo }) {
  const [jd, setJd] = useState(simClock.jd);
  useEffect(() => subscribe(setJd), []);

  const entry = CATALOG_BY_NAME[bodyName];
  useEffect(() => {
    if (!entry && onClose) onClose();
  }, [entry, onClose]);

  if (!entry) return null;

  const research = researchData[bodyName] || null;
  const liveOrbit = researchData[bodyName] ? getElementSummary(bodyName, jd) : null;
  const isSceneBody = entry.isPlanet;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Close">×</button>

        <div className="sheet-hero">
          <SmartPhoto name={bodyName} className="sheet-photo" width={720} caption />
          <div className="sheet-hero-info">
            <div className="sheet-kind">
              <span className={`result-kind-badge kind-${(entry.kind || 'planet').toLowerCase().replace(' ', '-')}`}>
                {KIND_LABEL[entry.kind] || entry.kind}
              </span>
              {entry.parent && <span className="sheet-parent">· ORBITING {entry.parent.toUpperCase()}</span>}
            </div>
            <h2 className="sheet-name">{entry.name}</h2>
            <p className="sheet-fact">{entry.fact}</p>
          </div>
        </div>

        <div className="sheet-body">
          {entry.deep && (
            <div className="sheet-section">
              <div className="sheet-section-title">DEEP DIVE</div>
              <p className="info-text">{entry.deep}</p>
            </div>
          )}

          {research?.origin && (
            <div className="sheet-section">
              <div className="sheet-section-title">NAME ORIGIN</div>
              <p className="info-text">{research.origin}</p>
            </div>
          )}

          {/* Planets: full research database sections */}
          {research?.physical && <DataGrid title="PHYSICAL PROPERTIES" obj={research.physical} />}
          {research?.thermal && <DataGrid title="THERMAL" obj={research.thermal} />}
          {research?.surface && (
            <DataGrid
              title="SURFACE & INTERIOR"
              obj={Object.fromEntries(Object.entries(research.surface).filter(([k]) => k !== 'moons' && k !== 'rings'))}
            />
          )}
          {research?.surface?.moons && <DataGrid title="SATELLITES" obj={{ MOONS: research.surface.moons }} />}
          {research?.surface?.rings && <DataGrid title="RING SYSTEM" obj={{ RINGS: research.surface.rings }} />}
          {research?.atmosphere && <DataGrid title="ATMOSPHERE" obj={research.atmosphere} />}
          {research?.orbital && <DataGrid title="ORBITAL PARAMETERS" obj={research.orbital} />}

          {/* Non-planets: extended database grid */}
          {entry.data && (
            <div className="sheet-section">
              <div className="sheet-section-title">DATA</div>
              <div className="prop-grid">
                {Object.entries(entry.data).map(([k, v]) => (
                  <PropRow key={k} label={k} value={v} />
                ))}
              </div>
            </div>
          )}

          {/* Live orbital elements for real planets */}
          {liveOrbit && (
            <div className="sheet-section">
              <div className="sheet-section-title">LIVE ORBITAL ELEMENTS · {new Date().toISOString().slice(0, 10)}</div>
              <div className="prop-grid">
                <PropRow label="SEMI-MAJOR AXIS" value={`${liveOrbit.semiMajorAxis.toFixed(4)} AU`} />
                <PropRow label="ECCENTRICITY" value={liveOrbit.eccentricity.toFixed(6)} />
                <PropRow label="INCLINATION" value={`${liveOrbit.inclination.toFixed(4)}°`} />
                <PropRow label="LONG. ASC. NODE" value={`${liveOrbit.longitudeNode.toFixed(4)}°`} />
                <PropRow label="ARG. PERIHELION" value={`${liveOrbit.argumentPerihelion.toFixed(4)}°`} />
                <PropRow label="PERIOD" value={`${liveOrbit.period.toFixed(3)} yr`} />
                <PropRow label="ORBITAL VELOCITY" value={`${liveOrbit.orbitalVelocity.toFixed(2)} km/s`} />
                <PropRow label="DIST. FROM SUN" value={`${liveOrbit.distance.toFixed(4)} AU`} />
              </div>
            </div>
          )}

          {/* Missions for planets */}
          {research?.missions?.length > 0 && (
            <div className="sheet-section">
              <div className="sheet-section-title">MISSIONS &amp; EXPLORATION</div>
              <div className="missions-list">
                {research.missions.map((m) => (
                  <div key={m.name} className="mission-card">
                    <div className="mission-header">
                      <span className="mission-name">{m.name}</span>
                      <span className={`mission-status ${m.status === 'Active' ? 'active' : ''}`}>{m.status}</span>
                    </div>
                    <div className="mission-meta">{m.agency} · {m.year}</div>
                    <div className="mission-detail">{m.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entry.facts?.length > 0 && (
            <div className="sheet-section">
              <div className="sheet-section-title">DID YOU KNOW</div>
              {entry.facts.map((f, i) => (
                <div key={i} className="db-fact-row">▸ {f}</div>
              ))}
            </div>
          )}

          {isSceneBody && onFlyTo && (
            <button
              className="db-goto-btn sheet-fly-btn"
              onClick={() => { playSelect(); onFlyTo(bodyName); }}
            >
              🛰️ FLY TO {entry.name.toUpperCase()} IN 3D SYSTEM →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
