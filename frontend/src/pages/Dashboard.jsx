import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import GoalCard from "../components/GoalCard";

export default function Dashboard() {
  const { token } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let ignore = false;
    api
      .listGoals(token)
      .then((data) => {
        if (!ignore) setGoals(data);
      })
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [token]);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const goal = await api.createGoal(token, {
        title,
        target_amount: targetAmount,
        deadline: deadline || null,
      });
      setGoals((prev) => [goal, ...prev]);
      setTitle("");
      setTargetAmount("");
      setDeadline("");
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Your goals</h1>
          <p>Everything you're setting money aside for, in one place.</p>
        </div>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New goal"}
        </button>
      </div>

      {showForm && (
        <div className="form-panel">
          {formError && <div className="form-error">{formError}</div>}
          <form onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="title">What are you saving for?</label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New laptop"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="target">Target amount</label>
              <input
                id="target"
                type="number"
                min="1"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="800"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="deadline">Deadline (optional)</label>
              <input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <button className="btn" disabled={submitting}>
              {submitting ? "Saving…" : "Create goal"}
            </button>
          </form>
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      {!loading && goals.length === 0 && !showForm && (
        <div className="empty-state">
          <h3>No goals yet</h3>
          <p>Start with the smallest one — a target you can hit in a month builds the habit.</p>
        </div>
      )}

      <div className="goal-list">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
