import { useState, useEffect } from "react";
import "./auth.css";

const API_BASE = "http://127.0.0.1:8000";

async function apiRegister({ username, email, password, role = "user" }) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Registration failed");
  return data;
}

async function apiLogin({ email, password }) {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed");
  return data;
}

function useMouseGlow() {
  useEffect(() => {
    const handler = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty("--mouse-x", `${x}%`);
      document.documentElement.style.setProperty("--mouse-y", `${y}%`);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
}

function InputField({ id, label, icon, type = "text", placeholder, value, onChange, showToggle, autoComplete }) {
  const [visible, setVisible] = useState(false);
  const inputType = showToggle ? (visible ? "text" : "password") : type;

  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-field__label">{label}</label>
      <div className="auth-field__wrapper">
        <span className="material-symbols-outlined auth-field__icon" aria-hidden="true">{icon}</span>
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="auth-field__input"
          autoComplete={autoComplete}
          required
        />
        {showToggle && (
          <button
            type="button"
            className="auth-field__toggle"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            <span className="material-symbols-outlined">
              {visible ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function FeedbackBanner({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={type === "success" ? "auth-success-msg" : "auth-error-msg"} role="alert">
      <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
        {type === "success" ? "check_circle" : "error"}
      </span>
      {msg}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="auth-social-icon" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="auth-social-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

export default function AuthPage({ onAuthSuccess }) {
  useMouseGlow();

  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ msg: "", type: "" });

  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState("user");

  const setError   = (msg) => setFeedback({ msg, type: "error" });
  const setSuccess = (msg) => setFeedback({ msg, type: "success" });
  const clearFb    = ()    => setFeedback({ msg: "", type: "" });

  const switchMode = (m) => {
    setMode(m);
    setUsername(""); setEmail(""); setPassword(""); setRole("user");
    clearFb();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true); clearFb();
    try {
      const data = await apiLogin({ email, password });
      localStorage.setItem("access_token", data.access_token);
      setSuccess("Login successful! Redirecting…");
      setTimeout(() => onAuthSuccess?.(data.access_token), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) return setError("Please fill in all required fields.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true); clearFb();
    try {
      await apiRegister({ username, email, password, role });
      setSuccess("Account created! Please sign in.");
      setTimeout(() => switchMode("login"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-mouse-glow" />

      <div className="auth-card">

        <div className="auth-form-panel">

          <div className="auth-brand">
            <h1 className="auth-brand__title">AetherChat</h1>
            <p className="auth-brand__sub">
              {mode === "login"
                ? "Sign in to access the network."
                : "Create an account to join the network."}
            </p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              id="tab-login"
              role="tab"
              aria-selected={mode === "login"}
              className={`auth-tab${mode === "login" ? " auth-tab--active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              role="tab"
              aria-selected={mode === "signup"}
              className={`auth-tab${mode === "signup" ? " auth-tab--active" : ""}`}
              onClick={() => switchMode("signup")}
            >
              Create Account
            </button>
          </div>

          {mode === "login" && (
            <form onSubmit={handleLogin} className="auth-form" noValidate>
              <FeedbackBanner msg={feedback.msg} type={feedback.type} />

              <InputField
                id="login-email"
                label="Email or Username"
                icon="mail"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
              <InputField
                id="login-password"
                label="Password"
                icon="lock"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                showToggle
                autoComplete="current-password"
              />

              <div className="auth-form__actions">
                <a href="#" className="auth-link auth-link--sm">Forgot password?</a>
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                className="auth-btn-primary"
                disabled={loading}
              >
                {loading
                  ? <span className="auth-spinner" />
                  : <><span>Sign In</span><span className="material-symbols-outlined">arrow_forward</span></>
                }
              </button>

              <div className="auth-divider">
                <span className="auth-divider__line" />
                <span className="auth-divider__text">Or continue with</span>
                <span className="auth-divider__line" />
              </div>

              <div className="auth-social-grid">
                <button type="button" id="btn-google-login" className="auth-btn-ghost" disabled title="Coming soon">
                  <GoogleIcon /> Google
                </button>
                <button type="button" id="btn-github-login" className="auth-btn-ghost" disabled title="Coming soon">
                  <GitHubIcon /> GitHub
                </button>
              </div>

              <p className="auth-switch-text">
                Don&apos;t have an account?{" "}
                <button type="button" className="auth-link" onClick={() => switchMode("signup")}>
                  Sign up here
                </button>
              </p>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="auth-form" noValidate>
              <FeedbackBanner msg={feedback.msg} type={feedback.type} />

              <InputField
                id="signup-username"
                label="Username"
                icon="person"
                placeholder="john_doe"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
              <InputField
                id="signup-email"
                label="Email Address"
                icon="mail"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
              <InputField
                id="signup-password"
                label="Password"
                icon="lock"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                showToggle
                autoComplete="new-password"
              />

              <div className="auth-field">
                <label htmlFor="signup-role" className="auth-field__label">Role</label>
                <div className="auth-field__wrapper">
                  <span className="material-symbols-outlined auth-field__icon" aria-hidden="true">badge</span>
                  <select
                    id="signup-role"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="auth-field__input auth-field__select"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                id="btn-signup-submit"
                className="auth-btn-primary"
                disabled={loading}
              >
                {loading
                  ? <span className="auth-spinner" />
                  : <><span>Create Account</span><span className="material-symbols-outlined">arrow_forward</span></>
                }
              </button>

              <p className="auth-switch-text">
                Already have an account?{" "}
                <button type="button" className="auth-link" onClick={() => switchMode("login")}>
                  Sign in here
                </button>
              </p>
            </form>
          )}
        </div>

        <div className="auth-deco-panel" aria-hidden="true">
          <div className="auth-deco-panel__bg" />
          <div className="auth-deco-panel__overlay-bottom" />
          <div className="auth-deco-panel__overlay-tint" />
          <div className="auth-deco-panel__content">
            <div className="auth-deco-panel__watermark">Æ</div>
            <div className="auth-deco-card">
              <span className="auth-deco-card__tag">Platform Access</span>
              <h2 className="auth-deco-card__title">Immersive Communication</h2>
              <p className="auth-deco-card__body">
                Experience deep, layered obsidian environments with vibrant electric accents.
                Engineered for speed and precision.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
