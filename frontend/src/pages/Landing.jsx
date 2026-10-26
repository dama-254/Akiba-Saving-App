import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="page">
      <div className="landing-hero">
        <h1>Name the thing you're saving for. Watch it get closer.</h1>
        <p>
          Akiba turns a vague intention into a number that moves. Set a
          target, log what you put aside, and see exactly how far you've
          come toward the laptop, the deposit, the trip, the emergency fund.
        </p>
        <div className="landing-actions">
          <Link to="/register" className="btn">
            Start saving
          </Link>
          <Link to="/login" className="btn btn-ghost">
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}
