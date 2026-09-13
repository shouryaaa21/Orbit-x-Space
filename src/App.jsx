import { useState, useCallback, useEffect } from 'react';
import { celestialBodies, sunData } from './data/celestialBodies';
import Scene from './components/Scene';
import TopBar from './components/TopBar';
import Hero from './components/Hero';
import Intro from './components/Intro';
import BodyNav from './components/BodyNav';
import SearchResults from './components/SearchResults';
import InfoPanel from './components/InfoPanel';
import BodySheet from './components/BodySheet';
import SimulationBar from './components/SimulationBar';
import ControlsBar from './components/ControlsBar';
import ExploreUniverse from './components/ExploreUniverse';
import Footer from './components/Footer';
import { preloadAllTextures } from './utils/textures';
import { startAmbient, setMuted, playSelect, playWhoosh, playHover } from './utils/audio';
import { dateToJD, jdToDateStr } from './utils/orbitalMechanics';
import { simClock, setJD, subscribe } from './utils/simClock';

const ALL_BODIES = [sunData, ...celestialBodies];
const EARTH = celestialBodies.find((b) => b.name === 'Earth');
const SPEED_PRESETS_COUNT = 5;

// Boot the clock to "now" once
setJD(dateToJD(new Date()));

export default function App() {
  const [booted, setBooted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [query, setQuery] = useState('');
  const [muted, setMutedState] = useState(false);
  const [showHero, setShowHero] = useState(true);
  const [showExplore, setShowExplore] = useState(false);
  const [sheetBody, setSheetBody] = useState(null); // name string from search/sheet flow
  const [paused, setPaused] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [displayJD, setDisplayJD] = useState(simClock.jd);
  const [toggles, setToggles] = useState({
    orbits: true,
    labels: true,
    atmosphere: true,
    belts: true,
    comets: true,
  });

  useEffect(() => subscribe(setDisplayJD), []);

  useEffect(() => {
    preloadAllTextures(celestialBodies, sunData, setProgress);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setBooted(true);
    startAmbient();
  }, []);

  const selectBody = useCallback((body) => {
    if (!body) { setSelected(null); return; }
    playSelect();
    playWhoosh();
    setSelected(body);
    setShowHero(false);
    setShowExplore(false);
    setSheetBody(null);
  }, []);

  const handlePickByName = useCallback((name) => {
    const body = ALL_BODIES.find((b) => b.name === name);
    if (body) selectBody(body);
  }, [selectBody]);

  /** Open the full data sheet (from search or explore). */
  const openSheet = useCallback((name) => {
    playSelect();
    setSheetBody(name);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMutedState((m) => { setMuted(!m); return !m; });
  }, []);

  const handleToggle = useCallback((key) => {
    playHover();
    setToggles((t) => ({ ...t, [key]: !t[key] }));
  }, []);

  const handleViewPreset = useCallback((preset) => {
    window.dispatchEvent(new CustomEvent('orbit:viewPreset', { detail: preset }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (sheetBody) { setSheetBody(null); return; }
        if (showExplore) { setShowExplore(false); return; }
        setSelected(null);
      }
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setSpeedIdx((i) => Math.min(i + 1, SPEED_PRESETS_COUNT - 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setSpeedIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === 'o') handleToggle('orbits');
      if (e.key === 'l') handleToggle('labels');
      if (e.key === 'b') handleToggle('belts');
      if (e.key === 'a') handleToggle('atmosphere');
      if (e.key === 'e') setShowExplore((v) => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleToggle, showExplore, sheetBody]);

  const telemetry = selected
    ? `TRACKING · ${selected.name.toUpperCase()}`
    : `FREE CAM · ${ALL_BODIES.length}+ BODIES · ${jdToDateStr(displayJD)}`;

  return (
    <main className="app">
      <div className="canvas">
        <Scene
          selected={selected}
          onSelect={selectBody}
          hovered={hovered}
          onHover={setHovered}
          toggles={toggles}
        />
      </div>

      {!booted && <Intro progress={progress} onComplete={handleIntroComplete} />}

      {booted && (
        <>
          <TopBar
            query={query}
            onQueryChange={setQuery}
            muted={muted}
            onToggleMute={handleToggleMute}
            onExplore={() => { playHover(); setShowExplore(true); }}
          />

          {showHero && !selected && (
            <Hero
              onExploreEarth={() => selectBody(EARTH)}
              onFreeCamera={() => { playHover(); setSelected(null); setShowHero(false); }}
              onOpenExplore={() => { playHover(); setShowExplore(true); }}
            />
          )}

          <div className="hint">
            <span>SCROLL ZOOM</span>
            <span className="hint-sep">·</span>
            <span>CLICK BODY</span>
            <span className="hint-sep">·</span>
            <span>E EXPLORE</span>
            <span className="hint-sep">·</span>
            <span>SPACE PAUSE</span>
          </div>

          {query && (
            <SearchResults
              query={query}
              onOpenSheet={openSheet}
            />
          )}

          {selected && <InfoPanel body={selected} onClose={() => setSelected(null)} />}

          <ControlsBar toggles={toggles} onToggle={handleToggle} onViewPreset={handleViewPreset} />

          <SimulationBar
            paused={paused}
            speedIdx={speedIdx}
            onSpeedChange={setSpeedIdx}
            onTogglePause={() => setPaused((p) => !p)}
          />

          <BodyNav selected={selected?.name} onPick={handlePickByName} />

          <Footer telemetry={telemetry} />
        </>
      )}

      {showExplore && (
        <ExploreUniverse
          onClose={() => setShowExplore(false)}
          onSelect={selectBody}
          onOpenSheet={openSheet}
        />
      )}

      {sheetBody && (
        <BodySheet
          bodyName={sheetBody}
          onClose={() => setSheetBody(null)}
          onFlyTo={handlePickByName}
        />
      )}
    </main>
  );
}
