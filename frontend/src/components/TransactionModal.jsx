import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { formatMoney, formatDate } from "../utils/money";
import Icon from "./Icons";

const CONFIG = {
  deposit: { title: "Deposit money", button: "Deposit", needsPin: false, done: "Deposit successful" },
  withdraw: { title: "Withdraw money", button: "Withdraw", needsPin: true, done: "Withdrawal successful" },
  transfer: { title: "Send money", button: "Send money", needsPin: true, done: "Money sent" },
};

const AMOUNT_PATTERN = /^\d{1,7}(\.\d{1,2})?$/;
const LIMIT = 1000000;

export default function TransactionModal({ kind, balanceCents, onClose, onDone }) {
  const { token } = useAuth();
  const cfg = CONFIG[kind];
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const value = Number(amount);

    if (!AMOUNT_PATTERN.test(amount) || value <= 0) {
      return setError("Enter a valid amount, for example 1500 or 1500.50.");
    }
    if (value > LIMIT) {
      return setError("The limit is KES 1,000,000 per transaction.");
    }
    if (kind !== "deposit" && Math.round(value * 100) > balanceCents) {
      return setError("You do not have enough money in your account for that.");
    }
    if (kind === "transfer" && !/^\d{10}$/.test(toAccount)) {
      return setError("Enter the recipient's 10-digit account number.");
    }
    if (cfg.needsPin && pin.length !== 4) {
      return setError("Enter your 4-digit PIN.");
    }

    setLoading(true);
    try {
      const payload = { amount, description: description.trim() };
      if (cfg.needsPin) payload.pin = pin;

      let result;
      if (kind === "deposit") result = await api.deposit(token, payload);
      else if (kind === "withdraw") result = await api.withdraw(token, payload);
      else result = await api.transfer(token, { ...payload, to_account: toAccount });

      setReceipt(result);
      onDone();
    } catch (err) {
      setError(err.message);
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  function closeIfBackdrop(e) {
    if (e.target === e.currentTarget && !loading) onClose();
  }

  return (
    <div className="modal-backdrop" onMouseDown={closeIfBackdrop}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={cfg.title}>
        {receipt ? (
          <div className="receipt">
            <div className="receipt-check">
              <Icon name="check" size={30} />
            </div>
            <h2>{cfg.done}</h2>
            <div className="receipt-amount">{formatMoney(receipt.transaction.amount_cents)}</div>
            <div className="receipt-rows">
              {receipt.transaction.counterparty_account && (
                <div className="receipt-row">
                  <span>To account</span>
                  <span>{receipt.transaction.counterparty_account}</span>
                </div>
              )}
              <div className="receipt-row">
                <span>Reference</span>
                <span>{receipt.transaction.reference}</span>
              </div>
              <div className="receipt-row">
                <span>Date</span>
                <span>{formatDate(receipt.transaction.created_at)}</span>
              </div>
              <div className="receipt-row">
                <span>New balance</span>
                <span>{formatMoney(receipt.balance_cents)}</span>
              </div>
            </div>
            <button className="btn btn-block" onClick={onClose} autoFocus>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h2>{cfg.title}</h2>
              <button className="modal-close" onClick={onClose} aria-label="Close" disabled={loading}>
                &times;
              </button>
            </div>
            {kind !== "deposit" && (
              <p className="muted" style={{ marginTop: 0 }}>
                Available: {formatMoney(balanceCents)}
              </p>
            )}
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              {kind === "transfer" && (
                <div className="field">
                  <label htmlFor="to">Recipient account number</label>
                  <input
                    id="to"
                    inputMode="numeric"
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10 digits"
                    autoComplete="off"
                    autoFocus
                    required
                  />
                </div>
              )}
              <div className="field">
                <label htmlFor="amount">Amount</label>
                <div className="amount-input">
                  <span>KES</span>
                  <input
                    id="amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    autoComplete="off"
                    autoFocus={kind !== "transfer"}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="desc">Note (optional)</label>
                <input
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={100}
                  autoComplete="off"
                />
              </div>
              {cfg.needsPin && (
                <div className="field">
                  <label htmlFor="pin">Your PIN</label>
                  <input
                    id="pin"
                    className="pin-input"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button className="btn btn-block" disabled={loading}>
                  {loading ? "Please wait..." : cfg.button}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
// end of file
