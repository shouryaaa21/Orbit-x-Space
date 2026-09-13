import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import SpinningBody from './SpinningBody';

/**
 * Full-screen search experience backed by /api/celestial. Looks up any
 * named celestial body against real data sources and shows a summary,
 * physical stats (when available), a gallery of real space-agency images,
 * and a simple interactive 3D model driven by the returned render hints.
 */
export default function UniverseExplorer({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error | success
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!open) return null;

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(`/api/celestial?name=${encodeURIComponent(trimmed)}`);

      if (response.status === 404) {
        setStatus('error');
        setErrorMessage(`Couldn't find anything called "${trimmed}". Try a different name.`);
        return;
      }
      if (!response.ok) throw new Error('Request failed');

      const data = await response.json();
      setResult(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage('Something went wrong reaching the data sources. Please try again.');
    }
  };

  return (
    <div className="universe-overlay">
      <button className="universe-close" onClick={onClose}>
        × Close
      </button>

      <form className="universe-search-bar" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any celestial body — a moon, star, galaxy, exoplanet..."
          autoFocus
        />
        <button type="submit">Search</button>
      </form>

      {status === 'idle' && (
        <p className="universe-hint">
          Try "Titan", "Betelgeuse", "Andromeda Galaxy", or "Proxima Centauri b".
        </p>
      )}

      {status === 'loading' && <p className="universe-hint">Searching real space data sources…</p>}

      {status === 'error' && <p className="universe-error">{errorMessage}</p>}

      {status === 'success' && result && (
        <div className="universe-result">
          <div className="universe-model">
            <Canvas camera={{ position: [0, 1.5, 7], fov: 45 }}>
              <color attach="background" args={['#02040b']} />
              <ambientLight intensity={0.35} />
              <directionalLight position={[5, 4, 5]} intensity={1.6} />
              <directionalLight position={[-6, -2, -4]} intensity={0.4} color="#5da9ff" />
              <Stars radius={80} depth={40} count={2500} factor={2} fade speed={0.2} />
              <SpinningBody
                color={result.render.color}
                size={result.render.sizeScale * 1.8}
                hasRings={result.render.hasRings}
                isStar={result.render.isStar}
              />
              <OrbitControls enablePan={false} minDistance={4} maxDistance={16} enableDamping />
            </Canvas>
          </div>

          <div className="universe-details">
            <div className="kicker">{result.type}</div>
            <h2>{result.name}</h2>

            {result.summary && (
              <p className="universe-summary">
                {result.summary}
                {result.summaryUrl && (
                  <>
                    {' '}
                    <a href={result.summaryUrl} target="_blank" rel="noreferrer">
                      Read more on Wikipedia
                    </a>
                  </>
                )}
              </p>
            )}

            {result.stats.length > 0 && (
              <div className="universe-stats">
                {result.stats.map((stat) => (
                  <div key={stat.label}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>
            )}

            {result.images.length > 0 && (
              <>
                <div className="universe-gallery-label">Images — {result.imagesSource}</div>
                <div className="universe-gallery">
                  {result.images.map((image) => (
                    <a key={image.url} href={image.url} target="_blank" rel="noreferrer" title={image.title}>
                      <img src={image.url} alt={image.title} loading="lazy" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
