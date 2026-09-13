import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A single sphere rendered up close and slowly spinning, with an optional
 * ring system and a soft atmosphere/glow shell. Driven purely by simple
 * render hints so it can represent either a known local body or a body
 * resolved dynamically from the Universe Explorer's search API.
 *
 * @param {{ color: string, size: number, hasRings?: boolean, isStar?: boolean }} props
 */
export default function SpinningBody({ color, size, hasRings, isStar }) {
  const groupRef = useRef();

  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.15;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[size, 96, 96]} />
        {isStar ? (
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} roughness={0.4} />
        ) : (
          <meshStandardMaterial color={color} roughness={0.65} metalness={0.05} />
        )}
      </mesh>

      {!isStar && (
        <mesh scale={1.04}>
          <sphereGeometry args={[size, 64, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.BackSide} />
        </mesh>
      )}

      {hasRings && (
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[size * 1.3, size * 1.9, 128]} />
          <meshStandardMaterial color="#d8c28f" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}
