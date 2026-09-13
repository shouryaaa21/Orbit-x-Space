import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * A single orbiting planet. Advances its own orbital angle every frame
 * and reports its current angle back on click so the camera/UI can react.
 * Also registers its live group ref via `registerRef` so a parent camera
 * rig can track its moving position, and lights up on hover for feedback
 * before the user commits to a click.
 */
export default function Planet({ body, selected, onSelect, registerRef }) {
  const groupRef = useRef();
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    registerRef?.(groupRef.current);
  }, [registerRef]);

  useFrame((_, delta) => {
    angleRef.current += delta * body.speed * 0.08;
    const x = Math.cos(angleRef.current) * body.distance;
    const z = Math.sin(angleRef.current) * body.distance;
    groupRef.current.position.set(x, 0, z);
    groupRef.current.rotation.y += delta * 0.35;
  });

  const handleClick = (event) => {
    event.stopPropagation();
    onSelect({ ...body, angle: angleRef.current });
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

  const highlighted = selected || hovered;

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <mesh scale={hovered && !selected ? 1.08 : 1}>
        <sphereGeometry args={[body.size, 64, 64]} />
        <meshStandardMaterial
          color={body.color}
          roughness={0.72}
          emissive={highlighted ? body.color : '#000000'}
          emissiveIntensity={selected ? 0.22 : hovered ? 0.12 : 0}
        />
      </mesh>

      {/* Soft atmosphere glow shell, tinted to the planet's own color */}
      <mesh scale={1.08}>
        <sphereGeometry args={[body.size, 32, 32]} />
        <meshBasicMaterial color={body.color} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>

      {body.rings && (
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[1.85, 2.7, 96]} />
          <meshStandardMaterial color="#d8c28f" side={THREE.DoubleSide} transparent opacity={0.72} />
        </mesh>
      )}

      {highlighted && (
        <Html distanceFactor={12} position={[0, body.size + 0.45, 0]}>
          <div className="planet-tag">{body.name}</div>
        </Html>
      )}
    </group>
  );
}
