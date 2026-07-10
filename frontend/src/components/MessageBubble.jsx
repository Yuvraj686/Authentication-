import { getInitials, formatTime } from "../utils";

export default function MessageBubble({ msg, currentUserId, isFirstInGroup, usersMap }) {
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
