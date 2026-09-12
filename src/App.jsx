import { useState } from 'react';
import { celestialBodies } from './data/celestialBodies';
import Scene from './components/Scene';
import TopBar from './components/TopBar';
import Hero from './components/Hero';
import SearchResults from './components/SearchResults';
import InfoPanel from './components/InfoPanel';
import Footer from './components/Footer';

const EARTH = celestialBodies.find((body) => body.name === 'Earth');

export default function App() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');

  const matchingBodies = celestialBodies.filter((body) =>
    body.name.toLowerCase().includes(query.toLowerCase())
  );

  const selectBody = (body) => setSelected(body);

  return (
    <main className="app">
      <div className="canvas">
        <Scene selected={selected} onSelect={selectBody} />
      </div>

      <TopBar query={query} onQueryChange={setQuery} />

      <Hero onExploreEarth={() => selectBody(EARTH)} onFreeCamera={() => setSelected(null)} />

      <div className="hint">DRAG TO ORBIT · SCROLL TO ZOOM · CLICK A BODY</div>

      {query && (
        <SearchResults
          results={matchingBodies}
          onPick={(body) => {
            selectBody(body);
            setQuery('');
          }}
        />
      )}

      {selected && <InfoPanel body={selected} onClose={() => setSelected(null)} />}

      <Footer />
    </main>
  );
}
