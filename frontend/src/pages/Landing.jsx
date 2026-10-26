import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icons";

export default function Landing() {
  const { token } = useAuth();
  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <div className="page">
      <section className="hero">
        <div>
          <span className="hero-eyebrow">
            <Icon name="shield" size={16} /> Safe, simple savings
          </span>
          <h1>
            Save with confidence. Watch your money <em>grow</em>.
          </h1>
          <p className="lead">
            Open a savings account in a minute. Deposit, send money to other
            customers and see every shilling on your statement, all protected by
            your password and a private PIN.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-gold">
              Open an account
            </Link>
            <Link to="/login" className="btn btn-ghost">
              Log in
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="balance-card">
            <div className="balance-top">
              <span className="balance-label">Sample balance</span>
            </div>
            <div className="balance-amount">
              <span className="cur">KES</span>48,250.00
            </div>
            <div className="account-row">
              <span className="account-chip">Account 0482 913 775</span>
            </div>
          </div>
          <div className="float-chip">
            <span className="txn-icon in">
              <Icon name="down" size={18} />
            </span>
            <div>
              <b>+ KES 2,500.00</b>
              <br />
              received just now
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <div className="f-icon">
            <Icon name="lock" />
          </div>
          <h3>Secure by design</h3>
          <p>
            Passwords and PINs are hashed, never stored as-is. Repeated wrong
            attempts lock the account.
          </p>
        </div>
        <div className="feature">
          <div className="f-icon">
            <Icon name="bolt" />
          </div>
          <h3>Instant transfers</h3>
          <p>
            Send money to any Akiba account number. Both sides update together,
            or not at all.
          </p>
        </div>
        <div className="feature">
          <div className="f-icon">
            <Icon name="list" />
          </div>
          <h3>A clear statement</h3>
          <p>
            Every deposit, withdrawal and transfer gets its own reference and
            running balance.
          </p>
        </div>
      </section>

      <p className="demo-note">
        Akiba is a practice banking app built for learning. Balances are
        simulated, so no real money is held or moved.
      </p>
    </div>
  );
}
// end of file
