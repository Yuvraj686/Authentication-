import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./chat.css";

import { decodeJWT, getInitials, formatTime, formatDate } from "./utils";

import { apiFetch } from "./api/client";
import { fetchGroups, addGroupMember, removeGroupMember } from "./api/groups";
import { fetchMessages, sendGroupMessage, fetchDMMessages, sendDM } from "./api/messages";
import { fetchAllUsers } from "./api/users";

import useWebSocket from "./hooks/useWebSocket";

import Button from "./components/Button";
import Header from "./components/Header";
import CreateGroupModal from "./components/CreateGroupModal";
import MessageBubble from "./components/MessageBubble";
import ChatDrawer from "./components/ChatDrawer";

export default function GroupChatPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
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

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const activeGroupRef = useRef(activeGroup);
  const activeDMUserRef = useRef(activeDMUser);
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeGroupRef.current = activeGroup; }, [activeGroup]);
  useEffect(() => { activeDMUserRef.current = activeDMUser; }, [activeDMUser]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  const handleGroupMessage = useCallback((msg) => {
    const tab = activeTabRef.current;
    const group = activeGroupRef.current;
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
  }, []);

  const handleDMMessage = useCallback((msg) => {
    const tab = activeTabRef.current;
    const dmUser = activeDMUserRef.current;
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
  }, []);

  const { wsStatus } = useWebSocket({
    onGroupMessage: handleGroupMessage,
    onDMMessage: handleDMMessage,
  });

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "messages") setActiveGroup(null);
    if (tab === "groups") setActiveDMUser(null);
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

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="chat-page">
      <Header
        activeTab={activeTab}
        wsStatus={wsStatus}
        currentUserInitials={getInitials(usersMap[currentUserId] || "Me")}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />

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
            <Button
              id="btn-create-group"
              className="chat-sidebar__new-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>add</span>
              New Group
            </Button>
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
            <Button className="sidebar-footer-link" onClick={onLogout} id="sidebar-btn-logout">
              <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>logout</span>
              Sign Out
            </Button>
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
              <Button
                className="chat-sidebar__new-btn"
                style={{ width: "auto", padding: "0.6rem 1.5rem" }}
                onClick={() => setShowCreateModal(true)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>add</span>
                Create Group
              </Button>
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
                  <Button className="icon-btn icon-btn--bordered" title="Voice call (coming soon)" disabled style={{ opacity: 0.5 }}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                  </Button>
                  <Button className="icon-btn icon-btn--bordered" title="Video call (coming soon)" disabled style={{ opacity: 0.5 }}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                  </Button>
                  <Button
                    className={`icon-btn${showGroupInfo ? " icon-btn--active" : ""}`}
                    title={activeTab === "groups" ? "Group info" : "User Profile"}
                    onClick={() => setShowGroupInfo(!showGroupInfo)}
                    id="btn-toggle-info"
                  >
                    <span className="material-symbols-outlined" style={{ color: showGroupInfo ? "var(--c-primary)" : "inherit" }}>info</span>
                  </Button>
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
                  <Button className="icon-btn" title="Attach file (coming soon)" disabled style={{ opacity: 0.5 }}>
                    <span className="material-symbols-outlined">add_circle</span>
                  </Button>
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
                    <Button
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
                    </Button>
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
