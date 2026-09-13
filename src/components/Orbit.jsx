import { useMemo } from 'react';
import * as THREE from 'three';
import { getOrbitPath } from '../utils/orbitalMechanics';

/**
 * Renders a Keplerian orbital path as a double-layer line:
 * - A wider, fainter glow underneath
 * - A sharper bright line on top
 */
export default function Orbit({ bodyName, simJD }) {
  const { coreGeo, glowGeo } = useMemo(() => {
    const points = getOrbitPath(bodyName, simJD, 256);
    const vecs = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    return {
      coreGeo: new THREE.BufferGeometry().setFromPoints(vecs),
      glowGeo: new THREE.BufferGeometry().setFromPoints(vecs),
    };
  }, [bodyName, Math.floor(simJD / 10)]);

  return (
    <group>
      {/* Wide glow layer */}
      <line geometry={glowGeo}>
        <lineBasicMaterial color="#4a8ac8" transparent opacity={0.06} linewidth={1} />
      </line>
      {/* Sharp core line */}
      <line geometry={coreGeo}>
        <lineBasicMaterial color="#6aaae0" transparent opacity={0.18} linewidth={1} />
      </line>
    </group>
  );
}
