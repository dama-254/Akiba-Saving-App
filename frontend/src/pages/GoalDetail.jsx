import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import ProgressBar from "../components/ProgressBar";

function formatMoney(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function GoalDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [goal, setGoal] = useState(null);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [depositError, setDepositError] = useState("");

  useEffect(() => {
    let ignore = false;
    api
      .getGoal(token, id)
      .then((data) => !ignore && setGoal(data))
      .catch((err) => !ignore && setError(err.message));
    return () => {
      ignore = true;
    };
  }, [token, id]);

  async function handleAddDeposit(e) {
    e.preventDefault();
    setDepositError("");
    setSubmitting(true);
    try {
      const deposit = await api.addDeposit(token, id, { amount, note: note || null });
      setGoal((prev) => ({
        ...prev,
        saved_amount: prev.saved_amount + deposit.amount,
        deposit_count: prev.deposit_count + 1,
        deposits: [deposit, ...prev.deposits],
      }));
      setAmount("");
      setNote("");
    } catch (err) {
      setDepositError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDeposit(depositId) {
    const removed = goal.deposits.find((d) => d.id === depositId);
    try {
      await api.deleteDeposit(token, depositId);
      setGoal((prev) => ({
        ...prev,
        saved_amount: prev.saved_amount - removed.amount,
        deposit_count: prev.deposit_count - 1,
        deposits: prev.deposits.filter((d) => d.id !== depositId),
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteGoal() {
    if (!window.confirm("Delete this goal and every deposit logged against it?")) return;
    try {
      await api.deleteGoal(token, id);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) {
    return (
      <div className="page">
        <div className="form-error">{error}</div>
        <Link to="/dashboard">Back to goals</Link>
      </div>
    );
  }

  if (!goal) {
    return <div className="page">Loading…</div>;
  }

  const complete = goal.saved_amount >= goal.target_amount;

  return (
    <div className="page">
      <Link to="/dashboard" className="icon-btn" style={{ marginBottom: 20, display: "inline-block" }}>
        ← Back to goals
      </Link>

      <div className="goal-hero">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>{goal.title}</h1>
          <button
            onClick={handleDeleteGoal}
            style={{
              background: "none",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              borderRadius: 3,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Delete goal
          </button>
        </div>
        <div className="goal-hero-figure">
          <span className="saved">{formatMoney(goal.saved_amount)}</span>
          <span className="of-target">
            of {formatMoney(goal.target_amount)} {complete ? "— reached" : "saved so far"}
          </span>
        </div>
        <ProgressBar saved={goal.saved_amount} target={goal.target_amount} />
        {goal.deadline && (
          <p style={{ color: "var(--ink-soft)", marginTop: 12, marginBottom: 0 }}>
            Target date: {goal.deadline}
          </p>
        )}
      </div>

      <h2 style={{ fontSize: "1.3rem", marginBottom: 12 }}>Log a deposit</h2>
      {depositError && <div className="form-error">{depositError}</div>}
      <form className="deposit-form" onSubmit={handleAddDeposit}>
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="btn" disabled={submitting}>
          {submitting ? "Adding…" : "Add deposit"}
        </button>
      </form>

      <h2 style={{ fontSize: "1.1rem", marginTop: 32 }}>History</h2>
      {goal.deposits.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 12 }}>
          <p style={{ margin: 0 }}>No deposits logged yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="deposit-list">
          {goal.deposits.map((d) => (
            <div className="deposit-item" key={d.id}>
              <div className="deposit-item-main">
                <span className="amount">{formatMoney(d.amount)}</span>
                {d.note && <span className="note">{d.note}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="date">{new Date(d.created_at).toLocaleDateString()}</span>
                <button className="icon-btn" onClick={() => handleDeleteDeposit(d.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
