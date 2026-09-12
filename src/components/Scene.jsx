import { Fragment } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { celestialBodies } from '../data/celestialBodies';
import Sun from './Sun';
import Planet from './Planet';
import Orbit from './Orbit';
import Comets from './Comets';

/** The full 3D scene: starfield, Sun, planets with their orbit lines, and comets. */
export default function Scene({ selected, onSelect }) {
  return (
    <Canvas camera={{ position: [0, 7, 29], fov: 48 }} dpr={[1, 2]}>
      <color attach="background" args={['#02040b']} />
      <fog attach="fog" args={['#02040b', 28, 90]} />
      <ambientLight intensity={0.12} />

      <Stars radius={100} depth={55} count={8000} factor={2.1} saturation={0} fade speed={0.25} />
      <Sparkles count={550} scale={[45, 25, 45]} size={2} speed={0.18} opacity={0.5} />
      <Comets />

      <Sun onSelect={onSelect} />

      {celestialBodies.map((body) => (
        <Fragment key={body.name}>
          <Orbit radius={body.distance} />
          <Planet body={body} selected={selected?.name === body.name} onSelect={onSelect} />
        </Fragment>
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={10}
        maxDistance={48}
        enableDamping
        dampingFactor={0.045}
      />
    </Canvas>
  );
}
