import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { auToScene } from '../utils/orbitalMechanics';

const dummy = new THREE.Object3D();

/**
 * Belt of instanced asteroid rocks. Matrices are set ONCE on mount;
 * motion comes from rotating the whole group (rigid-body approximation).
 * This removes ~4,600 matrix recompositions per frame and keeps GPU
 * instancing benefits. Slight per-rock offsets preserve a natural look.
 */
function Belt({ count, auInner, auOuter, ySpread, color, size, speed, opacity = 1, tilt = 0 }) {
  const meshRef = useRef();
  const groupRef = useRef();
  const innerRadius = auToScene(auInner);
  const outerRadius = auToScene(auOuter);

  // Deterministic layout so it never re-randomizes on re-render
  const layout = useMemo(() => {
    let s = count * 7 + 3;
    const rand = () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
    const arr = [];
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = innerRadius + Math.pow(rand(), 0.8) * (outerRadius - innerRadius);
      arr.push({
        angle,
        radius,
        y: (rand() - 0.5) * ySpread,
        scale: size * (0.3 + rand() * 0.7),
        rot: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI],
      });
    }
    return arr;
  }, [count, innerRadius, outerRadius, ySpread, size]);

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      v.multiplyScalar(0.75 + Math.random() * 0.5);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Set instance matrices once
  const initRef = useRef(false);
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!initRef.current) {
      layout.forEach((rock, i) => {
        dummy.position.set(
          Math.cos(rock.angle) * rock.radius,
          rock.y,
          Math.sin(rock.angle) * rock.radius
        );
        dummy.rotation.set(rock.rot[0], rock.rot[1], rock.rot[2]);
        dummy.scale.setScalar(rock.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      initRef.current = true;
    }
    // Rigid rotation of the entire belt
    groupRef.current.rotation.y += 0.0004 * speed * 60 * 0.016;
  });

  return (
    <group ref={groupRef} rotation={[tilt, 0, 0]}>
      <instancedMesh ref={meshRef} args={[geometry, undefined, count]} frustumCulled={false}>
        <meshStandardMaterial color={color} roughness={0.92} metalness={0.08} transparent opacity={opacity} />
      </instancedMesh>
    </group>
  );
}

export default function Belts() {
  return (
    <>
      {/* Main Asteroid Belt: 2.1–3.3 AU */}
      <Belt count={1800} auInner={2.1} auOuter={3.3} ySpread={0.35} color="#9a8a72" size={0.08} speed={1.6} tilt={0.02} />
      {/* Kuiper Belt: 30–50 AU */}
      <Belt count={2800} auInner={30} auOuter={50} ySpread={1.4} color="#6a7890" size={0.1} speed={0.4} opacity={0.85} tilt={0.05} />
    </>
  );
}
