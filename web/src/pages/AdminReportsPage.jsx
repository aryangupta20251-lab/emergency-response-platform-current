import { FileOutput } from 'lucide-react'
import Alert from '../components/Alert'
import Card from '../components/Card'

export default function AdminReportsPage() {
  return (
    <div className="page-content admin-page reports-page">
      <div className="page-header"><div><span className="eyebrow"><FileOutput size={14} /> Admin reports</span><h1 className="page-title">Reporting tools</h1><p className="page-subtitle">Backend report generation is not available yet.</p></div></div>
      <Alert tone="info" title="No report export API">This screen no longer presents a simulated “generated” result. Report export requires a real backend implementation.</Alert>
      <Card className="report-support-note"><FileOutput size={19} /><span><strong>Available now</strong><small>Use the incident management view and backend statistics for current platform records. No file is generated or exported.</small></span></Card>
    </div>
  )
}
