import { Fragment, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { celestialBodies } from '../data/celestialBodies';
import Sun from './Sun';
import Planet from './Planet';
import Orbit from './Orbit';
import Comets from './Comets';
import Belts from './Belts';
import CameraRig from './CameraRig';

export default function Scene({ selected, onSelect, hovered, onHover, toggles }) {
  return (
    <Canvas
      camera={{ position: [0, 10, 28], fov: 50, near: 0.05, far: 600 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        powerPreference: 'high-performance',
      }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={['#02030a']} />
      <fog attach="fog" args={['#02030a', 55, 180]} />
      <ambientLight intensity={0.04} color="#4a6a90" />

      <Stars radius={150} depth={70} count={11000} factor={2.8} saturation={0.06} fade speed={0.25} />
      <Stars radius={80} depth={30} count={2200} factor={1.6} saturation={0.02} fade speed={0.1} />
      <Stars radius={40} depth={15} count={600} factor={1.0} saturation={0} fade speed={0.06} />
      <Sparkles count={800} scale={[70, 40, 70]} size={1.8} speed={0.12} opacity={0.35} color="#88c8ff" />

      {toggles.comets && <Comets />}
      {toggles.belts && <Belts />}

      <Suspense fallback={null}>
        <Sun onSelect={onSelect} />

        {celestialBodies.map((body, i) => (
          <Fragment key={body.name}>
            {toggles.orbits && <Orbit bodyName={body.name} />}
            <Planet
              body={body}
              index={i}
              selected={selected?.name === body.name}
              hovered={hovered === body.name}
              onSelect={onSelect}
              onHover={onHover}
              showLabels={toggles.labels}
              showAtmosphere={toggles.atmosphere}
            />
          </Fragment>
        ))}
      </Suspense>

      <CameraRig selected={selected} />

      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={120}
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI * 0.88}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />

      <EffectComposer multisampling={4}>
        <Bloom intensity={0.9} luminanceThreshold={0.15} luminanceSmoothing={0.25} mipmapBlur radius={0.75} />
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0004, 0.0006]} radialModulation modulationOffset={0.5} />
        <Vignette eskil={false} offset={0.2} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
