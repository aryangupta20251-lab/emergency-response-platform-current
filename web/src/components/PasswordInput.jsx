import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function PasswordInput({ label, error, ...props }) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye
  const inputId = props.id || props.name
  const messageId = error && inputId ? `${inputId}-error` : undefined
  return <label className="field" htmlFor={inputId}><span>{label}</span><span className="password-field"><input id={inputId} type={visible ? 'text' : 'password'} aria-invalid={Boolean(error)} aria-describedby={messageId} {...props} /><button type="button" className="password-toggle" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}><Icon size={17} aria-hidden="true" /></button></span>{error && <small id={messageId} className="field__error">{error}</small>}</label>
}