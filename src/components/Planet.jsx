import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getPlanetTexture, getCloudTexture, getMoonTexture, getRingTexture, getBumpTexture, getNightLightsTexture } from '../utils/textures';
import { getHeliocentricEcliptic, compressEcliptic } from '../utils/orbitalMechanics';
import { simClock } from '../utils/simClock';
import { setBodyPosition } from '../utils/positions';
import { playHover } from '../utils/audio';

/* ----------------------------- moons ------------------------------------- */

function Moon({ moon, parentBodyName, index, onSelect }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const angleRef = useRef(index * 2.399963);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    // Frame-rate independent orbit + tumble
    angleRef.current += d * moon.speed * 0.35;
    const t = angleRef.current;
    const dist = moon.distance;
    groupRef.current.position.set(
      Math.cos(t) * dist,
      Math.sin(t * 1.3 + index) * 0.08,
      Math.sin(t) * dist
    );
    meshRef.current.rotation.y += d * 0.12;
  });

  const texture = useMemo(() => getMoonTexture(moon), [moon]);

  const handleClick = useCallback((event) => {
    event.stopPropagation();
    playHover();
    onSelect({
      name: moon.name,
      type: `MOON OF ${parentBodyName.toUpperCase()}`,
      color: moon.color,
      size: moon.size,
      fact: `${moon.name} orbits ${parentBodyName}.`,
      deep: `A natural satellite of ${parentBodyName}. Select it here in the 3D view to see it up close — full research data is available in the Explore Universe database (press E).`,
      stats: [
        { label: 'PARENT', value: parentBodyName },
        { label: 'REL SIZE', value: `${(moon.size * 100).toFixed(0)}` },
      ],
      moons: [],
    });
  }, [moon, parentBodyName, onSelect]);

  return (
    <group ref={groupRef} onClick={handleClick} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[moon.size, 48, 48]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.92}
          metalness={0.02}
          emissive={hovered ? moon.color : '#000000'}
          emissiveIntensity={hovered ? 0.35 : 0}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={14} position={[0, moon.size + 0.15, 0]} center>
          <div className="planet-tag moon-tag">{moon.name}</div>
        </Html>
      )}
    </group>
  );
}

/* ----------------------------- planet ------------------------------------ */

function getMaterialProps(body) {
  if (body.banded) return { roughness: 0.42, metalness: 0.05, emissiveIntensity: 0.02 };
  if (body.name === 'Earth') return { roughness: 0.7, metalness: 0.02, emissiveIntensity: 0.0 };
  return { roughness: 0.88, metalness: 0.04, emissiveIntensity: 0.0 };
}

// Rotation periods (hours) — real values drive spin speed via simClock
const ROTATION_HOURS = {
  Mercury: 1407.6, Venus: -5832.5, Earth: 23.93, Mars: 24.62,
  Jupiter: 9.93, Saturn: 10.66, Uranus: -17.24, Neptune: 16.11, Pluto: -153.3,
};

export default function Planet({ body, selected, hovered, onSelect, onHover, index, showLabels, showAtmosphere }) {
  const groupRef = useRef();
  const spinRef = useRef();
  const cloudRef = useRef();
  const [localHover, setLocalHover] = useState(false);

  const surface = useMemo(() => getPlanetTexture(body), [body]);
  const clouds = useMemo(() => (body.clouds ? getCloudTexture(body) : null), [body]);
  const rings = useMemo(() => (body.rings ? getRingTexture(body.rings) : null), [body]);
  const bump = useMemo(() => getBumpTexture(body), [body]);
  const nightLights = useMemo(() => (body.name === 'Earth' ? getNightLightsTexture() : null), [body]);
  const matProps = useMemo(() => getMaterialProps(body), [body]);
  const isEarth = body.name === 'Earth';

  // Base spin rate: real rotation period scaled so Earth = 0.05 rad/s at 1 day/s
  const spinRate = useMemo(() => {
    const hours = ROTATION_HOURS[body.name] || 24;
    const retro = hours < 0 ? -1 : 1;
    return retro * 0.05 * (24 / Math.abs(hours));
  }, [body.name]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const d = Math.min(delta, 0.05); // clamp for tab-switch spikes

    // Keplerian position from the global clock (never stale)
    const helio = getHeliocentricEcliptic(body.name, simClock.jd);
    const [sx, sy, sz] = compressEcliptic(helio.x, helio.y, helio.z);
    groupRef.current.position.set(sx, sy, sz);
    setBodyPosition(body.name, groupRef.current);

    // Frame-rate independent axial rotation, scaled by sim speed
    spinRef.current.rotation.y += d * spinRate * simClock.daysPerSec * (simClock.paused ? 0 : 1);
    if (cloudRef.current) cloudRef.current.rotation.y += d * spinRate * 0.13 * simClock.daysPerSec * (simClock.paused ? 0 : 1);
  });

  const handleClick = useCallback((event) => {
    event.stopPropagation();
    onSelect(body);
  }, [body, onSelect]);

  const handleOver = useCallback((event) => {
    event.stopPropagation();
    setLocalHover(true);
    onHover?.(body.name);
  }, [body.name, onHover]);

  const handleOut = useCallback(() => {
    setLocalHover(false);
    onHover?.(null);
  }, [onHover]);

  const isHighlighted = selected || localHover;

  return (
    <group ref={groupRef} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
      <group rotation={[0, 0, ((body.tilt || 0) * Math.PI) / 180]}>
        <mesh ref={spinRef}>
          <sphereGeometry args={[body.size, 96, 96]} />
          <meshStandardMaterial
            map={surface}
            bumpMap={bump}
            bumpScale={body.banded ? 0.005 : 0.035}
            emissive={isEarth ? new THREE.Color(1.0, 0.85, 0.5) : body.color}
            emissiveMap={nightLights}
            emissiveIntensity={isEarth ? 1.8 : isHighlighted ? 0.15 : matProps.emissiveIntensity}
            roughness={matProps.roughness}
            metalness={matProps.metalness}
          />
        </mesh>

        {clouds && (
          <mesh ref={cloudRef} scale={1.018}>
            <sphereGeometry args={[body.size, 64, 64]} />
            <meshStandardMaterial
              map={clouds}
              transparent
              opacity={body.name === 'Venus' ? 0.95 : 0.75}
              depthWrite={false}
              roughness={1}
            />
          </mesh>
        )}

        {showAtmosphere && body.atmosphere && (
          <mesh scale={1.12}>
            <sphereGeometry args={[body.size, 48, 48]} />
            <meshBasicMaterial
              color={body.atmosphere}
              transparent
              opacity={(body.atmosphereStrength ?? 0.5) * (isHighlighted ? 1.8 : 1)}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {rings && (
        <mesh rotation={[Math.PI / 2 - ((body.rings.tilt || 26) * Math.PI) / 180, 0, 0]} scale={body.size}>
          <ringGeometry args={[body.rings.inner, body.rings.outer, 128]} />
          <meshStandardMaterial
            map={rings}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            roughness={0.85}
            metalness={0.05}
          />
        </mesh>
      )}

      {(body.moons || []).map((moon, i) => (
        <Moon key={moon.name} moon={moon} parentBodyName={body.name} index={i} onSelect={onSelect} />
      ))}

      {showLabels && isHighlighted && (
        <Html distanceFactor={14} position={[0, body.size + 0.5, 0]} center>
          <div className={`planet-tag ${selected ? 'is-selected' : ''}`}>{body.name}</div>
        </Html>
      )}
    </group>
  );
}
