import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-mark">
          akiba<em>.</em>
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              <Link to="/dashboard">Goals</Link>
              <span className="nav-user">{user.name}</span>
              <button onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Create account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
