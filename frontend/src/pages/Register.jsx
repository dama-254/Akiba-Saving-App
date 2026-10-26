import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthAside from "../components/AuthAside";

export default function Register() {
  const { token, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    pin: "",
    confirmPin: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }
  function updatePin(field) {
    return (e) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value.replace(/\D/g, "").slice(0, 4) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      return setError("Your password needs at least 8 characters.");
    }
    if (form.pin.length !== 4) {
      return setError("Your PIN must be exactly 4 digits.");
    }
    if (form.pin !== form.confirmPin) {
      return setError("The two PINs do not match.");
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        pin: form.pin,
      });
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
        title="Open your Akiba savings account"
        text="It takes a minute. You get an account number straight away and can start saving right after."
      />
      <div className="auth-main">
        <div className="auth-card">
          <h1>Create your account</h1>
          <p className="sub">Tell us a little about you, then set a password and PIN.</p>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" value={form.name} onChange={update("name")} autoComplete="name" required />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={form.email} onChange={update("email")} autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={form.password} onChange={update("password")} autoComplete="new-password" required />
              <div className="field-hint">At least 8 characters.</div>
            </div>
            <div className="field">
              <label htmlFor="pin">4-digit PIN</label>
              <input id="pin" className="pin-input" type="password" inputMode="numeric" autoComplete="off" value={form.pin} onChange={updatePin("pin")} required />
              <div className="field-hint">Used to approve withdrawals and transfers. Do not share it.</div>
            </div>
            <div className="field">
              <label htmlFor="confirmPin">Confirm PIN</label>
              <input id="confirmPin" className="pin-input" type="password" inputMode="numeric" autoComplete="off" value={form.confirmPin} onChange={updatePin("confirmPin")} required />
            </div>
            <button className="btn btn-block" disabled={loading}>
              {loading ? "Opening your account..." : "Open my account"}
            </button>
          </form>
          <p className="form-foot">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
// end of file
