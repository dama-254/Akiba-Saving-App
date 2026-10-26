import { Link } from "react-router-dom";
import ProgressBar from "./ProgressBar";

function formatMoney(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function GoalCard({ goal }) {
  const complete = goal.saved_amount >= goal.target_amount;
  return (
    <Link to={`/goals/${goal.id}`} className={`goal-row${complete ? " is-complete" : ""}`}>
      <div className="goal-row-top">
        <h3>{goal.title}</h3>
        <div className="goal-amounts">
          <strong>{formatMoney(goal.saved_amount)}</strong> of {formatMoney(goal.target_amount)}
        </div>
      </div>
      <ProgressBar saved={goal.saved_amount} target={goal.target_amount} />
      <div className="goal-meta">
        <span>{goal.deposit_count} deposit{goal.deposit_count === 1 ? "" : "s"}</span>
        <span>{goal.deadline ? `Due ${goal.deadline}` : "No deadline set"}</span>
      </div>
    </Link>
  );
}
