/** Introductory headline and call-to-action buttons shown over the scene. */
export default function Hero({ onExploreEarth, onFreeCamera, onOpenExplore }) {
  return (
    <section className="hero">
      <div className="eyebrow">INTERACTIVE COSMIC ATLAS · 10 WORLDS · RESEARCH DATABASE</div>
      <h1>
        EXPLORE
        <br />
        <span>THE UNIVERSE.</span>
      </h1>
      <p>
        A real-time Keplerian solar system simulator with procedural textures,
        bump maps, city lights, and comprehensive research data for every body.
      </p>
      <div className="actions">
        <button onClick={onExploreEarth}>🌍 EXPLORE EARTH</button>
        <button onClick={onOpenExplore}>🔭 EXPLORE UNIVERSE</button>
        <button className="ghost" onClick={onFreeCamera}>
          FREE CAMERA
        </button>
      </div>
    </section>
  );
}
