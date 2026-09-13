import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  hashSeed,
  createRockyTexture,
  createBandedTexture,
  createBumpTexture,
  createRingTexture,
  createStarTexture,
} from '../utils/proceduralTextures';

/**
 * A single sphere rendered up close and slowly spinning, with a realistic
 * procedural surface (or turbulent star surface), matching relief map, an
 * optional ring system, and a soft atmosphere/glow shell. Driven purely by
 * simple render hints so it can represent either a known local body or a
 * body resolved dynamically from the Universe Explorer's search API.
 *
 * @param {{
 *   color: string,
 *   size: number,
 *   hasRings?: boolean,
 *   isStar?: boolean,
 *   banded?: boolean,
 *   seedKey?: string,
 * }} props
 */
export default function SpinningBody({ color, size, hasRings, isStar, banded, seedKey }) {
  const groupRef = useRef();
  const seed = useMemo(() => hashSeed(seedKey || color || 'body'), [seedKey, color]);

  const surfaceMap = useMemo(() => {
    if (isStar) return createStarTexture({ size: 512, seed });
    return banded
      ? createBandedTexture({ color, size: 512, seed })
      : createRockyTexture({ color, size: 512, seed });
  }, [color, isStar, banded, seed]);

  const bumpMap = useMemo(
    () => (isStar ? null : createBumpTexture({ size: 512, seed, banded: !!banded })),
    [isStar, banded, seed]
  );

  const ringMap = useMemo(() => (hasRings ? createRingTexture({ seed, size: 512 }) : null), [hasRings, seed]);

  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.15;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[size, 96, 96]} />
        {isStar ? (
          <meshStandardMaterial
            map={surfaceMap}
            emissiveMap={surfaceMap}
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.4}
          />
        ) : (
          <meshStandardMaterial
            map={surfaceMap}
            bumpMap={bumpMap}
            bumpScale={0.05}
            color="#ffffff"
            roughness={0.78}
            metalness={0.04}
          />
        )}
      </mesh>

      {!isStar && (
        <mesh scale={1.04}>
          <sphereGeometry args={[size, 64, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.BackSide} />
        </mesh>
      )}

      {hasRings && ringMap && (
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[size * 1.3, size * 1.9, 128]} />
          <meshStandardMaterial map={ringMap} color="#ffffff" side={THREE.DoubleSide} transparent roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}
