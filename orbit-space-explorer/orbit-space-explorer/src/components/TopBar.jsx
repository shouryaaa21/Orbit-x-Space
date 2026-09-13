/** Fixed header with the brand mark, a local search field, and the universe search trigger. */
export default function TopBar({ query, onQueryChange, onOpenUniverse }) {
  return (
    <header className="top">
      <div className="brand">
        <i />
        ORBIT <small>SPACE EXPLORER</small>
      </div>

      <div className="search">
        ⌕
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search celestial bodies..."
        />
      </div>

      <button className="explore-universe" onClick={onOpenUniverse}>
        🔭 EXPLORE THE UNIVERSE
      </button>
    </header>
  );
}
