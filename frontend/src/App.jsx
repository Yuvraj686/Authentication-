import { useState } from "react";
import AuthPage from "./AuthPage";
import GroupChatPage from "./GroupChatPage";
import "./auth.css";

function decodeJWT(token) {
  try { return JSON.parse(atob(token.split(".")[1])); }
  catch { return {}; }
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));

  const handleAuthSuccess = (accessToken) => {
    setToken(accessToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
  };

  if (!token) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return <GroupChatPage onLogout={handleLogout} />;
}
