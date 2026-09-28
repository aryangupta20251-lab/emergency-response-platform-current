import { ArrowLeft, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from './Card'
import ProgressSteps from './ProgressSteps'

const steps = ['Confirm', 'Location', 'Information', 'Review']

export default function ReportShell({ children, activeStep = 0, onCancel }) {
  return <div className="page-content report-page"><div className="report-header"><Link className="report-back" to="/dashboard"><ArrowLeft size={16} /> Dashboard</Link><button className="report-cancel" type="button" onClick={onCancel}><X size={16} /> Cancel report</button></div><div className="report-intro"><span className="eyebrow">Accident report · Demo flow</span><h1 className="page-title">Report a road accident</h1><p className="page-subtitle">Provide only what you know. This mock flow does not contact emergency services.</p></div><Card className="report-progress"><ProgressSteps steps={steps} active={activeStep} /></Card>{children}</div>
}