import { useState } from "react";
import Button from "./Button";

export default function InputField({ id, label, icon, type = "text", placeholder, value, onChange, showToggle, autoComplete }) {
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
          <Button
            type="button"
            className="auth-field__toggle"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            <span className="material-symbols-outlined">
              {visible ? "visibility_off" : "visibility"}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
