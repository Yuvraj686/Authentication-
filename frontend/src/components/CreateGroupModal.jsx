import { useState } from "react";
import Button from "./Button";
import { createGroup } from "../api/groups";

export default function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Group name is required.");
    setLoading(true);
    setError("");
    try {
      const group = await createGroup(name.trim());
      onCreate(group);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <h2 className="modal-title">
          <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: "0.5rem", fontSize: "1.2rem" }}>group_add</span>
          Create New Group
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label">Group Name</label>
            <input
              id="modal-group-name"
              className="modal-input"
              placeholder="e.g. Product Design Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <p style={{ fontSize: "0.78rem", color: "#ffb4ab", marginBottom: "0.75rem", fontFamily: "var(--font-mono)" }}>
              {error}
            </p>
          )}

          <div className="modal-actions">
            <Button type="button" className="modal-btn modal-btn--ghost" onClick={onClose}>Cancel</Button>
            <Button
              id="modal-create-btn"
              type="submit"
              className="modal-btn modal-btn--primary"
              disabled={loading}
            >
              {loading ? "Creating…" : "Create Group"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
