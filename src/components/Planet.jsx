import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * A single orbiting planet. Advances its own orbital angle every frame
 * and reports its current angle back on click so the camera/UI can react.
 */
export default function Planet({ body, selected, onSelect }) {
  const groupRef = useRef();
  const angleRef = useRef(Math.random() * Math.PI * 2);

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

  return (
    <group ref={groupRef} onClick={handleClick}>
      <mesh>
        <sphereGeometry args={[body.size, 48, 48]} />
        <meshStandardMaterial
          color={body.color}
          roughness={0.72}
          emissive={selected ? body.color : '#000000'}
          emissiveIntensity={selected ? 0.22 : 0}
        />
      </mesh>

      {body.rings && (
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[1.85, 2.7, 96]} />
          <meshStandardMaterial color="#d8c28f" side={THREE.DoubleSide} transparent opacity={0.72} />
        </mesh>
      )}

      {selected && (
        <Html distanceFactor={12} position={[0, body.size + 0.45, 0]}>
          <div className="planet-tag">{body.name}</div>
        </Html>
      )}
    </group>
  );
}
