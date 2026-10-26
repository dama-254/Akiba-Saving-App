import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api, setUnauthorizedHandler } from "../api/client";

const AuthContext = createContext(null);
const TOKEN_KEY = "akiba_token";
const USER_KEY = "akiba_user";
const EXPIRED_MESSAGE = "Your session expired. Please log in again.";

function tokenExpiry(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).exp * 1000;
  } catch {
    return 0;
  }
}

function readStored() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const raw = sessionStorage.getItem(USER_KEY);
  if (!token || !raw || tokenExpiry(token) <= Date.now()) return { token: null, user: null };
  try {
    return { token, user: JSON.parse(raw) };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStored);
  const [notice, setNotice] = useState("");

  const clear = useCallback((message = "") => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setAuth({ token: null, user: null });
    setNotice(message);
  }, []);

  const persist = useCallback((data) => {
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setAuth({ token: data.token, user: data.user });
    setNotice("");
  }, []);

  const login = useCallback(
    async (email, password) => persist(await api.login({ email, password })),
    [persist]
  );
  const register = useCallback(
    async (payload) => persist(await api.register(payload)),
    [persist]
  );
  const logout = useCallback(() => clear(""), [clear]);

  // If the server ever rejects our token, log out right away.
  useEffect(() => {
    setUnauthorizedHandler(() => clear(EXPIRED_MESSAGE));
    return () => setUnauthorizedHandler(null);
  }, [clear]);

  // Log out automatically the moment the token runs out.
  useEffect(() => {
    if (!auth.token) return;
    const msLeft = tokenExpiry(auth.token) - Date.now();
    const timer = setTimeout(() => clear(EXPIRED_MESSAGE), Math.max(msLeft, 0));
    return () => clearTimeout(timer);
  }, [auth.token, clear]);

  return (
    <AuthContext.Provider value={{ ...auth, notice, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
// end of file
