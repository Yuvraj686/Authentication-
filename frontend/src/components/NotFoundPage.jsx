import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * NotFoundPage — catch-all 404 route.
 * Styled to match AetherChat's dark obsidian aesthetic.
 */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleHome = () => navigate(isAuthenticated ? "/chat" : "/auth", { replace: true });

  return (
    <div style={styles.page}>
      {/* Ambient glow */}
      <div style={styles.glow} />

      <div style={styles.card}>
        <div style={styles.code}>404</div>
        <div style={styles.watermark}>Æ</div>
        <h1 style={styles.title}>Page Not Found</h1>
        <p style={styles.body}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <button style={styles.btn} onClick={handleHome}>
          <span style={styles.arrow}>←</span>
          {isAuthenticated ? "Back to Chat" : "Go to Sign In"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(ellipse at 60% 40%, #0d1117 60%, #0a0f1a 100%)",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    textAlign: "center",
    padding: "3rem 2.5rem",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "1.5rem",
    backdropFilter: "blur(12px)",
    maxWidth: "420px",
    width: "90%",
  },
  watermark: {
    position: "absolute",
    top: "-1.5rem",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "5rem",
    fontWeight: 900,
    color: "rgba(99,102,241,0.08)",
    lineHeight: 1,
    userSelect: "none",
    pointerEvents: "none",
  },
  code: {
    fontSize: "6rem",
    fontWeight: 900,
    lineHeight: 1,
    background: "linear-gradient(135deg, #6366f1, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.5rem",
  },
  title: {
    color: "#e2e8f0",
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "0 0 0.75rem",
  },
  body: {
    color: "#64748b",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    margin: "0 0 2rem",
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.75rem",
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    color: "#fff",
    border: "none",
    borderRadius: "0.75rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.15s",
  },
  arrow: {
    fontSize: "1.1rem",
  },
};
