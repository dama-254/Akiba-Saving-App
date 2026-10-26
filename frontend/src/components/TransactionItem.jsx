import Icon from "./Icons";
import { formatMoney, formatDate } from "../utils/money";

const KINDS = {
  deposit: { label: "Deposit", icon: "down", dir: "in" },
  withdrawal: { label: "Withdrawal", icon: "up", dir: "out" },
  transfer_in: { label: "Received", icon: "down", dir: "in" },
  transfer_out: { label: "Sent", icon: "send", dir: "out" },
};

export default function TransactionItem({ txn }) {
  const meta = KINDS[txn.kind] || KINDS.deposit;
  const when = formatDate(txn.created_at);
  const sub = txn.counterparty_account
    ? `${meta.dir === "in" ? "From" : "To"} ${txn.counterparty_account} \u00b7 ${when}`
    : when;

  return (
    <div className="txn">
      <span className={`txn-icon ${meta.dir}`}>
        <Icon name={meta.icon} size={18} />
      </span>
      <div className="txn-body">
        <div className="txn-title">{txn.description || meta.label}</div>
        <div className="txn-sub">{sub}</div>
      </div>
      <div className={`txn-amount ${meta.dir}`}>
        {meta.dir === "in" ? "+" : "-"} {formatMoney(txn.amount_cents)}
        <span className="txn-balance">Balance {formatMoney(txn.balance_after_cents)}</span>
      </div>
    </div>
  );
}
// end of file
