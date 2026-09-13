import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { sunData } from '../data/celestialBodies';
import { createStarTexture } from '../utils/proceduralTextures';

/** The Sun: a slowly-rotating, turbulent emissive sphere with a soft glow halo and point light. */
export default function Sun({ onSelect }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const surfaceMap = useMemo(() => createStarTexture({ size: 512, seed: 9 }), []);

  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.08;
  });

  const handleClick = (event) => {
    event.stopPropagation();
    onSelect(sunData);
  };

  const handlePointerOver = (event) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      <mesh ref={meshRef} scale={hovered ? 1.04 : 1}>
        <sphereGeometry args={[2.45, 64, 64]} />
        <meshStandardMaterial
          map={surfaceMap}
          emissiveMap={surfaceMap}
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1.6}
        />
      </mesh>

      <pointLight intensity={450} distance={80} color="#ffd38a" />

      {/* Soft outer glow */}
      <mesh scale={hovered ? 1.22 : 1.16}>
        <sphereGeometry args={[2.45, 48, 48]} />
        <meshBasicMaterial color="#ffb52f" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}
