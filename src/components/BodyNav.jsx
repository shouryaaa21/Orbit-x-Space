import { playHover } from '../utils/audio';

const BODIES = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

/** Bottom quick-travel navigation between all bodies. */
export default function BodyNav({ selected, onPick }) {
  return (
    <nav className="body-nav">
      {BODIES.map((name) => (
        <button
          key={name}
          className={`body-chip ${selected === name ? 'is-active' : ''} ${name === 'Sun' ? 'is-sun' : ''}`}
          onMouseEnter={playHover}
          onClick={() => onPick(name)}
        >
          {name.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
