export default function Button({ className, children, onClick, disabled, type = "button", ...rest }) {
  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      type={type}
      {...rest}
    >
      {children}
    </button>
  );
}
