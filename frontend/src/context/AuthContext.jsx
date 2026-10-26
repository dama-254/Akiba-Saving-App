import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("akiba_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("akiba_user");
    return raw ? JSON.parse(raw) : null;
  });

  const persist = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("akiba_token", nextToken);
    localStorage.setItem("akiba_user", JSON.stringify(nextUser));
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await api.login({ email, password });
      persist(data.token, data.user);
    },
    [persist]
  );

  const register = useCallback(
    async (name, email, password) => {
      const data = await api.register({ name, email, password });
      persist(data.token, data.user);
    },
    [persist]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("akiba_token");
    localStorage.removeItem("akiba_user");
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
