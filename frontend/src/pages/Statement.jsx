import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import TransactionItem from "../components/TransactionItem";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Deposits", value: "deposit" },
  { label: "Withdrawals", value: "withdrawal" },
  { label: "Sent", value: "transfer_out" },
  { label: "Received", value: "transfer_in" },
];
const PAGE_SIZE = 15;

export default function Statement() {
  const { token } = useAuth();
  const [kind, setKind] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    api
      .getTransactions(token, { limit: PAGE_SIZE, offset: 0, kind })
      .then((data) => {
        if (ignore) return;
        setItems(data.transactions);
        setTotal(data.total);
      })
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [token, kind]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const data = await api.getTransactions(token, { limit: PAGE_SIZE, offset: items.length, kind });
      setItems((prev) => [...prev, ...data.transactions]);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Statement</h1>
          <p>Every transaction on your account, newest first.</p>
        </div>
      </div>

      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`chip${kind === f.value ? " active" : ""}`}
            onClick={() => setKind(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}

      <section className="panel">
        {loading ? (
          <div style={{ padding: "16px 0" }}>
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" />
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing here yet</h3>
            <p>Transactions that match this filter will show up here.</p>
          </div>
        ) : (
          items.map((txn) => <TransactionItem key={txn.id} txn={txn} />)
        )}
        {!loading && items.length < total && (
          <div className="load-more">
            <button className="btn btn-ghost" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : `Show more (${total - items.length} left)`}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
// end of file
