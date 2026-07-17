import { createContext, useContext, useState } from "react";

/**
 * AuthContext — global authentication state.
 *
 * Provides:
 *   token          — the raw JWT string (or null)
 *   isAuthenticated — derived boolean
 *   login(token)   — persist token to localStorage + update state
 *   logout()       — clear token from localStorage + update state
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialise from localStorage so refreshing the page keeps the session alive
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));

  const login = (accessToken) => {
    localStorage.setItem("access_token", accessToken);
    setToken(accessToken);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
  };

  const value = {
    token,
    isAuthenticated: Boolean(token),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — consume the AuthContext.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
}
