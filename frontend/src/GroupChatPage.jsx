import { useState, useEffect, useRef, useCallback } from "react";
import "./chat.css";

const API_BASE = "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
    ...opts,
  });
  if (res.status === 401) {
    localStorage.removeItem("access_token");
    window.location.reload();
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

const fetchGroups = () => apiFetch("/groups/");
const fetchMessages = (groupId) => apiFetch(`/groups/${groupId}/messages`);
const createGroup = (name) =>
  apiFetch("/groups/", { method: "POST", body: JSON.stringify({ name, member_ids: [] }) });
const sendGroupMessage = (groupId, content) =>
  apiFetch(`/groups/${groupId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

const fetchAllUsers = () => apiFetch("/user/all");
const fetchDMMessages = (userId) => apiFetch(`/messages/conversation/${userId}`);
const sendDM = (receiverId, content) =>
  apiFetch("/messages/send", {
    method: "POST",
    body: JSON.stringify({ receiver_id: receiverId, content }),
  });
const addGroupMember = (groupId, userId) =>
  apiFetch(`/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
const removeGroupMember = (groupId, userId) =>
  apiFetch(`/groups/${groupId}/members/${userId}`, { method: "DELETE" });

function getInitials(name = "") {
  return name
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function CreateGroupModal({ onClose, onCreate }) {
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
            <button type="button" className="modal-btn modal-btn--ghost" onClick={onClose}>Cancel</button>
            <button
              id="modal-create-btn"
              type="submit"
              className="modal-btn modal-btn--primary"
              disabled={loading}
            >
              {loading ? "Creating…" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ msg, currentUserId, isFirstInGroup, usersMap }) {
  const isSent = msg.sender_id === currentUserId;
  const senderName = usersMap[msg.sender_id] || msg.sender_username || `User …${msg.sender_id.slice(-6)}`;

  return (
    <div className={`msg-group${isSent ? " msg-group--sent" : ""}`}>
      {!isSent && (
        <div className="msg-avatar">
          {getInitials(senderName)}
        </div>
      )}
      <div className={`msg-col${isSent ? " msg-col--sent" : ""}`}>
        {!isSent && isFirstInGroup && (
          <span className="msg-sender">
            {senderName}
          </span>
        )}
        <div className={`msg-bubble ${isSent ? "msg-bubble--sent" : "msg-bubble--received"}`}>
          {msg.content}
        </div>
        <span className="msg-time">
          {formatTime(msg.created_at)}
          {isSent && (
            <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", color: "var(--c-primary)" }}>done_all</span>
          )}
        </span>
      </div>
    </div>
  );
}

function ChatDrawer({ activeGroup, activeDMUser, currentUserId, usersMap, users, onAddMember, onRemoveMember, onClose }) {
  const isGroup = !!activeGroup;

  if (isGroup) {
    const isAdmin = activeGroup.admin_id === currentUserId;
    const nonMembers = users.filter(u => !activeGroup.member_ids.includes(u.id));

    return (
      <div className="chat-drawer">
        <div className="drawer-header">
          <h3>Group Info</h3>
          <button className="icon-btn" onClick={onClose} title="Close drawer">
            <span className="material-symbols-outlined">close</span>
          </button>
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
                      <button
                        className="icon-btn remove-member-btn"
                        title="Remove member"
                        onClick={() => onRemoveMember(mid)}
                        style={{ width: "1.75rem", height: "1.75rem" }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#ffb4ab" }}>person_remove</span>
                      </button>
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
    const joinedDate = activeDMUser.created_at ? new Date(activeDMUser.created_at).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" }) : "Recently";
    return (
      <div className="chat-drawer">
        <div className="drawer-header">
          <h3>User Profile</h3>
          <button className="icon-btn" onClick={onClose} title="Close drawer">
            <span className="material-symbols-outlined">close</span>
          </button>
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

export default function GroupChatPage({ onLogout }) {
  const token = localStorage.getItem("access_token");
  const { user_id: currentUserId } = decodeJWT(token);

  const [activeTab, setActiveTab] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  const [activeGroup, setActiveGroup] = useState(null);
  const [activeDMUser, setActiveDMUser] = useState(null);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [wsStatus, setWsStatus] = useState("connecting");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectDelay = useRef(1000);

  const activeGroupRef = useRef(activeGroup);
  const activeDMUserRef = useRef(activeDMUser);
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeGroupRef.current = activeGroup; }, [activeGroup]);
  useEffect(() => { activeDMUserRef.current = activeDMUser; }, [activeDMUser]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws?token=${token}`);
    wsRef.current = ws;
    setWsStatus("connecting");

    ws.onopen = () => {
      setWsStatus("open");
      reconnectDelay.current = 1000;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const tab = activeTabRef.current;
        const group = activeGroupRef.current;
        const dmUser = activeDMUserRef.current;

        if (msg.type === "group_message") {
          // Only append if the user is currently viewing this group
          if (tab === "groups" && group && group.id === msg.group_id) {
            setMessages((prev) => {
              const optimIdx = prev.findIndex(
                (m) => m.optimistic && m.sender_id === msg.sender_id && m.content === msg.content
              );
              if (optimIdx !== -1) {
                const next = [...prev];
                next[optimIdx] = msg;
                return next;
              }
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        } else if (msg.type === "dm_message") {
          if (tab === "messages" && dmUser) {
            const { user_id: myId } = decodeJWT(localStorage.getItem("access_token"));
            const isRelevant =
              (msg.sender_id === myId && msg.receiver_id === dmUser.id) ||
              (msg.sender_id === dmUser.id && msg.receiver_id === myId);
            if (isRelevant) {
              setMessages((prev) => {
                const optimIdx = prev.findIndex(
                  (m) => m.optimistic && m.sender_id === msg.sender_id && m.content === msg.content
                );
                if (optimIdx !== -1) {
                  const next = [...prev];
                  next[optimIdx] = msg;
                  return next;
                }
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
            }
          }
        }
      } catch (e) {
        console.warn("WS parse error", e);
      }
    };

    ws.onclose = () => {
      setWsStatus("closed");
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
        connectWebSocket();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    (async () => {
      setLoadingGroups(true);
      try {
        const [groupsData, usersData] = await Promise.all([
          fetchGroups(),
          fetchAllUsers()
        ]);
        setGroups(groupsData || []);
        setUsers(usersData || []);
        const mapping = {};
        (usersData || []).forEach(u => {
          mapping[u.id] = u.username;
        });
        setUsersMap(mapping);
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoadingGroups(false);
      }
    })();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = useCallback(async () => {
    if (activeTab === "groups" && activeGroup) {
      try {
        const data = await fetchMessages(activeGroup.id);
        setMessages(data || []);
      } catch {
        setMessages([]);
      }
    } else if (activeTab === "messages" && activeDMUser) {
      try {
        const data = await fetchDMMessages(activeDMUser.id);
        setMessages(data || []);
      } catch {
        setMessages([]);
      }
    }
  }, [activeTab, activeGroup, activeDMUser]);

  useEffect(() => {
    setMessages([]);

    if ((activeTab === "groups" && activeGroup) || (activeTab === "messages" && activeDMUser)) {
      setLoadingMsgs(true);
      loadMessages().finally(() => setLoadingMsgs(false));
    }
  }, [activeGroup, activeDMUser, activeTab, loadMessages]);

  const selectGroup = (group) => {
    setShowGroupInfo(false);
    setActiveGroup(group);
  };

  const selectDMUser = (user) => {
    setShowGroupInfo(false);
    setActiveDMUser(user);
  };

  const handleSend = async () => {
    if (!inputText.trim() || sendingMsg) return;
    if (activeTab === "groups" && !activeGroup) return;
    if (activeTab === "messages" && !activeDMUser) return;

    const text = inputText.trim();
    setInputText("");

    const optimistic = {
      id: `opt-${Date.now()}`,
      sender_id: currentUserId,
      content: text,
      created_at: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    setSendingMsg(true);
    try {
      if (activeTab === "groups") {
        await sendGroupMessage(activeGroup.id, text);
      } else {
        await sendDM(activeDMUser.id, text);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAddMember = async (userId) => {
    if (!activeGroup) return;
    try {
      const updated = await addGroupMember(activeGroup.id, userId);
      setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
      setActiveGroup(updated);
    } catch (err) {
      alert(err.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!activeGroup) return;
    try {
      await removeGroupMember(activeGroup.id, userId);
      const updated = await apiFetch(`/groups/${activeGroup.id}`);
      setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
      setActiveGroup(updated);
    } catch (err) {
      alert(err.message || "Failed to remove member");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInputText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 128) + "px";
    }
  };

  const handleGroupCreated = (group) => {
    setGroups((prev) => [group, ...prev]);
    selectGroup(group);
  };

  const groupedByDate = messages.reduce((acc, msg) => {
    const dateKey = formatDate(msg.created_at);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  const displayedUsers = users.filter(u => u.id !== currentUserId);

  return (
    <div className="chat-page">
      <nav className="chat-nav">
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div className="chat-nav__logo">ChatFlow</div>
          <div className="chat-nav__links">
            <button
              className={`chat-nav__link${activeTab === "messages" ? " chat-nav__link--active" : ""}`}
              onClick={() => {
                setActiveTab("messages");
                setActiveGroup(null);
              }}
            >
              Messages
            </button>
            <button
              className={`chat-nav__link${activeTab === "groups" ? " chat-nav__link--active" : ""}`}
              onClick={() => {
                setActiveTab("groups");
                setActiveDMUser(null);
              }}
            >
              Groups
            </button>
            <button className="chat-nav__link" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>Files</button>
            <button className="chat-nav__link" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>Settings</button>
          </div>
        </div>
        <div className="chat-nav__actions">
          {/* WebSocket live indicator */}
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
          <button
            id="btn-logout-chat"
            className="icon-btn"
            title="Sign out"
            onClick={onLogout}
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
          <div className="chat-nav__avatar" title="Profile">
            {getInitials(usersMap[currentUserId] || "Me")}
          </div>
        </div>
      </nav>

      <div className="chat-workspace">

        <aside className="chat-sidebar">
          <div>
            <h2 className="chat-sidebar__heading">
              {activeTab === "groups" ? "Groups" : "Direct Messages"}
            </h2>
            <p className="chat-sidebar__sub">
              {activeTab === "groups"
                ? (loadingGroups ? "Loading…" : `${groups.length} group${groups.length !== 1 ? "s" : ""}`)
                : (loadingGroups ? "Loading…" : `${displayedUsers.length} user${displayedUsers.length !== 1 ? "s" : ""}`)
              }
            </p>
          </div>

          {activeTab === "groups" && (
            <button
              id="btn-create-group"
              className="chat-sidebar__new-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>add</span>
              New Group
            </button>
          )}

          <div style={{ flex: 1, overflowY: "auto", marginTop: activeTab === "messages" ? "1rem" : "0" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--c-secondary)", marginBottom: "0.5rem", paddingLeft: "0.5rem" }}>
              {activeTab === "groups" ? "Your Groups" : "All Users"}
            </p>

            {loadingGroups ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <div className="chat-spinner" style={{ width: "1.5rem", height: "1.5rem" }} />
              </div>
            ) : activeTab === "groups" ? (
              groups.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--c-secondary)", textAlign: "center", padding: "1rem", fontFamily: "var(--font-mono)" }}>
                  No groups yet.<br />Create one above!
                </p>
              ) : (
                groups.map((g) => (
                  <div
                    key={g.id}
                    className={`group-item${activeGroup?.id === g.id ? " group-item--active" : ""}`}
                    onClick={() => selectGroup(g)}
                    id={`group-item-${g.id}`}
                  >
                    <div className="group-avatar group-avatar--online">
                      {getInitials(g.name)}
                    </div>
                    <div className="group-item__meta">
                      <div className="group-item__name">{g.name}</div>
                      <div className="group-item__preview">
                        {g.member_ids.length} member{g.member_ids.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <span className="group-item__time">{formatTime(g.created_at)}</span>
                  </div>
                ))
              )
            ) : (
              displayedUsers.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--c-secondary)", textAlign: "center", padding: "1rem", fontFamily: "var(--font-mono)" }}>
                  No other users found.
                </p>
              ) : (
                displayedUsers.map((u) => (
                  <div
                    key={u.id}
                    className={`group-item${activeDMUser?.id === u.id ? " group-item--active" : ""}`}
                    onClick={() => selectDMUser(u)}
                    id={`user-item-${u.id}`}
                  >
                    <div className="group-avatar" style={{ backgroundColor: "var(--c-primary-ctr)", color: "var(--c-on-primary)" }}>
                      {getInitials(u.username)}
                    </div>
                    <div className="group-item__meta">
                      <div className="group-item__name">{u.username}</div>
                      <div className="group-item__preview" style={{ textTransform: "capitalize" }}>
                        {u.role} · {u.email}
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>

          <div className="sidebar-footer">
            <button className="sidebar-footer-link" onClick={onLogout} id="sidebar-btn-logout">
              <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>logout</span>
              Sign Out
            </button>
          </div>
        </aside>

        <main className="chat-main">
          <div className="chat-blob chat-blob--1" />
          <div className="chat-blob chat-blob--2" />

          {activeTab === "groups" && !activeGroup ? (
            <div className="no-group-selected">
              <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--c-outline-v)" }}>forum</span>
              <h2>Select a Group</h2>
              <p>Choose a group from the sidebar, or create a new one to start chatting.</p>
              <button
                className="chat-sidebar__new-btn"
                style={{ width: "auto", padding: "0.6rem 1.5rem" }}
                onClick={() => setShowCreateModal(true)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>add</span>
                Create Group
              </button>
            </div>
          ) : activeTab === "messages" && !activeDMUser ? (
            <div className="no-group-selected">
              <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--c-outline-v)" }}>chat</span>
              <h2>Direct Messages</h2>
              <p>Select a user from the sidebar to start a secure conversation.</p>
            </div>
          ) : (
            <>
              <header className="chat-header">
                <div className="chat-header__left">
                  {activeTab === "groups" ? (
                    <>
                      <div className="chat-header__avatar">{getInitials(activeGroup.name)}</div>
                      <div>
                        <div className="chat-header__name">{activeGroup.name}</div>
                        <div className="chat-header__status">
                          <span className="chat-header__dot" />
                          {activeGroup.member_ids.length} member{activeGroup.member_ids.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="chat-header__avatar" style={{ backgroundColor: "var(--c-primary-ctr)", color: "var(--c-on-primary)" }}>
                        {getInitials(activeDMUser.username)}
                      </div>
                      <div>
                        <div className="chat-header__name">{activeDMUser.username}</div>
                        <div className="chat-header__status">
                          <span className="chat-header__dot" style={{ backgroundColor: "var(--c-primary-ctr)" }} />
                          Direct Message ({activeDMUser.email})
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="chat-header__actions">
                  <button className="icon-btn icon-btn--bordered" title="Voice call (coming soon)" disabled style={{ opacity: 0.5 }}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                  </button>
                  <button className="icon-btn icon-btn--bordered" title="Video call (coming soon)" disabled style={{ opacity: 0.5 }}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                  </button>
                  <button
                    className={`icon-btn${showGroupInfo ? " icon-btn--active" : ""}`}
                    title={activeTab === "groups" ? "Group info" : "User Profile"}
                    onClick={() => setShowGroupInfo(!showGroupInfo)}
                    id="btn-toggle-info"
                  >
                    <span className="material-symbols-outlined" style={{ color: showGroupInfo ? "var(--c-primary)" : "inherit" }}>info</span>
                  </button>
                </div>
              </header>

              {loadingMsgs ? (
                <div className="chat-state">
                  <div className="chat-spinner" />
                  <span>Loading messages…</span>
                </div>
              ) : (
                <div className="chat-messages" id="chat-messages-container">
                  {messages.length === 0 ? (
                    <div className="chat-state" style={{ flex: "none", margin: "auto" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "2.5rem", color: "var(--c-outline-v)" }}>chat_bubble_outline</span>
                      <span>No messages yet. Say hello! 👋</span>
                    </div>
                  ) : (
                    Object.entries(groupedByDate).map(([date, msgs]) => (
                      <div key={date}>
                        <div className="date-divider">
                          <span>{date}</span>
                        </div>
                        {msgs.map((msg, i) => (
                          <MessageBubble
                            key={msg.id}
                            msg={msg}
                            currentUserId={currentUserId}
                            isFirstInGroup={i === 0 || msgs[i - 1]?.sender_id !== msg.sender_id}
                            usersMap={usersMap}
                          />
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              <div className="chat-input-area">
                <div className="chat-input-wrapper">
                  <button className="icon-btn" title="Attach file (coming soon)" disabled style={{ opacity: 0.5 }}>
                    <span className="material-symbols-outlined">add_circle</span>
                  </button>
                  <textarea
                    id="chat-message-input"
                    ref={textareaRef}
                    className="chat-textarea"
                    placeholder="Type a message…"
                    rows={1}
                    value={inputText}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", paddingBottom: "0.375rem", paddingRight: "0.375rem" }}>
                    <button
                      id="btn-send-message"
                      className="send-btn"
                      onClick={handleSend}
                      disabled={!inputText.trim() || sendingMsg}
                      title="Send message"
                    >
                      {sendingMsg
                        ? <div style={{ width: "1rem", height: "1rem", border: "2px solid rgba(0,53,74,0.3)", borderTopColor: "var(--c-on-primary)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        : <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                      }
                    </button>
                  </div>
                </div>
                <p className="chat-input-hint">Press Enter to send · Shift + Enter for new line</p>
              </div>
            </>
          )}
        </main>

        {showGroupInfo && ((activeTab === "groups" && activeGroup) || (activeTab === "messages" && activeDMUser)) && (
          <ChatDrawer
            activeGroup={activeTab === "groups" ? activeGroup : null}
            activeDMUser={activeTab === "messages" ? activeDMUser : null}
            currentUserId={currentUserId}
            usersMap={usersMap}
            users={users}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onClose={() => setShowGroupInfo(false)}
          />
        )}
      </div>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleGroupCreated}
        />
      )}
    </div>
  );
}
