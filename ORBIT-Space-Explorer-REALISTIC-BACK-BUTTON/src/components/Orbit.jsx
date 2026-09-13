import { useMemo } from 'react';
import * as THREE from 'three';

/** A faint circular guideline showing a planet's orbital path around the Sun. */
export default function Orbit({ radius }) {
  const points = useMemo(() => {
    const segmentCount = 129;
    return Array.from({ length: segmentCount }, (_, i) => {
      const angle = (i / (segmentCount - 1)) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    });
  }, [radius]);

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#8aa0bd" transparent opacity={0.13} />
    </line>
  );
}
