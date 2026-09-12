/** Fixed header with the brand mark, a search field, and a menu button. */
export default function TopBar({ query, onQueryChange }) {
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

      <button className="menu">☰</button>
    </header>
  );
}
