export default function FeedbackBanner({ msg, type }) {
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
