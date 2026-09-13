import { useMemo } from 'react';
import * as THREE from 'three';
import { getOrbitPath } from '../utils/orbitalMechanics';
import { simClock } from '../utils/simClock';

/**
 * Renders a Keplerian orbital path as a dual-layer line (glow + core).
 * Path is computed once on mount from the current sim date — secular
 * precession is negligible over human timescales, so this stays accurate
 * while removing per-frame geometry churn.
 */
export default function Orbit({ bodyName }) {
  const { coreGeo, glowGeo } = useMemo(() => {
    const points = getOrbitPath(bodyName, simClock.jd, 256);
    const vecs = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    return {
      coreGeo: new THREE.BufferGeometry().setFromPoints(vecs),
      glowGeo: new THREE.BufferGeometry().setFromPoints(vecs),
    };
  }, [bodyName]);

  return (
    <group>
      <line geometry={glowGeo}>
        <lineBasicMaterial color="#4a8ac8" transparent opacity={0.05} linewidth={1} />
      </line>
      <line geometry={coreGeo}>
        <lineBasicMaterial color="#6aaae0" transparent opacity={0.16} linewidth={1} />
      </line>
    </group>
  );
}
