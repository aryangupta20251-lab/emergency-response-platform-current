import { CloudOff } from 'lucide-react'

export default function OfflineNotice({ children = 'Live services are unavailable. Demo data remains available for this screen.' }) {
  return <div className="offline-notice" role="status"><CloudOff size={17} aria-hidden="true" /><span>{children}</span></div>
}