import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthAside from "../components/AuthAside";

export default function Login() {
  const { token, notice, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <AuthAside
        title="Welcome back"
        text="Log in to see your balance, move money and check your statement."
      />
      <div className="auth-main">
        <div className="auth-card">
          <h1>Log in</h1>
          <p className="sub">Enter your details to access your account.</p>
          {notice && <div className="form-note">{notice}</div>}
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </div>
            <button className="btn btn-block" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
          <p className="form-foot">
            New to Akiba? <Link to="/register">Open an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
// end of file
