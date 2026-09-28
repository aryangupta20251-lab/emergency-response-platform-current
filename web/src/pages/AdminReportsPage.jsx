import { BarChart3, CheckCircle2, FileOutput, FileText } from 'lucide-react'
import { useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import { reportCards } from '../data/adminAnalyticsData'

const icons = { incident: BarChart3, responder: FileText, system: FileOutput }

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(false); const [generated, setGenerated] = useState('')
  const generate = (title) => { setGenerated(''); setLoading(true); window.setTimeout(() => { setLoading(false); setGenerated(`${title} demo report is ready for review.`) }, 500) }
  return <div className="page-content admin-page reports-page"><div className="page-header"><div><span className="eyebrow"><FileOutput size={14} /> Admin reports</span><h1 className="page-title">Reporting tools</h1><p className="page-subtitle">Prepare supporting views from the demo analytics workspace.</p></div></div><Alert tone="info" title="Demo reporting only">Report generation creates a local preview message. No files are exported and no production data is queried.</Alert>{generated && <Alert tone="success" title="Report prepared">{generated}</Alert>}<div className="report-card-grid">{reportCards.map((report) => { const Icon = icons[report.icon] || FileText; return <Card className="admin-report-card" key={report.id}><span className="admin-report-icon"><Icon size={22} /></span><h2>{report.title}</h2><p>{report.detail}</p><Button variant="secondary" loading={loading} onClick={() => generate(report.title)}>Generate demo view</Button></Card> })}</div><Card className="report-support-note"><CheckCircle2 size={19} /><span><strong>Supporting view status</strong><small>Analytics, audit entries, and management summaries are available in this frontend demo.</small></span></Card></div>
}