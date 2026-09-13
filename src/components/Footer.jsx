import { useState, useEffect } from 'react';

/** FPS counter */
function FPSDisplay() {
  const [fps, setFps] = useState(60);
  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round(frames * 1000 / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      raf = requestAnimationFrame(tick);
    };
    let raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span className="fps">{fps} FPS</span>;
}

export default function Footer({ telemetry }) {
  return (
    <footer>
      <span>◉ LIVE 3D SIMULATION</span>
      <FPSDisplay />
      <span className="telemetry">{telemetry}</span>
      <span>© 2026 ORBIT</span>
    </footer>
  );
}
