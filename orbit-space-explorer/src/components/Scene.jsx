import { Fragment, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { celestialBodies } from '../data/celestialBodies';
import Sun from './Sun';
import Planet from './Planet';
import Orbit from './Orbit';
import Comets from './Comets';
import CameraRig from './CameraRig';

/** The full 3D scene: starfield, Sun, planets with their orbit lines, and comets. */
export default function Scene({ selected, onSelect }) {
  const bodyRefs = useRef({});
  const controlsRef = useRef();

  return (
    <Canvas camera={{ position: [0, 7, 29], fov: 48 }} dpr={[1, 2]}>
      <color attach="background" args={['#02040b']} />
      <fog attach="fog" args={['#02040b', 30, 95]} />
      <ambientLight intensity={0.12} />
      <hemisphereLight args={['#3a5a8c', '#050608', 0.25]} />

      {/* Two star layers at different depths for a richer, more three-dimensional field */}
      <Stars radius={110} depth={60} count={11000} factor={2.4} saturation={0} fade speed={0.25} />
      <Stars radius={60} depth={25} count={2500} factor={1.1} saturation={0} fade speed={0.15} />
      <Sparkles count={650} scale={[45, 25, 45]} size={2.4} speed={0.18} opacity={0.55} />
      <Comets />

      <Sun onSelect={onSelect} />

      {celestialBodies.map((body) => (
        <Fragment key={body.name}>
          <Orbit radius={body.distance} />
          <Planet
            body={body}
            selected={selected?.name === body.name}
            onSelect={onSelect}
            registerRef={(ref) => {
              bodyRefs.current[body.name] = ref;
            }}
          />
        </Fragment>
      ))}

      <CameraRig selected={selected} bodyRefs={bodyRefs} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        minDistance={10}
        maxDistance={48}
        enableDamping
        dampingFactor={0.045}
        autoRotate={!selected}
        autoRotateSpeed={0.35}
      />
    </Canvas>
  );
}
