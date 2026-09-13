import { useState } from 'react';
import { researchData } from '../data/researchDatabase';
import { getElementSummary } from '../utils/orbitalMechanics';
import { playHover } from '../utils/audio';

const TABS = ['OVERVIEW', 'PHYSICS', 'ORBIT', 'ATMOSPHERE', 'MISSIONS'];

function Section({ title, children }) {
  return (
    <div className="info-section">
      <div className="info-section-title">{title}</div>
      {children}
    </div>
  );
}

function PropRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="prop-row">
      <span className="prop-label">{label}</span>
      <span className="prop-value">{value}</span>
    </div>
  );
}

function MissionCard({ mission }) {
  return (
    <div className="mission-card">
      <div className="mission-header">
        <span className="mission-name">{mission.name}</span>
        <span className={`mission-status ${mission.status === 'Active' ? 'active' : ''}`}>
          {mission.status}
        </span>
      </div>
      <div className="mission-meta">
        {mission.agency} · {mission.year}
      </div>
      <div className="mission-detail">{mission.detail}</div>
    </div>
  );
}

export default function InfoPanel({ body, simJD, onClose }) {
  const [tab, setTab] = useState('OVERVIEW');
  const data = researchData[body.name];
  const orbitalSummary = getElementSummary(body.name, simJD);

  return (
    <aside className="panel" key={body.name}>
      <button className="close" onClick={onClose} aria-label="Close">×</button>

      <div className="kicker">{data?.category || body.type}</div>
      <h2>{body.name}</h2>
      <p className="panel-fact">{body.fact}</p>

      {/* Tab navigation */}
      <div className="panel-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`panel-tab ${tab === t ? 'is-active' : ''}`}
            onClick={() => { playHover(); setTab(t); }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="panel-content">
        {tab === 'OVERVIEW' && (
          <>
            {data?.origin && (
              <Section title="NAME ORIGIN">
                <p className="info-text">{data.origin}</p>
              </Section>
            )}
            {data?.physical && (
              <Section title="KEY PROPERTIES">
                <div className="prop-grid">
                  <PropRow label="MASS" value={data.physical.mass} />
                  <PropRow label="RADIUS" value={data.physical.equatorialRadius} />
                  <PropRow label="DENSITY" value={data.physical.meanDensity} />
                  <PropRow label="GRAVITY" value={data.physical.surfaceGravity} />
                  <PropRow label="ESCAPE V" value={data.physical.escapeVelocity} />
                  <PropRow label="MOONS" value={data.surface?.moons} />
                </div>
              </Section>
            )}
            {body.deep && (
              <Section title="DEEP DIVE">
                <p className="info-text">{body.deep}</p>
              </Section>
            )}
          </>
        )}

        {tab === 'PHYSICS' && data?.physical && (
          <>
            <Section title="PHYSICAL PROPERTIES">
              <div className="prop-grid">
                {Object.entries(data.physical).map(([k, v]) => (
                  <PropRow key={k} label={k.replace(/([A-Z])/g, ' $1').toUpperCase()} value={v} />
                ))}
              </div>
            </Section>
            {data.thermal && (
              <Section title="THERMAL">
                <div className="prop-grid">
                  {Object.entries(data.thermal).map(([k, v]) => (
                    <PropRow key={k} label={k.replace(/([A-Z])/g, ' $1').toUpperCase()} value={v} />
                  ))}
                </div>
              </Section>
            )}
            {data.surface && (
              <Section title="SURFACE & INTERIOR">
                <div className="prop-grid">
                  {Object.entries(data.surface).filter(([k]) => k !== 'moons' && k !== 'rings').map(([k, v]) => (
                    <PropRow key={k} label={k.replace(/([A-Z])/g, ' $1').toUpperCase()} value={typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v} />
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        {tab === 'ORBIT' && (
          <>
            {orbitalSummary && (
              <Section title="LIVE ORBITAL ELEMENTS">
                <div className="prop-grid">
                  <PropRow label="SEMI-MAJOR AXIS" value={`${orbitalSummary.semiMajorAxis.toFixed(4)} AU`} />
                  <PropRow label="ECCENTRICITY" value={orbitalSummary.eccentricity.toFixed(6)} />
                  <PropRow label="INCLINATION" value={`${orbitalSummary.inclination.toFixed(4)}°`} />
                  <PropRow label="LONG. ASC. NODE" value={`${orbitalSummary.longitudeNode.toFixed(4)}°`} />
                  <PropRow label="ARG. PERIHELION" value={`${orbitalSummary.argumentPerihelion.toFixed(4)}°`} />
                  <PropRow label="PERIOD" value={`${orbitalSummary.period.toFixed(3)} yr`} />
                  <PropRow label="ORBITAL VELOCITY" value={`${orbitalSummary.orbitalVelocity.toFixed(2)} km/s`} />
                  <PropRow label="DIST. FROM SUN" value={`${orbitalSummary.distance.toFixed(4)} AU`} />
                </div>
              </Section>
            )}
            {data?.orbital && (
              <Section title="ORBITAL PARAMETERS">
                <div className="prop-grid">
                  {Object.entries(data.orbital).map(([k, v]) => (
                    <PropRow key={k} label={k.replace(/([A-Z])/g, ' $1').toUpperCase()} value={v} />
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        {tab === 'ATMOSPHERE' && (
          <Section title="ATMOSPHERE">
            {data?.atmosphere ? (
              <div className="prop-grid">
                {Object.entries(data.atmosphere).map(([k, v]) => (
                  <PropRow key={k} label={k.replace(/([A-Z])/g, ' $1').toUpperCase()} value={v} />
                ))}
              </div>
            ) : (
              <p className="info-text">No substantial atmosphere.</p>
            )}
          </Section>
        )}

        {tab === 'MISSIONS' && (
          <Section title="MISSIONS & EXPLORATION">
            {data?.missions?.length > 0 ? (
              <div className="missions-list">
                {data.missions.map((m) => (
                  <MissionCard key={m.name} mission={m} />
                ))}
              </div>
            ) : (
              <p className="info-text">No dedicated missions yet.</p>
            )}
          </Section>
        )}
      </div>
    </aside>
  );
}
