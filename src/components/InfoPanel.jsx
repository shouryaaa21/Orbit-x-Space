const STAT_LABELS = ['DISTANCE', 'DIAMETER', 'ORBIT'];

/** Side panel showing details for the currently selected celestial body. */
export default function InfoPanel({ body, onClose }) {
  return (
    <aside className="panel">
      <button className="close" onClick={onClose}>
        ×
      </button>

      <div className="kicker">{body.type}</div>
      <h2>{body.name}</h2>
      <p>{body.fact}</p>

      <div className="stats">
        {body.stats.map((value, i) => (
          <div key={value}>
            <span>{STAT_LABELS[i]}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <button className="deep">
        OPEN DEEP DIVE <b>→</b>
      </button>
    </aside>
  );
}
