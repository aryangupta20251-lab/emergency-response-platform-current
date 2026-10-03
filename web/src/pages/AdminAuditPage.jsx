import { ClipboardCheck } from 'lucide-react'
import Alert from '../components/Alert'
import Card from '../components/Card'

export default function AdminAuditPage() {
  return (
    <div className="page-content admin-page audit-page">
      <div className="page-header"><div><span className="eyebrow"><ClipboardCheck size={14} /> Admin audit</span><h1 className="page-title">Audit log</h1><p className="page-subtitle">Backend audit-event recording is not available yet.</p></div></div>
      <Alert tone="info" title="No audit events are recorded">This page does not show sample activity as though it came from the database. A persistent audit event API and storage model are not implemented.</Alert>
      <Card className="notification-empty"><ClipboardCheck size={25} /><h2>Audit logging unavailable</h2><p>Administrative changes are not currently recorded in a dedicated audit log.</p></Card>
    </div>
  )
}
