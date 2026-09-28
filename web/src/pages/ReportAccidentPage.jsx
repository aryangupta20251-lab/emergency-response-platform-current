import { ArrowRight, ShieldAlert } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import ReportShell from '../components/ReportShell'
import { useAccidentReport } from '../context/AccidentReportContext'

export default function ReportAccidentPage() {
  const navigate = useNavigate()
  const { resetReport } = useAccidentReport()
  useEffect(() => { resetReport() }, [resetReport])
  const cancel = () => { resetReport(); navigate('/dashboard') }
  return <ReportShell onCancel={cancel}><Card className="report-hero-card"><div className="report-icon report-icon--emergency"><ShieldAlert size={28} /></div><div><h2>Are you safe enough to continue?</h2><p>If anyone is in immediate danger, call local emergency services directly. This button only opens a frontend demo report.</p></div></Card><Alert tone="warning" title="Demo mode only">No dispatch, responder, GPS, or emergency call will be started.</Alert><div className="report-actions"><Button variant="ghost" onClick={() => navigate('/dashboard')}>Back to dashboard</Button><Button variant="danger" size="large" onClick={() => navigate('/report-accident/location')}>Continue report <ArrowRight size={17} /></Button></div></ReportShell>
}