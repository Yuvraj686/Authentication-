import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import App from "./App.jsx";

/**
 * main.jsx — application entry point.
 *
 * <AuthProvider> wraps everything so that any component in the tree
 * can call useAuth() to read or update authentication state.
 * The router (inside <App>) also relies on AuthContext for route guards.
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
