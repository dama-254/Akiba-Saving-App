import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const initials = user
    ? user.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
    : "";

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">A</span>
          Akiba
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/statement">Statement</NavLink>
              <span className="nav-user">
                <span className="avatar">{initials}</span>
                <span className="nav-name">{user.name}</span>
              </span>
              <button className="link" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn-sm">
                Open an account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
// end of file
