import { useState, useEffect } from "react";
import "./auth.css";
import { apiRegister, apiLogin } from "./api/auth";
import Button from "./components/Button";
import InputField from "./components/InputField";
import FeedbackBanner from "./components/FeedbackBanner";
import GoogleIcon from "./components/GoogleIcon";
import GitHubIcon from "./components/GitHubIcon";

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
            <Button
              id="tab-login"
              role="tab"
              aria-selected={mode === "login"}
              className={`auth-tab${mode === "login" ? " auth-tab--active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Sign In
            </Button>
            <Button
              id="tab-signup"
              role="tab"
              aria-selected={mode === "signup"}
              className={`auth-tab${mode === "signup" ? " auth-tab--active" : ""}`}
              onClick={() => switchMode("signup")}
            >
              Create Account
            </Button>
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

              <Button
                type="submit"
                id="btn-login-submit"
                className="auth-btn-primary"
                disabled={loading}
              >
                {loading
                  ? <span className="auth-spinner" />
                  : <><span>Sign In</span><span className="material-symbols-outlined">arrow_forward</span></>
                }
              </Button>

              <div className="auth-divider">
                <span className="auth-divider__line" />
                <span className="auth-divider__text">Or continue with</span>
                <span className="auth-divider__line" />
              </div>

              <div className="auth-social-grid">
                <Button type="button" id="btn-google-login" className="auth-btn-ghost" disabled title="Coming soon">
                  <GoogleIcon /> Google
                </Button>
                <Button type="button" id="btn-github-login" className="auth-btn-ghost" disabled title="Coming soon">
                  <GitHubIcon /> GitHub
                </Button>
              </div>

              <p className="auth-switch-text">
                Don&apos;t have an account?{" "}
                <Button type="button" className="auth-link" onClick={() => switchMode("signup")}>
                  Sign up here
                </Button>
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

              <Button
                type="submit"
                id="btn-signup-submit"
                className="auth-btn-primary"
                disabled={loading}
              >
                {loading
                  ? <span className="auth-spinner" />
                  : <><span>Create Account</span><span className="material-symbols-outlined">arrow_forward</span></>
                }
              </Button>

              <p className="auth-switch-text">
                Already have an account?{" "}
                <Button type="button" className="auth-link" onClick={() => switchMode("login")}>
                  Sign in here
                </Button>
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
