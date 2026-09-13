import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import SpinningBody from './SpinningBody';

/** Full-screen modal isolating one local body in its own scene for a closer look. */
export default function DeepDive({ body, onClose }) {
  if (!body) return null;

  const isStar = body.type === 'STAR';
  const displaySize = isStar ? 2.6 : Math.max(body.size, 1) * 1.8;

  return (
    <div className="deep-dive-overlay">
      <button className="deep-dive-close" onClick={onClose}>
        × Close
      </button>

      <div className="deep-dive-canvas">
        <Canvas camera={{ position: [0, 1.5, 7], fov: 45 }}>
          <color attach="background" args={['#02040b']} />
          <ambientLight intensity={0.35} />
          <directionalLight position={[5, 4, 5]} intensity={1.6} />
          <directionalLight position={[-6, -2, -4]} intensity={0.4} color="#5da9ff" />
          <Stars radius={80} depth={40} count={3000} factor={2} fade speed={0.2} />
          <SpinningBody
            color={body.color}
            size={displaySize}
            hasRings={body.rings}
            isStar={isStar}
            banded={body.gasGiant}
            seedKey={body.name}
          />
          <OrbitControls enablePan={false} minDistance={4} maxDistance={14} enableDamping />
        </Canvas>
      </div>

      <div className="deep-dive-info">
        <div className="kicker">{body.type}</div>
        <h2>{body.name}</h2>
        <p>{body.fact}</p>
      </div>
    </div>
  );
}
