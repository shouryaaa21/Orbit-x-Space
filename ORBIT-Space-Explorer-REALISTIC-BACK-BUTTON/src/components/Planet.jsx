import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  hashSeed,
  createRockyTexture,
  createBandedTexture,
  createBumpTexture,
  createCloudTexture,
  createRingTexture,
} from '../utils/proceduralTextures';

/**
 * A single orbiting planet. Advances its own orbital angle every frame
 * and reports its current angle back on click so the camera/UI can react.
 * Also registers its live group ref via `registerRef` so a parent camera
 * rig can track its moving position, and lights up on hover for feedback
 * before the user commits to a click.
 *
 * Its surface is a realistic-looking procedural texture (continent-like
 * terrain for rocky bodies, turbulent bands for gas giants) generated at
 * runtime, with a matching relief/bump map for real surface depth under
 * lighting — no external image assets required.
 */
export default function Planet({ body, selected, onSelect, registerRef }) {
  const groupRef = useRef();
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHovered] = useState(false);

  const seed = useMemo(() => hashSeed(body.name), [body.name]);

  const surfaceMap = useMemo(
    () =>
      body.gasGiant
        ? createBandedTexture({ color: body.color, seed })
        : createRockyTexture({ color: body.color, seed }),
    [body.color, body.gasGiant, seed]
  );

  const bumpMap = useMemo(
    () => createBumpTexture({ seed, banded: !!body.gasGiant }),
    [body.gasGiant, seed]
  );

  const cloudMap = useMemo(
    () => (body.name === 'Earth' ? createCloudTexture({ seed: seed + 3 }) : null),
    [body.name, seed]
  );

  const ringMap = useMemo(
    () => (body.rings ? createRingTexture({ color: '#d8c28f', seed }) : null),
    [body.rings, seed]
  );

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
          map={surfaceMap}
          bumpMap={bumpMap}
          bumpScale={0.05}
          color="#ffffff"
          roughness={0.78}
          metalness={0.04}
          emissive={highlighted ? body.color : '#000000'}
          emissiveIntensity={selected ? 0.2 : hovered ? 0.1 : 0}
        />
      </mesh>

      {/* Wispy cloud layer, slowly drifting independently of the surface (Earth only) */}
      {cloudMap && <CloudLayer size={body.size} map={cloudMap} />}

      {/* Soft atmosphere glow shell, tinted to the planet's own color */}
      <mesh scale={1.08}>
        <sphereGeometry args={[body.size, 32, 32]} />
        <meshBasicMaterial color={body.color} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>

      {body.rings && ringMap && (
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[1.85, 2.7, 96]} />
          <meshStandardMaterial
            map={ringMap}
            color="#ffffff"
            side={THREE.DoubleSide}
            transparent
            roughness={0.9}
          />
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

/** A thin cloud shell that drifts around the planet at its own slow rate. */
function CloudLayer({ size, map }) {
  const ref = useRef();

  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.06;
  });

  return (
    <mesh ref={ref} scale={1.015}>
      <sphereGeometry args={[size, 48, 48]} />
      <meshStandardMaterial map={map} transparent depthWrite={false} roughness={1} />
    </mesh>
  );
}
