import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { sunData } from '../data/celestialBodies';

/** The Sun: a slowly-rotating emissive sphere with a soft glow halo and point light. */
export default function Sun({ onSelect }) {
  const meshRef = useRef();

  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.08;
  });

  const handleClick = (event) => {
    event.stopPropagation();
    onSelect(sunData);
  };

  return (
    <group onClick={handleClick}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.45, 64, 64]} />
        <meshStandardMaterial color="#ff8b18" emissive="#ff6b00" emissiveIntensity={2.3} />
      </mesh>

      <pointLight intensity={450} distance={80} color="#ffd38a" />

      {/* Soft outer glow */}
      <mesh scale={1.16}>
        <sphereGeometry args={[2.45, 48, 48]} />
        <meshBasicMaterial color="#ffb52f" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}
