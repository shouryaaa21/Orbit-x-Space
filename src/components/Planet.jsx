import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getPlanetTexture, getCloudTexture, getMoonTexture, getRingTexture, getBumpTexture, getNightLightsTexture } from '../utils/textures';
import { getHeliocentricEcliptic, compressEcliptic } from '../utils/orbitalMechanics';
import { setBodyPosition } from '../utils/positions';
import { playHover } from '../utils/audio';

/* ----------------------------- moons ------------------------------------- */

function Moon({ moon, simJD, parentBodyName, index, onSelect }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const angle = t * moon.speed * 0.35 + index * 2.39;
    const dist = moon.distance;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const y = Math.sin(angle + index) * 0.08;
    groupRef.current.position.set(x, y, z);
    meshRef.current.rotation.y += 0.003;
  });

  const texture = useMemo(() => getMoonTexture(moon), [moon]);

  const handleClick = useCallback((event) => {
    event.stopPropagation();
    playHover();
    onSelect({
      name: moon.name,
      type: `MOON OF ${parentBodyName}`,
      color: moon.color,
      size: moon.size,
      fact: `${moon.name} orbits ${parentBodyName}. Distance: ${moon.distance.toFixed(1)} scene units from parent.`,
      stats: [
        { label: 'PARENT', value: parentBodyName },
        { label: 'SIZE', value: `${(moon.size * 100).toFixed(0)}% of Earth` },
      ],
      moons: [],
    });
  }, [moon, parentBodyName, onSelect]);

  return (
    <group ref={groupRef} onClick={handleClick} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[moon.size, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.92}
          metalness={0.02}
          emissive={hovered ? moon.color : '#000000'}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={14} position={[0, moon.size + 0.2, 0]} center>
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

export default function Planet({ body, simJD, selected, hovered, onSelect, onHover, index, showLabels, showAtmosphere }) {
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

  useFrame(() => {
    if (!groupRef.current) return;
    const helio = getHeliocentricEcliptic(body.name, simJD);
    // Compress the distance, not the components (components go negative → NaN)
    const [sx, sy, sz] = compressEcliptic(helio.x, helio.y, helio.z);
    groupRef.current.position.set(sx, sy, sz);
    setBodyPosition(body.name, groupRef.current);
    spinRef.current.rotation.y += 0.003 * (body.speed || 0.5);
    if (cloudRef.current) cloudRef.current.rotation.y += 0.001;
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
        <Moon key={moon.name} moon={moon} simJD={simJD} parentBodyName={body.name} index={i} onSelect={onSelect} />
      ))}

      {showLabels && (isHighlighted) && (
        <Html distanceFactor={14} position={[0, body.size + 0.5, 0]} center>
          <div className={`planet-tag ${selected ? 'is-selected' : ''}`}>{body.name}</div>
        </Html>
      )}
    </group>
  );
}
