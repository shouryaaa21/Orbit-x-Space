import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { celestialBodies, sunData } from '../data/celestialBodies';
import { EXTENDED_BODIES } from '../data/extendedDatabase';
import { getPlanetTexture, getMoonTexture, getRingTexture, getBumpTexture } from '../utils/textures';
import { playHover, playSelect } from '../utils/audio';
import SmartPhoto from './SmartPhoto';
import { hasPhoto } from '../utils/photos';

/* -------------------------- 3D preview body ------------------------------ */

function PreviewBody({ entry }) {
  const meshRef = useRef();
  const groupRef = useRef();

  const isSphere = !entry.elongated;
  const texture = useMemo(() => {
    if (!isSphere) return null;
    if (entry.kind === 'COMET' || entry.kind === 'MOON' || entry.kind === 'DWARF PLANET' || entry.kind === 'ASTEROID') {
      return getMoonTexture({ name: entry.name, palette: entry.palette });
    }
    const asPlanet = { ...entry, palette: entry.palette };
    return getPlanetTexture(asPlanet);
  }, [entry, isSphere]);

  const bump = useMemo(() => {
    if (!isSphere) return null;
    return getBumpTexture({ name: entry.name, banded: false });
  }, [entry, isSphere]);

  // Comet nucleus: irregular stretched rock
  const cometGeometry = useMemo(() => {
    if (isSphere) return null;
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      v.x *= 1.7; v.y *= 0.8; v.z *= 0.9;
      v.multiplyScalar(0.8 + Math.random() * 0.4);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, [isSphere]);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05);
    if (meshRef.current) meshRef.current.rotation.y += d * 0.25;
    if (groupRef.current) groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
  });

  if (entry.kind === 'COMET' && cometGeometry) {
    return (
      <group ref={groupRef}>
        <mesh ref={meshRef} geometry={cometGeometry}>
          <meshStandardMaterial color={entry.palette?.[1] || entry.color} roughness={0.95} metalness={0.02} />
        </mesh>
        {/* coma glow */}
        <mesh scale={1.8}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial color={entry.color} transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* tail cone */}
        <mesh position={[-3.2, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.9, 5.5, 20, 1, true]} />
          <meshBasicMaterial color="#9ed8ff" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial
          map={texture}
          bumpMap={bump}
          bumpScale={entry.bumpiness > 0.6 ? 0.06 : 0.02}
          color={entry.banded ? '#ffffff' : '#ffffff'}
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>
      {entry.haze && (
        <mesh scale={1.15}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshBasicMaterial color={entry.color} transparent opacity={0.25} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
      {entry.name === 'Saturn' && entry.rings && (
        <mesh rotation={[Math.PI / 2.3, 0, 0]}>
          <ringGeometry args={[1.5, 2.4, 96]} />
          <meshStandardMaterial map={getRingTexture(entry.rings)} transparent side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/* --------------------------- preview lighting ----------------------------- */

function PreviewLighting() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 3, 4]} intensity={2.4} color="#fff2dd" />
      <directionalLight position={[-4, -1, -3]} intensity={0.35} color="#7a9ac8" />
      <Stars radius={40} depth={20} count={900} factor={1.6} saturation={0.05} fade speed={0.3} />
    </>
  );
}

/* ------------------------------ data assembly ----------------------------- */

const ALL_BODIES = [sunData, ...celestialBodies];
const DB_ENTRIES = [
  ...ALL_BODIES.map((b) => ({
    name: b.name,
    kind: b.name === 'Sun' ? 'STAR' : (b.type || '').split(' ')[0] === 'GAS' || (b.type || '').includes('GIANT') ? 'PLANET' : 'PLANET',
    color: b.color,
    palette: b.palette,
    size: b.size,
    bumpiness: b.bumpiness ?? 0.5,
    banded: b.banded,
    rings: b.rings,
    haze: b.atmosphere && b.atmosphereStrength > 0.5,
    elongated: false,
    fact: b.fact,
    deep: b.deep,
    data: null, // comes from researchData at render
    parent: null,
    facts: null,
    isPlanet: true,
  })),
  ...EXTENDED_BODIES.filter((e) => !e.hidden).map((e) => ({ ...e, isPlanet: false })),
];

const KIND_CATS = ['ALL', 'PLANET', 'MOON', 'DWARF PLANET', 'COMET', 'ASTEROID'];

/* ------------------------------ component -------------------------------- */

export default function ExploreUniverse({ onClose, onSelect, onOpenSheet }) {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('ALL');
  const [active, setActive] = useState(DB_ENTRIES[0]);
  const [viewMode, setViewMode] = useState('photo'); // 'photo' | '3d'

  const filtered = useMemo(() => {
    return DB_ENTRIES.filter((b) => {
      const matchKind = kind === 'ALL' || b.kind === kind;
      const q = search.toLowerCase();
      const matchSearch = !q || b.name.toLowerCase().includes(q) || (b.parent || '').toLowerCase().includes(q);
      return matchKind && matchSearch;
    });
  }, [search, kind]);

  const pick = useCallback((entry) => {
    playSelect();
    setActive(entry);
  }, []);

  const goToPlanet = useCallback((entry) => {
    const body = ALL_BODIES.find((b) => b.name === entry.name);
    if (body) {
      playSelect();
      onSelect(body);
    }
  }, [onSelect]);

  const kindIcon = { PLANET: '🪐', MOON: '🌙', 'DWARF PLANET': '⚪', COMET: '☄️', ASTEROID: '🪨', STAR: '☀️' };

  return (
    <div className="explore-overlay" onClick={onClose}>
      <div className="explore-modal explore-modal--db" onClick={(e) => e.stopPropagation()}>
        <div className="explore-header">
          <div>
            <h2 className="explore-title">EXPLORE THE UNIVERSE</h2>
            <p className="explore-subtitle">{DB_ENTRIES.length} catalogued bodies · 3D previews · full research data</p>
          </div>
          <button className="explore-close" onClick={onClose}>×</button>
        </div>

        <div className="explore-toolbar">
          <div className="explore-search">
            ⌕
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bodies, parents…" />
          </div>
          <div className="explore-cats">
            {KIND_CATS.map((k) => (
              <button key={k} className={`explore-cat ${kind === k ? 'is-active' : ''}`} onClick={() => { playHover(); setKind(k); }}>
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="explore-db-layout">
          {/* Left: list */}
          <div className="explore-db-list">
            {filtered.map((entry) => (
              <button
                key={entry.name}
                className={`db-item ${active?.name === entry.name ? 'is-active' : ''}`}
                onClick={() => pick(entry)}
                onMouseEnter={playHover}
              >
                <span className="db-item-orb" style={{ background: entry.color, boxShadow: `0 0 10px ${entry.color}50` }} />
                <span className="db-item-name">{entry.name}</span>
                <span className="db-item-kind">{kindIcon[entry.kind] || '•'} {entry.kind}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="db-empty">No matches.</div>}
          </div>

          {/* Right: 3D preview + details */}
          {active && (
            <div className="explore-db-detail">
              <div className="db-preview">
                <div className="db-view-toggle">
                  <button
                    className={`db-view-btn ${viewMode === 'photo' ? 'is-active' : ''}`}
                    onClick={() => { playHover(); setViewMode('photo'); }}
                  >
                    📷 PHOTO
                  </button>
                  <button
                    className={`db-view-btn ${viewMode === '3d' ? 'is-active' : ''}`}
                    onClick={() => { playHover(); setViewMode('3d'); }}
                  >
                    🌐 3D VIEW
                  </button>
                </div>

                {viewMode === 'photo' ? (
                  <div className="db-photo-pane">
                    <SmartPhoto name={active.name} width={880} caption />
                    {hasPhoto(active.name) && (
                      <div className="db-photo-note">CANONICAL NASA / ESA IMAGERY</div>
                    )}
                  </div>
                ) : (
                  <>
                    <Canvas camera={{ position: [0, 0.9, 3.2], fov: 42 }} dpr={[1, 2]}>
                      <PreviewLighting />
                      <PreviewBody entry={active} />
                      <OrbitControls enablePan={false} enableZoom={true} minDistance={1.6} maxDistance={8} enableDamping dampingFactor={0.08} rotateSpeed={0.6} />
                    </Canvas>
                    <div className="db-preview-hint">DRAG TO ROTATE · SCROLL TO ZOOM</div>
                  </>
                )}
              </div>

              <div className="db-detail-info">
                <div className="db-detail-kind">{kindIcon[active.kind]} {active.kind}{active.parent ? ` · ${active.parent}` : ''}</div>
                <h3 className="db-detail-name">{active.name}</h3>
                <p className="db-detail-fact">{active.fact}</p>

                {active.deep && <p className="db-detail-deep">{active.deep}</p>}

                {active.data && (
                  <div className="db-detail-grid">
                    {Object.entries(active.data).map(([k, v]) => (
                      <div key={k} className="prop-row">
                        <span className="prop-label">{k}</span>
                        <span className="prop-value">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {active.facts && (
                  <div className="db-facts">
                    <div className="db-facts-title">DID YOU KNOW</div>
                    {active.facts.map((f, i) => (
                      <div key={i} className="db-fact-row">▸ {f}</div>
                    ))}
                  </div>
                )}

                {onOpenSheet && (
                  <button className="db-sheet-btn" onClick={() => { playSelect(); onOpenSheet(active.name); }}>
                    📋 OPEN FULL DATA SHEET
                  </button>
                )}

                {active.isPlanet && (
                  <button className="db-goto-btn" onClick={() => goToPlanet(active)}>
                    🛰️ FLY TO {active.name.toUpperCase()} IN 3D SYSTEM →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
