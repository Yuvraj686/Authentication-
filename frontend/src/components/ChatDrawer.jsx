import Button from "./Button";
import { getInitials, formatDate } from "../utils";

export default function ChatDrawer({ activeGroup, activeDMUser, currentUserId, usersMap, users, onAddMember, onRemoveMember, onClose }) {
  const isGroup = !!activeGroup;

  if (isGroup) {
    const isAdmin = activeGroup.admin_id === currentUserId;
    const nonMembers = users.filter(u => !activeGroup.member_ids.includes(u.id));

    return (
      <div className="chat-drawer">
        <div className="drawer-header">
          <h3>Group Info</h3>
          <Button className="icon-btn" onClick={onClose} title="Close drawer">
            <span className="material-symbols-outlined">close</span>
          </Button>
        </div>

        <div className="drawer-content">
          <div className="drawer-section text-center">
            <div className="drawer-avatar-large">
              {getInitials(activeGroup.name)}
            </div>
            <h4 className="drawer-title">{activeGroup.name}</h4>
            <p className="drawer-subtitle">
              Created {formatDate(activeGroup.created_at)}
            </p>
          </div>

          <div className="drawer-section">
            <h5 className="drawer-section-title">Admin</h5>
            <p className="drawer-admin-name">
              {usersMap[activeGroup.admin_id] || `User …${activeGroup.admin_id.slice(-6)}`}
            </p>
          </div>

          <div className="drawer-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h5 className="drawer-section-title" style={{ margin: 0 }}>
                Members ({activeGroup.member_ids.length})
              </h5>
            </div>

            <div className="drawer-member-list">
              {activeGroup.member_ids.map(mid => {
                const username = usersMap[mid] || `User …${mid.slice(-6)}`;
                const isMemberAdmin = mid === activeGroup.admin_id;
                return (
                  <div key={mid} className="drawer-member-item">
                    <div className="drawer-member-avatar">
                      {getInitials(username)}
                    </div>
                    <div className="drawer-member-info">
                      <span className="drawer-member-name">{username}</span>
                      {isMemberAdmin && <span className="drawer-badge drawer-badge--admin">Admin</span>}
                    </div>
                    {isAdmin && !isMemberAdmin && (
                      <Button
                        className="icon-btn remove-member-btn"
                        title="Remove member"
                        onClick={() => onRemoveMember(mid)}
                        style={{ width: "1.75rem", height: "1.75rem" }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#ffb4ab" }}>person_remove</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {isAdmin && nonMembers.length > 0 && (
            <div className="drawer-section drawer-add-member">
              <h5 className="drawer-section-title">Add Member</h5>
              <div className="drawer-add-row">
                <select
                  id="select-add-member"
                  className="drawer-select"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onAddMember(e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="" disabled>Select a user...</option>
                  {nonMembers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    const joinedDate = activeDMUser.created_at
      ? new Date(activeDMUser.created_at).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })
      : "Recently";
    return (
      <div className="chat-drawer">
        <div className="drawer-header">
          <h3>User Profile</h3>
          <Button className="icon-btn" onClick={onClose} title="Close drawer">
            <span className="material-symbols-outlined">close</span>
          </Button>
        </div>

        <div className="drawer-content">
          <div className="drawer-section text-center">
            <div className="drawer-avatar-large" style={{ backgroundColor: "var(--c-primary-ctr)", color: "var(--c-on-primary)" }}>
              {getInitials(activeDMUser.username)}
            </div>
            <h4 className="drawer-title">{activeDMUser.username}</h4>
            <span className="drawer-badge" style={{ display: "inline-block", marginTop: "0.25rem", textTransform: "capitalize" }}>
              {activeDMUser.role}
            </span>
          </div>

          <div className="drawer-section">
            <h5 className="drawer-section-title">Email Address</h5>
            <p className="drawer-detail-value">{activeDMUser.email}</p>
          </div>

          <div className="drawer-section">
            <h5 className="drawer-section-title">Member Since</h5>
            <p className="drawer-detail-value">{joinedDate}</p>
          </div>

          <div className="drawer-section">
            <h5 className="drawer-section-title">User ID</h5>
            <p className="drawer-detail-value" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", wordBreak: "break-all" }}>
              {activeDMUser.id}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
