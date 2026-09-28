import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'

const icons = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle }

export default function Alert({ tone = 'info', title, children }) {
  const Icon = icons[tone]
  return <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite"><Icon size={18} aria-hidden="true" /><div><strong>{title}</strong>{children && <p>{children}</p>}</div></div>
}
