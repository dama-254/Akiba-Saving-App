import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { formatMoney } from "../utils/money";
import Icon from "../components/Icons";
import TransactionItem from "../components/TransactionItem";
import TransactionModal from "../components/TransactionModal";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatAccountNumber(n) {
  return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const [account, setAccount] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hidden, setHidden] = useState(false);
  const [modal, setModal] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [acc, recent] = await Promise.all([
        api.getAccount(token),
        api.getTransactions(token, { limit: 6 }),
      ]);
      setAccount(acc);
      setTxns(recent.transactions);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(account.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available, nothing to do */
    }
  }

  const firstName = user.name.split(" ")[0];

  return (
    <div className="page">
      <div className="greeting">
        <h1>
          {greeting()}, {firstName}
        </h1>
        <p>Here is how your savings are doing.</p>
      </div>

      {error && (
        <div className="form-error">
          {error}{" "}
          <button className="btn btn-sm btn-ghost" onClick={load}>
            Try again
          </button>
        </div>
      )}

      <div className="dash-grid">
        <div>
          <div className="balance-card">
            <div className="balance-top">
              <span className="balance-label">Available balance</span>
              <button className="balance-toggle" onClick={() => setHidden((h) => !h)}>
                <Icon name={hidden ? "eye" : "eyeOff"} size={14} /> {hidden ? "Show" : "Hide"}
              </button>
            </div>

            {loading && !account && (
              <div className="skeleton" style={{ height: 56, margin: "18px 0", opacity: 0.25 }} />
            )}

            {account && (
              <>
                <div className="balance-amount">
                  <span className="cur">KES</span>
                  {hidden ? "\u2022\u2022\u2022\u2022\u2022\u2022" : formatMoney(account.balance_cents, { withCurrency: false })}
                </div>
                <div className="account-row">
                  <span className="account-chip">
                    Account {formatAccountNumber(account.account_number)}
                  </span>
                  <button className="copy-btn" onClick={copyNumber}>
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="actions">
            <button className="action-tile" onClick={() => setModal("deposit")} disabled={!account}>
              <span className="action-icon">
                <Icon name="down" />
              </span>
              Deposit
            </button>
            <button className="action-tile" onClick={() => setModal("withdraw")} disabled={!account}>
              <span className="action-icon">
                <Icon name="up" />
              </span>
              Withdraw
            </button>
            <button className="action-tile gold" onClick={() => setModal("transfer")} disabled={!account}>
              <span className="action-icon">
                <Icon name="send" />
              </span>
              Send
            </button>
          </div>
        </div>

        <section className="panel">
          <div className="panel-header">
            <h2>Recent activity</h2>
            <Link to="/statement">See all</Link>
          </div>
          {loading && txns.length === 0 ? (
            <div style={{ padding: "8px 0 16px" }}>
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
            </div>
          ) : txns.length === 0 ? (
            <div className="empty-state">
              <h3>No transactions yet</h3>
              <p>Make your first deposit to get started.</p>
            </div>
          ) : (
            txns.map((txn) => <TransactionItem key={txn.id} txn={txn} />)
          )}
        </section>
      </div>

      {modal && account && (
        <TransactionModal
          kind={modal}
          balanceCents={account.balance_cents}
          onClose={() => setModal(null)}
          onDone={load}
        />
      )}
    </div>
  );
}
// end of file
