import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { hashSeed, createRockyTexture, createBandedTexture, createCloudTexture, createRingTexture, createStarTexture } from '../utils/proceduralTextures';

const PROFILES = {
  Mercury: { type: 'rocky', atmosphere: 0.01, roughness: 0.94, bump: 0.16 },
  Venus: { type: 'venus', atmosphere: 0.16, roughness: 0.86, bump: 0.035 },
  Earth: { type: 'earth', atmosphere: 0.18, roughness: 0.72, bump: 0.035 },
  Mars: { type: 'mars', atmosphere: 0.055, roughness: 0.91, bump: 0.11 },
  Jupiter: { type: 'jupiter', atmosphere: 0.08, roughness: 0.9, bump: 0.025 },
  Saturn: { type: 'saturn', atmosphere: 0.065, roughness: 0.91, bump: 0.02 },
  Uranus: { type: 'uranus', atmosphere: 0.06, roughness: 0.88, bump: 0.018 },
  Neptune: { type: 'neptune', atmosphere: 0.075, roughness: 0.86, bump: 0.025 },
};

export default function RealisticBody({ body, selected, onSelect, registerRef }) {
  const group = useRef();
  const profile = PROFILES[body.name] || { type: body.gasGiant ? 'jupiter' : 'rocky', atmosphere: 0.06, roughness: 0.9, bump: 0.05 };
  const seed = useMemo(() => hashSeed(body.name), [body.name]);
  const surface = useMemo(() => {
    if (profile.type === 'earth') return createRockyTexture({ color: '#1d4f87', size: 1024, seed, variant: 'earth' });
    if (profile.type === 'mars') return createRockyTexture({ color: '#9b3d25', size: 1024, seed, variant: 'mars' });
    if (profile.type === 'venus') return createRockyTexture({ color: '#c99050', size: 1024, seed, variant: 'venus' });
    return body.gasGiant ? createBandedTexture({ color: body.color, size: 1024, seed, variant: profile.type }) : createRockyTexture({ color: body.color, size: 1024, seed });
  }, [body.color, body.gasGiant, profile.type, seed]);
  const clouds = useMemo(() => body.name === 'Earth' ? createCloudTexture({ size: 1024, seed: seed + 31 }) : null, [body.name, seed]);
  const rings = useMemo(() => body.rings ? createRingTexture({ size: 1024, seed, color: '#c9b68e' }) : null, [body.rings, seed]);

  useEffect(() => { registerRef?.(group.current); }, [registerRef]);
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * (body.name === 'Earth' ? 0.18 : 0.11);
    const a = group.current.userData.angle ?? (group.current.userData.angle = Math.random() * Math.PI * 2);
    group.current.userData.angle = a + dt * body.speed * 0.075;
    group.current.position.set(Math.cos(group.current.userData.angle) * body.distance, 0, Math.sin(group.current.userData.angle) * body.distance);
  });

  const material = new THREE.MeshStandardMaterial({ map: surface, roughness: profile.roughness, metalness: 0.0, bumpMap: surface, bumpScale: profile.bump });
  return (
    <group ref={group} onClick={(e) => { e.stopPropagation(); onSelect({ ...body, angle: group.current?.userData.angle || 0 }); }}>
      <mesh>
        <sphereGeometry args={[body.size, 128, 128]} />
        <primitive object={material} attach="material" />
      </mesh>
      {clouds && <Clouds size={body.size} map={clouds} />}
      {profile.atmosphere > 0 && <Atmosphere size={body.size} color={body.name === 'Earth' ? '#4ca8ff' : body.color} opacity={profile.atmosphere} />}
      {body.rings && rings && <SaturnRings size={body.size} map={rings} />}
      {selected && <mesh scale={1.04}><sphereGeometry args={[body.size, 64, 64]} /><meshBasicMaterial color={body.color} transparent opacity={0.045} side={THREE.BackSide} /></mesh>}
    </group>
  );
}

function Clouds({ size, map }) {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.035; });
  return <mesh ref={ref} scale={1.008}><sphereGeometry args={[size, 96, 96]} /><meshStandardMaterial map={map} transparent opacity={0.72} depthWrite={false} roughness={1} /></mesh>;
}

function Atmosphere({ size, color, opacity }) {
  return <mesh scale={1.055}><sphereGeometry args={[size, 64, 64]} /><meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>;
}

function SaturnRings({ size, map }) {
  return <mesh rotation={[Math.PI / 2.35, 0.12, 0]}><ringGeometry args={[size * 1.35, size * 2.5, 256]} /><meshStandardMaterial map={map} transparent opacity={0.92} side={THREE.DoubleSide} roughness={0.95} /></mesh>;
}

export function RealisticSun({ data, onSelect }) {
  const ref = useRef();
  const seed = hashSeed('Sun');
  const map = useMemo(() => createStarTexture({ size: 1024, seed }), [seed]);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.035; });
  return <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(data); }}>
    <mesh><sphereGeometry args={[2.35, 128, 128]} /><meshStandardMaterial map={map} emissiveMap={map} emissive="#ffb22f" emissiveIntensity={2.2} toneMapped={false} /></mesh>
    <mesh scale={1.055}><sphereGeometry args={[2.35, 96, 96]} /><meshBasicMaterial color="#ff8a00" transparent opacity={0.18} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    <pointLight intensity={28} distance={150} decay={1.5} color="#fff0cf" />
  </group>;
}
