import { ArrowRight, CheckCircle2, Edit3, FileCheck2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import ReportShell from '../components/ReportShell'
import { useAccidentReport } from '../context/AccidentReportContext'

export default function ReportReviewPage() {
  const navigate = useNavigate()
  const { report, submitReport } = useAccidentReport()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!report.location) navigate('/report-accident/location', { replace: true })
    else if (!report.accidentType || !report.peopleInvolved || !report.injuries || !report.vehicles) navigate('/report-accident/information', { replace: true })
  }, [navigate, report.accidentType, report.injuries, report.location, report.peopleInvolved, report.vehicles])
  const cancel = () => navigate('/dashboard')
  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      await submitReport()
      setSubmitted(true)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return <ReportShell activeStep={3} onCancel={cancel}><Card className="report-success"><div className="report-success__icon"><CheckCircle2 size={34} /></div><h2>Report submitted</h2><p>Your incident report has been received by the platform.</p><Alert tone="info" title="Incident reference">{report.submittedReport.id}</Alert><Alert tone="warning" title="No external dispatch">This confirmation is from the platform only. It does not mean official emergency services were contacted or a responder was dispatched.</Alert><p className="report-success__note">Your report is now available in incident history and can be reviewed from the dashboard.</p><div className="report-actions"><Button variant="ghost" onClick={() => navigate('/dashboard')}>Return to dashboard</Button><Button size="large" onClick={() => navigate(`/incidents/${report.submittedReport.id}`)}>View incident</Button></div></Card></ReportShell>
  }

  return <ReportShell activeStep={3} onCancel={cancel}><Card className="report-card"><div className="card-heading"><div><span className="muted-label">Step 4 of 4</span><h2 className="report-card-title">Review your report</h2></div><FileCheck2 color="var(--color-primary)" size={22} /></div><p className="report-copy">Check the information below before sending it to the platform.</p>{error && <Alert tone="error" title="Could not submit report">{error}</Alert>}<div className="review-list"><ReviewRow label="Location" value={report.location?.name} editTo="/report-accident/location" onEdit={() => navigate('/report-accident/location')} /><ReviewRow label="Accident type" value={report.accidentType} editTo="/report-accident/information" onEdit={() => navigate('/report-accident/information')} /><ReviewRow label="People involved" value={report.peopleInvolved} onEdit={() => navigate('/report-accident/information')} /><ReviewRow label="Visible injuries" value={report.injuries} onEdit={() => navigate('/report-accident/information')} /><ReviewRow label="Vehicles" value={report.vehicles} onEdit={() => navigate('/report-accident/information')} /><ReviewRow label="Description" value={report.description || 'Not provided'} onEdit={() => navigate('/report-accident/information')} /></div><Alert tone="info" title="Submission status">A confirmed response from the platform is required before this report is considered submitted.</Alert><div className="report-actions"><Button variant="ghost" onClick={() => navigate('/report-accident/information')}>Back</Button><Button variant="danger" loading={loading} onClick={submit}>Submit report <ArrowRight size={17} /></Button></div></Card></ReportShell>
}

function ReviewRow({ label, value, onEdit }) { return <div className="review-row"><div><small>{label}</small><strong>{value || 'Not provided'}</strong></div><button type="button" className="review-edit" onClick={onEdit} aria-label={`Edit ${label}`}><Edit3 size={15} /></button></div> }