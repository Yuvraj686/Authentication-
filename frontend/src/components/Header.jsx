import Button from "./Button";
import { getInitials } from "../utils";

export default function Header({ activeTab, wsStatus, currentUserInitials, onTabChange, onLogout }) {
  return (
    <nav className="chat-nav">
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div className="chat-nav__logo">ChatFlow</div>
        <div className="chat-nav__links">
          <Button
            className={`chat-nav__link${activeTab === "messages" ? " chat-nav__link--active" : ""}`}
            onClick={() => onTabChange("messages")}
          >
            Messages
          </Button>
          <Button
            className={`chat-nav__link${activeTab === "groups" ? " chat-nav__link--active" : ""}`}
            onClick={() => onTabChange("groups")}
          >
            Groups
          </Button>
          <Button className="chat-nav__link" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>Files</Button>
          <Button className="chat-nav__link" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>Settings</Button>
        </div>
      </div>
      <div className="chat-nav__actions">
        <span
          title={wsStatus === "open" ? "Connected (live)" : "Reconnecting…"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            fontSize: "0.7rem",
            fontFamily: "var(--font-mono)",
            color: wsStatus === "open" ? "#4ade80" : "#facc15",
            opacity: 0.85,
          }}
        >
          <span style={{
            width: "0.45rem",
            height: "0.45rem",
            borderRadius: "50%",
            backgroundColor: wsStatus === "open" ? "#4ade80" : "#facc15",
            boxShadow: wsStatus === "open" ? "0 0 6px #4ade80" : "0 0 6px #facc15",
            animation: wsStatus === "open" ? "none" : "pulse 1.2s ease infinite",
          }} />
          {wsStatus === "open" ? "Live" : "Reconnecting"}
        </span>
        <Button
          id="btn-logout-chat"
          className="icon-btn"
          title="Sign out"
          onClick={onLogout}
        >
          <span className="material-symbols-outlined">logout</span>
        </Button>
        <div className="chat-nav__avatar" title="Profile">
          {currentUserInitials}
        </div>
      </div>
    </nav>
  );
}
