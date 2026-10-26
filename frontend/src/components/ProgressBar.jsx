export default function ProgressBar({ saved, target }) {
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const complete = pct >= 100;
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`progress-fill${complete ? " is-complete" : ""}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
