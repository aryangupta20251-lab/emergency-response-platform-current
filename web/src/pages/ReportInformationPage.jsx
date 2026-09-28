import { ArrowRight, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import ReportShell from '../components/ReportShell'
import { useAccidentReport } from '../context/AccidentReportContext'

const fields = [
  { name: 'accidentType', label: 'Accident type', options: ['Vehicle collision', 'Vehicle and pedestrian', 'Single vehicle accident', 'Other'] },
  { name: 'peopleInvolved', label: 'Number of people involved', options: ['1', '2', '3', '4 or more', 'Unknown'] },
  { name: 'injuries', label: 'Are there visible injuries?', options: ['Yes', 'No', 'Unknown'] },
  { name: 'vehicles', label: 'Vehicles involved', options: ['Car', 'Motorcycle', 'Truck or bus', 'Multiple vehicle types', 'Unknown'] }
]

export default function ReportInformationPage() {
  const navigate = useNavigate()
  const { report, updateReport, resetReport } = useAccidentReport()
  const [errors, setErrors] = useState({})
  const cancel = () => { resetReport(); navigate('/dashboard') }
  const update = (event) => updateReport({ [event.target.name]: event.target.value })
  const submit = (event) => {
    event.preventDefault()
    const nextErrors = Object.fromEntries(fields.filter(({ name }) => !report[name]).map(({ name }) => [name, 'Please select an option.']))
    setErrors(nextErrors)
    if (!Object.keys(nextErrors).length) navigate('/report-accident/review')
  }
  useEffect(() => {
    if (!report.location) navigate('/report-accident/location', { replace: true })
  }, [navigate, report.location])
  return <ReportShell activeStep={2} onCancel={cancel}><Card className="report-card"><div className="card-heading"><div><span className="muted-label">Step 3 of 4</span><h2 className="report-card-title">Tell us what happened</h2></div><FileText color="var(--color-primary)" size={22} /></div><p className="report-copy">Choose the details that best describe the situation. You can review everything before submitting.</p><form className="report-form" onSubmit={submit}><div className="report-form-grid">{fields.map(({ name, label, options }) => <label className="field" key={name}><span>{label}</span><select name={name} value={report[name]} onChange={update} aria-invalid={Boolean(errors[name])}><option value="">Select an option</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{errors[name] && <small className="field__error">{errors[name]}</small>}</label>)}</div><label className="field"><span>Description <small>(optional)</small></span><textarea name="description" value={report.description} onChange={update} placeholder="Add anything useful you observed..." rows="4" maxLength="500" /></label><div className="upload-placeholder"><FileText size={20} /><span><strong>Photo or document</strong><small>Optional upload placeholder · file handling comes later</small></span></div><Alert tone="info" title="Share only what you know">Do not include medical diagnoses or sensitive details in this demo form.</Alert><div className="report-actions"><Button variant="ghost" type="button" onClick={() => navigate('/report-accident/location')}>Back</Button><Button type="submit">Review report <ArrowRight size={17} /></Button></div></form></Card></ReportShell>
}