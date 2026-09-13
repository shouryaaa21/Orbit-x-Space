import { useMemo, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { playHover } from '../utils/audio';

const COMET_COUNT = 7;
const TRAVEL_SPAN = 44;
const TRAVEL_OFFSET = 22;

const COMET_DATA = [
  { name: 'Halley\'s Comet', period: '75.3 years', lastSeen: '1986', detail: 'Most famous periodic comet. Visible from Earth every 75–76 years. Next perihelion: July 2061.' },
  { name: 'Hale-Bopp', period: '2,520 years', lastSeen: '1997', detail: 'One of the most widely observed comets of the 20th century. Visible to the naked eye for 18 months.' },
  { name: 'Encke\'s Comet', period: '3.3 years', lastSeen: '2023', detail: 'Shortest period of any known comet. Discovered by Johann Franz Encke in 1818.' },
  { name: 'Comet NEOWISE', period: '~6,800 years', lastSeen: '2020', detail: 'Discovered in March 2020 by NASA\'s NEOWISE mission. Brilliant naked-eye comet in July 2020.' },
  { name: 'Hyakutake', period: '~70,000 years', lastSeen: '1996', detail: 'Passed within 0.1 AU of Earth in 1996 — one of the closest cometary approaches in the 20th century.' },
  { name: 'Churyumov-Gerasimenko', period: '6.45 years', lastSeen: '2020', detail: 'Target of ESA\'s Rosetta mission (2014–2016). First comet where a lander (Philae) touched down.' },
  { name: 'Wild 2', period: '~6.4 years', lastSeen: '2003', detail: 'Sampled by NASA\'s Stardust mission (2004). Returned dust grains to Earth in 2006.' },
];

function SingleComet({ config, index }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const data = COMET_DATA[index % COMET_DATA.length];

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const x = ((t * config.speed + config.offset) % TRAVEL_SPAN) - TRAVEL_OFFSET;
    const y = config.y + Math.sin(t * 0.4 + index) * 1.4;
    groupRef.current.position.set(x, y, config.z);
  });

  const handleClick = useCallback((event) => {
    event.stopPropagation();
    playHover();
  }, []);

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color={hovered ? '#fff' : '#fff3d0'} />
      </mesh>
      <mesh position={[-1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.32, 3.2, 16, 1, true]} />
        <meshBasicMaterial
          color={hovered ? '#b8e8ff' : '#8edcff'}
          transparent
          opacity={hovered ? 0.4 : 0.22}
          blending={2}
          depthWrite={false}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={20} position={[0, 0.5, 0]} center>
          <div className="planet-tag comet-tag">
            <div className="comet-name">{data.name}</div>
            <div className="comet-period">Period: {data.period}</div>
            <div className="comet-detail">{data.detail}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function Comets() {
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

  return (
    <>
      {cometConfigs.map((config, i) => (
        <SingleComet key={i} config={config} index={i} />
      ))}
    </>
  );
}
