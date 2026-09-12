import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const COMET_COUNT = 7;
const TRAVEL_SPAN = 44; // total distance a comet travels before wrapping
const TRAVEL_OFFSET = 22; // recenters travel around x = 0

/** A handful of small comets drifting across the background for atmosphere. */
export default function Comets() {
  const groupRefs = useRef([]);

  const cometConfigs = useMemo(
    () =>
      Array.from({ length: COMET_COUNT }, (_, i) => ({
        offset: i * 1.7,
        speed: 0.7 + Math.random() * 1.1,
        y: (Math.random() - 0.5) * 15,
        z: (Math.random() - 0.5) * 20,
      })),
    []
  );

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    groupRefs.current.forEach((group, i) => {
      if (!group) return;
      const config = cometConfigs[i];
      const x = ((elapsed * config.speed + config.offset) % TRAVEL_SPAN) - TRAVEL_OFFSET;
      const y = config.y + Math.sin(elapsed * 0.4 + i) * 1.4;
      group.position.set(x, y, config.z);
    });
  });

  return (
    <>
      {cometConfigs.map((_, i) => (
        <group key={i} ref={(el) => (groupRefs.current[i] = el)}>
          <mesh>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#fff3d0" />
          </mesh>
          <mesh position={[-1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.32, 3.2, 16, 1, true]} />
            <meshBasicMaterial color="#8edcff" transparent opacity={0.22} />
          </mesh>
        </group>
      ))}
    </>
  );
}
