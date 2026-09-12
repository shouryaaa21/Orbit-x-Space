/** Dropdown list of bodies matching the current search query. */
export default function SearchResults({ results, onPick }) {
  if (results.length === 0) return null;

  return (
    <div className="results">
      {results.map((body) => (
        <button key={body.name} onClick={() => onPick(body)}>
          {body.name}
          <span>{body.type}</span>
        </button>
      ))}
    </div>
  );
}
