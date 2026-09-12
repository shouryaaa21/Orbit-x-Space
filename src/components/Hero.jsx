/** Introductory headline and call-to-action buttons shown over the scene. */
export default function Hero({ onExploreEarth, onFreeCamera }) {
  return (
    <section className="hero">
      <div className="eyebrow">INTERACTIVE COSMIC ATLAS</div>
      <h1>
        EXPLORE
        <br />
        <span>THE UNIVERSE.</span>
      </h1>
      <p>Navigate a living 3D solar system. Select a celestial body to discover its story.</p>
      <div className="actions">
        <button onClick={onExploreEarth}>EXPLORE EARTH ↗</button>
        <button className="ghost" onClick={onFreeCamera}>
          FREE CAMERA
        </button>
      </div>
    </section>
  );
}
