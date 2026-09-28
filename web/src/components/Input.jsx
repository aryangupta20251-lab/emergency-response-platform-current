export default function Input({ label, error, help, id, name, ...props }) {
  const inputId = id || name
  const messageId = error && inputId ? `${inputId}-error` : undefined
  return <label className="field" htmlFor={inputId}><span>{label}</span><input id={inputId} name={name} aria-invalid={Boolean(error)} aria-describedby={messageId} {...props} />{error && <small id={messageId} className="field__error">{error}</small>}{help && !error && <small className="field__help">{help}</small>}</label>
}
