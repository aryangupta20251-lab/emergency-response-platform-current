import { LoaderCircle } from 'lucide-react'

export default function Button({ children, variant = 'primary', size = 'medium', type = 'button', loading = false, disabled = false, ...props }) {
  return <button type={type} className={`btn btn--${variant} btn--${size}`} disabled={disabled || loading} aria-busy={loading} {...props}>{loading && <LoaderCircle className="spin" size={16} aria-hidden="true" />} {loading ? 'Please wait...' : children}</button>
}
